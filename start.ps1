# start.ps1 - PowerShell launcher for AgriSmart AI
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

Write-Host "===================================================" -ForegroundColor Green
Write-Host "  Starting AgriSmart AI Server & SQLite Backend... " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green

$agyNode = "$env:USERPROFILE\AppData\Roaming\Antigravity\bin\agy-node.cmd"

Start-Process "http://localhost:3000"

if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "Running with node from PATH..." -ForegroundColor Cyan
    node server.js
} elseif (Test-Path $agyNode) {
    Write-Host "Running with Antigravity Node runtime ($agyNode)..." -ForegroundColor Cyan
    & $agyNode server.js
} else {
    Write-Host "Node.js runtime not found." -ForegroundColor Red
}
