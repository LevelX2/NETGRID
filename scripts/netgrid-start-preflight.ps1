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

function Test-NetgridWebServerBinding {
  param(
    [Parameter(Mandatory = $true)][string]$ServerUrl,
    [Parameter(Mandatory = $true)][string]$WebUrl
  )
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $WebUrl -TimeoutSec 4 -ErrorAction Stop
    $binding = [regex]::Match($response.Content, 'data-netgrid-server-origin="([^"]+)"')
    return $response.StatusCode -eq 200 -and $binding.Success -and
      [System.Net.WebUtility]::HtmlDecode($binding.Groups[1].Value) -eq $ServerUrl.TrimEnd('/')
  } catch {
    return $false
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
