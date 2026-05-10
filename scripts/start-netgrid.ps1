$ErrorActionPreference = "Stop"

$projectRoot = "C:\Projekte\NETGRID"
$localWebUrl = "http://127.0.0.1:3100"
$localServerUrl = "http://127.0.0.1:8787/health"
$logDir = Join-Path $env:TEMP "netgrid"
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

function Start-NetgridProcess {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(Mandatory = $true)][string]$LogPath,
    [hashtable]$Environment = @{}
  )

  $environmentPrefix = ""
  if ($Environment.Count -gt 0) {
    $setCommands = foreach ($entry in $Environment.GetEnumerator()) {
      "set $($entry.Key)=$($entry.Value)"
    }
    $environmentPrefix = ($setCommands -join " && ") + " && "
  }

  $cmd = "$environmentPrefix$Command >> `"$LogPath`" 2>&1"
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

function Get-LanIpv4 {
  try {
    $defaultRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction Stop |
      Where-Object { $_.NextHop -ne "0.0.0.0" } |
      Sort-Object -Property RouteMetric, InterfaceMetric |
      Select-Object -First 1
    if ($defaultRoute) {
      $routedIp = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $defaultRoute.InterfaceIndex -ErrorAction Stop |
        Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and -not $_.SkipAsSource } |
        Select-Object -First 1 -ExpandProperty IPAddress
      if ($routedIp) {
        return $routedIp
      }
    }
  } catch {
    # Fallback below
  }

  $fallbackIp = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and -not $_.SkipAsSource } |
    Select-Object -First 1 -ExpandProperty IPAddress

  if ($fallbackIp) {
    return $fallbackIp
  }

  return "127.0.0.1"
}

Set-Location $projectRoot

$lanIp = Get-LanIpv4
$webUrl = "http://$lanIp:3100"
$serverUrl = "http://$lanIp:8787/health"

$serverEnvironment = @{
  HOST = "0.0.0.0"
  NETGRID_DEPLOYMENT_PROFILE = "local"
  NETGRID_WEB_BASE_URL = $webUrl
  NETGRID_SERVER_BASE_URL = "http://$lanIp:8787"
  NETGRID_ALLOWED_ORIGINS = "$webUrl,http://127.0.0.1:3100,http://localhost:3100"
}

$webEnvironment = @{
  NEXT_PUBLIC_NETGRID_SERVER_URL = "http://$lanIp:8787"
}

$serverReadyLanBefore = Test-Endpoint -Url $serverUrl
$serverReadyLocalBefore = Test-Endpoint -Url $localServerUrl

if (-not $serverReadyLanBefore -and -not $serverReadyLocalBefore) {
  Start-NetgridProcess -Command "corepack pnpm --filter @netgrid/server dev" -LogPath $serverLog -Environment $serverEnvironment
}

$webReadyLanBefore = Test-Endpoint -Url $webUrl
$webReadyLocalBefore = Test-Endpoint -Url $localWebUrl

if (-not $webReadyLanBefore -and -not $webReadyLocalBefore) {
  Start-NetgridProcess -Command "corepack pnpm --filter @netgrid/web exec next dev --hostname 0.0.0.0 --port 3100" -LogPath $webLog -Environment $webEnvironment
}

$serverReady = Wait-Endpoint -Url $serverUrl
$webReady = Wait-Endpoint -Url $webUrl

if ($webReady) {
  Start-Process $webUrl
  exit 0
}

$localServerStillRunning = Test-Endpoint -Url $localServerUrl
$localWebStillRunning = Test-Endpoint -Url $localWebUrl
$hint = ""
if (-not $serverReady -and $localServerStillRunning) {
  $hint += "`nHinweis Server: Es laeuft bereits eine lokale Instanz auf 127.0.0.1:8787. Bitte diese beenden und das Icon erneut starten."
}
if (-not $webReady -and $localWebStillRunning) {
  $hint += "`nHinweis Web: Es laeuft bereits eine lokale Instanz auf 127.0.0.1:3100. Bitte diese beenden und das Icon erneut starten."
}

$message = "NETGRID konnte nicht im LAN-Modus gestartet werden.`nLAN-IP: $lanIp`nServer bereit: $serverReady`nWeb bereit: $webReady$hint`n`nLogs:`n$serverLog`n$webLog"
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show($message, "NETGRID starten") | Out-Null
exit 1
