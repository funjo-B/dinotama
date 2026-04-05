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

### Sprint 15: 가챠 종 확장 + 스프라이트 실사화 + 이모션 시스템 ✅
- [x] 29종 5레어도 가챠 시스템 (Common 50% / Rare 30% / Epic 15% / Legend 4% / Hidden 1%)
- [x] Hidden 레어도 추가 (닭, 확률 1%, 천장 300회)
- [x] 가챠 알 단계 제거 → 바로 유년기(baby)로 부화
- [x] 레거시 종 마이그레이션 (raptor→dilophosaurus, trex→tyrannosaurus 등)
- [x] 티라노사우루스 실제 이미지 적용 (유년기/성장기/성체 × 6감정 = 18장)
- [x] 투푸수아라 실제 이미지 적용 (유년기 idle+5감정 + excited 3프레임 애니메이션)
- [x] 멀티프레임 스프라이트 시스템 (SPRITE_FRAME_COUNTS + DinoCanvas 200ms 사이클링)
- [x] 감정 액션 버튼 UI (🍖먹이기 / 🎮놀아주기 / 🤗쓰다듬기 / 😴재우기)
- [x] 스테이지별 되팔기 가격 차등 (유년기×1 / 성장기×2 / 성체×4)
- [x] 컬렉션 테스트 버튼 (🗑️전체삭제 / 🧬전종생성)
- [x] 공룡 명칭 오류 수정 (딤모르포돈→디모르포돈, 투판욱수아라→투푸수아라)
- [x] 스프라이트 제작 가이드 문서화 (docs/sprite-guide.md)

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

### Sprint 16: 보상형 광고 + 캘린더 안정화 + Firebase 최적화 + UI 수정 ✅
- [x] 보상형 광고 시스템 — Firebase Functions (claimReward/validateReward) + Hosting 광고 페이지
- [x] 광고 보고 30코인 보상 (1일 3회, HMAC 서명 토큰, 서버사이드 검증)
- [x] 클립보드 폴백 — 딥링크 실패 시 토큰 자동 감지 (dev 모드 대응)
- [x] Firebase Hosting 배포 — 랜딩 + 개인정보처리방침 + 이용약관 + 사용가이드
- [x] Google Calendar 안정화 — OAuth2 싱글톤 캐싱, 토큰 선제 갱신, 401 시 자동 재시도
- [x] Firebase 부하 절감 — onAuth 중복 로드 방지, auto-sync 변경 없으면 skip, Todo 1회 로드
- [x] 코인/가챠 데이터 무결성 — loadFromCloud 보호 (pendingSyncCount), 패널 즉시 코인 갱신
- [x] 다연뽑기 Legend+Hidden 플래시 버그 수정 — 모두열기 시 멈추는 문제 해결
- [x] Hidden 플래시 색상 수정 — 금색 하드코딩 → rarity별 동적 색상 (Legend=금, Hidden=빨강)
- [x] 캘린더 알림 위치 통일 — NotificationPopup left/right 스타일을 TodoReminder와 동일하게
- [x] TODO 매일 초기화 강화 — 클라우드 병합 시 적용, 자정 자동 감지(1분 주기), localStorage 즉시 반영
- [x] 되팔기 가격 수정 — common 3 / rare 5 / epic 10 / legend 50 / hidden 100
- [x] Hidden 종 정보 비공개 — 가챠 패널에서 "???" 표시
- [x] 가챠 패널 광고 버튼 UI + i18n (한/영)
- [x] 개편 예정 문서 작성 (docs/REVAMP_PLAN.md)

### Sprint 17: 코인 내역 + 출석체크 + 즉시저장 ✅
- [x] 코인 트랜잭션 로그 시스템 (CoinTransaction 타입, 최근 100건 보관)
- [x] 코인 내역 패널 — 가챠 패널 코인 옆 + 버튼 → 내역 표시 (아이콘/금액/잔액/시각)
- [x] 모든 코인 액션에 내역 기록 (뽑기/판매/광고보상/출석/연속보너스)
- [x] 광고 보상 10연뽑기 → 30코인 지급으로 변경
- [x] 출석체크 시스템 — 매일 10코인, 5일 연속 +10 보너스
- [x] 메인 화면 우측 📅 출석 버튼 (출석완료 시 ✅ + streak 표시)
- [x] 코인 관련 액션 즉시 저장 (syncImmediate) — 앱 종료해도 데이터 유실 없음
- [x] UserData 타입에 coinHistory/attendance/adReward 필드 추가
- [x] loadFromCloud에서 새 필드 정상 로드 (useAuth + dinoStore)

