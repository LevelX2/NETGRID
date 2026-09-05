param(
  [string]$BaseRoot,
  [string]$UpdateRoot,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$BaseRoot = if ([string]::IsNullOrWhiteSpace($BaseRoot)) { Join-Path $projectRoot "output\windows-installer-e2e\base" } else { [System.IO.Path]::GetFullPath($BaseRoot) }
$UpdateRoot = if ([string]::IsNullOrWhiteSpace($UpdateRoot)) { Join-Path $projectRoot "output\windows-installer" } else { [System.IO.Path]::GetFullPath($UpdateRoot) }

Push-Location $projectRoot
try {
  & corepack pnpm check:release-boundary
  if ($LASTEXITCODE -ne 0) { throw "Das Releasegrenzen-Gate ist fehlgeschlagen." }
  if (-not $SkipBuild) {
    & corepack pnpm build:windows-installer
    if ($LASTEXITCODE -ne 0) { throw "Der vollständige Windows-Installer-Build ist fehlgeschlagen." }
  }
  & powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-windows-installer-e2e.ps1 -BaseRoot $BaseRoot -UpdateRoot $UpdateRoot
  if ($LASTEXITCODE -ne 0) { throw "Die erhöhte Windows-11-x64-Installationsmatrix ist fehlgeschlagen." }
  Write-Output "WINDOWS_INSTALLER_LOCAL_MATRIX_OK base=$BaseRoot update=$UpdateRoot"
  Write-Warning 'Dies ist keine vollständige Releasefreigabe: Die getrennten Clean-Windows-, Updater-Rollback-, Standardbenutzer-, Netzwerk- und UI-Gates müssen ebenfalls belegt sein.'
} finally {
  Pop-Location
}
