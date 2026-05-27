$ErrorActionPreference = "Stop"

$logDir = Join-Path $env:TEMP "netgrid"
$launcherLog = Join-Path $logDir "launcher.log"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Write-LauncherLog {
  param([Parameter(Mandatory = $true)][string]$Message)
  Add-Content -Path $launcherLog -Value "$(Get-Date -Format o) $Message"
}

function Stop-PortListeners {
  param([Parameter(Mandatory = $true)][int[]]$Ports)

  foreach ($port in $Ports) {
    $listeners = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($listener in $listeners) {
      try {
        Write-LauncherLog "Stopping NETGRID listener pid=$($listener.OwningProcess) port=$port"
        Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop
      } catch {
        Write-LauncherLog "Failed to stop NETGRID listener pid=$($listener.OwningProcess) port=$port error=$($_.Exception.Message)"
      }
    }
  }
}

Stop-PortListeners -Ports @(8787, 3100)
