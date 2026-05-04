$ErrorActionPreference = "Stop"

$projectRoot = "C:\Projekte\Netrunner"
$webUrl = "http://127.0.0.1:3000"
$serverUrl = "http://127.0.0.1:8787/health"
$logDir = Join-Path $env:TEMP "netrunner"
$serverLog = Join-Path $logDir "server.log"
$webLog = Join-Path $logDir "web.log"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Test-Endpoint {
  param([Parameter(Mandatory = $true)][string]$Url)

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 4
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

function Start-NetrunnerProcess {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(Mandatory = $true)][string]$LogPath
  )

  $cmd = "$Command >> `"$LogPath`" 2>&1"
  Start-Process -FilePath "cmd.exe" -ArgumentList @("/d", "/c", $cmd) -WorkingDirectory $projectRoot -WindowStyle Hidden
}

function Wait-Endpoint {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [int]$Seconds = 35
  )

  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-Endpoint -Url $Url) {
      return $true
    }
    Start-Sleep -Seconds 1
  }
  return $false
}

Set-Location $projectRoot

if (-not (Test-Endpoint -Url $serverUrl)) {
  Start-NetrunnerProcess -Command "corepack pnpm --filter @netrunner/server dev" -LogPath $serverLog
}

if (-not (Test-Endpoint -Url $webUrl)) {
  Start-NetrunnerProcess -Command "corepack pnpm --filter @netrunner/web dev" -LogPath $webLog
}

$serverReady = Wait-Endpoint -Url $serverUrl
$webReady = Wait-Endpoint -Url $webUrl

if ($webReady) {
  Start-Process $webUrl
  exit 0
}

$message = "Netrunner konnte nicht gestartet werden.`nServer bereit: $serverReady`nWeb bereit: $webReady`nLogs:`n$serverLog`n$webLog"
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show($message, "Netrunner starten") | Out-Null
exit 1
