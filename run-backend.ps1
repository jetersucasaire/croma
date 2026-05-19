$ErrorActionPreference = "Stop"
Set-Location "D:\CROMA\CROMA\backend"

Write-Host "Starting backend..."
$process = Start-Process -FilePath "npx" -ArgumentList "ts-node-dev", "--respawn", "--transpile-only", "src/server.ts" -PassThru -NoNewWindow -Wait

Write-Host "Exit code: $($process.ExitCode)"