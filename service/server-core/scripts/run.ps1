$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
    Write-Host 'Starting SkillHub API http://127.0.0.1:8081 (gRPC 60052)'
    go run ./cmd/skillhub
} finally { Pop-Location }
