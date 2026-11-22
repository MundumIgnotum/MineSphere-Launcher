[CmdletBinding()]
param(
    [string]$Version = "",
    [string]$OutputDir = ""
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
if (-not $Version) {
    $package = Get-Content -LiteralPath (Join-Path $root 'package.json') -Raw | ConvertFrom-Json
    $Version = $package.version
}
if (-not $OutputDir) { $OutputDir = Join-Path $root 'dist' }
if (-not (Test-Path -LiteralPath $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

$buildRoot = Join-Path $root 'build'
$cache = Join-Path $buildRoot 'downloads'
$work = Join-Path $buildRoot 'desktop'
if (Test-Path -LiteralPath $work) { Remove-Item -LiteralPath $work -Recurse -Force }
New-Item -ItemType Directory -Force -Path $cache, $work | Out-Null

$framework = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319'
$csc = Join-Path $framework 'csc.exe'
if (-not (Test-Path -LiteralPath $csc)) {
    throw 'O compilador csc.exe do .NET Framework nao foi encontrado.'
}

function Download-File([string]$Url, [string]$Destination) {
    if (Test-Path -LiteralPath $Destination) { return }
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Destination) | Out-Null
    $temporary = "$Destination.download"
    if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Force }
    Write-Host "  A descarregar $Url"
    Invoke-WebRequest -UseBasicParsing -Uri $Url -OutFile $temporary -TimeoutSec 900
    Move-Item -LiteralPath $temporary -Destination $Destination -Force
}

function New-Zip([string]$Source, [string]$Destination) {
    if (Test-Path -LiteralPath $Destination) { Remove-Item -LiteralPath $Destination -Force }
    [System.IO.Compression.ZipFile]::CreateFromDirectory(
        $Source,
        $Destination,
        [System.IO.Compression.CompressionLevel]::Optimal,
        $false)
}

function New-RoundedPath([float]$x, [float]$y, [float]$width, [float]$height, [float]$radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2
    $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
    $path.AddArc($x + $width - $diameter, $y, $diameter, $diameter, 270, 90)
    $path.AddArc($x + $width - $diameter, $y + $height - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($x, $y + $height - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

function New-Icon([string]$Destination) {
    $bitmap = New-Object System.Drawing.Bitmap 256, 256
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.Color]::Transparent)

    $backgroundPath = New-RoundedPath 6 6 244 244 46
    $background = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF 0, 0),
        (New-Object System.Drawing.PointF 256, 256),
        [System.Drawing.Color]::FromArgb(255, 12, 22, 34),
        [System.Drawing.Color]::FromArgb(255, 6, 12, 20))
    $graphics.FillPath($background, $backgroundPath)

    $border = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 40, 65, 82)), 5
    $graphics.DrawPath($border, $backgroundPath)

    $hexagon = New-Object System.Drawing.Drawing2D.GraphicsPath
    $points = @(
        (New-Object System.Drawing.PointF 128, 20),
        (New-Object System.Drawing.PointF 222, 74),
        (New-Object System.Drawing.PointF 222, 182),
        (New-Object System.Drawing.PointF 128, 236),
        (New-Object System.Drawing.PointF 34, 182),
        (New-Object System.Drawing.PointF 34, 74)
    )
    $hexagon.AddPolygon($points)
    $hexPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 57, 217, 159)), 9
    $hexPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $graphics.DrawPath($hexPen, $hexagon)

    $sphere = New-Object System.Drawing.Drawing2D.GraphicsPath
    $sphere.AddEllipse(78, 80, 100, 100)
    $sphereBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush $sphere
    $sphereBrush.CenterColor = [System.Drawing.Color]::FromArgb(255, 234, 255, 247)
    $sphereBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(255, 13, 107, 87))
    $graphics.FillPath($sphereBrush, $sphere)

    $highlight = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(90, 255, 255, 255))
    $graphics.FillEllipse($highlight, 99, 99, 27, 20)

    $graphics.TranslateTransform(128, 130)
    $graphics.RotateTransform(-24)
    $ringPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(185, 143, 247, 207)), 6
    $graphics.DrawEllipse($ringPen, -76, -27, 152, 54)
    $graphics.ResetTransform()

    $dot = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 185, 255, 232))
    $graphics.FillEllipse($dot, 188, 92, 11, 11)

    $icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
    $stream = [System.IO.File]::Create($Destination)
    try {
        $icon.Save($stream)
    }
    finally {
        $stream.Close()
        $icon.Dispose()
        $dot.Dispose()
        $ringPen.Dispose()
        $highlight.Dispose()
        $sphereBrush.Dispose()
        $sphere.Dispose()
        $hexPen.Dispose()
        $hexagon.Dispose()
        $border.Dispose()
        $background.Dispose()
        $backgroundPath.Dispose()
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}

