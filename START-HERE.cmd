@echo off
cd /d "%~dp0"
if not exist node_modules (
  call npm.cmd ci
  if errorlevel 1 goto failed
)
call npm.cmd run build
if errorlevel 1 goto failed
start "" "http://localhost:4202"
echo Starting VoltCart. Refresh the browser if it opens before the server is ready.
call npm.cmd start
goto end
:failed
echo Setup failed. Please review the message above.
pause
:end
