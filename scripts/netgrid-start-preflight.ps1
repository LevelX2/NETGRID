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
