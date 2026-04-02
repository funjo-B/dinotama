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

// ─── Generic draw helpers for new species ───

function drawAquatic(ctx, c, dc) {
  // Streamlined body
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 5, 30, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tail fin
  ctx.beginPath();
  ctx.moveTo(cx - 26, cy + 4);
  ctx.lineTo(cx - 44, cy - 5);
  ctx.lineTo(cx - 40, cy + 5);
  ctx.lineTo(cx - 44, cy + 14);
  ctx.closePath();
  ctx.fill();
  // Dorsal fin
  ctx.fillStyle = dc;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 6);
  ctx.lineTo(cx + 6, cy - 20);
  ctx.lineTo(cx + 14, cy - 6);
  ctx.fill();
  // Head
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(cx + 24, cy + 3, 10, 8, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Snout
  ctx.fillStyle = dc;
  ctx.beginPath();
  ctx.moveTo(cx + 30, cy + 1);
  ctx.lineTo(cx + 44, cy + 3);
  ctx.lineTo(cx + 32, cy + 6);
  ctx.fill();
  // Belly
  ctx.fillStyle = adjustColor(c, 1.25);
  ctx.beginPath();
  ctx.ellipse(cx + 2, cy + 10, 22, 6, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Flippers
  ctx.fillStyle = dc;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + 8);
  ctx.lineTo(cx - 22, cy + 22);
  ctx.lineTo(cx + 2, cy + 14);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy + 8);
  ctx.lineTo(cx + 22, cy + 22);
  ctx.lineTo(cx + 16, cy + 14);
  ctx.fill();
}

function drawChicken(ctx, c, dc) {
  // Body
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(cx - 2, cy + 8, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Fluffy tail
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 4);
  ctx.quadraticCurveTo(cx - 30, cy - 10, cx - 34, cy + 6);
  ctx.quadraticCurveTo(cx - 28, cy + 16, cx - 14, cy + 14);
  ctx.fill();
  // Wing
  ctx.fillStyle = dc;
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy + 10, 12, 7, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(cx + 16, cy - 8, 9, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Comb
  ctx.fillStyle = '#ef4444';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(cx + 12 + i * 4, cy - 16 - (i === 1 ? 2 : 0), 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Wattle
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.ellipse(cx + 22, cy - 6, 3, 4, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Beak
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(cx + 24, cy - 9);
  ctx.lineTo(cx + 34, cy - 7);
  ctx.lineTo(cx + 24, cy - 5);
  ctx.fill();
  // Legs
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy + 22);
  ctx.lineTo(cx + 2, cy + 36);
  ctx.moveTo(cx + 10, cy + 22);
  ctx.lineTo(cx + 10, cy + 36);
  ctx.stroke();
  // Feet claws
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy + 36); ctx.lineTo(cx - 5, cy + 40);
  ctx.moveTo(cx + 2, cy + 36); ctx.lineTo(cx + 4, cy + 40);
  ctx.moveTo(cx + 2, cy + 36); ctx.lineTo(cx + 8, cy + 38);
  ctx.moveTo(cx + 10, cy + 36); ctx.lineTo(cx + 4, cy + 40);
  ctx.moveTo(cx + 10, cy + 36); ctx.lineTo(cx + 12, cy + 40);
  ctx.moveTo(cx + 10, cy + 36); ctx.lineTo(cx + 16, cy + 38);
  ctx.stroke();
}

function drawCarp(ctx, c, dc) {
  // Body - fat oval fish
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, 28, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Belly
  ctx.fillStyle = dc;
  ctx.beginPath();
  ctx.ellipse(cx + 2, cy + 12, 20, 6, 0, 0, Math.PI);
  ctx.fill();
  // Tail fin
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(cx - 26, cy + 6);
  ctx.quadraticCurveTo(cx - 40, cy - 10, cx - 38, cy - 16);
  ctx.quadraticCurveTo(cx - 32, cy + 4, cx - 26, cy + 6);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 26, cy + 6);
  ctx.quadraticCurveTo(cx - 40, cy + 22, cx - 38, cy + 28);
  ctx.quadraticCurveTo(cx - 32, cy + 8, cx - 26, cy + 6);
  ctx.fill();
  // Dorsal fin
  ctx.fillStyle = dc;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 6);
  ctx.quadraticCurveTo(cx, cy - 20, cx + 10, cy - 6);
  ctx.fill();
  // Scales pattern
  ctx.strokeStyle = dc;
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(cx - 6 + i * 8, cy + 4, 5, 0, Math.PI);
    ctx.stroke();
  }
  // Mouth
  ctx.strokeStyle = dc;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx + 26, cy + 4, 3, -0.5, 0.5);
  ctx.stroke();
  // Whiskers (잉어 수염)
  ctx.strokeStyle = dc;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 26, cy + 2);
  ctx.quadraticCurveTo(cx + 36, cy - 4, cx + 38, cy - 8);
  ctx.moveTo(cx + 26, cy + 8);
  ctx.quadraticCurveTo(cx + 36, cy + 14, cx + 38, cy + 18);
  ctx.stroke();
}