Write-Host ''
Write-Host '  MineSphere Desktop Builder' -ForegroundColor Cyan
Write-Host "  Versao: $Version"
Write-Host ''

# --- WebView2 SDK -----------------------------------------------------------------
$webViewVersion = '1.0.4370.26'
$webViewPackage = Join-Path $cache "microsoft.web.webview2.$webViewVersion.nupkg"
Download-File "https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/$webViewVersion/microsoft.web.webview2.$webViewVersion.nupkg" $webViewPackage
$webViewRoot = Join-Path $cache "webview2-$webViewVersion"
if (-not (Test-Path -LiteralPath (Join-Path $webViewRoot 'lib\net462\Microsoft.Web.WebView2.Core.dll'))) {
    if (Test-Path -LiteralPath $webViewRoot) { Remove-Item -LiteralPath $webViewRoot -Recurse -Force }
    [System.IO.Compression.ZipFile]::ExtractToDirectory($webViewPackage, $webViewRoot)
}
$webViewCore = Join-Path $webViewRoot 'lib\net462\Microsoft.Web.WebView2.Core.dll'
$webViewForms = Join-Path $webViewRoot 'lib\net462\Microsoft.Web.WebView2.WinForms.dll'
$webViewLoader = Join-Path $webViewRoot 'runtimes\win-x64\native\WebView2Loader.dll'

# --- Node.js ----------------------------------------------------------------------
$nodeCache = Join-Path $cache 'node-win-x64.exe'
Download-File 'https://nodejs.org/dist/latest-v24.x/win-x64/node.exe' $nodeCache
$sums = (Invoke-WebRequest -UseBasicParsing -Uri 'https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt' -TimeoutSec 60).Content
$entry = ($sums -split "`r?`n" | Where-Object { $_ -match '\swin-x64/node\.exe$' } | Select-Object -First 1)
if (-not $entry) { throw 'Nao foi possivel obter o SHA-256 do Node.js.' }
$expected = ($entry -split '\s+')[0].ToLowerInvariant()
$actual = (Get-FileHash -LiteralPath $nodeCache -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actual -ne $expected) {
    Remove-Item -LiteralPath $nodeCache -Force
    throw 'A verificacao SHA-256 do Node.js falhou.'
}
$nodeVersion = (& $nodeCache --version).Trim()
if ($LASTEXITCODE -ne 0) { throw 'O Node.js descarregado nao arrancou.' }

# --- Application staging ----------------------------------------------------------
$app = Join-Path $work 'app'
New-Item -ItemType Directory -Force -Path $app | Out-Null
foreach ($file in @('server.js', 'package.json', 'README.md', 'LICENSE', 'NOTICE.md')) {
    Copy-Item -LiteralPath (Join-Path $root $file) -Destination $app
}
Copy-Item -LiteralPath (Join-Path $root 'src') -Destination $app -Recurse
Copy-Item -LiteralPath (Join-Path $root 'public') -Destination $app -Recurse

$nodeDir = Join-Path $app 'runtime\node'
New-Item -ItemType Directory -Force -Path $nodeDir | Out-Null
Copy-Item -LiteralPath $nodeCache -Destination (Join-Path $nodeDir 'node.exe') -Force
try {
    Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/nodejs/node/$nodeVersion/LICENSE" -OutFile (Join-Path $nodeDir 'LICENSE') -TimeoutSec 60
}
catch {
    Set-Content -LiteralPath (Join-Path $nodeDir 'LICENSE') -Value 'Node.js is licensed under the MIT license. See https://nodejs.org/' -Encoding ASCII
}

$licensesDir = Join-Path $app 'licenses'
New-Item -ItemType Directory -Force -Path $licensesDir | Out-Null
Copy-Item -LiteralPath (Join-Path $webViewRoot 'LICENSE.txt') -Destination (Join-Path $licensesDir 'WebView2-LICENSE.txt') -Force
Copy-Item -LiteralPath (Join-Path $webViewRoot 'NOTICE.txt') -Destination (Join-Path $licensesDir 'WebView2-NOTICE.txt') -Force

$buildInfo = @"
namespace MineSphere
{
    internal static class BuildInfo
    {
        public const string Version = "$Version";
    }
}
"@
$buildInfoPath = Join-Path $work 'BuildInfo.cs'
Set-Content -LiteralPath $buildInfoPath -Value $buildInfo -Encoding ASCII

# --- Icon -------------------------------------------------------------------------
$iconPath = Join-Path $work 'minesphere.ico'
New-Icon $iconPath

