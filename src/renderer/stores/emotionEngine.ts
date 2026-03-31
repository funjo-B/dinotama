import type { DinoEmotion, DinoStats } from '@shared/types';

interface EmotionRule {
  condition: (stats: DinoStats) => boolean;
  emotion: DinoEmotion;
  priority: number; // Higher = more important
}

const EMOTION_RULES: EmotionRule[] = [
  // Critical states (highest priority)
  { condition: (s) => s.hunger < 20, emotion: 'hungry', priority: 100 },
  { condition: (s) => s.fatigue > 85, emotion: 'sleepy', priority: 90 },
  { condition: (s) => s.happiness < 20, emotion: 'sad', priority: 80 },

  // Positive states
  { condition: (s) => s.happiness > 80 && s.hunger > 60, emotion: 'happy', priority: 50 },
  { condition: (s) => s.happiness > 90 && s.fatigue < 30, emotion: 'excited', priority: 60 },
];

/** Determine emotion based on current stats */
export function resolveEmotion(stats: DinoStats): DinoEmotion {
  const matched = EMOTION_RULES
    .filter((rule) => rule.condition(stats))
    .sort((a, b) => b.priority - a.priority);

  return matched.length > 0 ? matched[0].emotion : 'idle';
}

/** External event triggers that override stat-based emotions temporarily */
export type EmotionTrigger =
  | 'calendar_ok'      // User acknowledged calendar reminder
  | 'calendar_snooze'  // User snoozed reminder
  | 'fed'              // Just fed
  | 'played'           // Just played
  | 'evolved'          // Just evolved
  | 'gacha_pull'       // Pulled gacha
  | 'gacha_legend';    // Got a legendary

const TRIGGER_EMOTIONS: Record<EmotionTrigger, { emotion: DinoEmotion; durationMs: number }> = {
  calendar_ok: { emotion: 'happy', durationMs: 5000 },
  calendar_snooze: { emotion: 'sad', durationMs: 3000 },
  fed: { emotion: 'happy', durationMs: 3000 },
  played: { emotion: 'excited', durationMs: 4000 },
  evolved: { emotion: 'excited', durationMs: 8000 },
  gacha_pull: { emotion: 'excited', durationMs: 3000 },
  gacha_legend: { emotion: 'excited', durationMs: 10000 },
};

export function getTriggerEmotion(trigger: EmotionTrigger) {
  return TRIGGER_EMOTIONS[trigger];
}
