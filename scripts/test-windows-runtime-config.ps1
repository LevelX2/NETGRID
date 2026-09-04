param(
  [string]$Executable = "output\windows-installer-input\runtime-config\NETGRID.RuntimeConfig.exe"
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$executablePath = if ([System.IO.Path]::IsPathRooted($Executable)) {
  [System.IO.Path]::GetFullPath($Executable)
} else {
  [System.IO.Path]::GetFullPath((Join-Path $projectRoot $Executable))
}
if (-not (Test-Path -LiteralPath $executablePath -PathType Leaf)) {
  throw "Die veröffentlichte Runtimekonfiguration fehlt: $executablePath"
}

$scratch = Join-Path ([System.IO.Path]::GetTempPath()) ("netgrid-runtime-config-test-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $scratch | Out-Null

function Invoke-RuntimeConfig {
  param([string[]]$Arguments, [int]$ExpectedExitCode = 0)
  & $executablePath @Arguments | Out-Null
  $actualExitCode = $LASTEXITCODE
  if ($actualExitCode -ne $ExpectedExitCode) {
    throw "Runtimekonfiguration endete mit $actualExitCode statt $ExpectedExitCode."
  }
}

function Get-AllowRightsForUsers {
  param([string]$Path)
  $usersSid = "S-1-5-32-545"
  $rights = [System.Security.AccessControl.FileSystemRights]0
  foreach ($rule in (Get-Acl -LiteralPath $Path).Access) {
    if ($rule.AccessControlType -ne [System.Security.AccessControl.AccessControlType]::Allow) { continue }
    if ($rule.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value -eq $usersSid) {
      $rights = $rights -bor $rule.FileSystemRights
    }
  }
  return $rights
}

try {
  $programRoot = Join-Path $scratch "program"
  $dataRoot = Join-Path $scratch "data"
  $stateFile = Join-Path $scratch "state\install-state.json"
  $templatePath = Join-Path $scratch "runtime.env.example"
  New-Item -ItemType Directory -Path $programRoot | Out-Null
  [System.IO.File]::WriteAllText($templatePath, @"
NODE_ENV=production
NETGRID_RUNTIME_PROFILE=release
NETGRID_DATA_ROOT=C:\ProgramData\NETGRID
NETGRID_TOKEN_SALT=<installer-generated-secret>
"@, [System.Text.UTF8Encoding]::new($false))

  $arguments = @(
    "initialize",
    "--data-root", $dataRoot,
    "--program-root", $programRoot,
    "--template", $templatePath,
    "--state-file", $stateFile
  )
  Invoke-RuntimeConfig -Arguments $arguments
  $runtimeEnvironment = Join-Path $dataRoot "config\runtime.env"
  $firstHash = (Get-FileHash -LiteralPath $runtimeEnvironment -Algorithm SHA256).Hash
  $source = [System.IO.File]::ReadAllText($runtimeEnvironment)
  if ($source -match [regex]::Escape("<installer-generated-secret>") -or
      $source -notmatch "(?m)^NETGRID_TOKEN_SALT=[A-Za-z0-9_-]{43}\r?$" -or
      $source -notmatch '(?m)^NETGRID_DATA_ROOT=".+"\r?$') {
    throw "Die materialisierte Runtimekonfiguration enthält ungültige Pflichtwerte."
  }
  foreach ($relative in @("runtime\multiplayer", "runtime\backups", "runtime\logs", "runtime\maintenance", "card-images")) {
    if (-not (Test-Path -LiteralPath (Join-Path $dataRoot $relative) -PathType Container)) {
      throw "Der erwartete Datenordner fehlt: $relative"
    }
  }

  Invoke-RuntimeConfig -Arguments $arguments
  $secondHash = (Get-FileHash -LiteralPath $runtimeEnvironment -Algorithm SHA256).Hash
  if ($firstHash -ne $secondHash) {
    throw "Eine Reparatur hat die bestehende Runtimekonfiguration verändert."
  }

  $runtimeRights = Get-AllowRightsForUsers -Path (Join-Path $dataRoot "runtime")
  $configRights = Get-AllowRightsForUsers -Path (Join-Path $dataRoot "config")
  $modifyRights = [System.Security.AccessControl.FileSystemRights]::Modify
  if (($runtimeRights -band $modifyRights) -ne $modifyRights) {
    throw "Lokale Benutzer besitzen im Runtimeordner keine Schreibrechte."
  }
  if (($configRights -band $modifyRights) -eq $modifyRights) {
    throw "Lokale Benutzer besitzen unerlaubte Schreibrechte im Konfigurationsordner."
  }

  Invoke-RuntimeConfig -Arguments @(
    "initialize", "--data-root", $programRoot, "--program-root", $programRoot,
    "--template", $templatePath, "--state-file", (Join-Path $scratch "invalid-overlap.json")
  ) -ExpectedExitCode 2
  Invoke-RuntimeConfig -Arguments @(
    "initialize", "--data-root", "\\server\share\NETGRID", "--program-root", $programRoot,
    "--template", $templatePath, "--state-file", (Join-Path $scratch "invalid-unc.json")
  ) -ExpectedExitCode 2

  $invalidDataRoot = Join-Path $scratch "invalid-existing"
  New-Item -ItemType Directory -Path (Join-Path $invalidDataRoot "config") -Force | Out-Null
  [System.IO.File]::WriteAllText(
    (Join-Path $invalidDataRoot "config\runtime.env"),
    "NETGRID_DATA_ROOT=`"$invalidDataRoot`"`r`nNETGRID_TOKEN_SALT=<installer-generated-secret>`r`n",
    [System.Text.UTF8Encoding]::new($false)
  )
  Invoke-RuntimeConfig -Arguments @(
    "initialize", "--data-root", $invalidDataRoot, "--program-root", $programRoot,
    "--template", $templatePath, "--state-file", (Join-Path $scratch "invalid-secret.json")
  ) -ExpectedExitCode 2

  Write-Output "WINDOWS_RUNTIME_CONFIG_TEST_OK"
} finally {
  $resolvedScratch = [System.IO.Path]::GetFullPath($scratch)
  $allowedPrefix = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
  if ($resolvedScratch.StartsWith($allowedPrefix, [System.StringComparison]::OrdinalIgnoreCase) -and
      [System.IO.Path]::GetFileName($resolvedScratch).StartsWith("netgrid-runtime-config-test-", [System.StringComparison]::Ordinal)) {
    Remove-Item -LiteralPath $resolvedScratch -Recurse -Force -ErrorAction SilentlyContinue
  }
}
