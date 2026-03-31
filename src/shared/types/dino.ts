export type DinoStage = 'egg' | 'baby' | 'teen' | 'adult';

export type DinoEmotion = 'idle' | 'happy' | 'sad' | 'hungry' | 'sleepy' | 'excited';

export type DinoRarity = 'common' | 'rare' | 'epic' | 'legend';

export interface DinoStats {
  hunger: number;    // 0-100
  happiness: number; // 0-100
  fatigue: number;   // 0-100
}

export interface Dino {
  id: string;
  name: string;
  species: string;
  rarity: DinoRarity;
  stage: DinoStage;
  emotion: DinoEmotion;
  stats: DinoStats;
  birthTime: number;
  lastFedTime: number;
  lastPlayTime: number;
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
  lastSyncTime: number;
}
