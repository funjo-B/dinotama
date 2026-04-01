import type { DinoRarity, DinoSpeciesId, DinoSpeciesDef } from '../types';

export const SELL_PRICES: Record<DinoRarity, number> = {
  common: 5,
  rare: 15,
  epic: 50,
  legend: 200,
};

export const SPECIES_POOL: Record<DinoRarity, DinoSpeciesId[]> = {
  common: ['raptor', 'stegosaurus', 'parasaurolophus'],
  rare: ['triceratops', 'ankylosaurus', 'dilophosaurus'],
  epic: ['pterodactyl', 'spinosaurus'],
  legend: ['trex', 'brachiosaurus'],
};

export const SPECIES_DEFS: Record<DinoSpeciesId, DinoSpeciesDef> = {
  raptor:          { id: 'raptor',          nameKo: '랩터',           nameEn: 'Raptor',          rarity: 'common', baseColor: '#4ade80' },
  stegosaurus:     { id: 'stegosaurus',     nameKo: '스테고사우루스',  nameEn: 'Stegosaurus',     rarity: 'common', baseColor: '#60a5fa' },
  parasaurolophus: { id: 'parasaurolophus', nameKo: '파라사우롤로푸스', nameEn: 'Parasaurolophus', rarity: 'common', baseColor: '#a3e635' },
  triceratops:     { id: 'triceratops',     nameKo: '트리케라톱스',    nameEn: 'Triceratops',     rarity: 'rare',   baseColor: '#f97316' },
  ankylosaurus:    { id: 'ankylosaurus',    nameKo: '안킬로사우루스',  nameEn: 'Ankylosaurus',    rarity: 'rare',   baseColor: '#94a3b8' },
  dilophosaurus:   { id: 'dilophosaurus',   nameKo: '딜로포사우루스',  nameEn: 'Dilophosaurus',   rarity: 'rare',   baseColor: '#2dd4bf' },
  pterodactyl:     { id: 'pterodactyl',     nameKo: '프테라노돈',     nameEn: 'Pterodactyl',     rarity: 'epic',   baseColor: '#c084fc' },
  spinosaurus:     { id: 'spinosaurus',     nameKo: '스피노사우루스',  nameEn: 'Spinosaurus',     rarity: 'epic',   baseColor: '#f472b6' },
  trex:            { id: 'trex',            nameKo: '티렉스',         nameEn: 'T-Rex',           rarity: 'legend', baseColor: '#fbbf24' },
  brachiosaurus:   { id: 'brachiosaurus',   nameKo: '브라키오사우루스', nameEn: 'Brachiosaurus',  rarity: 'legend', baseColor: '#fb923c' },
};
