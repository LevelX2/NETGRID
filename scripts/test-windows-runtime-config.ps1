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
NETGRID_SERVER_HOST=127.0.0.1
NETGRID_SERVER_PORT=8787
HOSTNAME=127.0.0.1
PORT=3100
NETGRID_DEPLOYMENT_PROFILE=local
NETGRID_ACCOUNT_ACCESS_MODE=simple
NETGRID_WEB_BASE_URL=http://127.0.0.1:3100
NETGRID_SERVER_BASE_URL=http://127.0.0.1:8787
NETGRID_ALLOWED_ORIGINS=http://127.0.0.1:3100
NEXT_PUBLIC_NETGRID_SERVER_URL=http://127.0.0.1:8787
NETGRID_LAUNCHER_WEB_URL=http://127.0.0.1:3100
NETGRID_LAUNCHER_SERVER_URL=http://127.0.0.1:8787
NETGRID_TOKEN_SALT=<installer-generated-secret>
NETGRID_RATE_LIMIT_PROFILE=local
NETGRID_MAINTENANCE_BASE_URL=http://127.0.0.1:3100
NETGRID_MAINTENANCE_ALLOWED_ORIGINS=http://127.0.0.1:3100
NETGRID_INITIAL_CLEANUP_RETENTION_DAYS=30
"@, [System.Text.UTF8Encoding]::new($false))

  $arguments = @(
    "initialize",
    "--data-root", $dataRoot,
    "--program-root", $programRoot,
    "--template", $templatePath,
    "--state-file", $stateFile,
    "--deployment-profile", "private_lan",
    "--lan-address", "192.168.50.20",
    "--web-port", "3110",
    "--server-port", "8797",
    "--retention-days", "90",
    "--account-access-mode", "protected"
  )
  Invoke-RuntimeConfig -Arguments $arguments
  $runtimeEnvironment = Join-Path $dataRoot "config\runtime.env"
  $firstHash = (Get-FileHash -LiteralPath $runtimeEnvironment -Algorithm SHA256).Hash
  $source = [System.IO.File]::ReadAllText($runtimeEnvironment)
  if ($source -match [regex]::Escape("<installer-generated-secret>") -or
      $source -notmatch "(?m)^NETGRID_TOKEN_SALT=[A-Za-z0-9_-]{43}\r?$" -or
      $source -notmatch '(?m)^NETGRID_DATA_ROOT=".+"\r?$' -or
      $source -notmatch '(?m)^NETGRID_DEPLOYMENT_PROFILE=private_lan\r?$' -or
      $source -notmatch '(?m)^NETGRID_WEB_BASE_URL=http://192\.168\.50\.20:3110\r?$' -or
      $source -notmatch '(?m)^NETGRID_LAUNCHER_WEB_URL=http://127\.0\.0\.1:3110\r?$' -or
      $source -notmatch '(?m)^NETGRID_INITIAL_CLEANUP_RETENTION_DAYS=90\r?$' -or
      $source -notmatch '(?m)^NETGRID_ACCOUNT_ACCESS_MODE=protected\r?$') {
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

  $cacheRoot = Join-Path $scratch "cache-data"
  $setupFixture = Join-Path $scratch "setup-fixture.exe"
  [System.IO.File]::WriteAllText($setupFixture, "setup-v1")
  $setupHash = (Get-FileHash -LiteralPath $setupFixture -Algorithm SHA256).Hash.ToLowerInvariant()
  Invoke-RuntimeConfig -Arguments @("cache-setup", "--data-root", $cacheRoot, "--state-file", (Join-Path $scratch "cache-state.json"), "--source", $setupFixture, "--sha256", $setupHash)
  $cachedSetup = Join-Path $cacheRoot "config\updates\NETGRID-Setup.exe"
  if ((Get-FileHash -LiteralPath $cachedSetup -Algorithm SHA256).Hash.ToLowerInvariant() -ne $setupHash) {
    throw "Der geschützte Setup-Cache enthält nicht die geprüfte Ausgangsdatei."
  }
  [System.IO.File]::WriteAllText($setupFixture, "setup-v2")
  $pendingHash = (Get-FileHash -LiteralPath $setupFixture -Algorithm SHA256).Hash.ToLowerInvariant()
  Invoke-RuntimeConfig -Arguments @("cache-setup", "--data-root", $cacheRoot, "--state-file", (Join-Path $scratch "cache-state.json"), "--source", $setupFixture, "--sha256", $pendingHash)
  if ((Get-FileHash -LiteralPath (Join-Path $cacheRoot "config\updates\NETGRID-Setup.pending.exe") -Algorithm SHA256).Hash.ToLowerInvariant() -ne $pendingHash -or
      (Get-FileHash -LiteralPath $cachedSetup -Algorithm SHA256).Hash.ToLowerInvariant() -ne $setupHash) {
    throw "Der Setup-Cache hat die verifizierte Vorversion vorzeitig ersetzt."
  }
  Invoke-RuntimeConfig -Arguments @("cache-setup", "--data-root", (Join-Path $scratch "bad-cache"), "--state-file", (Join-Path $scratch "bad-cache-state.json"), "--source", $setupFixture, "--sha256", ("0" * 64)) -ExpectedExitCode 2

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
    $currentSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
    $cleanupRule = [System.Security.AccessControl.FileSystemAccessRule]::new(
      $currentSid,
      [System.Security.AccessControl.FileSystemRights]::FullControl,
      [System.Security.AccessControl.AccessControlType]::Allow
    )
    foreach ($item in @((Get-Item -LiteralPath $resolvedScratch)) + @(Get-ChildItem -LiteralPath $resolvedScratch -Recurse -Force)) {
      $acl = $item.GetAccessControl([System.Security.AccessControl.AccessControlSections]::Access)
      $acl.AddAccessRule($cleanupRule)
      $item.SetAccessControl($acl)
    }
    Remove-Item -LiteralPath $resolvedScratch -Recurse -Force
  }
}
