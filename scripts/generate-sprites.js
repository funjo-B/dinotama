/**
 * Generate placeholder pixel art sprites for DinoTama
 * 4 rarities x 4 stages x 6 emotions = 96 sprites (72x72 PNG)
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { createCanvas, encodePNG } = (() => {
  function createCanvas(w, h) {
    const pixels = Buffer.alloc(w * h * 4, 0);
    return {
      width: w, height: h, pixels,
      setPixel(x, y, r, g, b, a = 255) {
        if (x < 0 || x >= w || y < 0 || y >= h) return;
        const idx = (y * w + x) * 4;
        pixels[idx] = r; pixels[idx+1] = g; pixels[idx+2] = b; pixels[idx+3] = a;
      },
      fillRect(x, y, rw, rh, r, g, b, a = 255) {
        for (let dy = 0; dy < rh; dy++)
          for (let dx = 0; dx < rw; dx++)
            this.setPixel(x+dx, y+dy, r, g, b, a);
      },
      fillCircle(cx, cy, radius, r, g, b, a = 255) {
        for (let dy = -radius; dy <= radius; dy++)
          for (let dx = -radius; dx <= radius; dx++)
            if (dx*dx + dy*dy <= radius*radius)
              this.setPixel(Math.round(cx+dx), Math.round(cy+dy), r, g, b, a);
      },
    };
  }

  function encodePNG(canvas) {
    const { width: w, height: h, pixels } = canvas;
    const sig = Buffer.from([137,80,78,71,13,10,26,10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w,0); ihdr.writeUInt32BE(h,4);
    ihdr[8]=8; ihdr[9]=6;
    const raw = Buffer.alloc(h*(1+w*4));
    for (let y=0;y<h;y++) {
      raw[y*(1+w*4)]=0;
      for (let x=0;x<w;x++) {
        const s=(y*w+x)*4, d=y*(1+w*4)+1+x*4;
        raw[d]=pixels[s]; raw[d+1]=pixels[s+1]; raw[d+2]=pixels[s+2]; raw[d+3]=pixels[s+3];
      }
    }
    const compressed = zlib.deflateSync(raw);
    function chunk(type, data) {
      const t=Buffer.from(type), len=Buffer.alloc(4);
      len.writeUInt32BE(data.length,0);
      const cd=Buffer.concat([t,data]);
      let c=0xFFFFFFFF;
      for(let i=0;i<cd.length;i++){c^=cd[i];for(let j=0;j<8;j++)c=(c>>>1)^(c&1?0xEDB88320:0);}
      c^=0xFFFFFFFF; const cb=Buffer.alloc(4); cb.writeUInt32BE(c>>>0,0);
      return Buffer.concat([len,t,data,cb]);
    }
    return Buffer.concat([sig, chunk('IHDR',ihdr), chunk('IDAT',compressed), chunk('IEND',Buffer.alloc(0))]);
  }

  return { createCanvas, encodePNG };
})();

// ---- Rarity color palettes ----
const RARITY_PALETTES = {
  common: {
    body:  [74, 222, 128],   // green
    belly: [134, 239, 172],
    spot:  [34, 197, 94],
    spike: [22, 163, 74],
    horn:  [34, 197, 94],
    accent: [187, 247, 208],
  },
  rare: {
    body:  [96, 165, 250],   // blue
    belly: [147, 197, 253],
    spot:  [59, 130, 246],
    spike: [37, 99, 235],
    horn:  [59, 130, 246],
    accent: [191, 219, 254],
  },
  epic: {
    body:  [232, 85, 85],    // red/fire
    belly: [252, 165, 130],
    spot:  [220, 38, 38],
    spike: [185, 28, 28],
    horn:  [251, 146, 60],
    accent: [254, 202, 202],
  },
  legend: {
    body:  [251, 191, 36],   // gold
    belly: [253, 224, 120],
    spot:  [245, 158, 11],
    spike: [217, 119, 6],
    horn:  [255, 255, 255],
    accent: [254, 240, 138],
  },
};

const EYE = [30, 30, 30];
const TEAR = [100, 180, 255];
const WHITE = [255, 255, 255];

// ---- Draw functions (take palette) ----

function drawEgg(c, p, emotion) {
  const cx = 36, cy = 38;
  // Egg oval
  for (let y = -18; y <= 18; y++) {
    const rx = Math.round(14 * Math.sqrt(1 - (y*y)/(18*18)));
    c.fillRect(cx-rx, cy+y, rx*2, 1, ...p.body);
  }
  // Spots
  c.fillCircle(cx-5, cy-6, 3, ...p.spot);
  c.fillCircle(cx+6, cy+2, 2, ...p.spot);
  c.fillCircle(cx-2, cy+8, 2, ...p.spot);
  // Shine
  c.fillCircle(cx-6, cy-10, 2, ...p.accent);

  if (emotion === 'happy' || emotion === 'excited') {
    // Cracks
    c.fillRect(cx-8, cy-2, 4, 1, ...WHITE);
    c.fillRect(cx-6, cy-1, 3, 1, ...WHITE);
    c.fillRect(cx-7, cy, 5, 1, ...WHITE);
    c.fillRect(cx+4, cy+3, 3, 1, ...WHITE);
    c.fillRect(cx+5, cy+4, 4, 1, ...WHITE);
  }
  if (emotion === 'sad') {
    // Sweat drops
    c.fillRect(cx+10, cy-8, 2, 3, ...TEAR);
    c.fillRect(cx+10, cy-4, 2, 2, ...TEAR);
  }
  if (emotion === 'sleepy') {
    // Zzz
    c.fillRect(cx+12, cy-14, 4, 1, ...p.accent);
    c.fillRect(cx+14, cy-17, 5, 1, ...p.accent);
    c.fillRect(cx+17, cy-20, 6, 1, ...p.accent);
  }
  if (emotion === 'hungry') {
    // Wobble lines
    c.fillRect(cx-18, cy-2, 3, 1, ...p.spot);
    c.fillRect(cx+16, cy-2, 3, 1, ...p.spot);
    c.fillRect(cx-17, cy+2, 3, 1, ...p.spot);
    c.fillRect(cx+15, cy+2, 3, 1, ...p.spot);
  }
}

function drawBaby(c, p, emotion) {
  const cx = 36, cy = 36;
  // Body
  c.fillCircle(cx, cy+2, 16, ...p.body);
  c.fillCircle(cx, cy+6, 10, ...p.belly);
  // Head
  c.fillCircle(cx, cy-10, 12, ...p.body);
  // Small bumps on head
  c.fillCircle(cx-4, cy-22, 3, ...p.spike);
  c.fillCircle(cx+4, cy-22, 3, ...p.spike);

  // Eyes
  if (emotion === 'happy' || emotion === 'excited') {
    c.fillRect(cx-7, cy-12, 5, 2, ...EYE);
    c.fillRect(cx+3, cy-12, 5, 2, ...EYE);
    if (emotion === 'excited') {
      c.fillRect(cx-6, cy-14, 3, 1, ...p.accent);
      c.fillRect(cx+4, cy-14, 3, 1, ...p.accent);
    }
  } else if (emotion === 'sleepy') {
    c.fillRect(cx-7, cy-11, 5, 1, ...EYE);
    c.fillRect(cx+3, cy-11, 5, 1, ...EYE);
    c.fillRect(cx+12, cy-20, 4, 1, ...p.accent);
    c.fillRect(cx+14, cy-23, 5, 1, ...p.accent);
  } else if (emotion === 'sad') {
    c.fillCircle(cx-5, cy-11, 2, ...EYE);
    c.fillCircle(cx+5, cy-11, 2, ...EYE);
    c.fillRect(cx-5, cy-8, 1, 5, ...TEAR);
    c.fillRect(cx+5, cy-8, 1, 5, ...TEAR);
  } else if (emotion === 'hungry') {
    c.fillCircle(cx-5, cy-11, 2, ...EYE);
    c.fillCircle(cx+5, cy-11, 2, ...EYE);
    c.fillCircle(cx, cy-5, 3, ...EYE);
  } else {
    c.fillCircle(cx-5, cy-11, 2, ...EYE);
    c.fillCircle(cx+5, cy-11, 2, ...EYE);
    c.fillCircle(cx-4, cy-11, 1, ...WHITE);
    c.fillCircle(cx+6, cy-11, 1, ...WHITE);
  }
  // Mouth (non-hungry)
  if (emotion === 'happy') {
    c.fillRect(cx-3, cy-6, 7, 1, ...EYE);
    c.fillRect(cx-2, cy-5, 5, 1, ...EYE);
  } else if (emotion !== 'hungry') {
    c.fillRect(cx-2, cy-6, 5, 1, ...EYE);
  }
  // Feet
  c.fillRect(cx-8, cy+16, 5, 3, ...p.body);
  c.fillRect(cx+4, cy+16, 5, 3, ...p.body);
  // Tiny tail
  c.fillRect(cx+12, cy+6, 4, 3, ...p.body);
}

function drawTeen(c, p, emotion) {
  const cx = 36, cy = 34;
  // Body
  c.fillCircle(cx, cy+6, 18, ...p.body);
  c.fillCircle(cx, cy+10, 14, ...p.belly);
  // Head
  c.fillCircle(cx, cy-10, 14, ...p.body);
  // 3 spikes
  c.fillRect(cx-2, cy-26, 4, 6, ...p.spike);
  c.fillRect(cx-8, cy-23, 4, 5, ...p.spike);
  c.fillRect(cx+5, cy-23, 4, 5, ...p.spike);

  // Eyes
  if (emotion === 'happy' || emotion === 'excited') {
    c.fillRect(cx-7, cy-13, 5, 2, ...EYE);
    c.fillRect(cx+3, cy-13, 5, 2, ...EYE);
    if (emotion === 'excited') {
      c.fillRect(cx-6, cy-15, 3, 1, ...p.horn);
      c.fillRect(cx+4, cy-15, 3, 1, ...p.horn);
    }
  } else if (emotion === 'sad') {
    c.fillCircle(cx-5, cy-12, 2, ...EYE);
    c.fillCircle(cx+5, cy-12, 2, ...EYE);
    c.fillRect(cx-5, cy-9, 2, 5, ...TEAR);
    c.fillRect(cx+5, cy-9, 2, 5, ...TEAR);
  } else if (emotion === 'hungry') {
    c.fillCircle(cx-5, cy-12, 2, ...EYE);
    c.fillCircle(cx+5, cy-12, 2, ...EYE);
    c.fillCircle(cx, cy-5, 4, ...EYE);
  } else if (emotion === 'sleepy') {
    c.fillRect(cx-7, cy-12, 5, 1, ...EYE);
    c.fillRect(cx+3, cy-12, 5, 1, ...EYE);
    c.fillRect(cx+14, cy-18, 4, 1, ...p.accent);
    c.fillRect(cx+16, cy-21, 5, 1, ...p.accent);
  } else {
    c.fillCircle(cx-5, cy-12, 3, ...EYE);
    c.fillCircle(cx+5, cy-12, 3, ...EYE);
    c.fillCircle(cx-4, cy-12, 1, ...WHITE);
    c.fillCircle(cx+6, cy-12, 1, ...WHITE);
  }

  // Arms
  c.fillRect(cx-20, cy+2, 5, 4, ...p.body);
  c.fillRect(cx+16, cy+2, 5, 4, ...p.body);
  // Claws
  c.fillRect(cx-21, cy+5, 2, 2, ...p.spike);
  c.fillRect(cx+20, cy+5, 2, 2, ...p.spike);
  // Feet
  c.fillRect(cx-10, cy+22, 7, 4, ...p.body);
  c.fillRect(cx+4, cy+22, 7, 4, ...p.body);
  // Tail
  c.fillRect(cx+16, cy+14, 6, 3, ...p.body);
  c.fillRect(cx+20, cy+12, 5, 3, ...p.body);
  c.fillRect(cx+23, cy+10, 3, 2, ...p.spike);
}

function drawAdult(c, p, emotion) {
  const cx = 36, cy = 32;
  // Body
  c.fillCircle(cx, cy+8, 20, ...p.body);
  c.fillCircle(cx, cy+12, 14, ...p.belly);
  // Head
  c.fillCircle(cx, cy-12, 16, ...p.body);
  // Horn
  c.fillRect(cx-2, cy-30, 5, 7, ...p.horn);
  c.fillRect(cx-1, cy-35, 3, 5, ...p.horn);
  // Back spikes
  for (let i = 0; i < 4; i++) {
    c.fillRect(cx+14+i*3, cy-2+i*4, 4, 4, ...p.spike);
  }
  // Chest plate accent
  c.fillCircle(cx, cy+6, 6, ...p.accent, 180);

  // Eyes
  if (emotion === 'happy' || emotion === 'excited') {
    c.fillRect(cx-8, cy-15, 6, 2, ...EYE);
    c.fillRect(cx+3, cy-15, 6, 2, ...EYE);
    if (emotion === 'excited') {
      // Star sparkles
      c.fillRect(cx-6, cy-17, 2, 1, ...p.horn);
      c.fillRect(cx+5, cy-17, 2, 1, ...p.horn);
      c.fillRect(cx-5, cy-18, 1, 1, ...p.horn);
      c.fillRect(cx+6, cy-18, 1, 1, ...p.horn);
    }
  } else if (emotion === 'sad') {
    c.fillCircle(cx-5, cy-14, 3, ...EYE);
    c.fillCircle(cx+5, cy-14, 3, ...EYE);
    c.fillRect(cx-6, cy-10, 2, 7, ...TEAR);
    c.fillRect(cx+5, cy-10, 2, 7, ...TEAR);
  } else if (emotion === 'hungry') {
    c.fillCircle(cx-5, cy-14, 3, ...EYE);
    c.fillCircle(cx+5, cy-14, 3, ...EYE);
    c.fillCircle(cx, cy-5, 5, ...EYE);
    c.fillCircle(cx, cy-5, 3, ...p.belly);
  } else if (emotion === 'sleepy') {
    c.fillRect(cx-8, cy-14, 6, 2, ...EYE);
    c.fillRect(cx+3, cy-14, 6, 2, ...EYE);
    c.fillRect(cx+16, cy-24, 5, 1, ...p.accent);
    c.fillRect(cx+19, cy-27, 6, 1, ...p.accent);
    c.fillRect(cx+22, cy-30, 7, 1, ...p.accent);
  } else {
    c.fillCircle(cx-5, cy-14, 3, ...EYE);
    c.fillCircle(cx+5, cy-14, 3, ...EYE);
    c.fillCircle(cx-4, cy-14, 1, ...WHITE);
    c.fillCircle(cx+6, cy-14, 1, ...WHITE);
  }

  // Arms
  c.fillRect(cx-22, cy+2, 6, 5, ...p.body);
  c.fillRect(cx+17, cy+2, 6, 5, ...p.body);
  c.fillRect(cx-23, cy+6, 3, 2, ...p.spike);
  c.fillRect(cx+22, cy+6, 3, 2, ...p.spike);
  // Feet
  c.fillRect(cx-12, cy+26, 8, 5, ...p.body);
  c.fillRect(cx+5, cy+26, 8, 5, ...p.body);
  c.fillRect(cx-13, cy+30, 3, 2, ...p.spike);
  c.fillRect(cx+12, cy+30, 3, 2, ...p.spike);
  // Tail
  c.fillRect(cx+18, cy+16, 7, 4, ...p.body);
  c.fillRect(cx+23, cy+13, 5, 4, ...p.body);
  c.fillRect(cx+26, cy+10, 4, 4, ...p.body);
  c.fillRect(cx+28, cy+8, 3, 3, ...p.spike);
}

// ---- Generate ----
const stages = ['egg', 'baby', 'teen', 'adult'];
const emotions = ['idle', 'happy', 'sad', 'hungry', 'sleepy', 'excited'];
const rarities = ['common', 'rare', 'epic', 'legend'];
const drawFns = { egg: drawEgg, baby: drawBaby, teen: drawTeen, adult: drawAdult };
const baseDir = path.join(__dirname, '..', 'public', 'assets', 'sprites');

let count = 0;
for (const rarity of rarities) {
  const palette = RARITY_PALETTES[rarity];

  for (const stage of stages) {
    // Rarity-specific folder: sprites/<stage>/<rarity>/
    const dir = path.join(baseDir, stage, rarity);
    fs.mkdirSync(dir, { recursive: true });

    for (const emotion of emotions) {
      const canvas = createCanvas(72, 72);
      drawFns[stage](canvas, palette, emotion);
      const filename = `sprite_${stage}_${emotion}_01.png`;
      fs.writeFileSync(path.join(dir, filename), encodePNG(canvas));
      count++;
    }
  }

  // Also write default (without rarity subfolder) as common for backwards compat
  if (rarity === 'common') {
    for (const stage of stages) {
      const dir = path.join(baseDir, stage);
      for (const emotion of emotions) {
        const canvas = createCanvas(72, 72);
        drawFns[stage](canvas, palette, emotion);
        const filename = `sprite_${stage}_${emotion}_01.png`;
        fs.writeFileSync(path.join(dir, filename), encodePNG(canvas));
        count++;
      }
    }
  }
}

console.log(`Generated ${count} sprites in ${baseDir}`);
console.log(`Rarities: ${rarities.join(', ')}`);
console.log(`  Common = Green, Rare = Blue, Epic = Red, Legend = Gold`);
