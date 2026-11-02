"""
Locate the Antigravity desktop app and the theme's storage directory.
"""

from __future__ import annotations

import os
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

EXE_NAME = "Antigravity.exe"


@dataclass
class AppTarget:
    root_dir: Path
    asar_path: Path
    executable: Path


def get_storage_dir() -> Path:
    """`~/.gemini/anti-custheme`: runtime bundle, backups, state and logs.

    ACT_HOME overrides it (the test suite uses a temp dir so it never touches real backups).
    """
    d = Path(os.environ.get("ACT_HOME") or Path.home() / ".gemini" / "anti-custheme")
    d.mkdir(parents=True, exist_ok=True)
    return d


def get_runtime_bundle_path() -> Path:
    """The bundle the patched app reads from disk on every page load (hot-reloadable)."""
    d = get_storage_dir() / "runtime"
    d.mkdir(parents=True, exist_ok=True)
    return d / "anti-custheme.bundle.js"


def find_app(custom_dir: Optional[str] = None) -> Optional[AppTarget]:
    """Return the installed Antigravity desktop app, or None."""
    local_app_data = Path(os.environ.get("LOCALAPPDATA", str(Path.home() / "AppData" / "Local")))
    candidates = [Path(custom_dir)] if custom_dir else []
    candidates += [
        local_app_data / "Programs" / "antigravity",
        Path("C:/Program Files/Antigravity"),
    ]
    for root in candidates:
        asar = root / "resources" / "app.asar"
        if asar.exists():
            return AppTarget(root_dir=root, asar_path=asar, executable=root / EXE_NAME)
    return None


def is_app_running() -> bool:
    if os.name != "nt":
        return False
    try:
        out = subprocess.check_output(
            ["tasklist", "/FI", f"IMAGENAME eq {EXE_NAME}", "/NH"],
            stderr=subprocess.DEVNULL,
            text=True,
            timeout=5,
        )
        return EXE_NAME.lower() in out.lower()
    except Exception:
        return False
