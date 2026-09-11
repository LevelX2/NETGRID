. (Join-Path $PSScriptRoot "..\netgrid-start-preflight.ps1")

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
