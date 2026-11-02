/**
 * Bootstrapper and public API (`window.AntiCusTheme`).
 *
 * Init order matters: DOMAdapter applies theme variables and mounts the wallpaper container,
 * then the wallpaper engine, fonts, mascot, theme panel and keyboard shortcuts.
 * The init guard makes repeated injection (dom-ready on every reload) a no-op.
 */
(function () {
  'use strict';

  window.AntiCusTheme = window.AntiCusTheme || {};
  const ACT = window.AntiCusTheme;

  if (window.__ANTI_CUSTHEME_INITIALIZED__) return;

  const MODULES = ['DOMAdapter', 'WallpaperEngine', 'Fonts', 'Mascot', 'ThemePicker', 'SlashCommand'];

  function start() {
    if (window.__ANTI_CUSTHEME_INITIALIZED__) return;
    window.__ANTI_CUSTHEME_INITIALIZED__ = true;

    MODULES.forEach((name) => {
      try {
        ACT[name].init();
      } catch (e) {
        console.error('[AntiCusTheme] Failed to init ' + name + ':', e);
      }
    });
    console.log('[AntiCusTheme] v' + ACT.version + ' initialized.');
  }

  ACT.version = ACT.CONSTANTS.VERSION;
  ACT.init = start;

  ACT.getTheme = () => ACT.State.getThemeId();
  ACT.setTheme = (themeId, originCoords) => ACT.State.setThemeId(themeId, originCoords);
  ACT.nextTheme = (originCoords) => ACT.State.nextTheme(originCoords);
  ACT.prevTheme = (originCoords) => ACT.State.prevTheme(originCoords);

  ACT.openPicker = () => ACT.ThemePicker.open();
  ACT.closePicker = () => ACT.ThemePicker.close();
  ACT.togglePicker = () => ACT.ThemePicker.toggle();

  ACT.isMotionEnabled = () => ACT.State.isMotionEnabled();
  ACT.setMotion = (enabled) => ACT.State.setMotionEnabled(enabled);
  ACT.toggleMotion = () => {
    ACT.State.setMotionEnabled(!ACT.State.isMotionEnabled());
    return ACT.State.isMotionEnabled();
  };

  ACT.toggleMascot = () => {
    ACT.State.setMascotVisible(!ACT.State.isMascotVisible());
    return ACT.State.isMascotVisible();
  };
  ACT.triggerMascotJump = () => ACT.Mascot.triggerJump();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    setTimeout(start, 0);
  }
})();
