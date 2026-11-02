/**
 * Theme panel opened from the Unicorn mascot (also `/theme`, Ctrl+Shift+T, Alt+T).
 *
 * Tabs:
 *   Themes - 8 wallpaper cards with live thumbnails; arrow keys preview, Enter applies, Esc closes
 *   Fonts  - font family + size for System / Sidebar / Chat (see core/fonts.js)
 * Header: Motion On/Off toggle (stops all animation to save GPU) and close button.
 *
 * Placement: anchored above the chat composer when there is room, otherwise centered.
 * Built with createElement/textContent only (no innerHTML) to stay TrustedTypes-safe.
 */
(function () {
  'use strict';

  window.AntiCusTheme = window.AntiCusTheme || {};
  const ACT = window.AntiCusTheme;

  const MIN_SPACE_ABOVE = 280;
  const PREVIEW_TEXT = 'The quick brown fox jumps over the lazy dog. 0123456789';

  let pickerEl = null;
  let motionBtn = null;
  let hintsEl = null;
  let tabButtons = {};
  let tabPanels = {};
  let activeTab = 'themes';
  let cardElements = {};
  let selectedThemeIndex = 0;
  let isOpen = false;
  let fontRows = {};
  let fontListLoaded = false;

  // ------------------------------------------------------------------ helpers

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function getThemeOrder() {
    return ACT.CONSTANTS.THEME_ORDER;
  }

  function getThemeName(id) {
    return (ACT.PALETTES && ACT.PALETTES[id] && ACT.PALETTES[id].name) || id;
  }

  function currentThemeId() {
    return ACT.State.getThemeId();
  }

  function isMotionEnabled() {
    return ACT.State.isMotionEnabled();
  }

  function jumpMascot() {
    if (ACT.Mascot) ACT.Mascot.triggerJump();
  }

  // ------------------------------------------------------------------ placement

  function positionPicker() {
    if (!pickerEl || !isOpen) return;

    const composer =
      document.querySelector('.surface-composer-card') ||
      document.querySelector('.surface-composer') ||
      document.querySelector('[data-testid="agent-input-box"]');
    const cRect = composer ? composer.getBoundingClientRect() : null;
    const spaceAbove = cRect && cRect.width > 0 ? cRect.top - 10 - 16 : 0;
    const s = pickerEl.style;

    if (spaceAbove >= MIN_SPACE_ABOVE) {
      s.top = 'auto';
      s.bottom = Math.round(window.innerHeight - cRect.top + 10) + 'px';
      s.left = Math.round(cRect.left + cRect.width / 2) + 'px';
      s.transform = 'translateX(-50%)';
      s.maxHeight = Math.round(spaceAbove) + 'px';
    } else {
      s.top = '50%';
      s.bottom = 'auto';
      s.left = '50%';
      s.transform = 'translate(-50%, -50%)';
      s.maxHeight = Math.round(window.innerHeight - 32) + 'px';
    }
  }

  // ------------------------------------------------------------------ themes tab

  function themeCenter(themeId) {
    const card = cardElements[themeId];
    if (!card) return null;
    const r = card.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }

  function applyTheme(themeId) {
    ACT.State.setThemeId(themeId, themeCenter(themeId));
    jumpMascot();
  }

  function updateActiveCard(activeId) {
    const order = getThemeOrder();
    selectedThemeIndex = Math.max(0, order.indexOf(activeId));
    order.forEach((id) => {
      const card = cardElements[id];
      if (!card) return;
      const active = id === activeId;
      card.classList.toggle('is-selected', active);
      card.setAttribute('aria-selected', String(active));
    });
  }

  function renderThumbnails() {
    Object.keys(cardElements).forEach((themeId) => {
      const thumb = cardElements[themeId].querySelector('.act-tp-thumb');
      if (thumb && ACT.WallpaperEngine) ACT.WallpaperEngine.renderThumbnail(thumb, themeId);
    });
  }

  function buildThemesPanel() {
    const grid = el('div', 'act-tp-cards');
    grid.setAttribute('role', 'listbox');
    cardElements = {};

    getThemeOrder().forEach((themeId) => {
      const card = el('div', 'act-tp-card');
      card.setAttribute('role', 'option');
      card.setAttribute('tabindex', '0');
      card.dataset.themeId = themeId;

      // 136x76 backing store; CSS scales it with a fixed aspect ratio
      const thumb = el('canvas', 'act-tp-thumb');
      thumb.width = 136;
      thumb.height = 76;

      const labelRow = el('div', 'act-tp-label-row');
      labelRow.appendChild(el('span', 'act-tp-name', getThemeName(themeId)));
      labelRow.appendChild(el('span', 'act-tp-check', '✓'));

      card.appendChild(thumb);
      card.appendChild(labelRow);
      card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        applyTheme(themeId);
      });

      grid.appendChild(card);
      cardElements[themeId] = card;
    });
    return grid;
  }

  // ------------------------------------------------------------------ fonts tab

  function fillFontSelect(select, families) {
    const current = select.value;
    while (select.options.length > 1) select.remove(1);
    families.forEach((family) => {
      const opt = el('option', '', family);
      opt.value = family;
      select.appendChild(opt);
    });
    select.value = current;
  }

  function loadFontList() {
    if (fontListLoaded) return;
    fontListLoaded = true;
    ACT.Fonts.listSystemFonts().then((families) => {
      Object.values(fontRows).forEach((row) => fillFontSelect(row.select, families));
      syncFontRows();
      if (!families.length) fontListLoaded = false;
    });
  }

  function syncFontRows() {
    const Fonts = ACT.Fonts;
    const settings = Fonts.getSettings();
    Fonts.AREA_ORDER.forEach((area) => {
      const row = fontRows[area];
      if (!row) return;
      const own = settings[area];
      const eff = Fonts.resolved(area);

      // Keep a saved family selectable even before the font list has loaded
      if (own.family && ![...row.select.options].some((o) => o.value === own.family)) {
        const opt = el('option', '', own.family);
        opt.value = own.family;
        row.select.appendChild(opt);
      }
      row.select.value = own.family || '';
      row.select.options[0].textContent = area === 'system' ? 'Default (app font)' : 'Same as System';

      row.size.textContent = eff.size + 'px';
      row.size.classList.toggle('is-default', !own.size);
      row.minus.disabled = eff.size <= Fonts.MIN_PX;
      row.plus.disabled = eff.size >= Fonts.MAX_PX;

      row.preview.style.fontFamily = eff.family ? '"' + eff.family + '", system-ui, sans-serif' : '';
      row.preview.style.fontSize = eff.size + 'px';
    });
  }

  function buildFontRow(area) {
    const Fonts = ACT.Fonts;
    const row = el('div', 'act-tp-font-row');

    const head = el('div', 'act-tp-font-head');
    head.appendChild(el('span', 'act-tp-font-label', Fonts.AREAS[area].label));

    const select = el('select', 'act-tp-font-select');
    select.setAttribute('aria-label', Fonts.AREAS[area].label + ' font');
    const def = el('option', '', '');
    def.value = '';
    select.appendChild(def);
    select.addEventListener('change', () => Fonts.setFamily(area, select.value || null));

    const sizeBox = el('div', 'act-tp-size');
    const minus = el('button', 'act-tp-size-btn', '−');
    const size = el('span', 'act-tp-size-value');
    const plus = el('button', 'act-tp-size-btn', '+');
    minus.type = plus.type = 'button';
    minus.setAttribute('aria-label', 'Smaller');
    plus.setAttribute('aria-label', 'Larger');
    minus.addEventListener('click', () => Fonts.setSize(area, Fonts.resolved(area).size - 1));
    plus.addEventListener('click', () => Fonts.setSize(area, Fonts.resolved(area).size + 1));
    size.title = 'Click to reset size';
    size.addEventListener('click', () => Fonts.setSize(area, null));
    sizeBox.appendChild(minus);
    sizeBox.appendChild(size);
    sizeBox.appendChild(plus);

    head.appendChild(select);
    head.appendChild(sizeBox);
    row.appendChild(head);

    const preview = el('div', 'act-tp-font-preview', PREVIEW_TEXT);
    row.appendChild(preview);

    fontRows[area] = { select, size, minus, plus, preview };
    return row;
  }

  function buildFontsPanel() {
    const panel = el('div', 'act-tp-fonts');
    fontRows = {};
    ACT.Fonts.AREA_ORDER.forEach((area) => panel.appendChild(buildFontRow(area)));

    const footer = el('div', 'act-tp-fonts-footer');
    footer.appendChild(el('span', 'act-tp-fonts-note', 'Size is relative to 14px body text. Code keeps its monospace font.'));
    const reset = el('button', 'act-tp-pill-btn', 'Reset all');
    reset.type = 'button';
    reset.addEventListener('click', () => ACT.Fonts.reset());
    footer.appendChild(reset);
    panel.appendChild(footer);
    return panel;
  }

  // ------------------------------------------------------------------ shell

  function syncMotionButton() {
    if (!motionBtn) return;
    const on = isMotionEnabled();
    motionBtn.textContent = on ? 'Motion: On' : 'Motion: Off';
    motionBtn.setAttribute('aria-pressed', String(on));
    motionBtn.classList.toggle('is-off', !on);
  }

  function setTab(tab) {
    activeTab = tab;
    Object.keys(tabButtons).forEach((key) => {
      const active = key === tab;
      tabButtons[key].classList.toggle('is-active', active);
      tabButtons[key].setAttribute('aria-selected', String(active));
      tabPanels[key].hidden = !active;
    });
    if (hintsEl) hintsEl.hidden = tab !== 'themes';
    if (tab === 'fonts') {
      loadFontList();
      syncFontRows();
    }
    positionPicker();
  }

  function buildHeader() {
    const header = el('div', 'act-tp-header');

    const left = el('div', 'act-tp-header-left');
    const tabs = el('div', 'act-tp-tabs');
    tabs.setAttribute('role', 'tablist');
    tabButtons = {};
    [['themes', 'Themes'], ['fonts', 'Fonts']].forEach(([key, label]) => {
      const btn = el('button', 'act-tp-tab', label);
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setTab(key);
      });
      tabButtons[key] = btn;
      tabs.appendChild(btn);
    });
    left.appendChild(tabs);

    const right = el('div', 'act-tp-header-right');
    hintsEl = el('span', 'act-tp-hints', '←/→ select · ↵ apply · esc close');

    motionBtn = el('button', 'act-tp-pill-btn act-tp-motion');
    motionBtn.type = 'button';
    motionBtn.title = 'Turn wallpaper & mascot animation on/off (saves GPU)';
    motionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      ACT.State.setMotionEnabled(!isMotionEnabled());
    });
    syncMotionButton();

    const closeBtn = el('button', 'act-tp-close', '✕');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      ThemePicker.close();
    });

    right.appendChild(hintsEl);
    right.appendChild(motionBtn);
    right.appendChild(closeBtn);
    header.appendChild(left);
    header.appendChild(right);
    return header;
  }

  function handleKeyDown(e) {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      ThemePicker.close();
      return;
    }
    // Arrow/Enter shortcuts only on the Themes tab and never while a form control has focus
    const tag = (e.target && e.target.tagName) || '';
    if (activeTab !== 'themes' || tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;

    const order = getThemeOrder();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const step = e.key === 'ArrowLeft' ? -1 : 1;
      selectedThemeIndex = (selectedThemeIndex + step + order.length) % order.length;
      applyTheme(order[selectedThemeIndex]);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      applyTheme(order[selectedThemeIndex]);
      ThemePicker.close();
    }
  }

  function handleOutsideClick(e) {
    if (!isOpen || !pickerEl) return;
    if (!pickerEl.contains(e.target) && !e.target.closest('#act-mascot')) {
      ThemePicker.close();
    }
  }

  const ThemePicker = {
    buildDOM: function () {
      if (pickerEl && document.contains(pickerEl)) return pickerEl;

      pickerEl = el('div', 'act-panel');
      pickerEl.id = 'act-panel';
      pickerEl.setAttribute('role', 'dialog');
      pickerEl.setAttribute('aria-label', 'Theme and font settings');
      pickerEl.style.display = 'none';

      pickerEl.appendChild(buildHeader());
      tabPanels = { themes: buildThemesPanel(), fonts: buildFontsPanel() };
      pickerEl.appendChild(tabPanels.themes);
      pickerEl.appendChild(tabPanels.fonts);

      document.body.appendChild(pickerEl);
      setTab(activeTab);
      updateActiveCard(currentThemeId());
      return pickerEl;
    },

    open: function () {
      this.buildDOM();
      isOpen = true;
      pickerEl.style.display = 'block';
      updateActiveCard(currentThemeId());
      renderThumbnails();
      syncFontRows();
      positionPicker();
      window.addEventListener('resize', positionPicker);
      window.addEventListener('keydown', handleKeyDown, true);
      ACT.State.setPickerOpen(true);
    },

    close: function () {
      if (!isOpen) return;
      isOpen = false;
      if (pickerEl) pickerEl.style.display = 'none';
      window.removeEventListener('resize', positionPicker);
      window.removeEventListener('keydown', handleKeyDown, true);
      ACT.State.setPickerOpen(false);
    },

    toggle: function () {
      if (isOpen) this.close();
      else this.open();
      return isOpen;
    },

    isOpen: function () {
      return isOpen;
    },

    init: function () {
      this.buildDOM();
      document.addEventListener('click', handleOutsideClick);
      ACT.State.onPickerChange((open) => {
        if (open && !isOpen) this.open();
        else if (!open && isOpen) this.close();
      });
      ACT.State.subscribe((themeId) => updateActiveCard(themeId));
      ACT.State.onMotionChange(syncMotionButton);
      ACT.Fonts.onChange(syncFontRows);
    }
  };

  ACT.ThemePicker = ThemePicker;
})();
