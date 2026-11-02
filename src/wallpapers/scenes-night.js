/**
 * anti_cusTheme - night & atmospheric ASCII wallpaper scenes
 * Scenes:
 *   5. jellyfish   (Deep sapphire abyss, bioluminescent pulsing bells & flowing tentacles)
 *   6. paper-boats (Warm dusk river waves & floating origami paper boats)
 *   7. fireflies   (Deep forest meadow, swaying grass silhouettes & glowing fireflies)
 *   8. moonlit     (Midnight indigo sky, glowing crescent moon, twinkling stars & clouds)
 */
(function () {
  'use strict';

  var root = window;
  root.AntiCusTheme = root.AntiCusTheme || {};
  root.AntiCusTheme.SCENES = root.AntiCusTheme.SCENES || {};

  function fract(x) {
    return x - Math.floor(x);
  }

  // Integer hash in [0, 1). Called ~100k times per frame by fbm(), so it avoids Math.sin.
  function hash2(x, y) {
    var h = Math.imul((x * 73856093) | 0, 0x27d4eb2d) ^ Math.imul((y * 19349663) | 0, 0x165667b1);
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
    h ^= h >>> 13;
    return (h >>> 0) / 4294967296;
  }

  function fillBackdrop(ctx, w, h, palette) {
    var bg = (palette && palette.canvasBg) || {};
    var topColor = bg.top || '#0A101E';
    var centerColor = bg.center || '#0E172A';
    var bottomColor = bg.bottom || '#13203B';

    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, topColor);
    grad.addColorStop(0.5, centerColor);
    grad.addColorStop(1, bottomColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    if (bg.sideGlow) {
      var rg = ctx.createRadialGradient(w * 0.5, h * 0.4, 20, w * 0.5, h * 0.4, Math.max(w, h) * 0.65);
      rg.addColorStop(0, bg.sideGlow);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function getAsciiColors(palette, defaults) {
    var a = (palette && palette.ascii) || {};
    return {
      primary: a.primary || defaults.primary,
      secondary: a.ambient || a.secondary || defaults.secondary,
      accent: a.highlight || defaults.accent
    };
  }

  // =========================================================================
  // 5. JELLYFISH - Deep sapphire ocean with pulsing bioluminescent jellyfish
  // =========================================================================
  var JELLY_BELL_OPEN = [
    '    .---.    ',
    '  .\'░░░░░\'.  ',
    ' /▒▒▒▒▒▒▒▒▒\\ ',
    '|▓▓▓▓▓▓▓▓▓▓▓|',
    ' \'~~~~~~~~~\' '
  ];

  var JELLY_BELL_CONTRACT = [
    '    .---.    ',
    '   /░░░░░\\   ',
    '  |▒▒▒▒▒▒▒|  ',
    '  |▓▓▓▓▓▓▓|  ',
    '   \'~~~~~\'   '
  ];

  var jellies = [
    { x: 0.16, y: 0.72, speedY: -0.020, phase: 0.0, tentacles: 5 },
    { x: 0.80, y: 0.55, speedY: -0.016, phase: 1.8, tentacles: 6 },
    { x: 0.34, y: 0.30, speedY: -0.014, phase: 3.4, tentacles: 4 },
    { x: 0.64, y: 0.88, speedY: -0.022, phase: 5.0, tentacles: 5 }
  ];

  root.AntiCusTheme.SCENES['jellyfish'] = {
    id: 'jellyfish',
    name: 'Jellyfish',
    render: function (ctx, state) {
      var w = state.width, h = state.height, cols = state.cols, rows = state.rows;
      var cellW = state.cellW, cellH = state.cellH, t = state.time;
      var colors = getAsciiColors(state.palette, {
        primary: '#7dd3fc',
        secondary: 'rgba(125, 211, 252, 0.25)',
        accent: '#e0f2fe'
      });

      fillBackdrop(ctx, w, h, state.palette);

      for (var m = 0; m < 75; m++) {
        var mx = fract(hash2(m, 1.3) + Math.sin(t * 0.25 + m) * 0.03);
        var my = fract(hash2(m, 2.7) - t * (0.006 + (m % 5) * 0.002));
        var mc = Math.floor(mx * cols);
        var mr = Math.floor(my * rows);
        var pulse = 0.5 + 0.5 * Math.sin(t * 1.8 + m * 1.7);
        if (pulse > 0.35) {
          ctx.globalAlpha = 0.25 + 0.45 * pulse;
          ctx.fillStyle = pulse > 0.8 ? colors.accent : colors.secondary;
          ctx.fillText(pulse > 0.82 ? '·' : '.', mc * cellW, mr * cellH);
        }
      }

      for (var j = 0; j < jellies.length; j++) {
        var jf = jellies[j];
        var cycle = Math.sin(t * 2.0 + jf.phase);
        var jx = fract(jf.x + Math.sin(t * 0.35 + jf.phase) * 0.04);
        var jy = fract(jf.y + jf.speedY * t);
        var baseCol = Math.floor(jx * cols) - 6;
        var baseRow = Math.floor(jy * rows);
        var bell = cycle > -0.2 ? JELLY_BELL_OPEN : JELLY_BELL_CONTRACT;

        ctx.globalAlpha = 0.72;
        for (var br = 0; br < bell.length; br++) {
          var line = bell[br];
          var rr = baseRow + br;
          if (rr < 0 || rr >= rows) continue;
          for (var bc = 0; bc < line.length; bc++) {
            var ch = line.charAt(bc);
            if (ch === ' ') continue;
            var cc = baseCol + bc;
            if (cc < 0 || cc >= cols) continue;
            ctx.fillStyle = br <= 1 ? colors.accent : colors.primary;
            ctx.fillText(ch, cc * cellW, rr * cellH);
          }
        }

        ctx.globalAlpha = 0.48;
        for (var tc = 0; tc < jf.tentacles; tc++) {
          var tColOffset = 3 + tc * 2;
          for (var tr = 0; tr < 7; tr++) {
            var rrT = baseRow + bell.length + tr;
            if (rrT < 0 || rrT >= rows) continue;
            var sway = Math.round(Math.sin(t * 2.6 - tr * 0.65 + tc + jf.phase) * 1.3);
            var ccT = baseCol + tColOffset + sway;
            if (ccT < 0 || ccT >= cols) continue;
            var tChar = tr < 2 ? '│' : (tr < 5 ? '⌇' : '·');
            ctx.fillStyle = tr < 3 ? colors.primary : colors.secondary;
            ctx.fillText(tChar, ccT * cellW, rrT * cellH);
          }
        }
      }
      ctx.globalAlpha = 1.0;
    }
  };

  // =========================================================================
  // 6. PAPER BOATS - Warm twilight river waves & drifting origami boats
  // =========================================================================
  var PAPER_BOAT_SPRITE = [
    '      /|\\      ',
    '     /_|_\\     ',
    '  __/_____\\__  ',
    '  \\         /  ',
    '~~~\\_______/~~~'
  ];

  var boats = [
    { x: 0.15, y: 0.38, speedX: 0.015, phase: 0.0 },
    { x: 0.68, y: 0.66, speedX: 0.012, phase: 2.2 },
    { x: 0.42, y: 0.80, speedX: 0.018, phase: 4.5 }
  ];

  root.AntiCusTheme.SCENES['paper-boats'] = {
    id: 'paper-boats',
    name: 'Paper Boats',
    render: function (ctx, state) {
      var w = state.width, h = state.height, cols = state.cols, rows = state.rows;
      var cellW = state.cellW, cellH = state.cellH, t = state.time;
      var colors = getAsciiColors(state.palette, {
        primary: '#ebc6a8',
        secondary: 'rgba(186, 145, 118, 0.25)',
        accent: '#ffecd8'
      });

      fillBackdrop(ctx, w, h, state.palette);

      for (var r = Math.floor(rows * 0.25); r < rows; r++) {
        var ny = r / Math.max(1, rows);
        for (var c = 0; c < cols; c++) {
          var nx = c / Math.max(1, cols);
          var wave = Math.sin(nx * 18.0 - t * 1.2 + r * 0.7) + Math.cos(nx * 9.0 + t * 0.6 - r * 1.1);
          if (wave > 1.15) {
            ctx.globalAlpha = wave > 1.65 ? 0.48 : 0.24;
            ctx.fillStyle = wave > 1.65 ? colors.primary : colors.secondary;
            ctx.fillText(wave > 1.6 ? '≈' : '~', c * cellW, r * cellH);
          } else if (ny < 0.35 && hash2(c, r) > 0.988) {
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = colors.secondary;
            ctx.fillText('·', c * cellW, r * cellH);
          }
        }
      }

      ctx.globalAlpha = 0.78;
      for (var b = 0; b < boats.length; b++) {
        var bt = boats[b];
        var bx = fract(bt.x + bt.speedX * t);
        var bob = Math.sin(t * 1.8 + bt.phase) * 0.012;
        var baseCol = Math.floor(bx * (cols + 18)) - 9;
        var baseRow = Math.floor((bt.y + bob) * rows);

        for (var sr = 0; sr < PAPER_BOAT_SPRITE.length; sr++) {
          var line = PAPER_BOAT_SPRITE[sr];
          var rr = baseRow + sr;
          if (rr < 0 || rr >= rows) continue;
          for (var sc = 0; sc < line.length; sc++) {
            var ch = line.charAt(sc);
            if (ch === ' ') continue;
            var cc = baseCol + sc;
            if (cc < 0 || cc >= cols) continue;
            ctx.fillStyle = ch === '~' ? colors.primary : colors.accent;
            ctx.fillText(ch, cc * cellW, rr * cellH);
          }
        }
      }
      ctx.globalAlpha = 1.0;
    }
  };

  // =========================================================================
  // 7. FIREFLIES - Forest night meadow with swaying grass & glowing fireflies
  // =========================================================================
  var fireflies = [];
  for (var f = 0; f < 46; f++) {
    fireflies.push({
      x: hash2(f, 10.1),
      y: 0.12 + hash2(f, 20.2) * 0.78,
      vx: (hash2(f, 30.3) - 0.5) * 0.016,
      vy: (hash2(f, 40.4) - 0.5) * 0.012,
      phase: hash2(f, 50.5) * Math.PI * 2,
      speed: 1.4 + hash2(f, 60.6) * 2.2
    });
  }

  root.AntiCusTheme.SCENES['fireflies'] = {
    id: 'fireflies',
    name: 'Fireflies',
    render: function (ctx, state) {
      var w = state.width, h = state.height, cols = state.cols, rows = state.rows;
      var cellW = state.cellW, cellH = state.cellH, t = state.time;
      var colors = getAsciiColors(state.palette, {
        primary: '#a4d67a',
        secondary: 'rgba(88, 138, 82, 0.28)',
        accent: '#eeff8e'
      });

      fillBackdrop(ctx, w, h, state.palette);

      var grassHeight = Math.max(4, Math.floor(rows * 0.16));
      ctx.globalAlpha = 0.42;
      for (var c = 0; c < cols; c++) {
        var bladeH = Math.floor(2 + hash2(c, 7.7) * grassHeight);
        var wind = Math.sin(t * 1.5 + c * 0.15);
        for (var gh = 0; gh < bladeH; gh++) {
          var gr = rows - 1 - gh;
          if (gr < 0) continue;
          var gc = c + (gh > bladeH * 0.5 ? (wind > 0.25 ? 1 : (wind < -0.25 ? -1 : 0)) : 0);
          if (gc < 0 || gc >= cols) continue;
          var gch = gh === bladeH - 1 ? (wind > 0 ? '/' : '\\') : '│';
          ctx.fillStyle = gh === bladeH - 1 ? colors.primary : colors.secondary;
          ctx.fillText(gch, gc * cellW, gr * cellH);
        }
      }

      for (var i = 0; i < fireflies.length; i++) {
        var ff = fireflies[i];
        var fx = fract(ff.x + ff.vx * t + Math.sin(t * 0.8 + ff.phase) * 0.03);
        var fy = fract(ff.y + ff.vy * t + Math.cos(t * 0.7 + ff.phase) * 0.025);
        var fc = Math.floor(fx * cols);
        var fr = Math.floor(fy * rows);
        var glow = 0.5 + 0.5 * Math.sin(t * ff.speed + ff.phase);

        if (glow > 0.25) {
          var px = fc * cellW;
          var py = fr * cellH;
          ctx.globalAlpha = Math.min(1, glow * 0.95);
          if (glow > 0.75) {
            ctx.fillStyle = colors.accent;
            ctx.fillText('✦', px, py);
            ctx.fillStyle = colors.primary;
            if (fc > 0) ctx.fillText('·', (fc - 1) * cellW, py);
            if (fc + 1 < cols) ctx.fillText('·', (fc + 1) * cellW, py);
          } else if (glow > 0.48) {
            ctx.fillStyle = colors.primary;
            ctx.fillText('*', px, py);
          } else {
            ctx.fillStyle = colors.secondary;
            ctx.fillText('·', px, py);
          }
        }
      }
      ctx.globalAlpha = 1.0;
    }
  };

  // =========================================================================
  // 8. MOONLIT - Midnight indigo sky, ASCII crescent moon, stars & clouds
  // =========================================================================
  var MOON_ART = [
    '     _.._     ',
    '   .\' .-\'     ',
    '  /  /        ',
    ' |  |         ',
    '  \\  \\        ',
    '   \'. \'-.     ',
    '     \'--\'     '
  ];

  root.AntiCusTheme.SCENES['moonlit'] = {
    id: 'moonlit',
    name: 'Moonlit',
    render: function (ctx, state) {
      var w = state.width, h = state.height, cols = state.cols, rows = state.rows;
      var cellW = state.cellW, cellH = state.cellH, t = state.time;
      var colors = getAsciiColors(state.palette, {
        primary: '#b6c6f5',
        secondary: 'rgba(120, 140, 198, 0.24)',
        accent: '#ebf2ff'
      });

      fillBackdrop(ctx, w, h, state.palette);

      for (var s = 0; s < 90; s++) {
        var sx = hash2(s, 3.1);
        var sy = hash2(s, 7.9) * 0.78;
        var sc = Math.floor(sx * cols);
        var sr = Math.floor(sy * rows);
        var twinkle = 0.5 + 0.5 * Math.sin(t * (1.2 + (s % 5) * 0.4) + s * 2.1);
        if (twinkle > 0.3) {
          ctx.globalAlpha = 0.3 + 0.65 * twinkle;
          var sch = twinkle > 0.88 ? '✦' : (twinkle > 0.65 ? '+' : '·');
          ctx.fillStyle = twinkle > 0.82 ? colors.accent : (twinkle > 0.55 ? colors.primary : colors.secondary);
          ctx.fillText(sch, sc * cellW, sr * cellH);
        }
      }

      ctx.globalAlpha = 0.88;
      var moonCol = Math.max(4, Math.floor(cols * 0.78));
      var moonRow = Math.max(2, Math.floor(rows * 0.12));
      for (var mr = 0; mr < MOON_ART.length; mr++) {
        var line = MOON_ART[mr];
        var rr = moonRow + mr;
        if (rr >= rows) continue;
        for (var mc = 0; mc < line.length; mc++) {
          var ch = line.charAt(mc);
          if (ch === ' ') continue;
          var cc = moonCol + mc;
          if (cc >= cols) continue;
          ctx.fillStyle = colors.accent;
          ctx.fillText(ch, cc * cellW, rr * cellH);
        }
      }

      ctx.globalAlpha = 0.36;
      for (var r = Math.floor(rows * 0.62); r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var nx = c / Math.max(1, cols);
          var mist = Math.sin(nx * 10.0 - t * 0.35 + r * 0.5) + Math.cos(nx * 16.0 + t * 0.2 - r * 0.3);
          if (mist > 0.85) {
            ctx.fillStyle = mist > 1.45 ? colors.primary : colors.secondary;
            ctx.fillText(mist > 1.5 ? '▒' : (mist > 1.15 ? '░' : '·'), c * cellW, r * cellH);
          }
        }
      }
      ctx.globalAlpha = 1.0;
    }
  };
})();
