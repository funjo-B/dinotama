import type { DinoRarity, DinoSpeciesId, DinoSpeciesDef } from '../types';

// 실제 아트 스프라이트가 있는 종 목록 — 이 종은 imageRendering: 'auto' (스무스) 로 렌더링
export const REAL_SPRITE_SPECIES = new Set<DinoSpeciesId>([
  'tyrannosaurus',
  'tupuxuara',
]);

// 멀티프레임 스프라이트 정보 — `종_이모션` 키로 프레임 수 지정 (기본 1)
export const SPRITE_FRAME_COUNTS: Record<string, number> = {
  'tupuxuara_excited': 3,
};

export const SELL_PRICES: Record<DinoRarity, number> = {
  common: 5,
  rare: 15,
  epic: 50,
  legend: 200,
  hidden: 500,
};

// 단계별 판매가 배율: 유년기 ×1 / 성장기 ×2 / 성체 ×4
export const STAGE_SELL_MULTIPLIER: Record<string, number> = {
  egg:   1,
  baby:  1,
  teen:  2,
  adult: 4,
};

export const SPECIES_POOL: Record<DinoRarity, DinoSpeciesId[]> = {
  common:  ['stegosaurus', 'parasaurolophus', 'iguanodon', 'dilophosaurus', 'compsognathus', 'dimorphodon', 'rhamphorhynchus', 'ichthyosaurus'],
  rare:    ['triceratops', 'ankylosaurus', 'pachycephalosaurus', 'allosaurus', 'carnotaurus', 'pteranodon', 'plesiosaurus', 'kronosaurus'],
  epic:    ['brachiosaurus', 'stegoceras', 'spinosaurus', 'baryonyx', 'quetzalcoatlus', 'mosasaurus', 'elasmosaurus'],
  legend:  ['argentinosaurus', 'tyrannosaurus', 'giganotosaurus', 'velociraptor', 'tupuxuara'],
  hidden:  ['chicken'],
};

