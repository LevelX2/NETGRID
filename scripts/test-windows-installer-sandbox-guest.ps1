$ErrorActionPreference = 'Stop'
# This entrypoint is only for a disposable Windows Sandbox, never the host.
if ($env:USERNAME -ne 'WDAGUtilityAccount' -or $PSScriptRoot -ne 'C:\NETGRID-TestInput') { throw 'sandbox_guest_context_required' }
$resultRoot = 'C:\NETGRID-TestResult'
$testRoot = 'C:\NETGRID-Test'
$startedUtc = [DateTime]::UtcNow.ToString('O')
$matrixCompleted = $false
try {
  $testPlan = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'test-plan.json') -Raw | ConvertFrom-Json
  $coverage = if ($testPlan.networkEnabled) { 'network-enabled-local-msi-matrix' } else { 'offline-local-msi-matrix' }
  [ordered]@{ state = 'preflight'; startedUtc = $startedUtc } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $resultRoot 'status.json') -Encoding utf8
  $developmentTools = @(foreach ($name in @('node','npm','pnpm','dotnet','git','wix')) { if (Get-Command $name -ErrorAction SilentlyContinue) { $name } })
  if ($developmentTools.Count) { throw "sandbox_not_clean:$($developmentTools -join ',')" }
  if (Test-Path -LiteralPath $testRoot) { throw 'sandbox_test_root_not_fresh' }
  New-Item -ItemType Directory -Path $testRoot | Out-Null
  Copy-Item -Path 'C:\NETGRID-TestInput\*' -Destination $testRoot -Recurse
  $inventory = Get-Content -LiteralPath (Join-Path $testRoot 'inventory.json') -Raw | ConvertFrom-Json
  foreach ($artifact in $inventory) {
    $file = Join-Path $testRoot ([string]$artifact.path)
    if ((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant() -ne $artifact.sha256) { throw 'sandbox_guest_artifact_hash_mismatch' }
  }
  function Find-One { param([string]$Root,[string]$Pattern) $files = @(Get-ChildItem -LiteralPath $Root -Filter $Pattern -File); if ($files.Count -ne 1) { throw "sandbox_artifact_count_invalid:$Pattern" }; return $files[0].FullName }
  $baseRoot = Join-Path $testRoot 'base'
  $updateRoot = Join-Path $testRoot 'update'
  $inputFile = Join-Path $testRoot 'input.json'
  $e2eResult = Join-Path $resultRoot 'installer-result.json'
  [ordered]@{
    baseMsi = Find-One $baseRoot '*.msi'
    baseSetup = Find-One $baseRoot '*.exe'
    updateMsi = Find-One $updateRoot '*.msi'
    updateSetup = Find-One $updateRoot '*.exe'
    resultFile = $e2eResult
  } | ConvertTo-Json | Set-Content -LiteralPath $inputFile -Encoding utf8
  $os = Get-CimInstance Win32_OperatingSystem
  [ordered]@{ state = 'running'; startedUtc = $startedUtc; cleanDevelopmentTools = $true; windows = $os.Caption; version = $os.Version; coverage = $coverage; inventory = @($inventory | ForEach-Object { [ordered]@{path=[string]$_.path;sha256=[string]$_.sha256} }) } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $resultRoot 'status.json') -Encoding utf8
  $testProcess = Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',(Join-Path $testRoot 'test-windows-installer-e2e.ps1'),'-InputFile',$inputFile) -Wait -PassThru -WindowStyle Hidden -RedirectStandardOutput (Join-Path $resultRoot 'test-output.txt') -RedirectStandardError (Join-Path $resultRoot 'test-errors.txt')
  if (-not (Test-Path -LiteralPath $e2eResult)) { throw "sandbox_e2e_result_missing:$($testProcess.ExitCode)" }
  $result = Get-Content -LiteralPath $e2eResult -Raw | ConvertFrom-Json
  if ($testProcess.ExitCode -ne 0 -or -not $result.ok) { throw "sandbox_e2e_failed:$($result.error)" }
  [ordered]@{ ok = $true; coverage = $coverage; cleanDevelopmentTools = $true; startedUtc = $startedUtc; finishedUtc = [DateTime]::UtcNow.ToString('O'); installer = $result } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $resultRoot 'result.json') -Encoding utf8
  $matrixCompleted = $true
  if ($testPlan.includeRollback) {
    $rollbackProcess = Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',(Join-Path $PSScriptRoot 'test-windows-updater-rollback-sandbox.ps1')) -PassThru -Wait -WindowStyle Hidden -RedirectStandardOutput (Join-Path $resultRoot 'rollback-output.txt') -RedirectStandardError (Join-Path $resultRoot 'rollback-errors.txt')
    if ($rollbackProcess.ExitCode -ne 0) { throw "sandbox_rollback_failed:$($rollbackProcess.ExitCode)" }
  }
  [ordered]@{ok=$true; coverage=$coverage; includedRollback=[bool]$testPlan.includeRollback; startedUtc=$startedUtc; finishedUtc=[DateTime]::UtcNow.ToString('O')} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $resultRoot 'suite-result.json') -Encoding utf8
} catch {
  $failure = [ordered]@{ ok = $false; error = $_.Exception.Message; startedUtc = $startedUtc; finishedUtc=[DateTime]::UtcNow.ToString('O') }
  $failure | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $resultRoot 'suite-result.json') -Encoding utf8
  if (-not $matrixCompleted) { $failure | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $resultRoot 'result.json') -Encoding utf8 }
  exit 2
}
