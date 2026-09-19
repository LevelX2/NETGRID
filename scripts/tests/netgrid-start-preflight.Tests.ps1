. (Join-Path $PSScriptRoot "..\netgrid-start-preflight.ps1")

Describe "Startfehlerdiagnose" {
  It "erklärt ein veraltetes Schema und die Folgen eines Resets" {
    $log = Join-Path $TestDrive "old.log"
    [IO.File]::WriteAllText($log, 'StorageError: Storage nutzt nicht das aktuelle Schema.')
    $message = Get-NetgridStartupDiagnostic -LogPath $log -StartOffset 0
    $message | Should Match 'Datenbank ist veraltet'
    $message | Should Match 'sichern und zurücksetzen'
    $message | Should Match 'Kontodecks'
  }

  It "empfiehlt bei neuerem Schema eine passende Programmversion" {
    $log = Join-Path $TestDrive "new.log"
    [IO.File]::WriteAllText($log, 'StorageError: Storage ist neuer als dieser Servercode.')
    Get-NetgridStartupDiagnostic -LogPath $log -StartOffset 0 | Should Match 'passenden aktuellen Version'
  }

  It "meldet ein nicht erkanntes Schema" {
    $log = Join-Path $TestDrive "unknown.log"
    [IO.File]::WriteAllText($log, 'Storage-Schema konnte nicht sicher erkannt werden.')
    Get-NetgridStartupDiagnostic -LogPath $log -StartOffset 0 | Should Match 'SQLite-Pfad'
  }

  It "ignoriert Schemafehler aus früheren Startversuchen" {
    $log = Join-Path $TestDrive "previous.log"
    [IO.File]::WriteAllText($log, "Storage nutzt nicht das aktuelle Schema.`n")
    $offset = (Get-Item -LiteralPath $log).Length
    [IO.File]::AppendAllText($log, 'Unrelated startup error')
    Get-NetgridStartupDiagnostic -LogPath $log -StartOffset $offset | Should Match 'nicht automatisch bestimmt'
  }
}

Describe "Startskript Serveradresse" {
  It "übergibt dem Webprozess dieselbe Laufzeitadresse wie dem Server" {
    $scriptPath = Join-Path $PSScriptRoot "..\start-netgrid.ps1"
    $parseErrors = $null
    $ast = [System.Management.Automation.Language.Parser]::ParseFile($scriptPath, [ref]$null, [ref]$parseErrors)
    $parseErrors.Count | Should Be 0
    $lanIp = "192.168.10.42"
    $webUrl = "http://${lanIp}:3100"
    $serverMode = "normal"
    foreach ($variable in @("serverEnvironment", "webEnvironment")) {
      $assignment = $ast.Find({
        param($node)
        $node -is [System.Management.Automation.Language.AssignmentStatementAst] -and
          $node.Left.Extent.Text -eq ('$' + $variable)
      }, $true)
      # Evaluate only the actual environment assignments, never the launcher.
      Invoke-Expression $assignment.Extent.Text
    }
    $webEnvironment.NETGRID_SERVER_BASE_URL | Should Be "http://${lanIp}:8787"
    $webEnvironment.NETGRID_SERVER_BASE_URL | Should Be $serverEnvironment.NETGRID_SERVER_BASE_URL
  }
}

Describe "Test-NetgridLocalPortListener" {
  It "gibt ohne Listener false zurück" {
    Mock Get-NetTCPConnection { @() }

    Test-NetgridLocalPortListener -Port 3100 | Should Be $false
  }

  It "erkennt einen Listener ohne HTTP-Anfrage" {
    Mock Get-NetTCPConnection { [pscustomobject]@{ OwningProcess = 1 } }

    Test-NetgridLocalPortListener -Port 8787 | Should Be $true
  }
}

Describe "Browser-Verbindung vor Startfreigabe" {
  BeforeEach {
    $script:reply = [pscustomobject]@{
      StatusCode = 200
      Headers = @{ 'Access-Control-Allow-Origin' = 'http://192.168.68.58:3100'; 'Access-Control-Allow-Credentials' = 'true' }
      Content = '{"ok":true}'
    }
    Mock Invoke-WebRequest { $script:reply }
  }
  It "prüft die tatsächliche Browser-Origin statt nur die Erreichbarkeit" {
    Test-NetgridBrowserConnection -ServerUrl 'http://192.168.68.58:8787' -WebUrl 'http://192.168.68.58:3100' | Should Be $true
    Assert-MockCalled Invoke-WebRequest -Times 1 -ParameterFilter { $Headers.Origin -eq 'http://192.168.68.58:3100' -and $Uri -eq 'http://192.168.68.58:8787/health' }
  }
  It "verweigert die Freigabe mit alter IP" {
    $script:reply.Headers['Access-Control-Allow-Origin'] = 'http://192.168.68.54:3100'
    Test-NetgridBrowserConnection -ServerUrl 'http://192.168.68.58:8787' -WebUrl 'http://192.168.68.58:3100' | Should Be $false
  }
  It "verweigert Wildcard und fehlende Credential-Freigabe" {
    $script:reply.Headers['Access-Control-Allow-Origin'] = '*'
    Test-NetgridBrowserConnection -ServerUrl 'http://192.168.68.58:8787' -WebUrl 'http://192.168.68.58:3100' | Should Be $false
    $script:reply.Headers['Access-Control-Allow-Origin'] = 'http://192.168.68.58:3100'
    $script:reply.Headers.Remove('Access-Control-Allow-Credentials')
    Test-NetgridBrowserConnection -ServerUrl 'http://192.168.68.58:8787' -WebUrl 'http://192.168.68.58:3100' | Should Be $false
  }
  It "behandelt HTTP-Fehler als nicht startbereit" {
    Mock Invoke-WebRequest { throw '403 origin_not_allowed' }
    Test-NetgridBrowserConnection -ServerUrl 'http://192.168.68.58:8787' -WebUrl 'http://192.168.68.58:3100' | Should Be $false
  }
  It "verweigert eine negative Health-Antwort" {
    $script:reply.Content = '{"ok":false}'
    Test-NetgridBrowserConnection -ServerUrl 'http://192.168.68.58:8787' -WebUrl 'http://192.168.68.58:3100' | Should Be $false
  }
  It "prüft die tatsächlich ausgelieferte Serveradresse im Webclient" {
    $script:reply.Content = '<html data-netgrid-server-origin="http://192.168.68.58:8787">'
    Test-NetgridWebServerBinding -ServerUrl 'http://192.168.68.58:8787' -WebUrl 'http://192.168.68.58:3100' | Should Be $true
    Test-NetgridWebServerBinding -ServerUrl 'http://192.168.68.54:8787' -WebUrl 'http://192.168.68.58:3100' | Should Be $false
    $script:reply.Content = '<html>Fehlerseite</html>'
    Test-NetgridWebServerBinding -ServerUrl 'http://192.168.68.58:8787' -WebUrl 'http://192.168.68.58:3100' | Should Be $false
  }
}
