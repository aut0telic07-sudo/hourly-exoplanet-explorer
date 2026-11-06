@echo off
title ASTRONAV // EXO-COMMAND v4.2 Launcher
set "APP_URL=file:///C:/Users/mmass/.gemini/antigravity/scratch/exoplanet-explorer/index.html"

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%APP_URL%" --window-size=1680,980
    exit /b 0
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%APP_URL%" --window-size=1680,980
    exit /b 0
)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%APP_URL%" --window-size=1680,980
    exit /b 0
)
start "" "C:\Users\mmass\.gemini\antigravity\scratch\exoplanet-explorer\index.html"
