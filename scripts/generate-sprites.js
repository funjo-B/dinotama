/**
 * Generate placeholder sprites for all species/stage/emotion combinations.
 * Run: node scripts/generate-sprites.js
 *
 * Generates 72x72 PNG files using simple Canvas drawing.
 * Each species gets a unique color + initial letter.
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SPECIES = {
  raptor:          { label: 'R', color: '#4ade80' },
  stegosaurus:     { label: 'St', color: '#60a5fa' },
  parasaurolophus: { label: 'Pa', color: '#a3e635' },
  triceratops:     { label: 'Tr', color: '#f97316' },
  ankylosaurus:    { label: 'An', color: '#94a3b8' },
  dilophosaurus:   { label: 'Di', color: '#2dd4bf' },
  pterodactyl:     { label: 'Pt', color: '#c084fc' },
  spinosaurus:     { label: 'Sp', color: '#f472b6' },
  trex:            { label: 'T', color: '#fbbf24' },
  brachiosaurus:   { label: 'Br', color: '#fb923c' },
};

const STAGES = ['egg', 'baby', 'teen', 'adult'];
const EMOTIONS = ['idle', 'happy', 'sad', 'hungry', 'sleepy', 'excited'];

const SIZE = 72;
const STAGE_SCALE = { egg: 0.5, baby: 0.6, teen: 0.8, adult: 1.0 };

const EMOTION_MODS = {
  idle:    { brightness: 1.0, suffix: '' },
  happy:   { brightness: 1.15, suffix: '^^' },
  sad:     { brightness: 0.7, suffix: 'TT' },
  hungry:  { brightness: 0.85, suffix: '><' },
  sleepy:  { brightness: 0.6, suffix: 'zZ' },
  excited: { brightness: 1.2, suffix: '!!' },
};

function adjustBrightness(hex, factor) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const clamp = (v) => Math.min(255, Math.max(0, Math.round(v * factor)));
  return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`;
}

function drawDino(ctx, species, stage, emotion) {
  const { label, color } = SPECIES[species];
  const scale = STAGE_SCALE[stage];
  const mod = EMOTION_MODS[emotion];
  const adjustedColor = adjustBrightness(color, mod.brightness);

  const cx = SIZE / 2;
  const cy = SIZE / 2;

  ctx.clearRect(0, 0, SIZE, SIZE);

  // Body
  ctx.fillStyle = adjustedColor;
  ctx.beginPath();

  if (stage === 'egg') {
    ctx.ellipse(cx, cy + 4, 18 * scale, 22 * scale, 0, 0, Math.PI * 2);
  } else if (stage === 'baby') {
    ctx.ellipse(cx, cy + 6, 16 * scale, 18 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy - 14 * scale, 10 * scale, 10 * scale, 0, 0, Math.PI * 2);
  } else if (stage === 'teen') {
    ctx.ellipse(cx, cy + 4, 20 * scale, 22 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy - 18 * scale, 12 * scale, 11 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 18 * scale, cy + 10);
    ctx.lineTo(cx - 28 * scale, cy + 2);
    ctx.lineTo(cx - 16 * scale, cy + 14);
    ctx.closePath();
  } else {
    ctx.ellipse(cx, cy + 2, 24 * scale, 26 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 6, cy - 22 * scale, 14 * scale, 12 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 22 * scale, cy + 8);
    ctx.lineTo(cx - 34 * scale, cy - 4);
    ctx.lineTo(cx - 20 * scale, cy + 14);
    ctx.closePath();
  }
  ctx.fill();

  // Eyes (not on egg)
  if (stage !== 'egg') {
    const eyeY = stage === 'baby' ? cy - 14 * scale : stage === 'teen' ? cy - 18 * scale : cy - 22 * scale;
    const eyeX = stage === 'adult' ? cx + 6 : cx;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(eyeX - 4, eyeY, 2.5, 0, Math.PI * 2);
    ctx.arc(eyeX + 4, eyeY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(eyeX - 3.5, eyeY + 0.5, 1.2, 0, Math.PI * 2);
    ctx.arc(eyeX + 4.5, eyeY + 0.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Species label
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `bold ${stage === 'egg' ? 14 : 11}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cy + (stage === 'egg' ? 4 : 8));

  // Emotion indicator
  if (mod.suffix) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '9px sans-serif';
    ctx.fillText(mod.suffix, cx + 16, cy - 20);
  }

  // Egg crack pattern
  if (stage === 'egg') {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx - 2, cy - 5);
    ctx.lineTo(cx + 4, cy + 2);
    ctx.lineTo(cx + 10, cy - 3);
    ctx.stroke();
  }
}

// Main
const outDir = path.resolve(__dirname, '..', 'public', 'assets', 'sprites');

let count = 0;
for (const stage of STAGES) {
  for (const species of Object.keys(SPECIES)) {
    const dir = path.join(outDir, stage, species);
    fs.mkdirSync(dir, { recursive: true });

    for (const emotion of EMOTIONS) {
      const canvas = createCanvas(SIZE, SIZE);
      const ctx = canvas.getContext('2d');
      drawDino(ctx, species, stage, emotion);

      const filename = `sprite_${stage}_${emotion}_01.png`;
      const filepath = path.join(dir, filename);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(filepath, buffer);
      count++;
    }
  }
}

console.log(`[generate-sprites] Generated ${count} sprites in ${outDir}`);