function drawLizard(ctx, c, dc) {
  // Body
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 8, 18, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.ellipse(cx + 22, cy + 2, 10, 7, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Tail - long curving
  ctx.strokeStyle = c;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy + 8);
  ctx.quadraticCurveTo(cx - 30, cy + 4, cx - 36, cy - 4);
  ctx.quadraticCurveTo(cx - 40, cy - 12, cx - 34, cy - 16);
  ctx.stroke();
  // Belly
  ctx.fillStyle = dc;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 12, 14, 5, 0, 0, Math.PI);
  ctx.fill();
  // Front legs
  ctx.strokeStyle = c;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy + 16);
  ctx.lineTo(cx + 14, cy + 30);
  ctx.lineTo(cx + 20, cy + 28);
  ctx.moveTo(cx - 6, cy + 16);
  ctx.lineTo(cx - 10, cy + 30);
  ctx.lineTo(cx - 16, cy + 28);
  ctx.stroke();
  // Back legs
  ctx.beginPath();
  ctx.moveTo(cx + 8, cy + 16);
  ctx.lineTo(cx + 4, cy + 30);
  ctx.lineTo(cx + 10, cy + 32);
  ctx.moveTo(cx - 4, cy + 16);
  ctx.lineTo(cx - 8, cy + 30);
  ctx.lineTo(cx - 14, cy + 32);
  ctx.stroke();
  // Spots
  ctx.fillStyle = dc;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(cx - 8 + i * 10, cy + 4, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Tongue
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx + 32, cy + 2);
  ctx.quadraticCurveTo(cx + 40, cy - 2, cx + 42, cy + 4);
  ctx.stroke();
}

