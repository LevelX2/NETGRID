. (Join-Path $PSScriptRoot "..\netgrid-start-preflight.ps1")

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
