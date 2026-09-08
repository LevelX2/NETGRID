# Compile the real authoring with inert fixture files, then inspect the actual
# MSI tables. This is NOT a product installer and is never installed or shipped.
$ErrorActionPreference = 'Stop'
$project = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$probe = Join-Path $project ('output\msi-authoring-probe-' + [guid]::NewGuid().ToString('N'))
$dotnet = Join-Path $project '.tools\dotnet\dotnet.exe'
$actionDll = Join-Path $project 'apps\windows\Netgrid.InstallerActions\bin\x64\Release\net48\NETGRID.InstallerActions.CA.dll'
$icon = Join-Path $project 'apps\web\public\brand\netgrid.ico'
$legalSource = Join-Path $project 'output\windows-installer-input\legal'
$inert = Join-Path ([Environment]::GetFolderPath('System')) 'where.exe'
foreach ($required in @($dotnet, $actionDll, $icon, $inert)) {
  if (-not (Test-Path -LiteralPath $required -PathType Leaf)) { throw "msi_authoring_probe_input_missing:$required" }
}
New-Item -ItemType Directory -Path $probe | Out-Null
$release = Join-Path $probe 'payload'
$legal = Join-Path $probe 'legal'
$executables = Join-Path $probe 'inert'
foreach ($folder in @($release, $legal, $executables)) { New-Item -ItemType Directory -Path $folder | Out-Null }
Copy-Item -LiteralPath $icon -Destination (Join-Path $release 'probe.ico')
foreach ($name in @('node.exe', 'NETGRID.RuntimeConfig.exe', 'NETGRID.exe', 'NETGRID.FirstRun.exe', 'NETGRID.Updater.exe')) {
  Copy-Item -LiteralPath $inert -Destination (Join-Path $executables $name)
}
foreach ($name in @('NETGRID-LICENSE.txt', 'THIRD-PARTY-NOTICES.txt', 'NODE-LICENSE.txt', 'DOTNET-LICENSE.txt', 'DOTNET-THIRD-PARTY-NOTICES.txt', 'WIX-DTF-NOTICES.txt')) {
  Copy-Item -LiteralPath (Join-Path $legalSource $name) -Destination (Join-Path $legal $name)
}
$msi = Join-Path $probe 'AUTHORING-PROBE-NOT-FOR-INSTALL.msi'
$catalog = Get-Content -LiteralPath (Join-Path $project 'apps\windows\Common\windows-ui-strings.json') -Raw -Encoding UTF8 | ConvertFrom-Json
Push-Location $project
try {
  & $dotnet tool run wix -- build -acceptEula wix7 -arch x64 `
    -d 'ProductVersion=1.0.1' -d "ReleaseRoot=$release" -d "LegalRoot=$legal" `
    -d "NodeRoot=$executables" -d "RuntimeConfigRoot=$executables" -d "LauncherRoot=$executables" `
    -d "FirstRunRoot=$executables" -d "UpdaterRoot=$executables" -d "LifecycleActionsPath=$actionDll" `
    -d "NetgridIcon=$icon" -d "FirstRunTitleDe=$($catalog.de.'first.title')" `
    -d "FirstRunTitleEn=$($catalog.en.'first.title')" -d "FirstRunTitleFr=$($catalog.fr.'first.title')" `
    -intermediateFolder (Join-Path $probe 'obj') -pdbtype none -o $msi installer/product/Product.wxs
  if ($LASTEXITCODE -ne 0) { throw 'msi_authoring_probe_build_failed' }
  & (Join-Path $PSScriptRoot 'check-windows-msi-lifecycle.ps1') -MsiPath $msi
  Write-Output "MSI_AUTHORING_PROBE_OK installed=false productPayload=false fixture=$msi"
} finally { Pop-Location }
