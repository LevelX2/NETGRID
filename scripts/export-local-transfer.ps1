param(
  [string]$OutputDir = "",
  [string]$ArchivePath = "",
  [string]$DeckLibraryPath = "",
  [switch]$SkipStop,
  [switch]$SkipStorageBackup,
  [switch]$SkipPrivateScans,
  [switch]$SkipLocalAssets,
  [switch]$SkipLocalData,
  [switch]$SkipDecks,
  [switch]$IncludeCodexLocalState,
  [switch]$KeepStaging
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Resolve-FullPath {
  param([Parameter(Mandatory = $true)][string]$Path)

  $Path = [Environment]::ExpandEnvironmentVariables($Path)
  if ([System.IO.Path]::IsPathRooted($Path)) {
    return [System.IO.Path]::GetFullPath($Path)
  }

  return [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $Path))
}

function Measure-TransferPath {
  param([Parameter(Mandatory = $true)][string]$Path)

  $item = Get-Item -LiteralPath $Path -Force
  if (-not $item.PSIsContainer) {
    return @{ fileCount = 1; byteCount = [int64]$item.Length }
  }

  $files = @(Get-ChildItem -LiteralPath $Path -Force -Recurse -File -ErrorAction SilentlyContinue)
  $bytes = [int64]0
  foreach ($file in $files) {
    $bytes += [int64]$file.Length
  }

  return @{ fileCount = $files.Count; byteCount = $bytes }
}

function Add-SkippedItem {
  param(
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][string]$Reason,
    [string]$Source = ""
  )

  $script:skippedItems += [ordered]@{
    label = $Label
    reason = $Reason
    source = $Source
  }
}

function Add-TransferItem {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$RelativeDestination,
    [Parameter(Mandatory = $true)][string]$Label
  )

  if (-not (Test-Path -LiteralPath $Source)) {
    Add-SkippedItem -Label $Label -Reason "source_missing" -Source $Source
    return
  }

  $target = Join-Path $script:stagingRoot $RelativeDestination
  $targetParent = Split-Path -Parent $target
  New-Item -ItemType Directory -Force -Path $targetParent | Out-Null
  Copy-Item -LiteralPath $Source -Destination $target -Recurse -Force

  $measure = Measure-TransferPath -Path $Source
  $script:includedItems += [ordered]@{
    label = $Label
    source = $Source
    destination = $RelativeDestination
    fileCount = $measure.fileCount
    byteCount = $measure.byteCount
  }
}

function Get-GitValue {
  param([Parameter(Mandatory = $true)][string[]]$Arguments)

  try {
    $value = & git @Arguments 2>$null
    if ($LASTEXITCODE -ne 0) {
      return ""
    }
    return (($value | Out-String).Trim())
  } catch {
    return ""
  }
}

function Get-StorageBackupDirFromOutput {
  param([Parameter(Mandatory = $true)][string]$Output)

  $jsonStart = $Output.IndexOf("{")
  $jsonEnd = $Output.LastIndexOf("}")
  if ($jsonStart -lt 0 -or $jsonEnd -le $jsonStart) {
    throw "storage:backup did not return JSON output."
  }

  $jsonText = $Output.Substring($jsonStart, $jsonEnd - $jsonStart + 1)
  $parsed = $jsonText | ConvertFrom-Json
  if ($parsed.ok -ne $true -or [string]::IsNullOrWhiteSpace([string]$parsed.backupDir)) {
    throw "storage:backup returned an unusable result."
  }

  return [string]$parsed.backupDir
}

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
Set-Location $projectRoot

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$stagingRoot = Join-Path $env:TEMP "netgrid-local-transfer-$timestamp-$([System.Guid]::NewGuid().ToString("N").Substring(0, 8))"
New-Item -ItemType Directory -Force -Path $stagingRoot | Out-Null

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $OutputDir = Join-Path $projectRoot "data\runtime\transfer-packages"
}

$outputDirFull = Resolve-FullPath -Path $OutputDir
New-Item -ItemType Directory -Force -Path $outputDirFull | Out-Null

if ([string]::IsNullOrWhiteSpace($ArchivePath)) {
  $ArchivePath = Join-Path $outputDirFull "netgrid-local-transfer-$timestamp.zip"
}

$archiveFull = Resolve-FullPath -Path $ArchivePath
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $archiveFull) | Out-Null

$includedItems = @()
$skippedItems = @()

