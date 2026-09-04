param(
  [string]$ReleaseRoot,
  [string]$OutputRoot,
  [switch]$SkipReleaseBuild
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ReleaseRoot = if ([string]::IsNullOrWhiteSpace($ReleaseRoot)) {
  Join-Path $projectRoot "output\windows-release"
} else {
  [System.IO.Path]::GetFullPath($ReleaseRoot)
}
$OutputRoot = if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
  Join-Path $projectRoot "output\windows-installer"
} else {
  [System.IO.Path]::GetFullPath($OutputRoot)
}
$installerInputRoot = Join-Path $projectRoot "output\windows-installer-input"
$legalRoot = Join-Path $installerInputRoot "legal"
$localDotnet = Join-Path $projectRoot ".tools\dotnet\dotnet.exe"
$dotnet = if (Test-Path -LiteralPath $localDotnet -PathType Leaf) {
  $localDotnet
} else {
  $command = Get-Command dotnet -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "Das in global.json gepinnte .NET SDK 10.0.302 ist nicht verfügbar."
  }
  $command.Source
}

Push-Location $projectRoot
try {
  if (-not $SkipReleaseBuild) {
    & corepack pnpm build:windows-release-output
    if ($LASTEXITCODE -ne 0) { throw "Windows-Releaseoutput konnte nicht gebaut werden." }
  }
  & node scripts/check-windows-release-output.mjs --artifact $ReleaseRoot
  if ($LASTEXITCODE -ne 0) { throw "Windows-Releaseoutput ist nicht freigegeben." }

  $layout = Get-Content -LiteralPath (Join-Path $ReleaseRoot "product-layout.json") -Raw | ConvertFrom-Json
  $productVersion = [string]$layout.product.installerVersion
  if ($productVersion -notmatch '^1\.0\.\d+$') {
    throw "Ungültige Installer-Version im Produktlayout: $productVersion"
  }

  New-Item -ItemType Directory -Path $legalRoot -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $projectRoot "LICENSE") -Destination (Join-Path $legalRoot "NETGRID-LICENSE.txt") -Force
  & node scripts/build-third-party-notices.mjs --release $ReleaseRoot --output (Join-Path $legalRoot "THIRD-PARTY-NOTICES.txt")
  if ($LASTEXITCODE -ne 0) { throw "Drittanbieterhinweise konnten nicht erzeugt werden." }

  & $dotnet tool restore
  if ($LASTEXITCODE -ne 0) { throw "WiX Toolset 7.0.0 konnte nicht wiederhergestellt werden." }
  & $dotnet tool run wix -- -acceptEula wix7 extension add WixToolset.BootstrapperApplications.wixext/7.0.0
  if ($LASTEXITCODE -ne 0) { throw "Die gepinnte WiX-Bootstrapper-Erweiterung konnte nicht wiederhergestellt werden." }

  New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null
  $intermediateRoot = Join-Path $OutputRoot "obj"
  $msiPath = Join-Path $OutputRoot "NETGRID-$productVersion-x64.msi"
  $setupPath = Join-Path $OutputRoot "NETGRID-Setup-$productVersion-x64.exe"
  $iconPath = Join-Path $projectRoot "apps\web\public\brand\netgrid.ico"

  & $dotnet tool run wix -- build -acceptEula wix7 -arch x64 `
    -d "ProductVersion=$productVersion" `
    -d "ReleaseRoot=$ReleaseRoot" `
    -d "LegalRoot=$legalRoot" `
    -d "NetgridIcon=$iconPath" `
    -intermediateFolder (Join-Path $intermediateRoot "product") `
    -pdbtype none `
    -o $msiPath `
    installer/product/Product.wxs
  if ($LASTEXITCODE -ne 0) { throw "NETGRID-MSI konnte nicht gebaut werden." }

  & $dotnet tool run wix -- build -acceptEula wix7 -arch x64 `
    -ext WixToolset.BootstrapperApplications.wixext/7.0.0 `
    -d "ProductVersion=$productVersion" `
    -d "ProductMsi=$msiPath" `
    -d "NetgridIcon=$iconPath" `
    -intermediateFolder (Join-Path $intermediateRoot "bundle") `
    -pdbtype none `
    -o $setupPath `
    installer/bundle/Bundle.wxs
  if ($LASTEXITCODE -ne 0) { throw "NETGRID-Setup konnte nicht gebaut werden." }

  & node scripts/check-windows-installer.mjs --release $ReleaseRoot --msi $msiPath --setup $setupPath --dotnet $dotnet
  if ($LASTEXITCODE -ne 0) { throw "Installer-Payloadprüfung ist fehlgeschlagen." }

  $releaseMetadata = [ordered]@{
    schemaVersion = "netgrid-windows-installer-release-v1"
    product = $layout.product
    platform = "windows-x64"
    unsignedPrivateAlpha = $true
    artifacts = @(
      [ordered]@{ name = [System.IO.Path]::GetFileName($setupPath); sha256 = (Get-FileHash -LiteralPath $setupPath -Algorithm SHA256).Hash.ToLowerInvariant() },
      [ordered]@{ name = [System.IO.Path]::GetFileName($msiPath); sha256 = (Get-FileHash -LiteralPath $msiPath -Algorithm SHA256).Hash.ToLowerInvariant() }
    )
  }
  $metadataPath = Join-Path $OutputRoot "release-metadata.json"
  $releaseMetadata | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $metadataPath -Encoding utf8
  $checksumLines = $releaseMetadata.artifacts | ForEach-Object { "$($_.sha256)  $($_.name)" }
  $checksumLines | Set-Content -LiteralPath (Join-Path $OutputRoot "SHA256SUMS.txt") -Encoding ascii
  Write-Output "WINDOWS_INSTALLER_BUILD_OK version=$productVersion output=$OutputRoot"
} finally {
  Pop-Location
}
