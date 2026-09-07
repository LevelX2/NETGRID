param([Parameter(Mandatory=$true)][string]$MsiPath)
$ErrorActionPreference = 'Stop'
$MsiPath = (Resolve-Path -LiteralPath $MsiPath).Path
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class NetgridMsiFrameworkProbe {
  [DllImport("msi.dll", CharSet=CharSet.Unicode, ExactSpelling=true)]
  public static extern uint MsiOpenPackageExW(string path, uint options, out uint session);
  [DllImport("msi.dll", ExactSpelling=true)]
  public static extern uint MsiCloseHandle(uint session);
  [DllImport("msi.dll", ExactSpelling=true)]
  public static extern uint MsiSetInternalUI(uint level, IntPtr owner);
  [DllImport("msi.dll", CharSet=CharSet.Unicode, ExactSpelling=true)]
  public static extern uint MsiSetPropertyW(uint session, string name, string value);
  [DllImport("msi.dll", CharSet=CharSet.Unicode, ExactSpelling=true)]
  public static extern int MsiEvaluateConditionW(uint session, string condition);
}
'@
$installer = $null
$database = $null
$view = $null
[uint32]$session = 0
$previousUi = [NetgridMsiFrameworkProbe]::MsiSetInternalUI(2, [IntPtr]::Zero)
if ($previousUi -eq 0) { throw 'framework_probe_ui_mode_failed' }
try {
  $installer = New-Object -ComObject WindowsInstaller.Installer
  $database = $installer.OpenDatabase($MsiPath, 0)
  $view = $database.OpenView('SELECT `Condition` FROM `LaunchCondition`')
  $view.Execute() | Out-Null
  $conditions = @()
  while ($null -ne ($record = $view.Fetch())) {
    try {
      $condition = [string]$record.StringData(1)
      if ($condition.Contains('NETGRID_DOTNET_FRAMEWORK_RELEASE')) { $conditions += $condition }
    } finally { [Runtime.InteropServices.Marshal]::FinalReleaseComObject($record) | Out-Null }
  }
  if ($conditions.Count -ne 1) { throw 'framework_probe_condition_missing_or_ambiguous' }
  # IGNOREMACHINESTATE: open an isolated package session only. No Install,
  # DoAction, AppSearch, CostFinalize or execute-sequence call is made.
  $opened = [NetgridMsiFrameworkProbe]::MsiOpenPackageExW($MsiPath, 1, [ref]$session)
  if ($opened -ne 0) { throw "framework_probe_open_failed:$opened" }
  foreach ($case in @(@('',0), @('#461808',0), @('#528039',0), @('#528040',1), @('#533320',1))) {
    $set = [NetgridMsiFrameworkProbe]::MsiSetPropertyW($session, 'NETGRID_DOTNET_FRAMEWORK_RELEASE', $case[0])
    if ($set -ne 0) { throw "framework_probe_property_failed:$set" }
    $result = [NetgridMsiFrameworkProbe]::MsiEvaluateConditionW($session, $conditions[0])
    if ($result -ne $case[1]) { throw "framework_probe_condition_failed:value=$($case[0]):expected=$($case[1]):actual=$result" }
  }
  Write-Output 'MSI_FRAMEWORK_CONDITION_OK cases=5 session=isolated installation=false'
} finally {
  if ($session -ne 0) { [NetgridMsiFrameworkProbe]::MsiCloseHandle($session) | Out-Null }
  [NetgridMsiFrameworkProbe]::MsiSetInternalUI($previousUi, [IntPtr]::Zero) | Out-Null
  if ($view) { $view.Close() | Out-Null; [Runtime.InteropServices.Marshal]::FinalReleaseComObject($view) | Out-Null }
  if ($database) { [Runtime.InteropServices.Marshal]::FinalReleaseComObject($database) | Out-Null }
  if ($installer) { [Runtime.InteropServices.Marshal]::FinalReleaseComObject($installer) | Out-Null }
}
