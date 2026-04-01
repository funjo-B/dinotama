# DinoTama 스프라이트 제작 가이드

## 1. 감정(Emotion) 기준

공룡은 총 6가지 감정 상태를 가집니다.

| 감정 | 키 | 트리거 | 설명 |
|------|-----|--------|------|
| 기본 | `idle` | 기본 상태 / 다른 감정 종료 후 복귀 | 평온하게 서 있는 모습 |
| 행복 | `happy` | 🍖 먹이기 (4초) / 🤗 쓰다듬기 (3초) | 기쁜 표정, 꼬리 흔들기 등 |
| 신남 | `excited` | 🎮 놀아주기 (5초) | 점프, 날갯짓 등 역동적인 모습 |
| 졸림 | `sleepy` | 😴 재우기 (5초) | 눈 반쯤 감기, 축 처진 모습 |
| 슬픔 | `sad` | 행복 수치 낮을 때 자동 | 고개 숙이거나 풀죽은 모습 |
| 배고픔 | `hungry` | 배고픔 수치 낮을 때 자동 | 입 벌리거나 배를 잡는 모습 |

### 감정 우선순위 (자동 전환 시)
```
hungry (100) > sleepy (90) > sad (80) > excited (60) > happy (50) > idle
```

---

## 2. 스프라이트 파일 네이밍 규칙

```
public/assets/sprites/{stage}/{species}/sprite_{stage}_{emotion}_{frame}.png
```

### 단계(stage)
| 키 | 설명 |
|----|------|
| `baby` | 유년기 |
| `teen` | 성장기 |
| `adult` | 성체 |

### 프레임 번호
- 단일 프레임: `_01` (예: `sprite_baby_idle_01.png`)
- 멀티 프레임: `_01`, `_02`, `_03` ... (애니메이션용)

### 예시 — 투푸수아라 유년기
```
baby/tupuxuara/
  sprite_baby_idle_01.png      ← 기본 포즈 (단일)
  sprite_baby_happy_01.png     ← 행복 (단일)
  sprite_baby_sad_01.png       ← 슬픔 (단일)
  sprite_baby_hungry_01.png    ← 배고픔 (단일)
  sprite_baby_sleepy_01.png    ← 졸림 (단일)
  sprite_baby_excited_01.png   ← 신남 프레임1 (멀티)
  sprite_baby_excited_02.png   ← 신남 프레임2
  sprite_baby_excited_03.png   ← 신남 프레임3
```

---

## 3. 이미지 소스 준비 규칙

### 단일 포즈 이미지 (idle/happy/sad 등)
- **크기**: `512×512` 이상 정사각형 권장
- **공룡 위치**: 중앙, 여백 최소화
- **배경**: 단색 (검정/회색/흰색) 또는 투명 PNG

### 멀티 프레임 시트 (애니메이션)
- **프레임당 크기**: `512×512` 정사각형
- **배치**: 프레임을 가로로 나열 (왼→오 순서)
- **최종 이미지 크기**:

| 프레임 수 | 권장 크기 |
|----------|----------|
| 2프레임 | `1024 × 512` |
| 3프레임 | `1536 × 512` |
| 4프레임 | `2048 × 512` |

> ⚠️ 세로로 긴 직사각형 프레임은 리사이즈 시 납작해 보일 수 있어 비추천

---

## 4. 배경 제거 & 스프라이트 변환 워크플로우

### 사전 준비 (최초 1회)
```bash
pip install rembg pillow onnxruntime
```

### 단일 이미지 처리
```python
from PIL import Image
from rembg import remove

src = 'image/공룡이름_단계.png'
out = 'public/assets/sprites/baby/species/sprite_baby_idle_01.png'
TARGET = 256
PADDING = 10

img = Image.open(src)
removed = remove(img)

# 공룡 영역만 타이트 크롭
bbox = removed.getbbox()
cropped = removed.crop(bbox) if bbox else removed

# 비율 유지 리사이즈 → 256×256 중앙 배치
inner = TARGET - PADDING * 2
cropped.thumbnail((inner, inner), Image.LANCZOS)
fw, fh = cropped.size

canvas = Image.new('RGBA', (TARGET, TARGET), (0, 0, 0, 0))
canvas.paste(cropped, ((TARGET - fw) // 2, (TARGET - fh) // 2), cropped)
canvas.save(out)
```

### 멀티 프레임 시트 처리
```python
from PIL import Image
from rembg import remove
import os

src = 'image/공룡이름_이모션.png'  # 프레임이 가로로 나열된 이미지
out_dir = 'public/assets/sprites/baby/species'
FRAME_COUNT = 3
TARGET = 256
PADDING = 10

img = Image.open(src)
w, h = img.size
frame_w = w // FRAME_COUNT

for i in range(FRAME_COUNT):
    frame = img.crop((i * frame_w, 0, (i + 1) * frame_w, h))
    removed = remove(frame)

    bbox = removed.getbbox()
    cropped = removed.crop(bbox) if bbox else removed

    inner = TARGET - PADDING * 2
    cropped.thumbnail((inner, inner), Image.LANCZOS)
    fw, fh = cropped.size

    canvas = Image.new('RGBA', (TARGET, TARGET), (0, 0, 0, 0))
    canvas.paste(cropped, ((TARGET - fw) // 2, (TARGET - fh) // 2), cropped)
    canvas.save(os.path.join(out_dir, f'sprite_baby_excited_0{i+1}.png'))
```

---

## 5. 코드 등록 방법

### 실제 아트 스프라이트 종으로 등록
`src/shared/constants/species.ts`에서 `REAL_SPRITE_SPECIES`에 추가:
```ts
export const REAL_SPRITE_SPECIES = new Set<DinoSpeciesId>([
  'tyrannosaurus',
  'tupuxuara',
  // 새 종 추가 시 여기에
]);
```
> `REAL_SPRITE_SPECIES`에 포함되면 `imageRendering: 'auto'` (스무스 렌더링)
> 미포함 시 `imageRendering: 'pixelated'` (도트 느낌)

### 멀티 프레임 애니메이션 등록
`src/shared/constants/species.ts`에서 `SPRITE_FRAME_COUNTS`에 추가:
```ts
export const SPRITE_FRAME_COUNTS: Record<string, number> = {
  'tupuxuara_excited': 3,
  // '종이름_감정': 프레임수
};
```
> 등록하면 DinoCanvas가 200ms 간격으로 프레임을 자동 순환

---

## 6. 작업 체크리스트

새 종의 스프라이트를 추가할 때:

- [ ] `image/` 폴더에 원본 이미지 배치
- [ ] Python 스크립트로 배경 제거 + 리사이즈 처리
- [ ] `public/assets/sprites/{stage}/{species}/` 에 저장
- [ ] `REAL_SPRITE_SPECIES`에 종 ID 추가
- [ ] 멀티프레임이면 `SPRITE_FRAME_COUNTS`에 등록
- [ ] 앱 재시작 후 확인
