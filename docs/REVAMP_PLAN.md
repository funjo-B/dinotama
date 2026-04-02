# DinoTama 개편 예정 사항

## 1. 감정 액션 버튼 개편

### 현재 상태
| 버튼 | 액션 | 감정 | 지속시간 | 필요 레어도 |
|------|------|------|---------|------------|
| 🍖 | 먹이기 | happy | 4초 | Common+ |
| 🎮 | 놀아주기 | excited | 5초 | Rare+ |
| 🤗 | 쓰다듬기 | happy | 3초 | Epic+ |
| 😴 | 재우기 | sleepy | 5초 | Legend+ |
| 💃 | 춤추기 | excited | 6초 | Hidden |

### 개편 방향
- [ ] 액션 이모티콘 변경 (현재 이모지 → 새 아이콘/이미지)
- [ ] 액션 종류 재설계 (먹이기/놀기/쓰다듬기/재우기/춤추기 외 추가 또는 변경)
- [ ] 감정 매핑 재조정 (happy가 2개 겹치는 문제 등)
- [ ] 레어도별 해금 순서 재검토
- [ ] 각 액션에 대한 고유 스프라이트 애니메이션 추가

### 수정 필요 파일
- `src/renderer/App.tsx` — `ALL_ACTIONS` 배열, `ActionBar` 컴포넌트
- `src/shared/constants/gacha.ts` — `RARITY_ACTION_COUNT`
- `src/renderer/i18n.ts` — 액션 관련 문자열 (현재 하드코딩된 부분 i18n 적용)
- `hosting/guide.html` — 가이드 웹페이지 감정 액션 테이블

### 참고
현재 액션 라벨이 i18n을 거치지 않고 `labelKey`에 한국어 하드코딩됨. 개편 시 반드시 i18n 적용 필요.

---

## 2. 공룡 이름 머리 위 표시 (검토 중)

### 현재 상태
- 이름 변경 시 store에만 저장되고, 메인 UI에서는 이름이 표시되지 않음
- 이름을 확인하려면 우클릭 메뉴 또는 컬렉션 패널에서 봐야 함

### 검토 사항
- [ ] 이름 변경한 공룡만 머리 위에 이름 표시할지
- [ ] 모든 공룡에 기본 이름 표시할지
- [ ] 표시 스타일: 말풍선 / 단순 텍스트 / 툴팁(호버 시)
- [ ] 이름 표시 ON/OFF 토글 (환경설정 추가?)
- [ ] 320x280 작은 창에서 이름이 잘릴 수 있음 — 글자 크기/위치 결정

### 수정 필요 파일
- `src/renderer/App.tsx` — DinoCanvas 위에 이름 레이어 추가
- `src/renderer/components/DinoCanvas.tsx` — 또는 캔버스 내부에서 처리
- `src/renderer/stores/dinoStore.ts` — 이름 변경 여부 플래그 (선택)
- `src/renderer/components/SettingsPanel.tsx` — ON/OFF 토글 (선택)

### 결정 보류
이름 표시 여부 및 방식 — 사용자 확인 후 진행

---

## 3. Legend/Hidden 다연뽑기 연출 우선순위

### 현재 로직 분석

**단일 뽑기 (`GachaAnimation.tsx`):**
- shake → 클릭 → Legend/Hidden이면 `legend_flash`(2초) → reveal
- Legend와 Hidden 구분: 색상만 다름 (Legend=금색, Hidden=빨간색), 구조 동일

**다연 뽑기 (`GachaMultiAnimation.tsx`):**
- 개별 클릭: 해당 알만 플래시 → 2초 후 공개 (Legend/Hidden 각각 개별 처리)
- "모두 열기": 
  1. 일반 등급(Common/Rare/Epic) → 즉시 공개
  2. 첫 번째 특수 등급(Legend or Hidden) → 플래시 2초
  3. 플래시 끝나면 나머지 **전부** 즉시 공개 (두 번째 특수 등급 포함)

### 현재 우선순위
- **배열 순서(index)가 빠른 특수 등급이 플래시됨**
- Legend가 3번, Hidden이 7번이면 → Legend(3번)만 플래시, Hidden(7번)은 즉시 공개
- Hidden이 2번, Legend가 8번이면 → Hidden(2번)만 플래시, Legend(8번)은 즉시 공개

### 로직 검토 결과
- **문제점:** Hidden(1% 최희귀)이 Legend보다 뒤에 있으면 플래시 없이 공개됨 → 임팩트 부족
- **개선안:** 
  - (A) Hidden > Legend 우선순위 적용 — Hidden이 있으면 Hidden 먼저 플래시
  - (B) 모든 특수 등급 순차 플래시 — 첫 번째 끝나면 다음 특수 등급도 플래시
  - (C) 현재 유지 (순서 기반) — 단순하고 예측 가능
- **권장:** (A) Hidden 우선 플래시가 가장 자연스러움

### 수정 필요 파일 (개선 시)
- `src/renderer/components/GachaMultiAnimation.tsx` — `revealAll` 함수의 `findIndex` 로직

---

## 변경 이력
| 날짜 | 항목 | 상태 |
|------|------|------|
| 2026-04-02 | 되팔기 가격 수정 (3/5/10/50/100) | ✅ 완료 |
| 2026-04-02 | Hidden 종 정보 "???" 처리 | ✅ 완료 |
| 2026-04-02 | 감정 액션 버튼 개편 | 📋 예정 |
| 2026-04-02 | 공룡 이름 표시 | 🤔 검토 중 |
| 2026-04-02 | Legend/Hidden 연출 우선순위 | 📋 검토 후 결정 |
