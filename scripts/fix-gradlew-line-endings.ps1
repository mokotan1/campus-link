# gradlew.bat 줄바꿈 문제로 pull/merge가 막힐 때 실행합니다.
# IntelliJ를 닫은 뒤 PowerShell에서: .\scripts\fix-gradlew-line-endings.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$branch = git branch --show-current
if (-not $branch) { throw "Git 브랜치를 확인할 수 없습니다." }

Write-Host "현재 브랜치: $branch"
Write-Host "1/4 skip-worktree 등 로컬 Git 플래그 제거..."
git update-index --no-assume-unchanged backend/gradlew.bat 2>$null
git update-index --no-skip-worktree backend/gradlew.bat 2>$null

Write-Host "2/4 backend/gradlew.bat 원격($branch) 버전으로 복구..."
git fetch origin $branch
git checkout "origin/$branch" -- backend/gradlew.bat

Write-Host "3/4 pull..."
git pull origin $branch

Write-Host "4/4 상태 확인..."
git status

Write-Host ""
Write-Host "완료. IntelliJ를 다시 열고 VCS -> Refresh File Status 를 실행하세요."
