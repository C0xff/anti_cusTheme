/**
 * anti_cusTheme - nature & daytime ASCII wallpaper scenes
 * Scenes:
 *   1. ember (Warm dark embers, diagonal drifting ASCII particles & code glyph matrix)
 *   2. cloud-drift (Daylight sky-blue, drifting layered white ASCII clouds & sunbeams)
 *   3. honu-lagoon (Teal ocean caustic wave matrix & gliding ASCII sea turtles)
 *   4. koi-pond    (Emerald pond, expanding ASCII water ripples, lily pads & swimming koi)
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

  function valueNoise(x, y) {
    var ix = Math.floor(x);
    var iy = Math.floor(y);
    var fx = x - ix;
    var fy = y - iy;
    var ux = fx * fx * (3.0 - 2.0 * fx);
    var uy = fy * fy * (3.0 - 2.0 * fy);
    var a = hash2(ix, iy);
    var b = hash2(ix + 1, iy);
    var c = hash2(ix, iy + 1);
    var d = hash2(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }

  function fbm(x, y) {
    var v = 0.0;
    var amp = 0.5;
    for (var i = 0; i < 3; i++) {
      v += amp * valueNoise(x, y);
      x = x * 2.02 + 13.7;
      y = y * 2.02 + 7.3;
      amp *= 0.5;
    }
    return v;
  }

  function fillBackdrop(ctx, w, h, palette) {
    var bg = (palette && palette.canvasBg) || {};
    var topColor = bg.top || '#181412';
    var centerColor = bg.center || '#12100e';
    var bottomColor = bg.bottom || '#17100e';

    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, topColor);
    grad.addColorStop(0.5, centerColor);
    grad.addColorStop(1, bottomColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    if (bg.sideGlow) {
      var rg = ctx.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.45, Math.max(w, h) * 0.65);
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
  // 1. EMBER - Warm obsidian matrix with drifting terracotta embers
  // =========================================================================
  var emberParticles = [];
  for (var eIdx = 0; eIdx < 42; eIdx++) {
    emberParticles.push({
      x: hash2(eIdx, 1.1),
      y: hash2(eIdx, 2.2),
      vx: (hash2(eIdx, 3.3) - 0.35) * 0.018,
      vy: -0.012 - hash2(eIdx, 4.4) * 0.025,
      ch: ['*', '+', '·', ':', '░', '▒', '×', '¤'][eIdx % 8],
      phase: hash2(eIdx, 5.5) * Math.PI * 2
    });
  }

  var CODE_RAMP = ' ·.,:;~+*x#%';

  root.AntiCusTheme.SCENES['ember'] = {
    id: 'ember',
    name: 'Ember',
    render: function (ctx, state) {
      var w = state.width, h = state.height, cols = state.cols, rows = state.rows;
      var cellW = state.cellW, cellH = state.cellH, t = state.time;
      var colors = getAsciiColors(state.palette, {
        primary: 'rgba(217, 119, 87, 0.38)',
        secondary: 'rgba(217, 119, 87, 0.16)',
        accent: '#ff9d79'
      });

      fillBackdrop(ctx, w, h, state.palette);

      for (var r = 0; r < rows; r++) {
        var ny = r / Math.max(1, rows);
        for (var c = 0; c < cols; c++) {
          var nx = c / Math.max(1, cols);
          var dx = nx - 0.5;
          var dy = ny - 0.48;
          var centerDist = Math.sqrt(dx * dx + dy * dy);
          var n = fbm(nx * 4.2 + t * 0.08, ny * 3.6 - t * 0.06) + 0.35 * Math.sin((nx + ny) * 9.0 - t * 0.45);
          var val = n * (0.55 + 0.65 * centerDist);
          if (val > 0.38) {
            var idx = Math.min(CODE_RAMP.length - 1, Math.floor((val - 0.38) * 14));
            var ch = CODE_RAMP.charAt(idx);
            if (ch !== ' ') {
              ctx.globalAlpha = val > 0.82 ? 0.55 : 0.25;
              ctx.fillStyle = val > 0.82 ? colors.primary : colors.secondary;
              ctx.fillText(ch, c * cellW, r * cellH);
            }
          }
        }
      }

      for (var i = 0; i < emberParticles.length; i++) {
        var em = emberParticles[i];
        var ex = fract(em.x + em.vx * t + Math.sin(t * 0.7 + em.phase) * 0.02);
        var ey = fract(em.y + em.vy * t);
        var ec = Math.floor(ex * cols);
        var er = Math.floor(ey * rows);
        var pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + em.phase);
        ctx.globalAlpha = 0.45 + 0.45 * pulse;
        ctx.fillStyle = pulse > 0.6 ? colors.accent : colors.primary;
        ctx.fillText(em.ch, ec * cellW, er * cellH);
      }
      ctx.globalAlpha = 1.0;
    }
  };

  // =========================================================================
  // 2. CLOUD DRIFT - Sky blue daylight with layered white ASCII cumulus clouds
  // =========================================================================
  var CLOUD_RAMP = ' .·:~=░▒▓█';

  root.AntiCusTheme.SCENES['cloud-drift'] = {
    id: 'cloud-drift',
    name: 'Cloud Drift',
    render: function (ctx, state) {
      var w = state.width, h = state.height, cols = state.cols, rows = state.rows;
      var cellW = state.cellW, cellH = state.cellH, t = state.time;
      var colors = getAsciiColors(state.palette, {
        primary: 'rgba(255, 255, 255, 0.78)',
        secondary: 'rgba(255, 255, 255, 0.42)',
        accent: '#ffffff'
      });

      fillBackdrop(ctx, w, h, state.palette);

      for (var r = 0; r < rows; r++) {
        var ny = r / Math.max(1, rows);
        for (var c = 0; c < cols; c++) {
          var nx = c / Math.max(1, cols);
          var layer1 = fbm(nx * 3.2 - t * 0.045, ny * 5.0 + 1.2);
          var layer2 = fbm(nx * 6.0 - t * 0.08 + 4.5, ny * 8.5 - 2.3) * 0.5;
          var bandBias = Math.sin(ny * Math.PI * 2.2 + 0.5) * 0.14;
          var d = layer1 + layer2 + bandBias;

          if (d > 0.52) {
            var norm = Math.min(0.999, (d - 0.52) / 0.55);
            var cIdx = Math.floor(norm * CLOUD_RAMP.length);
            var ch = CLOUD_RAMP.charAt(cIdx);
            if (ch !== ' ') {
              ctx.globalAlpha = 0.35 + norm * 0.55;
              // Sunlit top edge: only sample the cell above when it can matter
              if (norm > 0.65 && fbm(nx * 3.2 - t * 0.045, (ny - 0.03) * 5.0 + 1.2) < layer1) {
                ctx.fillStyle = colors.accent;
              } else if (norm > 0.38) {
                ctx.fillStyle = colors.primary;
              } else {
                ctx.fillStyle = colors.secondary;
              }
              ctx.fillText(ch, c * cellW, r * cellH);
            }
          }
        }
      }
      ctx.globalAlpha = 1.0;
    }
  };

  // =========================================================================
  // 3. HONU LAGOON - Teal caustic waves & gliding ASCII sea turtles (Honu)
  // =========================================================================
  var HONU_FLIPPERS_A = [
    '    //       \\\\  ',
    '  _..---.._      ',
    ' /  .===.  \\ ___ ',
    '|  /#####\\  / o \\',
    ' \\ \\#####/ /\\___/',
    '  \'--...--\'      ',
    '    \\\\       //  '
  ];

  var HONU_FLIPPERS_B = [
    '  \\\\           //',
    '  _..---.._      ',
    ' /  .===.  \\ ___ ',
    '|  /#####\\  / o \\',
    ' \\ \\#####/ /\\___/',
    '  \'--...--\'      ',
    '  //           \\\\'
  ];

  var turtles = [
    { x: 0.18, y: 0.24, speedX: 0.016, speedY: -0.003, phase: 0.0 },
    { x: 0.72, y: 0.68, speedX: 0.013, speedY: 0.004, phase: 2.1 },
    { x: 0.45, y: 0.82, speedX: 0.019, speedY: -0.005, phase: 4.2 }
  ];

  var LAGOON_RAMP = '  ·.~≈≋░▒';

  root.AntiCusTheme.SCENES['honu-lagoon'] = {
    id: 'honu-lagoon',
    name: 'Honu Lagoon',
    render: function (ctx, state) {
      var w = state.width, h = state.height, cols = state.cols, rows = state.rows;
      var cellW = state.cellW, cellH = state.cellH, t = state.time;
      var colors = getAsciiColors(state.palette, {
        primary: 'rgba(130, 232, 232, 0.42)',
        secondary: 'rgba(78, 190, 196, 0.22)',
        accent: '#c3fcfc'
      });

      fillBackdrop(ctx, w, h, state.palette);

      for (var r = 0; r < rows; r++) {
        var ny = r / Math.max(1, rows);
        for (var c = 0; c < cols; c++) {
          var nx = c / Math.max(1, cols);
          var w1 = Math.sin(nx * 14.0 + t * 0.9 + Math.sin(ny * 8.0 - t * 0.6));
          var w2 = Math.cos(ny * 12.0 - t * 0.75 + Math.cos(nx * 9.0 + t * 0.5));
          var caustic = (w1 * w2 + 1.0) * 0.5;
          if (caustic > 0.54) {
            var idx = Math.min(LAGOON_RAMP.length - 1, Math.floor((caustic - 0.54) * 16));
            var ch = LAGOON_RAMP.charAt(idx);
            if (ch !== ' ') {
              ctx.globalAlpha = caustic > 0.84 ? 0.62 : 0.28;
              ctx.fillStyle = caustic > 0.84 ? colors.accent : (caustic > 0.68 ? colors.primary : colors.secondary);
              ctx.fillText(ch, c * cellW, r * cellH);
            }
          }
        }
      }

      ctx.globalAlpha = 0.78;
      for (var i = 0; i < turtles.length; i++) {
        var tu = turtles[i];
        var tx = fract(tu.x + tu.speedX * t);
        var ty = fract(tu.y + tu.speedY * t + Math.sin(t * 0.6 + tu.phase) * 0.03);
        var baseCol = Math.floor(tx * (cols + 20)) - 10;
        var baseRow = Math.floor(ty * rows);
        var strokeFrame = Math.sin(t * 2.2 + tu.phase) > 0 ? HONU_FLIPPERS_A : HONU_FLIPPERS_B;

        for (var sr = 0; sr < strokeFrame.length; sr++) {
          var line = strokeFrame[sr];
          var rr = baseRow + sr;
          if (rr < 0 || rr >= rows) continue;
          for (var sc = 0; sc < line.length; sc++) {
            var sch = line.charAt(sc);
            if (sch === ' ') continue;
            var cc = baseCol + sc;
            if (cc < 0 || cc >= cols) continue;
            ctx.fillStyle = sch === '#' ? colors.primary : colors.accent;
            ctx.fillText(sch, cc * cellW, rr * cellH);
          }
        }
      }
      ctx.globalAlpha = 1.0;
    }
  };

  // =========================================================================
  // 4. KOI POND - Deep emerald pond, expanding ripples, lily pads & koi fish
  // =========================================================================
  var LILY_PAD = [
    '  .---.  ',
    ' /  _  \\ ',
    '|  (_) >|',
    ' \\     / ',
    '  \'---\'  '
  ];

  var KOI_RIGHT = [
    '   _.._    ',
    '><(((º>   ',
    '   \'\'\'     '
  ];

  var KOI_LEFT = [
    '    _.._   ',
    '   <º)))>< ',
    '     \'\'\'   '
  ];

  var lilyPads = [
    { x: 0.14, y: 0.22 },
    { x: 0.82, y: 0.26 },
    { x: 0.20, y: 0.78 },
    { x: 0.76, y: 0.74 }
  ];

  var koiList = [
    { x: 0.25, y: 0.36, vx: 0.022, vy: 0.004, dir: 1, color: '#F28B50', phase: 0.4 },
    { x: 0.75, y: 0.62, vx: -0.019, vy: -0.003, dir: -1, color: '#F7C97E', phase: 2.3 },
    { x: 0.50, y: 0.20, vx: 0.015, vy: 0.005, dir: 1, color: '#F46D52', phase: 4.1 }
  ];

  var ripples = [
    { x: 0.32, y: 0.44, period: 6.5, offset: 0.0 },
    { x: 0.68, y: 0.55, period: 7.2, offset: 2.4 },
    { x: 0.48, y: 0.30, period: 8.0, offset: 4.8 },
    { x: 0.24, y: 0.68, period: 6.8, offset: 1.5 }
  ];

  root.AntiCusTheme.SCENES['koi-pond'] = {
    id: 'koi-pond',
    name: 'Koi Pond',
    render: function (ctx, state) {
      var w = state.width, h = state.height, cols = state.cols, rows = state.rows;
      var cellW = state.cellW, cellH = state.cellH, t = state.time;
      var colors = getAsciiColors(state.palette, {
        primary: 'rgba(118, 214, 168, 0.38)',
        secondary: 'rgba(72, 164, 126, 0.20)',
        accent: '#f2945c'
      });

      fillBackdrop(ctx, w, h, state.palette);

      for (var r = 0; r < rows; r++) {
        var ny = r / Math.max(1, rows);
        for (var c = 0; c < cols; c++) {
          var nx = c / Math.max(1, cols);
          var shimmer = fbm(nx * 5.0 + t * 0.05, ny * 5.0 - t * 0.04);
          var rippleChar = null;

          for (var rp = 0; rp < ripples.length; rp++) {
            var rip = ripples[rp];
            var age = ((t + rip.offset) % rip.period) / rip.period;
            var radius = age * 0.26;
            var dx = (nx - rip.x) * (w / Math.max(1, h));
            var dy = ny - rip.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (Math.abs(dist - radius) < 0.012 && age < 0.85) {
              rippleChar = age < 0.4 ? '◎' : (age < 0.65 ? '○' : '·');
              break;
            }
          }

          if (rippleChar) {
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = colors.primary;
            ctx.fillText(rippleChar, c * cellW, r * cellH);
          } else if (shimmer > 0.62) {
            ctx.globalAlpha = 0.24;
            ctx.fillStyle = colors.secondary;
            ctx.fillText(shimmer > 0.74 ? '~' : '·', c * cellW, r * cellH);
          }
        }
      }

      ctx.globalAlpha = 0.65;
      for (var l = 0; l < lilyPads.length; l++) {
        var pad = lilyPads[l];
        var pc = Math.floor(pad.x * cols + Math.sin(t * 0.5 + l) * 1.5);
        var pr = Math.floor(pad.y * rows + Math.cos(t * 0.4 + l) * 1.0);
        for (var lr = 0; lr < LILY_PAD.length; lr++) {
          var line = LILY_PAD[lr];
          var rr = pr + lr;
          if (rr < 0 || rr >= rows) continue;
          for (var lc = 0; lc < line.length; lc++) {
            var ch = line.charAt(lc);
            if (ch === ' ') continue;
            var cc = pc + lc;
            if (cc < 0 || cc >= cols) continue;
            ctx.fillStyle = ch === '_' || ch === '(' || ch === ')' ? colors.accent : colors.primary;
            ctx.fillText(ch, cc * cellW, rr * cellH);
          }
        }
      }

      ctx.globalAlpha = 0.82;
      for (var k = 0; k < koiList.length; k++) {
        var koi = koiList[k];
        var kx = fract(koi.x + koi.vx * t);
        var ky = fract(koi.y + koi.vy * t + Math.sin(t * 1.4 + koi.phase) * 0.025);
        var kc = Math.floor(kx * cols);
        var kr = Math.floor(ky * rows);
        var sprite = koi.dir > 0 ? KOI_RIGHT : KOI_LEFT;

        for (var sr = 0; sr < sprite.length; sr++) {
          var sline = sprite[sr];
          var rr2 = kr + sr;
          if (rr2 < 0 || rr2 >= rows) continue;
          for (var sc = 0; sc < sline.length; sc++) {
            var sch = sline.charAt(sc);
            if (sch === ' ') continue;
            var cc2 = kc + sc;
            if (cc2 < 0 || cc2 >= cols) continue;
            ctx.fillStyle = koi.color || colors.accent;
            ctx.fillText(sch, cc2 * cellW, rr2 * cellH);
          }
        }
      }
      ctx.globalAlpha = 1.0;
    }
  };
})();
