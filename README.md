# DinoTama

> Windows/macOS 모니터 구석에 항상 떠있는 공룡 다마고치 데스크탑 앱

## Features

- **공룡 육성** — 알(egg) > 아기(baby) > 청소년(teen) > 성체(adult) 4단계 성장
- **스탯 관리** — 배고픔 / 행복도 / 피로도 실시간 변화
- **감정 시스템** — idle, happy, sad, hungry, sleepy, excited 6종 감정 + 스프라이트 애니메이션
- **가챠** — Common 60% / Rare 25% / Epic 12% / Legend 3% (천장제: Epic 50회, Legend 100회)
- **Google Calendar 연동** — 일정 5분 전 공룡이 알림
- **클라우드 동기화** — Firebase Firestore 자동 저장 (30분 주기 + 이벤트 즉시)
- **고급알 결제** — Stripe Checkout (1/5/11개 패키지)
- **데스크탑 상주** — 투명 창, always-on-top, 시스템 트레이, 드래그 이동

## Tech Stack

| 영역 | 기술 |
|------|------|
| Framework | Electron 28+ |
| UI | React 18 + Framer Motion |
| State | Zustand |
| Cloud Sync | Firebase Firestore |
| Auth | Google OAuth (Firebase Auth) |
| Payment | Stripe Checkout |
| Calendar | Google Calendar API |
| Animation | Sprite sheets (72x72px) + Rive |
| Build | electron-builder (NSIS / DMG) |

## Getting Started

### 설치

```bash
npm install
```

### 개발 모드 (Electron)

```bash
npm run dev
```

### 웹 브라우저에서 UI만 테스트

```bash
npm run dev:web
```

### 프로덕션 빌드

```bash
npm run build            # 렌더러 + 메인 빌드
npm run build:win        # Windows 설치파일 (.exe)
npm run build:mac        # macOS 설치파일 (.dmg)
```

### 빌드된 앱 실행

```bash
npm run start
```

## Project Structure

```
src/
├── main/                # Electron 메인 프로세스
│   ├── index.ts         # 앱 진입점
│   ├── window.ts        # 투명 창 생성 + IPC
│   ├── tray.ts          # 시스템 트레이
│   ├── preload.ts       # IPC 브릿지
│   ├── deeplink.ts      # dinotama:// 딥링크
│   └── calendar.ts      # Google Calendar API
├── renderer/            # React 렌더러
│   ├── components/      # DinoCanvas, StatsOverlay, GachaResult 등
│   ├── hooks/           # useDrag, useGameLoop, useContextMenu 등
│   ├── stores/          # Zustand (dinoStore, growthFSM, emotionEngine)
│   └── services/        # Firebase, Stripe
├── shared/              # 메인/렌더러 공유
│   ├── types/           # TypeScript 타입 정의
│   └── constants/       # 가챠 확률, 상수
public/
└── assets/
    └── sprites/         # egg/baby/teen/adult 스프라이트
```

## Sprite Convention

```
sprite_<stage>_<emotion>_<frame>.png   (72x72px)
```

- **Stage**: `egg`, `baby`, `teen`, `adult`
- **Emotion**: `idle`, `happy`, `sad`, `hungry`, `sleepy`, `excited`
- **Rarity**: `common`, `rare`, `epic`, `legend`

## Progress

- [x] Sprint 1 — 프로젝트 초기 설정
- [x] Sprint 2 — Electron 메인 프로세스 (투명 창, 트레이, 드래그, IPC)
- [x] Sprint 3 — 게임 로직 (성장 FSM, 스탯, 가챠, 감정)
- [x] Sprint 4 — UI & 애니메이션 (스프라이트, Framer Motion)
- [x] Sprint 5 — 알림 시스템 (Google Calendar 연동)
- [x] Sprint 6 — Firebase 연동 (로그인, 동기화)
- [x] Sprint 7 — 결제 시스템 (Stripe 스캐폴드)
- [ ] Sprint 8 — 빌드 & 배포 (자동 업데이트, GitHub Releases)

## License

MIT
