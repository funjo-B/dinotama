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

## 커밋 & 푸시 규칙
사용자가 "커밋푸시" 또는 "커밋 및 푸시" 요청 시 아래 순서로 실행:
1. `git status` + `git diff --stat`으로 변경 내용 확인
2. TODO.md 최신화 (완료 항목 체크, 새 작업 추가, 현재 상태 요약 업데이트)
3. 변경 파일 `git add` (관련 파일만 선택적으로)
4. 한글 커밋 메시지 작성 — 수정/추가된 내용 상세히 기술
5. `git push`
6. 커밋 메시지 형식:
```
feat/fix/refactor: 한줄 요약

## 수정 내용
- 항목1
- 항목2

## 신규 파일
- 파일명 (있을 경우)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

## Species System
- 10종: raptor, trex, pterodactyl, triceratops, stegosaurus, brachiosaurus, ankylosaurus, parasaurolophus, spinosaurus, dilophosaurus
- 레어도별 풀: common 3종 / rare 3종 / epic 2종 / legend 2종
- 스프라이트 경로: `public/assets/sprites/{stage}/{species}/sprite_{stage}_{emotion}_01.png`
- 판매 가격: common 5 / rare 15 / epic 50 / legend 200

## Window Architecture
- 공룡 창: 320x280 고정 (transparent, always-on-top)
- 패널(TODO/컬렉션): 별도 BrowserWindow로 공룡 창 좌측에 생성
- 패널↔메인 데이터 동기화: IPC `dino:get-store-snapshot` + `dino:panel-action`

## Agent Roles
- **pm-agent**: CLAUDE.md/TODO.md 관리, 스프린트 계획, GitHub Issues
- **dev-agent**: Electron 메인 프로세스, 창 관리, 트레이, 빌드
- **game-agent**: 성장 FSM, 가챠, 감정 시스템
- **notify-agent**: Google Calendar 연동, 알림 스케줄러, Firebase 동기화
- **asset-agent**: 스프라이트, Rive 애니메이션, 에셋 구조
