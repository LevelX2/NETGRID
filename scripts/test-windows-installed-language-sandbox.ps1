param([Parameter(Mandatory=$true)][string]$ArtifactRoot,[switch]$VerifyShortcuts)
$ErrorActionPreference='Stop'
if($env:USERNAME -ne 'WDAGUtilityAccount' -or $PSScriptRoot -ne 'C:\NETGRID-TestInput'){throw 'language_probe_requires_disposable_guest'}
$ArtifactRoot=[IO.Path]::GetFullPath($ArtifactRoot)
if($ArtifactRoot -notmatch '^C:\\NETGRID-TestInput\\language-review-[0-9]+$'){throw 'language_probe_artifact_scope_invalid'}
$resultRoot='C:\NETGRID-TestResult'
$prior=Get-Content -LiteralPath (Join-Path $resultRoot 'suite-result.json') -Raw | ConvertFrom-Json
if(-not $prior.ok){throw 'language_probe_requires_completed_matrix'}
if(Test-Path -LiteralPath 'HKLM:\SOFTWARE\LevelX2\NETGRID'){throw 'language_probe_existing_installation'}
if(@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object LocalPort -in 32141,32142).Count){throw 'language_probe_ports_busy'}
$startMenu='C:\ProgramData\Microsoft\Windows\Start Menu\Programs\NETGRID'
if(Test-Path -LiteralPath $startMenu){throw 'language_probe_existing_shortcuts'}
$metadata=Get-Content -LiteralPath (Join-Path $ArtifactRoot 'release-metadata.json') -Raw | ConvertFrom-Json
$sums=@(Get-Content -LiteralPath (Join-Path $ArtifactRoot 'SHA256SUMS.txt'))
if($metadata.schemaVersion -ne 'netgrid-windows-installer-release-v1' -or @($metadata.artifacts).Count -ne 2){throw 'language_probe_metadata_invalid'}
if($metadata.product.sourceDirty -ne $false){throw 'language_probe_requires_clean_source_artifact'}
foreach($artifact in $metadata.artifacts){
  if($artifact.name -notmatch '^NETGRID-(Setup-)?1\.0\.[0-9]+-x64\.(exe|msi)$'){throw 'language_probe_artifact_name_invalid'}
  $hash=(Get-FileHash -LiteralPath (Join-Path $ArtifactRoot $artifact.name) -Algorithm SHA256).Hash.ToLowerInvariant()
  if($hash -ne $artifact.sha256 -or $sums -notcontains "$hash  $($artifact.name)"){throw 'language_probe_artifact_hash_mismatch'}
}
$msiArtifacts=@($metadata.artifacts | Where-Object name -like '*.msi')
$setupArtifacts=@($metadata.artifacts | Where-Object name -like '*.exe')
if($msiArtifacts.Count -ne 1 -or $setupArtifacts.Count -ne 1){throw 'language_probe_artifact_ambiguous'}
$msi=Join-Path $ArtifactRoot $msiArtifacts[0].name
$setup=Join-Path $ArtifactRoot $setupArtifacts[0].name
$testId=[guid]::NewGuid().ToString('N')
$programRoot="C:\Program Files\NETGRID-E2E-$testId"
$dataRoot="C:\ProgramData\NETGRID-E2E-$testId"
$logRoot=Join-Path $resultRoot "language-$testId"
New-Item -ItemType Directory -Path $logRoot | Out-Null
function Quote { param([string]$Value) '"'+$Value.Replace('"','""')+'"' }
function Assert-True { param([bool]$Value,[string]$Code) if(-not $Value){throw $Code} }
function Invoke-Msi {
  param([string[]]$Arguments,[int[]]$Expected=@(0,3010))
  $process=Start-Process -FilePath msiexec.exe -ArgumentList $Arguments -PassThru -Wait -WindowStyle Hidden
  Assert-True ($process.ExitCode -in $Expected) "language_probe_msi_failed:$($process.ExitCode)"
}
function Check-Language {
  param([string]$Phase,[string]$ExpectedLanguage='fr')
  Assert-True ((Get-ItemPropertyValue -LiteralPath 'HKLM:\SOFTWARE\LevelX2\NETGRID' -Name UiLanguage) -eq $ExpectedLanguage) 'language_probe_preference_changed'
  foreach($component in @('NETGRID.exe','NETGRID.FirstRun.exe','NETGRID.Updater.exe')){
    $auditFile=Join-Path $logRoot ($Phase+'-'+$component+'.json')
    $process=Start-Process -FilePath (Join-Path $programRoot $component) -ArgumentList @('--audit-localization',(Quote $auditFile)) -PassThru -Wait -WindowStyle Hidden
    Assert-True ($process.ExitCode -eq 0) "language_probe_component_failed:$component"
    $audit=Get-Content -LiteralPath $auditFile -Raw | ConvertFrom-Json
    Assert-True ($audit.complete -and $audit.selectedLanguage -eq $ExpectedLanguage) "language_probe_not_inherited:$component"
  }
  if($VerifyShortcuts){
    $names=@{de='NETGRID Ersteinrichtung.lnk';en='NETGRID First Run.lnk';fr='Première configuration de NETGRID.lnk'}
    foreach($language in $names.Keys){
      Assert-True ((Test-Path -LiteralPath (Join-Path $startMenu $names[$language])) -eq ($language -eq $ExpectedLanguage)) "language_probe_shortcut_invalid:$language"
    }
  }
}
$startedUtc=[DateTime]::UtcNow.ToString('O')
try {
  Invoke-Msi @('/i',(Quote $msi),'/qn','/norestart','/l*v',(Quote (Join-Path $logRoot 'install.log')),("INSTALLFOLDER="+(Quote $programRoot)),("NETGRID_DATA_ROOT="+(Quote $dataRoot)),("NETGRID_SETUP_SOURCE="+(Quote $setup)),("NETGRID_SETUP_SHA256="+$setupArtifacts[0].sha256),'NETGRID_WEB_PORT=32141','NETGRID_SERVER_PORT=32142','INSTALLDESKTOPSHORTCUT=0','NETGRID_UI_LANGUAGE=fr')
  Check-Language 'installed'
  $environmentPath=Join-Path $dataRoot 'config\runtime.env'
  $configurationHash=(Get-FileHash -LiteralPath $environmentPath -Algorithm SHA256).Hash
  $products=@(Get-ItemProperty HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\* -ErrorAction SilentlyContinue | Where-Object DisplayName -eq 'NETGRID')
  Assert-True ($products.Count -eq 1 -and $products[0].PSChildName -match '^\{[A-Fa-f0-9-]{36}\}$') 'language_probe_product_ambiguous'
  Invoke-Msi @('/fa',[string]$products[0].PSChildName,'/qn','/norestart','/l*v',(Quote (Join-Path $logRoot 'repair.log')))
  Check-Language 'repaired'
  if($VerifyShortcuts){
    foreach($language in @('de','en')){
      Invoke-Msi @('/fa',[string]$products[0].PSChildName,'/qn','/norestart',"NETGRID_UI_LANGUAGE=$language",'/l*v',(Quote (Join-Path $logRoot ("language-change-$language.log"))))
      Check-Language "changed-$language" $language
    }
  }
  Assert-True ((Get-FileHash -LiteralPath $environmentPath -Algorithm SHA256).Hash -eq $configurationHash) 'language_probe_configuration_changed'
  $result=[ordered]@{ok=$true;checks=@('explicit-french-preference','first-run-launcher-updater-inherit-language','product-code-repair-preserves-language','configuration-preserved');artifacts=$metadata.artifacts;startedUtc=$startedUtc;testId=$testId}
  if($VerifyShortcuts){$result.checks+=@('localized-shortcut-fr','language-change-de-removes-old-shortcut','language-change-en-removes-old-shortcut')}
} catch {
  $result=[ordered]@{ok=$false;error=$_.Exception.Message;artifacts=$metadata.artifacts;startedUtc=$startedUtc;testId=$testId}
} finally {
  $cleanupErrors=@()
  try {Invoke-Msi @('/x',(Quote $msi),'/qn','/norestart',("NETGRID_DATA_ROOT="+(Quote $dataRoot)),'DELETEUSERDATA=1') -Expected @(0,1605,3010)} catch {$cleanupErrors+=$_.Exception.Message}
  foreach($target in @($programRoot,$dataRoot,$startMenu,'HKLM:\SOFTWARE\LevelX2\NETGRID')){if(Test-Path -LiteralPath $target){$cleanupErrors+="language_probe_cleanup_leftover:$target"}}
  if($cleanupErrors.Count){$result.ok=$false;$result.cleanupErrors=$cleanupErrors}
  $result.cleanupVerified=$cleanupErrors.Count -eq 0
  $result.finishedUtc=[DateTime]::UtcNow.ToString('O')
  $result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $resultRoot 'language-result.json') -Encoding utf8
}
if(-not $result.ok){exit 2}
