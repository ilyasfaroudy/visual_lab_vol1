@echo off
setlocal
cd /d "%~dp0"
node tools/server.mjs dist --lan
pause
