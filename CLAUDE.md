# DinoTama - Desktop Dinosaur Tamagotchi

## Project Overview
Windows/macOS 모니터 구석에 항상 떠있는 공룡 다마고치 데스크탑 앱.

## Tech Stack
- **Framework**: Electron 28+ (Main + Renderer)
- **UI**: React 18 + Framer Motion
- **State**: Zustand (local) + Firebase Firestore (cloud sync)
- **Auth**: Google OAuth via Firebase Auth
- **Payment**: Stripe Checkout (고급알 유료화)
- **Calendar**: Google Calendar API
- **Notification**: node-notifier + custom UI
- **Animation**: Sprite sheets (72×72px) + Rive
- **Build**: electron-builder (Windows NSIS / macOS DMG)

## Architecture
```
Main Process (Electron)
├── Transparent BrowserWindow (always-on-top)
├── System Tray
├── Deep Link Handler (dinotama://auth)
├── IPC Bridge → Renderer
└── Auto-updater

Renderer Process (React)
├── DinoCanvas (sprite animation)
├── Game Logic (Zustand store)
│   ├── Growth FSM (egg→baby→teen→adult)
│   ├── Stats (hunger/happiness/fatigue)
│   ├── Gacha System (pity included)
│   └── Emotion Triggers
├── Notification UI (calendar alerts)
├── Firebase Sync (30min + event-driven)
└── Stripe Checkout (in-app)
```

## Key Conventions
- Sprite naming: `sprite_<stage>_<emotion>_<frame>.png` (72×72px)
- Stages: `egg`, `baby`, `teen`, `adult`
- Emotions: `idle`, `happy`, `sad`, `hungry`, `sleepy`, `excited`
- IPC channels prefixed with `dino:`
- Firebase collections: `users/{uid}/dinos`, `users/{uid}/gacha`
- Gacha rates: Common 60% / Rare 25% / Epic 12% / Legend 3%
- Pity system: Epic guaranteed within 50 pulls, Legend within 100

## Commands
```bash
npm run dev          # Electron dev mode (hot reload)
npm run build        # Production build
npm run build:win    # Windows NSIS installer
npm run build:mac    # macOS DMG
npm run lint         # ESLint
npm run test         # Vitest
```

## Agent Roles
- **pm-agent**: CLAUDE.md/TODO.md 관리, 스프린트 계획, GitHub Issues
- **dev-agent**: Electron 메인 프로세스, 창 관리, 트레이, 빌드
- **game-agent**: 성장 FSM, 스탯, 가챠, 감정 시스템
- **notify-agent**: Google Calendar 연동, 알림 스케줄러, Firebase 동기화
- **asset-agent**: 스프라이트, Rive 애니메이션, 에셋 구조
