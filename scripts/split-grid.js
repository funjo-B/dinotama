/**
 * 그리드 이미지 분리 스크립트 v2
 * 캐릭터 덩어리를 자동 감지하여 분리합니다.
 *
 * 방식: 각 열(column)의 어두운 픽셀 밀도를 분석해서
 *       캐릭터가 있는 영역 3개를 찾고 각각 잘라냅니다.
 *
 * 사용법:
 *   node scripts/split-grid.js <이미지> <종이름>
 *   node scripts/split-grid.js image/raw/파일.png gallimimus
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const STAGES = ['baby', 'teen', 'adult'];
const RAW_DIR = path.resolve(__dirname, '..', 'image', 'raw');

async function findCharacterRegions(inputPath) {
  const meta = await sharp(inputPath).metadata();
  const imgW = meta.width;
  const imgH = meta.height;

  // 그레이스케일로 변환
  const { data } = await sharp(inputPath)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 각 열의 어두운 픽셀 수 계산 (텍스트 + 캐릭터)
  const colDensity = new Float32Array(imgW);
  for (let x = 0; x < imgW; x++) {
    let dark = 0;
    for (let y = 0; y < imgH; y++) {
      if (data[y * imgW + x] < 200) dark++;
    }
    colDensity[x] = dark / imgH;
  }

  // 스무딩 (노이즈 제거, 윈도우 15px)
  const smooth = new Float32Array(imgW);
  const W = 15;
  for (let x = 0; x < imgW; x++) {
    let sum = 0, cnt = 0;
    for (let dx = -W; dx <= W; dx++) {
      const xx = x + dx;
      if (xx >= 0 && xx < imgW) { sum += colDensity[xx]; cnt++; }
    }
    smooth[x] = sum / cnt;
  }

  // 임계값: "콘텐츠가 있다"고 판단하는 최소 밀도
  const THRESHOLD = 0.01;

  // 콘텐츠 영역(덩어리) 찾기
  const regions = [];
  let inRegion = false;
  let start = 0;

  for (let x = 0; x < imgW; x++) {
    if (smooth[x] > THRESHOLD) {
      if (!inRegion) { start = x; inRegion = true; }
    } else {
      if (inRegion) {
        regions.push({ start, end: x });
        inRegion = false;
      }
    }
  }
  if (inRegion) regions.push({ start, end: imgW });

  // 텍스트 라벨(좁은 영역)과 캐릭터(넓은 영역) 분리
  // 라벨: 보통 전체 너비의 8% 이하
  const labelMaxW = imgW * 0.08;
  const characters = [];
  let labelEnd = 0;

  for (const r of regions) {
    const w = r.end - r.start;
    if (w < labelMaxW && r.start < imgW * 0.15) {
      // 라벨 영역
      labelEnd = Math.max(labelEnd, r.end);
    } else {
      characters.push(r);
    }
  }

  return { imgW, imgH, labelEnd, characters };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('사용법: node scripts/split-grid.js <이미지> <종이름>');
    console.log('예시:   node scripts/split-grid.js image/raw/파일.png gallimimus');
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const species = args[1];

  if (!fs.existsSync(inputPath)) {
    console.error(`[ERROR] 파일 없음: ${inputPath}`);
    process.exit(1);
  }

  const { imgW, imgH, labelEnd, characters } = await findCharacterRegions(inputPath);

  console.log(`[split-grid] ${path.basename(inputPath)}`);
  console.log(`  이미지: ${imgW}x${imgH}`);
  console.log(`  라벨 영역: 0~${labelEnd}px`);
  console.log(`  캐릭터 감지: ${characters.length}개`);
  characters.forEach((c, i) => console.log(`    [${i}] x: ${c.start}~${c.end} (${c.end - c.start}px)`));

  if (characters.length < 3) {
    // 캐릭터가 붙어서 하나로 감지된 경우 → 라벨 제외 후 3등분
    console.log('\n  ⚠️  3개 미만 감지 → 라벨 제외 후 균등 3분할로 대체');
    const contentStart = labelEnd + 20; // 라벨 뒤 여백
    const contentW = imgW - contentStart;
    const cellW = Math.floor(contentW / 3);

    for (let i = 0; i < 3; i++) {
      const stage = STAGES[i];
      const left = contentStart + (i * cellW);
      const outName = `${species}_${stage}.png`;
      const outPath = path.join(RAW_DIR, outName);

      await sharp(inputPath)
        .extract({ left, top: 0, width: cellW, height: imgH })
        .toFile(outPath);
      console.log(`  ✅ ${outName} (x:${left}~${left + cellW})`);
    }
  } else {
    // 감지된 캐릭터 영역별로 자르기 (여유 패딩 포함)
    const padding = 10;
    for (let i = 0; i < 3; i++) {
      const stage = STAGES[i];
      const c = characters[i];

      // 캐릭터 사이의 빈 공간 중앙을 경계로 사용
      let left, right;
      if (i === 0) {
        left = Math.max(0, labelEnd);  // 라벨 직후부터
        right = i + 1 < characters.length
          ? Math.floor((c.end + characters[i + 1].start) / 2)
          : c.end + padding;
      } else if (i === characters.length - 1 || i === 2) {
        left = Math.floor((characters[i - 1].end + c.start) / 2);
        right = Math.min(imgW, c.end + padding);
      } else {
        left = Math.floor((characters[i - 1].end + c.start) / 2);
        right = Math.floor((c.end + characters[i + 1].start) / 2);
      }

      const width = right - left;
      const outName = `${species}_${stage}.png`;
      const outPath = path.join(RAW_DIR, outName);

      await sharp(inputPath)
        .extract({ left, top: 0, width, height: imgH })
        .toFile(outPath);
      console.log(`  ✅ ${outName} (x:${left}~${right}, ${width}px)`);
    }
  }

  console.log(`\n[완료] → ${RAW_DIR}`);
  console.log(`다음: node scripts/process-sprites.js ${species}`);
}

main().catch(console.error);
