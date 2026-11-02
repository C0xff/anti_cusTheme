/**
 * Keyboard entry points for the theme panel:
 *   - typing `/theme`, `/themes`, `/wallpaper` or `/font` in any input, then Enter / Tab / Space
 *   - Ctrl+Shift+T or Alt+T anywhere
 * The mascot is the visible entry point; there is no extra button.
 */
(function () {
  'use strict';

  window.AntiCusTheme = window.AntiCusTheme || {};
  const ACT = window.AntiCusTheme;

  const COMMANDS = ['/theme', '/themes', '/wallpaper', '/font', '/fonts'];

  function clearInput(inputEl) {
    if ('value' in inputEl) {
      inputEl.value = '';
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (inputEl.isContentEditable) {
      // Rich editors (Lexical) keep their own model; select-all + delete keeps it in sync
      inputEl.focus();
      document.execCommand('selectAll', false);
      document.execCommand('delete', false);
    }
  }

  function handleInputKeyDown(e) {
    if (e.key !== 'Enter' && e.key !== 'Tab' && e.key !== ' ') return;
    const target = e.target;
    if (!target || !(target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable)) return;

    const text = ('value' in target ? target.value : target.textContent || '').trim().toLowerCase();
    if (!COMMANDS.includes(text)) return;

    e.preventDefault();
    e.stopPropagation();
    clearInput(target);
    ACT.ThemePicker.open();
    ACT.Mascot.triggerJump();
  }

  function handleGlobalKeyDown(e) {
    const key = (e.key || '').toLowerCase();
    const ctrlShiftT = (e.ctrlKey || e.metaKey) && e.shiftKey && key === 't';
    const altT = e.altKey && !e.ctrlKey && !e.shiftKey && key === 't';
    if (!ctrlShiftT && !altT) return;

    e.preventDefault();
    e.stopPropagation();
    ACT.ThemePicker.toggle();
    ACT.Mascot.triggerJump();
  }

  ACT.SlashCommand = {
    init: function () {
      document.addEventListener('keydown', handleInputKeyDown, true);
      window.addEventListener('keydown', handleGlobalKeyDown, true);
    }
  };
})();
