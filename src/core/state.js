/**
 * Persistent UI state: active theme, motion on/off, mascot visibility, panel open/closed.
 * Values are read from localStorage once at load and written on change.
 * Listeners: subscribe (theme), onPickerChange, onMotionChange.
 */
(function () {
  'use strict';

  window.AntiCusTheme = window.AntiCusTheme || {};
  const ACT = window.AntiCusTheme;
  const C = ACT.CONSTANTS;

  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }

  function emit(set, args, label) {
    set.forEach((cb) => {
      try {
        cb.apply(null, args);
      } catch (err) {
        console.error('[AntiCusTheme.State] ' + label + ' listener error:', err);
      }
    });
  }

  function listen(set, cb) {
    set.add(cb);
    return () => set.delete(cb);
  }

  const storedTheme = read(C.STORAGE_KEY);
  let currentThemeId = C.THEME_ORDER.includes(storedTheme) ? storedTheme : C.DEFAULT_THEME_ID;
  let mascotVisible = read(C.MASCOT_VISIBLE_KEY) !== 'false';
  let motionEnabled = read(C.MOTION_KEY) !== 'false';
  let pickerOpen = false;

  const themeListeners = new Set();
  const pickerListeners = new Set();
  const motionListeners = new Set();

  ACT.State = {
    getThemeId: () => currentThemeId,

    setThemeId: function (themeId, originCoords) {
      if (!C.THEME_ORDER.includes(themeId)) {
        console.warn('[AntiCusTheme.State] Unknown theme:', themeId);
        return false;
      }
      if (themeId === currentThemeId) return true;
      const prev = currentThemeId;
      currentThemeId = themeId;
      write(C.STORAGE_KEY, themeId);
      emit(themeListeners, [themeId, prev, originCoords], 'theme');
      return true;
    },

    nextTheme: function (originCoords) {
      const order = C.THEME_ORDER;
      return this.setThemeId(order[(order.indexOf(currentThemeId) + 1) % order.length], originCoords);
    },

    prevTheme: function (originCoords) {
      const order = C.THEME_ORDER;
      return this.setThemeId(order[(order.indexOf(currentThemeId) - 1 + order.length) % order.length], originCoords);
    },

    subscribe: (cb) => listen(themeListeners, cb),

    isPickerOpen: () => pickerOpen,

    setPickerOpen: function (open) {
      if (pickerOpen === !!open) return;
      pickerOpen = !!open;
      emit(pickerListeners, [pickerOpen], 'picker');
    },

    togglePicker: function () {
      this.setPickerOpen(!pickerOpen);
      return pickerOpen;
    },

    onPickerChange: (cb) => listen(pickerListeners, cb),

    isMascotVisible: () => mascotVisible,

    setMascotVisible: function (visible) {
      mascotVisible = !!visible;
      write(C.MASCOT_VISIBLE_KEY, String(mascotVisible));
      if (ACT.Mascot) ACT.Mascot.setVisible(mascotVisible);
    },

    isMotionEnabled: () => motionEnabled,

    setMotionEnabled: function (enabled) {
      if (motionEnabled === !!enabled) return;
      motionEnabled = !!enabled;
      write(C.MOTION_KEY, String(motionEnabled));
      emit(motionListeners, [motionEnabled], 'motion');
    },

    onMotionChange: (cb) => listen(motionListeners, cb)
  };
})();
