# DinoTama

> Windows/macOS 모니터 구석에 항상 떠있는 공룡 다마고치 데스크탑 앱

**Live**: https://dinotama-dff44.web.app/

## Features

### 공룡 육성
- **41종 공룡** — 5단계 레어도 (Common / Rare / Epic / Legend / Hidden)
- **3단계 성장** — 유년기(baby) → 성장기(teen) → 성체(adult)
- **감정 시스템** — idle, happy, sad, hungry, sleepy, excited 6종 감정
- **액션 버튼** — 먹이기 / 놀아주기 / 쓰다듬기 / 재우기
- **3마리 합성 진화** — 같은 종 3마리를 합성해 상위 레어도 획득

### 가챠 시스템
- **확률**: Common 50% / Rare 30% / Epic 15% / Legend 4% / Hidden 1%
- **천장제**: Epic 50회, Legend 100회, Hidden 300회 보장
- **1/5/10연 뽑기** — 부화 연출 + 레전드/히든 번쩍 이펙트
- **컬렉션 패널** — 종+스테이지 그룹화, 되팔기(스테이지별 차등), 대표 설정

### 생산성
- **TODO 리스트** — 로컬 저장 + 클라우드 동기화, 매일 체크 초기화
- **TODO 알림** — 랜덤 20~40분 주기 알림, 개별 ON/OFF
- **Google Calendar 연동** — 일정 5분 전 공룡이 알림, 날짜 네비게이션

### 기타
- **다국어 지원** — 한국어/영어 전환 (i18n)
- **환경설정** — 언어, 알람 간격, 배경 on/off
- **클라우드 동기화** — Firebase Firestore (30분 주기 + 이벤트 즉시 + 재시도)
- **데스크탑 상주** — 투명 창, always-on-top, 시스템 트레이, 드래그 이동

## Tech Stack

| 영역 | 기술 |
|------|------|
| Framework | Electron 28+ |
| UI | React 18 + Framer Motion |
| State | Zustand |
| Cloud Sync | Firebase Firestore |
| Auth | Google OAuth → Firebase Auth |
| Payment | Stripe Checkout (스캐폴드) |
| Calendar | Google Calendar API |
| i18n | 자체 구현 (i18n.ts + useT 훅) |
| Animation | Sprite sheets (128x128px) |
| Build | electron-builder (NSIS / DMG) |

## Getting Started

### 사전 준비

