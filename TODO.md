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

### Sprint 8: Firebase 인증 & 동기화 수정 ✅
- [x] Vite envDir 설정 — .env가 프로젝트 루트에서 로드되도록 수정
- [x] useAuth IPC 리스너 타이밍 수정 — firebase import 전에 이벤트 리스너 등록 + 큐 처리
- [x] useAuth 로그아웃 핸들러 개선 — auth.signOut() await 보장, firebase 모듈 참조 재사용
- [x] OAuth 콜백 서버 포트 충돌 수정 — closeCallbackServer()로 이전 서버 완전 종료 후 재사용
- [x] firebase.ts 디버그 로그 추가 (환경변수 로드 확인용)
- [x] StatsOverlay 짤림 방지 (whiteSpace: nowrap)

---

## 남은 작업 (우선순위순)

### 🔴 1순위 — 핵심 기능 완성

#### 로그인/동기화 안정화
- [ ] 트레이 로그아웃→로그인 한 번에 되는지 최종 확인
- [ ] 우클릭 컨텍스트 메뉴 로그인 동작 확인
- [ ] Firebase Firestore 저장/불러오기 E2E 테스트
- [ ] 앱 재시작 시 자동 세션 복원 동작 확인
- **담당**: dev-agent / notify-agent

#### TodoPanel Firebase 연동
- [ ] TodoPanel 데이터를 Firestore에 저장/불러오기 (현재 로컬 state만)
- **담당**: notify-agent

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
- **Firebase**: ✅ 연결 완료 (Authentication + Firestore + 환경변수 주입 확인)
- **Electron**: ✅ 기본 동작 (프로덕션 빌드 경로 수정 완료)
- **게임 로직**: ✅ FSM/스탯/가챠/감정 구현 완료
- **Auth**: ✅ 통합 Google 로그인 (Firebase + Calendar 동시 인증, 포트 충돌 수정)
- **Calendar**: ✅ 폴링 구현 완료 (auth 토큰 연동)
- **Stripe**: ⚠️ 스캐폴드만 (키/백엔드 없음)
- **테스트/린트**: ❌ 미구현

## 환경 설정 메모
- `.env` 파일은 git에 포함 안됨 — 새 환경에서 `.env.example` 복사 후 키값 채워야 함
- Firebase Console: https://console.firebase.google.com (프로젝트: dinotama-dff44)
- Vite `envDir`이 프로젝트 루트를 가리키도록 설정됨 (root가 src/renderer이므로 필수)
