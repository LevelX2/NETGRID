param(
  [Parameter(Mandatory=$true)][string]$RunRoot,
  [ValidateSet('Private','Public')][string]$Profile='Private'
)
$ErrorActionPreference='Stop'
$projectRoot=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$allowedRoot=[IO.Path]::GetFullPath((Join-Path $projectRoot 'output\windows-sandbox-e2e'))+'\'
$RunRoot=[IO.Path]::GetFullPath($RunRoot)
if(-not $RunRoot.StartsWith($allowedRoot,[StringComparison]::OrdinalIgnoreCase) -or (Split-Path $RunRoot -Leaf) -notmatch '^[a-f0-9]{32}$'){throw 'lan_host_run_scope_invalid'}
$environment=Get-Content -LiteralPath (Join-Path $RunRoot 'sandbox-environment.json') -Raw | ConvertFrom-Json
$state=Get-Content -LiteralPath (Join-Path $RunRoot 'result\lan-state.json') -Raw | ConvertFrom-Json
if($state.firewallMeasurement -ne 'product-rules-without-sandbox-container-wide-allow'){throw 'lan_firewall_measurement_preflight_missing'}
$network=& wsb.exe ip --id $environment.id --raw | ConvertFrom-Json
if($LASTEXITCODE -ne 0 -or @($network.Networks).Count -ne 1 -or $network.Networks[0].IpV4Address -ne $state.address){throw 'lan_guest_address_binding_failed'}
$address=[string]$state.address
if($address -notmatch '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)' -or $state.state -ne ($Profile.ToLowerInvariant()+'-profile-ready-for-host-probe')){throw 'lan_profile_precondition_invalid'}
Add-Type -AssemblyName System.Net.Http
$handler=[System.Net.Http.HttpClientHandler]::new()
$handler.UseProxy=$false
$handler.AllowAutoRedirect=$false
$client=[System.Net.Http.HttpClient]::new($handler)
$client.Timeout=[TimeSpan]::FromSeconds(8)
$checks=@()
try {
  foreach($endpoint in @(@{port=32141;path='/';name='web'},@{port=32142;path='/health';name='server'})) {
    $url="http://${address}:$($endpoint.port)$($endpoint.path)"
    $status=$null
    $networkError=$null
    try {
      $response=$client.GetAsync($url).GetAwaiter().GetResult()
      try { $status=[int]$response.StatusCode } finally { $response.Dispose() }
    } catch {
      $exception=$_.Exception.GetBaseException()
      if($exception -isnot [System.Net.Http.HttpRequestException] -and $exception -isnot [System.Threading.Tasks.TaskCanceledException] -and $exception -isnot [System.Net.Sockets.SocketException] -and $exception -isnot [System.TimeoutException]){throw}
      $networkError=$exception.GetType().Name
    }
    if($Profile -eq 'Private' -and $status -ne 200){throw "private_host_access_failed:$($endpoint.name)"}
    if($Profile -eq 'Public' -and ($null -ne $status -or -not $networkError)){throw "public_profile_is_reachable:$($endpoint.name)"}
    $checks += [ordered]@{name=$endpoint.name;status=$status;networkError=$networkError}
  }
  if($Profile -eq 'Private') {
    $response=$client.GetAsync("http://${address}:32142/api/storage/maintenance/auth/session").GetAwaiter().GetResult()
    try {
      $body=$response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json
      if([int]$response.StatusCode -ne 403 -or $body.error.code -ne 'maintenance_unavailable'){throw 'maintenance_was_not_blocked_for_lan_client'}
      $checks += [ordered]@{name='maintenance-loopback-only';status=403;code=[string]$body.error.code}
    } finally { $response.Dispose() }
  } else {
    if($state.loopbackServerStatus -ne 200 -or $state.loopbackWebStatus -ne 200 -or $state.loopbackMaintenanceStatus -ne 503){throw 'public_blocking_requires_guest_loopback_health_evidence'}
  }
  $result=[ordered]@{ok=$true;profile=$Profile;sampledUtc=[DateTime]::UtcNow.ToString('O');sandboxId=$environment.id;address=$address;checks=$checks;artifacts=$state.artifacts;firewallMeasurement=$state.firewallMeasurement;sandboxFirewallRules=$state.sandboxFirewallRules}
  $result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $RunRoot ('result\lan-host-'+$Profile.ToLowerInvariant()+'.json')) -Encoding utf8
  Write-Output "WINDOWS_PRIVATE_LAN_HOST_PROBE_OK profile=$Profile"
} finally { $client.Dispose() }
