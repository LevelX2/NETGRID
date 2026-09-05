param([ValidateSet('Start','Public','Private','IsolateFirewall','Loopback','Stop')][string]$Action='Start')
$ErrorActionPreference='Stop'
if ($env:USERNAME -ne 'WDAGUtilityAccount' -or $PSScriptRoot -ne 'C:\NETGRID-TestInput') { throw 'sandbox_guest_context_required' }
$resultRoot='C:\NETGRID-TestResult'
$statePath=Join-Path $resultRoot 'lan-state.json'
function Write-State { $script:state | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $statePath -Encoding utf8 }
function Assert-True { param([bool]$Value,[string]$Code) if(-not $Value){throw $Code} }
function Read-Status { param([string]$Url) try { [int](Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 10).StatusCode } catch { if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { throw } } }
function Isolate-SandboxFirewall {
  # Sandbox's broad container allow rule masks all product profile rules.
  # Disable only that positively identified guest rule for the measurement;
  # do not install a substitute block rule or modify host firewall policy.
  Assert-True (-not $script:state.sandboxFirewallRules) 'sandbox_firewall_already_isolated'
  $rules=@(Get-NetFirewallRule -PolicyStore PersistentStore -DisplayName 'Container: allow inbound' -ErrorAction SilentlyContinue | Where-Object { [string]$_.Enabled -eq 'True' })
  $script:state.sandboxFirewallRules=@()
  foreach($rule in $rules) {
    $app=$rule | Get-NetFirewallApplicationFilter
    $port=$rule | Get-NetFirewallPortFilter
    Assert-True ($rule.Name -match '^Container: allow inbound - \(null\) - [A-Fa-f0-9-]{36}$' -and [string]$rule.Profile -eq 'Any' -and [string]$rule.Direction -eq 'Inbound' -and [string]$rule.Action -eq 'Allow' -and [string]$app.Program -eq 'Any' -and [string]$port.Protocol -eq 'Any' -and [string]$port.LocalPort -eq 'Any') 'sandbox_container_rule_shape_invalid'
    $script:state.sandboxFirewallRules += [ordered]@{name=[string]$rule.Name;originalEnabled=$true;scope='disposable-guest-only';reason='remove-container-wide-allow-from-profile-measurement'}
    Write-State
    Disable-NetFirewallRule -PolicyStore PersistentStore -Name $rule.Name | Out-Null
    Assert-True ([string](Get-NetFirewallRule -PolicyStore ActiveStore -Name $rule.Name).Enabled -eq 'False') 'sandbox_container_rule_disable_failed'
  }
  $script:state.firewallMeasurement='product-rules-without-sandbox-container-wide-allow'
  Write-State
}
if ($Action -eq 'Start') {
  Assert-True (-not (Test-Path -LiteralPath $statePath)) 'lan_test_already_started'
  $suite=Get-Content -LiteralPath (Join-Path $resultRoot 'suite-result.json') -Raw | ConvertFrom-Json
  Assert-True $suite.ok 'completed_sandbox_suite_required'
  Assert-True (-not (Test-Path -LiteralPath 'HKLM:\SOFTWARE\LevelX2\NETGRID')) 'existing_netgrid_registration'
  Assert-True (@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object LocalPort -in 32141,32142).Count -eq 0) 'lan_test_ports_busy'
  $interfaces=@(Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.IPv4Address })
  Assert-True ($interfaces.Count -eq 1) 'sandbox_network_interface_not_unique'
  $address=[string]$interfaces[0].IPv4Address.IPAddress
  Assert-True ($address -match '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)') 'sandbox_private_ipv4_required'
  $testId=[guid]::NewGuid().ToString('N')
  $programRoot=Join-Path $env:ProgramFiles "NETGRID-E2E-$testId"
  $dataRoot=Join-Path $env:ProgramData "NETGRID-E2E-$testId"
  $metadata=Get-Content -LiteralPath 'C:\NETGRID-Test\update\release-metadata.json' -Raw | ConvertFrom-Json
  foreach($artifact in $metadata.artifacts){
    $artifactPath=Join-Path 'C:\NETGRID-Test\update' $artifact.name
    Assert-True ((Get-FileHash -LiteralPath $artifactPath -Algorithm SHA256).Hash.ToLowerInvariant() -eq $artifact.sha256) 'lan_artifact_hash_mismatch'
  }
  $msi=Join-Path 'C:\NETGRID-Test\update' ($metadata.artifacts | Where-Object name -like '*.msi').name
  $setup=Join-Path 'C:\NETGRID-Test\update' ($metadata.artifacts | Where-Object name -like '*.exe').name
  $setupHash=(Get-FileHash -LiteralPath $setup -Algorithm SHA256).Hash.ToLowerInvariant()
  $state=[ordered]@{state='installing'; testId=$testId; programRoot=$programRoot; dataRoot=$dataRoot; address=$address; interfaceIndex=[int]$interfaces[0].InterfaceIndex; msi=$msi; artifacts=$metadata.artifacts; startedUtc=[DateTime]::UtcNow.ToString('O'); runtimeProcesses=@(); runtimeMode='isolated-network-probe-no-desktop-ui'}
  Write-State
  Isolate-SandboxFirewall
  # Only this disposable guest's adapter is modified, never a host adapter.
  Set-NetConnectionProfile -InterfaceIndex $state.interfaceIndex -NetworkCategory Private
  $install=Start-Process -FilePath 'msiexec.exe' -ArgumentList @('/i',('"'+$msi+'"'),'/qn','/norestart',('INSTALLFOLDER="'+$programRoot+'"'),('NETGRID_DATA_ROOT="'+$dataRoot+'"'),('NETGRID_SETUP_SOURCE="'+$setup+'"'),"NETGRID_SETUP_SHA256=$setupHash",'NETGRID_DEPLOYMENT_PROFILE=private_lan',"NETGRID_LAN_ADDRESS=$address",'NETGRID_WEB_PORT=32141','NETGRID_SERVER_PORT=32142','INSTALLDESKTOPSHORTCUT=0') -Wait -PassThru -WindowStyle Hidden
  Assert-True ($install.ExitCode -in 0,3010) "lan_install_failed:$($install.ExitCode)"
  $ruleEvidence=@(foreach($name in @('NETGRID Web (Private)','NETGRID Server (Private)')) {
    $rules=@(Get-NetFirewallRule -DisplayName $name)
    Assert-True ($rules.Count -eq 1) 'lan_firewall_rule_not_unique'
    $rule=$rules[0]
    $application=$rule | Get-NetFirewallApplicationFilter
    $port=$rule | Get-NetFirewallPortFilter
    Assert-True ([string]$rule.Profile -eq 'Private' -and [string]$rule.Enabled -eq 'True' -and [string]$rule.Direction -eq 'Inbound' -and [string]$rule.Action -eq 'Allow') 'lan_firewall_scope_invalid'
    Assert-True ($application.Program -eq (Join-Path $programRoot 'runtime\node\node.exe') -and [string]$port.Protocol -eq 'TCP' -and [string]$port.LocalPort -in '32141','32142') 'lan_firewall_binding_invalid'
    [ordered]@{name=$name;profile=[string]$rule.Profile;program=[string]$application.Program;port=[string]$port.LocalPort}
  })
  $state.rules=$ruleEvidence
  # Deliberate isolated-test start, not the normal desktop launch path. Load
  # only the installed configuration and start its installed Node/entrypoints;
  # no browser, tray, authentication dialog or Windows UI is controlled.
  foreach($name in @([Environment]::GetEnvironmentVariables('Process').Keys)) {
    if($name -match '^(NETGRID_|NODE_OPTIONS$|NODE_ENV$|HOSTNAME$|PORT$|NEXT_PUBLIC_NETGRID_SERVER_URL$)') {
      [Environment]::SetEnvironmentVariable($name,$null,'Process')
    }
  }
  foreach($line in Get-Content -LiteralPath (Join-Path $dataRoot 'config\runtime.env')) {
    $entry=$line.Trim()
    if(-not $entry -or $entry.StartsWith('#')){continue}
    $separator=$entry.IndexOf('=')
    Assert-True ($separator -gt 0) 'lan_runtime_environment_invalid'
    $name=$entry.Substring(0,$separator).Trim()
    $value=$entry.Substring($separator+1).Trim()
    if($value.StartsWith('"') -or $value.EndsWith('"')) {
      Assert-True ($value.Length -ge 2 -and $value.StartsWith('"') -and $value.EndsWith('"')) 'lan_runtime_environment_quotes_invalid'
      $value=$value.Substring(1,$value.Length-2)
    }
    [Environment]::SetEnvironmentVariable($name,$value,'Process')
  }
  $node=Join-Path $programRoot 'runtime\node\node.exe'
  foreach($component in @(@{name='server';entry='app\server.mjs';directory='app'},@{name='web';entry='app\apps\web\server.js';directory='app\apps\web'})) {
    $process=Start-Process -FilePath $node -ArgumentList ('"'+(Join-Path $programRoot $component.entry)+'"') -WorkingDirectory (Join-Path $programRoot $component.directory) -PassThru -WindowStyle Hidden -RedirectStandardOutput (Join-Path $resultRoot ('lan-'+$component.name+'-output.txt')) -RedirectStandardError (Join-Path $resultRoot ('lan-'+$component.name+'-errors.txt'))
    $state.runtimeProcesses += [ordered]@{pid=$process.Id;startedUtc=$process.StartTime.ToUniversalTime().ToString('O');executable=$node;component=$component.name}
    Write-State
  }
  $state.state='starting-runtime'
  Write-State
  $deadline=[DateTime]::UtcNow.AddMinutes(3)
  $healthy=$false
  while([DateTime]::UtcNow -lt $deadline) {
    foreach($owned in $state.runtimeProcesses) { Assert-True ($null -ne (Get-Process -Id $owned.pid -ErrorAction SilentlyContinue)) "lan_runtime_exited:$($owned.component)" }
    try { $healthy=(Read-Status 'http://127.0.0.1:32142/health') -eq 200 -and (Read-Status 'http://127.0.0.1:32141/') -eq 200 } catch [System.Net.WebException] { $healthy=$false }
    if($healthy){break}
    Start-Sleep -Seconds 2
  }
  Assert-True $healthy 'lan_runtime_health_timeout'
  $state.loopbackMaintenanceStatus=Read-Status 'http://127.0.0.1:32142/api/storage/maintenance/auth/session'
  Assert-True ($state.loopbackMaintenanceStatus -eq 503) 'lan_maintenance_local_bootstrap_status_invalid'
  $state.state='private-profile-ready-for-host-probe'
  Write-State
  exit 0
}
$storedState=Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
$state=[ordered]@{}
foreach($property in $storedState.PSObject.Properties){$state[$property.Name]=$property.Value}
Assert-True ($state.programRoot -match '^C:\\Program Files\\NETGRID-E2E-[a-f0-9]{32}$' -and $state.dataRoot -eq (Join-Path 'C:\ProgramData' (Split-Path $state.programRoot -Leaf))) 'lan_state_scope_invalid'
if($Action -eq 'IsolateFirewall') {
  Isolate-SandboxFirewall
} elseif($Action -eq 'Private') {
  Assert-True ($state.state -eq 'public-profile-ready-for-host-probe') 'lan_private_transition_invalid'
  Set-NetConnectionProfile -InterfaceIndex $state.interfaceIndex -NetworkCategory Private
  $state.state='private-profile-ready-for-host-probe'
  Write-State
} elseif($Action -eq 'Public') {
  Assert-True ($state.state -eq 'private-profile-ready-for-host-probe') 'lan_public_transition_invalid'
  Set-NetConnectionProfile -InterfaceIndex $state.interfaceIndex -NetworkCategory Public
  $state.loopbackServerStatus=$null
  $state.loopbackWebStatus=$null
  $state.loopbackMaintenanceStatus=$null
  $state.state='public-profile-ready-for-host-probe'
  Write-State
} elseif($Action -eq 'Loopback') {
  $state.loopbackServerStatus=Read-Status 'http://127.0.0.1:32142/health'
  $state.loopbackWebStatus=Read-Status 'http://127.0.0.1:32141/'
  $state.loopbackMaintenanceStatus=Read-Status 'http://127.0.0.1:32142/api/storage/maintenance/auth/session'
  Assert-True ($state.loopbackServerStatus -eq 200 -and $state.loopbackWebStatus -eq 200) 'lan_loopback_health_failed'
  Assert-True ($state.loopbackMaintenanceStatus -eq 503) 'lan_loopback_maintenance_status_invalid'
  Write-State
} elseif($Action -eq 'Stop') {
  foreach($owned in $state.runtimeProcesses) {
    Assert-True ($owned.executable -eq (Join-Path $state.programRoot 'runtime\node\node.exe')) 'lan_process_executable_scope_invalid'
    $process=Get-Process -Id $owned.pid -ErrorAction SilentlyContinue
    if($process) {
      Assert-True ($process.Path -eq $owned.executable -and $process.StartTime.ToUniversalTime().ToString('O') -eq $owned.startedUtc) 'lan_process_ownership_mismatch'
      # Isolated network-probe teardown, not evidence of tray shutdown.
      & taskkill.exe /PID $process.Id /T /F | Out-Null
      Assert-True ($LASTEXITCODE -eq 0) 'lan_process_teardown_failed'
    }
  }
  $uninstall=Start-Process -FilePath 'msiexec.exe' -ArgumentList @('/x',('"'+$state.msi+'"'),'/qn','/norestart',('NETGRID_DATA_ROOT="'+$state.dataRoot+'"'),'DELETEUSERDATA=1') -Wait -PassThru -WindowStyle Hidden
  Assert-True ($uninstall.ExitCode -in 0,1605,3010) 'lan_uninstall_failed'
  foreach($path in @($state.programRoot,$state.dataRoot,'HKLM:\SOFTWARE\LevelX2\NETGRID')) { Assert-True (-not (Test-Path -LiteralPath $path)) 'lan_cleanup_leftover' }
  Assert-True (@(Get-NetFirewallRule -DisplayName 'NETGRID Web (Private)','NETGRID Server (Private)' -ErrorAction SilentlyContinue).Count -eq 0) 'lan_firewall_cleanup_failed'
  Assert-True (@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object LocalPort -in 32141,32142).Count -eq 0) 'lan_ports_not_closed'
  foreach($savedRule in $state.sandboxFirewallRules) {
    Assert-True ($savedRule.name -match '^Container: allow inbound - \(null\) - [A-Fa-f0-9-]{36}$' -and $savedRule.originalEnabled -eq $true) 'sandbox_firewall_restore_scope_invalid'
    Enable-NetFirewallRule -PolicyStore PersistentStore -Name $savedRule.name | Out-Null
    Assert-True ([string](Get-NetFirewallRule -PolicyStore ActiveStore -Name $savedRule.name).Enabled -eq 'True') 'sandbox_firewall_restore_failed'
  }
  $state.sandboxFirewallRestored=$true
  $state.state='cleaned'
  $state.finishedUtc=[DateTime]::UtcNow.ToString('O')
  Write-State
}
