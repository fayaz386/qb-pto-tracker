# PTO Tracker Installer Script
$ErrorActionPreference = "Stop"

try {
    # Default Install Path
    $InstallDir = "C:\Apps\PTOTracker"
    $SourceDir = Resolve-Path "$PSScriptRoot\.."

    Write-Host "============================" -ForegroundColor Cyan
    Write-Host "   PTO Tracker Installer    " -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan
    Write-Host ""

    # Check Admin Rights
    $isElevated = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
    if (-not $isElevated) {
        Write-Warning "This script typically requires Administrator privileges to write to C:\Apps."
        Write-Warning "Please run setup.bat as Administrator."
        Read-Host "Press Enter to exit..."
        Exit
    }

    # Prompt for Install Dir
    Write-Host "Destination: $InstallDir"
    $inputDir = Read-Host "Press ENTER to use this path, or type a new path"
    if ($inputDir -ne "" -and $inputDir -ne "y" -and $inputDir -ne "Y") { 
        $InstallDir = $inputDir 
    }

    # Check Node.js
    Write-Host "`nChecking Prerequisites..." -ForegroundColor Yellow
    
    # Try to find Node in PATH
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        # Not in PATH, try standard location
        $stdPath = "$env:ProgramFiles\nodejs"
        if (Test-Path "$stdPath\node.exe") {
            Write-Host "Found Node.js at $stdPath. Adding to PATH for this session..." -ForegroundColor Gray
            $env:Path += ";$stdPath"
        }
    }

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js is not installed or not in PATH. Please restart your computer to update the PATH."
        Read-Host "Press Enter to exit..."
        Exit
    }
    $nodeVer = node --version
    Write-Host "Found Node.js: $nodeVer" -ForegroundColor Green

    # Create Directory
    if (-not (Test-Path $InstallDir)) {
        New-Item -Path $InstallDir -ItemType Directory -Force | Out-Null
        Write-Host "Created directory: $InstallDir"
    }

    # Files to Copy
    $RequiredFiles = @("server.js", "package.json", "env.example", ".env", "PTOTracker.exe", "server.pfx")
    $RequiredFolders = @("public", "services")

    Write-Host "`nCopying Files..." -ForegroundColor Yellow

    foreach ($file in $RequiredFiles) {
        $src = Join-Path $SourceDir $file
        if (Test-Path $src) {
            Copy-Item $src $InstallDir -Force
            Write-Host "Copied $file"
        }
        else {
            Write-Warning "Missing source file: $file"
        }
    }

    foreach ($folder in $RequiredFolders) {
        $src = Join-Path $SourceDir $folder
        $dest = Join-Path $InstallDir $folder
        if (Test-Path $src) {
            Copy-Item $src $dest -Recurse -Force
            Write-Host "Copied folder $folder"
        }
    }

    # Install Dependencies
    Write-Host "`nInstalling Dependencies (this may take a moment)..." -ForegroundColor Yellow
    Push-Location $InstallDir
    try {
        npm install --production --no-audit --no-fund
    }
    catch {
        Write-Error "Failed to install dependencies."
    }
    Pop-Location

    # Create Shortcut
    Write-Host "`nCreating Shortcut..." -ForegroundColor Yellow
    $WScriptShell = New-Object -ComObject WScript.Shell
    $DesktopPath = [Environment]::GetFolderPath("Desktop")
    $ShortcutPath = Join-Path $DesktopPath "PTO Tracker.lnk"
    $Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = Join-Path $InstallDir "PTOTracker.exe"
    $Shortcut.WorkingDirectory = $InstallDir
    $Shortcut.Description = "Launch PTO Tracker"
    $Shortcut.IconLocation = Join-Path $InstallDir "PTOTracker.exe" 
    $Shortcut.Save()

    Write-Host "Shortcut created at: $ShortcutPath" -ForegroundColor Green

    Write-Host "`nInstallation Complete!" -ForegroundColor Cyan
    Write-Host "You can now launch the application from your Desktop."

}
catch {
    Write-Error "An unexpected error occurred: $_"
}

Read-Host "Press Enter to exit..."
