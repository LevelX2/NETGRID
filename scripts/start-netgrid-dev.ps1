param(
  [string]$OpenUrl = "",
  [string]$OpenPath = "/"
)

$ErrorActionPreference = "Stop"

$startScript = Join-Path $PSScriptRoot "start-netgrid.ps1"
& $startScript -OpenUrl $OpenUrl -OpenPath $OpenPath -ServerDevMode -RestartServer
