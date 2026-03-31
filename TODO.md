# DinoTama - TODO

## 완료된 스프린트

### Sprint 1: 프로젝트 초기 설정 ✅
- [x] CLAUDE.md / TODO.md 생성
- [x] 폴더 구조 설계 및 생성
- [x] package.json / TypeScript / Vite 설정
- [x] 공유 타입 & 상수 정의 (src/shared)
- [x] Electron 메인 프로세스 (src/main)
- [x] React 엔트리 (src/renderer)
- [x] DinoCanvas 컴포넌트 + Zustand 스토어

### Sprint 2: Electron 메인 프로세스 ✅
- [x] 투명 BrowserWindow (always-on-top)
- [x] 드래그 이동 + 모서리 고정
- [x] 시스템 트레이 + 딥링크
- [x] 우클릭 컨텍스트 메뉴 + 스탯 오버레이

### Sprint 3: 게임 로직 ✅
- [x] 성장 FSM (egg→baby→teen→adult)
- [x] 스탯 시스템 (hunger/happiness/fatigue)
- [x] 감정 트리거 + 가챠 확률 + 천장제

### Sprint 4: UI & 애니메이션 (부분 완료)
- [x] 스프라이트 구조 + DinoCanvas + Framer Motion
- [ ] Rive 애니메이션 통합
- [ ] 실제 스프라이트 에셋 제작 (현재 placeholder)

### Sprint 5: 알림 시스템 ✅
- [x] Google Calendar API 연동 + 알림 팝업 UI

### Sprint 6: Firebase 연동 ✅
- [x] Firebase 프로젝트 생성 (dinotama-dff44)
- [x] Authentication (Google 로그인) 활성화
- [x] Firestore Database 활성화
- [x] firebase.ts → 환경변수(import.meta.env) 연결
- [x] .env / .env.example 구성

### Sprint 7: 결제 시스템 (스캐폴드만)
- [x] Stripe 서비스 모듈 구조
- [ ] 실제 결제 로직 미구현 (아래 참조)

---

## 남은 작업 (우선순위순)

### 🔴 1순위 — 핵심 기능 완성

#### Google Calendar OAuth 완성
- [ ] Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
- [ ] client_id, client_secret을 .env에 추가
- [ ] calendar.ts의 OAuth2Client에 credentials 연결
- **담당**: dev-agent / notify-agent

#### 환경변수 정리
- [ ] .env에 Google OAuth 키 추가 (VITE_GOOGLE_CLIENT_ID 등)
- [ ] .env.example 업데이트
- **담당**: dev-agent

### 🟠 2순위 — 결제 시스템

#### Stripe 결제 연동
- [ ] Stripe 계정 생성 + publishable key 발급
- [ ] 고급알 상품 3종 priceId 설정
- [ ] 백엔드 서버 구축 (Checkout Session 생성)
- [ ] 결제 완료 webhook → 가챠 트리거 연결
- [ ] .env에 Stripe 키 추가
- **담당**: game-agent

### 🟡 3순위 — 품질 & 안정성

#### ESLint / Prettier 설정
- [ ] .eslintrc.js + .prettierrc 생성
- [ ] npm run lint 동작 확인
- **담당**: dev-agent

#### 테스트 코드 작성
- [ ] growthFSM 단위 테스트
- [ ] dinoStore 단위 테스트
- [ ] emotionEngine 단위 테스트
- [ ] 가챠 확률 / 천장제 테스트
- **담당**: game-agent

#### 에러 핸들링 강화
- [ ] Firebase 동기화 실패 시 재시도 로직
- [ ] 사용자에게 에러 UI 표시
- [ ] TodoPanel Firebase 연동 (현재 로컬 state만)
- **담당**: notify-agent

### 🔵 4순위 — 빌드 & 배포

#### 빌드 완성
- [ ] 앱 아이콘 제작 (icon.ico / icon.icns)
- [ ] Windows NSIS 인스톨러 테스트
- [ ] macOS DMG 빌드 테스트
- **담당**: dev-agent

#### 자동 업데이트 & 배포
- [ ] electron-updater 설정
- [ ] GitHub Releases 배포 자동화
- [ ] Windows/macOS 코드 서명
- **담당**: dev-agent

### ⚪ 5순위 — 고도화

#### 애니메이션 개선
- [ ] Rive 애니메이션 라이브러리 통합
- [ ] 실제 스프라이트 에셋 제작/교체
- **담당**: asset-agent

---

## 현재 상태 요약
- **Firebase**: ✅ 연결 완료 (Authentication + Firestore 활성화)
- **Electron**: ✅ 기본 동작 (프로덕션 빌드 경로 수정 완료)
- **게임 로직**: ✅ FSM/스탯/가챠/감정 구현 완료
- **Calendar**: ⚠️ API 코드 있으나 OAuth 미설정
- **Stripe**: ⚠️ 스캐폴드만 (키/백엔드 없음)
- **테스트/린트**: ❌ 미구현

## 환경 설정 메모
- `.env` 파일은 git에 포함 안됨 — 새 환경에서 `.env.example` 복사 후 키값 채워야 함
- Firebase Console: https://console.firebase.google.com (프로젝트: dinotama-dff44)
