"""
Re-apply the theme after an Antigravity update.

An app update replaces `app.asar`, which removes the loader. `heal()` re-patches when needed.
It runs silently at every Windows login through a Startup-folder VBS script.
It never closes a running app: if the app is open, it logs and skips (run patch.bat instead).
"""

from __future__ import annotations

import os
import sys
from datetime import datetime
from pathlib import Path

from .paths import find_app, get_runtime_bundle_path, get_storage_dir, is_app_running
from .patcher import is_patched, patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
VBS_NAME = "anti-custheme-autoheal.vbs"


def _log(msg: str) -> None:
    line = f"[{datetime.now().isoformat(timespec='seconds')}] {msg}\n"
    with open(get_storage_dir() / "heal.log", "a", encoding="utf-8") as f:
        f.write(line)


def heal() -> str:
    target = find_app()
    if not target:
        result = "app not found"
    elif is_patched(target.asar_path):
        result = "already patched"
    elif is_app_running():
        result = "update detected but app is running; skipped (run patch.bat)"
    else:
        # Reuse the runtime bundle from the last patch so heal never needs a build step.
        bundle = get_runtime_bundle_path()
        if not bundle.exists():
            bundle = PROJECT_ROOT / "dist" / "anti-custheme.bundle.js"
        info = patch(target, bundle)
        result = f"re-patched app v{info['app_version']}"
    _log(result)
    return result


def get_startup_vbs_path() -> Path:
    appdata = Path(os.environ.get("APPDATA", str(Path.home() / "AppData" / "Roaming")))
    return appdata / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup" / VBS_NAME


def register_startup() -> Path:
    vbs_path = get_startup_vbs_path()
    vbs_path.parent.mkdir(parents=True, exist_ok=True)
    python_exe = Path(sys.executable)
    pythonw = python_exe.with_name("pythonw.exe")
    runner = pythonw if pythonw.exists() else python_exe
    cli = PROJECT_ROOT / "cli.py"
    vbs_path.write_text(
        'Set WshShell = CreateObject("WScript.Shell")\n'
        f'WshShell.Run """{runner}"" ""{cli}"" heal", 0, False\n',
        encoding="utf-8",
    )
    return vbs_path


def unregister_startup() -> bool:
    vbs_path = get_startup_vbs_path()
    if vbs_path.exists():
        vbs_path.unlink()
        return True
    return False
