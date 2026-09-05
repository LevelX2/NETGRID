param([Parameter(Mandatory = $true)][string]$InputFile)

$ErrorActionPreference = "Stop"
$input = Get-Content -LiteralPath $InputFile -Raw | ConvertFrom-Json
$resultFile = [System.IO.Path]::GetFullPath([string]$input.resultFile)
$baseMsi = [System.IO.Path]::GetFullPath([string]$input.baseMsi)
$baseSetup = [System.IO.Path]::GetFullPath([string]$input.baseSetup)
$updateMsi = [System.IO.Path]::GetFullPath([string]$input.updateMsi)
$updateSetup = [System.IO.Path]::GetFullPath([string]$input.updateSetup)
$testId = [guid]::NewGuid().ToString("N")
$programRoot = Join-Path $env:ProgramFiles "NETGRID-E2E-$testId"
$dataRoot = Join-Path $env:ProgramData "NETGRID-E2E-$testId"
$logRoot = Join-Path ([System.IO.Path]::GetTempPath()) "NETGRID-E2E-$testId"
$startMenuRoot = Join-Path $env:ProgramData "Microsoft\Windows\Start Menu\Programs\NETGRID"
$desktopShortcut = Join-Path ([Environment]::GetFolderPath([Environment+SpecialFolder]::CommonDesktopDirectory)) "NETGRID.lnk"
$startedUtc = [DateTime]::UtcNow.ToString("O")
$unavailableDrive = @('Z','Y','X','W','V','U','T','S','R','Q','P','O','N','M','L','K','J','I','H','G','F','E','D') | Where-Object { -not (Test-Path -LiteralPath "${_}:\") } | Select-Object -First 1
if ([string]::IsNullOrWhiteSpace($unavailableDrive)) { throw "unavailable_drive_missing" }
$failedProgramRoot = "${unavailableDrive}:\NETGRID-E2E-unavailable-$testId"

function Assert-True { param([bool]$Condition, [string]$Code) if (-not $Condition) { throw $Code } }
function Invoke-Msi {
  param([string[]]$Arguments, [int[]]$Expected = @(0, 3010))
  $process = Start-Process -FilePath "msiexec.exe" -ArgumentList $Arguments -Wait -PassThru -WindowStyle Hidden
  if ($process.ExitCode -notin $Expected) { throw "msi_failed:$($process.ExitCode):$($Arguments -join ' ')" }
  return $process.ExitCode
}
function Invoke-GuiExecutable {
  param([string]$FilePath, [string[]]$Arguments, [int[]]$Expected = @(0))
  $encoded = @($Arguments | ForEach-Object { if ($_ -match '[\s"]') { '"' + $_.Replace('"', '""') + '"' } else { $_ } })
  $process = Start-Process -FilePath $FilePath -ArgumentList $encoded -Wait -PassThru -WindowStyle Hidden
  if ($process.ExitCode -notin $Expected) { throw "executable_failed:$($process.ExitCode):$([System.IO.Path]::GetFileName($FilePath))" }
  return $process.ExitCode
}
function Quote-Msi { param([string]$Value) return '"' + $Value.Replace('"', '""') + '"' }
function Product-Version { param([string]$Root) return [string](Get-Content -LiteralPath (Join-Path $Root "product-layout.json") -Raw | ConvertFrom-Json).product.installerVersion }
function Setup-Hash { param([string]$Path) return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Set-RuntimeEnvironment {
  param([string]$Path)
  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
    $separator = $trimmed.IndexOf("=")
    if ($separator -lt 1) { throw "runtime_environment_invalid" }
    $name = $trimmed.Substring(0, $separator)
    $value = $trimmed.Substring($separator + 1).Trim().Trim('"')
    [Environment]::SetEnvironmentVariable($name, $value, "Process")
  }
}
function Remove-IsolatedPath {
  param([string]$Path, [string]$AllowedParent)
  $resolved = [System.IO.Path]::GetFullPath($Path)
  $prefix = [System.IO.Path]::GetFullPath($AllowedParent).TrimEnd('\') + '\NETGRID-E2E-'
  if (-not $resolved.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) { throw "cleanup_scope_invalid:$resolved" }
  if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force }
}

New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
$installedBefore = @(
  Get-ItemProperty HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\* -ErrorAction SilentlyContinue
  Get-ItemProperty HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\* -ErrorAction SilentlyContinue
) | Where-Object DisplayName -eq "NETGRID"
Assert-True ($null -eq $installedBefore) "existing_netgrid_installation_detected"
Assert-True (-not (Test-Path -LiteralPath $startMenuRoot)) "existing_netgrid_start_menu_detected"
Assert-True (-not (Test-Path -LiteralPath $desktopShortcut)) "existing_netgrid_desktop_shortcut_detected"
Assert-True (-not (Test-Path -LiteralPath 'HKLM:\SOFTWARE\LevelX2\NETGRID')) "existing_netgrid_data_registration_detected"
$baseVersion = [string](Get-Content -LiteralPath (Join-Path (Split-Path $baseMsi) "release-metadata.json") -Raw | ConvertFrom-Json).product.installerVersion
$updateVersion = [string](Get-Content -LiteralPath (Join-Path (Split-Path $updateMsi) "release-metadata.json") -Raw | ConvertFrom-Json).product.installerVersion

try {
  Assert-True ([Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) "elevation_required"
  Assert-True ((Get-CimInstance Win32_OperatingSystem).Caption -match "Windows 11") "windows_11_required"
  Assert-True ($env:PROCESSOR_ARCHITECTURE -eq "AMD64") "x64_required"
  Assert-True (@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object LocalPort -in 32141,32142).Count -eq 0) "e2e_ports_busy"

  $recommendedLog = Join-Path $logRoot "install-recommended.log"
  Invoke-Msi @(
    "/i", (Quote-Msi $baseMsi), "/qn", "/norestart", "/l*v", (Quote-Msi $recommendedLog),
    "INSTALLFOLDER=$(Quote-Msi $programRoot)", "NETGRID_DATA_ROOT=$(Quote-Msi $dataRoot)",
    "NETGRID_WEB_PORT=32141", "NETGRID_SERVER_PORT=32142",
    "NETGRID_SETUP_SOURCE=$(Quote-Msi $baseSetup)", "NETGRID_SETUP_SHA256=$(Setup-Hash $baseSetup)"
  ) | Out-Null
  Assert-True ((Product-Version $programRoot) -eq $baseVersion) "recommended_install_version_invalid"
  $environmentPath = Join-Path $dataRoot "config\runtime.env"
  $recommendedEnvironment = Get-Content -LiteralPath $environmentPath -Raw
  Assert-True ($recommendedEnvironment -match "NETGRID_DEPLOYMENT_PROFILE=local") "recommended_profile_invalid"
  Assert-True ($recommendedEnvironment -match "NETGRID_INITIAL_CLEANUP_RETENTION_DAYS=30") "recommended_retention_invalid"
  Assert-True ($recommendedEnvironment -match "NETGRID_ACCOUNT_ACCESS_MODE=simple") "recommended_account_mode_invalid"
  Assert-True (Test-Path -LiteralPath $desktopShortcut -PathType Leaf) "recommended_desktop_shortcut_missing"
  Assert-True (Test-Path -LiteralPath (Join-Path $startMenuRoot "NETGRID.lnk") -PathType Leaf) "recommended_start_menu_shortcut_missing"
  Invoke-GuiExecutable (Join-Path $programRoot "NETGRID.exe") @("--headless-verify", "--program-root", $programRoot, "--environment-file", $environmentPath) | Out-Null
  [System.IO.File]::WriteAllText((Join-Path $dataRoot "runtime\recommended-retention-sentinel.txt"), "retain-on-standard-uninstall")
  Invoke-GuiExecutable $baseSetup @("--uninstall-update") | Out-Null
  Assert-True (-not (Test-Path -LiteralPath $programRoot)) "recommended_uninstall_left_program"
  Assert-True (Test-Path -LiteralPath (Join-Path $dataRoot "runtime\recommended-retention-sentinel.txt")) "recommended_uninstall_removed_data"

  Invoke-Msi @(
    "/i", (Quote-Msi $updateMsi), "/qn", "/norestart", "/l*v", (Quote-Msi (Join-Path $logRoot "recommended-reinstall.log")),
    "INSTALLFOLDER=$(Quote-Msi $programRoot)", "NETGRID_DATA_ROOT=$(Quote-Msi $dataRoot)",
    "NETGRID_SETUP_SOURCE=$(Quote-Msi $updateSetup)", "NETGRID_SETUP_SHA256=$(Setup-Hash $updateSetup)"
  ) | Out-Null
  Assert-True (Test-Path -LiteralPath (Join-Path $startMenuRoot "NETGRID Setup.lnk") -PathType Leaf) "setup_start_menu_shortcut_missing"
  Invoke-Msi @("/x", (Quote-Msi $updateMsi), "/qn", "/norestart", "/l*v", (Quote-Msi (Join-Path $logRoot "recommended-delete.log")), "NETGRID_DATA_ROOT=$(Quote-Msi $dataRoot)", "DELETEUSERDATA=1") | Out-Null
  Assert-True (-not (Test-Path -LiteralPath $programRoot)) "recommended_delete_left_program"
  Assert-True (-not (Test-Path -LiteralPath $dataRoot)) "recommended_explicit_data_delete_failed"

  $baseLog = Join-Path $logRoot "install-custom.log"
  Invoke-Msi @(
    "/i", (Quote-Msi $baseMsi), "/qn", "/norestart", "/l*v", (Quote-Msi $baseLog),
    "INSTALLFOLDER=$(Quote-Msi $programRoot)", "NETGRID_DATA_ROOT=$(Quote-Msi $dataRoot)",
    "NETGRID_WEB_PORT=32141", "NETGRID_SERVER_PORT=32142", "NETGRID_RETENTION_DAYS=7",
    "NETGRID_ACCOUNT_ACCESS_MODE=protected", "INSTALLDESKTOPSHORTCUT=0",
    "NETGRID_SETUP_SOURCE=$(Quote-Msi $baseSetup)", "NETGRID_SETUP_SHA256=$(Setup-Hash $baseSetup)"
  ) | Out-Null
  Assert-True ((Product-Version $programRoot) -eq $baseVersion) "fresh_install_version_invalid"
  $environmentPath = Join-Path $dataRoot "config\runtime.env"
  Assert-True (Test-Path -LiteralPath $environmentPath -PathType Leaf) "fresh_install_environment_missing"
  Assert-True ((Get-Content -LiteralPath $environmentPath -Raw) -match "NETGRID_INITIAL_CLEANUP_RETENTION_DAYS=7") "custom_retention_missing"
  Assert-True ((Get-Content -LiteralPath $environmentPath -Raw) -match "NETGRID_ACCOUNT_ACCESS_MODE=protected") "custom_account_mode_missing"
  Assert-True (Test-Path -LiteralPath (Join-Path $startMenuRoot "NETGRID.lnk")) "start_menu_shortcut_missing"
  Assert-True (-not (Test-Path -LiteralPath $desktopShortcut)) "custom_desktop_shortcut_unexpected"
  Invoke-GuiExecutable (Join-Path $programRoot "NETGRID.exe") @("--headless-verify", "--program-root", $programRoot, "--environment-file", $environmentPath) | Out-Null

  $configHash = (Get-FileHash -LiteralPath $environmentPath -Algorithm SHA256).Hash
  [System.IO.File]::WriteAllText((Join-Path $dataRoot "runtime\e2e-sentinel.txt"), "retain-across-update-and-uninstall")
  Set-RuntimeEnvironment $environmentPath
  $backupJson = & (Join-Path $programRoot "runtime\node\node.exe") (Join-Path $programRoot "app\storage-admin.mjs") backup-update
  Assert-True ($LASTEXITCODE -eq 0) "pre_update_backup_failed"
  $backup = $backupJson | ConvertFrom-Json
  Assert-True ($backup.manifest.reason -eq "pre_update") "pre_update_backup_reason_invalid"

  Invoke-Msi @("/fa", (Quote-Msi $baseMsi), "/qn", "/norestart", "/l*v", (Quote-Msi (Join-Path $logRoot "repair.log")), "INSTALLFOLDER=$(Quote-Msi $programRoot)", "NETGRID_DATA_ROOT=$(Quote-Msi $dataRoot)", "INSTALLDESKTOPSHORTCUT=0") | Out-Null
  Assert-True ((Get-FileHash -LiteralPath $environmentPath -Algorithm SHA256).Hash -eq $configHash) "repair_changed_configuration"
  Assert-True (-not (Test-Path -LiteralPath $desktopShortcut)) "repair_changed_desktop_preference"

  $failed = Start-Process -FilePath $updateSetup -ArgumentList @("--install-update", "--program-root", $failedProgramRoot) -Wait -PassThru -WindowStyle Hidden
  Assert-True ($failed.ExitCode -ne 0) "failed_upgrade_was_not_rejected"
  Assert-True ((Product-Version $programRoot) -eq $baseVersion) "failed_upgrade_did_not_rollback"
  Assert-True ((Get-FileHash -LiteralPath $environmentPath -Algorithm SHA256).Hash -eq $configHash) "failed_upgrade_changed_configuration"

  Invoke-GuiExecutable $updateSetup @("--install-update", "--program-root", $programRoot) | Out-Null
  Assert-True ((Product-Version $programRoot) -eq $updateVersion) "upgrade_version_invalid"
  Assert-True ((Get-FileHash -LiteralPath $environmentPath -Algorithm SHA256).Hash -eq $configHash) "upgrade_changed_configuration"
  Assert-True (Test-Path -LiteralPath (Join-Path $dataRoot "runtime\e2e-sentinel.txt")) "upgrade_lost_data"
  Assert-True (-not (Test-Path -LiteralPath $desktopShortcut)) "upgrade_changed_desktop_preference"
  $installedProduct = @(Get-ItemProperty HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\* -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -eq "NETGRID" -and $_.DisplayVersion -eq $updateVersion })
  Assert-True ($installedProduct.Count -eq 1) "updated_product_registration_invalid"
  $productCode = [string]$installedProduct[0].PSChildName
  $cachedMsi = @(Get-ChildItem -LiteralPath (Join-Path $dataRoot "config\installer\$productCode") -Filter '*.msi' -File)
  Assert-True ($cachedMsi.Count -eq 1) "updated_repair_source_missing"
  Assert-True ((Setup-Hash $cachedMsi[0].FullName) -eq (Setup-Hash $updateMsi)) "updated_repair_source_hash_mismatch"
  # Product-code repair must resolve both source and custom paths on its own,
  # after Setup has already removed its temporary extracted MSI.
  Invoke-Msi @("/fa", $productCode, "/qn", "/norestart", "/l*v", (Quote-Msi (Join-Path $logRoot "repair-updated.log"))) | Out-Null
  Assert-True ((Product-Version $programRoot) -eq $updateVersion) "updated_repair_changed_program_path"
  Assert-True ((Get-FileHash -LiteralPath $environmentPath -Algorithm SHA256).Hash -eq $configHash) "updated_repair_changed_configuration"
  Assert-True (-not (Test-Path -LiteralPath $desktopShortcut)) "updated_repair_changed_desktop_preference"
  Invoke-GuiExecutable (Join-Path $programRoot "NETGRID.exe") @("--headless-verify", "--program-root", $programRoot, "--environment-file", $environmentPath) | Out-Null

  Invoke-GuiExecutable $baseSetup @("--install-update", "--program-root", $programRoot) | Out-Null
  Assert-True ((Product-Version $programRoot) -eq $baseVersion) "rollback_version_invalid"
  Assert-True ((Get-FileHash -LiteralPath $environmentPath -Algorithm SHA256).Hash -eq $configHash) "rollback_changed_configuration"

  Invoke-GuiExecutable $baseSetup @("--uninstall-update") | Out-Null
  Assert-True (-not (Test-Path -LiteralPath $programRoot)) "standard_uninstall_left_program"
  Assert-True (Test-Path -LiteralPath (Join-Path $dataRoot "runtime\e2e-sentinel.txt")) "standard_uninstall_removed_data"

  Invoke-Msi @(
    "/i", (Quote-Msi $updateMsi), "/qn", "/norestart", "/l*v", (Quote-Msi (Join-Path $logRoot "reinstall.log")),
    "INSTALLFOLDER=$(Quote-Msi $programRoot)", "NETGRID_DATA_ROOT=$(Quote-Msi $dataRoot)",
    "NETGRID_SETUP_SOURCE=$(Quote-Msi $updateSetup)", "NETGRID_SETUP_SHA256=$(Setup-Hash $updateSetup)"
  ) | Out-Null
  Invoke-Msi @("/x", (Quote-Msi $updateMsi), "/qn", "/norestart", "/l*v", (Quote-Msi (Join-Path $logRoot "uninstall-delete.log")), "NETGRID_DATA_ROOT=$(Quote-Msi $dataRoot)", "DELETEUSERDATA=1") | Out-Null
  Assert-True (-not (Test-Path -LiteralPath $programRoot)) "delete_uninstall_left_program"
  Assert-True (-not (Test-Path -LiteralPath $dataRoot)) "explicit_data_delete_failed"

  $operatingSystem = Get-CimInstance Win32_OperatingSystem
  $result = [ordered]@{
    ok = $true
    schemaVersion = "netgrid-windows-installer-e2e-v1"
    startedUtc = $startedUtc
    finishedUtc = [DateTime]::UtcNow.ToString("O")
    windows = [ordered]@{ caption = [string]$operatingSystem.Caption; version = [string]$operatingSystem.Version; build = [string]$operatingSystem.BuildNumber }
    architecture = "x64"
    baseVersion = $baseVersion
    updateVersion = $updateVersion
    artifacts = [ordered]@{
      baseMsiSha256 = Setup-Hash $baseMsi
      baseSetupSha256 = Setup-Hash $baseSetup
      updateMsiSha256 = Setup-Hash $updateMsi
      updateSetupSha256 = Setup-Hash $updateSetup
    }
    checks = @("recommended-install-defaults", "fresh-install", "custom-paths-and-policy", "start-menu-and-desktop-preference", "launcher-health", "pre-update-backup", "repair", "failed-upgrade-preserves-version", "upgrade", "product-code-repair-from-protected-cache", "standalone-downgrade", "standard-uninstall-retains-data", "explicit-data-delete")
    logRoot = $logRoot
  }
} catch {
  $result = [ordered]@{ ok = $false; schemaVersion = "netgrid-windows-installer-e2e-v1"; error = $_.Exception.Message; logRoot = $logRoot }
} finally {
  $cleanupErrors = @()
  foreach ($msi in @($updateMsi, $baseMsi)) {
    try { Invoke-Msi @("/x", (Quote-Msi $msi), "/qn", "/norestart", "NETGRID_DATA_ROOT=$(Quote-Msi $dataRoot)", "DELETEUSERDATA=1") -Expected @(0, 1605, 3010) | Out-Null } catch { $cleanupErrors += $_.Exception.Message }
  }
  if ($cleanupErrors.Count -eq 0) {
    try { Remove-IsolatedPath $programRoot $env:ProgramFiles } catch { $cleanupErrors += $_.Exception.Message }
    try { Remove-IsolatedPath $dataRoot $env:ProgramData } catch { $cleanupErrors += $_.Exception.Message }
  }
  foreach ($remaining in @($programRoot, $dataRoot, $startMenuRoot, $desktopShortcut, 'HKLM:\SOFTWARE\LevelX2\NETGRID')) {
    if (Test-Path -LiteralPath $remaining) { $cleanupErrors += "cleanup_leftover:$remaining" }
  }
  if ($cleanupErrors.Count -gt 0) {
    $result.ok = $false
    $result.cleanupErrors = $cleanupErrors
    if (-not $result.error) { $result.error = "e2e_cleanup_failed" }
  }
  $result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $resultFile -Encoding utf8
}
if (-not $result.ok) { exit 2 }
exit 0
