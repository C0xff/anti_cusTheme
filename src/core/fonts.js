/**
 * Custom fonts: per-area font family and text size for the Antigravity UI.
 *
 * Areas (selectors taken from the live Antigravity 2.x DOM):
 *   system  - the whole window (body), including menus and this theme's own UI
 *   sidebar - the left navigation ([role="navigation"])
 *   chat    - conversation messages and the chat input
 * An area left on "Default" inherits from System; System on "Default" keeps the app's font.
 *
 * Size works as a scale: the app uses Tailwind rem classes (text-sm = 14px), so the chosen size is
 * relative to 14px body text, and every text-* / leading-N class inside the area is rescaled.
 * Code (code, pre, kbd, .font-mono) always keeps its monospace font.
 *
 * Settings are stored in localStorage (FONTS_KEY) and applied as one generated <style> element.
 */
(function () {
  'use strict';

  window.AntiCusTheme = window.AntiCusTheme || {};
  const ACT = window.AntiCusTheme;

  const FONTS_KEY = (ACT.CONSTANTS && ACT.CONSTANTS.FONTS_KEY) || 'act_fonts_v1';
  const STYLE_ID = 'act-fonts-css';
  const BASE_PX = 14;
  const MIN_PX = 10;
  const MAX_PX = 24;

  const AREAS = {
    system: { label: 'System', selectors: ['body'] },
    sidebar: { label: 'Sidebar', selectors: ['[role="navigation"]'] },
    chat: { label: 'Chat', selectors: ['[data-testid="conversation-view"]', '[data-testid="agent-input-box"]'] }
  };
  const AREA_ORDER = ['system', 'sidebar', 'chat'];

  // Tailwind defaults: [class, font-size rem, line-height rem]
  const TEXT_CLASSES = [
    ['text-xs', 0.75, 1],
    ['text-sm', 0.875, 1.25],
    ['text-base', 1, 1.5],
    ['text-lg', 1.125, 1.75],
    ['text-xl', 1.25, 1.75],
    ['text-2xl', 1.5, 2]
  ];
  const LEADING_CLASSES = [['leading-4', 1], ['leading-5', 1.25], ['leading-6', 1.5], ['leading-7', 1.75]];

  const NOT_CODE = ':not(code):not(pre):not(kbd):not(samp):not(.font-mono):not(code *):not(pre *):not(.font-mono *)';

  // Used only when queryLocalFonts() is unavailable; filtered to fonts actually installed.
  const FALLBACK_FONTS = [
    'Arial', 'Bahnschrift', 'Calibri', 'Cambria', 'Candara', 'Cascadia Code', 'Cascadia Mono', 'Comic Sans MS',
    'Consolas', 'Constantia', 'Corbel', 'Courier New', 'Ebrima', 'Fira Code', 'Franklin Gothic Medium', 'Gabriola',
    'Georgia', 'Inter', 'JetBrains Mono', 'Leelawadee UI', 'Lucida Console', 'Lucida Sans Unicode', 'Malgun Gothic',
    'Microsoft Sans Serif', 'Microsoft YaHei', 'Nirmala UI', 'Palatino Linotype', 'Roboto', 'Segoe Print',
    'Segoe Script', 'Segoe UI', 'Segoe UI Variable', 'Sitka Text', 'Sylfaen', 'Tahoma', 'Times New Roman',
    'Trebuchet MS', 'Verdana', 'Yu Gothic UI'
  ];

  let settings = load();
  let fontListPromise = null;
  const listeners = new Set();

  function emptySettings() {
    const s = {};
    AREA_ORDER.forEach((a) => { s[a] = { family: null, size: null }; });
    return s;
  }

  function load() {
    const s = emptySettings();
    try {
      const raw = JSON.parse(localStorage.getItem(FONTS_KEY) || '{}');
      AREA_ORDER.forEach((a) => {
        if (raw[a]) {
          s[a].family = typeof raw[a].family === 'string' && raw[a].family ? raw[a].family : null;
          s[a].size = typeof raw[a].size === 'number' ? clampSize(raw[a].size) : null;
        }
      });
    } catch (e) {}
    return s;
  }

  function save() {
    try {
      localStorage.setItem(FONTS_KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  function clampSize(px) {
    return Math.max(MIN_PX, Math.min(MAX_PX, Math.round(px)));
  }

  function cssFamily(name) {
    // Quote the family and keep the app's stack as fallback
    return '"' + String(name).replace(/["\\]/g, '') + '", system-ui, "Segoe UI", sans-serif';
  }

  function scoped(selectors, suffix) {
    return selectors.map((sel) => sel + suffix).join(',\n');
  }

  function buildCss() {
    const rules = [];
    AREA_ORDER.forEach((area) => {
      const sel = AREAS[area].selectors;
      const conf = settings[area];

      if (conf.family) {
        rules.push(scoped(sel, '') + ',\n' + scoped(sel, ' *' + NOT_CODE) +
          ' { font-family: ' + cssFamily(conf.family) + ' !important; }');
      }

      // Skip when it would not change anything relative to what the area inherits
      const inherited = area === 'system' ? BASE_PX : (settings.system.size || BASE_PX);
      if (conf.size && conf.size !== inherited) {
        // Let CSS do the division so sizes come out exact (e.g. 0.875rem * 18 / 14 = 18px)
        const s = conf.size + ' / ' + BASE_PX;
        rules.push(scoped(sel, '') + ' { font-size: calc(1rem * ' + s + '); }');
        TEXT_CLASSES.forEach(([cls, fs, lh]) => {
          rules.push(scoped(sel, ' .' + cls) + ' { font-size: calc(' + fs + 'rem * ' + s + ') !important; }');
          rules.push(scoped(sel, ' .' + cls + ':not([class*="leading-"])') +
            ' { line-height: calc(' + lh + 'rem * ' + s + ') !important; }');
        });
        LEADING_CLASSES.forEach(([cls, lh]) => {
          rules.push(scoped(sel, ' .' + cls) + ' { line-height: calc(' + lh + 'rem * ' + s + ') !important; }');
        });
      }
    });
    return rules.join('\n');
  }

  function apply() {
    let styleEl = document.getElementById(STYLE_ID);
    const css = buildCss();
    if (!css) {
      if (styleEl) styleEl.remove();
      return;
    }
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(styleEl);
    }
    if (styleEl.textContent !== css) styleEl.textContent = css;
  }

  function notify() {
    listeners.forEach((cb) => {
      try {
        cb(getSettings());
      } catch (e) {
        console.error('[AntiCusTheme.Fonts] listener error:', e);
      }
    });
  }

  function getSettings() {
    return JSON.parse(JSON.stringify(settings));
  }

  function isInstalled(family) {
    // A font is installed if text renders at a different width than both generic fallbacks
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const sample = 'mmmmmmmmmmlli1WQ@#';
    return ['monospace', 'serif'].some((generic) => {
      ctx.font = '32px ' + generic;
      const base = ctx.measureText(sample).width;
      ctx.font = '32px "' + family + '", ' + generic;
      return ctx.measureText(sample).width !== base;
    });
  }

  const Fonts = {
    AREAS: AREAS,
    AREA_ORDER: AREA_ORDER,
    BASE_PX: BASE_PX,
    MIN_PX: MIN_PX,
    MAX_PX: MAX_PX,

    init: function () {
      apply();
    },

    getSettings: getSettings,

    /** Effective values after inheritance (for UI display). */
    resolved: function (area) {
      const own = settings[area];
      const sys = settings.system;
      return {
        family: own.family || (area !== 'system' ? sys.family : null),
        size: own.size || (area !== 'system' ? sys.size : null) || BASE_PX
      };
    },

    setFamily: function (area, family) {
      if (!settings[area]) return;
      settings[area].family = family || null;
      save();
      apply();
      notify();
    },

    setSize: function (area, px) {
      if (!settings[area]) return;
      settings[area].size = (px === null || px === undefined) ? null : clampSize(px);
      save();
      apply();
      notify();
    },

    reset: function () {
      settings = emptySettings();
      save();
      apply();
      notify();
    },

    onChange: function (cb) {
      listeners.add(cb);
      return function () {
        listeners.delete(cb);
      };
    },

    /** Sorted unique family names of installed fonts (cached). */
    listSystemFonts: function () {
      if (!fontListPromise) {
        fontListPromise = (async () => {
          if (typeof window.queryLocalFonts === 'function') {
            try {
              const fonts = await window.queryLocalFonts();
              const families = [...new Set(fonts.map((f) => f.family))].filter(Boolean);
              if (families.length) return families.sort((a, b) => a.localeCompare(b));
            } catch (e) {
              console.warn('[AntiCusTheme.Fonts] queryLocalFonts failed, using fallback list:', e);
            }
          }
          return FALLBACK_FONTS.filter(isInstalled);
        })();
        // Allow a retry later if this attempt produced nothing
        fontListPromise.then((list) => { if (!list.length) fontListPromise = null; });
      }
      return fontListPromise;
    }
  };

  ACT.Fonts = Fonts;
})();
