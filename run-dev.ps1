# Ethara EvalOps local dev launcher for Windows PowerShell
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Start-Process cmd.exe -ArgumentList "/k cd /d `"$root\server`" && npm.cmd run dev" -WindowStyle Normal
Start-Process cmd.exe -ArgumentList "/k cd /d `"$root\client`" && npm.cmd run dev" -WindowStyle Normal
Write-Host "Started EvalOps API and UI."
Write-Host "Backend:  http://localhost:5000/api/health"
Write-Host "Frontend: http://localhost:5173"
