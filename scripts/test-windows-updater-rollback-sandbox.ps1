$ErrorActionPreference = 'Stop'
if ($env:USERNAME -ne 'WDAGUtilityAccount' -or $PSScriptRoot -ne 'C:\NETGRID-TestInput') { throw 'sandbox_guest_context_required' }
$resultRoot = 'C:\NETGRID-TestResult'
$priorResult = Get-Content -LiteralPath (Join-Path $resultRoot 'result.json') -Raw | ConvertFrom-Json
if (-not $priorResult.ok -or -not $priorResult.cleanDevelopmentTools) { throw 'clean_installer_matrix_required' }
if (Test-Path -LiteralPath 'HKLM:\SOFTWARE\LevelX2\NETGRID') { throw 'existing_netgrid_registration' }
if (@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object LocalPort -in 32141,32142).Count) { throw 'rollback_ports_busy' }
$testId = [guid]::NewGuid().ToString('N')
$programRoot = Join-Path $env:ProgramFiles "NETGRID-E2E-$testId"
$dataRoot = Join-Path $env:ProgramData "NETGRID-E2E-$testId"
$environmentFile = Join-Path $dataRoot 'config\runtime.env'
$baseRoot = 'C:\NETGRID-Test\base'
$updateRoot = 'C:\NETGRID-Test\update'
$baseMetadata = Get-Content -LiteralPath (Join-Path $baseRoot 'release-metadata.json') -Raw | ConvertFrom-Json
$updateMetadata = Get-Content -LiteralPath (Join-Path $updateRoot 'release-metadata.json') -Raw | ConvertFrom-Json
$baseMsi = Join-Path $baseRoot ($baseMetadata.artifacts | Where-Object name -like '*.msi').name
$baseSetup = Join-Path $baseRoot ($baseMetadata.artifacts | Where-Object name -like '*.exe').name
$updateMsi = Join-Path $updateRoot ($updateMetadata.artifacts | Where-Object name -like '*.msi').name
$updateSetup = Join-Path $updateRoot ($updateMetadata.artifacts | Where-Object name -like '*.exe').name
$startedUtc = [DateTime]::UtcNow.ToString('O')
$updaterProcess = $null
$standardUser = $null
$standardUserCreated = $false
function Assert-True { param([bool]$Condition,[string]$Code) if (-not $Condition) { throw $Code } }
function Hash { param([string]$Path) (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Quote-Argument { param([string]$Value) '"' + $Value.Replace('"','""') + '"' }
function Invoke-Msi {
  param([string[]]$Arguments,[int[]]$Expected = @(0,3010))
  $process = Start-Process -FilePath 'msiexec.exe' -ArgumentList $Arguments -PassThru -Wait -WindowStyle Hidden
  Assert-True ($process.ExitCode -in $Expected) "rollback_msi_failed:$($process.ExitCode)"
}
function Invoke-Executable {
  param([string]$Path,[string[]]$Arguments)
  $process = Start-Process -FilePath $Path -ArgumentList @($Arguments | ForEach-Object { Quote-Argument $_ }) -PassThru -Wait -WindowStyle Hidden
  Assert-True ($process.ExitCode -eq 0) "rollback_executable_failed:$([IO.Path]::GetFileName($Path)):$($process.ExitCode)"
}
function Write-Status { param([string]$State) [ordered]@{ state=$State; startedUtc=$startedUtc; sampledUtc=[DateTime]::UtcNow.ToString('O'); testId=$testId } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $resultRoot 'rollback-status.json') -Encoding utf8 }
# This harness used a synthetic parent for the earlier unbound updater.
# Reject the new protocol before installing a baseline or creating test users;
# its replacement must exercise the actual launcher-owned handoff.
Assert-True ((Hash (Join-Path $PSScriptRoot 'NETGRID.Updater.exe')) -eq $updateMetadata.runtime.updaterSha256) 'rollback_updater_hash_mismatch'
$contractPath = Join-Path $resultRoot "rollback-updater-contract-$testId.json"
Invoke-Executable (Join-Path $PSScriptRoot 'NETGRID.Updater.exe') @('--audit-contract',$contractPath)
$updaterContract = Get-Content -LiteralPath $contractPath -Raw | ConvertFrom-Json
if ($updaterContract.requiresBoundParentAndProceed) { throw 'rollback_harness_requires_actual_launcher_handoff' }
try {
  foreach ($pair in @(@($baseRoot,$baseMetadata),@($updateRoot,$updateMetadata))) {
    foreach ($artifact in $pair[1].artifacts) { Assert-True ((Hash (Join-Path $pair[0] $artifact.name)) -eq $artifact.sha256) 'rollback_product_hash_mismatch' }
  }
  Assert-True ((Hash (Join-Path $PSScriptRoot 'NETGRID.Updater.exe')) -eq $updateMetadata.runtime.updaterSha256) 'rollback_updater_hash_mismatch'
  Write-Status 'installing-baseline'
  Invoke-Msi @('/i',(Quote-Argument $baseMsi),'/qn','/norestart',"INSTALLFOLDER=$(Quote-Argument $programRoot)","NETGRID_DATA_ROOT=$(Quote-Argument $dataRoot)","NETGRID_SETUP_SOURCE=$(Quote-Argument $baseSetup)","NETGRID_SETUP_SHA256=$(Hash $baseSetup)",'NETGRID_WEB_PORT=32141','NETGRID_SERVER_PORT=32142','INSTALLDESKTOPSHORTCUT=0')
  Write-Status 'installed-standard-user-check'
  $standardUser = 'NETGRIDTest' + $testId.Substring(0,8)
  $testPassword = ConvertTo-SecureString ('Ng!' + [guid]::NewGuid().ToString('N') + 'aZ9') -AsPlainText -Force
  New-LocalUser -Name $standardUser -Password $testPassword -AccountNeverExpires -Description 'Disposable NETGRID Sandbox test only' | Out-Null
  $standardUserCreated = $true
  $usersGroup = Get-LocalGroup -SID 'S-1-5-32-545'
  Add-LocalGroupMember -Group $usersGroup -Member $standardUser
  $userInputFile = 'C:\NETGRID-Test\standard-user-input.json'
  [ordered]@{programRoot=$programRoot; dataRoot=$dataRoot} | ConvertTo-Json | Set-Content -LiteralPath $userInputFile -Encoding utf8
  $userScript = 'C:\NETGRID-Test\test-windows-installed-standard-user.ps1'
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'test-windows-installed-standard-user.ps1') -Destination $userScript
  $credential=[PSCredential]::new("$env:COMPUTERNAME\$standardUser",$testPassword)
  $userProcess=Start-Process -FilePath 'powershell.exe' -Credential $credential -LoadUserProfile -WorkingDirectory 'C:\NETGRID-Test' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',$userScript,'-InputFile',$userInputFile) -PassThru -Wait -WindowStyle Hidden
  Assert-True ($userProcess.ExitCode -eq 0) "standard_user_probe_failed:$($userProcess.ExitCode)"
  $standardUserResult=Get-Content -LiteralPath (Join-Path $dataRoot 'runtime\standard-user-result.json') -Raw | ConvertFrom-Json
  Assert-True $standardUserResult.ok 'standard_user_probe_result_failed'
  $standardUserResult | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $resultRoot 'standard-user-result.json') -Encoding utf8
  $configurationHash = Hash $environmentFile
  $database = Join-Path $dataRoot 'runtime\multiplayer\netgrid.sqlite'
  $marker = [guid]::NewGuid().ToString('N')
  $node = Join-Path $programRoot 'runtime\node\node.exe'
  $markerScript = Join-Path $PSScriptRoot 'test-windows-updater-marker.mjs'
  $seed = & $node $markerScript seed $database $marker
  Assert-True ($LASTEXITCODE -eq 0 -and ($seed | ConvertFrom-Json).ok) 'rollback_marker_seed_failed'
  $staging = Join-Path $dataRoot 'runtime\updates\staging'
  New-Item -ItemType Directory -Path $staging -Force | Out-Null
  foreach ($name in @('NETGRID.Updater.exe','NETGRID.UpdateFaultFixture.exe')) { Copy-Item -LiteralPath (Join-Path $PSScriptRoot $name) -Destination $staging }
  [ordered]@{ programRoot=$programRoot; dataRoot=$dataRoot; realSetup=$updateSetup; realSetupSha256=(Hash $updateSetup) } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $staging 'fault-fixture.json') -Encoding utf8
  $fixture = Join-Path $staging 'NETGRID.UpdateFaultFixture.exe'
  $parent = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c exit 0' -Wait -PassThru -WindowStyle Hidden
  $arguments = @('--apply','--parent-pid',[string]$parent.Id,'--setup',$fixture,'--sha256',(Hash $fixture),'--program-root',$programRoot,'--environment-file',$environmentFile)
  Write-Status 'real-updater-transaction-running'
  $updaterProcess = Start-Process -FilePath (Join-Path $staging 'NETGRID.Updater.exe') -ArgumentList @($arguments | ForEach-Object { Quote-Argument $_ }) -PassThru -WindowStyle Hidden
  $deadline = [DateTime]::UtcNow.AddMinutes(30)
  $terminal = $false
  while ([DateTime]::UtcNow -lt $deadline) {
    $log = Get-ChildItem -LiteralPath (Join-Path $dataRoot 'runtime\logs') -Filter 'updater-*.log' -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($log) {
      $transactionLog = [string](Get-Content -LiteralPath $log.FullName -Raw)
      if ($transactionLog -match 'rollback_verified') { $terminal=$true; break }
      Assert-True ($transactionLog -notmatch 'update_verified') 'fault_not_detected_by_healthcheck'
    }
    $updaterProcess.Refresh()
    Assert-True (-not $updaterProcess.HasExited) 'updater_exited_without_verified_rollback'
    Assert-True ($updaterProcess.MainWindowHandle -eq [IntPtr]::Zero) 'updater_error_dialog_before_verified_rollback'
    Start-Sleep -Seconds 3
  }
  Assert-True $terminal 'updater_transaction_timeout'
  $fault = Get-Content -LiteralPath (Join-Path $staging 'fault-applied.json') -Raw | ConvertFrom-Json
  Assert-True ($fault.applied -and $fault.database -eq $database) 'database_fault_not_proven'
  $version = [string](Get-Content -LiteralPath (Join-Path $programRoot 'product-layout.json') -Raw | ConvertFrom-Json).product.installerVersion
  Assert-True ($version -eq $baseMetadata.product.installerVersion) 'rollback_program_version_invalid'
  Assert-True ((Hash $environmentFile) -eq $configurationHash) 'rollback_changed_configuration'
  $probeJson = & $node $markerScript probe $database $marker
  Assert-True ($LASTEXITCODE -eq 0) 'rollback_database_restore_failed'
  $probe = $probeJson | ConvertFrom-Json
  Assert-True $probe.ok 'rollback_marker_missing'
  Assert-True ($transactionLog -match 'backup_verified' -and $transactionLog -match 'post_install_health_failed:rollback_started') 'rollback_transaction_stages_missing'
  $result = [ordered]@{ ok=$true; schemaVersion='netgrid-updater-rollback-sandbox-v1'; startedUtc=$startedUtc; finishedUtc=[DateTime]::UtcNow.ToString('O'); baseVersion=$version; updateVersion=$updateMetadata.product.installerVersion; updaterSha256=$updateMetadata.runtime.updaterSha256; faultFixtureSha256=(Hash $fixture); fault=$fault; restoredDatabase=$probe; configurationPreserved=$true; transactionLog=$transactionLog; notificationDialog='not tested; own updater stopped only after verified transaction and assertions'; checks=@('real-updater-backup','real-msi-upgrade','post-install-database-fault','health-failure-detection','program-rollback','sqlite-marker-and-integrity-restored','configuration-preserved') }
} catch {
  $result = [ordered]@{ ok=$false; error=$_.Exception.Message; startedUtc=$startedUtc; testId=$testId }
} finally {
  # Never race cleanup against an installer still owned by the transaction.
  # Preserve the disposable guest for diagnosis if that transaction is busy.
  $transactionBusy = $false
  if ($updaterProcess) {
    $processSnapshot = @(Get-CimInstance Win32_Process)
    $descendants = @([int]$updaterProcess.Id)
    do {
      $newIds = @($processSnapshot | Where-Object { $_.ParentProcessId -in $descendants -and $_.ProcessId -notin $descendants } | ForEach-Object { [int]$_.ProcessId })
      $descendants += $newIds
    } while ($newIds.Count)
    $transactionBusy = $descendants.Count -gt 1
  }
  if ($transactionBusy) {
    $result.ok=$false
    $result.cleanupDeferred='own transaction children still active; preserve disposable sandbox for diagnosis'
    $result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $resultRoot 'rollback-result.json') -Encoding utf8
    exit 2
  }
  # Only the updater started above belongs to this script. Its final notification
  # is deliberately not counted as a UI/normal-exit test.
  if ($updaterProcess) { $updaterProcess.Refresh(); if (-not $updaterProcess.HasExited) { Stop-Process -Id $updaterProcess.Id -Force } }
  $logs = Join-Path $dataRoot 'runtime\logs'
  if (Test-Path -LiteralPath $logs) { Copy-Item -LiteralPath $logs -Destination (Join-Path $resultRoot "rollback-logs-$testId") -Recurse }
  $faultPath = Join-Path $dataRoot 'runtime\updates\staging\fault-applied.json'
  if (Test-Path -LiteralPath $faultPath) { $result.observedFault = Get-Content -LiteralPath $faultPath -Raw | ConvertFrom-Json }
  $layoutPath = Join-Path $programRoot 'product-layout.json'
  if (Test-Path -LiteralPath $layoutPath) { $result.versionBeforeCleanup = [string](Get-Content -LiteralPath $layoutPath -Raw | ConvertFrom-Json).product.installerVersion }
  Write-Status 'cleanup'
  $cleanupErrors = @()
  if ($standardUserCreated -and (Get-LocalUser -Name $standardUser -ErrorAction SilentlyContinue)) {
    try { Remove-LocalUser -Name $standardUser } catch { $cleanupErrors += "standard_user_cleanup_failed:$($_.Exception.Message)" }
  }
  foreach ($msi in @($updateMsi,$baseMsi)) {
    try { Invoke-Msi @('/x',(Quote-Argument $msi),'/qn','/norestart',"NETGRID_DATA_ROOT=$(Quote-Argument $dataRoot)",'DELETEUSERDATA=1') -Expected @(0,1605,3010) } catch { $cleanupErrors += $_.Exception.Message }
  }
  foreach ($path in @($programRoot,$dataRoot,'HKLM:\SOFTWARE\LevelX2\NETGRID')) { if (Test-Path -LiteralPath $path) { $cleanupErrors += "cleanup_leftover:$path" } }
  if (@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object LocalPort -in 32141,32142).Count) { $cleanupErrors += 'test_ports_still_listening' }
  if ($cleanupErrors.Count) { $result.ok=$false; $result.cleanupErrors=$cleanupErrors }
  $result.finishedUtc=[DateTime]::UtcNow.ToString('O')
  $result.cleanupVerified=$cleanupErrors.Count -eq 0
  $result.artifacts=$priorResult.installer.artifacts
  $result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $resultRoot 'rollback-result.json') -Encoding utf8
}
if (-not $result.ok) { exit 2 }
