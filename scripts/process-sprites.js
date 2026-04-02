/**
 * 스프라이트 후처리 스크립트
 * - image/raw/ 에 있는 PNG를 읽어서
 * - 흰색 배경 → 투명 처리
 * - trim → adult 기준 스케일링 (종 내 상대 크기 보존)
 * - 128x128 중앙 배치
 * - image/processed/ 에 저장
 *
 * 사용법:
 *   node scripts/process-sprites.js              # raw/ 전체 처리
 *   node scripts/process-sprites.js gallimimus   # 특정 종만
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const RAW_DIR = path.resolve(__dirname, '..', 'image', 'raw');
const OUT_DIR = path.resolve(__dirname, '..', 'image', 'processed');
const SIZE = 128;
const WHITE_THRESHOLD = 240;
const PAD = 4; // 최소 여백

async function removeWhiteBG(inputPath) {
  const image = sharp(inputPath);
  const meta = await image.metadata();

  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  let transparentCount = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
      pixels[i + 3] = 0;
      transparentCount++;
    }
  }

  const totalPixels = info.width * info.height;
  return {
    buffer: pixels,
    width: info.width,
    height: info.height,
    channels: info.channels,
    transparentPct: ((transparentCount / totalPixels) * 100).toFixed(1),
    originalSize: { w: meta.width, h: meta.height },
  };
}

async function trimImage(rawResult) {
  const { data, info } = await sharp(rawResult.buffer, {
    raw: { width: rawResult.width, height: rawResult.height, channels: rawResult.channels },
  })
    .png()
    .trim()
    .toBuffer({ resolveWithObject: true });

  return { data, width: info.width, height: info.height };
}

async function renderToCanvas(trimData, maxDim) {
  const canvasInner = SIZE - PAD * 2;
  const scale = canvasInner / maxDim;
  const targetW = Math.max(1, Math.round(trimData.width * scale));
  const targetH = Math.max(1, Math.round(trimData.height * scale));

  const padTop = Math.round((SIZE - targetH) / 2);
  const padLeft = Math.round((SIZE - targetW) / 2);

  return sharp(trimData.data)
    .resize(targetW, targetH, { fit: 'fill' })
    .extend({
      top: padTop,
      bottom: SIZE - targetH - padTop,
      left: padLeft,
      right: SIZE - targetW - padLeft,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`[ERROR] ${RAW_DIR} 디렉토리가 없습니다.`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const filter = process.argv[2];
  let files = fs.readdirSync(RAW_DIR).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
  if (filter) files = files.filter((f) => f.includes(filter));

  // 종별로 그룹핑 (species_stage.png → species 기준)
  const speciesMap = new Map(); // species → { baby, teen, adult }
  const standalone = []; // 매칭 안되는 파일

  for (const f of files) {
    const m = f.match(/^(.+)_(baby|teen|adult)\.(png|jpg|jpeg|webp)$/i);
    if (m) {
      const species = m[1];
      const stage = m[2].toLowerCase();
      if (!speciesMap.has(species)) speciesMap.set(species, {});
      speciesMap.get(species)[stage] = f;
    } else {
      standalone.push(f);
    }
  }

  let totalOk = 0, totalFail = 0;

  // 종별 일괄 처리 (adult 기준 스케일링)
  for (const [species, stageFiles] of speciesMap) {
    console.log(`\n🦕 ${species} 처리 중...`);

    // 1단계: 모든 스테이지 배경 제거 + trim
    const trimResults = {};
    for (const stage of ['baby', 'teen', 'adult']) {
      const filename = stageFiles[stage];
      if (!filename) continue;

      const inputPath = path.join(RAW_DIR, filename);
      try {
        const raw = await removeWhiteBG(inputPath);
        const trim = await trimImage(raw);
        trimResults[stage] = { filename, trim, raw };
      } catch (err) {
        console.log(`  ❌ ${filename} — ${err.message}`);
        totalFail++;
      }
    }

    // 2단계: adult의 최대 dimension을 기준으로 잡기
    const adultTrim = trimResults.adult?.trim;
    let maxDim;

    if (adultTrim) {
      maxDim = Math.max(adultTrim.width, adultTrim.height);
    } else {
      // adult 없으면 전체 중 최대값
      maxDim = Math.max(...Object.values(trimResults).map((r) =>
        Math.max(r.trim.width, r.trim.height)
      ));
    }

    console.log(`  기준 크기: ${maxDim}px (adult)`);

    // 3단계: 동일 스케일로 128x128 렌더링
    for (const stage of ['baby', 'teen', 'adult']) {
      const r = trimResults[stage];
      if (!r) continue;

      const outputPath = path.join(OUT_DIR, r.filename);
      try {
        const buf = await renderToCanvas(r.trim, maxDim);
        fs.writeFileSync(outputPath, buf);

        const outMeta = await sharp(outputPath).metadata();
        const outSize = fs.statSync(outputPath).size;
        const charW = Math.round(r.trim.width * (SIZE - PAD * 2) / maxDim);
        const charH = Math.round(r.trim.height * (SIZE - PAD * 2) / maxDim);
        console.log(`  ✅ ${r.filename} — trim ${r.trim.width}x${r.trim.height} → 캐릭터 ${charW}x${charH}px, ${outMeta.width}x${outMeta.height}, ${(outSize / 1024).toFixed(1)}KB`);
        totalOk++;
      } catch (err) {
        console.log(`  ❌ ${r.filename} — ${err.message}`);
        totalFail++;
      }
    }
  }

  // 독립 파일 처리 (종_스테이지 패턴이 아닌 파일)
  for (const filename of standalone) {
    const inputPath = path.join(RAW_DIR, filename);
    const outputPath = path.join(OUT_DIR, filename);
    try {
      const raw = await removeWhiteBG(inputPath);
      const trim = await trimImage(raw);
      const maxDim = Math.max(trim.width, trim.height);
      const buf = await renderToCanvas(trim, maxDim);
      fs.writeFileSync(outputPath, buf);
      console.log(`  ✅ ${filename} — 단독 처리`);
      totalOk++;
    } catch (err) {
      console.log(`  ❌ ${filename} — ${err.message}`);
      totalFail++;
    }
  }

  console.log(`\n[결과] ✅ 성공 ${totalOk} / ❌ 실패 ${totalFail}`);
  console.log(`처리된 파일: ${OUT_DIR}`);
}

main().catch(console.error);
