param(
  [Parameter(Mandatory = $true)][string]$ArchivePath,
  [string]$ProjectRoot = "",
  [string]$DeckLibraryPath = "",
  [switch]$SkipStorageRestore,
  [switch]$SkipDecks,
  [switch]$SkipProjectFiles,
  [switch]$SkipExistingBackup,
  [switch]$PlanOnly,
  [switch]$KeepExtracted
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

function Get-DefaultProjectRoot {
  $scriptParent = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
  if (Test-Path -LiteralPath (Join-Path $scriptParent "package.json")) {
    return $scriptParent
  }

  $current = [System.IO.Path]::GetFullPath((Get-Location).Path)
  if (Test-Path -LiteralPath (Join-Path $current "package.json")) {
    return $current
  }

  $standard = "C:\Projekte\NETGRID"
  if (Test-Path -LiteralPath (Join-Path $standard "package.json")) {
    return $standard
  }

  return $scriptParent
}

function Copy-DirectoryContents {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination
  )

  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  foreach ($entry in Get-ChildItem -LiteralPath $Source -Force) {
    Copy-Item -LiteralPath $entry.FullName -Destination $Destination -Recurse -Force
  }
}

function Backup-ExistingPath {
  param(
    [Parameter(Mandatory = $true)][string]$Target,
    [Parameter(Mandatory = $true)][string]$Label
  )

  if ($SkipExistingBackup -or -not (Test-Path -LiteralPath $Target)) {
    return ""
  }

  $safeLabel = $Label -replace "[^a-zA-Z0-9_.-]", "_"
  $backupTarget = Join-Path $script:existingBackupRoot $safeLabel
  if ($PlanOnly) {
    return $backupTarget
  }

  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $backupTarget) | Out-Null
  Copy-Item -LiteralPath $Target -Destination $backupTarget -Recurse -Force
  return $backupTarget
}

function Restore-ProjectTree {
  param(
    [Parameter(Mandatory = $true)][string]$SourceRoot,
    [Parameter(Mandatory = $true)][string]$TargetRoot
  )

  if (-not (Test-Path -LiteralPath $SourceRoot)) {
    Write-Host "No project-local transfer files found."
    return
  }

  foreach ($entry in Get-ChildItem -LiteralPath $SourceRoot -Force) {
    Restore-ProjectNode -Source $entry.FullName -Target (Join-Path $TargetRoot $entry.Name) -LabelPrefix "project_$($entry.Name)"
  }
}

function Restore-ProjectNode {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Target,
    [Parameter(Mandatory = $true)][string]$LabelPrefix
  )

  $sourceItem = Get-Item -LiteralPath $Source -Force
  if ($sourceItem.PSIsContainer) {
    if ($PlanOnly) {
      Write-Host "Would ensure project directory: $Target"
    } else {
      New-Item -ItemType Directory -Force -Path $Target | Out-Null
    }

    foreach ($child in Get-ChildItem -LiteralPath $Source -Force) {
      Restore-ProjectNode -Source $child.FullName -Target (Join-Path $Target $child.Name) -LabelPrefix "$LabelPrefix`_$($child.Name)"
    }
    return
  }

  $backup = Backup-ExistingPath -Target $Target -Label $LabelPrefix
  if ($PlanOnly) {
    Write-Host "Would restore project file: $Target"
    if ($backup) { Write-Host "Existing backup would be: $backup" }
    return
  }

  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Target) | Out-Null
  Copy-Item -LiteralPath $Source -Destination $Target -Force
}

function Restore-DeckLibrary {
  param(
    [Parameter(Mandatory = $true)][string]$SourceDecks,
    [Parameter(Mandatory = $true)][string]$TargetDecks
  )

  if (-not (Test-Path -LiteralPath $SourceDecks)) {
    Write-Host "No deck-library transfer files found."
    return
  }

  $backup = Backup-ExistingPath -Target $TargetDecks -Label "appdata_NetGrid_Decks"
  if ($PlanOnly) {
    Write-Host "Would restore deck library: $TargetDecks"
    if ($backup) { Write-Host "Existing backup would be: $backup" }
    return
  }

  Copy-DirectoryContents -Source $SourceDecks -Destination $TargetDecks
}

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $ProjectRoot = Get-DefaultProjectRoot
}
$ProjectRoot = Resolve-FullPath -Path $ProjectRoot

if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot "package.json"))) {
  throw "ProjectRoot does not look like a NETGRID checkout: $ProjectRoot"
}

