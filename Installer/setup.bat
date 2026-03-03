@echo off
NET SESSION >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
    echo.
    echo ========================================================
    echo Installer Script Finished.
    echo If you see errors above, please take a screenshot.
    echo ========================================================
    pause
) ELSE (
    echo Administrator privileges required.
    echo Please Right-Click setup.bat and select 'Run as Administrator'.
    pause
)
