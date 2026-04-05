// ─── DinoTama i18n ───
// 모든 UI 문자열을 한 곳에서 관리합니다.

export const translations = {
  ko: {
    loading: '불러오는 중...',

    // App context menu & TipButtons
    tip: {
      todo: 'TODO',
      collection: '컬렉션',
      settings: '환경설정',
      gacha: (coins: number) => `알 뽑기 (💰${coins})`,
    },
    menu: {
      rename: (name: string) => `✏️ 이름 변경 (${name})`,
      gacha: (coins: number) => `🥚 알 뽑기 (💰${coins})`,
      selectDino: '🦕 공룡 선택',
      stage: { egg: '🥚알', baby: '🐣아기', teen: '🦕청소년', adult: '🦖성체' },
      viewAll: (n: number) => `📦 전체 보기 (${n}마리)`,
      collection: '📦 컬렉션',
      todo: '📋 TODO',
      settings: '⚙️ 환경설정',
      testAlarm: '🔔 TODO 알림 테스트',
      addCoins: '💰 코인 1000 충전 (테스트)',
      position: '📍 위치',
      resetPos: '🔄 위치 초기화',
      savePos: '💾 현재 위치 기억',
      restorePos: '📍 기억한 위치로 이동',
      logout: '🔓 로그아웃',
      login: '🔐 Google 로그인',
    },

    // GachaAnimation
    gacha: {
      clickToOpen: '클릭하여 열기',
      hatched: '알에서 부화했다!',
      tapToClose: '탭하여 닫기',
    },

    // GachaMultiAnimation
    multi: {
      title: (n: number) => `✨ ${n}연 부화 결과`,
      tap: '탭',
      revealAll: '모두 열기',
      close: '닫기',
    },

    // GachaPanel
    gachaPanel: {
      title: '🥚 알 뽑기',
      pull1: '🥚 1회 (💰10)',
      pull5: '🥚×5 (💰50)',
      pull10: '🥚×10',
      epicPity: (n: number, max: number) => `Epic 천장: ${n}/${max}`,
      legendPity: (n: number, max: number) => `Legend 천장: ${n}/${max}`,
      hiddenPity: (n: number, max: number) => `Hidden 천장: ${n}/${max}`,
      totalPulls: (n: number) => `총 ${n}회 뽑기 완료`,
      adReward: '📺 광고 보고 30코인 받기',
      adRewardRemaining: (n: number) => `오늘 ${n}회 남음`,
      adRewardDone: '오늘 보상 소진',
      adRewardLogin: '로그인 후 이용 가능',
      coinHistory: '💰 코인 내역',
      noHistory: '내역이 없습니다',
    },
    checkin: {
      button: '출석',
      done: '출석완료',
      reward: (coins: number) => `+${coins} 코인!`,
      streak: (days: number) => `${days}일 연속`,
      bonus: '연속 출석 보너스!',
    },

    // CollectionPanel
    collection: {
      title: (n: number) => `📦 컬렉션 (${n}마리)`,
      all: '전체',
      stageLabel: { egg: '🥚 알', baby: '🐣 유년기', teen: '🦕 성장기', adult: '🦖 성체' },
      stageFilter: { egg: '🥚', baby: '🐣', teen: '🦕', adult: '🦖' },
      sold: (n: number) => `판매 ${n}회`,
      empty: '보유한 공룡이 없습니다',
      merge: '합성 ⚡',
      setActive: '🦕 대표로 설정',
      rename: '✏️ 이름 변경',
      sell: (price: number) => `💰 되팔기 (+${price}코인)`,
    },

    // TodoPanel
    todo: {
      title: 'TODO',
      syncDone: '☁ 동기화됨',
      syncing: '⏳ 동기화 중',
      notifyOn: '전체 알림 ON',
      notifyOff: '전체 알림 OFF',
      todaySchedule: '오늘 일정',
      noSchedule: '일정 없음',
      addPlaceholder: '할 일 추가...',
      empty: '할 일이 없습니다',
      dateLabel: { today: '오늘', tomorrow: '내일', yesterday: '어제', daysAfter: (n: number) => `${n}일 후`, daysBefore: (n: number) => `${Math.abs(n)}일 전` },
      backToToday: '오늘로',
      days: ['일', '월', '화', '수', '목', '금', '토'] as string[],
      formatDate: (month: number, date: number) => `${month}월 ${date}일`,
      formatShortDate: (d: Date) => d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
    },

    // MergeAnimation
    merge: {
      merging: '합성 중...',
      success: '합성 성공!',
      stageLabel: { egg: '알', baby: '유년기', teen: '성장기', adult: '성체' } as Record<string, string>,
      clickToClose: '클릭하여 닫기',
    },

    // TodoReminder
    reminder: {
      title: '🦕 이거 했어?',
      done: '했어! ✓',
      later: '나중에 ⏰',
    },

    // NotificationPopup
    notify: {
      minutesUntil: (n: number) => `📅 ${n}분 후 일정`,
      snooze: '5분 후 ⏰',
      ok: 'OK ✓',
    },

    // ShopPanel
    shop: {
      title: '🛒 상점',
      coinPacks: '코인 팩',
      premiumEggs: '프리미엄 알',
      loginRequired: '로그인 후 이용 가능합니다',
      checkoutFailed: '결제 페이지를 열 수 없습니다',
      footer: '결제는 Stripe를 통해 안전하게 처리됩니다',
    },

    // SettingsPanel
    settings: {
      title: '환경설정',
      language: '언어',
      alarm: '할 일 알람 간격',
      alarmDesc: '미완료 할 일을 주기적으로 알려드려요',
      alarmOff: '꺼짐',
      alarm15: '15분',
      alarm30: '30분',
      alarm60: '1시간',
      alarm120: '2시간',
      background: '배경',
      backgroundDesc: '공룡 창 배경을 흰색으로 표시합니다',
      bgOff: '투명 (기본)',
      bgOn: '흰색',
    },
  },

  en: {
    loading: 'Loading...',

    tip: {
      todo: 'TODO',
      collection: 'Collection',
      settings: 'Settings',
      gacha: (coins: number) => `Gacha (💰${coins})`,
    },
    menu: {
      rename: (name: string) => `✏️ Rename (${name})`,
      gacha: (coins: number) => `🥚 Gacha (💰${coins})`,
      selectDino: '🦕 Select Dino',
      stage: { egg: '🥚Egg', baby: '🐣Baby', teen: '🦕Teen', adult: '🦖Adult' },
      viewAll: (n: number) => `📦 View All (${n})`,
      collection: '📦 Collection',
      todo: '📋 TODO',
      settings: '⚙️ Settings',
      testAlarm: '🔔 Test TODO Alarm',
      addCoins: '💰 Add 1000 Coins (Test)',
      position: '📍 Position',
      resetPos: '🔄 Reset Position',
      savePos: '💾 Save Position',
      restorePos: '📍 Restore Position',
      logout: '🔓 Logout',
      login: '🔐 Google Login',
    },

    gacha: {
      clickToOpen: 'Click to open',
      hatched: 'Something hatched!',
      tapToClose: 'Tap to close',
    },

    multi: {
      title: (n: number) => `✨ ${n}x Hatch Result`,
      tap: 'Tap',
      revealAll: 'Reveal All',
      close: 'Close',
    },

    gachaPanel: {
      title: '🥚 Egg Gacha',
      pull1: '🥚 ×1 (💰10)',
      pull5: '🥚 ×5 (💰50)',
      pull10: '🥚 ×10',
      epicPity: (n: number, max: number) => `Epic Pity: ${n}/${max}`,
      legendPity: (n: number, max: number) => `Legend Pity: ${n}/${max}`,
      hiddenPity: (n: number, max: number) => `Hidden Pity: ${n}/${max}`,
      totalPulls: (n: number) => `Total: ${n} pulls`,
      adReward: '📺 Watch Ad for 30 Coins',
      adRewardRemaining: (n: number) => `${n} left today`,
      adRewardDone: 'Daily rewards used up',
      adRewardLogin: 'Login required',
      coinHistory: '💰 Coin History',
      noHistory: 'No history yet',
    },
    checkin: {
      button: 'Check-in',
      done: 'Checked in',
      reward: (coins: number) => `+${coins} coins!`,
      streak: (days: number) => `${days}-day streak`,
      bonus: 'Streak bonus!',
    },

    collection: {
      title: (n: number) => `📦 Collection (${n})`,
      all: 'All',
      stageLabel: { egg: '🥚 Egg', baby: '🐣 Baby', teen: '🦕 Teen', adult: '🦖 Adult' },
      stageFilter: { egg: '🥚', baby: '🐣', teen: '🦕', adult: '🦖' },
      sold: (n: number) => `Sold: ${n}`,
      empty: 'No dinosaurs yet',
      merge: 'Merge ⚡',
      setActive: '🦕 Set Active',
      rename: '✏️ Rename',
      sell: (price: number) => `💰 Sell (+${price} coins)`,
    },

    todo: {
      title: 'TODO',
      syncDone: '☁ Synced',
      syncing: '⏳ Syncing',
      notifyOn: 'Notify ON',
      notifyOff: 'Notify OFF',
      todaySchedule: "Today's Schedule",
      noSchedule: 'No events',
      addPlaceholder: 'Add a task...',
      empty: 'No tasks',
      dateLabel: { today: 'Today', tomorrow: 'Tomorrow', yesterday: 'Yesterday', daysAfter: (n: number) => `In ${n} days`, daysBefore: (n: number) => `${Math.abs(n)} days ago` },
      backToToday: 'Today',
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as string[],
      formatDate: (month: number, date: number) => {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${months[month - 1]} ${date}`;
      },
      formatShortDate: (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    },

    // MergeAnimation
    merge: {
      merging: 'Merging...',
      success: 'Evolution!',
      stageLabel: { egg: 'Egg', baby: 'Baby', teen: 'Teen', adult: 'Adult' } as Record<string, string>,
      clickToClose: 'Click to close',
    },

    reminder: {
      title: '🦕 Did you do this?',
      done: 'Done! ✓',
      later: 'Later ⏰',
    },

    notify: {
      minutesUntil: (n: number) => `📅 In ${n} min`,
      snooze: '5 min later ⏰',
      ok: 'OK ✓',
    },

    shop: {
      title: '🛒 Shop',
      coinPacks: 'Coin Packs',
      premiumEggs: 'Premium Eggs',
      loginRequired: 'Please log in first',
      checkoutFailed: 'Could not open checkout page',
      footer: 'Payments are securely processed via Stripe',
    },

    settings: {
      title: 'Settings',
      language: 'Language',
      alarm: 'Todo Reminder Interval',
      alarmDesc: 'Periodically reminds you of unfinished tasks',
      alarmOff: 'Off',
      alarm15: '15 min',
      alarm30: '30 min',
      alarm60: '1 hour',
      alarm120: '2 hours',
      background: 'Background',
      backgroundDesc: 'Show a white background behind the dino window',
      bgOff: 'Transparent (default)',
      bgOn: 'White',
    },
  },
} as const;

export type Translations = typeof translations.ko;
