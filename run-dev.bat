@echo off
set ROOT=%~dp0
start "EvalOps API" cmd /k "cd /d "%ROOT%server" && npm.cmd run dev"
start "EvalOps UI" cmd /k "cd /d "%ROOT%client" && npm.cmd run dev"
echo Started EvalOps API and UI.
echo Backend:  http://localhost:5000/api/health
echo Frontend: http://localhost:5173
pause
