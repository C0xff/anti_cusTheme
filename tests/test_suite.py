#!/usr/bin/env python3
"""
Test suite. Run with `py cli.py test` (or `py tests/test_suite.py`).

  1. Bundle builds and passes `node --check`
  2. No innerHTML / outerHTML / insertAdjacentHTML in src/ (the app enforces TrustedTypes)
  3. All 8 themes exist in the manifest, palettes and scenes
  4. Real-browser smoke test (headless Chrome/Edge via tests/browser_smoke.mjs): init, no mutation
     loop, motion on/off frame counts, theme switch, panel tabs, per-area fonts and sizes
  5. ASAR patch / re-patch / unpatch round trip on a synthetic archive (temp dir, isolated storage)
  6. Read-only check of the live installed app, if present and patched

Tests never touch real backups: ACT_HOME points the storage dir at a temp folder.
"""

from __future__ import annotations

import json
import os
import re
import struct
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from builder.build import build_bundle  # noqa: E402
from installer.asar import AsarArchive  # noqa: E402
from installer.paths import AppTarget, find_app  # noqa: E402
from installer import patcher  # noqa: E402

EXPECTED_THEMES = [
    "unicorn", "ember", "cloud-drift", "honu-lagoon", "koi-pond",
    "jellyfish", "paper-boats", "fireflies", "moonlit",
]

BROWSER_CANDIDATES = [
    Path(os.environ.get("PROGRAMFILES", "C:/Program Files")) / "Google/Chrome/Application/chrome.exe",
    Path(os.environ.get("PROGRAMFILES(X86)", "C:/Program Files (x86)")) / "Microsoft/Edge/Application/msedge.exe",
    Path(os.environ.get("PROGRAMFILES", "C:/Program Files")) / "Microsoft/Edge/Application/msedge.exe",
]


def node_check(code: bytes) -> subprocess.CompletedProcess:
    with tempfile.NamedTemporaryFile(suffix=".js", delete=False) as tf:
        tf.write(code)
        path = Path(tf.name)
    try:
        return subprocess.run(["node", "--check", str(path)], capture_output=True, text=True, timeout=20)
    finally:
        path.unlink(missing_ok=True)


def write_asar(path: Path, files: dict, unpacked: tuple = ()) -> None:
    """Write a minimal ASAR with the given {"a/b.js": bytes} files plus unpacked placeholders."""
    header: dict = {"files": {}}
    payload = bytearray()
    for rel, data in files.items():
        node = header
        parts = rel.split("/")
        for part in parts[:-1]:
            node = node["files"].setdefault(part, {"files": {}})
        node["files"][parts[-1]] = {"offset": str(len(payload)), "size": len(data)}
        payload.extend(data)
    for rel in unpacked:
        header["files"][rel] = {"size": 10, "unpacked": True}
    hb = json.dumps(header, separators=(",", ":")).encode("utf-8")
    pad = (4 - len(hb) % 4) % 4
    prefix = struct.pack("<IIII", 4, 8 + len(hb) + pad, 4 + len(hb) + pad, len(hb))
    path.write_bytes(prefix + hb + b"\x00" * pad + bytes(payload))


class ThemeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.bundle = build_bundle()
        cls.tmp = tempfile.TemporaryDirectory()
        os.environ["ACT_HOME"] = str(Path(cls.tmp.name) / "storage")

    @classmethod
    def tearDownClass(cls) -> None:
        os.environ.pop("ACT_HOME", None)
        cls.tmp.cleanup()

    def test_1_bundle_builds_and_parses(self) -> None:
        self.assertGreater(self.bundle.stat().st_size, 20_000)
        res = node_check(self.bundle.read_bytes())
        self.assertEqual(res.returncode, 0, res.stderr)

    def test_2_trusted_types_safe(self) -> None:
        bad = re.compile(r"\.(innerHTML|outerHTML)\s*=|insertAdjacentHTML\(")
        offenders = [
            str(p.relative_to(PROJECT_ROOT))
            for p in (PROJECT_ROOT / "src").rglob("*.js")
            if bad.search(p.read_text(encoding="utf-8"))
        ]
        self.assertEqual(offenders, [])

    def test_3_all_themes_present(self) -> None:
        manifest = json.loads((PROJECT_ROOT / "config" / "theme-manifest.json").read_text(encoding="utf-8"))
        self.assertEqual([t["id"] for t in manifest["themes"]], EXPECTED_THEMES)
        palettes = (PROJECT_ROOT / "src/palettes/themes-palette.js").read_text(encoding="utf-8")
        scenes = "".join(p.read_text(encoding="utf-8") for p in (PROJECT_ROOT / "src/wallpapers").glob("scenes-*.js"))
        for tid in EXPECTED_THEMES:
            self.assertIn(f"'{tid}'", palettes, f"palette missing: {tid}")
            self.assertIn(f"'{tid}'", scenes, f"scene missing: {tid}")

    def test_4_browser_smoke(self) -> None:
        browser = next((b for b in BROWSER_CANDIDATES if b.exists()), None)
        if not browser:
            self.skipTest("no Chrome/Edge found for the browser smoke test")
        with tempfile.TemporaryDirectory() as tmp:
            res = subprocess.run(
                ["node", str(PROJECT_ROOT / "tests" / "browser_smoke.mjs"), str(browser), str(self.bundle), tmp],
                capture_output=True, text=True, timeout=120,
            )
        try:
            report = json.loads(res.stdout)
        except json.JSONDecodeError:
            self.fail(f"smoke test produced no report: {res.stdout[-500:]} {res.stderr[-500:]}")
        failed = [c for c in report["checks"] if not c["pass"]]
        self.assertEqual(failed, [], json.dumps(failed, indent=1))

    def test_5_asar_patch_roundtrip(self) -> None:
        tmp = Path(self.tmp.name) / "app"
        (tmp / "resources").mkdir(parents=True)
        asar = tmp / "resources" / "app.asar"
        main_src = b"'use strict';\nconsole.log('main');\n"
        write_asar(asar, {
            "package.json": json.dumps({"name": "antigravity", "version": "9.9.9", "main": "dist/main.js"}).encode(),
            "dist/main.js": main_src,
            "dist/preload.js": b"'use strict';\nconsole.log('preload');\n",
        }, unpacked=("native.node",))
        target = AppTarget(root_dir=tmp, asar_path=asar, executable=tmp / "Antigravity.exe")
        clean_bytes = asar.read_bytes()
        self.assertFalse(patcher.is_patched(asar))

        # First patch: byte-exact backup of the clean archive, loader only in the main entry
        info = patcher.patch(target, self.bundle)
        self.assertTrue(info["backup"] and info["backup"].exists())
        self.assertIn("9.9.9", info["backup"].name)
        archive = AsarArchive(asar)
        main = archive.read_file("dist/main.js").decode()
        self.assertIn(patcher.INJECTION_MARKER, main)
        self.assertNotIn(patcher.INJECTION_MARKER, archive.read_file("dist/preload.js").decode())
        self.assertTrue(archive.header["files"]["native.node"]["unpacked"])
        self.assertEqual(node_check(main.encode()).returncode, 0)

        size_once = asar.stat().st_size
        patcher.patch(target, self.bundle)
        self.assertEqual(asar.stat().st_size, size_once, "re-patching must not grow the archive")

        # Same install we patched: unpatch restores the exact original bytes
        self.assertTrue(patcher.unpatch(target).startswith("restored backup"))
        self.assertEqual(asar.read_bytes(), clean_bytes)

        # A patched file we don't recognise (changed after patching): unpatch strips in place
        patcher.patch(target, self.bundle)
        with open(asar, "ab") as f:
            f.write(b"\0")
        self.assertEqual(patcher.unpatch(target), "stripped injection")
        self.assertFalse(patcher.is_patched(asar))
        self.assertEqual(AsarArchive(asar).read_file("dist/main.js"), main_src)

    def test_6_live_install_readonly(self) -> None:
        target = find_app()
        if not target or not patcher.is_patched(target.asar_path):
            self.skipTest("Antigravity not installed or not patched")
        archive = AsarArchive(target.asar_path)
        entry = json.loads(archive.read_file("package.json"))["main"].lstrip("./")
        code = archive.read_file(entry)
        if patcher.INJECTION_MARKER in code.decode("utf-8", errors="ignore"):
            self.assertEqual(node_check(code).returncode, 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
