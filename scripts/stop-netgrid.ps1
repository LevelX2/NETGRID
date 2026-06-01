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

function Stop-ProcessTrees {
  param(
    [Parameter(Mandatory = $true)][int[]]$RootProcessIds,
    [Parameter(Mandatory = $true)]$ProcessSnapshot,
    [Parameter(Mandatory = $true)][string]$Reason
  )

  $childrenByParent = @{}
  foreach ($process in $ProcessSnapshot) {
    $parentProcessId = [int]$process.ParentProcessId
    if (-not $childrenByParent.ContainsKey($parentProcessId)) {
      $childrenByParent[$parentProcessId] = @()
    }
    $childrenByParent[$parentProcessId] += [int]$process.ProcessId
  }

  $processIds = New-Object System.Collections.Generic.HashSet[int]
  $queue = New-Object System.Collections.Generic.Queue[int]
  foreach ($processId in $RootProcessIds) {
    if ($processId -gt 0) {
      $queue.Enqueue($processId)
    }
  }

  while ($queue.Count -gt 0) {
    $processId = $queue.Dequeue()
    if (-not $processIds.Add($processId)) {
      continue
    }

    if ($childrenByParent.ContainsKey($processId)) {
      foreach ($childProcessId in $childrenByParent[$processId]) {
        $queue.Enqueue([int]$childProcessId)
      }
    }
  }

  foreach ($processId in $processIds) {
    if ($processId -eq $PID) {
      continue
    }

    try {
      Write-LauncherLog "Stopping NETGRID process tree member pid=$processId reason=$Reason"
      Stop-Process -Id $processId -Force -ErrorAction Stop
    } catch {
      Write-LauncherLog "Failed to stop NETGRID process tree member pid=$processId reason=$Reason error=$($_.Exception.Message)"
    }
  }
}

function Stop-NetgridProcessTrees {
  $projectRoot = "C:\Projekte\NETGRID"
  $processes = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue)
  $roots = @(
    $processes |
      Where-Object {
        $commandLine = [string]$_.CommandLine
        $isProjectProcess = $commandLine -match [regex]::Escape($projectRoot)
        $isServerDev = $commandLine -match "pnpm\s+--filter\s+@netgrid/server\s+dev"
        $isServerNormal = $commandLine -match "pnpm\s+--filter\s+@netgrid/server\s+exec\s+tsx\s+src/index\.ts"
        $isServerTsxWatch = $commandLine -match "apps\\server" -and $commandLine -match "tsx" -and $commandLine -match "watch\s+src/index\.ts"
        $isWebDev = $commandLine -match "pnpm\s+--filter\s+@netgrid/web\s+exec\s+next\s+dev"
        $isNextDev = $commandLine -match "apps\\web" -and $commandLine -match "next" -and $commandLine -match "dev"
        $isServerDev -or $isServerNormal -or $isWebDev -or ($isProjectProcess -and ($isServerTsxWatch -or $isNextDev))
      } |
      Select-Object -ExpandProperty ProcessId
  )

  if ($roots.Count -gt 0) {
    Stop-ProcessTrees -RootProcessIds $roots -ProcessSnapshot $processes -Reason "netgrid-stop"
  }
}

Stop-PortListeners -Ports @(8787, 3100)
Stop-NetgridProcessTrees
