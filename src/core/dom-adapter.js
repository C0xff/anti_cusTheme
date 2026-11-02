/**
 * Applies the active theme to the Antigravity page and keeps it applied.
 *
 *  - Writes `data-act-theme`, light/dark classes and the palette's CSS variables onto <html>/<body>.
 *  - Mounts the wallpaper container as the first child of `.agy-sheet` (behind the chat area),
 *    falling back to <body> before the app has rendered.
 *  - A MutationObserver re-applies when the app resets <html>/<body> class or style (e.g. its own
 *    light/dark switch). See the write helpers below for why every write is guarded.
 */
(function () {
  'use strict';

  window.AntiCusTheme = window.AntiCusTheme || {};
  const ACT = window.AntiCusTheme;

  const DARK_CLASSES = ['dark', 'dark-theme', 'theme-dark'];
  const LIGHT_CLASSES = ['light', 'light-theme', 'theme-light'];
  const WATCHED_ATTRS = ['style', 'class', 'data-newux-theme', 'data-agy-theme'];

  let observer = null;
  let activeThemeId = null;
  let wallpaperContainer = null;
  let wallpaperCanvas = null;

  // Write helpers only touch the DOM when the value actually differs.
  // A redundant write still queues a mutation record, which re-triggers the observer and
  // caused an endless apply loop that froze the renderer (black window on startup).
  function setAttr(el, name, val) {
    if (el && el.getAttribute(name) !== val) el.setAttribute(name, val);
  }

  function setClass(el, cls, on) {
    if (el && el.classList.contains(cls) !== on) el.classList.toggle(cls, on);
  }

  function setVar(el, key, val) {
    if (!el) return;
    if (el.style.getPropertyValue(key) !== val || el.style.getPropertyPriority(key) !== 'important') {
      el.style.setProperty(key, val, 'important');
    }
  }

  const DOMAdapter = {
    /** Get or create the wallpaper container + canvas and make sure it is mounted. */
    ensureWallpaperContainer: function () {
      if (!wallpaperContainer) {
        wallpaperContainer = document.getElementById('act-wallpaper');
        if (!wallpaperContainer) {
          wallpaperContainer = document.createElement('div');
          wallpaperContainer.id = 'act-wallpaper';
          wallpaperCanvas = document.createElement('canvas');
          wallpaperCanvas.id = 'act-wallpaper-canvas';
          wallpaperContainer.appendChild(wallpaperCanvas);
        } else {
          wallpaperCanvas = document.getElementById('act-wallpaper-canvas');
        }
      }
      return this.relocateWallpaperContainer();
    },

    /** Returns true if the container had to be (re)mounted. */
    relocateWallpaperContainer: function () {
      const target = document.querySelector('.agy-sheet') || document.body;
      if (!wallpaperContainer || !target || wallpaperContainer.parentElement === target) return false;
      target.insertBefore(wallpaperContainer, target.firstChild);
      return true;
    },

    getWallpaperCanvas: function () {
      this.ensureWallpaperContainer();
      return wallpaperCanvas;
    },

    applyTheme: function (themeId, originCoords) {
      const palette = ACT.PALETTES[themeId];
      if (!palette) {
        console.warn('[AntiCusTheme.DOMAdapter] Palette not found for theme:', themeId);
        return;
      }
      activeThemeId = themeId;

      const root = document.documentElement;
      const body = document.body;
      try {
        const themeChanged = root.getAttribute('data-act-theme') !== themeId;
        setAttr(root, 'data-act-theme', themeId);
        setAttr(body, 'data-act-theme', themeId);

        const isLight = !!palette.isLight;
        const scheme = isLight ? 'light' : 'dark';
        if (root.style.colorScheme !== scheme) root.style.colorScheme = scheme;
        DARK_CLASSES.forEach((cls) => { setClass(root, cls, !isLight); setClass(body, cls, !isLight); });
        LIGHT_CLASSES.forEach((cls) => { setClass(root, cls, isLight); setClass(body, cls, isLight); });

        Object.entries(palette.cssVars || {}).forEach(([key, val]) => {
          setVar(root, key, val);
          setVar(body, key, val);
        });
        Object.entries(palette.ui || {}).forEach(([key, val]) => {
          const cssKey = key.startsWith('--') ? key : '--act-ui-' + key;
          setVar(root, cssKey, val);
          setVar(body, cssKey, val);
        });
        if (palette.canvasBg) {
          setVar(root, '--act-bg-top', palette.canvasBg.top);
          setVar(root, '--act-bg-center', palette.canvasBg.center);
          setVar(root, '--act-bg-bottom', palette.canvasBg.bottom);
        }

        // Recolor the native window-controls overlay when the app exposes it
        if (themeChanged && window.electronNative && typeof window.electronNative.setTitleBarOverlay === 'function') {
          try {
            window.electronNative.setTitleBarOverlay({
              color: (palette.cssVars && palette.cssVars['--shell']) || (isLight ? '#d8eef8' : '#12100e'),
              symbolColor: isLight ? '#1e293b' : '#f5f5f4'
            });
          } catch (e) {}
        }

        this.ensureWallpaperContainer();
        ACT.WallpaperEngine.setTheme(themeId, originCoords);
      } finally {
        // Observer callbacks run asynchronously, so a "busy" flag cannot filter our own
        // mutations: drop the records we just queued instead.
        if (observer) observer.takeRecords();
      }
    },

    initObserver: function () {
      if (observer) return;
      observer = new MutationObserver((mutations) => {
        if (activeThemeId && mutations.some((m) => m.type === 'attributes')) {
          this.applyTheme(activeThemeId);
        }
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: WATCHED_ATTRS });
      observer.observe(document.body, { attributes: true, attributeFilter: WATCHED_ATTRS });
    },

    init: function () {
      this.ensureWallpaperContainer();
      this.initObserver();
      ACT.State.subscribe((themeId, _prev, coords) => this.applyTheme(themeId, coords));
      this.applyTheme(ACT.State.getThemeId());

      // React may re-create `.agy-sheet` on navigation; re-mount the wallpaper when that happens.
      // A 1s poll is cheaper than observing the whole subtree of a streaming chat UI.
      setInterval(() => {
        if (!document.hidden && this.relocateWallpaperContainer()) {
          ACT.WallpaperEngine.handleResize();
        }
      }, 1000);
    }
  };

  ACT.DOMAdapter = DOMAdapter;
})();
