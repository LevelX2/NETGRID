param(
  [string]$OpenUrl = "",
  [string]$OpenPath = "/",
  [switch]$ServerDevMode,
  [switch]$RestartServer
)

$ErrorActionPreference = "Stop"

$projectRoot = "C:\Projekte\NETGRID"
$localWebUrl = "http://127.0.0.1:3100"
$localServerUrl = "http://127.0.0.1:8787/health"
$logDir = Join-Path $env:TEMP "netgrid"
$serverLog = Join-Path $logDir "server.log"
$webLog = Join-Path $logDir "web.log"
$launcherLog = Join-Path $logDir "launcher.log"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Write-LauncherLog {
  param([Parameter(Mandatory = $true)][string]$Message)
  Add-Content -Path $launcherLog -Value "$(Get-Date -Format o) $Message"
}

function Test-Endpoint {
  param([Parameter(Mandatory = $true)][string]$Url)

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 4
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

function Test-EndpointOk {
  param([Parameter(Mandatory = $true)][string]$Url)

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 4
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 300
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
      "set `"$($entry.Key)=$($entry.Value)`""
    }
    $environmentPrefix = ($setCommands -join " && ") + " && "
  }

  $cmd = "$environmentPrefix$Command >> `"$LogPath`" 2>&1"
  Write-LauncherLog "Start-NetgridProcess command=$Command log=$LogPath"
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

function Join-WebPath {
  param(
    [Parameter(Mandatory = $true)][string]$BaseUrl,
    [string]$Path = "/"
  )

  if ([string]::IsNullOrWhiteSpace($Path) -or $Path -eq "/") {
    return $BaseUrl
  }

  $normalizedPath = $Path
  if (-not $normalizedPath.StartsWith("/")) {
    $normalizedPath = "/$normalizedPath"
  }
  return "$($BaseUrl.TrimEnd('/'))$normalizedPath"
}

function Get-UrlOrigin {
  param([Parameter(Mandatory = $true)][string]$Url)

  try {
    $uri = [Uri]$Url
    return "$($uri.Scheme)://$($uri.Authority)"
  } catch {
    return $null
  }
}

function Convert-LocalWebUrlToLan {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [Parameter(Mandatory = $true)][string]$LanWebUrl
  )

  try {
    $uri = [Uri]$Url
    if (($uri.Host -eq "127.0.0.1" -or $uri.Host -eq "localhost") -and $uri.Port -eq 3100) {
      return "$($LanWebUrl.TrimEnd('/'))$($uri.PathAndQuery)$($uri.Fragment)"
    }
  } catch {
    return $Url
  }

  return $Url
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

function Stop-PortListeners {
  param([Parameter(Mandatory = $true)][int[]]$Ports)

  $stopped = $false
  foreach ($port in $Ports) {
    $listeners = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($listener in $listeners) {
      try {
        Write-LauncherLog "Stopping listener pid=$($listener.OwningProcess) port=$port"
        Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop
        $stopped = $true
      } catch {
        # ignore
      }
    }
  }

  if ($stopped) {
    Start-Sleep -Seconds 2
  }
}

Set-Location $projectRoot

$lanIp = Get-LanIpv4
$webUrl = "http://${lanIp}:3100"
$serverUrl = "http://${lanIp}:8787/health"
$maintenanceSummaryUrl = "http://${lanIp}:8787/api/storage/maintenance/summary"
$targetOpenUrl = if ([string]::IsNullOrWhiteSpace($OpenUrl)) {
  Join-WebPath -BaseUrl $webUrl -Path $OpenPath
} else {
  $OpenUrl.Trim()
}
$targetOpenUrl = Convert-LocalWebUrlToLan -Url $targetOpenUrl -LanWebUrl $webUrl
$targetWebUrl = Get-UrlOrigin -Url $targetOpenUrl
if (-not $targetWebUrl) {
  $targetWebUrl = $webUrl
}
$serverMode = if ($ServerDevMode) { "dev-watch" } else { "normal" }
$serverCommand = if ($ServerDevMode) {
  "corepack pnpm --filter @netgrid/server dev"
} else {
  "corepack pnpm --filter @netgrid/server exec tsx src/index.ts"
}
Write-LauncherLog "Launcher start lanIp=$lanIp webUrl=$webUrl serverUrl=$serverUrl openUrl=$targetOpenUrl serverMode=$serverMode restartServer=$($RestartServer.IsPresent)"

$serverEnvironment = @{
  HOST = "0.0.0.0"
  NETGRID_PUBLIC_HOST = $lanIp
  NETGRID_DEPLOYMENT_PROFILE = "local"
  NETGRID_WEB_BASE_URL = $webUrl
  NETGRID_SERVER_BASE_URL = "http://${lanIp}:8787"
  NETGRID_ALLOWED_ORIGINS = "$webUrl,http://127.0.0.1:3100,http://localhost:3100"
}

$webEnvironment = @{
  NEXT_PUBLIC_NETGRID_SERVER_URL = "http://${lanIp}:8787"
  NETGRID_ALLOWED_DEV_ORIGINS = "localhost,127.0.0.1,${lanIp}"
}

$serverReadyLanBefore = Test-Endpoint -Url $serverUrl
$serverReadyLocalBefore = Test-Endpoint -Url $localServerUrl
$maintenanceRequested = $targetOpenUrl -match "/maintenance($|[/?#])"
$maintenanceReadyLanBefore = if ($maintenanceRequested) { Test-EndpointOk -Url $maintenanceSummaryUrl } else { $true }
Write-LauncherLog "Server precheck lan=$serverReadyLanBefore local=$serverReadyLocalBefore maintenanceRequested=$maintenanceRequested maintenanceLan=$maintenanceReadyLanBefore"

if ($RestartServer) {
  Stop-PortListeners -Ports @(8787)
  $serverReadyLanBefore = $false
  $serverReadyLocalBefore = $false
}

if ($serverReadyLanBefore -and $maintenanceRequested -and -not $maintenanceReadyLanBefore) {
  Stop-PortListeners -Ports @(8787)
  $serverReadyLanBefore = $false
  $serverReadyLocalBefore = $false
}

if (-not $serverReadyLanBefore) {
  Stop-PortListeners -Ports @(8787)
  Write-LauncherLog "Starting server command mode=$serverMode"
  Start-NetgridProcess -Command $serverCommand -LogPath $serverLog -Environment $serverEnvironment
}

$webReadyLanBefore = Test-Endpoint -Url $webUrl
$webReadyLocalBefore = Test-Endpoint -Url $localWebUrl
Write-LauncherLog "Web precheck lan=$webReadyLanBefore local=$webReadyLocalBefore"

if (-not $webReadyLanBefore) {
  Stop-PortListeners -Ports @(3100)
  Write-LauncherLog "Starting web command"
  Start-NetgridProcess -Command "corepack pnpm --filter @netgrid/web exec next dev --webpack --hostname 0.0.0.0 --port 3100" -LogPath $webLog -Environment $webEnvironment
}

$serverReady = Wait-Endpoint -Url $serverUrl
$webReady = Wait-Endpoint -Url $webUrl
$targetWebReady = Wait-Endpoint -Url $targetWebUrl -Seconds 10
Write-LauncherLog "Postcheck serverReady=$serverReady webReady=$webReady targetWebReady=$targetWebReady targetWebUrl=$targetWebUrl"

if ($serverReady -and $webReady -and $targetWebReady) {
  Write-LauncherLog "Launcher success opening $targetOpenUrl"
  Start-Process $targetOpenUrl
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

$message = "NETGRID konnte nicht im LAN-Modus gestartet werden.`nLAN-IP: $lanIp`nServer bereit: $serverReady`nWeb bereit: $webReady`nZielseite bereit: $targetWebReady$hint`n`nLogs:`n$serverLog`n$webLog"
Write-LauncherLog "Launcher failure serverReady=$serverReady webReady=$webReady targetWebReady=$targetWebReady hint=$hint"
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show($message, "NETGRID starten") | Out-Null
exit 1
