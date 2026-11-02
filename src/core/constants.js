/**
 * Shared constants. localStorage keys are versioned (`_v1`) so a format change can use a new key.
 */
(function () {
  'use strict';

  window.AntiCusTheme = window.AntiCusTheme || {};

  window.AntiCusTheme.CONSTANTS = {
    VERSION: '1.1.0',
    STORAGE_KEY: 'act_theme_v1',
    MASCOT_VISIBLE_KEY: 'act_mascot_visible_v1',
    MOTION_KEY: 'act_motion_v1',
    FONTS_KEY: 'act_fonts_v1',
    DEFAULT_THEME_ID: 'unicorn',
    THEME_ORDER: [
      'unicorn',
      'ember',
      'cloud-drift',
      'honu-lagoon',
      'koi-pond',
      'jellyfish',
      'paper-boats',
      'fireflies',
      'moonlit'
    ]
  };
})();
