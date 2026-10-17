# Run from any folder: powershell -File C:\Users\tuanhoang\Desktop\skillhub\start-api.ps1
$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot 'service/server-core')
try { go run ./cmd/skillhub } finally { Pop-Location }
