# DinoTama - TODO

## Sprint 1: 프로젝트 초기 설정 ✅ (Complete)
- [x] CLAUDE.md 생성
- [x] TODO.md 생성
- [x] 폴더 구조 설계 및 생성
- [x] package.json 초기 설정
- [x] TypeScript 설정 (tsconfig.json + tsconfig.main.json)
- [x] Vite 설정 (vite.config.ts)
- [x] 공유 타입 정의 (src/shared/types)
- [x] 공유 상수 정의 (src/shared/constants)
- [x] Electron 메인 프로세스 (src/main/index.ts)
- [x] Preload 스크립트 (src/main/preload.ts)
- [x] React 엔트리 (src/renderer)
- [x] DinoCanvas 컴포넌트
- [x] Zustand 스토어 (가챠 + 천장제 포함)
- [x] .gitignore 설정
- [ ] ESLint / Prettier 설정
- [ ] npm install & 빌드 테스트

## Sprint 2: Electron 메인 프로세스 (dev-agent) ✅ Complete
- [x] 투명 BrowserWindow 생성 (window.ts)
- [x] always-on-top 설정 (screen-saver level)
- [x] 모서리 고정 로직 (snap-to-edge IPC)
- [x] 드래그 이동 구현 (IPC drag-start/drag-move + useDrag hook)
- [x] 시스템 트레이 아이콘 (tray.ts, fallback icon 포함)
- [x] 딥링크(dinotama://auth) 처리 (deeplink.ts)
- [x] IPC 채널 설계 (preload.ts — dino: prefix)
- [x] 우클릭 컨텍스트 메뉴 (밥주기/놀아주기/알뽑기/상태보기)
- [x] 스탯 오버레이 UI (hover시 표시)

## Sprint 3: 게임 로직 (game-agent) ✅ Complete
- [x] Zustand 스토어 설계 (dinoStore.ts)
- [x] 공룡 성장 FSM (growthFSM.ts — egg→baby→teen→adult)
- [x] 스탯 시스템 (hunger/happiness/fatigue + 시간 디케이)
- [x] 감정 트리거 시스템 (emotionEngine.ts — 규칙기반 + 이벤트 트리거)
- [x] 가챠 확률 시스템 구현 (rollRarity)
- [x] 천장제 로직 (50회 Epic / 100회 Legend)
- [x] 게임 루프 (useGameLoop — 1분 주기 tick)
- [x] 감정별 애니메이션 (6종: idle/happy/sad/hungry/sleepy/excited)

## Sprint 4: UI & 애니메이션 (asset-agent) ✅ Complete
- [x] public/assets 폴더 구조 설계 (egg/baby/teen/adult + rive + icons)
- [x] 스프라이트 네이밍 규칙 적용 (README.md with convention)
- [x] DinoCanvas 컴포넌트 (sprite animation with emotion variants)
- [x] Framer Motion 감정별 애니메이션 (6종 TargetAndTransition)
- [ ] Rive 애니메이션 통합 (에셋 준비 후)
- [ ] 실제 스프라이트 에셋 제작/배치

## Sprint 5: 알림 시스템 (notify-agent) ✅ Complete
- [x] Google Calendar API 연동 (calendar.ts)
- [x] 일정 5분 전 알림 스케줄러 (1분 주기 polling)
- [x] 알림 팝업 UI (NotificationPopup.tsx)
- [x] OK/SNOOZE 버튼 구현
- [x] 감정 트리거 연결 (OK→happy 5초, SNOOZE→sad 3초)
- [x] IPC calendar-set-credentials / calendar-stop

## Sprint 6: Firebase 연동 (notify-agent) ✅ Complete
- [x] Firebase 서비스 모듈 (firebase.ts)
- [x] Google 로그인 (signInWithCredential)
- [x] Firestore 데이터 모델 (users/{uid})
- [x] 30분 자동저장 스케줄러 (startAutoSync)
- [x] 이벤트 발생 시 즉시 동기화 (syncNow)
- [ ] Firebase config 환경변수 설정 (실제 프로젝트 생성 후)

## Sprint 7: 결제 시스템 (game-agent) ✅ Complete
- [x] Stripe 서비스 모듈 (stripe.ts)
- [x] 고급알 상품 정의 (1/5/11개 패키지)
- [x] Checkout 플로우 스캐폴드
- [ ] 백엔드 Checkout Session 생성 (서버 필요)
- [ ] 결제 완료 webhook → 가챠 트리거
- [ ] Stripe publishable key 설정

## Sprint 8: 빌드 & 배포 (dev-agent)
- [ ] electron-builder 설정
- [ ] Windows NSIS 인스톨러
- [ ] macOS DMG 빌드
- [ ] 자동 업데이트 (electron-updater)
- [ ] GitHub Releases 배포
