@echo off
setlocal EnableExtensions
title MineSphere Launcher
cd /d "%~dp0"

set "PORTABLE_NODE=%~dp0runtime\node\node.exe"
set "NODE_CMD="

if exist "%PORTABLE_NODE%" (
  "%PORTABLE_NODE%" -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>18||(a===18&&b>=17)?0:1)" >nul 2>nul
  if not errorlevel 1 set "NODE_CMD=%PORTABLE_NODE%"
)

if not defined NODE_CMD call :find_global_node
if not defined NODE_CMD goto :install_portable
goto :run

:install_portable
echo.
echo  Node.js nao encontrado ou demasiado antigo.
echo  A descarregar o runtime portatil apenas na primeira vez...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\ensure-node.ps1"
if errorlevel 1 (
  echo.
  echo  Nao foi possivel preparar o Node.js.
  echo  Verifica a ligacao a Internet e tenta novamente.
  echo.
  pause
  exit /b 1
)
set "NODE_CMD=%PORTABLE_NODE%"
goto :run

:find_global_node
set "GLOBAL_NODE="
for /f "delims=" %%i in ('where node 2^>nul') do if not defined GLOBAL_NODE set "GLOBAL_NODE=%%i"
if not defined GLOBAL_NODE exit /b 0
echo "%GLOBAL_NODE%" | findstr /I /C:"\WindowsApps\" >nul
if not errorlevel 1 exit /b 0
"%GLOBAL_NODE%" -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>18||(a===18&&b>=17)?0:1)" >nul 2>nul
if errorlevel 1 exit /b 0
set "NODE_CMD=%GLOBAL_NODE%"
exit /b 0

:run
if not exist "%NODE_CMD%" (
  echo.
  echo  O runtime Node.js nao foi encontrado.
  echo.
  pause
  exit /b 1
)
"%NODE_CMD%" server.js %*
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo  O servidor terminou com erro ^(codigo %EXIT_CODE%^).
  pause
)
endlocal & exit /b %EXIT_CODE%
