export type DinoStage = 'egg' | 'baby' | 'teen' | 'adult';

export type DinoEmotion = 'idle' | 'idle1' | 'idle2' | 'idle3' | 'happy' | 'sad' | 'hungry' | 'sleepy' | 'excited';

export type DinoRarity = 'common' | 'rare' | 'epic' | 'legend' | 'hidden';

export type DinoSpeciesId =
  // COMMON (8)
  | 'stegosaurus' | 'parasaurolophus' | 'iguanodon' | 'dilophosaurus'
  | 'compsognathus' | 'dimorphodon' | 'rhamphorhynchus' | 'ichthyosaurus'
  // RARE (8)
  | 'triceratops' | 'ankylosaurus' | 'pachycephalosaurus' | 'allosaurus'
  | 'carnotaurus' | 'pteranodon' | 'plesiosaurus' | 'kronosaurus'
  // EPIC (7)
  | 'brachiosaurus' | 'stegoceras' | 'spinosaurus' | 'baryonyx'
  | 'quetzalcoatlus' | 'mosasaurus' | 'elasmosaurus'
  // LEGEND (5)
  | 'argentinosaurus' | 'tyrannosaurus' | 'giganotosaurus' | 'velociraptor' | 'tupuxuara'
  // HIDDEN (1)
  | 'chicken';

export type DinoDiet = 'herbivore' | 'carnivore' | 'flyer' | 'aquatic' | 'special';

export interface DinoSpeciesDef {
  id: DinoSpeciesId;
  nameKo: string;
  nameEn: string;
  rarity: DinoRarity;
  baseColor: string;
  diet: DinoDiet;
}

export interface DinoStats {
  hunger: number;    // 0-100
  happiness: number; // 0-100
  fatigue: number;   // 0-100
}

export interface Dino {
  id: string;
  name: string;
  species: DinoSpeciesId;
  rarity: DinoRarity;
  stage: DinoStage;
  birthTime: number;
  stageProgress: number; // 0-100, progress to next stage
}

export interface GachaResult {
  dino: Dino;
  rarity: DinoRarity;
  isNew: boolean;
}

export interface GachaState {
  totalPulls: number;
  pullsSinceEpic: number;
  pullsSinceLegend: number;
  pullsSinceHidden: number;
}

export type CoinTxType = 'gacha' | 'sell' | 'ad_reward' | 'daily_checkin' | 'streak_bonus';

export interface CoinTransaction {
  id: string;
  type: CoinTxType;
  amount: number;       // + 획득, - 소비
  balance: number;      // 거래 후 잔액
  label: string;        // "10연 뽑기", "스테고사우루스 판매" 등
  timestamp: number;
}

export interface AttendanceState {
  lastCheckDate: string;   // YYYY-MM-DD
  streak: number;          // 연속 출석 일수
  totalCheckins: number;   // 누적 출석
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  lastCheckedDate?: string;
  notify: boolean;
}

export interface UserData {
  uid: string;
  displayName: string;
  email: string;
  coins: number;
  premiumCurrency: number;
  dinos: Dino[];
  activeDinoId: string | null;
  gacha: GachaState;
  totalSold: number;
  coinHistory: CoinTransaction[];
  attendance: AttendanceState;
  adRewardUsedToday: number;
  lastAdRewardDate: string;
  lastSyncTime: number;
  todos?: TodoItem[];
}