function drawPhoenix(ctx, c, dc) {
  // Flaming aura
  ctx.fillStyle = 'rgba(255,100,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 4, 40, 36, 0, 0, Math.PI * 2);
  ctx.fill();
  // Flame tail feathers
  const flames = [
    { x: cx - 28, y: cy + 10, w: 10, h: 24, r: -0.3 },
    { x: cx - 20, y: cy + 6,  w: 8,  h: 28, r: -0.15 },
    { x: cx - 12, y: cy + 4,  w: 8,  h: 32, r: 0 },
  ];
  for (const f of flames) {
    ctx.fillStyle = '#ff6b00';
    ctx.beginPath();
    ctx.ellipse(f.x, f.y, f.w, f.h, f.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.ellipse(f.x + 2, f.y + 4, f.w * 0.5, f.h * 0.6, f.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Body
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(cx + 4, cy + 6, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Neck
  ctx.beginPath();
  ctx.ellipse(cx + 16, cy - 8, 8, 12, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.ellipse(cx + 20, cy - 18, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Crown feathers
  ctx.fillStyle = '#ffd700';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + 16 + i * 4, cy - 24);
    ctx.lineTo(cx + 18 + i * 4, cy - 36 + i * 2);
    ctx.lineTo(cx + 20 + i * 4, cy - 24);
    ctx.fill();
  }
  // Wings spread
  ctx.fillStyle = dc;
  ctx.beginPath();
  ctx.moveTo(cx + 4, cy);
  ctx.quadraticCurveTo(cx + 30, cy - 30, cx + 44, cy - 20);
  ctx.quadraticCurveTo(cx + 36, cy - 6, cx + 16, cy + 4);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.quadraticCurveTo(cx - 24, cy - 30, cx - 38, cy - 18);
  ctx.quadraticCurveTo(cx - 30, cy - 4, cx - 10, cy + 4);
  ctx.fill();
  // Wing fire tips
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.ellipse(cx + 44, cy - 20, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - 38, cy - 18, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Beak
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(cx + 28, cy - 19);
  ctx.lineTo(cx + 38, cy - 16);
  ctx.lineTo(cx + 28, cy - 14);
  ctx.fill();
  // Legs
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy + 18);
  ctx.lineTo(cx, cy + 34);
  ctx.moveTo(cx + 10, cy + 18);
  ctx.lineTo(cx + 12, cy + 34);
  ctx.stroke();
}

function drawEasternDragon(ctx, c, dc) {
  // Serpentine body (S-curve) — 동양용 특유의 긴 몸
  ctx.strokeStyle = c;
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 36, cy + 24);
  ctx.bezierCurveTo(cx - 20, cy - 10, cx - 4, cy + 30, cx + 12, cy - 4);
  ctx.bezierCurveTo(cx + 22, cy - 24, cx + 30, cy - 10, cx + 36, cy - 18);
  ctx.stroke();
  // Body fill (thicker stroke for body feel)
  ctx.strokeStyle = dc;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(cx - 34, cy + 22);
  ctx.bezierCurveTo(cx - 18, cy - 8, cx - 2, cy + 28, cx + 14, cy - 2);
  ctx.bezierCurveTo(cx + 24, cy - 22, cx + 32, cy - 8, cx + 38, cy - 16);
  ctx.stroke();
  // Head
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(cx + 36, cy - 20, 10, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Horns (deer-like)
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 30, cy - 26);
  ctx.lineTo(cx + 26, cy - 38);
  ctx.lineTo(cx + 22, cy - 34);
  ctx.moveTo(cx + 26, cy - 38);
  ctx.lineTo(cx + 30, cy - 42);
  ctx.moveTo(cx + 38, cy - 26);
  ctx.lineTo(cx + 42, cy - 38);
  ctx.lineTo(cx + 46, cy - 34);
  ctx.moveTo(cx + 42, cy - 38);
  ctx.lineTo(cx + 38, cy - 42);
  ctx.stroke();
  // Whiskers (긴 수염)
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx + 44, cy - 18);
  ctx.quadraticCurveTo(cx + 56, cy - 24, cx + 60, cy - 30);
  ctx.moveTo(cx + 44, cy - 14);
  ctx.quadraticCurveTo(cx + 56, cy - 8, cx + 60, cy - 2);
  ctx.stroke();
  // Dragon pearl (여의주)
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(cx + 60, cy - 16, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc(cx + 58, cy - 18, 2, 0, Math.PI * 2);
  ctx.fill();
  // Mane / fur tufts along body
  ctx.fillStyle = '#ffd700';
  const manePoints = [
    { x: cx - 30, y: cy + 18 },
    { x: cx - 14, y: cy },
    { x: cx + 4,  y: cy + 16 },
    { x: cx + 20, y: cy - 8  },
  ];
  for (const p of manePoints) {
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 6, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Tail cloud tuft
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.ellipse(cx - 38, cy + 24, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Short legs
  ctx.strokeStyle = c;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 16);
  ctx.lineTo(cx - 14, cy + 30);
  ctx.moveTo(cx + 8, cy + 8);
  ctx.lineTo(cx + 4, cy + 22);
  ctx.stroke();
  // Claws
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 30);
  ctx.lineTo(cx - 18, cy + 33);
  ctx.moveTo(cx - 14, cy + 30);
  ctx.lineTo(cx - 12, cy + 34);
  ctx.moveTo(cx + 4, cy + 22);
  ctx.lineTo(cx, cy + 25);
  ctx.moveTo(cx + 4, cy + 22);
  ctx.lineTo(cx + 6, cy + 26);
  ctx.stroke();
}

function drawWesternDragon(ctx, c, dc) {
  // Body
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 22, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  // Belly plates
  ctx.fillStyle = dc;
  ctx.beginPath();
  ctx.ellipse(cx + 2, cy + 10, 14, 8, 0, 0, Math.PI);
  ctx.fill();
  // Neck
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(cx + 22, cy - 10, 10, 14, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.ellipse(cx + 30, cy - 22, 12, 9, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Horns
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(cx + 24, cy - 28);
  ctx.lineTo(cx + 18, cy - 42);
  ctx.lineTo(cx + 28, cy - 30);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 34, cy - 28);
  ctx.lineTo(cx + 40, cy - 42);
  ctx.lineTo(cx + 30, cy - 30);
  ctx.fill();
  // Snout
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(cx + 40, cy - 22, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Nostrils (fire breath)
  ctx.fillStyle = '#ff6b00';
  ctx.beginPath();
  ctx.ellipse(cx + 46, cy - 23, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.ellipse(cx + 50, cy - 24, 4, 2, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Wings (large bat-like)
  ctx.fillStyle = dc;
  ctx.globalAlpha = 0.8;
  // Left wing
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy);
  ctx.quadraticCurveTo(cx - 20, cy - 40, cx - 44, cy - 34);
  ctx.lineTo(cx - 36, cy - 20);
  ctx.lineTo(cx - 42, cy - 10);
  ctx.lineTo(cx - 30, cy - 6);
  ctx.quadraticCurveTo(cx - 16, cy - 2, cx - 4, cy);
  ctx.fill();
  // Right wing
  ctx.beginPath();
  ctx.moveTo(cx + 6, cy - 6);
  ctx.quadraticCurveTo(cx + 20, cy - 44, cx + 44, cy - 38);
  ctx.lineTo(cx + 36, cy - 24);
  ctx.lineTo(cx + 42, cy - 14);
  ctx.lineTo(cx + 30, cy - 8);
  ctx.quadraticCurveTo(cx + 16, cy - 4, cx + 6, cy - 6);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Wing bone structure
  ctx.strokeStyle = c;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy);
  ctx.lineTo(cx - 44, cy - 34);
  ctx.moveTo(cx - 20, cy - 18);
  ctx.lineTo(cx - 36, cy - 20);
  ctx.moveTo(cx - 24, cy - 10);
  ctx.lineTo(cx - 42, cy - 10);
  ctx.stroke();
  // Tail
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy + 8);
  ctx.quadraticCurveTo(cx - 38, cy + 16, cx - 44, cy + 10);
  ctx.quadraticCurveTo(cx - 48, cy + 6, cx - 44, cy + 2);
  ctx.quadraticCurveTo(cx - 36, cy + 8, cx - 20, cy + 4);
  ctx.fill();
  // Tail spike
  ctx.fillStyle = dc;
  ctx.beginPath();
  ctx.moveTo(cx - 44, cy + 6);
  ctx.lineTo(cx - 54, cy + 2);
  ctx.lineTo(cx - 50, cy + 10);
  ctx.lineTo(cx - 44, cy + 6);
  ctx.fill();
  // Spikes along spine
  ctx.fillStyle = dc;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + 6 - i * 8, cy - 10 + i * 2);
    ctx.lineTo(cx + 8 - i * 8, cy - 18 + i * 2);
    ctx.lineTo(cx + 10 - i * 8, cy - 10 + i * 2);
    ctx.fill();
  }
  // Legs
  ctx.strokeStyle = c;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + 16);
  ctx.lineTo(cx - 12, cy + 32);
  ctx.moveTo(cx + 8, cy + 16);
  ctx.lineTo(cx + 12, cy + 32);
  ctx.stroke();
  // Claws
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy + 32);
  ctx.lineTo(cx - 18, cy + 36);
  ctx.moveTo(cx - 12, cy + 32);
  ctx.lineTo(cx - 10, cy + 38);
  ctx.moveTo(cx + 12, cy + 32);
  ctx.lineTo(cx + 6, cy + 36);
  ctx.moveTo(cx + 12, cy + 32);
  ctx.lineTo(cx + 14, cy + 38);
  ctx.stroke();
}

