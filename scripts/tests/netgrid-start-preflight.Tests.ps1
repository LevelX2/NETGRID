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
  It "liest Serverbindung und Build aus der ausgelieferten Weboberfläche" {
    $script:reply.Content = '<html data-netgrid-server-origin="http://192.168.68.58:8787" data-netgrid-build="1.0/9323/0505e46af">'
    $status = Get-NetgridWebStartupStatus -ServerUrl 'http://192.168.68.58:8787' -WebUrl 'http://192.168.68.58:3100'
    $status.BindingMatches | Should Be $true
    $status.BuildIdentity | Should Be '1.0/9323/0505e46af'
    $status = Get-NetgridWebStartupStatus -ServerUrl 'http://192.168.68.54:8787' -WebUrl 'http://192.168.68.58:3100'
    $status.BindingMatches | Should Be $false
    $script:reply.Content = '<html>Fehlerseite</html>'
    $status = Get-NetgridWebStartupStatus -ServerUrl 'http://192.168.68.58:8787' -WebUrl 'http://192.168.68.58:3100'
    $status.BindingMatches | Should Be $false
    $status.BuildIdentity | Should BeNullOrEmpty
  }
}

Describe "Buildkennung des laufenden Servers" {
  BeforeEach {
    $script:health = [pscustomobject]@{
      ok = $true
      build = [pscustomobject]@{ source = 'git'; productVersion = '1.0'; buildNumber = '9323'; commit = '0505e46af' }
    }
    Mock Invoke-RestMethod { $script:health }
  }
  It "verwendet die vom Server gemeldete Produktversion, Buildnummer und Commitkennung" {
    Get-NetgridServerBuildIdentity -Url 'http://192.168.68.58:8787/health' | Should Be '1.0/9323/0505e46af'
  }
  It "verwirft eine fehlende oder ungültige Buildkennung" {
    $script:health.build.source = 'unavailable'
    Get-NetgridServerBuildIdentity -Url 'http://192.168.68.58:8787/health' | Should BeNullOrEmpty
    $script:health.build.source = 'git'
    $script:health.build.commit = 'invalid'
    Get-NetgridServerBuildIdentity -Url 'http://192.168.68.58:8787/health' | Should BeNullOrEmpty
  }
}

Describe "Neustart bei neuer Buildkennung oder geänderter Netzwerkbindung" {
  function Request-NetgridStartupRestart { param($Message) throw 'Dialog must be mocked' }
  function Write-LauncherLog { param($Message) throw 'Log must be mocked' }
  function Stop-PortListeners { param($Ports) throw 'Stop must be mocked' }
  function Start-NetgridProcess { param($Command, $LogPath, $Environment) throw 'Start must be mocked' }
  BeforeEach {
    $ast = [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot '..\start-netgrid.ps1'), [ref]$null, [ref]$null)
    $serverBranch = $ast.Find({ param($node) $node -is [System.Management.Automation.Language.IfStatementAst] -and $node.Clauses[0].Item1.Extent.Text -like '*$serverReadyLanBefore*browserConnectionReady*' }, $true).Extent.Text
    $checkoutBranch = $ast.Find({ param($node) $node -is [System.Management.Automation.Language.IfStatementAst] -and $node.Clauses[0].Item1.Extent.Text -eq '$serverCheckoutMismatch -and -not $RestartServer' }, $true).Extent.Text
    $webBranch = $ast.Find({ param($node) $node -is [System.Management.Automation.Language.IfStatementAst] -and $node.Clauses[0].Item2.Extent.Text -like '*$webStatusBefore = Get-NetgridWebStartupStatus*' -and $node.Parent -is [System.Management.Automation.Language.NamedBlockAst] }, $true).Extent.Text
    $startWebBranch = $ast.Find({ param($node) $node -is [System.Management.Automation.Language.IfStatementAst] -and $node.Clauses[0].Item2.Extent.Text -like '*Starting web command*' }, $true).Extent.Text
    $script:webStatus = [pscustomobject]@{ BindingMatches = $true; BuildIdentity = '1.0/9323/0505e46af' }
    Mock Request-NetgridStartupRestart { $true }
    Mock Get-NetgridWebStartupStatus { $script:webStatus }
    Mock Write-LauncherLog {}
    Mock Stop-PortListeners {}
    Mock Start-NetgridProcess {}
    $RestartServer = $false
    $RestartWeb = $false
    $serverCheckoutMismatch = $false
    $serverReadyLanBefore = $true
    $browserConnectionReady = $false
    $serverBuild = '1.0/9323/0505e46af'
    $webReadyLanBefore = $true
    $serverEnvironment = @{ NETGRID_SERVER_BASE_URL = 'http://192.168.68.58:8787' }
    $targetWebUrl = 'http://192.168.68.58:3100'
  }
  It "setzt nach OK beide Neustartoptionen und vermeidet einen zweiten Dialog" {
    Invoke-Expression $serverBranch
    $RestartServer | Should Be $true
    $RestartWeb | Should Be $true
    Invoke-Expression $webBranch
    Assert-MockCalled Request-NetgridStartupRestart -Scope It -Times 1 -Exactly
  }
  It "startet auch zwei untereinander passende alte Prozesse für den aktuellen Checkout neu" {
    $serverCheckoutMismatch = $true
    $browserConnectionReady = $true
    Invoke-Expression $checkoutBranch
    $RestartServer | Should Be $true
    $RestartWeb | Should Be $true
    Invoke-Expression $serverBranch
    Invoke-Expression $webBranch
    Assert-MockCalled Request-NetgridStartupRestart -Scope It -Times 1 -Exactly
  }
  It "verwendet den zum Checkout passenden laufenden Server ohne Neustart weiter" {
    Invoke-Expression $checkoutBranch
    $RestartServer | Should Be $false
    $RestartWeb | Should Be $false
    Assert-MockCalled Request-NetgridStartupRestart -Scope It -Times 0 -Exactly
  }
  It "zeigt bei ausdrücklich angefordertem Neustart keinen Checkoutdialog" {
    $serverCheckoutMismatch = $true
    $RestartServer = $true
    Invoke-Expression $checkoutBranch
    Assert-MockCalled Request-NetgridStartupRestart -Scope It -Times 0 -Exactly
  }
  It "startet bei ausschließlich veralteter Webbindung nur den Webclient neu" {
    $script:webStatus.BindingMatches = $false
    Invoke-Expression $webBranch
    $RestartWeb | Should Be $true
    $RestartServer | Should Be $false
    Assert-MockCalled Request-NetgridStartupRestart -Scope It -Times 1 -Exactly
  }
  It "zeigt bei bereits angefordertem Serverneustart keinen weiteren Dialog" {
    $RestartServer = $true
    Invoke-Expression $serverBranch
    Assert-MockCalled Request-NetgridStartupRestart -Scope It -Times 0 -Exactly
  }
  It "stoppt und startet den alten Webclient bei einem neuen Serverbuild ohne Dialog" {
    $RestartServer = $true
    $script:webStatus.BuildIdentity = '1.0/9300/1b7795f40'
    Invoke-Expression $webBranch
    Invoke-Expression $startWebBranch
    Assert-MockCalled Stop-PortListeners -Scope It -Times 1 -Exactly -ParameterFilter { $Ports -contains 3100 }
    Assert-MockCalled Start-NetgridProcess -Scope It -Times 1 -Exactly -ParameterFilter { $Command -like '*@netgrid/web*' }
    Assert-MockCalled Request-NetgridStartupRestart -Scope It -Times 0 -Exactly
  }
  It "startet auch bei gleicher Buildnummer und anderem Commit neu" {
    $script:webStatus.BuildIdentity = '1.0/9323/1b7795f40'
    Invoke-Expression $webBranch
    $RestartWeb | Should Be $true
  }
  It "startet eine Weboberfläche ohne Buildkennung neu" {
    $script:webStatus.BuildIdentity = ''
    Invoke-Expression $webBranch
    $RestartWeb | Should Be $true
  }
  It "verwendet den Webclient beim Serverneustart auf demselben Build weiter" {
    $RestartServer = $true
    Invoke-Expression $webBranch
    Invoke-Expression $startWebBranch
    Assert-MockCalled Stop-PortListeners -Scope It -Times 0 -Exactly
    Assert-MockCalled Start-NetgridProcess -Scope It -Times 0 -Exactly
  }
  It "lässt den Webprozess bei fehlender Server-Buildkennung weiterlaufen" {
    $serverBuild = $null
    Invoke-Expression $webBranch
    Invoke-Expression $startWebBranch
    Assert-MockCalled Stop-PortListeners -Scope It -Times 0 -Exactly
    Assert-MockCalled Start-NetgridProcess -Scope It -Times 0 -Exactly
  }
}

