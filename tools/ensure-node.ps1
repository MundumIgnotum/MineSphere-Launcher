$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
} catch {
  # Mantem o valor predefinido do sistema.
}

$root = Split-Path -Parent $PSScriptRoot
$nodeDir = Join-Path $root 'runtime\node'
$nodeExe = Join-Path $nodeDir 'node.exe'
$tmpExe = "$nodeExe.download"

function Fail([string]$message) {
  Write-Host ''
  Write-Host "  ERRO: $message" -ForegroundColor Red
  exit 1
}

if (Test-Path -LiteralPath $nodeExe) {
  try {
    $installed = (& $nodeExe --version 2>$null).Trim()
    if ($LASTEXITCODE -eq 0) {
      $parts = $installed.TrimStart('v').Split('.')
      $major = [int]$parts[0]
      $minor = [int]$parts[1]
      if ($major -gt 18 -or ($major -eq 18 -and $minor -ge 17)) {
        Write-Host "  Runtime Node.js portatil ja esta pronto ($installed)." -ForegroundColor DarkGray
        exit 0
      }
      Write-Host "  Runtime Node.js antigo ($installed); a substituir..." -ForegroundColor Yellow
    }
  } catch {
    # O executavel existe mas nao arranca ou nao tem uma versao valida.
  }
}

$arch = $env:PROCESSOR_ARCHITEW6432
if (-not $arch) { $arch = $env:PROCESSOR_ARCHITECTURE }
if ([string]::IsNullOrWhiteSpace($arch)) {
  Fail 'Nao foi possivel detetar a arquitetura do Windows.'
}
$arch = $arch.ToUpperInvariant()

switch ($arch) {
  'AMD64' {
    $dist = 'latest-v24.x'
    $platform = 'win-x64'
  }
  'ARM64' {
    $dist = 'latest-v24.x'
    $platform = 'win-arm64'
  }
  'X86' {
    $dist = 'latest-v22.x'
    $platform = 'win-x86'
  }
  default {
    Fail "Arquitetura do Windows nao suportada: $arch"
  }
}

$url = "https://nodejs.org/dist/$dist/$platform/node.exe"
$sumsUrl = "https://nodejs.org/dist/$dist/SHASUMS256.txt"

Write-Host ''
Write-Host '  MineSphere Launcher' -ForegroundColor Cyan
Write-Host '  A preparar o Node.js portatil (apenas na primeira vez).' -ForegroundColor Cyan
Write-Host "  Plataforma: $platform"
Write-Host "  Download: $url"
Write-Host '  Pode demorar alguns minutos e ocupa cerca de 100 MB.' -ForegroundColor DarkGray
Write-Host ''

New-Item -ItemType Directory -Force -Path $nodeDir | Out-Null
if (Test-Path -LiteralPath $tmpExe) {
  Remove-Item -LiteralPath $tmpExe -Force -ErrorAction SilentlyContinue
}
if (Test-Path -LiteralPath $nodeExe) {
  Remove-Item -LiteralPath $nodeExe -Force -ErrorAction SilentlyContinue
}

$client = $null
try {
  $client = New-Object System.Net.WebClient
  $client.Headers.Add('User-Agent', 'MineSphereLauncher/1.0')
  $client.DownloadFile($url, $tmpExe)
} catch {
  if (Test-Path -LiteralPath $tmpExe) {
    Remove-Item -LiteralPath $tmpExe -Force -ErrorAction SilentlyContinue
  }
  Fail "Nao foi possivel descarregar o Node.js. Verifica a ligacao a Internet e tenta novamente. Detalhe: $($_.Exception.Message)"
} finally {
  if ($client) { $client.Dispose() }
}

$sumsClient = $null
try {
  $sumsClient = New-Object System.Net.WebClient
  $sumsClient.Headers.Add('User-Agent', 'MineSphereLauncher/1.0')
  $sums = $sumsClient.DownloadString($sumsUrl)
  $entry = ($sums -split "`r?`n" | Where-Object { $_ -match "\s$([regex]::Escape($platform))/node\.exe$" } | Select-Object -First 1)
  if (-not $entry) { throw 'Hash nao encontrado em SHASUMS256.txt.' }
  $expected = ($entry -split '\s+')[0].ToLowerInvariant()
  $actual = (Get-FileHash -LiteralPath $tmpExe -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $expected) { throw 'O hash SHA-256 nao corresponde.' }
  Write-Host '  Download verificado (SHA-256).' -ForegroundColor Green
} catch {
  if (Test-Path -LiteralPath $tmpExe) {
    Remove-Item -LiteralPath $tmpExe -Force -ErrorAction SilentlyContinue
  }
  Fail "O download do Node.js nao pode ser verificado. Tenta novamente. Detalhe: $($_.Exception.Message)"
} finally {
  if ($sumsClient) { $sumsClient.Dispose() }
}

try {
  Move-Item -LiteralPath $tmpExe -Destination $nodeExe -Force
} catch {
  if (Test-Path -LiteralPath $tmpExe) {
    Remove-Item -LiteralPath $tmpExe -Force -ErrorAction SilentlyContinue
  }
  Fail "Nao foi possivel instalar o Node.js em runtime\node. Detalhe: $($_.Exception.Message)"
}

try {
  $version = (& $nodeExe --version).Trim()
  if ($LASTEXITCODE -ne 0) { throw 'O executavel nao arrancou.' }
} catch {
  if (Test-Path -LiteralPath $nodeExe) {
    Remove-Item -LiteralPath $nodeExe -Force -ErrorAction SilentlyContinue
  }
  Fail "O Node.js foi descarregado, mas nao arrancou. Detalhe: $($_.Exception.Message)"
}

$licenseClient = $null
try {
  $licenseClient = New-Object System.Net.WebClient
  $licenseClient.Headers.Add('User-Agent', 'MineSphereLauncher/1.0')
  $licenseClient.DownloadFile("https://raw.githubusercontent.com/nodejs/node/$version/LICENSE", (Join-Path $nodeDir 'LICENSE'))
} catch {
  # A licenca e opcional; o runtime continua funcional.
} finally {
  if ($licenseClient) { $licenseClient.Dispose() }
}

Write-Host "  Node.js portatil instalado: $version" -ForegroundColor Green
exit 0
