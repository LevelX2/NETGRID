param([Parameter(Mandatory=$true)][string]$InputFile)
$ErrorActionPreference='Stop'
$configuration = Get-Content -LiteralPath $InputFile -Raw | ConvertFrom-Json
$programRoot=[string]$configuration.programRoot
$dataRoot=[string]$configuration.dataRoot
if ($env:USERNAME -notmatch '^NETGRIDTest[a-f0-9]{8}$' -or $programRoot -notmatch '^C:\\Program Files\\NETGRID-E2E-[a-f0-9]{32}$' -or $dataRoot -ne (Join-Path 'C:\ProgramData' (Split-Path $programRoot -Leaf))) { throw 'standard_user_test_scope_invalid' }
$resultFile=Join-Path $dataRoot 'runtime\standard-user-result.json'
try {
  $principal=[Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
  if ($principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'standard_user_is_administrator' }
  foreach ($protected in @((Join-Path $dataRoot 'config\runtime.env'),(Join-Path $programRoot 'NETGRID.exe'))) {
    $denied=$false
    try { $handle=[IO.File]::Open($protected,[IO.FileMode]::Open,[IO.FileAccess]::Write,[IO.FileShare]::Read); $handle.Dispose() } catch [UnauthorizedAccessException] { $denied=$true }
    if (-not $denied) { throw 'standard_user_can_modify_protected_file' }
  }
  $mutable=Join-Path $dataRoot 'runtime\standard-user-write-test.txt'
  [IO.File]::WriteAllText($mutable,'disposable standard-user write probe')
  $environmentFile=Join-Path $dataRoot 'config\runtime.env'
  $databasePath=Join-Path $dataRoot 'runtime\multiplayer\netgrid.sqlite'
  $databaseExistedBefore=Test-Path -LiteralPath $databasePath
  $process=Start-Process -FilePath (Join-Path $programRoot 'NETGRID.exe') -ArgumentList @('--headless-verify','--program-root',('"'+$programRoot+'"'),'--environment-file',('"'+$environmentFile+'"')) -PassThru -Wait -WindowStyle Hidden
  if ($process.ExitCode -ne 0) { throw "standard_user_launcher_failed:$($process.ExitCode)" }
  if (-not (Test-Path -LiteralPath $databasePath)) { throw 'standard_user_database_missing' }
  $result=[ordered]@{ ok=$true; elevated=$false; databaseExistedBefore=$databaseExistedBefore; checks=@('program-file-write-denied','runtime-config-write-denied','runtime-write-allowed','installed-launcher-health-without-admin','sqlite-present-after-standard-user-health') }
} catch { $result=[ordered]@{ ok=$false; error=$_.Exception.Message } }
$result | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $resultFile -Encoding utf8
if (-not $result.ok) { exit 2 }
