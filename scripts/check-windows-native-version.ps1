param(
  [Parameter(Mandatory=$true)][string]$Executable,
  [Parameter(Mandatory=$true)][string]$Version
)
$ErrorActionPreference='Stop'
if ($Version -notmatch '^1\.0\.(0|[1-9][0-9]*)$') { throw 'installer_native_version_invalid' }
$expected=[Version]($Version + '.0')
$path=(Resolve-Path -LiteralPath $Executable).Path
$actual=[Diagnostics.FileVersionInfo]::GetVersionInfo($path)
if ($actual.FileMajorPart -ne $expected.Major -or $actual.FileMinorPart -ne $expected.Minor -or
    $actual.FileBuildPart -ne $expected.Build -or $actual.FilePrivatePart -ne 0 -or
    ($actual.ProductVersion -ne $Version -and -not $actual.ProductVersion.StartsWith($Version + '+',[StringComparison]::Ordinal))) {
  throw ('installer_native_version_mismatch:' + [IO.Path]::GetFileName($path))
}
Write-Output ('WINDOWS_NATIVE_VERSION_OK file=' + [IO.Path]::GetFileName($path) + ' version=' + $Version)
