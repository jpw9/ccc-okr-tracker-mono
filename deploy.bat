@echo off
REM Simple deployment command - just run: deploy
REM This builds both frontend and backend, then deploys to production server

cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 %*
