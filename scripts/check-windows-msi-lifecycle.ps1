param([Parameter(Mandatory=$true)][string]$MsiPath)
$ErrorActionPreference = 'Stop'
$MsiPath = (Resolve-Path -LiteralPath $MsiPath).Path
$installer = $null
$database = $null
function Read-InstallerRows {
  param([string]$Query, [int]$Columns)
  $view = $database.OpenView($Query)
  try {
    $view.Execute() | Out-Null
    while ($null -ne ($record = $view.Fetch())) {
      try {
        $values = @(for ($index = 1; $index -le $Columns; $index++) { [string]$record.StringData($index) })
        ,$values
      } finally { [Runtime.InteropServices.Marshal]::FinalReleaseComObject($record) | Out-Null }
    }
  } finally {
    $view.Close() | Out-Null
    [Runtime.InteropServices.Marshal]::FinalReleaseComObject($view) | Out-Null
  }
}
try {
  $installer = New-Object -ComObject WindowsInstaller.Installer
  $database = $installer.OpenDatabase($MsiPath, 0)
  $sequence = @{}
  foreach ($row in (Read-InstallerRows 'SELECT `Action`, `Condition`, `Sequence` FROM `InstallExecuteSequence`' 3)) {
    $sequence[$row[0]] = @{ Condition = $row[1]; Number = [int]$row[2] }
  }
  $ordered = @('CostFinalize', 'PrepareNetgridLifecycle', 'InstallInitialize', 'RollbackNetgridLifecycle', 'BeginNetgridLifecycle', 'CommitNetgridLifecycle', 'RemoveRegistryValues', 'RemoveFiles', 'InstallFiles', 'InstallFinalize')
  $previous = -1
  foreach ($action in $ordered) {
    if (-not $sequence.ContainsKey($action) -or $sequence[$action].Number -le $previous) { throw "installer_lifecycle_sequence_invalid:$action" }
    $previous = $sequence[$action].Number
    if ($action -like '*NetgridLifecycle' -and -not [string]::IsNullOrEmpty($sequence[$action].Condition)) { throw "installer_lifecycle_sequence_conditional:$action" }
  }
  # Commit is recorded here but MSI executes it only after the install script
  # succeeds; rollback runs in reverse order, releasing after file restoration.
  $expectedTypes = @{ PrepareNetgridLifecycle = 1; BeginNetgridLifecycle = 11265; RollbackNetgridLifecycle = 11521; CommitNetgridLifecycle = 11777 }
  $checked = 0
  foreach ($row in (Read-InstallerRows 'SELECT `Action`, `Type`, `Source`, `Target` FROM `CustomAction`' 4)) {
    if (-not $expectedTypes.ContainsKey($row[0])) { continue }
    if ([int]$row[1] -ne $expectedTypes[$row[0]] -or $row[2] -ne 'NetgridLifecycleActions' -or $row[3] -ne $row[0]) { throw "installer_lifecycle_custom_action_invalid:$($row[0])" }
    $checked++
  }
  if ($checked -ne 4) { throw 'installer_lifecycle_custom_actions_missing' }
  $properties = @{}
  foreach ($row in (Read-InstallerRows 'SELECT `Property`, `Value` FROM `Property`' 2)) { $properties[$row[0]] = $row[1] }
  if ($properties['MSIRESTARTMANAGERCONTROL'] -ne 'DisableShutdown') { throw 'installer_lifecycle_restart_manager_conflict' }
  $conditions = @(Read-InstallerRows 'SELECT `Condition` FROM `LaunchCondition`' 1)
  if (-not ($conditions | Where-Object { $_[0] -eq 'NOT RollbackDisabled' })) { throw 'installer_lifecycle_rollback_not_required' }
  Write-Output ('MSI_LIFECYCLE_CHECK_OK actions=4 sequence=' + (($ordered | ForEach-Object { $_ + ':' + $sequence[$_].Number }) -join ','))
} finally {
  if ($database) { [Runtime.InteropServices.Marshal]::FinalReleaseComObject($database) | Out-Null }
  if ($installer) { [Runtime.InteropServices.Marshal]::FinalReleaseComObject($installer) | Out-Null }
}