1. [Node.js](https://nodejs.org/) 18+ 설치
2. `.env.example`을 `.env`로 복사 후 키값 채우기:
   - Firebase 콘솔에서 웹 앱 설정값
   - Google Cloud Console에서 OAuth 2.0 Client ID/Secret

### 설치

```bash
npm install
```

### 개발 모드

```bash
npm run dev          # Electron + Vite 핫 리로드
npm run dev:web      # 웹 브라우저에서 UI만 테스트
```

### 프로덕션 빌드

```bash
npm run build        # 렌더러 + 메인 빌드
npm run build:win    # Windows 설치파일 (.exe)
npm run build:mac    # macOS 설치파일 (.dmg)
```

## Project Structure

```
src/
├── main/                    # Electron 메인 프로세스
│   ├── index.ts             # 앱 진입점 (dotenv, GPU 설정)
│   ├── window.ts            # 투명 창 + 패널 창 관리 + IPC
│   ├── auth.ts              # Google OAuth 플로우 + 토큰 저장
│   ├── calendar.ts          # Google Calendar 폴링 + 알림
│   ├── tray.ts              # 시스템 트레이 메뉴
│   ├── preload.ts           # IPC 브릿지 (contextBridge)
│   └── deeplink.ts          # dinotama:// 프로토콜
├── renderer/                # React 렌더러
│   ├── components/
│   │   ├── DinoCanvas.tsx       # 스프라이트 애니메이션
│   │   ├── CollectionPanel.tsx  # 컬렉션 (종+스테이지 그룹)
│   │   ├── GachaPanel.tsx       # 가챠 패널 (확률/천장 정보)
│   │   ├── GachaAnimation.tsx   # 단일 뽑기 연출
│   │   ├── GachaMultiAnimation.tsx  # 다연 뽑기 연출
│   │   ├── MergeAnimation.tsx   # 합성 모션
│   │   ├── TodoPanel.tsx        # TODO + 캘린더 사이드바
│   │   ├── TodoReminder.tsx     # TODO 알림 팝업
│   │   ├── SettingsPanel.tsx    # 환경설정
│   │   └── NotificationPopup.tsx  # 캘린더 알림 팝업
│   ├── hooks/
│   │   ├── useAuth.ts           # Firebase 인증 상태
│   │   ├── useCalendarNotifications.ts
│   │   ├── useDrag.ts           # 드래그 이동
│   │   ├── useGameLoop.ts       # 게임 루프
│   │   ├── useContextMenu.ts    # 우클릭 메뉴
│   │   └── useT.ts              # i18n 번역 훅
│   ├── stores/              # Zustand 스토어
│   └── services/            # Firebase, Stripe
├── shared/                  # 메인/렌더러 공유
│   ├── types/               # TypeScript 타입
│   └── constants/           # 가챠 확률, 종 정보, 상수
public/
└── assets/
    └── sprites/             # baby/teen/adult 스프라이트 (128x128px)
```

## Sprite Convention

```
public/assets/sprites/{stage}/{species}/sprite_{stage}_{emotion}_{frame}.png
```

- **Stage**: `baby`, `teen`, `adult` (알 단계 없음 — 가챠에서 바로 baby 부화)
- **Emotion**: `idle`, `happy`, `sad`, `hungry`, `sleepy`, `excited`
- **Size**: 128x128px
- **Frame**: `01`, `02`, `03`... (멀티프레임 애니메이션 지원)

## Species (41종)

| 레어도 | 종 |
|--------|-----|
| Common (50%) 11종 | 갈리미무스, 코엘로피시스, 레소토사우루스, 스테고사우루스, 파라사우롤로푸스, 이구아노돈, 딜로포사우루스, 콤프소그나투스, 디모르포돈, 람포린쿠스, 익티오사우루스 |
| Rare (30%) 11종 | 트리케라톱스, 안킬로사우루스, 파키케팔로사우루스, 알로사우루스, 카르노타우루스, 프테라노돈, 플레시오사우루스, 크로노사우루스, 드라이오사우루스, 스쿠텔로사우루스, 프시타코사우루스 |
| Epic (15%) 10종 | 브라키오사우루스, 스테고케라스, 스피노사우루스, 바리오닉스, 케찰코아틀루스, 모사사우루스, 엘라스모사우루스, 켄트로사우루스, 미크로랍토르, 오비랍토르 |
| Legend (4%) 6종 | 아르젠티노사우루스, 티라노사우루스, 기가노토사우루스, 벨로키랍토르, 투푸수아라, 테리지노사우루스 |
| Hidden (1%) 3종 | 닭→불사조, 잉어→동양용, 도마뱀→서양용 |

## Window Architecture

- **공룡 창**: 320x280 고정 (transparent, always-on-top, skipTaskbar)
- **패널 창**: 별도 BrowserWindow, 공룡 창 좌측에 생성
- **패널 종류**: TODO, 컬렉션, 가챠, 환경설정
- **데이터 동기화**: IPC `dino:get-store-snapshot` + `dino:panel-action`

## Progress

- [x] 프로젝트 초기 설정 + Electron 메인 프로세스
- [x] 게임 로직 (성장 FSM, 가챠, 감정)
- [x] 10종 → 41종 공룡 확장 + 5레어도 + 히든 변신 시스템
- [x] 컬렉션 패널 + 합성 진화 시스템
- [x] TODO 알림 + 가챠 연출 애니메이션
- [x] 스프라이트 128px + 멀티프레임 지원
- [x] 다국어(i18n) + 환경설정 패널
- [x] Firebase 인증 + Firestore 동기화 + 재시도 로직
- [x] Google Calendar 연동 + 날짜 네비게이션
- [x] 로그인/동기화 안정화 + 프로덕션 빌드 수정
- [ ] 실제 스프라이트 에셋 제작 (현재 일부 placeholder)
- [ ] 배경 가챠 시스템
- [ ] Stripe 실결제 연동
- [ ] 앱 아이콘 + 코드 서명 + 자동 업데이트

## License

MIT