if ([string]::IsNullOrWhiteSpace($DeckLibraryPath)) {
  if (-not [string]::IsNullOrWhiteSpace($env:NETGRID_DECK_LIBRARY_PATH)) {
    $DeckLibraryPath = $env:NETGRID_DECK_LIBRARY_PATH
  } elseif (-not [string]::IsNullOrWhiteSpace($env:APPDATA)) {
    $DeckLibraryPath = Join-Path $env:APPDATA "NetGrid\Decks"
  } else {
    $DeckLibraryPath = Join-Path $HOME ".netgrid\decks"
  }
}
$DeckLibraryPath = Resolve-FullPath -Path $DeckLibraryPath

$archiveFull = Resolve-FullPath -Path $ArchivePath
if (-not (Test-Path -LiteralPath $archiveFull)) {
  throw "ArchivePath does not exist: $archiveFull"
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$extractRoot = ""
$archiveItem = Get-Item -LiteralPath $archiveFull -Force

if ($archiveItem.PSIsContainer) {
  $extractRoot = $archiveItem.FullName
} else {
  $extractRoot = Join-Path $env:TEMP "netgrid-local-transfer-import-$timestamp-$([System.Guid]::NewGuid().ToString("N").Substring(0, 8))"
  New-Item -ItemType Directory -Force -Path $extractRoot | Out-Null
  Expand-Archive -LiteralPath $archiveFull -DestinationPath $extractRoot -Force
}

$existingBackupRoot = Join-Path $ProjectRoot "data\runtime\transfer-restore-backups\$timestamp"

try {
  $manifestPath = Join-Path $extractRoot "manifest.json"
  if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "Transfer manifest is missing."
  }

  $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
  if ($manifest.schemaVersion -ne "netgrid-local-transfer-v1") {
    throw "Unsupported transfer schema: $($manifest.schemaVersion)"
  }

  Write-Host "NETGRID local transfer archive created at: $($manifest.createdAt)"
  if ($manifest.gitHead) {
    Write-Host "Archive git head: $($manifest.gitHead)"
  }

  if (-not $SkipProjectFiles) {
    Restore-ProjectTree -SourceRoot (Join-Path $extractRoot "project") -TargetRoot $ProjectRoot
  } else {
    Write-Host "Skipping project-local files."
  }

  if (-not $SkipDecks) {
    Restore-DeckLibrary -SourceDecks (Join-Path $extractRoot "appdata\NetGrid\Decks") -TargetDecks $DeckLibraryPath
  } else {
    Write-Host "Skipping deck library."
  }

  if (-not $SkipStorageRestore) {
    $storageRoot = Join-Path $extractRoot "runtime-storage-backup"
    if (Test-Path -LiteralPath $storageRoot) {
      $backupDirs = @(Get-ChildItem -LiteralPath $storageRoot -Directory -Force | Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName "manifest.json") })
      if ($backupDirs.Count -gt 1) {
        throw "Transfer contains more than one storage backup. Restore manually from runtime-storage-backup."
      }
      if ($backupDirs.Count -eq 1) {
        if ($PlanOnly) {
          Write-Host "Would restore SQLite storage backup: $($backupDirs[0].FullName)"
        } else {
          Push-Location $ProjectRoot
          try {
            & corepack pnpm --filter "@netgrid/server" exec tsx src/storage-cli.ts restore $backupDirs[0].FullName
            if ($LASTEXITCODE -ne 0) {
              throw "storage:restore failed."
            }
          } finally {
            Pop-Location
          }
        }
      } else {
        Write-Host "No SQLite storage backup found."
      }
    } else {
      Write-Host "No runtime-storage-backup directory found."
    }
  } else {
    Write-Host "Skipping SQLite storage restore."
  }

  if ($PlanOnly) {
    Write-Host "PlanOnly complete. No files were copied and storage was not restored."
  } else {
    Write-Host "NETGRID local transfer import complete."
    if (-not $SkipExistingBackup -and (Test-Path -LiteralPath $existingBackupRoot)) {
      Write-Host "Existing target backups were written to:"
      Write-Host $existingBackupRoot
    }
  }
} finally {
  if (-not $KeepExtracted -and -not $archiveItem.PSIsContainer -and (Test-Path -LiteralPath $extractRoot)) {
    Remove-Item -LiteralPath $extractRoot -Recurse -Force
  }
}
