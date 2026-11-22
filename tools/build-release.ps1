[CmdletBinding()]
param(
    [string]$Version = "",
    [string]$OutputDir = ""
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = Split-Path -Parent $PSScriptRoot
if (-not $Version) {
    $package = Get-Content -LiteralPath (Join-Path $root 'package.json') -Raw | ConvertFrom-Json
    $Version = $package.version
}
if (-not $OutputDir) { $OutputDir = Join-Path $root 'dist' }
if (Test-Path -LiteralPath $OutputDir) { Remove-Item -LiteralPath $OutputDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

function New-Zip([string]$Source, [string]$Destination) {
    if (Test-Path -LiteralPath $Destination) { Remove-Item -LiteralPath $Destination -Force }
    [System.IO.Compression.ZipFile]::CreateFromDirectory(
        $Source,
        $Destination,
        [System.IO.Compression.CompressionLevel]::Optimal,
        $false)
}

Write-Host ''
Write-Host '  MineSphere Release Builder' -ForegroundColor Cyan
Write-Host "  Version: $Version"
Write-Host ''

# --- Web edition ------------------------------------------------------------------
$web = Join-Path $root 'build\web'
if (Test-Path -LiteralPath $web) { Remove-Item -LiteralPath $web -Recurse -Force }
New-Item -ItemType Directory -Force -Path $web | Out-Null

$files = @(
    'server.js',
    'start.bat',
    'package.json',
    'README.md',
    'LICENSE',
    'NOTICE.md',
    'CONTRIBUTING.md'
)
foreach ($file in $files) {
    $source = Join-Path $root $file
    if (-not (Test-Path -LiteralPath $source)) { throw "Ficheiro em falta: $file" }
    Copy-Item -LiteralPath $source -Destination $web
}
foreach ($directory in @('src', 'public', 'tools')) {
    $source = Join-Path $root $directory
    if (-not (Test-Path -LiteralPath $source)) { throw "Pasta em falta: $directory" }
    Copy-Item -LiteralPath $source -Destination $web -Recurse
}

$webZip = Join-Path $OutputDir 'MineSphere-Web.zip'
Write-Host '  A criar MineSphere-Web.zip...'
New-Zip $web $webZip

# Compatibility name used by links from v1.0.0.
$legacyZip = Join-Path $OutputDir 'MineSphere-Launcher.zip'
Copy-Item -LiteralPath $webZip -Destination $legacyZip

# --- Desktop editions -------------------------------------------------------------
& (Join-Path $PSScriptRoot 'build-desktop.ps1') -Version $Version -OutputDir $OutputDir

# --- Checksums --------------------------------------------------------------------
$assets = Get-ChildItem -LiteralPath $OutputDir -File |
    Where-Object { $_.Extension -in @('.zip', '.exe') } |
    Sort-Object Name
$lines = foreach ($asset in $assets) {
    $hash = (Get-FileHash -LiteralPath $asset.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    "$hash  $($asset.Name)"
}
Set-Content -LiteralPath (Join-Path $OutputDir 'SHA256SUMS.txt') -Value $lines -Encoding ASCII

Write-Host ''
Write-Host '  Artefactos criados:' -ForegroundColor Green
foreach ($asset in $assets) {
    Write-Host ("  - {0} ({1:N1} MB)" -f $asset.Name, ($asset.Length / 1MB))
}
Write-Host ''
