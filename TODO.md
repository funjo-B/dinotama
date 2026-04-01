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
- [x] 우클릭 컨텍스트 메뉴

### Sprint 3: 게임 로직 ✅
- [x] 성장 FSM (egg→baby→teen→adult)
- [x] 가챠 확률 + 천장제

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
- [ ] 실제 결제 로직 미구현

### Sprint 8: Firebase 인증 & 동기화 수정 ✅
- [x] Vite envDir 설정
- [x] useAuth IPC 리스너 타이밍 수정
- [x] OAuth 콜백 서버 포트 충돌 수정

### Sprint 9: 공룡 종 다양성 + 컬렉션 시스템 ✅
- [x] 10종 공룡 종(species) 시스템 추가 (raptor, trex, pterodactyl 등)
- [x] 레어도별 종 풀 (common 3종 / rare 3종 / epic 2종 / legend 2종)
- [x] 가챠에서 레어도 + 종 동시 결정
- [x] 240개 종별 placeholder 스프라이트 생성 (10종 x 4스테이지 x 6감정)
- [x] 공룡 이름 변경 기능 (우클릭 메뉴)
- [x] 공룡 선택(전환) 서브메뉴
- [x] 컨텍스트 메뉴 서브메뉴 + 구분선 지원

### Sprint 10: 컬렉션 패널 + UI 리팩토링 ✅
- [x] Dino 타입 간소화 — 개별 스탯(stats/emotion) 제거, active dino만 로컬 관리
- [x] 공룡 되팔기(sellDino) 기능 (레어도별 가격: common 5, rare 15, epic 50, legend 200)
- [x] CollectionPanel — 종+스테이지별 그룹화, 보유수량, 우클릭 판매/이름변경/대표설정
- [x] 패널을 별도 BrowserWindow로 분리 — 공룡 창(320x280) 크기 고정, 패널은 옆에 독립 창
- [x] IPC 기반 스토어 동기화 — 패널 창에서 메인 창 스토어 읽기/액션 위임
- [x] 기존 세이브 데이터 마이그레이션 (old species/stats 필드 자동 strip)

### Sprint 11: UX 개선 ✅
- [x] 위치 초기화 / 현재 위치 기억 / 기억한 위치로 이동 (우클릭 메뉴)
- [x] TODO 로컬 저장 (localStorage) — 재시작해도 유지
- [x] TODO 매일 체크 초기화 — 하루 지나면 done 상태만 리셋 (항목 유지)
- [x] 공룡 드래그 시 패널 창 따라가기

### Sprint 12: TODO 알림 + 합성 시스템 + 가챠 연출 ✅
- [x] TODO 알림 시스템 — 랜덤 20~40분 주기로 미완료 항목 알림
- [x] 전체 알림 ON/OFF 토글 (TODO 패널 헤더)
- [x] 개별 항목 알림 ON/OFF 토글 (각 항목 옆 🔔/🔕)
- [x] TodoReminder 팝업 — "이거 했어?" + "했어!/나중에" 버튼
- [x] "했어!" 누르면 해당 TODO 자동 체크
- [x] 3마리 합성 진화 시스템 — 같은 종+스테이지 3마리 → 1마리 다음 단계
- [x] 컬렉션 패널에 "합성 ⚡" 버튼 (3마리 이상, 성체 제외)
- [x] 기존 stageProgress 기반 진화 제거
- [x] 알 뽑기 버튼 (공룡 창 좌측)
- [x] 가챠 연출 애니메이션 (흔들기 → 깨짐 → 등급별 공개)
- [x] 뽑은 공룡 자동 보관 (메인 공룡 안 바뀜)

---

## 남은 작업 (우선순위순)

### 🔴 1순위 — 핵심 기능 완성

#### 이모션 시스템
- [ ] 공룡 이모션 추가 (춤추기, 기뻐하기 등) — 스탯 기반이 아닌 이벤트 기반
- [ ] 이모션별 스프라이트 애니메이션 교체
- **담당**: game-agent / asset-agent

#### 실제 스프라이트 에셋
- [ ] 종별 실제 공룡 이미지 제작/교체 (현재 placeholder)
- [ ] 72x72 PNG, 경로: `public/assets/sprites/{stage}/{species}/sprite_{stage}_{emotion}_01.png`
- **담당**: asset-agent

#### 로그인/동기화 안정화
- [ ] 트레이 로그아웃→로그인 한 번에 되는지 최종 확인
- [ ] Firebase Firestore 저장/불러오기 E2E 테스트
- **담당**: dev-agent

### 🟠 2순위 — 결제 시스템

#### Stripe 결제 연동
- [ ] Stripe 계정 생성 + publishable key 발급
- [ ] 고급알 상품 3종 priceId 설정
- [ ] 백엔드 서버 구축 (Checkout Session 생성)
- [ ] 결제 완료 webhook → 가챠 트리거 연결
- **담당**: game-agent

### 🟡 3순위 — 품질 & 안정성

#### ESLint / Prettier 설정
- [ ] .eslintrc.js + .prettierrc 생성
- [ ] npm run lint 동작 확인

#### 테스트 코드 작성
- [ ] growthFSM / dinoStore / 가챠 확률 단위 테스트

#### 에러 핸들링
- [ ] Firebase 동기화 실패 시 재시도
- [ ] 사용자에게 에러 UI 표시

### 🔵 4순위 — 빌드 & 배포

- [ ] 앱 아이콘 제작 (icon.ico / icon.icns)
- [ ] Windows NSIS / macOS DMG 빌드 테스트
- [ ] electron-updater + GitHub Releases 자동화
- [ ] 코드 서명

### ⚪ 5순위 — 고도화

- [ ] Rive 애니메이션 라이브러리 통합
- [ ] 공룡 수 대량일 때 컬렉션 성능 최적화

---

## 현재 상태 요약
- **공룡 시스템**: ✅ 10종 공룡, 가챠, 되팔기, 이름변경, 컬렉션 패널
- **UI 구조**: ✅ 공룡 창(320x280 고정) + 패널(별도 BrowserWindow)
- **Firebase**: ✅ 인증 + Firestore 동기화
- **Calendar**: ✅ 폴링 + 알림 팝업
- **TODO**: ✅ localStorage 저장, 매일 체크 초기화
- **Stripe**: ⚠️ 스캐폴드만
- **테스트/린트**: ❌ 미구현

## 환경 설정 메모
- `.env` 파일은 git에 포함 안됨 — `.env.example` 복사 후 키값 채워야 함
- Firebase Console: https://console.firebase.google.com (프로젝트: dinotama-dff44)
- Vite `envDir`이 프로젝트 루트를 가리키도록 설정됨