### Sprint 18: 히든 종 확장 + 변신 시스템 + 등급 색상 UI ✅
- [x] 히든 종 2종 추가 — 잉어(carp), 도마뱀(lizard)
- [x] 변신 시스템 — baby/teen은 평범한 동물, adult에서 전설 존재로 변신
  - 닭 → 불사조(Phoenix), 잉어 → 동양용(Eastern Dragon), 도마뱀 → 서양용(Western Dragon)
- [x] 변신 시 스프라이트/이름/색상 자동 변경 (HIDDEN_TRANSFORMS + getTransformedDef)
- [x] 전 UI 반영 — DinoCanvas, 컬렉션, 합성 모션, 스탯 오버레이, 컨텍스트 메뉴, 판매 로그
- [x] 변신 폼 placeholder 스프라이트 생성 (불사조/동양용/서양용 고유 실루엣)
- [x] 컬렉션/가챠 패널 종 옆 색깔 점을 등급(rarity) 색상으로 변경

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
- [x] OAuth 토큰 갱신 시 electron-store 저장 (calendar.ts)
- [x] 캘린더 401/403 에러 복구 (3회 재시도 + renderer 알림)
- [x] Firestore CRUD 재시도 로직 (withRetry, exponential backoff)
- [x] Auto-sync 중복 실행 방지 (syncInProgress 가드)
- [x] 로그아웃 시 저장 실패 안전 처리
- [x] 앱 시작 인증 복원: 3초 하드코딩 → did-finish-load 이벤트 기반
- [x] 프로덕션 빌드 실행 안 되는 문제 수정 (GPU 샌드박스 + .env 미포함)
- [x] Firestore 보안 규칙 생성 + 배포 (`firestore.rules`, 본인 데이터만 접근 가능)
- [x] 로그아웃→재로그인 버그 수정 (loadedUid 미초기화, syncTimeout 누수, authFailCount 미리셋, OAuth2 리스너 누적, syncInProgress 미정리)
- [x] 동기화 에러 UI (SyncStatusIndicator — 성공/실패/재시도 표시)
- [x] 자동 동기화(30분) 실패 시 에러 UI 전파
- [ ] Firebase Firestore E2E 테스트 (TODO 클라우드 저장/불러오기 검증)
- **담당**: dev-agent

### 🟠 2순위 — 콘텐츠 확장

#### 감정 액션 개편
- [ ] 액션 이모티콘 + 종류 재설계 (docs/REVAMP_PLAN.md 참고)
- [ ] 레어도별 해금 재검토
- [ ] 액션 라벨 i18n 적용 (현재 하드코딩)
- **담당**: game-agent

#### AdSense 연동
- [ ] Google AdSense 계정 신청 + 승인
- [ ] reward.html에 실제 광고 코드 삽입 (현재 placeholder)
- **담당**: dev-agent

#### 배경 가챠
- [ ] 배경 스킨 시스템 (단색 → 픽셀 아트 배경 → 애니메이션 배경)
- [ ] 레어도별 배경 풀 (common 단색 / rare 패턴 / epic·legend 애니메이션)
- [ ] 배경 컬렉션 패널 — 뽑은 배경 목록에서 선택 적용
- **담당**: game-agent / asset-agent

