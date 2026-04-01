/**
 * Generate detailed placeholder sprites for all species/stage/emotion combinations.
 * Each species has a unique, larger silhouette with distinctive features.
 * Run: node scripts/generate-sprites.js
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZE = 128;
const cx = SIZE / 2;
const cy = SIZE / 2;

const STAGES = ['egg', 'baby', 'teen', 'adult'];
const EMOTIONS = ['idle', 'happy', 'sad', 'hungry', 'sleepy', 'excited'];

const EMOTION_MODS = {
  idle:    { brightness: 1.0, suffix: '' },
  happy:   { brightness: 1.1, suffix: '♥' },
  sad:     { brightness: 0.7, suffix: '...' },
  hungry:  { brightness: 0.85, suffix: '' },
  sleepy:  { brightness: 0.6, suffix: 'z' },
  excited: { brightness: 1.15, suffix: '!' },
};

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function adjustColor(hex, factor) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const cl = (v) => Math.min(255, Math.max(0, Math.round(v * factor)));
  return `rgb(${cl(r)},${cl(g)},${cl(b)})`;
}

function drawEyes(ctx, x, y, size, emotion) {
  const s = size;
  // White
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(x - s * 0.6, y, s, s * 1.1, 0, 0, Math.PI * 2);
  ctx.ellipse(x + s * 0.6, y, s, s * 1.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  ctx.fillStyle = '#1a1a2e';
  const pupilSize = s * 0.55;
  if (emotion === 'happy' || emotion === 'excited') {
    // Happy eyes (^ ^)
    ctx.lineWidth = s * 0.4;
    ctx.strokeStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(x - s * 0.6, y + s * 0.2, s * 0.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + s * 0.6, y + s * 0.2, s * 0.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  } else if (emotion === 'sad') {
    // Sad eyes (slanted down)
    ctx.beginPath();
    ctx.ellipse(x - s * 0.6, y + s * 0.2, pupilSize, pupilSize, 0, 0, Math.PI * 2);
    ctx.ellipse(x + s * 0.6, y + s * 0.2, pupilSize, pupilSize, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tear
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.ellipse(x + s * 1.4, y + s * 0.8, s * 0.3, s * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (emotion === 'sleepy') {
    // Sleepy (lines)
    ctx.lineWidth = s * 0.35;
    ctx.strokeStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(x - s * 1.2, y);
    ctx.lineTo(x - s * 0.1, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + s * 0.1, y);
    ctx.lineTo(x + s * 1.2, y);
    ctx.stroke();
  } else if (emotion === 'hungry') {
    // Hungry (wide, looking at food)
    ctx.beginPath();
    ctx.ellipse(x - s * 0.6, y, pupilSize * 1.2, pupilSize * 1.2, 0, 0, Math.PI * 2);
    ctx.ellipse(x + s * 0.6, y, pupilSize * 1.2, pupilSize * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Highlight
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - s * 0.8, y - s * 0.3, s * 0.2, 0, Math.PI * 2);
    ctx.arc(x + s * 0.4, y - s * 0.3, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Normal
    ctx.beginPath();
    ctx.ellipse(x - s * 0.5, y, pupilSize, pupilSize, 0, 0, Math.PI * 2);
    ctx.ellipse(x + s * 0.6, y, pupilSize, pupilSize, 0, 0, Math.PI * 2);
    ctx.fill();
    // Highlight
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - s * 0.7, y - s * 0.3, s * 0.2, 0, Math.PI * 2);
    ctx.arc(x + s * 0.4, y - s * 0.3, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── Species drawing (at adult scale, will be scaled for baby/teen) ───

const SPECIES = {
  raptor: {
    color: '#4ade80',
    eyeOffset: { x: 22, y: -18 },
    draw(ctx, c, dc) {
      // Tail
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy + 4);
      ctx.quadraticCurveTo(cx - 40, cy - 10, cx - 50, cy + 4);
      ctx.quadraticCurveTo(cx - 42, cy + 8, cx - 18, cy + 12);
      ctx.fill();
      // Body
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 6, 22, 16, -0.05, 0, Math.PI * 2);
      ctx.fill();
      // Belly
      ctx.fillStyle = adjustColor(c, 1.2);
      ctx.beginPath();
      ctx.ellipse(cx + 4, cy + 12, 14, 8, -0.05, 0, Math.PI * 2);
      ctx.fill();
      // Neck
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx + 14, cy);
      ctx.quadraticCurveTo(cx + 22, cy - 14, cx + 18, cy - 22);
      ctx.lineTo(cx + 10, cy - 18);
      ctx.quadraticCurveTo(cx + 14, cy - 10, cx + 8, cy + 2);
      ctx.fill();
      // Head
      ctx.beginPath();
      ctx.ellipse(cx + 18, cy - 22, 12, 8, -0.15, 0, Math.PI * 2);
      ctx.fill();
      // Jaw
      ctx.fillStyle = dc;
      ctx.beginPath();
      ctx.moveTo(cx + 24, cy - 18);
      ctx.lineTo(cx + 36, cy - 16);
      ctx.lineTo(cx + 28, cy - 14);
      ctx.fill();
      // Teeth
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(cx + 28, cy - 17);
      ctx.lineTo(cx + 29, cy - 15);
      ctx.lineTo(cx + 30, cy - 17);
      ctx.moveTo(cx + 31, cy - 16.5);
      ctx.lineTo(cx + 32, cy - 14.5);
      ctx.lineTo(cx + 33, cy - 16.5);
      ctx.fill();
      // Big hind legs
      ctx.fillStyle = dc;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 18);
      ctx.lineTo(cx - 2, cy + 36);
      ctx.lineTo(cx + 6, cy + 36);
      ctx.lineTo(cx + 4, cy + 28);
      ctx.lineTo(cx + 8, cy + 36);
      ctx.lineTo(cx + 14, cy + 36);
      ctx.lineTo(cx + 10, cy + 18);
      ctx.fill();
      // Claws
      ctx.fillStyle = '#f5f5dc';
      ctx.beginPath();
      ctx.moveTo(cx - 2, cy + 36);
      ctx.lineTo(cx - 6, cy + 38);
      ctx.lineTo(cx, cy + 36);
      ctx.moveTo(cx + 6, cy + 36);
      ctx.lineTo(cx + 2, cy + 38);
      ctx.lineTo(cx + 8, cy + 36);
      ctx.fill();
      // Small arms
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx + 12, cy + 2);
      ctx.lineTo(cx + 18, cy + 10);
      ctx.lineTo(cx + 16, cy + 10);
      ctx.lineTo(cx + 10, cy + 4);
      ctx.fill();
      // Sickle claw detail
      ctx.fillStyle = '#f5f5dc';
      ctx.beginPath();
      ctx.moveTo(cx + 8, cy + 36);
      ctx.lineTo(cx + 12, cy + 32);
      ctx.lineTo(cx + 14, cy + 36);
      ctx.fill();
    }
  },

  trex: {
    color: '#fbbf24',
    eyeOffset: { x: 20, y: -22 },
    draw(ctx, c, dc) {
      // Tail
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy);
      ctx.quadraticCurveTo(cx - 44, cy - 8, cx - 52, cy + 4);
      ctx.quadraticCurveTo(cx - 44, cy + 10, cx - 20, cy + 12);
      ctx.fill();
      // Body
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(cx - 2, cy + 4, 24, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      // Belly
      ctx.fillStyle = adjustColor(c, 1.15);
      ctx.beginPath();
      ctx.ellipse(cx, cy + 14, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Neck
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx + 14, cy - 4);
      ctx.quadraticCurveTo(cx + 22, cy - 18, cx + 16, cy - 26);
      ctx.lineTo(cx + 8, cy - 22);
      ctx.quadraticCurveTo(cx + 14, cy - 12, cx + 8, cy);
      ctx.fill();
      // MASSIVE head
      ctx.beginPath();
      ctx.ellipse(cx + 18, cy - 26, 16, 12, -0.1, 0, Math.PI * 2);
      ctx.fill();
      // Jaw (huge)
      ctx.fillStyle = dc;
      ctx.beginPath();
      ctx.moveTo(cx + 26, cy - 20);
      ctx.lineTo(cx + 42, cy - 16);
      ctx.lineTo(cx + 42, cy - 12);
      ctx.lineTo(cx + 26, cy - 14);
      ctx.fill();
      // Teeth (jagged)
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + 28 + i * 3, cy - 16);
        ctx.lineTo(cx + 29 + i * 3, cy - 13);
        ctx.lineTo(cx + 30 + i * 3, cy - 16);
        ctx.fill();
      }
      // Massive legs
      ctx.fillStyle = dc;
      ctx.fillRect(cx - 12, cy + 18, 10, 20);
      ctx.fillRect(cx + 4, cy + 18, 10, 20);
      // Feet
      ctx.fillStyle = adjustColor(c, 0.7);
      ctx.beginPath();
      ctx.ellipse(cx - 7, cy + 38, 8, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 9, cy + 38, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tiny arms (comically small)
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx + 12, cy + 2);
      ctx.lineTo(cx + 16, cy + 6);
      ctx.lineTo(cx + 14, cy + 7);
      ctx.lineTo(cx + 10, cy + 4);
      ctx.fill();
      // Stripe pattern
      ctx.strokeStyle = adjustColor(c, 0.8);
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - 10 + i * 10, cy - 4);
        ctx.lineTo(cx - 6 + i * 10, cy + 8);
        ctx.stroke();
      }
    }
  },

  pterodactyl: {
    color: '#c084fc',
    eyeOffset: { x: 14, y: -18 },
    draw(ctx, c, dc) {
      // Left wing
      ctx.fillStyle = adjustColor(c, 0.85);
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy);
      ctx.quadraticCurveTo(cx - 30, cy - 30, cx - 50, cy - 12);
      ctx.lineTo(cx - 44, cy - 4);
      ctx.lineTo(cx - 34, cy - 16);
      ctx.lineTo(cx - 24, cy - 6);
      ctx.lineTo(cx - 16, cy - 14);
      ctx.fill();
      // Right wing
      ctx.beginPath();
      ctx.moveTo(cx + 8, cy);
      ctx.quadraticCurveTo(cx + 30, cy - 30, cx + 50, cy - 12);
      ctx.lineTo(cx + 44, cy - 4);
      ctx.lineTo(cx + 34, cy - 16);
      ctx.lineTo(cx + 24, cy - 6);
      ctx.lineTo(cx + 16, cy - 14);
      ctx.fill();
      // Wing membrane detail
      ctx.strokeStyle = adjustColor(c, 0.7);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 2);
      ctx.lineTo(cx - 40, cy - 8);
      ctx.moveTo(cx + 10, cy - 2);
      ctx.lineTo(cx + 40, cy - 8);
      ctx.stroke();
      // Body (small)
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 4, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Belly
      ctx.fillStyle = adjustColor(c, 1.2);
      ctx.beginPath();
      ctx.ellipse(cx, cy + 8, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Neck + head
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx + 4, cy - 4);
      ctx.quadraticCurveTo(cx + 10, cy - 14, cx + 8, cy - 20);
      ctx.lineTo(cx + 2, cy - 18);
      ctx.quadraticCurveTo(cx + 6, cy - 12, cx, cy - 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 8, cy - 20, 9, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Crest (long, curved back)
      ctx.fillStyle = dc;
      ctx.beginPath();
      ctx.moveTo(cx + 6, cy - 24);
      ctx.quadraticCurveTo(cx - 4, cy - 38, cx - 12, cy - 32);
      ctx.lineTo(cx - 8, cy - 28);
      ctx.quadraticCurveTo(cx - 2, cy - 32, cx + 8, cy - 22);
      ctx.fill();
      // Long beak
      ctx.fillStyle = adjustColor(c, 0.9);
      ctx.beginPath();
      ctx.moveTo(cx + 14, cy - 20);
      ctx.lineTo(cx + 30, cy - 16);
      ctx.lineTo(cx + 14, cy - 14);
      ctx.fill();
      // Feet
      ctx.fillStyle = dc;
      ctx.fillRect(cx - 4, cy + 12, 3, 8);
      ctx.fillRect(cx + 2, cy + 12, 3, 8);
    }
  },

  triceratops: {
    color: '#f97316',
    eyeOffset: { x: 22, y: -8 },
    draw(ctx, c, dc) {
      // Tail
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx - 22, cy + 4);
      ctx.lineTo(cx - 40, cy + 8);
      ctx.lineTo(cx - 22, cy + 14);
      ctx.fill();
      // Body (massive, stocky)
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(cx - 4, cy + 6, 26, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      // Belly
      ctx.fillStyle = adjustColor(c, 1.15);
      ctx.beginPath();
      ctx.ellipse(cx - 2, cy + 14, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Frill (big ornate shield)
      ctx.fillStyle = dc;
      ctx.beginPath();
      ctx.arc(cx + 14, cy - 6, 18, -Math.PI * 0.85, Math.PI * 0.15);
      ctx.fill();
      // Frill edge dots
      ctx.fillStyle = adjustColor(c, 0.6);
      for (let a = -0.7; a <= 0.1; a += 0.2) {
        ctx.beginPath();
        ctx.arc(cx + 14 + Math.cos(a * Math.PI) * 17, cy - 6 + Math.sin(a * Math.PI) * 17, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Head
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(cx + 22, cy, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Brow horns (2 long ones)
      ctx.fillStyle = '#f5f5dc';
      ctx.beginPath();
      ctx.moveTo(cx + 22, cy - 8);
      ctx.lineTo(cx + 28, cy - 26);
      ctx.lineTo(cx + 26, cy - 8);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 16, cy - 8);
      ctx.lineTo(cx + 20, cy - 24);
      ctx.lineTo(cx + 20, cy - 8);
      ctx.fill();
      // Nose horn
      ctx.beginPath();
      ctx.moveTo(cx + 32, cy - 2);
      ctx.lineTo(cx + 38, cy - 6);
      ctx.lineTo(cx + 34, cy);
      ctx.fill();
      // Beak
      ctx.fillStyle = dc;
      ctx.beginPath();
      ctx.moveTo(cx + 32, cy + 2);
      ctx.lineTo(cx + 38, cy + 2);
      ctx.lineTo(cx + 34, cy + 6);
      ctx.fill();
      // 4 sturdy legs
      ctx.fillStyle = adjustColor(c, 0.75);
      ctx.fillRect(cx - 18, cy + 18, 8, 14);
      ctx.fillRect(cx - 6, cy + 18, 8, 14);
      ctx.fillRect(cx + 6, cy + 16, 8, 14);
      ctx.fillRect(cx + 18, cy + 8, 7, 14);
    }
  },

  stegosaurus: {
    color: '#60a5fa',
    eyeOffset: { x: 28, y: 2 },
    draw(ctx, c, dc) {
      // Tail with thagomizer
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx - 22, cy + 6);
      ctx.quadraticCurveTo(cx - 38, cy + 2, cx - 46, cy + 8);
      ctx.quadraticCurveTo(cx - 38, cy + 12, cx - 22, cy + 14);
      ctx.fill();
      // Tail spikes
      ctx.fillStyle = '#f5f5dc';
      ctx.beginPath();
      ctx.moveTo(cx - 42, cy + 4);
      ctx.lineTo(cx - 52, cy - 4);
      ctx.lineTo(cx - 40, cy + 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 46, cy + 6);
      ctx.lineTo(cx - 56, cy);
      ctx.lineTo(cx - 44, cy + 4);
      ctx.fill();
      // Body (oval, high back)
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 8, 24, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      // Belly
      ctx.fillStyle = adjustColor(c, 1.15);
      ctx.beginPath();
      ctx.ellipse(cx + 2, cy + 16, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Back plates (prominent)
      ctx.fillStyle = dc;
      const platePositions = [-14, -6, 2, 10, 18];
      const plateHeights = [10, 16, 18, 14, 8];
      platePositions.forEach((px, i) => {
        const h = plateHeights[i];
        ctx.beginPath();
        ctx.moveTo(cx + px, cy - 2);
        ctx.lineTo(cx + px - 4, cy - 2 - h);
        ctx.lineTo(cx + px, cy - 2 - h - 4);
        ctx.lineTo(cx + px + 4, cy - 2 - h);
        ctx.fill();
      });
      // Small head (low, forward)
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(cx + 28, cy + 4, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // 4 legs
      ctx.fillStyle = adjustColor(c, 0.75);
      ctx.fillRect(cx - 16, cy + 18, 8, 12);
      ctx.fillRect(cx - 4, cy + 18, 8, 12);
      ctx.fillRect(cx + 8, cy + 18, 8, 10);
      ctx.fillRect(cx + 20, cy + 8, 6, 12);
    }
  },

  brachiosaurus: {
    color: '#fb923c',
    eyeOffset: { x: 14, y: -48 },
    draw(ctx, c, dc) {
      // Tail
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx - 22, cy + 10);
      ctx.quadraticCurveTo(cx - 40, cy + 4, cx - 48, cy + 12);
      ctx.quadraticCurveTo(cx - 40, cy + 16, cx - 22, cy + 18);
      ctx.fill();
      // Huge body
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(cx - 4, cy + 12, 24, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      // Belly
      ctx.fillStyle = adjustColor(c, 1.15);
      ctx.beginPath();
      ctx.ellipse(cx - 2, cy + 22, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Very long neck (curved up)
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx + 12, cy + 2);
      ctx.quadraticCurveTo(cx + 22, cy - 24, cx + 16, cy - 44);
      ctx.lineTo(cx + 8, cy - 42);
      ctx.quadraticCurveTo(cx + 14, cy - 22, cx + 6, cy + 4);
      ctx.fill();
      // Small head
      ctx.beginPath();
      ctx.ellipse(cx + 14, cy - 46, 8, 6, -0.1, 0, Math.PI * 2);
      ctx.fill();
      // Bump on head
      ctx.fillStyle = dc;
      ctx.beginPath();
      ctx.arc(cx + 12, cy - 52, 4, 0, Math.PI * 2);
      ctx.fill();
      // Nostrils
      ctx.fillStyle = adjustColor(c, 0.8);
      ctx.beginPath();
      ctx.arc(cx + 20, cy - 46, 1.5, 0, Math.PI * 2);
      ctx.fill();
      // 4 pillar legs (front taller)
      ctx.fillStyle = adjustColor(c, 0.75);
      ctx.fillRect(cx + 6, cy + 24, 8, 18);
      ctx.fillRect(cx + 16, cy + 20, 8, 18);
      ctx.fillRect(cx - 16, cy + 26, 8, 14);
      ctx.fillRect(cx - 6, cy + 26, 8, 14);
      // Feet
      ctx.fillStyle = adjustColor(c, 0.6);
      for (const fx of [cx + 10, cx + 20, cx - 12, cx - 2]) {
        ctx.beginPath();
        ctx.ellipse(fx, cy + 40, 6, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  ankylosaurus: {
    color: '#94a3b8',
    eyeOffset: { x: 26, y: 2 },
    draw(ctx, c, dc) {
      // Club tail
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy + 6);
      ctx.quadraticCurveTo(cx - 38, cy + 4, cx - 46, cy + 8);
      ctx.quadraticCurveTo(cx - 38, cy + 12, cx - 24, cy + 14);
      ctx.fill();
      // Club end
      ctx.fillStyle = adjustColor(c, 0.5);
      ctx.beginPath();
      ctx.ellipse(cx - 46, cy + 8, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wide armored body
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 8, 28, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      // Armor rows
      ctx.fillStyle = adjustColor(c, 0.7);
      for (let row = 0; row < 2; row++) {
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(cx + i * 8, cy + 2 + row * 8, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Spikes on sides
      ctx.fillStyle = '#f5f5dc';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 10, cy + 18);
        ctx.lineTo(cx + i * 10 - 2, cy + 24);
        ctx.lineTo(cx + i * 10 + 2, cy + 24);
        ctx.fill();
      }
      // Head
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(cx + 26, cy + 6, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Horn bumps
      ctx.fillStyle = adjustColor(c, 0.6);
      ctx.beginPath();
      ctx.arc(cx + 30, cy, 3, 0, Math.PI * 2);
      ctx.arc(cx + 24, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      // Short sturdy legs
      ctx.fillStyle = adjustColor(c, 0.75);
      ctx.fillRect(cx - 18, cy + 18, 8, 10);
      ctx.fillRect(cx - 6, cy + 18, 8, 10);
      ctx.fillRect(cx + 8, cy + 18, 8, 10);
      ctx.fillRect(cx + 18, cy + 12, 7, 10);
    }
  },

  parasaurolophus: {
    color: '#a3e635',
    eyeOffset: { x: 20, y: -14 },
    draw(ctx, c, dc) {
      // Tail
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy + 4);
      ctx.quadraticCurveTo(cx - 36, cy, cx - 42, cy + 6);
      ctx.quadraticCurveTo(cx - 36, cy + 12, cx - 18, cy + 12);
      ctx.fill();
      // Body
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(cx - 2, cy + 6, 22, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      // Belly stripe
      ctx.fillStyle = adjustColor(c, 1.2);
      ctx.beginPath();
      ctx.ellipse(cx, cy + 14, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Neck
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx + 12, cy);
      ctx.quadraticCurveTo(cx + 20, cy - 12, cx + 16, cy - 18);
      ctx.lineTo(cx + 8, cy - 14);
      ctx.quadraticCurveTo(cx + 12, cy - 8, cx + 6, cy + 2);
      ctx.fill();
      // Head
      ctx.beginPath();
      ctx.ellipse(cx + 18, cy - 16, 10, 7, -0.1, 0, Math.PI * 2);
      ctx.fill();
      // Signature curved crest
      ctx.fillStyle = dc;
      ctx.beginPath();
      ctx.moveTo(cx + 14, cy - 20);
      ctx.quadraticCurveTo(cx + 4, cy - 38, cx - 8, cy - 34);
      ctx.lineTo(cx - 4, cy - 30);
      ctx.quadraticCurveTo(cx + 6, cy - 34, cx + 16, cy - 18);
      ctx.fill();
      // Duck bill
      ctx.fillStyle = adjustColor(c, 0.85);
      ctx.beginPath();
      ctx.moveTo(cx + 26, cy - 16);
      ctx.lineTo(cx + 36, cy - 12);
      ctx.lineTo(cx + 36, cy - 8);
      ctx.lineTo(cx + 26, cy - 10);
      ctx.fill();
      // Hind legs
      ctx.fillStyle = adjustColor(c, 0.75);
      ctx.fillRect(cx - 8, cy + 18, 7, 14);
      ctx.fillRect(cx + 2, cy + 18, 7, 14);
      // Feet
      ctx.fillStyle = adjustColor(c, 0.6);
      ctx.beginPath();
      ctx.ellipse(cx - 4, cy + 32, 6, 2.5, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 6, cy + 32, 6, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  spinosaurus: {
    color: '#f472b6',
    eyeOffset: { x: 22, y: -12 },
    draw(ctx, c, dc) {
      // Tail
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy + 4);
      ctx.quadraticCurveTo(cx - 40, cy - 2, cx - 48, cy + 8);
      ctx.quadraticCurveTo(cx - 40, cy + 14, cx - 18, cy + 14);
      ctx.fill();
      // Body
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 6, 22, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      // Sail (tall, prominent)
      ctx.fillStyle = adjustColor(c, 0.7);
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy - 2);
      ctx.quadraticCurveTo(cx - 8, cy - 34, cx, cy - 38);
      ctx.quadraticCurveTo(cx + 8, cy - 34, cx + 14, cy - 2);
      ctx.fill();
      // Sail ribs
      ctx.strokeStyle = adjustColor(c, 0.55);
      ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 5, cy - 2);
        ctx.lineTo(cx + i * 2, cy - 30);
        ctx.stroke();
      }
      // Neck + head
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx + 14, cy);
      ctx.quadraticCurveTo(cx + 22, cy - 10, cx + 18, cy - 16);
      ctx.lineTo(cx + 10, cy - 12);
      ctx.quadraticCurveTo(cx + 14, cy - 6, cx + 8, cy + 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 20, cy - 14, 10, 7, -0.1, 0, Math.PI * 2);
      ctx.fill();
      // Crocodile snout (long)
      ctx.fillStyle = adjustColor(c, 0.9);
      ctx.beginPath();
      ctx.moveTo(cx + 28, cy - 14);
      ctx.lineTo(cx + 44, cy - 12);
      ctx.lineTo(cx + 44, cy - 8);
      ctx.lineTo(cx + 28, cy - 8);
      ctx.fill();
      // Teeth
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + 30 + i * 4, cy - 12);
        ctx.lineTo(cx + 31 + i * 4, cy - 9);
        ctx.lineTo(cx + 32 + i * 4, cy - 12);
        ctx.fill();
      }
      // Legs
      ctx.fillStyle = adjustColor(c, 0.75);
      ctx.fillRect(cx - 8, cy + 16, 7, 16);
      ctx.fillRect(cx + 4, cy + 16, 7, 16);
      // Claws
      ctx.fillStyle = '#f5f5dc';
      ctx.beginPath();
      ctx.moveTo(cx + 14, cy + 6);
      ctx.lineTo(cx + 22, cy + 14);
      ctx.lineTo(cx + 20, cy + 14);
      ctx.lineTo(cx + 12, cy + 8);
      ctx.fill();
    }
  },

  dilophosaurus: {
    color: '#2dd4bf',
    eyeOffset: { x: 18, y: -14 },
    draw(ctx, c, dc) {
      // Tail
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy + 4);
      ctx.quadraticCurveTo(cx - 34, cy, cx - 40, cy + 6);
      ctx.quadraticCurveTo(cx - 34, cy + 12, cx - 16, cy + 12);
      ctx.fill();
      // Body (slender)
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(cx - 2, cy + 6, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      // Belly pattern
      ctx.fillStyle = adjustColor(c, 1.2);
      ctx.beginPath();
      ctx.ellipse(cx, cy + 12, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Spots
      ctx.fillStyle = adjustColor(c, 0.7);
      const spots = [[-8, 0], [4, -2], [-2, 6], [10, 4]];
      spots.forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.arc(cx + sx, cy + sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      // Neck
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx + 10, cy);
      ctx.quadraticCurveTo(cx + 18, cy - 10, cx + 14, cy - 18);
      ctx.lineTo(cx + 6, cy - 14);
      ctx.quadraticCurveTo(cx + 10, cy - 6, cx + 4, cy + 2);
      ctx.fill();
      // Head
      ctx.beginPath();
      ctx.ellipse(cx + 16, cy - 16, 10, 7, -0.15, 0, Math.PI * 2);
      ctx.fill();
      // Double crest (iconic V shape)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(cx + 12, cy - 22);
      ctx.lineTo(cx + 6, cy - 36);
      ctx.lineTo(cx + 14, cy - 24);
      ctx.lineTo(cx + 20, cy - 36);
      ctx.lineTo(cx + 18, cy - 22);
      ctx.fill();
      // Frill (Jurassic Park)
      ctx.fillStyle = adjustColor(c, 0.55);
      ctx.beginPath();
      ctx.arc(cx + 10, cy - 8, 12, -Math.PI * 0.8, Math.PI * 0.6);
      ctx.fill();
      // Frill pattern
      ctx.fillStyle = '#ef4444';
      for (let a = -0.6; a <= 0.4; a += 0.25) {
        ctx.beginPath();
        ctx.arc(cx + 10 + Math.cos(a * Math.PI) * 11, cy - 8 + Math.sin(a * Math.PI) * 11, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      // Redraw head over frill
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(cx + 16, cy - 16, 10, 7, -0.15, 0, Math.PI * 2);
      ctx.fill();
      // Jaw
      ctx.fillStyle = dc;
      ctx.beginPath();
      ctx.moveTo(cx + 24, cy - 14);
      ctx.lineTo(cx + 32, cy - 12);
      ctx.lineTo(cx + 24, cy - 10);
      ctx.fill();
      // Hind legs
      ctx.fillStyle = adjustColor(c, 0.75);
      ctx.fillRect(cx - 6, cy + 14, 6, 14);
      ctx.fillRect(cx + 4, cy + 14, 6, 14);
    }
  },
};

// ─── Egg ───
function drawEgg(ctx, color, emotion) {
  const mod = EMOTION_MODS[emotion];
  const c = adjustColor(color, mod.brightness);
  ctx.clearRect(0, 0, SIZE, SIZE);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 32, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Egg
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 22, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = adjustColor(color, 1.3);
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.ellipse(cx - 6, cy - 10, 8, 14, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Spots (species-colored)
  ctx.fillStyle = adjustColor(color, 0.7);
  ctx.beginPath();
  ctx.ellipse(cx - 8, cy - 4, 4, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 7, cy + 8, 5, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 2, cy - 14, 3, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Crack lines
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 2);
  ctx.lineTo(cx - 4, cy - 4);
  ctx.lineTo(cx + 2, cy + 4);
  ctx.lineTo(cx + 8, cy - 2);
  ctx.lineTo(cx + 14, cy + 2);
  ctx.stroke();

  // Emotion
  if (mod.suffix) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mod.suffix, cx + 24, cy - 20);
  }
}

// ─── Main draw ───
function drawDino(ctx, species, stage, emotion) {
  const spec = SPECIES[species];
  const mod = EMOTION_MODS[emotion];
  const c = adjustColor(spec.color, mod.brightness);
  const dc = adjustColor(spec.color, mod.brightness * 0.65);

  ctx.clearRect(0, 0, SIZE, SIZE);

  if (stage === 'egg') {
    drawEgg(ctx, spec.color, emotion);
    return;
  }

  const scale = { baby: 0.45, teen: 0.7, adult: 1.0 }[stage];

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 38 * scale + 10, 20 * scale + 4, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx * (1 - scale), cy * (1 - scale) + 6 * (1 - scale));
  ctx.scale(scale, scale);

  spec.draw(ctx, c, dc);

  ctx.restore();

  // Eyes
  const ep = spec.eyeOffset;
  const ex = cx + ep.x * scale;
  const ey = cy + ep.y * scale + 6 * (1 - scale);
  drawEyes(ctx, ex, ey, 3.5 * scale, emotion);

  // Emotion suffix
  if (mod.suffix) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `bold ${Math.round(12 * scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(mod.suffix, cx + 30 * scale, cy - 30 * scale);
  }
}

// ─── Generate ───
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

      fs.writeFileSync(
        path.join(dir, `sprite_${stage}_${emotion}_01.png`),
        canvas.toBuffer('image/png')
      );
      count++;
    }
  }
}

console.log(`[generate-sprites] Generated ${count} sprites (${SIZE}x${SIZE}px) in ${outDir}`);
