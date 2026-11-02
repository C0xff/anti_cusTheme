/**
 * Unicorn pixel mascot, drawn on a small canvas and seated on the chat composer's top edge
 * (or on the theme panel while it is open). Click it to open the theme / font panel.
 * Idle blink runs only while motion is on; a jump plays on click or theme change.
 */
(function () {
  'use strict';

  window.AntiCusTheme = window.AntiCusTheme || {};
  const ACT = window.AntiCusTheme;

  let containerEl = null;
  let canvasEl = null;
  let ctx = null;
  let animFrameId = null;
  let positionTimer = null;

  // Jump animation state
  let isJumping = false;
  let jumpStartTime = 0;
  const JUMP_DURATION = 380; // ms
  const JUMP_HEIGHT = 14; // canvas px

  // Blink state. All times use the rAF clock (performance.now), never Date.now().
  let isBlinking = false;
  let blinkStartTime = 0;
  let nextBlinkTime = performance.now() + 2500;
  const BLINK_DURATION = 140; // ms

  let isVisible = true;

  // 20x15 sprite, one char per 4px block, facing right.
  //   W body   S body shade   H horn   Y horn light   E eye   N muzzle   K hoof
  //   1-4 mane / tail stripes (rainbow; they cycle slowly while motion is on)
  const SPRITE = [
    '...............Y....',
    '..............YH....',
    '.............HH.....',
    '..........12WWWW....',
    '.........12WWWEWW...',
    '.........23WWWWWWW..',
    '........234WWWWWWNN.',
    '........34WWWW......',
    '...12....4WWWWW.....',
    '..123.WWWWWWWWWW....',
    '..234WWWWWWWWWWS....',
    '..34..WSWWWWWWSS....',
    '..4...WW.WW.WW.WW...',
    '......WW.WW.WW.WW...',
    '......KK.KK.KK.KK...'
  ];
  const COLS = 20;
  const ROWS = SPRITE.length;
  const BLOCK = 4;
  const CANVAS_W = 96;
  const CANVAS_H = 80;

  const COLORS = {
    W: '#fdfbff', S: '#e3d9f6', H: '#f2b632', Y: '#ffe48a',
    E: '#2a2140', N: '#ffb8d4', K: '#9d87d8'
  };
  const RAINBOW = ['#ff7eb6', '#ffb86b', '#ffe066', '#7ef0c9', '#7cc8ff', '#b48cff'];
  const OUTLINE = '#3a2b57';

  function blockColor(ch, cycle) {
    if (ch >= '1' && ch <= '4') return RAINBOW[(Number(ch) - 1 + cycle) % RAINBOW.length];
    if (ch === 'E' && isBlinking) return COLORS.W;
    return COLORS[ch];
  }


  function drawSparkle(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 2, 1, 5);
    ctx.fillRect(x - 2, y, 5, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, 1, 1);
  }

  function drawMascotFrame(time) {
    if (!ctx || !canvasEl) return;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    const motion = isMotionEnabled();
    if (motion && !isBlinking && time >= nextBlinkTime) {
      isBlinking = true;
      blinkStartTime = time;
    } else if (isBlinking && time - blinkStartTime >= BLINK_DURATION) {
      isBlinking = false;
      nextBlinkTime = time + 3000 + Math.random() * 3000;
    }

    let jumpOffset = 0;
    let jumpProgress = 0;
    if (isJumping) {
      jumpProgress = (time - jumpStartTime) / JUMP_DURATION;
      if (jumpProgress >= 1) {
        isJumping = false;
      } else {
        jumpOffset = -Math.sin(jumpProgress * Math.PI) * JUMP_HEIGHT;
      }
    }
    const lift = isJumping ? Math.sin(jumpProgress * Math.PI) : 0;

    const originX = Math.round((CANVAS_W - COLS * BLOCK) / 2);
    const baseY = CANVAS_H - ROWS * BLOCK - 4;
    const topY = Math.round(baseY + jumpOffset);

    // Floor shadow shrinks and fades while airborne
    ctx.fillStyle = 'rgba(20, 12, 32, ' + (0.32 * (1 - lift * 0.7)).toFixed(3) + ')';
    ctx.beginPath();
    ctx.ellipse(originX + 44, baseY + ROWS * BLOCK + 1, 26 * (1 - lift * 0.4), 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Two passes: a 1px outline around the whole silhouette, then the flat color blocks
    const cycle = motion ? Math.floor(time / 450) % RAINBOW.length : 0;
    for (let pass = 0; pass < 2; pass++) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const ch = SPRITE[r][c];
          if (ch === '.') continue;
          const x = originX + c * BLOCK;
          const y = topY + r * BLOCK;
          if (pass === 0) {
            ctx.fillStyle = OUTLINE;
            ctx.fillRect(x - 1, y - 1, BLOCK + 2, BLOCK + 2);
          } else {
            ctx.fillStyle = blockColor(ch, cycle);
            ctx.fillRect(x, y, BLOCK, BLOCK);
          }
        }
      }
    }

    if (isJumping) {
      ctx.save();
      ctx.globalAlpha = lift;
      drawSparkle(originX + 4, topY + 6, '#ffe066');
      drawSparkle(originX + COLS * BLOCK - 2, topY + 2, '#ff7eb6');
      drawSparkle(originX + 2, topY + 30, '#7cc8ff');
      drawSparkle(originX + COLS * BLOCK, topY + 26, '#b48cff');
      ctx.restore();
    }
  }

  function isMotionEnabled() {
    return ACT.State.isMotionEnabled();
  }

  // Render loop only runs while motion is on (idle blink) or during a jump.
  // Position is tracked separately on a slow timer to avoid per-frame layout reads.
  function loop(time) {
    animFrameId = null;
    if (isVisible && ctx) {
      drawMascotFrame(time);
    }
    if (isVisible && (isMotionEnabled() || isJumping)) {
      animFrameId = requestAnimationFrame(loop);
    }
  }

  function ensureLoop() {
    if (!animFrameId) {
      animFrameId = requestAnimationFrame(loop);
    }
  }

  // CSS size of the canvas (0.75x, aspect kept) and the y offset of the hooves in CSS px.
  const DISPLAY_W = 72;
  const FEET_Y = 57;
  const RIGHT_INSET = 24;

  /** Seat the mascot on the chat composer, or on the panel while it is open. */
  function updatePosition() {
    if (!containerEl) return;

    const picker = document.getElementById('act-panel');
    const isPickerOpen = picker && (picker.classList.contains('is-open') || picker.style.display !== 'none');

    if (isPickerOpen) {
      const pRect = picker.getBoundingClientRect();
      if (pRect.width > 0) {
        if (pRect.top - FEET_Y >= 4) {
          // Sit on the panel's top edge
          placeAt(pRect.right - DISPLAY_W - RIGHT_INSET, pRect.top - FEET_Y, '100000');
        } else if (pRect.right + DISPLAY_W + 12 <= window.innerWidth) {
          // No room above (panel near the window top): stand beside its top-right corner
          placeAt(pRect.right + 8, pRect.top + 4, '100000');
        } else {
          placeAt(pRect.right - DISPLAY_W - RIGHT_INSET, 4, '100000');
        }
        return;
      }
    }

    // Otherwise, sit on top-right of chat input composer
    const composer =
      document.querySelector('.surface-composer-card') ||
      document.querySelector('.surface-composer') ||
      document.querySelector('.agy-sheet textarea') ||
      document.querySelector('.part.auxiliarybar') ||
      document.querySelector('.interactive-input-part');

    if (composer) {
      const cRect = composer.getBoundingClientRect();
      if (cRect.width > 0) {
        // Feet rest on the composer's top border, near its right edge
        placeAt(cRect.right - DISPLAY_W - RIGHT_INSET, cRect.top - FEET_Y, '999');
        return;
      }
    }

    // Fallback: fixed bottom-right above input area
    placeAt(window.innerWidth - DISPLAY_W - 28, window.innerHeight - 140, '999');
  }

  function placeAt(left, top, zIndex) {
    const l = `${Math.round(left)}px`;
    const t = `${Math.round(top)}px`;
    const s = containerEl.style;
    if (s.left !== l) s.left = l;
    if (s.top !== t) s.top = t;
    if (s.zIndex !== zIndex) s.zIndex = zIndex;
  }

  const Mascot = {
    init: function () {
      if (containerEl && document.contains(containerEl)) return;

      containerEl = document.getElementById('act-mascot');
      if (!containerEl) {
        containerEl = document.createElement('div');
        containerEl.id = 'act-mascot';
        containerEl.className = 'act-mascot';
        containerEl.setAttribute('role', 'button');
        containerEl.setAttribute('tabindex', '0');
        containerEl.setAttribute('title', 'Unicorn · Themes & fonts (/theme)');

        canvasEl = document.createElement('canvas');
        canvasEl.className = 'act-mascot-canvas';
        canvasEl.width = CANVAS_W;
        canvasEl.height = CANVAS_H;
        ctx = canvasEl.getContext('2d');

        const tooltip = document.createElement('span');
        tooltip.className = 'act-mascot-tooltip';
        tooltip.textContent = 'Themes & fonts';

        containerEl.appendChild(canvasEl);
        containerEl.appendChild(tooltip);

        // Click mascot to toggle picker and jump!
        containerEl.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.triggerJump();
          ACT.State.togglePicker();
        });

        // Keyboard Enter/Space support
        containerEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.triggerJump();
            ACT.State.togglePicker();
          }
        });

        document.body.appendChild(containerEl);
      } else {
        canvasEl = containerEl.querySelector('canvas');
        if (canvasEl) ctx = canvasEl.getContext('2d');
      }

      this.setVisible(ACT.State.isMascotVisible());

      ensureLoop();
      updatePosition();

      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      if (!positionTimer) {
        positionTimer = setInterval(() => {
          if (isVisible && !document.hidden) updatePosition();
        }, 250);
      }

      ACT.State.onPickerChange(() => updatePosition());
      ACT.State.onMotionChange(() => {
        isBlinking = false;
        ensureLoop();
      });
    },

    triggerJump: function () {
      isJumping = true;
      jumpStartTime = performance.now();
      ensureLoop();
    },

    setVisible: function (visible) {
      isVisible = !!visible;
      if (containerEl) {
        containerEl.style.display = isVisible ? 'block' : 'none';
      }
      if (isVisible) {
        updatePosition();
        ensureLoop();
      }
    },

    destroy: function () {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      if (positionTimer) {
        clearInterval(positionTimer);
        positionTimer = null;
      }
      if (containerEl && containerEl.parentElement) {
        containerEl.parentElement.removeChild(containerEl);
      }
      containerEl = null;
      canvasEl = null;
      ctx = null;
    }
  };

  ACT.Mascot = Mascot;
})();
