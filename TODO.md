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
- [x] 10종 공룡 종(species) 시스템 추가
- [x] 레어도별 종 풀 (common 3종 / rare 3종 / epic 2종 / legend 2종)
- [x] 가챠에서 레어도 + 종 동시 결정
- [x] 240개 종별 placeholder 스프라이트 생성
- [x] 공룡 이름 변경 / 선택 / 컨텍스트 메뉴

### Sprint 10: 컬렉션 패널 + UI 리팩토링 ✅
- [x] 컬렉션 패널 (종+스테이지 그룹화, 되팔기, 대표설정)
- [x] 패널을 별도 BrowserWindow로 분리
- [x] IPC 기반 스토어 동기화

### Sprint 11: UX 개선 ✅
- [x] 위치 초기화 / 기억 / 복원
- [x] TODO 로컬 저장 + 매일 체크 초기화
- [x] 공룡 드래그 시 패널 창 따라가기

### Sprint 12: TODO 알림 + 합성 시스템 + 가챠 연출 ✅
- [x] TODO 알림 시스템 (랜덤 20~40분 주기)
- [x] 전체/개별 알림 ON/OFF 토글
- [x] TodoReminder 팝업
- [x] 3마리 합성 진화 시스템
- [x] 가챠 연출 애니메이션

### Sprint 13: 스프라이트 개선 + 가챠 패널 + 합성 모션 ✅
- [x] 스프라이트 128x128로 확대
- [x] 종별 고유 실루엣 + 스테이지별 크기 차이
- [x] 가챠 패널 (별도 창, 확률/천장 정보)
- [x] 합성 모션 (before → flash → after)
- [x] 버튼 즉시 툴팁

### Sprint 14: 가챠 UX + 다국어 + 설정 + 클라우드 동기화 ✅
- [x] 뽑기 결과 알→유년기(baby) 스프라이트로 변경 ("알에서 부화했다!" 연출)
- [x] 5연/10연 뽑기 — GachaMultiAnimation (알 그리드 → 개별 클릭 공개)
- [x] 레전드 등급만 번쩍 딜레이 연출 (단일/다연 모두)
- [x] 탭 잔상 버그 수정 — panelWindow orphan 방지 (destroy + panelOpening 플래그)
- [x] 다연뽑기 재뽑기 시 이전 결과 초기화 (multiPullKey 리마운트)
- [x] TODO 클라우드 동기화 — Firestore 저장/불러오기, 크로스 디바이스 지원
- [x] Google Calendar 날짜 네비게이션 — 이전/다음 날 화살표, 날짜+요일 표시
- [x] 환경설정 패널 — 언어 전환(한/영), 할일 알람 간격, 배경 on/off
- [x] i18n 국제화 시스템 — 한/영 모든 UI 문자열 중앙화 (i18n.ts + useT 훅)
- [x] 공룡 명칭/버튼/메뉴/날짜 포맷 전체 언어 적용 (45개+ 문자열)
- [x] cross-window 언어 동기화 — storage 이벤트로 설정창↔메인창 실시간 반영
- [x] 배경 on/off — 투명/흰색 토글, 메인 창 우측 버튼 + 환경설정 패널 연동
- [x] 로그인 표시 캐릭터 옆→창 우측 상단으로 이동 (이름+초록 글로우 점)

---

## 남은 작업 (우선순위순)

### 🔴 1순위 — 핵심 기능 완성

#### 실제 스프라이트 에셋
- [ ] 종별 실제 공룡 이미지 제작/교체 (현재 placeholder SVG)
- [ ] `public/assets/sprites/{stage}/{species}/sprite_{stage}_{emotion}_01.png`
- **담당**: asset-agent

#### 이모션 시스템
- [ ] 공룡 이모션 이벤트 기반 전환 (춤추기, 기뻐하기, 졸기 등)
- [ ] 이모션별 스프라이트 애니메이션 교체
- **담당**: game-agent / asset-agent

#### 로그인/동기화 안정화
- [ ] Firebase Firestore E2E 테스트 (TODO 클라우드 저장/불러오기 검증)
- [ ] Firestore 보안 규칙 — `users/{uid}/data/todos` 읽기/쓰기 허용 확인
- [ ] 트레이 로그아웃→재로그인 플로우 최종 확인
- **담당**: dev-agent

### 🟠 2순위 — 콘텐츠 확장

#### 배경 가챠
- [ ] 배경 스킨 시스템 (단색 → 픽셀 아트 배경 → 애니메이션 배경)
- [ ] 레어도별 배경 풀 (common 단색 / rare 패턴 / epic·legend 애니메이션)
- [ ] 배경 컬렉션 패널 — 뽑은 배경 목록에서 선택 적용
- **담당**: game-agent / asset-agent

#### Stripe 결제 연동
- [ ] Stripe 계정 + publishable key 발급
- [ ] 고급알 상품 3종 priceId 설정
- [ ] 백엔드 서버 구축 (Checkout Session 생성)
- [ ] 결제 완료 webhook → 가챠 트리거 연결
- **담당**: game-agent

### 🟡 3순위 — 품질 & 안정성

- [ ] ESLint / Prettier 설정 (.eslintrc.js + .prettierrc)
- [ ] growthFSM / dinoStore / 가챠 확률 단위 테스트 (Vitest)
- [ ] Firebase 동기화 실패 시 재시도 + 에러 UI

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
- **공룡 시스템**: ✅ 10종 가챠, 합성 진화, 되팔기, 컬렉션 패널
- **가챠 UX**: ✅ 1/5/10연 뽑기, baby 부화 연출, 레전드 번쩍 이펙트
- **UI 구조**: ✅ 공룡 창(320x280) + 패널(별도 BrowserWindow), 배경 토글
- **다국어**: ✅ 한국어/영어 전환, 모든 UI 문자열 i18n 적용
- **환경설정**: ✅ 언어, 알람 간격, 배경 on/off
- **Firebase**: ✅ 인증 + Firestore 동기화 (공룡 + TODO)
- **Calendar**: ✅ 날짜 네비게이션 (이전/다음 날), 알림 팝업
- **TODO**: ✅ 클라우드 동기화, 매일 체크 초기화, 알람 간격 설정
- **Stripe**: ⚠️ 스캐폴드만
- **스프라이트**: ⚠️ placeholder (실제 에셋 미제작)
- **테스트/린트**: ❌ 미구현

## 환경 설정 메모
- `.env` 파일은 git에 포함 안됨 — `.env.example` 복사 후 키값 채워야 함
- Firebase Console: https://console.firebase.google.com (프로젝트: dinotama-dff44)
- Firestore 보안 규칙에서 `users/{uid}/data/todos` 경로 허용 필요
