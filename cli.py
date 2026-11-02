#!/usr/bin/env python3
"""
anti_cusTheme: ASCII wallpaper theme for the Antigravity desktop app - command line.

  build    Bundle src/ into dist/anti-custheme.bundle.js
  patch    Build, close Antigravity, inject the theme, register auto-heal, reopen Antigravity
  unpatch  Close Antigravity, remove the theme, remove auto-heal, reopen Antigravity
  reload   Build and copy the bundle to the runtime dir only (then press Ctrl+R in the app)
  heal     Re-patch silently if an app update removed the theme (used by the Startup hook)
  status   Show install / patch state
  test     Run the test suite
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from builder.build import build_bundle
from installer import autoheal, patcher
from installer.asar import AsarArchive
from installer.paths import EXE_NAME, AppTarget, find_app, get_runtime_bundle_path, get_storage_dir, is_app_running


def _require_app() -> AppTarget:
    target = find_app()
    if not target:
        print("[!] Antigravity desktop app not found (expected %LOCALAPPDATA%\\Programs\\antigravity).")
        raise SystemExit(1)
    return target


def _close_app(timeout_s: float = 15.0) -> bool:
    """Ask Antigravity to close, force-kill if it does not exit in time. Returns True if it was running."""
    if not is_app_running():
        return False
    print("[..] Closing Antigravity")
    subprocess.run(["taskkill", "/IM", EXE_NAME], capture_output=True)
    deadline = time.time() + timeout_s
    while time.time() < deadline and is_app_running():
        time.sleep(0.5)
    if is_app_running():
        subprocess.run(["taskkill", "/F", "/IM", EXE_NAME], capture_output=True)
        time.sleep(1.5)
    return True


def _open_app(target: AppTarget) -> None:
    subprocess.Popen([str(target.executable)], close_fds=True, creationflags=getattr(subprocess, "DETACHED_PROCESS", 0))
    print("[OK] Antigravity reopened")


def cmd_build(_args: argparse.Namespace) -> int:
    js = build_bundle()
    print(f"[OK] Built {js} ({js.stat().st_size / 1024:.1f} KB)")
    return 0


def cmd_patch(args: argparse.Namespace) -> int:
    target = _require_app()
    js = build_bundle()
    _close_app()
    info = patcher.patch(target, js)
    print(f"[OK] Patched Antigravity v{info['app_version']}")
    if info["backup"]:
        print(f"     Original backup : {info['backup']}")
    print(f"     Runtime bundle  : {info['runtime_bundle']}")
    print(f"[OK] Auto-heal at login: {autoheal.register_startup()}")
    if not args.no_open:
        _open_app(target)
    return 0


def cmd_unpatch(args: argparse.Namespace) -> int:
    target = _require_app()
    _close_app()
    print(f"[OK] {patcher.unpatch(target)}")
    if autoheal.unregister_startup():
        print("[OK] Removed auto-heal Startup hook")
    if not args.no_open:
        _open_app(target)
    return 0


def cmd_reload(_args: argparse.Namespace) -> int:
    js = build_bundle()
    dest = patcher.sync_runtime_bundle(js)
    print(f"[OK] Copied bundle to {dest}. Press Ctrl+R in Antigravity.")
    return 0


def cmd_heal(_args: argparse.Namespace) -> int:
    print(autoheal.heal())
    return 0


def cmd_status(_args: argparse.Namespace) -> int:
    target = find_app()
    state = patcher.read_state()
    vbs = autoheal.get_startup_vbs_path()
    print(f"Storage        : {get_storage_dir()}")
    print(f"Runtime bundle : {get_runtime_bundle_path()} ({'present' if get_runtime_bundle_path().exists() else 'missing'})")
    print(f"Auto-heal hook : {'enabled' if vbs.exists() else 'disabled'}")
    if not target:
        print("App            : not found")
        return 1
    archive = AsarArchive(target.asar_path)
    print(f"App            : v{patcher.read_app_version(archive)} at {target.root_dir}")
    print(f"Running        : {'yes' if is_app_running() else 'no'}")
    print(f"Theme          : {'PATCHED' if patcher.is_patched(target.asar_path) else 'not patched'}")
    if state.get("backup"):
        print(f"Backup         : {state['backup']}")
    return 0


def cmd_test(_args: argparse.Namespace) -> int:
    return subprocess.run([sys.executable, str(PROJECT_ROOT / "tests" / "test_suite.py")], cwd=str(PROJECT_ROOT)).returncode


def main() -> int:
    parser = argparse.ArgumentParser(description="anti_cusTheme for the Antigravity desktop app")
    sub = parser.add_subparsers(dest="command")
    sub.add_parser("build", help="Bundle src/ into dist/")
    p_patch = sub.add_parser("patch", help="Install or re-apply the theme (closes and reopens the app)")
    p_patch.add_argument("--no-open", action="store_true", help="Do not reopen Antigravity afterwards")
    p_unpatch = sub.add_parser("unpatch", help="Remove the theme (closes and reopens the app)")
    p_unpatch.add_argument("--no-open", action="store_true", help="Do not reopen Antigravity afterwards")
    sub.add_parser("reload", help="Rebuild and hot-swap the bundle (then Ctrl+R in the app)")
    sub.add_parser("heal", help="Re-patch if an app update removed the theme")
    sub.add_parser("status", help="Show install / patch state")
    sub.add_parser("test", help="Run the test suite")

    args = parser.parse_args()
    dispatch = {
        "build": cmd_build,
        "patch": cmd_patch,
        "unpatch": cmd_unpatch,
        "reload": cmd_reload,
        "heal": cmd_heal,
        "status": cmd_status,
        "test": cmd_test,
    }
    return dispatch[args.command or "status"](args)


if __name__ == "__main__":
    raise SystemExit(main())
