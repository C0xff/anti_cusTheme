"""
Installer package for anti_cusTheme, the ASCII wallpaper theme for the Antigravity desktop app.

Modules:
  paths    - install detection and the theme storage directory
  asar     - pure-Python Electron ASAR reader/writer
  patcher  - inject / strip the theme loader inside `app.asar`
  autoheal - re-patch after app updates (Windows Startup hook)
"""