try {
  if (-not $SkipStop) {
    $stopScript = Join-Path $projectRoot "scripts\stop-netgrid.ps1"
    if (Test-Path -LiteralPath $stopScript) {
      & $stopScript
    } else {
      Add-SkippedItem -Label "stop-netgrid" -Reason "stop_script_missing" -Source $stopScript
    }
  }

  if (-not $SkipStorageBackup) {
    Write-Host "Creating validated SQLite storage backup..."
    $backupOutput = & corepack pnpm --filter "@netgrid/server" exec tsx src/storage-cli.ts backup 2>&1
    $backupExitCode = $LASTEXITCODE
    $backupText = ($backupOutput | Out-String)
    if ($backupExitCode -ne 0) {
      throw "storage:backup failed:`n$backupText"
    }

    $storageBackupDir = Get-StorageBackupDirFromOutput -Output $backupText
    $storageBackupName = Split-Path -Leaf $storageBackupDir
    Add-TransferItem -Source $storageBackupDir -RelativeDestination "runtime-storage-backup\$storageBackupName" -Label "sqlite-storage-backup"
  } else {
    Add-SkippedItem -Label "sqlite-storage-backup" -Reason "skipped_by_parameter"
  }

  Add-TransferItem -Source (Join-Path $projectRoot "AGENTS.local.md") -RelativeDestination "project\AGENTS.local.md" -Label "AGENTS.local.md"

  $envFiles = @(Get-ChildItem -LiteralPath $projectRoot -Force -File -Filter ".env*" -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne ".env.example" })
  if ($envFiles.Count -eq 0) {
    Add-SkippedItem -Label "env-files" -Reason "none_found"
  } else {
    foreach ($envFile in $envFiles) {
      Add-TransferItem -Source $envFile.FullName -RelativeDestination "project\$($envFile.Name)" -Label "env-file:$($envFile.Name)"
    }
  }

  if (-not $SkipLocalData) {
    Add-TransferItem -Source (Join-Path $projectRoot "data\local") -RelativeDestination "project\data\local" -Label "data/local"
  } else {
    Add-SkippedItem -Label "data/local" -Reason "skipped_by_parameter"
  }

  if (-not $SkipLocalAssets) {
    Add-TransferItem -Source (Join-Path $projectRoot "data\local-assets") -RelativeDestination "project\data\local-assets" -Label "data/local-assets"
  } else {
    Add-SkippedItem -Label "data/local-assets" -Reason "skipped_by_parameter"
  }

  if (-not $SkipPrivateScans) {
    Add-TransferItem -Source (Join-Path $projectRoot "docs\source\PrivateScans") -RelativeDestination "project\docs\source\PrivateScans" -Label "docs/source/PrivateScans"
  } else {
    Add-SkippedItem -Label "docs/source/PrivateScans" -Reason "skipped_by_parameter"
  }

  if (-not $SkipDecks) {
    if ([string]::IsNullOrWhiteSpace($DeckLibraryPath)) {
      if (-not [string]::IsNullOrWhiteSpace($env:NETGRID_DECK_LIBRARY_PATH)) {
        $DeckLibraryPath = $env:NETGRID_DECK_LIBRARY_PATH
      } elseif (-not [string]::IsNullOrWhiteSpace($env:APPDATA)) {
        $DeckLibraryPath = Join-Path $env:APPDATA "NetGrid\Decks"
      }
    }

    if ([string]::IsNullOrWhiteSpace($DeckLibraryPath)) {
      Add-SkippedItem -Label "deck-library" -Reason "no_deck_library_path"
    } else {
      Add-TransferItem -Source (Resolve-FullPath -Path $DeckLibraryPath) -RelativeDestination "appdata\NetGrid\Decks" -Label "deck-library"
    }
  } else {
    Add-SkippedItem -Label "deck-library" -Reason "skipped_by_parameter"
  }

  if ($IncludeCodexLocalState) {
    Add-TransferItem -Source (Join-Path $projectRoot ".codex") -RelativeDestination "project\.codex" -Label ".codex"
    Add-TransferItem -Source (Join-Path $projectRoot ".codex-runlogs") -RelativeDestination "project\.codex-runlogs" -Label ".codex-runlogs"
  } else {
    Add-SkippedItem -Label ".codex" -Reason "not_needed_for_project_transfer"
    Add-SkippedItem -Label ".codex-runlogs" -Reason "not_needed_for_project_transfer"
  }

  $restoreScript = Join-Path $PSScriptRoot "import-local-transfer.ps1"
  if (Test-Path -LiteralPath $restoreScript) {
    Add-TransferItem -Source $restoreScript -RelativeDestination "restore-local-transfer.ps1" -Label "restore-script"
  } else {
    Add-SkippedItem -Label "restore-script" -Reason "source_missing" -Source $restoreScript
  }

  $manifest = [ordered]@{
    schemaVersion = "netgrid-local-transfer-v1"
    createdAt = (Get-Date).ToString("o")
    projectRoot = $projectRoot
    gitBranch = Get-GitValue -Arguments @("rev-parse", "--abbrev-ref", "HEAD")
    gitHead = Get-GitValue -Arguments @("rev-parse", "HEAD")
    archiveKind = "curated-non-git-local-transfer"
    warnings = @(
      "This archive can contain private decks, private scans, local runtime backups and env secrets.",
      "Do not commit this archive and do not upload it to GitHub.",
      "Use GitHub separately for the versioned repository state."
    )
    includedItems = $includedItems
    skippedItems = $skippedItems
    restore = [ordered]@{
      scriptInRepo = "scripts/import-local-transfer.ps1"
      scriptInArchive = "restore-local-transfer.ps1"
      command = "powershell -ExecutionPolicy Bypass -File .\scripts\import-local-transfer.ps1 -ArchivePath <archive.zip>"
    }
  }

  $manifestPath = Join-Path $stagingRoot "manifest.json"
  $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

  if (Test-Path -LiteralPath $archiveFull) {
    Remove-Item -LiteralPath $archiveFull -Force
  }

  $stagingItems = @(Get-ChildItem -LiteralPath $stagingRoot -Force)
  Compress-Archive -LiteralPath $stagingItems.FullName -DestinationPath $archiveFull -Force

  Write-Host "Created NETGRID local transfer archive:"
  Write-Host $archiveFull
  Write-Host "Included item groups: $($includedItems.Count); skipped item groups: $($skippedItems.Count)"
  Write-Host "Treat this archive as private: it may contain decks, scans, SQLite backups and env secrets."
} finally {
  if (-not $KeepStaging -and (Test-Path -LiteralPath $stagingRoot)) {
    Remove-Item -LiteralPath $stagingRoot -Recurse -Force
  }
}
