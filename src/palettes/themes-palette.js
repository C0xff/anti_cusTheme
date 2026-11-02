/**
 * anti_cusTheme - color palettes
 * 8-Theme Color Palettes & CSS Variable Definitions
 */

(function () {
  'use strict';

  var root = window;
  root.AntiCusTheme = root.AntiCusTheme || {};

  var PALETTES = {
    'ember': {
      id: 'ember',
      name: 'Ember',
      isLight: false,
      canvasBg: {
        top: '#181412',
        center: '#12100e',
        bottom: '#17100e',
        sideGlow: 'rgba(180, 95, 65, 0.14)',
        vignette: 'rgba(14, 12, 10, 0.72)',
        gridLine: 'rgba(224, 122, 95, 0.055)'
      },
      cssVars: {
        '--background': '#141210',
        '--foreground': '#EFECE6',
        '--primary': '#D97757',
        '--primary-foreground': '#FFFFFF',
        '--shell': '#181614',
        '--sidebar': '#181614',
        '--sidebar-secondary': 'rgba(239, 236, 230, 0.09)',
        '--sidebar-muted': 'rgba(239, 236, 230, 0.05)',
        '--secondary': 'rgba(239, 236, 230, 0.08)',
        '--secondary-foreground': '#C9C4BA',
        '--muted': '#1A1715',
        '--muted-foreground': '#948E84',
        '--placeholder': '#6B665E',
        '--card': '#161110',
        '--card-border': 'rgba(239, 236, 230, 0.11)',
        '--border': 'rgba(239, 236, 230, 0.08)',
        '--glass': 'rgba(22, 17, 16, 0.86)',
        '--glass-border': 'rgba(239, 236, 230, 0.12)',
        '--glass-highlight': 'rgba(255, 248, 238, 0.07)',
        '--scrim': 'rgba(0, 0, 0, 0.6)',
        '--content': 'transparent'
      },
      ui: {
        composerBg: 'rgba(22, 17, 16, 0.88)',
        composerBorder: 'rgba(224, 122, 95, 0.22)',
        userPillBg: '#1c1917',
        userPillText: '#f5f2eb',
        pickerBg: 'rgba(22, 19, 17, 0.94)',
        pickerBorder: 'rgba(255, 255, 255, 0.14)',
        accentColor: '#D97757'
      },
      ascii: {
        primary: '#d97757',
        secondary: '#b85d3b',
        highlight: '#ff9d79',
        ambient: 'rgba(217, 119, 87, 0.35)'
      }
    },

    'cloud-drift': {
      id: 'cloud-drift',
      name: 'Cloud Drift',
      isLight: true,
      canvasBg: {
        top: '#8cc6ec',
        center: '#b8dff5',
        bottom: '#a6cde4',
        sideGlow: 'rgba(130, 196, 240, 0.45)',
        vignette: 'rgba(192, 225, 244, 0.55)',
        gridLine: 'rgba(255, 255, 255, 0.14)'
      },
      cssVars: {
        '--background': '#b8dff5',
        '--foreground': '#142330',
        '--primary': '#0284c7',
        '--primary-foreground': '#FFFFFF',
        '--shell': '#c3e8fa',
        '--sidebar': 'rgba(195, 232, 250, 0.82)',
        '--sidebar-secondary': 'rgba(255, 255, 255, 0.55)',
        '--sidebar-muted': 'rgba(255, 255, 255, 0.32)',
        '--secondary': 'rgba(20, 35, 48, 0.08)',
        '--secondary-foreground': '#253b4e',
        '--muted': 'rgba(255, 255, 255, 0.65)',
        '--muted-foreground': '#3b5972',
        '--placeholder': '#5c7c96',
        '--card': '#f3f8fe',
        '--card-border': 'rgba(255, 255, 255, 0.85)',
        '--border': 'rgba(20, 50, 80, 0.11)',
        '--glass': 'rgba(243, 248, 254, 0.88)',
        '--glass-border': 'rgba(255, 255, 255, 0.9)',
        '--glass-highlight': 'rgba(255, 255, 255, 0.95)',
        '--scrim': 'rgba(15, 35, 55, 0.22)',
        '--content': 'transparent'
      },
      ui: {
        composerBg: 'rgba(243, 248, 254, 0.92)',
        composerBorder: 'rgba(255, 255, 255, 0.9)',
        userPillBg: '#f8fcfe',
        userPillText: '#142330',
        pickerBg: 'rgba(240, 248, 255, 0.94)',
        pickerBorder: 'rgba(20, 50, 80, 0.15)',
        accentColor: '#0284c7'
      },
      ascii: {
        primary: '#ffffff',
        secondary: '#d0ecfc',
        highlight: '#ffffff',
        ambient: 'rgba(255, 255, 255, 0.55)'
      }
    },

    'honu-lagoon': {
      id: 'honu-lagoon',
      name: 'Honu Lagoon',
      isLight: false,
      canvasBg: {
        top: '#1d6c6b',
        center: '#144d56',
        bottom: '#0a3542',
        sideGlow: 'rgba(72, 229, 214, 0.35)',
        vignette: 'rgba(12, 48, 56, 0.68)',
        gridLine: 'rgba(120, 240, 230, 0.07)'
      },
      cssVars: {
        '--background': '#103942',
        '--foreground': '#e6fbf9',
        '--primary': '#38d9c4',
        '--primary-foreground': '#042220',
        '--shell': '#1e635c',
        '--sidebar': '#1e635c',
        '--sidebar-secondary': 'rgba(230, 251, 249, 0.12)',
        '--sidebar-muted': 'rgba(230, 251, 249, 0.06)',
        '--secondary': 'rgba(56, 217, 196, 0.12)',
        '--secondary-foreground': '#b5f5ee',
        '--muted': '#0e2b33',
        '--muted-foreground': '#7ecac2',
        '--placeholder': '#52968f',
        '--card': '#0e232a',
        '--card-border': 'rgba(72, 229, 214, 0.16)',
        '--border': 'rgba(72, 229, 214, 0.12)',
        '--glass': 'rgba(14, 35, 42, 0.88)',
        '--glass-border': 'rgba(72, 229, 214, 0.20)',
        '--glass-highlight': 'rgba(168, 255, 247, 0.08)',
        '--scrim': 'rgba(4, 20, 26, 0.65)',
        '--content': 'transparent'
      },
      ui: {
        composerBg: 'rgba(14, 35, 42, 0.90)',
        composerBorder: 'rgba(56, 217, 196, 0.26)',
        userPillBg: '#0d191d',
        userPillText: '#e6fbf9',
        pickerBg: 'rgba(15, 38, 45, 0.95)',
        pickerBorder: 'rgba(56, 217, 196, 0.28)',
        accentColor: '#38d9c4'
      },
      ascii: {
        primary: '#38d9c4',
        secondary: '#20a390',
        highlight: '#78f7e6',
        ambient: 'rgba(56, 217, 196, 0.32)'
      }
    },

    'koi-pond': {
      id: 'koi-pond',
      name: 'Koi Pond',
      isLight: false,
      canvasBg: {
        top: '#315c4c',
        center: '#284d41',
        bottom: '#233c36',
        sideGlow: 'rgba(110, 205, 165, 0.28)',
        vignette: 'rgba(28, 52, 45, 0.68)',
        gridLine: 'rgba(160, 230, 195, 0.065)'
      },
      cssVars: {
        '--background': '#1e302a',
        '--foreground': '#edf6f2',
        '--primary': '#e08a3c',
        '--primary-foreground': '#ffffff',
        '--shell': '#283f37',
        '--sidebar': '#283f37',
        '--sidebar-secondary': 'rgba(237, 246, 242, 0.12)',
        '--sidebar-muted': 'rgba(237, 246, 242, 0.06)',
        '--secondary': 'rgba(224, 138, 60, 0.14)',
        '--secondary-foreground': '#f7cb9f',
        '--muted': '#1a2823',
        '--muted-foreground': '#8baea2',
        '--placeholder': '#5f7d73',
        '--card': '#1b2421',
        '--card-border': 'rgba(110, 205, 165, 0.15)',
        '--border': 'rgba(110, 205, 165, 0.12)',
        '--glass': 'rgba(27, 36, 33, 0.88)',
        '--glass-border': 'rgba(110, 205, 165, 0.18)',
        '--glass-highlight': 'rgba(215, 245, 230, 0.07)',
        '--scrim': 'rgba(10, 20, 16, 0.65)',
        '--content': 'transparent'
      },
      ui: {
        composerBg: 'rgba(27, 36, 33, 0.90)',
        composerBorder: 'rgba(224, 138, 60, 0.28)',
        userPillBg: '#141c1a',
        userPillText: '#edf6f2',
        pickerBg: 'rgba(26, 36, 33, 0.95)',
        pickerBorder: 'rgba(224, 138, 60, 0.26)',
        accentColor: '#e08a3c'
      },
      ascii: {
        primary: '#e08a3c',
        secondary: '#6ebd9f',
        highlight: '#ffb26b',
        ambient: 'rgba(110, 205, 165, 0.32)'
      }
    },

    'jellyfish': {
      id: 'jellyfish',
      name: 'Jellyfish',
      isLight: false,
      canvasBg: {
        top: '#0d2c40',
        center: '#091a2c',
        bottom: '#050811',
        sideGlow: 'rgba(30, 110, 165, 0.28)',
        vignette: 'rgba(6, 12, 22, 0.72)',
        gridLine: 'rgba(120, 180, 240, 0.06)'
      },
      cssVars: {
        '--background': '#07101b',
        '--foreground': '#f3eefc',
        '--primary': '#c77dff',
        '--primary-foreground': '#160226',
        '--shell': '#0b1c2c',
        '--sidebar': '#0b1c2c',
        '--sidebar-secondary': 'rgba(243, 238, 252, 0.12)',
        '--sidebar-muted': 'rgba(243, 238, 252, 0.06)',
        '--secondary': 'rgba(199, 125, 255, 0.14)',
        '--secondary-foreground': '#e5bfff',
        '--muted': '#0e1220',
        '--muted-foreground': '#8a9ec0',
        '--placeholder': '#5a6d8c',
        '--card': '#0c0f18',
        '--card-border': 'rgba(199, 125, 255, 0.16)',
        '--border': 'rgba(100, 150, 220, 0.12)',
        '--glass': 'rgba(12, 15, 24, 0.88)',
        '--glass-border': 'rgba(199, 125, 255, 0.20)',
        '--glass-highlight': 'rgba(225, 190, 255, 0.07)',
        '--scrim': 'rgba(2, 5, 12, 0.70)',
        '--content': 'transparent'
      },
      ui: {
        composerBg: 'rgba(12, 15, 24, 0.90)',
        composerBorder: 'rgba(199, 125, 255, 0.26)',
        userPillBg: '#161820',
        userPillText: '#f3eefc',
        pickerBg: 'rgba(12, 16, 26, 0.95)',
        pickerBorder: 'rgba(199, 125, 255, 0.28)',
        accentColor: '#c77dff'
      },
      ascii: {
        primary: '#c77dff',
        secondary: '#7b8cf8',
        highlight: '#e0b3ff',
        ambient: 'rgba(199, 125, 255, 0.32)'
      }
    },

    'paper-boats': {
      id: 'paper-boats',
      name: 'Paper Boats',
      isLight: false,
      canvasBg: {
        top: '#355c5b',
        center: '#29494b',
        bottom: '#172f31',
        sideGlow: 'rgba(130, 195, 195, 0.30)',
        vignette: 'rgba(24, 48, 50, 0.68)',
        gridLine: 'rgba(180, 225, 225, 0.065)'
      },
      cssVars: {
        '--background': '#1e3335',
        '--foreground': '#e9f4f5',
        '--primary': '#8ecae6',
        '--primary-foreground': '#082531',
        '--shell': '#284544',
        '--sidebar': '#284544',
        '--sidebar-secondary': 'rgba(233, 244, 250, 0.12)',
        '--sidebar-muted': 'rgba(233, 244, 250, 0.06)',
        '--secondary': 'rgba(142, 202, 230, 0.14)',
        '--secondary-foreground': '#cde8f5',
        '--muted': '#192627',
        '--muted-foreground': '#8fa8aa',
        '--placeholder': '#5d7678',
        '--card': '#16201f',
        '--card-border': 'rgba(142, 202, 230, 0.16)',
        '--border': 'rgba(142, 202, 230, 0.12)',
        '--glass': 'rgba(22, 32, 31, 0.88)',
        '--glass-border': 'rgba(142, 202, 230, 0.20)',
        '--glass-highlight': 'rgba(220, 245, 252, 0.07)',
        '--scrim': 'rgba(8, 20, 21, 0.68)',
        '--content': 'transparent'
      },
      ui: {
        composerBg: 'rgba(22, 32, 31, 0.90)',
        composerBorder: 'rgba(142, 202, 230, 0.28)',
        userPillBg: '#141b1c',
        userPillText: '#e9f4f5',
        pickerBg: 'rgba(23, 34, 33, 0.95)',
        pickerBorder: 'rgba(142, 202, 230, 0.26)',
        accentColor: '#8ecae6'
      },
      ascii: {
        primary: '#8ecae6',
        secondary: '#5a9998',
        highlight: '#bce4f5',
        ambient: 'rgba(142, 202, 230, 0.32)'
      }
    },

    'fireflies': {
      id: 'fireflies',
      name: 'Fireflies',
      isLight: false,
      canvasBg: {
        top: '#0a1418',
        center: '#081513',
        bottom: '#071910',
        sideGlow: 'rgba(45, 115, 75, 0.22)',
        vignette: 'rgba(6, 16, 14, 0.74)',
        gridLine: 'rgba(150, 230, 100, 0.05)'
      },
      cssVars: {
        '--background': '#0a1512',
        '--foreground': '#f0f7ea',
        '--primary': '#b5e61d',
        '--primary-foreground': '#142100',
        '--shell': '#0e1817',
        '--sidebar': '#0e1817',
        '--sidebar-secondary': 'rgba(240, 247, 234, 0.12)',
        '--sidebar-muted': 'rgba(240, 247, 234, 0.06)',
        '--secondary': 'rgba(181, 230, 29, 0.14)',
        '--secondary-foreground': '#d6f37a',
        '--muted': '#101a16',
        '--muted-foreground': '#8a9f8f',
        '--placeholder': '#5a6e60',
        '--card': '#0f1513',
        '--card-border': 'rgba(181, 230, 29, 0.15)',
        '--border': 'rgba(181, 230, 29, 0.11)',
        '--glass': 'rgba(15, 21, 19, 0.88)',
        '--glass-border': 'rgba(181, 230, 29, 0.20)',
        '--glass-highlight': 'rgba(235, 255, 185, 0.06)',
        '--scrim': 'rgba(3, 10, 8, 0.72)',
        '--content': 'transparent'
      },
      ui: {
        composerBg: 'rgba(15, 21, 19, 0.90)',
        composerBorder: 'rgba(181, 230, 29, 0.26)',
        userPillBg: '#141c19',
        userPillText: '#f0f7ea',
        pickerBg: 'rgba(14, 20, 18, 0.95)',
        pickerBorder: 'rgba(181, 230, 29, 0.26)',
        accentColor: '#b5e61d'
      },
      ascii: {
        primary: '#b5e61d',
        secondary: '#699920',
        highlight: '#e3ff68',
        ambient: 'rgba(181, 230, 29, 0.32)'
      }
    },

    'moonlit': {
      id: 'moonlit',
      name: 'Moonlit',
      isLight: false,
      canvasBg: {
        top: '#070917',
        center: '#0b1126',
        bottom: '#141730',
        sideGlow: 'rgba(45, 65, 135, 0.26)',
        vignette: 'rgba(8, 11, 24, 0.72)',
        gridLine: 'rgba(130, 150, 220, 0.06)'
      },
      cssVars: {
        '--background': '#0c0f20',
        '--foreground': '#f3f4fa',
        '--primary': '#dcd39e',
        '--primary-foreground': '#1f1e10',
        '--shell': '#0d1024',
        '--sidebar': '#0d1024',
        '--sidebar-secondary': 'rgba(243, 244, 250, 0.12)',
        '--sidebar-muted': 'rgba(243, 244, 250, 0.06)',
        '--secondary': 'rgba(220, 211, 158, 0.14)',
        '--secondary-foreground': '#eee7bf',
        '--muted': '#131528',
        '--muted-foreground': '#8a90af',
        '--placeholder': '#5a6080',
        '--card': '#12121e',
        '--card-border': 'rgba(220, 211, 158, 0.15)',
        '--border': 'rgba(130, 150, 220, 0.12)',
        '--glass': 'rgba(18, 18, 30, 0.88)',
        '--glass-border': 'rgba(220, 211, 158, 0.20)',
        '--glass-highlight': 'rgba(245, 240, 210, 0.06)',
        '--scrim': 'rgba(3, 5, 15, 0.72)',
        '--content': 'transparent'
      },
      ui: {
        composerBg: 'rgba(18, 18, 30, 0.90)',
        composerBorder: 'rgba(220, 211, 158, 0.26)',
        userPillBg: '#121422',
        userPillText: '#f3f4fa',
        pickerBg: 'rgba(17, 18, 32, 0.95)',
        pickerBorder: 'rgba(220, 211, 158, 0.26)',
        accentColor: '#dcd39e'
      },
      ascii: {
        primary: '#dcd39e',
        secondary: '#6c77a8',
        highlight: '#fffbe3',
        ambient: 'rgba(220, 211, 158, 0.30)'
      }
    }
  };

  // The project's own theme: pastel unicorn night (lavender, pink, mint, gold)
  PALETTES['unicorn'] = {
    id: 'unicorn',
    name: 'Unicorn',
    isLight: false,
    canvasBg: {
      top: '#1b1432',
      center: '#140f23',
      bottom: '#1e1228',
      sideGlow: 'rgba(197, 140, 255, 0.14)',
      vignette: 'rgba(10, 6, 18, 0.72)',
      gridLine: 'rgba(197, 140, 255, 0.05)'
    },
    cssVars: {
      '--background': '#15111F',
      '--foreground': '#F3EEFF',
      '--primary': '#B07CFF',
      '--primary-foreground': '#FFFFFF',
      '--shell': '#1A1526',
      '--sidebar': '#1A1526',
      '--sidebar-secondary': 'rgba(243, 238, 255, 0.09)',
      '--sidebar-muted': 'rgba(243, 238, 255, 0.05)',
      '--secondary': 'rgba(243, 238, 255, 0.08)',
      '--secondary-foreground': '#D6CCEB',
      '--muted': '#1E1830',
      '--muted-foreground': '#A296BD',
      '--placeholder': '#756A8F',
      '--card': '#1B1528',
      '--card-border': 'rgba(197, 140, 255, 0.16)',
      '--border': 'rgba(243, 238, 255, 0.08)',
      '--glass': 'rgba(27, 21, 40, 0.86)',
      '--glass-border': 'rgba(243, 238, 255, 0.12)',
      '--glass-highlight': 'rgba(255, 240, 255, 0.07)',
      '--scrim': 'rgba(6, 3, 12, 0.62)',
      '--content': 'transparent'
    },
    ui: {
      composerBg: 'rgba(27, 21, 40, 0.88)',
      composerBorder: 'rgba(255, 126, 182, 0.26)',
      userPillBg: '#221a31',
      userPillText: '#f6f0ff',
      pickerBg: 'rgba(24, 19, 36, 0.95)',
      pickerBorder: 'rgba(197, 140, 255, 0.28)',
      accentColor: '#ff7eb6'
    },
    ascii: {
      primary: '#c58cff',
      secondary: '#ff7eb6',
      highlight: '#ffe066',
      ambient: 'rgba(197, 140, 255, 0.30)',
      rainbow: ['#ff7eb6', '#ffb86b', '#ffe066', '#7ef0c9', '#7cc8ff', '#b48cff']
    }
  };

  root.AntiCusTheme.PALETTES = PALETTES;

})();
