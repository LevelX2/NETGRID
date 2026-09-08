param(
  [Parameter(Mandatory=$true)][string]$Binary,
  [Parameter(Mandatory=$true)][string]$ExpectedBuildDirectory,
  [Parameter(Mandatory=$true)][string]$DtfToolRoot
)
$ErrorActionPreference = 'Stop'
# Node inherits PowerShell 7's module search path unchanged when it launches
# Windows PowerShell 5.1. Bind this script's utility dependency to the executing
# engine, so a Core module cannot shadow the Desktop Get-FileHash function.
Import-Module -Name (Join-Path $PSHOME 'Modules\Microsoft.PowerShell.Utility\Microsoft.PowerShell.Utility.psd1') -ErrorAction Stop
$Binary = (Resolve-Path -LiteralPath $Binary).Path
$ExpectedBuildDirectory = (Resolve-Path -LiteralPath $ExpectedBuildDirectory).Path
$DtfToolRoot = (Resolve-Path -LiteralPath $DtfToolRoot).Path
Add-Type -Path (Join-Path $DtfToolRoot 'WixToolset.Dtf.Compression.dll')
Add-Type -Path (Join-Path $DtfToolRoot 'WixToolset.Dtf.Compression.Cab.dll')
$archive = [WixToolset.Dtf.Compression.Cab.CabInfo]::new($Binary)
$expected = @('NETGRID.InstallerActions.dll', 'WixToolset.Dtf.WindowsInstaller.dll', 'CustomAction.config')
$entries = @($archive.GetFiles())
if ($entries.Count -ne $expected.Count) { throw 'installer_action_payload_file_count' }
$seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
foreach ($entry in $entries) {
  if (-not [string]::IsNullOrEmpty($entry.Path) -or $expected -cnotcontains $entry.Name -or -not $seen.Add($entry.Name)) {
    throw 'installer_action_payload_unexpected_entry'
  }
}
$scratchParent = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar)
$scratchName = 'netgrid-ca-payload-' + [Guid]::NewGuid().ToString('N')
$scratch = Join-Path $scratchParent $scratchName
New-Item -ItemType Directory -Path $scratch -ErrorAction Stop | Out-Null
try {
  foreach ($name in $expected) {
    $source = Join-Path $ExpectedBuildDirectory $name
    $unpacked = Join-Path $scratch $name
    $archive.UnpackFile($name, $unpacked)
    if ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -cne (Get-FileHash -LiteralPath $unpacked -Algorithm SHA256).Hash) {
      throw "installer_action_payload_hash_mismatch:$name"
    }
  }
  Write-Output 'INSTALLER_ACTION_PAYLOAD_OK files=3 hashes=verified sources=false symbols=false'
} finally {
  $resolvedScratch = (Resolve-Path -LiteralPath $scratch).Path
  if ([IO.Path]::GetDirectoryName($resolvedScratch) -cne $scratchParent -or [IO.Path]::GetFileName($resolvedScratch) -cne $scratchName) {
    throw 'installer_action_payload_cleanup_scope_invalid'
  }
  Remove-Item -LiteralPath $resolvedScratch -Recurse -Force
  if (Test-Path -LiteralPath $resolvedScratch) { throw 'installer_action_payload_cleanup_failed' }
}