// Extend SPECIES with all 29 new species (reusing existing draw shapes where suitable)
Object.assign(SPECIES, {
  // ── COMMON extras ──────────────────────────────────────────────────────────
  iguanodon:          { color: '#a3e635', eyeOffset: { x: 22, y: -8  }, draw: SPECIES.stegosaurus.draw    },
  compsognathus:      { color: '#67e8f9', eyeOffset: { x: 22, y: -18 }, draw: SPECIES.raptor.draw         },
  dimorphodon:        { color: '#7dd3fc', eyeOffset: { x: 14, y: -18 }, draw: SPECIES.pterodactyl.draw    },
  rhamphorhynchus:    { color: '#93c5fd', eyeOffset: { x: 14, y: -18 }, draw: SPECIES.pterodactyl.draw    },
  ichthyosaurus:      { color: '#60a5fa', eyeOffset: { x: 24, y: 3   }, draw(ctx, c, dc) { drawAquatic(ctx, c, dc); } },

  // ── RARE extras ────────────────────────────────────────────────────────────
  pachycephalosaurus: { color: '#6366f1', eyeOffset: { x: 22, y: -18 }, draw: SPECIES.raptor.draw         },
  allosaurus:         { color: '#f59e0b', eyeOffset: { x: 20, y: -22 }, draw: SPECIES.trex.draw           },
  carnotaurus:        { color: '#ef4444', eyeOffset: { x: 20, y: -22 }, draw: SPECIES.trex.draw           },
  pteranodon:         { color: '#06b6d4', eyeOffset: { x: 14, y: -18 }, draw: SPECIES.pterodactyl.draw    },
  plesiosaurus:       { color: '#2dd4bf', eyeOffset: { x: 24, y: 3   }, draw(ctx, c, dc) { drawAquatic(ctx, c, dc); } },
  kronosaurus:        { color: '#0ea5e9', eyeOffset: { x: 24, y: 3   }, draw(ctx, c, dc) { drawAquatic(ctx, c, dc); } },

  // ── EPIC extras ────────────────────────────────────────────────────────────
  stegoceras:         { color: '#d8b4fe', eyeOffset: { x: 22, y: -18 }, draw: SPECIES.raptor.draw         },
  baryonyx:           { color: '#e879f9', eyeOffset: { x: 22, y: -12 }, draw: SPECIES.spinosaurus.draw    },
  quetzalcoatlus:     { color: '#818cf8', eyeOffset: { x: 14, y: -18 }, draw: SPECIES.pterodactyl.draw    },
  mosasaurus:         { color: '#a78bfa', eyeOffset: { x: 24, y: 3   }, draw(ctx, c, dc) { drawAquatic(ctx, c, dc); } },
  elasmosaurus:       { color: '#f9a8d4', eyeOffset: { x: 24, y: 3   }, draw(ctx, c, dc) { drawAquatic(ctx, c, dc); } },

  // ── LEGEND extras ──────────────────────────────────────────────────────────
  argentinosaurus:    { color: '#fbbf24', eyeOffset: { x: 14, y: -48 }, draw: SPECIES.brachiosaurus.draw  },
  tyrannosaurus:      { color: '#ef4444', eyeOffset: { x: 20, y: -22 }, draw: SPECIES.trex.draw           },
  giganotosaurus:     { color: '#dc2626', eyeOffset: { x: 20, y: -22 }, draw: SPECIES.trex.draw           },
  velociraptor:       { color: '#fb923c', eyeOffset: { x: 22, y: -18 }, draw: SPECIES.raptor.draw         },
  tupuxuara:          { color: '#f59e0b', eyeOffset: { x: 14, y: -18 }, draw: SPECIES.pterodactyl.draw    },

  // ── HIDDEN ─────────────────────────────────────────────────────────────────
  chicken:            { color: '#ff6b6b', eyeOffset: { x: 14, y: -10 }, draw(ctx, c, dc) { drawChicken(ctx, c, dc); } },
  carp:               { color: '#f97316', eyeOffset: { x: 20, y: 2   }, draw(ctx, c, dc) { drawCarp(ctx, c, dc); } },
  lizard:             { color: '#84cc16', eyeOffset: { x: 22, y: -6  }, draw(ctx, c, dc) { drawLizard(ctx, c, dc); } },
});

