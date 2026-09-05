param(
  [Parameter(Mandatory = $true)][string]$BaseRoot,
  [Parameter(Mandatory = $true)][string]$UpdateRoot
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$baseRootPath = [System.IO.Path]::GetFullPath($BaseRoot)
$updateRootPath = [System.IO.Path]::GetFullPath($UpdateRoot)
function Single-File { param([string]$Root, [string]$Pattern) $items = @(Get-ChildItem -LiteralPath $Root -Filter $Pattern -File); if ($items.Count -ne 1) { throw "artifact_ambiguous:${Pattern}:$($items.Count)" }; return $items[0].FullName }
function Assert-ArtifactRoot {
  param([string]$Root)
  $metadataPath = Join-Path $Root "release-metadata.json"
  $checksumsPath = Join-Path $Root "SHA256SUMS.txt"
  if (-not (Test-Path -LiteralPath $metadataPath -PathType Leaf) -or -not (Test-Path -LiteralPath $checksumsPath -PathType Leaf)) { throw "artifact_integrity_files_missing:$Root" }
  $metadata = Get-Content -LiteralPath $metadataPath -Raw | ConvertFrom-Json
  $checksumLines = @(Get-Content -LiteralPath $checksumsPath | Where-Object { $_.Trim() })
  if ($metadata.schemaVersion -ne "netgrid-windows-installer-release-v1" -or @($metadata.artifacts).Count -ne 2 -or $checksumLines.Count -ne 2) { throw "artifact_integrity_contract_invalid:$Root" }
  foreach ($artifact in @($metadata.artifacts)) {
    $artifactPath = Join-Path $Root ([string]$artifact.name)
    if (-not (Test-Path -LiteralPath $artifactPath -PathType Leaf)) { throw "artifact_missing:$($artifact.name)" }
    $actual = (Get-FileHash -LiteralPath $artifactPath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne [string]$artifact.sha256) { throw "artifact_metadata_hash_mismatch:$($artifact.name)" }
    if ($checksumLines -notcontains "$actual  $($artifact.name)") { throw "artifact_checksum_mismatch:$($artifact.name)" }
  }
}
$null = Assert-ArtifactRoot $baseRootPath
$null = Assert-ArtifactRoot $updateRootPath
$scratch = Join-Path ([System.IO.Path]::GetTempPath()) ("netgrid-e2e-controller-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $scratch | Out-Null
$inputFile = Join-Path $scratch "input.json"
$resultFile = Join-Path $scratch "result.json"
$input = [ordered]@{
  baseMsi = Single-File $baseRootPath "NETGRID-*.msi"
  baseSetup = Single-File $baseRootPath "NETGRID-Setup-*.exe"
  updateMsi = Single-File $updateRootPath "NETGRID-*.msi"
  updateSetup = Single-File $updateRootPath "NETGRID-Setup-*.exe"
  resultFile = $resultFile
}
$input | ConvertTo-Json | Set-Content -LiteralPath $inputFile -Encoding utf8
try {
  $arguments = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $projectRoot "scripts\test-windows-installer-e2e.ps1"), "-InputFile", $inputFile)
  $process = Start-Process -FilePath "powershell.exe" -ArgumentList $arguments -Verb RunAs -Wait -PassThru -WindowStyle Hidden
  if (-not (Test-Path -LiteralPath $resultFile -PathType Leaf)) { throw "e2e_result_missing:$($process.ExitCode)" }
  $result = Get-Content -LiteralPath $resultFile -Raw | ConvertFrom-Json
  $evidenceRoot = Join-Path $projectRoot "output\windows-installer-e2e"
  New-Item -ItemType Directory -Path $evidenceRoot -Force | Out-Null
  $evidenceName = if ($process.ExitCode -eq 0 -and $result.ok) { "windows-11-x64-result.json" } else { "windows-11-x64-failure.json" }
  Copy-Item -LiteralPath $resultFile -Destination (Join-Path $evidenceRoot $evidenceName) -Force
  if ($process.ExitCode -ne 0 -or -not $result.ok) { throw "e2e_failed:$($result.error):logs=$($result.logRoot)" }
  Write-Output "WINDOWS_INSTALLER_E2E_OK base=$($result.baseVersion) update=$($result.updateVersion) checks=$($result.checks.Count)"
} finally {
  $resolved = [System.IO.Path]::GetFullPath($scratch)
  $tempPrefix = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
  if ($resolved.StartsWith($tempPrefix, [StringComparison]::OrdinalIgnoreCase) -and [System.IO.Path]::GetFileName($resolved).StartsWith("netgrid-e2e-controller-", [StringComparison]::Ordinal)) {
    Remove-Item -LiteralPath $resolved -Recurse -Force
  }
}
