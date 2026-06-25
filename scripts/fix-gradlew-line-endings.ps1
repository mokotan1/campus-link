# gradlew.bat 줄바꿈 문제로 pull/merge가 막힐 때 실행합니다.
# IntelliJ를 닫은 뒤 PowerShell에서: .\scripts\fix-gradlew-line-endings.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "1/3 backend/gradlew.bat 원격(main) 버전으로 복구..."
git fetch origin main
git checkout origin/main -- backend/gradlew.bat

Write-Host "2/3 줄바꿈(CRLF) 정규화..."
git add --renormalize backend/gradlew.bat 2>$null

Write-Host "3/3 pull..."
git pull origin main

Write-Host ""
Write-Host "완료. git status:"
git status