# --- Desktop host -----------------------------------------------------------------
$hostExe = Join-Path $app 'MineSphere.exe'
$hostReferences = @(
    "/reference:$(Join-Path $framework 'System.dll')",
    "/reference:$(Join-Path $framework 'System.Core.dll')",
    "/reference:$(Join-Path $framework 'System.Windows.Forms.dll')",
    "/reference:$(Join-Path $framework 'System.Drawing.dll')",
    "/reference:$webViewCore",
    "/reference:$webViewForms"
)
Write-Host '  A compilar a aplicacao desktop...'
& $csc /nologo /target:winexe /platform:x64 /optimize+ "/win32icon:$iconPath" "/out:$hostExe" $hostReferences $buildInfoPath (Join-Path $root 'desktop\MineSphere.Desktop.cs')
if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar a aplicacao desktop.' }

Copy-Item -LiteralPath $webViewCore -Destination $app -Force
Copy-Item -LiteralPath $webViewForms -Destination $app -Force
Copy-Item -LiteralPath $webViewLoader -Destination $app -Force

# --- Uninstaller ------------------------------------------------------------------
$uninstallerExe = Join-Path $app 'MineSphereUninstall.exe'
$uninstallerReferences = @(
    "/reference:$(Join-Path $framework 'System.dll')",
    "/reference:$(Join-Path $framework 'System.Core.dll')",
    "/reference:$(Join-Path $framework 'System.Windows.Forms.dll')",
    "/reference:$(Join-Path $framework 'System.Drawing.dll')"
)
Write-Host '  A compilar o desinstalador...'
& $csc /nologo /target:winexe /platform:x64 /optimize+ "/win32icon:$iconPath" "/out:$uninstallerExe" $uninstallerReferences $buildInfoPath (Join-Path $root 'desktop\MineSphere.Uninstaller.cs')
if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar o desinstalador.' }

# --- Portable build ---------------------------------------------------------------
$portableDir = Join-Path $work 'portable'
New-Item -ItemType Directory -Force -Path $portableDir | Out-Null
Copy-Item -Path (Join-Path $app '*') -Destination $portableDir -Recurse -Force
# Only installed copies register an uninstaller, so keep it out of the portable ZIP.
$portableUninstaller = Join-Path $portableDir 'MineSphereUninstall.exe'
if (Test-Path -LiteralPath $portableUninstaller) { Remove-Item -LiteralPath $portableUninstaller -Force }
$portableReadme = @"
MineSphere Launcher - Edicao portatil
=====================================

Esta pasta e autonoma. O Node.js vai incluido e os dados ficam guardados aqui
(contas, instalacoes, mundos, Java e configuracoes).

Podes mover a pasta para outro computador com Windows 10/11 x64.
Para arrancar, abre MineSphere.exe.

Requisitos:
- Microsoft Edge WebView2 Runtime (incluido no Windows 11 e na maioria dos
  Windows 10 atualizados).
- Ligacao a Internet para descarregar o Minecraft e os loaders.
- Uma conta Minecraft legitima.

O MineSphere Launcher nao e afiliado com a Microsoft ou a Mojang.
"@
Set-Content -LiteralPath (Join-Path $portableDir 'portable.txt') -Value $portableReadme -Encoding UTF8
Set-Content -LiteralPath (Join-Path $portableDir 'LEIA-ME.txt') -Value $portableReadme -Encoding UTF8
$portableZip = Join-Path $OutputDir 'MineSphere-Portable.zip'
Write-Host '  A criar MineSphere-Portable.zip...'
New-Zip $portableDir $portableZip

# --- Installer build --------------------------------------------------------------
$payloadDir = Join-Path $work 'payload'
New-Item -ItemType Directory -Force -Path $payloadDir | Out-Null
Copy-Item -Path (Join-Path $app '*') -Destination $payloadDir -Recurse -Force
$payloadZip = Join-Path $work 'payload.zip'
Write-Host '  A criar o pacote do instalador...'
New-Zip $payloadDir $payloadZip

$installerExe = Join-Path $OutputDir 'MineSphere-Setup.exe'
$installerReferences = @(
    "/reference:$(Join-Path $framework 'System.dll')",
    "/reference:$(Join-Path $framework 'System.Core.dll')",
    "/reference:$(Join-Path $framework 'System.Windows.Forms.dll')",
    "/reference:$(Join-Path $framework 'System.Drawing.dll')",
    "/reference:$(Join-Path $framework 'System.IO.Compression.dll')",
    "/reference:$(Join-Path $framework 'System.IO.Compression.FileSystem.dll')"
)
Write-Host '  A compilar MineSphere-Setup.exe...'
& $csc /nologo /target:winexe /platform:x64 /optimize+ "/win32icon:$iconPath" "/out:$installerExe" $installerReferences "/resource:$payloadZip,Payload" $buildInfoPath (Join-Path $root 'desktop\MineSphere.Installer.cs')
if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar o instalador.' }

Write-Host ''
Write-Host '  Artefactos criados:' -ForegroundColor Green
Get-Item -LiteralPath $portableZip, $installerExe | ForEach-Object {
    Write-Host ("  - {0} ({1:N1} MB)" -f $_.FullName, ($_.Length / 1MB))
}
Write-Host ''
