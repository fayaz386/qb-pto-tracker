# Helper Script to Apply Updates
Write-Host "============================" -ForegroundColor Cyan
Write-Host "   PTO Tracker Updater      " -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

$InstallDir = "C:\Apps\PTOTracker"

if (-not (Test-Path $InstallDir)) {
    Write-Error "Could not find installation at $InstallDir. Please run install.ps1 first."
    Pause
    Exit
}

# Check for new files in current directory
$SourceDir = $PSScriptRoot

Write-Host "`nStopping PTO Tracker..." -ForegroundColor Yellow
Stop-Process -Name "PTOTracker" -ErrorAction SilentlyContinue
Stop-Process -Name "node" -ErrorAction SilentlyContinue 
# Note: 'node' might stop other things, but this is a dedicated machine usually.

Write-Host "Applying Updates from $SourceDir..." -ForegroundColor Yellow

$Files = @("server.js", "package.json", "PTOTracker.exe", "server.pfx")
foreach ($file in $Files) {
    if (Test-Path "$SourceDir\$file") {
        Copy-Item "$SourceDir\$file" "$InstallDir\$file" -Force
        Write-Host "Updated: $file"
    }
}

$Folders = @("public", "services")
foreach ($folder in $Folders) {
    if (Test-Path "$SourceDir\$folder") {
        Copy-Item "$SourceDir\$folder" "$InstallDir\$folder" -Recurse -Force
        Write-Host "Updated: $folder"
    }
}

Write-Host "`nUpdate Complete!" -ForegroundColor Green
Write-Host "Restarting Application..."
Start-Process "$InstallDir\PTOTracker.exe"
