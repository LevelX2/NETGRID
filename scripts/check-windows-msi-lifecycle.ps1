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
  $ordered = @('CostFinalize', 'PrepareNetgridLifecycle', 'InstallInitialize', 'RollbackNetgridLifecycle', 'BeginNetgridLifecycle', 'CommitNetgridLifecycle', 'RemoveRegistryValues', 'RemoveFiles', 'InstallFiles', 'InstallExecute', 'RemoveExistingProducts', 'VerifyNetgridLifecycle', 'InstallFinalize')
  $previous = -1
  foreach ($action in $ordered) {
    if (-not $sequence.ContainsKey($action) -or $sequence[$action].Number -le $previous) { throw "installer_lifecycle_sequence_invalid:$action" }
    $previous = $sequence[$action].Number
    if ($action -like '*NetgridLifecycle' -and -not [string]::IsNullOrEmpty($sequence[$action].Condition)) { throw "installer_lifecycle_sequence_conditional:$action" }
  }
  # Commit is recorded here but MSI executes it only after the install script
  # succeeds; rollback runs in reverse order, releasing after file restoration.
  $expectedTypes = @{ PrepareNetgridLifecycle = 1; BeginNetgridLifecycle = 11265; VerifyNetgridLifecycle = 11265; RollbackNetgridLifecycle = 11521; CommitNetgridLifecycle = 11777 }
  $checked = 0
  foreach ($row in (Read-InstallerRows 'SELECT `Action`, `Type`, `Source`, `Target` FROM `CustomAction`' 4)) {
    if (-not $expectedTypes.ContainsKey($row[0])) { continue }
    if ([int]$row[1] -ne $expectedTypes[$row[0]] -or $row[2] -ne 'NetgridLifecycleActions' -or $row[3] -ne $row[0]) { throw "installer_lifecycle_custom_action_invalid:$($row[0])" }
    $checked++
  }
  if ($checked -ne 5) { throw 'installer_lifecycle_custom_actions_missing' }
  $launcherComponent = @(Read-InstallerRows "SELECT ``Component_`` FROM ``File`` WHERE ``File`` = 'NetgridLauncher'" 1)
  $cacheSelector = @(Read-InstallerRows "SELECT ``Root``, ``Key``, ``Value``, ``Component_`` FROM ``Registry`` WHERE ``Name`` = 'CurrentProductCode'" 4)
  if ($launcherComponent.Count -ne 1 -or $cacheSelector.Count -ne 1 -or $cacheSelector[0][0] -ne '2' -or
      $cacheSelector[0][1] -ine 'Software\LevelX2\NETGRID' -or $cacheSelector[0][2] -ne '[ProductCode]' -or
      $cacheSelector[0][3] -ne $launcherComponent[0][0]) { throw 'installer_lifecycle_setup_selector_not_msi_owned' }
  $cacheShortcut = @(Read-InstallerRows "SELECT ``Target`` FROM ``Shortcut`` WHERE ``Shortcut`` = 'NetgridSetupStartMenuShortcut'" 1)
  if ($cacheShortcut.Count -ne 1 -or $cacheShortcut[0][0] -ne '[NETGRID_DATA_ROOT]\config\updates\[ProductCode]\NETGRID-Setup.exe') { throw 'installer_lifecycle_setup_shortcut_unbound' }
  $properties = @{}
  foreach ($row in (Read-InstallerRows 'SELECT `Property`, `Value` FROM `Property`' 2)) { $properties[$row[0]] = $row[1] }
  if ($properties['MSIRESTARTMANAGERCONTROL'] -ne 'DisableShutdown') { throw 'installer_lifecycle_restart_manager_conflict' }
  foreach ($propertyList in @('SecureCustomProperties', 'MsiHiddenProperties')) {
    if (-not (([string]$properties[$propertyList]).Split(';') -ccontains 'NETGRID_UPDATE_LEASE')) { throw "installer_lifecycle_outer_lease_property_invalid:$propertyList" }
  }
  foreach ($action in @('SetRemoveNetgridFirewall', 'RemoveNetgridFirewall', 'SetDeleteNetgridData', 'DeleteNetgridData')) {
    if (-not $sequence.ContainsKey($action) -or $sequence[$action].Condition -notmatch '\bNOT UPGRADINGPRODUCTCODE\b') { throw "installer_lifecycle_nested_cleanup_unsafe:$action" }
  }
  $conditions = @(Read-InstallerRows 'SELECT `Condition` FROM `LaunchCondition`' 1)
  if (-not ($conditions | Where-Object { $_[0] -eq 'NOT RollbackDisabled' })) { throw 'installer_lifecycle_rollback_not_required' }
  Write-Output ('MSI_LIFECYCLE_CHECK_OK actions=5 sequence=' + (($ordered | ForEach-Object { $_ + ':' + $sequence[$_].Number }) -join ','))
} finally {
  if ($database) { [Runtime.InteropServices.Marshal]::FinalReleaseComObject($database) | Out-Null }
  if ($installer) { [Runtime.InteropServices.Marshal]::FinalReleaseComObject($installer) | Out-Null }
}
