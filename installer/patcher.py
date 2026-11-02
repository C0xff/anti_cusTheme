"""
Inject / strip the theme loader inside the Antigravity desktop app's `resources/app.asar`.

How the theme gets into the app:
  A small loader is appended to the app's main-process entry (`package.json` -> "main",
  currently `dist/main.js`). It listens for every new BrowserWindow web contents and, on each
  `dom-ready`, reads the runtime bundle from disk and runs it in the page via
  `webContents.executeJavaScript`. The bundle carries its own CSS.

  Because the bundle is read from disk on every load, updating the theme only means copying a new
  bundle to the runtime directory and pressing Ctrl+R. `app.asar` only needs re-patching after an
  Antigravity update replaced it.

Why this design:
  - The clean source is always derived from the CURRENT `app.asar` by stripping our injection,
    never from an old backup. Restoring an old backup after an update would silently downgrade
    the app. Backups are kept only so `unpatch` can restore the exact original bytes.
  - Nothing is injected into `preload.js`. Preload runs in an isolated world with its own `window`,
    so a second copy of the bundle there would fight the main-world copy over the shared DOM.
  - The main-process loader hooks `web-contents-created` instead of wrapping app functions, so it
    does not depend on internal names that change between app versions.
"""

from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from .asar import AsarArchive, file_sha256
from .paths import AppTarget, get_runtime_bundle_path, get_storage_dir

INJECTION_MARKER = "/* ANTI_CUSTHEME_INJECTED */"


def _loader_js(bundle_path: Path) -> str:
    bundle = json.dumps(str(bundle_path).replace("\\", "/"))
    return f"""
{INJECTION_MARKER}
;(() => {{
  try {{
    const {{ app }} = require('electron');
    const fs = require('fs');
    const BUNDLE = {bundle};
    const inject = (wc) => {{
      try {{
        if (wc.isDestroyed() || !fs.existsSync(BUNDLE)) return;
        const code = fs.readFileSync(BUNDLE, 'utf-8');
        // userGesture=true lets the bundle call gesture-gated APIs such as queryLocalFonts()
        wc.executeJavaScript(code, true).catch((e) => console.error('[AntiCusTheme]', e));
      }} catch (e) {{
        console.error('[AntiCusTheme]', e);
      }}
    }};
    app.on('web-contents-created', (_event, wc) => {{
      if (wc.getType() !== 'window') return;
      wc.on('dom-ready', () => inject(wc));
    }});
  }} catch (e) {{
    console.error('[AntiCusTheme loader]', e);
  }}
}})();
"""


def _strip(source: str) -> str:
    if INJECTION_MARKER not in source:
        return source
    return source.split(INJECTION_MARKER)[0].rstrip() + "\n"


def _main_entry(archive: AsarArchive) -> str:
    pkg = json.loads(archive.read_file("package.json").decode("utf-8"))
    entry = str(pkg.get("main", "dist/main.js"))
    return entry[2:] if entry.startswith("./") else entry


def read_app_version(archive: AsarArchive) -> str:
    pkg = json.loads(archive.read_file("package.json").decode("utf-8"))
    return str(pkg.get("version", "unknown"))


def is_patched(asar_path: Path) -> bool:
    try:
        archive = AsarArchive(asar_path)
        return INJECTION_MARKER in archive.read_file(_main_entry(archive)).decode("utf-8", errors="ignore")
    except Exception:
        return False


def _strip_entry(archive: AsarArchive) -> str:
    """Remove the injection from the main entry in place; returns the entry path."""
    entry = _main_entry(archive)
    src = archive.read_file(entry).decode("utf-8")
    clean = _strip(src)
    if clean != src:
        archive.write_file(entry, clean.encode("utf-8"))
    return entry


# ---------------------------------------------------------------- state & backups

def _backup_dir() -> Path:
    d = get_storage_dir() / "backups"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _state_path() -> Path:
    return get_storage_dir() / "patch-state.json"


def read_state() -> Dict[str, Any]:
    try:
        return json.loads(_state_path().read_text(encoding="utf-8"))
    except Exception:
        return {}


def _write_state(state: Dict[str, Any]) -> None:
    _state_path().write_text(json.dumps(state, indent=2), encoding="utf-8")


def _backup_for(app_version: str) -> Optional[Path]:
    """Find an unpatched original backup of this app version (any *.orig whose package.json matches)."""
    for p in sorted(_backup_dir().glob("app.asar.*.orig")):
        try:
            archive = AsarArchive(p)
            if read_app_version(archive) == app_version and not is_patched(p):
                return p
        except Exception:
            continue
    return None


def _ensure_backup(asar_path: Path, app_version: str) -> Optional[Path]:
    existing = _backup_for(app_version)
    if existing:
        return existing
    if is_patched(asar_path):
        return None  # no clean copy of this version exists on disk
    dest = _backup_dir() / f"app.asar.{app_version}.{file_sha256(asar_path)[:12]}.orig"
    shutil.copy2(asar_path, dest)
    return dest


# ---------------------------------------------------------------- public API

def sync_runtime_bundle(bundle_js: Path) -> Path:
    dest = get_runtime_bundle_path()
    shutil.copy2(bundle_js, dest)
    return dest


def patch(target: AppTarget, bundle_js: Path) -> Dict[str, Any]:
    """Copy the bundle to the runtime dir and (re)inject the loader. The app must not be running."""
    runtime = sync_runtime_bundle(bundle_js)
    archive = AsarArchive(target.asar_path)
    app_version = read_app_version(archive)
    backup = _ensure_backup(target.asar_path, app_version)

    entry = _strip_entry(archive)
    main_src = archive.read_file(entry).decode("utf-8")
    archive.write_file(entry, (main_src + _loader_js(runtime)).encode("utf-8"))
    archive.save(target.asar_path)

    _write_state({
        "app_version": app_version,
        "asar_path": str(target.asar_path),
        "backup": str(backup) if backup else None,
        "patched_sha256": file_sha256(target.asar_path),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"app_version": app_version, "backup": backup, "runtime_bundle": runtime}


def unpatch(target: AppTarget) -> str:
    """Restore the exact original if we have it, else strip the injection. The app must not be running."""
    if not is_patched(target.asar_path):
        return "not patched"
    state = read_state()
    backup = Path(state["backup"]) if state.get("backup") else None
    if backup and backup.exists() and state.get("patched_sha256") == file_sha256(target.asar_path):
        shutil.copy2(backup, target.asar_path)
        result = f"restored backup {backup.name}"
    else:
        archive = AsarArchive(target.asar_path)
        _strip_entry(archive)
        archive.save(target.asar_path)
        result = "stripped injection"
    _state_path().unlink(missing_ok=True)
    return result