#### Stripe 결제 연동
- [x] 상품 6종 구성 (코인 팩 3종 + 프리미엄 알 팩 3종)
- [x] Firebase Functions: createCheckoutSession + stripeWebhook
- [x] ShopPanel UI + 가챠 패널 상점 버튼
- [x] Firestore orders 컬렉션 + 보안 규칙
- [x] 결제 성공/취소 페이지 (hosting)
- [x] 상점 테스트 8개 (가성비 검증 포함)
- [ ] Stripe 계정 생성 + Secret Key / Webhook Secret 등록
- [ ] Firebase Functions 배포 (Stripe 함수 포함)
- [ ] Stripe Dashboard에서 Webhook 엔드포인트 등록
- **담당**: dev-agent

### 🟡 3순위 — 품질 & 안정성

- [x] ESLint / Prettier 설정 (eslint.config.js flat config + .prettierrc)
- [x] 단위 테스트 56개 (gacha 확률/천장/종풀, species 변신/무결성, growthFSM 진화, emotionEngine 감정판정, statDecay 스탯감소)
- [x] Firebase 동기화 실패 시 재시도 (withRetry 적용 완료)
- [x] Firebase 동기화 실패 시 에러 UI (SyncStatusIndicator 컴포넌트)

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
- **공룡 시스템**: ✅ 41종 5레어도 가챠 (Common 11/Rare 11/Epic 10/Legend 6/Hidden 3), 합성 진화, 되팔기
- **히든 변신**: ✅ 닭→불사조, 잉어→동양용, 도마뱀→서양용 (adult 변신, 스프라이트/이름/색상 자동 전환)
- **스프라이트 파이프라인**: ✅ ChatGPT Pro → split-grid → process-sprites (배경투명+adult기준스케일링)
- **가챠 UX**: ✅ 1/5/10연 뽑기, baby 부화 연출, Legend=금/Hidden=빨강 개별 플래시
- **보상 광고**: ✅ 광고 시청 → 30코인 보상 (1일 3회, Firebase Functions 검증)
- **코인 내역**: ✅ 트랜잭션 로그 (뽑기/판매/광고/출석), 가챠 패널에서 조회
- **출석체크**: ✅ 매일 10코인 + 5일 연속 보너스 +10코인
- **이모션 시스템**: ✅ 6감정, 액션 버튼(먹이기/놀기/쓰다듬기/재우기), 자동 idle 복귀 (개편 예정)
- **스프라이트**: ✅ 티라노사우루스·투푸수아라 실제 이미지, 멀티프레임 애니메이션 지원
- **UI 구조**: ✅ 공룡 창(320x280) + 패널(별도 BrowserWindow), 배경 토글
- **다국어**: ✅ 한국어/영어 전환, 모든 UI 문자열 i18n 적용
- **환경설정**: ✅ 언어, 알람 간격, 배경 on/off
- **Firebase**: ✅ 인증 + Firestore 동기화 + 재시도 + 부하 최적화 + 보안 규칙 배포 + 동기화 에러 UI
- **Calendar**: ✅ 싱글톤 클라이언트, 선제 토큰 갱신, 401 자동 재시도, 알림 위치 통일
- **빌드**: ✅ Windows NSIS 패키징 실행 확인 (GPU 샌드박스 + .env 포함)
- **TODO**: ✅ 클라우드 동기화, 매일 체크 초기화(자정 자동 감지), 알람 간격 설정
- **웹사이트**: ✅ Firebase Hosting (랜딩 + 가이드 + 개인정보 + 이용약관 + 광고 보상 페이지)
- **문서**: ✅ 스프라이트 가이드, 개편 예정 문서 (docs/REVAMP_PLAN.md)
- **Stripe**: ✅ 상품 6종 + Checkout/Webhook 구현 완료 (Stripe 계정 등록 후 활성화 필요)
- **AdSense**: ⚠️ 승인 전 (placeholder 광고)
- **테스트/린트**: ✅ ESLint v9 + Prettier + Vitest 56개 테스트 (매 대화 시작 시 자동 실행)

## 환경 설정 메모
- `.env` 파일은 git에 포함 안됨 — `.env.example` 복사 후 키값 채워야 함
- Firebase Console: https://console.firebase.google.com (프로젝트: dinotama-dff44)
- Firestore 보안 규칙 배포 완료 (`firestore.rules` — 본인 uid만 접근, rewardTokens/Claims는 Functions만 쓰기)
