function Get-NetgridStartupDiagnostic {
  param(
    [Parameter(Mandatory = $true)][string]$LogPath,
    [Parameter(Mandatory = $true)][long]$StartOffset
  )

  if (-not (Test-Path -LiteralPath $LogPath)) { return "Das Serverprotokoll fehlt. Prüfe das Launcherprotokoll und die Schreibrechte im Protokollverzeichnis." }
  $stream = [System.IO.File]::Open($LogPath, 'Open', 'Read', 'ReadWrite')
  try {
    # Only diagnose output from this launch, never previous failed starts.
    if ($stream.Length -lt $StartOffset) { return "Das Serverprotokoll wurde während des Starts gekürzt. Prüfe die Startprotokolle." }
    [void]$stream.Seek($StartOffset, 'Begin')
    $reader = New-Object System.IO.StreamReader($stream)
    try { $output = $reader.ReadToEnd() } finally { $reader.Dispose() }
  } finally { $stream.Dispose() }

  if ($output -match 'Storage nutzt nicht das aktuelle Schema\.') {
    return "Die lokale Datenbank ist veraltet und passt nicht mehr zur aktuellen NETGRID-Version. Der Server wurde deshalb nicht gestartet.`nNächster Schritt: Bei gestopptem Server die konfigurierte SQLite-Datenbank sichern und zurücksetzen, dann NETGRID erneut starten. Dadurch werden bisherige Partien und gegebenenfalls Konten und Kontodecks aus der laufenden App entfernt. Es wurden keine Daten automatisch gelöscht."
  }
  if ($output -match 'Storage ist neuer als dieser Servercode\.') {
    return "Die lokale Datenbank stammt aus einer neueren NETGRID-Version. Starte NETGRID mit der dazu passenden aktuellen Version. Es wurden keine Daten automatisch gelöscht."
  }
  if ($output -match 'Storage-Schema konnte nicht sicher erkannt werden\.') {
    return "Das Schema der lokalen Datenbank konnte nicht erkannt werden. Prüfe den konfigurierten SQLite-Pfad und die Datenbank anhand des Serverlogs. Es wurden keine Daten automatisch gelöscht."
  }
  return "Die konkrete Ursache konnte nicht automatisch bestimmt werden. Prüfe die unten genannten Startprotokolle."
}

function Test-NetgridBrowserConnection {
  param(
    [Parameter(Mandatory = $true)][string]$ServerUrl,
    [Parameter(Mandatory = $true)][string]$WebUrl
  )
  try {
    $origin = ([Uri]$WebUrl).GetLeftPart([UriPartial]::Authority)
    $response = Invoke-WebRequest -UseBasicParsing -Uri "$($ServerUrl.TrimEnd('/'))/health" -Headers @{ Origin = $origin } -TimeoutSec 4 -ErrorAction Stop
    return $response.StatusCode -eq 200 -and
      $response.Headers['Access-Control-Allow-Origin'] -eq $origin -and
      $response.Headers['Access-Control-Allow-Credentials'] -eq 'true' -and
      ($response.Content | ConvertFrom-Json).ok -eq $true
  } catch {
    return $false
  }
}

function Get-NetgridServerBuildIdentity {
  param([Parameter(Mandatory = $true)][string]$Url)
  try {
    $health = Invoke-RestMethod -Uri $Url -TimeoutSec 4 -ErrorAction Stop
    $build = $health.build
    if ($health.ok -is [bool] -and $health.ok -and $build.source -cin @('git', 'embedded') -and
        $build.productVersion -is [string] -and -not [string]::IsNullOrWhiteSpace($build.productVersion) -and
        $build.buildNumber -is [string] -and $build.buildNumber -cmatch '^[0-9]+$' -and
        $build.commit -is [string] -and $build.commit -cmatch '^[0-9a-f]{7,40}$') {
      return "$($build.productVersion)/$($build.buildNumber)/$($build.commit)"
    }
  } catch {
    return $null
  }
  return $null
}

function Get-NetgridCheckoutBuildIdentity {
  param([Parameter(Mandatory = $true)][string]$ProjectRoot)

  $versionPath = Join-Path $ProjectRoot 'packages/shared/src/product-version.ts'
  try {
    $versionSource = [IO.File]::ReadAllText($versionPath)
    $version = [regex]::Match($versionSource, 'export const NETGRID_PRODUCT_VERSION = "([^"\r\n]+)";')
    $number = (& git -C $ProjectRoot rev-list --count HEAD 2>$null)
    if ($LASTEXITCODE -ne 0) { throw 'git_count_failed' }
    $commit = (& git -C $ProjectRoot rev-parse --short=9 HEAD 2>$null)
    if ($LASTEXITCODE -ne 0) { throw 'git_commit_failed' }
    if (-not $version.Success -or $number -cnotmatch '^[0-9]+$' -or $commit -cnotmatch '^[0-9a-f]{9,40}$') {
      throw 'checkout_build_invalid'
    }
    return "$($version.Groups[1].Value)/$number/$commit"
  } catch {
    throw 'Die Buildkennung des aktuellen Checkouts konnte nicht bestimmt werden (startup_checkout_build_unavailable). Prüfe Git und packages/shared/src/product-version.ts.'
  }
}

function Get-NetgridWebStartupStatus {
  param(
    [Parameter(Mandatory = $true)][string]$ServerUrl,
    [Parameter(Mandatory = $true)][string]$WebUrl
  )
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $WebUrl -TimeoutSec 4 -ErrorAction Stop
    if ($response.StatusCode -ne 200) { return $null }

    $binding = [regex]::Match($response.Content, 'data-netgrid-server-origin="([^"]+)"')
    $build = [regex]::Match($response.Content, 'data-netgrid-build="([^"]+)"')
    return [pscustomobject]@{
      BindingMatches = $binding.Success -and
        [System.Net.WebUtility]::HtmlDecode($binding.Groups[1].Value) -eq $ServerUrl.TrimEnd('/')
      BuildIdentity = [System.Net.WebUtility]::HtmlDecode($build.Groups[1].Value)
    }
  } catch {
    return $null
  }
}

function Test-NetgridLocalPortListener {
  param(
    [Parameter(Mandatory = $true)][ValidateRange(1, 65535)][int]$Port
  )

  try {
    return @(
      Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction Stop
    ).Count -gt 0
  } catch {
    return $false
  }
}
