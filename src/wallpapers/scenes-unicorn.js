/**
 * anti_cusTheme - Unicorn scene (the project's own theme).
 * Pastel night sky: a slow rainbow ribbon made of ASCII waves, twinkling stars and sparkles
 * drifting down. Cheap by design: only the ribbon band and a fixed set of particles are drawn,
 * no per-cell noise over the whole grid.
 */
(function () {
  'use strict';

  window.AntiCusTheme = window.AntiCusTheme || {};
  const ACT = window.AntiCusTheme;
  ACT.SCENES = ACT.SCENES || {};

  const RIBBON_CHARS = ['~', '≈', '=', '-', '~', '≈'];
  const SPARKLE_CHARS = ['✦', '✧', '⋆', '+', '*', '·'];
  const DEFAULT_RAINBOW = ['#ff7eb6', '#ffb86b', '#ffe066', '#7ef0c9', '#7cc8ff', '#b48cff'];
  const DEFAULT_BG = { top: '#1b1432', center: '#140f23', bottom: '#1e1228', sideGlow: 'rgba(197,140,255,0.14)' };

  function hash(i, salt) {
    const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  const STARS = Array.from({ length: 110 }, (_, i) => ({
    x: hash(i, 1),
    y: hash(i, 2) * 0.9,
    phase: hash(i, 3) * Math.PI * 2,
    speed: 0.6 + hash(i, 4) * 1.6,
    ch: hash(i, 5) > 0.82 ? '+' : '.'
  }));

  const SPARKLES = Array.from({ length: 26 }, (_, i) => ({
    x: hash(i, 11),
    y: hash(i, 12),
    vy: 0.010 + hash(i, 13) * 0.018,
    drift: (hash(i, 14) - 0.5) * 0.01,
    phase: hash(i, 15) * Math.PI * 2,
    ch: SPARKLE_CHARS[i % SPARKLE_CHARS.length],
    color: i % 6
  }));

  function fillBackdrop(ctx, w, h, bg) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, bg.top);
    grad.addColorStop(0.5, bg.center);
    grad.addColorStop(1, bg.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w * 0.5, h * 0.4, 20, w * 0.5, h * 0.4, Math.max(w, h) * 0.6);
    glow.addColorStop(0, bg.sideGlow);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  ACT.SCENES['unicorn'] = {
    id: 'unicorn',
    name: 'Unicorn',
    render: function (ctx, state) {
      const { width: w, height: h, cols, rows, cellW, cellH, time: t } = state;
      const palette = state.palette || {};
      const rainbow = (palette.ascii && palette.ascii.rainbow) || DEFAULT_RAINBOW;
      fillBackdrop(ctx, w, h, palette.canvasBg || DEFAULT_BG);

      // Stars
      ctx.fillStyle = '#f3eeff';
      for (const s of STARS) {
        ctx.globalAlpha = 0.15 + 0.5 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        ctx.fillText(s.ch, Math.floor(s.x * cols) * cellW, Math.floor(s.y * rows) * cellH);
      }

      // Rainbow ribbon: two rows per color, all following the same slow sine path
      const bands = rainbow.length;
      const ROWS_PER_BAND = 2;
      for (let c = 0; c < cols; c++) {
        const nx = c / Math.max(1, cols);
        const centerRow = rows * (0.34 + 0.07 * Math.sin(nx * 5.2 + t * 0.32) + 0.03 * Math.sin(nx * 13 - t * 0.5));
        const fade = Math.sin(Math.PI * nx); // thinner towards the window edges
        const top = Math.round(centerRow - (bands * ROWS_PER_BAND) / 2);
        for (let k = 0; k < bands * ROWS_PER_BAND; k++) {
          const r = top + k;
          if (r < 0 || r >= rows) continue;
          const b = Math.floor(k / ROWS_PER_BAND);
          const shimmer = 0.5 + 0.5 * Math.sin(nx * 22 - t * 1.4 + k * 0.6);
          ctx.globalAlpha = (0.16 + 0.42 * shimmer) * fade;
          ctx.fillStyle = rainbow[b];
          ctx.fillText(RIBBON_CHARS[(c + k) % RIBBON_CHARS.length], c * cellW, r * cellH);
        }
      }

      // Sparkles drifting down
      for (const p of SPARKLES) {
        const y = (p.y + p.vy * t) % 1;
        const x = (((p.x + p.drift * t + 0.015 * Math.sin(t * 0.8 + p.phase)) % 1) + 1) % 1;
        const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + p.phase);
        ctx.globalAlpha = 0.35 + 0.55 * pulse;
        ctx.fillStyle = rainbow[p.color % bands];
        ctx.fillText(p.ch, Math.floor(x * cols) * cellW, Math.floor(y * rows) * cellH);
      }
      ctx.globalAlpha = 1;
    }
  };
})();
