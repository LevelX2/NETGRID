param(
  [string]$BaseRoot = 'output\windows-installer-e2e\base',
  [string]$UpdateRoot = 'output\windows-installer',
  [switch]$IncludeRollback,
  [switch]$EnableNetwork,
  [switch]$PrepareOnly
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$sandboxExecutable = Join-Path $env:WINDIR 'System32\WindowsSandbox.exe'
if (-not (Test-Path -LiteralPath $sandboxExecutable)) { throw 'windows_sandbox_unavailable' }
$sandboxCli = (Get-Command wsb.exe -ErrorAction Stop).Source
$sandboxList = & $sandboxCli list --raw | ConvertFrom-Json
if (@($sandboxList.WindowsSandboxEnvironments).Count) { throw 'existing_sandbox_must_remain_untouched' }
$runRoot = Join-Path $projectRoot ('output\windows-sandbox-e2e\' + [guid]::NewGuid().ToString('N'))
$inputRoot = Join-Path $runRoot 'input'
$resultRoot = Join-Path $runRoot 'result'
New-Item -ItemType Directory -Path $inputRoot,$resultRoot | Out-Null
$inventory = @()
foreach ($source in @(@{ Name = 'base'; Root = $BaseRoot }, @{ Name = 'update'; Root = $UpdateRoot })) {
  $sourceRoot = if ([IO.Path]::IsPathRooted($source.Root)) { [IO.Path]::GetFullPath($source.Root) } else { Join-Path $projectRoot $source.Root }
  $metadata = Get-Content -LiteralPath (Join-Path $sourceRoot 'release-metadata.json') -Raw | ConvertFrom-Json
  $sums = @(Get-Content -LiteralPath (Join-Path $sourceRoot 'SHA256SUMS.txt') | Where-Object { $_.Trim() })
  if ($metadata.schemaVersion -ne 'netgrid-windows-installer-release-v1' -or @($metadata.artifacts).Count -ne 2 -or $sums.Count -ne 2) { throw 'sandbox_artifact_metadata_invalid' }
  $destination = Join-Path $inputRoot $source.Name
  New-Item -ItemType Directory -Path $destination | Out-Null
  foreach ($artifact in $metadata.artifacts) {
    $name = [string]$artifact.name
    if ($name -notmatch '^NETGRID-(Setup-)?1\.0\.\d+-x64\.(exe|msi)$' -or [IO.Path]::GetFileName($name) -ne $name) { throw 'sandbox_artifact_name_invalid' }
    $file = Join-Path $sourceRoot $name
    $hash = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($hash -ne $artifact.sha256 -or $sums -notcontains "$hash  $name") { throw "sandbox_artifact_hash_mismatch:$name" }
    Copy-Item -LiteralPath $file -Destination (Join-Path $destination $name)
    $inventory += [ordered]@{ path = "$($source.Name)/$name"; sha256 = $hash }
  }
  foreach ($name in @('release-metadata.json', 'SHA256SUMS.txt')) { Copy-Item -LiteralPath (Join-Path $sourceRoot $name) -Destination (Join-Path $destination $name) }
}
foreach ($name in @('test-windows-installer-e2e.ps1','test-windows-installer-sandbox-guest.ps1')) {
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot $name) -Destination (Join-Path $inputRoot $name)
}
if ($IncludeRollback) {
  $updaterPath = Join-Path $projectRoot 'output\windows-installer-input\updater\NETGRID.Updater.exe'
  $fixturePath = Join-Path $projectRoot 'output\windows-updater-fault-fixture\NETGRID.UpdateFaultFixture.exe'
  if (-not (Test-Path -LiteralPath $fixturePath)) { throw 'sandbox_fault_fixture_build_required' }
  if ((Get-FileHash -LiteralPath $updaterPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $metadata.runtime.updaterSha256) { throw 'sandbox_updater_does_not_match_update_metadata' }
  foreach ($path in @($updaterPath,$fixturePath)) { Copy-Item -LiteralPath $path -Destination $inputRoot }
  foreach ($name in @('test-windows-updater-rollback-sandbox.ps1','test-windows-installed-standard-user.ps1','test-windows-updater-marker.mjs')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $name) -Destination $inputRoot
  }
}
if ($EnableNetwork) { Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'test-windows-private-lan-sandbox.ps1') -Destination $inputRoot }
[ordered]@{ includeRollback = [bool]$IncludeRollback; networkEnabled = [bool]$EnableNetwork } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $inputRoot 'test-plan.json') -Encoding utf8
$inventory | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $inputRoot 'inventory.json') -Encoding utf8
$configuration = @"
<Configuration>
  <vGPU>Disable</vGPU>
  <Networking>$(if ($EnableNetwork) { 'Enable' } else { 'Disable' })</Networking>
  <AudioInput>Disable</AudioInput>
  <VideoInput>Disable</VideoInput>
  <PrinterRedirection>Disable</PrinterRedirection>
  <ClipboardRedirection>Disable</ClipboardRedirection>
  <MemoryInMB>8192</MemoryInMB>
  <MappedFolders>
    <MappedFolder><HostFolder>$([Security.SecurityElement]::Escape($inputRoot))</HostFolder><SandboxFolder>C:\NETGRID-TestInput</SandboxFolder><ReadOnly>true</ReadOnly></MappedFolder>
    <MappedFolder><HostFolder>$([Security.SecurityElement]::Escape($resultRoot))</HostFolder><SandboxFolder>C:\NETGRID-TestResult</SandboxFolder><ReadOnly>false</ReadOnly></MappedFolder>
  </MappedFolders>
  <LogonCommand><Command>powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\NETGRID-TestInput\test-windows-installer-sandbox-guest.ps1</Command></LogonCommand>
</Configuration>
"@
$configPath = Join-Path $runRoot 'NETGRID-E2E.wsb'
$configuration | Set-Content -LiteralPath $configPath -Encoding utf8
Write-Output "WINDOWS_SANDBOX_E2E_PREPARED root=$runRoot"
if ($PrepareOnly) { exit 0 }
$process = Start-Process -FilePath $sandboxExecutable -ArgumentList ('"' + $configPath + '"') -PassThru -WindowStyle Hidden
[ordered]@{ pid = $process.Id; startedUtc = [DateTime]::UtcNow.ToString('O'); configPath = $configPath } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runRoot 'host-process.json') -Encoding utf8
Write-Output "WINDOWS_SANDBOX_E2E_STARTED pid=$($process.Id) result=$resultRoot"
