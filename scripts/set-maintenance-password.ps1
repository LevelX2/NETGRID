param(
  [switch]$Reset
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$command = if ($Reset) { "reset" } else { "bootstrap" }
$first = Read-Host "Neues Maintenance-Passwort" -AsSecureString
$second = Read-Host "Maintenance-Passwort wiederholen" -AsSecureString
$firstPtr = [IntPtr]::Zero
$secondPtr = [IntPtr]::Zero

try {
  $firstPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($first)
  $secondPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($second)
  $firstPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($firstPtr)
  $secondPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secondPtr)
  if ($firstPlain -cne $secondPlain) {
    throw "Die beiden Passworteingaben stimmen nicht überein."
  }
  Push-Location $projectRoot
  try {
    @($firstPlain, $secondPlain) | & corepack pnpm maintenance:auth $command --password-stdin
    if ($LASTEXITCODE -ne 0) {
      throw "Maintenance-Passwort konnte nicht gesetzt werden."
    }
  } finally {
    Pop-Location
  }
} finally {
  $firstPlain = $null
  $secondPlain = $null
  if ($firstPtr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($firstPtr) }
  if ($secondPtr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secondPtr) }
}