// ── Hidden Transform Species (adult only) ────────────────────────────────────
const TRANSFORM_SPECIES = {
  phoenix:        { color: '#ff4500', eyeOffset: { x: 16, y: -18 }, draw(ctx, c, dc) { drawPhoenix(ctx, c, dc); } },
  eastern_dragon: { color: '#ffd700', eyeOffset: { x: 22, y: -14 }, draw(ctx, c, dc) { drawEasternDragon(ctx, c, dc); } },
  western_dragon: { color: '#9333ea', eyeOffset: { x: 20, y: -20 }, draw(ctx, c, dc) { drawWesternDragon(ctx, c, dc); } },
};

// Hidden → Transform mapping
const HIDDEN_TRANSFORMS = {
  chicken: 'phoenix',
  carp:    'eastern_dragon',
  lizard:  'western_dragon',
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

// ─── Generate transform sprites (Hidden adult forms) ───
for (const [hiddenSpecies, transformName] of Object.entries(HIDDEN_TRANSFORMS)) {
  const transformSpec = TRANSFORM_SPECIES[transformName];
  if (!transformSpec) continue;

  const dir = path.join(outDir, 'adult', transformName);
  fs.mkdirSync(dir, { recursive: true });

  for (const emotion of EMOTIONS) {
    const canvas = createCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d');

    const mod = EMOTION_MODS[emotion];
    const c = adjustColor(transformSpec.color, mod.brightness);
    const dc = adjustColor(transformSpec.color, mod.brightness * 0.65);

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 48, 24, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    transformSpec.draw(ctx, c, dc);

    // Eyes
    const ep = transformSpec.eyeOffset;
    drawEyes(ctx, cx + ep.x, cy + ep.y, 3.5, emotion);

    // Emotion suffix
    if (mod.suffix) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(mod.suffix, cx + 30, cy - 30);
    }

    fs.writeFileSync(
      path.join(dir, `sprite_adult_${emotion}_01.png`),
      canvas.toBuffer('image/png')
    );
    count++;
  }
}

console.log(`[generate-sprites] Generated ${count} sprites (${SIZE}x${SIZE}px) in ${outDir}`);
