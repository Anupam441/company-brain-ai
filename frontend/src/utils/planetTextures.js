import * as THREE from 'three';

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function makeRockyTexture(baseColor, spotColor, seed = 1) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const rand = seededRandom(seed);

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 220; i++) {
    const x = rand() * size, y = rand() * size;
    const r = 6 + rand() * 40;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, spotColor);
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.25 + rand() * 0.3;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function makeGasGiantTexture(baseColor, bandColors, seed = 2) {
  const w = 512, h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const rand = seededRandom(seed);

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);

  const bands = 14;
  for (let i = 0; i < bands; i++) {
    const y = (i / bands) * h;
    const bandH = h / bands;
    ctx.globalAlpha = 0.35 + rand() * 0.35;
    ctx.fillStyle = bandColors[i % bandColors.length];
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 16) {
      ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 6);
    }
    ctx.lineTo(w, y + bandH);
    ctx.lineTo(0, y + bandH);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export function makeSunTexture(seed = 3) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const rand = seededRandom(seed);

  const base = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  base.addColorStop(0, '#fff4d6');
  base.addColorStop(0.5, '#ffb347');
  base.addColorStop(1, '#ff7a1a');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 300; i++) {
    const x = rand() * size, y = rand() * size, r = 2 + rand() * 5;
    ctx.globalAlpha = 0.15 + rand() * 0.2;
    ctx.fillStyle = rand() > 0.5 ? '#fff8e6' : '#ff5500';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  return new THREE.CanvasTexture(canvas);
}

export function makeRingTexture(color, seed = 4) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = 1;
  const ctx = canvas.getContext('2d');
  const rand = seededRandom(seed);

  for (let x = 0; x < size; x++) {
    const gap = rand() > 0.92;
    ctx.globalAlpha = gap ? 0.05 : 0.3 + rand() * 0.5;
    ctx.fillStyle = color;
    ctx.fillRect(x, 0, 1, 1);
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}
