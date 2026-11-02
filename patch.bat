@echo off
rem Install or re-apply the theme (run this after every Antigravity update).
rem Closes Antigravity, patches it, then reopens it.
chcp 65001 >nul
py "%~dp0cli.py" patch
echo.
pause
