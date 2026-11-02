@echo off
rem Remove the theme and restore the original Antigravity files.
chcp 65001 >nul
py "%~dp0cli.py" unpatch
echo.
pause
