$ErrorActionPreference = "Stop"

Write-Host "Installing Security Certificate..." -ForegroundColor Yellow

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "This script requires Administrator privileges."
    Write-Warning "Please Right-Click > Run with PowerShell as Administrator."
    Read-Host "Press Enter to exit..."
    Exit
}

$pfxPath = Join-Path $PSScriptRoot "server.pfx"
if (-not (Test-Path $pfxPath)) {
    # Try parent directory
    $pfxPath = Join-Path $PSScriptRoot "..\server.pfx"
}

if (-not (Test-Path $pfxPath)) {
    Write-Error "Could not find server.pfx in current or parent directory."
    Write-Warning "Ensure server.pfx is in the same folder or the folder above."
    Read-Host "Press Enter to exit..."
    Exit
}

$pwd = ConvertTo-SecureString -String "password" -Force -AsPlainText

try {
    Import-PfxCertificate -FilePath $pfxPath -CertStoreLocation Cert:\LocalMachine\Root -Password $pwd
    Write-Host "Certificate successfully added to Trusted Root." -ForegroundColor Green
}
catch {
    Write-Error "Failed to install certificate: $_"
}

Write-Host "`nPlease RESTART your browser (Chrome/Edge) now." -ForegroundColor Cyan
Read-Host "Press Enter to exit..."
