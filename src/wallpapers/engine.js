/**
 * Live ASCII wallpaper engine (`AntiCusTheme.WallpaperEngine`).
 *
 *  - Renders the active scene (ACT.SCENES[id].render) onto the wallpaper canvas at up to 30 FPS,
 *    or 60 FPS during the circular ripple transition between themes. A frame budget lowers the
 *    rate for heavy scenes so the wallpaper stays under ~25% of one CPU core.
 *  - Pauses while the window is hidden. With motion off it draws one static frame
 *    (on theme change / resize) and runs no loop at all.
 *  - Also renders the static thumbnails used by the theme panel.
 */
(function () {
  'use strict';

  window.AntiCusTheme = window.AntiCusTheme || {};
  var ACT = window.AntiCusTheme;

  var canvas = null;
  var ctx = null;
  var currentThemeId = 'ember';
  var previousThemeId = 'ember';
  var transition = null; // { fromId, toId, startTime, duration, originX, originY }
  var running = false;
  var rafId = null;
  var lastFrameTime = 0;
  var fpsInterval = 1000 / 30;
  var FRAME_BUDGET_FACTOR = 4;
  var avgRenderMs = 0;
  var startTime = Date.now();
  var width = 0;
  var height = 0;
  var dpr = 1;
  var cellW = 11;
  var cellH = 16;
  var cols = 80;
  var rows = 40;

  // Static frame time used when motion is disabled, so the still image looks "settled".
  var STATIC_TIME_SEC = 2.4;

  function isMotionEnabled() {
    return ACT.State.isMotionEnabled();
  }

  // DOMAdapter owns mounting/relocation; the engine only needs the canvas element.
  function ensureCanvas() {
    if (!canvas) {
      canvas = ACT.DOMAdapter.getWallpaperCanvas();
      ctx = canvas ? canvas.getContext('2d') : null;
    }
    return canvas;
  }

  function onResize() {
    if (!ensureCanvas()) return;
    var parent = canvas.parentElement;
    var rect = parent ? parent.getBoundingClientRect() : null;
    var w = Math.max(320, (rect && rect.width) ? rect.width : (window.innerWidth || 1280));
    var h = Math.max(240, (rect && rect.height) ? rect.height : (window.innerHeight || 800));
    var ratio = Math.min(2, window.devicePixelRatio || 1);

    width = w;
    height = h;
    dpr = ratio;

    canvas.width = Math.floor(w * ratio);
    canvas.height = Math.floor(h * ratio);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    cellW = 11;
    cellH = 16;
    cols = Math.ceil(w / cellW);
    rows = Math.ceil(h / cellH);

    renderOnce();
  }

  function onVisibilityChange() {
    if (document.hidden) {
      WallpaperEngine.stop();
    } else {
      WallpaperEngine.start();
    }
  }

  var SCENE_FONT = '13px "JetBrains Mono", "Fira Code", "Cascadia Mono", Consolas, monospace';

  function renderSceneToContext(targetCtx, themeId, elapsedSec, targetW, targetH, targetCols, targetRows, cW, cH, scaleDpr) {
    if (!targetCtx) return;
    var scene = ACT.SCENES[themeId] || ACT.SCENES[ACT.CONSTANTS.DEFAULT_THEME_ID];
    var palette = ACT.PALETTES[themeId] || ACT.PALETTES[ACT.CONSTANTS.DEFAULT_THEME_ID] || {};

    targetCtx.save();
    targetCtx.setTransform(scaleDpr, 0, 0, scaleDpr, 0, 0);
    targetCtx.font = SCENE_FONT;
    targetCtx.textBaseline = 'top';
    try {
      scene.render(targetCtx, {
        width: targetW,
        height: targetH,
        cols: targetCols,
        rows: targetRows,
        cellW: cW,
        cellH: cH,
        time: elapsedSec,
        palette: palette
      });
    } finally {
      targetCtx.restore();
    }
  }

  function renderOnce() {
    if (!ensureCanvas() || !ctx) return;
    if (width <= 0 || height <= 0) {
      onResize();
      if (width <= 0 || height <= 0) return;
    }

    var now = Date.now();
    var elapsedSec = isMotionEnabled() ? (now - startTime) * 0.001 : STATIC_TIME_SEC;
    if (!isMotionEnabled()) transition = null;

    if (transition) {
      var tr = transition;
      var tNorm = Math.min(1, (now - tr.startTime) / Math.max(1, tr.duration));
      var eased = 1 - Math.pow(1 - tNorm, 3);

      renderSceneToContext(ctx, tr.fromId, elapsedSec, width, height, cols, rows, cellW, cellH, dpr);

      var maxRadius = Math.hypot(
        Math.max(tr.originX, width - tr.originX),
        Math.max(tr.originY, height - tr.originY)
      ) * 1.05;
      var radius = Math.max(1, maxRadius * eased);

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.beginPath();
      ctx.arc(tr.originX, tr.originY, radius, 0, Math.PI * 2);
      ctx.clip();
      renderSceneToContext(ctx, tr.toId, elapsedSec, width, height, cols, rows, cellW, cellH, dpr);

      ctx.strokeStyle = 'rgba(255, 238, 220, ' + (0.4 * (1 - eased)).toFixed(3) + ')';
      ctx.lineWidth = 2.0;
      ctx.stroke();
      ctx.restore();

      if (tNorm >= 1) {
        transition = null;
      }
    } else {
      renderSceneToContext(ctx, currentThemeId, elapsedSec, width, height, cols, rows, cellW, cellH, dpr);
    }
  }

  function tick(now) {
    if (!running) return;
    rafId = requestAnimationFrame(tick);
    // Frame budget: wait at least FRAME_BUDGET_FACTOR x the average render time between frames,
    // so a heavy scene drops its frame rate instead of using more than ~1/4 of a CPU core.
    var interval = transition ? 16 : Math.max(fpsInterval, avgRenderMs * FRAME_BUDGET_FACTOR);
    if (now - lastFrameTime < interval) return;
    lastFrameTime = now;
    var t0 = performance.now();
    renderOnce();
    avgRenderMs = avgRenderMs * 0.9 + (performance.now() - t0) * 0.1;
  }

  var WallpaperEngine = {
    init: function () {
      currentThemeId = ACT.State.getThemeId();
      ensureCanvas();
      onResize();
      window.addEventListener('resize', onResize, { passive: true });
      document.addEventListener('visibilitychange', onVisibilityChange, { passive: true });
      ACT.State.onMotionChange(function (enabled) {
        if (enabled) {
          WallpaperEngine.start();
        } else {
          WallpaperEngine.stop();
          renderOnce();
        }
      });
      this.start();
    },

    setTheme: function (themeId, originCoords) {
      var scenes = ACT.SCENES || {};
      if (!scenes[themeId]) {
        themeId = 'ember';
      }
      if (currentThemeId !== themeId) {
        previousThemeId = currentThemeId;
      }
      if (previousThemeId && previousThemeId !== themeId && originCoords && width > 0) {
        transition = {
          fromId: previousThemeId,
          toId: themeId,
          startTime: Date.now(),
          duration: 680,
          originX: typeof originCoords.x === 'number' ? originCoords.x : width * 0.5,
          originY: typeof originCoords.y === 'number' ? originCoords.y : height * 0.5
        };
      }
      currentThemeId = themeId;
      avgRenderMs = 0; // re-measure the new scene
      renderOnce();
    },

    renderThumbnail: function (thumbCanvas, themeId) {
      if (!thumbCanvas) return;
      var tCtx = thumbCanvas.getContext('2d');
      if (!tCtx) return;
      var w = thumbCanvas.width || 136;
      var h = thumbCanvas.height || 76;
      var cW = 7;
      var cH = 10;
      var tCols = Math.ceil(w / cW);
      var tRows = Math.ceil(h / cH);
      renderSceneToContext(tCtx, themeId, STATIC_TIME_SEC, w, h, tCols, tRows, cW, cH, 1);
    },

    start: function () {
      if (running) return;
      if (!isMotionEnabled()) {
        // Motion off: keep a single static frame, no render loop.
        renderOnce();
        return;
      }
      running = true;
      lastFrameTime = 0;
      rafId = requestAnimationFrame(tick);
    },

    stop: function () {
      running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },

    renderOnce: renderOnce,


    /** Re-measure after the container was re-mounted or resized. */
    handleResize: onResize
  };

  ACT.WallpaperEngine = WallpaperEngine;

})();
