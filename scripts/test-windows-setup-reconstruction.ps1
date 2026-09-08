param(
  [Parameter(Mandatory=$true)][string]$ProgramRoot,
  [Parameter(Mandatory=$true)][string]$MsiPath,
  [Parameter(Mandatory=$true)][string]$SetupPath
)
$ErrorActionPreference = 'Stop'
# Node can inherit PowerShell 7's module path before starting Windows
# PowerShell 5.1. Bind the hash cmdlet to the executing Desktop engine.
Import-Module -Name (Join-Path $PSHOME 'Modules\Microsoft.PowerShell.Utility\Microsoft.PowerShell.Utility.psd1') -ErrorAction Stop
$ProgramRoot = (Resolve-Path -LiteralPath $ProgramRoot).Path
$MsiPath = (Resolve-Path -LiteralPath $MsiPath).Path
$SetupPath = (Resolve-Path -LiteralPath $SetupPath).Path
$executable = Join-Path $ProgramRoot 'tools\NETGRID.RuntimeConfig.exe'
$scratch = Join-Path ([IO.Path]::GetTempPath()) ('netgrid-setup-reconstruction-' + [guid]::NewGuid().ToString('N'))
$installer=$null; $database=$null; $view=$null; $record=$null
try {
  $installer=New-Object -ComObject WindowsInstaller.Installer
  $database=$installer.OpenDatabase($MsiPath,0)
  $view=$database.OpenView('SELECT `Value` FROM `Property` WHERE `Property` = ''ProductCode''')
  $view.Execute() | Out-Null
  $record=$view.Fetch()
  if ($null -eq $record) { throw 'setup_reconstruction_product_code_missing' }
  $productCode=[string]$record.StringData(1)
} finally {
  if($record){[Runtime.InteropServices.Marshal]::FinalReleaseComObject($record) | Out-Null}
  if($view){$view.Close() | Out-Null; [Runtime.InteropServices.Marshal]::FinalReleaseComObject($view) | Out-Null}
  if($database){[Runtime.InteropServices.Marshal]::FinalReleaseComObject($database) | Out-Null}
  if($installer){[Runtime.InteropServices.Marshal]::FinalReleaseComObject($installer) | Out-Null}
}
function Invoke-Fixture {
  param([string[]]$Values,[int]$Expected=0)
  & $executable @Values | Out-Null
  if ($LASTEXITCODE -ne $Expected) { throw "setup_reconstruction_exit_invalid:$LASTEXITCODE/$Expected" }
}
try {
  $dataRoot=Join-Path $scratch 'data'
  $config=Join-Path $dataRoot 'config'
  New-Item -ItemType Directory -Path $config | Out-Null
  [IO.File]::WriteAllText((Join-Path $config 'runtime.env'),'isolated-cache-test-no-runtime')
  $stateFile=Join-Path $scratch 'state.json'
  $binding=@('--data-root',$dataRoot,'--program-root',$ProgramRoot,'--state-file',$stateFile,'--product-code',$productCode)
  Invoke-Fixture (@('cache-msi') + $binding + @('--source',$MsiPath))
  # No setup source/hash is provided: the first entry must be generated offline.
  Invoke-Fixture (@('cache-setup') + $binding)
  $cached=Join-Path $config "updates\$productCode\NETGRID-Setup.exe"
  $expectedHash=(Get-FileHash -LiteralPath $SetupPath -Algorithm SHA256).Hash
  if ((Get-FileHash -LiteralPath $cached -Algorithm SHA256).Hash -cne $expectedHash) { throw 'setup_reconstruction_not_byte_identical' }
  $modified=(Get-Item -LiteralPath $cached).LastWriteTimeUtc
  Invoke-Fixture (@('cache-setup') + $binding)
  Invoke-Fixture (@('cache-setup') + $binding + @('--source',$SetupPath,'--sha256',$expectedHash))
  Invoke-Fixture (@('cache-setup') + $binding + @('--source',$SetupPath,'--sha256',('0'*64))) -Expected 2
  Invoke-Fixture (@('cache-setup') + $binding + @('--sha256',$expectedHash)) -Expected 2
  if ((Get-FileHash -LiteralPath $cached -Algorithm SHA256).Hash -cne $expectedHash -or (Get-Item -LiteralPath $cached).LastWriteTimeUtc -ne $modified) { throw 'setup_reconstruction_rewrote_immutable_cache' }
  if (@(Get-ChildItem -LiteralPath $config -File -Filter '*.setup.tmp').Count) { throw 'setup_reconstruction_stage_leftover' }
  Write-Output 'WINDOWS_SETUP_RECONSTRUCTION_TEST_OK byteIdentical=true noSetupSource=true immutableRepair=true invalidAttestationRejected=true installationStarted=false'
} finally {
  $resolved=[IO.Path]::GetFullPath($scratch)
  $allowed=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\'
  if (-not $resolved.StartsWith($allowed,[StringComparison]::OrdinalIgnoreCase) -or [IO.Path]::GetFileName($resolved) -notmatch '^netgrid-setup-reconstruction-[a-f0-9]{32}$') { throw 'setup_reconstruction_cleanup_scope_invalid' }
  if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force }
}