Describe "Buildkennung des aktuellen Checkouts" {
  It "liest die tatsächliche Version, Commitanzahl und Commitkennung des angegebenen Checkouts" {
    $checkoutRoot = Join-Path $TestDrive 'checkout'
    $sourceDirectory = Join-Path $checkoutRoot 'packages/shared/src'
    New-Item -ItemType Directory -Path $sourceDirectory -Force | Out-Null
    $versionPath = Join-Path $sourceDirectory 'product-version.ts'
    [IO.File]::WriteAllText($versionPath, 'export const NETGRID_PRODUCT_VERSION = "1.0";')
    & git -c init.defaultBranch=main init --quiet $checkoutRoot
    & git -C $checkoutRoot add --all
    & git -C $checkoutRoot -c user.name=NETGRID-Test -c user.email=netgrid-test@example.invalid commit --quiet -m initial
    $first = Get-NetgridCheckoutBuildIdentity -ProjectRoot $checkoutRoot
    $first | Should Match '^1\.0/1/[0-9a-f]{9}$'
    [IO.File]::WriteAllText($versionPath, 'export const NETGRID_PRODUCT_VERSION = "1.1";')
    & git -C $checkoutRoot add --all
    & git -C $checkoutRoot -c user.name=NETGRID-Test -c user.email=netgrid-test@example.invalid commit --quiet -m current
    $current = Get-NetgridCheckoutBuildIdentity -ProjectRoot $checkoutRoot
    $current | Should Match '^1\.1/2/[0-9a-f]{9}$'
    $current | Should Not Be $first
  }
  It "verweigert fehlende lokale Buildquellen statt einen beliebigen laufenden Build zu akzeptieren" {
    { Get-NetgridCheckoutBuildIdentity -ProjectRoot $TestDrive } | Should Throw 'startup_checkout_build_unavailable'
  }
  It "verlangt vor dem Browserstart dieselbe Buildkennung für Server, Web und Checkout" {
    $ast = [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot '..\start-netgrid.ps1'), [ref]$null, [ref]$null)
    $assignment = $ast.Find({ param($node) $node -is [System.Management.Automation.Language.AssignmentStatementAst] -and $node.Left.Extent.Text -eq '$buildsMatch' }, $true).Extent.Text
    $serverBuildAfter = '1.0/100/123456789'
    $webStatusAfter = [pscustomobject]@{ BuildIdentity = $serverBuildAfter }
    $checkoutBuild = '1.0/101/abcdef012'
    Invoke-Expression $assignment
    $buildsMatch | Should Be $false
    $checkoutBuild = $serverBuildAfter
    Invoke-Expression $assignment
    $buildsMatch | Should Be $true
  }
}
