# DinoTama - Desktop Dinosaur Tamagotchi

## Project Overview
Windows/macOS 모니터 구석에 항상 떠있는 공룡 다마고치 데스크탑 앱.

## Tech Stack
- **Framework**: Electron 28+ (Main + Renderer)
- **UI**: React 18 + Framer Motion
- **State**: Zustand (local) + Firebase Firestore (cloud sync)
- **Auth**: Google OAuth via Firebase Auth
- **Payment**: Stripe Checkout (고급알 유료화, 스캐폴드)
- **Calendar**: Google Calendar API
- **Ad Reward**: Firebase Functions (v2) + Firebase Hosting
- **Notification**: node-notifier + custom UI
- **Animation**: Sprite sheets (72×72px)
- **i18n**: 자체 구현 (i18n.ts + useT 훅, 한/영)
- **Build**: electron-builder (Windows NSIS / macOS DMG)

## Architecture
```
Main Process (Electron)
├── Transparent BrowserWindow (always-on-top)
├── System Tray
├── Deep Link Handler (dinotama://auth, dinotama://reward)
├── IPC Bridge → Renderer
├── Google Calendar Polling (싱글톤 OAuth2 + 선제 토큰 갱신)
├── Ad Reward IPC (openAdReward, validateAdReward)
└── Auth (OAuth flow + token persistence)

Renderer Process (React)
├── DinoCanvas (sprite animation, 72px)
├── Game Logic (Zustand store)
│   ├── Growth FSM (baby→teen→adult)
│   ├── Gacha System (5 rarity + pity)
│   ├── Ad Reward (grantAdReward, clipboard fallback)
│   └── Emotion Triggers
├── Panels (별도 BrowserWindow)
│   ├── GachaPanel (뽑기 + 광고 보상)
│   ├── CollectionPanel (컬렉션 + 합성 + 되팔기)
│   ├── TodoPanel (할일 + Calendar)
│   └── SettingsPanel (언어, 알람, 배경)
├── Firebase Sync (30min + event-driven, 변경 없으면 skip)
└── Notification UI (calendar + todo reminder)

Firebase Backend
├── Hosting (랜딩 + 가이드 + 광고 보상 페이지)
└── Functions v2 (claimReward + validateReward)
```

## Key Conventions
- Sprite naming: `sprite_<stage>_<emotion>_<frame>.png` (128×72px)
- Stages: `baby`, `teen`, `adult` (알 단계 없음)
- Emotions: `idle`, `happy`, `sad`, `hungry`, `sleepy`, `excited`
- IPC channels prefixed with `dino:`
- Firebase collections: `users/{uid}`, `users/{uid}/data/todos`, `rewardTokens/{nonce}`, `rewardClaims/{uid}`
- Gacha rates: Common 50% / Rare 30% / Epic 15% / Legend 4% / Hidden 1%
- Pity system: Epic 50회 / Legend 100회 / Hidden 300회
- Sell prices: common 3 / rare 5 / epic 10 / legend 50 / hidden 100
- Stage sell multiplier: baby ×1 / teen ×2 / adult ×4

## Commands
```bash
npm run dev          # Electron dev mode (hot reload)
npm run build        # Production build
npm run build:win    # Windows NSIS installer
npm run build:mac    # macOS DMG
npm run lint         # ESLint
npm run test         # Vitest
```

## 테스트 규칙
- **매 대화 시작 시** `npx vitest run`을 실행하여 전체 테스트 통과 여부 확인
- 기능 변경/추가 후 관련 테스트가 깨지면 반드시 수정 후 커밋
- 새 기능 추가 시 해당 로직에 대한 테스트도 함께 작성
- 테스트 파일 위치: 소스 파일과 같은 디렉토리에 `*.test.ts`