export const SPECIES_DEFS: Record<DinoSpeciesId, DinoSpeciesDef> = {
  // ── COMMON (8) ──────────────────────────────────────────────────────────────
  stegosaurus:        { id: 'stegosaurus',        nameKo: '스테고사우루스',     nameEn: 'Stegosaurus',        rarity: 'common', baseColor: '#4ade80', diet: 'herbivore' },
  parasaurolophus:    { id: 'parasaurolophus',    nameKo: '파라사우롤로푸스',   nameEn: 'Parasaurolophus',    rarity: 'common', baseColor: '#86efac', diet: 'herbivore' },
  iguanodon:          { id: 'iguanodon',          nameKo: '이구아노돈',         nameEn: 'Iguanodon',          rarity: 'common', baseColor: '#a3e635', diet: 'herbivore' },
  dilophosaurus:      { id: 'dilophosaurus',      nameKo: '딜로포사우루스',     nameEn: 'Dilophosaurus',      rarity: 'common', baseColor: '#22d3ee', diet: 'carnivore' },
  compsognathus:      { id: 'compsognathus',      nameKo: '콤프소그나투스',     nameEn: 'Compsognathus',      rarity: 'common', baseColor: '#67e8f9', diet: 'carnivore' },
  dimorphodon:        { id: 'dimorphodon',        nameKo: '디모르포돈',         nameEn: 'Dimorphodon',        rarity: 'common', baseColor: '#7dd3fc', diet: 'flyer'     },
  rhamphorhynchus:    { id: 'rhamphorhynchus',    nameKo: '람포린쿠스',         nameEn: 'Rhamphorhynchus',    rarity: 'common', baseColor: '#93c5fd', diet: 'flyer'     },
  ichthyosaurus:      { id: 'ichthyosaurus',      nameKo: '익티오사우루스',     nameEn: 'Ichthyosaurus',      rarity: 'common', baseColor: '#60a5fa', diet: 'aquatic'   },

  // ── RARE (8) ────────────────────────────────────────────────────────────────
  triceratops:        { id: 'triceratops',        nameKo: '트리케라톱스',       nameEn: 'Triceratops',        rarity: 'rare',   baseColor: '#f97316', diet: 'herbivore' },
  ankylosaurus:       { id: 'ankylosaurus',       nameKo: '안킬로사우루스',     nameEn: 'Ankylosaurus',       rarity: 'rare',   baseColor: '#94a3b8', diet: 'herbivore' },
  pachycephalosaurus: { id: 'pachycephalosaurus', nameKo: '파키케팔로사우루스', nameEn: 'Pachycephalosaurus', rarity: 'rare',   baseColor: '#6366f1', diet: 'herbivore' },
  allosaurus:         { id: 'allosaurus',         nameKo: '알로사우루스',       nameEn: 'Allosaurus',         rarity: 'rare',   baseColor: '#f59e0b', diet: 'carnivore' },
  carnotaurus:        { id: 'carnotaurus',        nameKo: '카르노타우루스',     nameEn: 'Carnotaurus',        rarity: 'rare',   baseColor: '#ef4444', diet: 'carnivore' },
  pteranodon:         { id: 'pteranodon',         nameKo: '프테라노돈',         nameEn: 'Pteranodon',         rarity: 'rare',   baseColor: '#06b6d4', diet: 'flyer'     },
  plesiosaurus:       { id: 'plesiosaurus',       nameKo: '플레시오사우루스',   nameEn: 'Plesiosaurus',       rarity: 'rare',   baseColor: '#2dd4bf', diet: 'aquatic'   },
  kronosaurus:        { id: 'kronosaurus',        nameKo: '크로노사우루스',     nameEn: 'Kronosaurus',        rarity: 'rare',   baseColor: '#0ea5e9', diet: 'aquatic'   },

  // ── EPIC (7) ────────────────────────────────────────────────────────────────
  brachiosaurus:      { id: 'brachiosaurus',      nameKo: '브라키오사우루스',   nameEn: 'Brachiosaurus',      rarity: 'epic',   baseColor: '#c084fc', diet: 'herbivore' },
  stegoceras:         { id: 'stegoceras',         nameKo: '스테고케라스',       nameEn: 'Stegoceras',         rarity: 'epic',   baseColor: '#d8b4fe', diet: 'herbivore' },
  spinosaurus:        { id: 'spinosaurus',        nameKo: '스피노사우루스',     nameEn: 'Spinosaurus',        rarity: 'epic',   baseColor: '#f472b6', diet: 'carnivore' },
  baryonyx:           { id: 'baryonyx',           nameKo: '바리오닉스',         nameEn: 'Baryonyx',           rarity: 'epic',   baseColor: '#e879f9', diet: 'carnivore' },
  quetzalcoatlus:     { id: 'quetzalcoatlus',     nameKo: '케찰코아틀루스',     nameEn: 'Quetzalcoatlus',     rarity: 'epic',   baseColor: '#818cf8', diet: 'flyer'     },
  mosasaurus:         { id: 'mosasaurus',         nameKo: '모사사우루스',       nameEn: 'Mosasaurus',         rarity: 'epic',   baseColor: '#a78bfa', diet: 'aquatic'   },
  elasmosaurus:       { id: 'elasmosaurus',       nameKo: '엘라스모사우루스',   nameEn: 'Elasmosaurus',       rarity: 'epic',   baseColor: '#f9a8d4', diet: 'aquatic'   },

  // ── LEGEND (5) ──────────────────────────────────────────────────────────────
  argentinosaurus:    { id: 'argentinosaurus',    nameKo: '아르젠티노사우루스', nameEn: 'Argentinosaurus',    rarity: 'legend', baseColor: '#fbbf24', diet: 'herbivore' },
  tyrannosaurus:      { id: 'tyrannosaurus',      nameKo: '티라노사우루스',     nameEn: 'Tyrannosaurus',      rarity: 'legend', baseColor: '#ef4444', diet: 'carnivore' },
  giganotosaurus:     { id: 'giganotosaurus',     nameKo: '기가노토사우루스',   nameEn: 'Giganotosaurus',     rarity: 'legend', baseColor: '#dc2626', diet: 'carnivore' },
  velociraptor:       { id: 'velociraptor',       nameKo: '벨로키랍토르',       nameEn: 'Velociraptor',       rarity: 'legend', baseColor: '#fb923c', diet: 'carnivore' },
  tupuxuara:          { id: 'tupuxuara',          nameKo: '투푸수아라',         nameEn: 'Tupuxuara',          rarity: 'legend', baseColor: '#f59e0b', diet: 'flyer'     },

  // ── HIDDEN (1) ──────────────────────────────────────────────────────────────
  chicken:            { id: 'chicken',            nameKo: '닭',                 nameEn: 'Chicken',            rarity: 'hidden', baseColor: '#ff6b6b', diet: 'special'   },
};
