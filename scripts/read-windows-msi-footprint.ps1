param([Parameter(Mandatory=$true)][string]$MsiPath)
$ErrorActionPreference='Stop'
$MsiPath=(Resolve-Path -LiteralPath $MsiPath).Path
$installer=$null
$database=$null
$view=$null
try {
  $installer=New-Object -ComObject WindowsInstaller.Installer
  $database=$installer.OpenDatabase($MsiPath,0)
  $view=$database.OpenView('SELECT `FileSize` FROM `File`')
  $view.Execute() | Out-Null
  [long]$bytes=0
  [long]$count=0
  while($null -ne ($record=$view.Fetch())) {
    try {
      $size=[long]$record.IntegerData(1)
      if($size -lt 0){throw 'msi_file_size_invalid'}
      $bytes+=$size
      $count++
    } finally { [Runtime.InteropServices.Marshal]::FinalReleaseComObject($record) | Out-Null }
  }
  if($bytes -le 0 -or $count -le 0){throw 'msi_payload_footprint_empty'}
  [pscustomobject]@{payloadBytes=$bytes;payloadFileCount=$count;msiBytes=[long](Get-Item -LiteralPath $MsiPath).Length}
} finally {
  if($view){$view.Close() | Out-Null; [Runtime.InteropServices.Marshal]::FinalReleaseComObject($view) | Out-Null}
  if($database){[Runtime.InteropServices.Marshal]::FinalReleaseComObject($database) | Out-Null}
  if($installer){[Runtime.InteropServices.Marshal]::FinalReleaseComObject($installer) | Out-Null}
}