## 커밋 & 푸시 규칙
사용자가 "커밋푸시" 또는 "커밋 및 푸시" 요청 시 아래 순서로 실행:
1. `git status` + `git diff --stat` + `git log --oneline -5`으로 변경 내용 및 최근 커밋 스타일 확인
2. TODO.md 최신화 (완료 항목 체크, 새 스프린트 추가, 현재 상태 요약 업데이트)
3. CLAUDE.md도 변경사항이 있으면 업데이트 (확률, 가격, 아키텍처 등)
4. 변경 파일 `git add` (관련 파일만 선택적으로, `.env` 등 시크릿 파일 절대 포함 금지)
5. 한글 커밋 메시지 작성 — 수정/추가된 내용 상세히 기술
6. `git push`
7. 커밋 메시지 형식:
```
feat/fix/refactor/docs: 한줄 요약

## 수정 내용
- 항목1
- 항목2

## 신규 파일
- 파일명 (있을 경우)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

### 커밋 시 주의사항
- `.env`, 시크릿 키, Firebase 서비스 계정 파일 절대 커밋 금지
- `node_modules/`, `dist/`, `release/`, `.firebase/` 등 빌드 산출물 커밋 금지
- 커밋 전 빌드 확인 (`npx vite build` + `npx tsc -p tsconfig.main.json`)
- Firebase 배포가 포함된 경우 `npx firebase-tools deploy` 먼저 실행 후 커밋
- 웹 호스팅 변경 시 `hosting/` 폴더 커밋 포함

## Species System
- 41종: 5레어도 (Common 11종 / Rare 11종 / Epic 10종 / Legend 6종 / Hidden 3종)
- 스프라이트 경로: `public/assets/sprites/{stage}/{species}/sprite_{stage}_{emotion}_{frame}.png`
- Hidden 종은 가챠 패널에서 "???" 으로 표시 (비공개)
- Hidden 변신 시스템: baby/teen은 평범한 동물 → adult에서 전설 존재로 변신
  - 닭(chicken) → 불사조(phoenix)
  - 잉어(carp) → 동양용(eastern_dragon)
  - 도마뱀(lizard) → 서양용(western_dragon)
- 변신 시 스프라이트 경로: `public/assets/sprites/adult/{변신폼}/sprite_adult_{emotion}_{frame}.png`
- 변신 시 이름/색상도 변경 (getTransformedDef 헬퍼 사용)

## Window Architecture
- 공룡 창: 320x280 고정 (transparent, always-on-top)
- 패널(TODO/컬렉션/가챠/설정/상점): 별도 BrowserWindow로 공룡 창 좌측에 생성
- 패널↔메인 데이터 동기화: IPC `dino:get-store-snapshot` + `dino:panel-action`

## Firebase Backend
- 프로젝트: `dinotama-dff44`
- Hosting: `https://dinotama-dff44.web.app`
- Functions (v2, us-central1): `claimReward`, `validateReward`, `createCheckoutSession`, `stripeWebhook`
- Secrets (Firebase Secret Manager):
  - `REWARD_HMAC_SECRET` — 광고 보상 HMAC 서명
  - `STRIPE_SECRET_KEY` — Stripe API 시크릿 키
  - `STRIPE_WEBHOOK_SECRET` — Stripe Webhook 서명 검증
- 배포: `npx firebase-tools deploy --only hosting,functions`
- Firestore 규칙: `npx firebase-tools deploy --only firestore:rules`

## Stripe 결제 시스템
- 상품 6종: 코인 팩 3종 (₩1,200/₩5,500/₩12,000) + 프리미엄 알 3종 (₩2,500/₩11,000/₩22,000)
- 상품 정의: `src/shared/constants/shop.ts` + `functions/src/index.ts` (양쪽 동기화 필요)
- 결제 흐름: ShopPanel → createCheckoutSession(Firebase Function) → Stripe Checkout → stripeWebhook → Firestore 재화 지급
- 주문 추적: Firestore `orders/{sessionId}` (status: pending → completed)
- **활성화 절차**:
  1. Stripe 계정 생성: https://dashboard.stripe.com
  2. Secret Key 등록: `firebase functions:secrets:set STRIPE_SECRET_KEY`
  3. Webhook Secret 등록: `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET`
  4. Stripe Dashboard → Webhooks → 엔드포인트 추가: `https://us-central1-dinotama-dff44.cloudfunctions.net/stripeWebhook`
     - 이벤트: `checkout.session.completed`
  5. Functions 배포: `npx firebase-tools deploy --only functions --project dinotama-dff44`
  6. Hosting 배포 (결제 결과 페이지): `npx firebase-tools deploy --only hosting --project dinotama-dff44`

## Agent Roles
- **pm-agent**: CLAUDE.md/TODO.md 관리, 스프린트 계획, GitHub Issues
- **dev-agent**: Electron 메인 프로세스, 창 관리, 트레이, 빌드, Firebase 배포
- **game-agent**: 성장 FSM, 가챠, 감정 시스템
- **notify-agent**: Google Calendar 연동, 알림 스케줄러, Firebase 동기화
- **asset-agent**: 스프라이트, 에셋 구조
