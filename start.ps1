# Instant Mechanic — local dev startup script
# Run from the project root: .\start.ps1

Write-Host "`n🚗 Instant Mechanic Dashboard" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# ── Backend ──────────────────────────────────────────────
Write-Host "`n[1/3] Pushing database schema..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"
npm run db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ db:push failed. Check your DATABASE_URL in backend\.env" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/3] Seeding database..." -ForegroundColor Yellow
npm run db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Seed failed." -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Database ready!" -ForegroundColor Green
Write-Host "`n[3/3] Starting backend dev server on http://localhost:5000 ..." -ForegroundColor Yellow
Write-Host "      (Open a second terminal and run: cd frontend ; npm run dev)" -ForegroundColor Gray
npm run dev
