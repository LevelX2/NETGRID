param(
  [string]$ReleaseRoot,
  [string]$OutputRoot,
  [switch]$SkipReleaseBuild
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$usesDefaultOutputRoot = [string]::IsNullOrWhiteSpace($OutputRoot)
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
$nodeRoot = Join-Path $installerInputRoot "runtime\node"
$runtimeConfigRoot = Join-Path $installerInputRoot "runtime-config"
$launcherRoot = Join-Path $installerInputRoot "launcher"
$firstRunRoot = Join-Path $installerInputRoot "first-run"
$updaterRoot = Join-Path $installerInputRoot "updater"
$setupHostRoot = Join-Path $installerInputRoot "setup-host"
$lifecycleRoot = Join-Path $installerInputRoot "lifecycle"
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

function Reset-BuildDirectory {
  param([string]$Path, [string]$ProjectRoot)
  $resolvedPath = [System.IO.Path]::GetFullPath($Path)
  $allowedRoot = [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot "output")) + [System.IO.Path]::DirectorySeparatorChar
  if (-not $resolvedPath.StartsWith($allowedRoot, [System.StringComparison]::OrdinalIgnoreCase) -or
      $resolvedPath -eq $allowedRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar)) {
    throw "Der Buildpfad liegt außerhalb des erlaubten Outputbereichs."
  }
  if (Test-Path -LiteralPath $resolvedPath) {
    Remove-Item -LiteralPath $resolvedPath -Recurse -Force
  }
  New-Item -ItemType Directory -Path $resolvedPath -Force | Out-Null
}

Push-Location $projectRoot
try {
  if (-not $SkipReleaseBuild) {
    & corepack pnpm build:windows-release-output
    if ($LASTEXITCODE -ne 0) { throw "Windows-Releaseoutput konnte nicht gebaut werden." }
  }
  & node scripts/check-windows-release-output.mjs --artifact $ReleaseRoot
  if ($LASTEXITCODE -ne 0) { throw "Windows-Releaseoutput ist nicht freigegeben." }
  & $dotnet run --project tests/windows/Netgrid.Updater.Tests/Netgrid.Updater.Tests.csproj -c Release
  if ($LASTEXITCODE -ne 0) { throw "Die Windows-Updater-Regressionstests sind fehlgeschlagen." }
  & $dotnet run --project tests/windows/Netgrid.UpdateData.Tests/Netgrid.UpdateData.Tests.csproj -c Release
  if ($LASTEXITCODE -ne 0) { throw "Die vollständige Windows-Updatesicherung hat ihre Regressionstests nicht bestanden." }
  & $dotnet run --project tests/windows/Netgrid.UpdateHandoff.Tests/Netgrid.UpdateHandoff.Tests.csproj -c Release
  if ($LASTEXITCODE -ne 0) { throw "Die Windows-Update-Übergabetests sind fehlgeschlagen." }
  & $dotnet run --project tests/windows/Netgrid.SetupHost.Tests/Netgrid.SetupHost.Tests.csproj -c Release
  if ($LASTEXITCODE -ne 0) { throw "Die Windows-Setup-Regressionstests sind fehlgeschlagen." }
  & $dotnet run --project tests/windows/Netgrid.FirstRun.Tests/Netgrid.FirstRun.Tests.csproj -c Release
  if ($LASTEXITCODE -ne 0) { throw "Die Windows-Ersteinrichtungs-UI-Tests sind fehlgeschlagen." }
  & $dotnet run --project tests/windows/Netgrid.Launcher.Tests/Netgrid.Launcher.Tests.csproj -c Release
  if ($LASTEXITCODE -ne 0) { throw "Die Windows-Launcher-Downloadtests sind fehlgeschlagen." }
  & $dotnet run --project tests/windows/Netgrid.InstallerLifecycle.Tests/Netgrid.InstallerLifecycle.Tests.csproj -c Release
  if ($LASTEXITCODE -ne 0) { throw "Die Windows-Installer-Lifecycle-Tests sind fehlgeschlagen." }

  $layout = Get-Content -LiteralPath (Join-Path $ReleaseRoot "product-layout.json") -Raw | ConvertFrom-Json
  $productVersion = [string]$layout.product.installerVersion
  if ($productVersion -notmatch '^1\.0\.\d+$') {
    throw "Ungültige Installer-Version im Produktlayout: $productVersion"
  }

  Reset-BuildDirectory -Path $installerInputRoot -ProjectRoot $projectRoot
  New-Item -ItemType Directory -Path $legalRoot -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $projectRoot "LICENSE") -Destination (Join-Path $legalRoot "NETGRID-LICENSE.txt") -Force
  Copy-Item -LiteralPath (Join-Path $projectRoot "installer\legal\WIX-DTF-NOTICES.txt") -Destination (Join-Path $legalRoot "WIX-DTF-NOTICES.txt") -Force
  & node scripts/build-third-party-notices.mjs --release $ReleaseRoot --output (Join-Path $legalRoot "THIRD-PARTY-NOTICES.txt")
  if ($LASTEXITCODE -ne 0) { throw "Drittanbieterhinweise konnten nicht erzeugt werden." }

  $nodeDefinition = Get-Content -LiteralPath (Join-Path $projectRoot "installer\runtime\node-runtime.json") -Raw | ConvertFrom-Json
  $downloadRoot = Join-Path $projectRoot ".tools\downloads"
  New-Item -ItemType Directory -Path $downloadRoot -Force | Out-Null
  $nodeArchive = Join-Path $downloadRoot ([string]$nodeDefinition.archive)
  if (-not (Test-Path -LiteralPath $nodeArchive -PathType Leaf) -or
      (Get-FileHash -LiteralPath $nodeArchive -Algorithm SHA256).Hash.ToLowerInvariant() -ne [string]$nodeDefinition.sha256) {
    $partialArchive = "$nodeArchive.partial"
    Invoke-WebRequest -UseBasicParsing -Uri ([string]$nodeDefinition.url) -OutFile $partialArchive
    $downloadedHash = (Get-FileHash -LiteralPath $partialArchive -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($downloadedHash -ne [string]$nodeDefinition.sha256) {
      Remove-Item -LiteralPath $partialArchive -Force
      throw "Die heruntergeladene Node-Laufzeit stimmt nicht mit der gepinnten SHA-256-Prüfsumme überein."
    }
    Move-Item -LiteralPath $partialArchive -Destination $nodeArchive -Force
  }
  New-Item -ItemType Directory -Path $nodeRoot -Force | Out-Null
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $archive = [System.IO.Compression.ZipFile]::OpenRead($nodeArchive)
  try {
    $nodeExecutableEntry = $archive.GetEntry("$($nodeDefinition.rootDirectory)/node.exe")
    $nodeLicenseEntry = $archive.GetEntry("$($nodeDefinition.rootDirectory)/LICENSE")
    if (-not $nodeExecutableEntry -or -not $nodeLicenseEntry) {
      throw "Die gepinnte Node-Laufzeit enthält nicht die erwarteten Produktdateien."
    }
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($nodeExecutableEntry, (Join-Path $nodeRoot "node.exe"), $true)
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($nodeLicenseEntry, (Join-Path $legalRoot "NODE-LICENSE.txt"), $true)
  } finally {
    $archive.Dispose()
  }
  $nodeVersion = (& (Join-Path $nodeRoot "node.exe") --version).TrimStart("v")
  if ($LASTEXITCODE -ne 0 -or $nodeVersion -ne [string]$nodeDefinition.version) {
    throw "Die materialisierte Node-Laufzeit besitzt nicht die gepinnte Version."
  }

  Copy-Item -LiteralPath (Join-Path (Split-Path -Parent $dotnet) "LICENSE.txt") -Destination (Join-Path $legalRoot "DOTNET-LICENSE.txt") -Force
  Copy-Item -LiteralPath (Join-Path (Split-Path -Parent $dotnet) "ThirdPartyNotices.txt") -Destination (Join-Path $legalRoot "DOTNET-THIRD-PARTY-NOTICES.txt") -Force
  & $dotnet build apps/windows/Netgrid.InstallerActions/Netgrid.InstallerActions.csproj `
    -c Release -p:AcceptEula=wix7 -p:RestoreLockedMode=true
  if ($LASTEXITCODE -ne 0) { throw "Die NETGRID-MSI-Lifecycle-Komponente konnte nicht gebaut werden." }
  & node --test scripts/check-windows-installer-lifecycle.test.mjs
  if ($LASTEXITCODE -ne 0) { throw "Die MSI-Lifecycle-Audit-Regressionstests sind fehlgeschlagen." }
  $dtfPackageRoot = & $dotnet msbuild apps/windows/Netgrid.InstallerActions/Netgrid.InstallerActions.csproj -nologo -getProperty:PkgWixToolset_Dtf_CustomAction
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($dtfPackageRoot)) { throw "Der gepinnte DTF-Paketpfad fehlt." }
  & powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-windows-installer-action-payload.ps1 `
    -Binary (Join-Path $projectRoot "apps\windows\Netgrid.InstallerActions\bin\x64\Release\net48\NETGRID.InstallerActions.CA.dll") `
    -ExpectedBuildDirectory (Join-Path $projectRoot "apps\windows\Netgrid.InstallerActions\bin\x64\Release\net48") `
    -DtfToolRoot (Join-Path $dtfPackageRoot.Trim() "tools")
  if ($LASTEXITCODE -ne 0) { throw "Die eingebettete MSI-Aktionspayload ist nicht freigegeben." }
  New-Item -ItemType Directory -Path $lifecycleRoot -Force | Out-Null
  $lifecycleActionsPath = Join-Path $lifecycleRoot "NETGRID.InstallerActions.CA.dll"
  Copy-Item -LiteralPath (Join-Path $projectRoot "apps\windows\Netgrid.InstallerActions\bin\x64\Release\net48\NETGRID.InstallerActions.CA.dll") -Destination $lifecycleActionsPath
  & node scripts/check-windows-installer-lifecycle.mjs --binary $lifecycleActionsPath
  if ($LASTEXITCODE -ne 0) { throw "Die NETGRID-MSI-Lifecycle-Binärprüfung ist fehlgeschlagen." }
  & $dotnet publish apps/windows/Netgrid.RuntimeConfig/Netgrid.RuntimeConfig.csproj `
    -c Release -r win-x64 --self-contained true `
    -p:DebugType=None -p:DebugSymbols=false `
    -o $runtimeConfigRoot
  if ($LASTEXITCODE -ne 0) { throw "Die NETGRID-Runtimekonfiguration konnte nicht gebaut werden." }
  $runtimeConfigExecutable = Join-Path $runtimeConfigRoot "NETGRID.RuntimeConfig.exe"
  if (-not (Test-Path -LiteralPath $runtimeConfigExecutable -PathType Leaf)) {
    throw "Die selbst enthaltene NETGRID-Runtimekonfiguration fehlt."
  }
  & powershell -ExecutionPolicy Bypass -File scripts/test-windows-runtime-config.ps1 -Executable $runtimeConfigExecutable
  if ($LASTEXITCODE -ne 0) { throw "Die NETGRID-Runtimekonfiguration hat ihre Isolationstests nicht bestanden." }
  & $dotnet publish apps/windows/Netgrid.Launcher/Netgrid.Launcher.csproj `
    -c Release -r win-x64 --self-contained true `
    -p:DebugType=None -p:DebugSymbols=false `
    -o $launcherRoot
  if ($LASTEXITCODE -ne 0) { throw "Der NETGRID-Launcher konnte nicht gebaut werden." }
  $launcherExecutable = Join-Path $launcherRoot "NETGRID.exe"
  if (-not (Test-Path -LiteralPath $launcherExecutable -PathType Leaf)) {
    throw "Der selbst enthaltene NETGRID-Launcher fehlt."
  }
  & node scripts/smoke-windows-launcher.mjs
  if ($LASTEXITCODE -ne 0) { throw "Der NETGRID-Launcher hat den isolierten Windows-Smoke nicht bestanden." }
  & $dotnet publish apps/windows/Netgrid.FirstRun/Netgrid.FirstRun.csproj `
    -c Release -r win-x64 --self-contained true `
    -p:DebugType=None -p:DebugSymbols=false `
    -o $firstRunRoot
  if ($LASTEXITCODE -ne 0) { throw "Die NETGRID-Ersteinrichtung konnte nicht gebaut werden." }
  $firstRunExecutable = Join-Path $firstRunRoot "NETGRID.FirstRun.exe"
  if (-not (Test-Path -LiteralPath $firstRunExecutable -PathType Leaf)) {
    throw "Die selbst enthaltene NETGRID-Ersteinrichtung fehlt."
  }
  & node scripts/smoke-windows-first-run.mjs --release $ReleaseRoot --first-run $firstRunExecutable --node (Join-Path $nodeRoot "node.exe")
  if ($LASTEXITCODE -ne 0) { throw "Die NETGRID-Ersteinrichtung hat ihren sicheren Bootstrap-Smoke nicht bestanden." }
  & $dotnet publish apps/windows/Netgrid.Updater/Netgrid.Updater.csproj `
    -c Release -r win-x64 --self-contained true `
    -p:DebugType=None -p:DebugSymbols=false `
    -o $updaterRoot
  if ($LASTEXITCODE -ne 0) { throw "Der NETGRID-Updater konnte nicht gebaut werden." }
  $updaterExecutable = Join-Path $updaterRoot "NETGRID.Updater.exe"
  if (-not (Test-Path -LiteralPath $updaterExecutable -PathType Leaf)) {
    throw "Der selbst enthaltene NETGRID-Updater fehlt."
  }
  & node scripts/smoke-windows-updater.mjs --launcher $launcherExecutable --updater $updaterExecutable
  if ($LASTEXITCODE -ne 0) { throw "Der NETGRID-Updater hat seinen isolierten Vertragssmoke nicht bestanden." }

  & $dotnet tool restore
  if ($LASTEXITCODE -ne 0) { throw "WiX Toolset 7.0.0 konnte nicht wiederhergestellt werden." }

  if ($usesDefaultOutputRoot) {
    Reset-BuildDirectory -Path $OutputRoot -ProjectRoot $projectRoot
  } else {
    New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null
  }
  $intermediateRoot = Join-Path $OutputRoot "obj"
  $msiPath = Join-Path $OutputRoot "NETGRID-$productVersion-x64.msi"
  $setupPath = Join-Path $OutputRoot "NETGRID-Setup-$productVersion-x64.exe"
  $iconPath = Join-Path $projectRoot "apps\web\public\brand\netgrid.ico"
  $uiCatalog = Get-Content -LiteralPath (Join-Path $projectRoot 'apps\windows\Common\windows-ui-strings.json') -Raw -Encoding UTF8 | ConvertFrom-Json
  foreach ($language in @('de','en','fr')) {
    $shortcutTitle = [string]$uiCatalog.$language.'first.title'
    if ([string]::IsNullOrWhiteSpace($shortcutTitle) -or $shortcutTitle.IndexOfAny([IO.Path]::GetInvalidFileNameChars()) -ge 0) {
      throw "Ungültiger lokalisierter Startmenüname: $language"
    }
  }

  & $dotnet tool run wix -- build -acceptEula wix7 -arch x64 `
    -d "ProductVersion=$productVersion" `
    -d "ReleaseRoot=$ReleaseRoot" `
    -d "LegalRoot=$legalRoot" `
    -d "NodeRoot=$nodeRoot" `
    -d "RuntimeConfigRoot=$runtimeConfigRoot" `
    -d "LauncherRoot=$launcherRoot" `
    -d "FirstRunRoot=$firstRunRoot" `
    -d "UpdaterRoot=$updaterRoot" `
    -d "LifecycleActionsPath=$lifecycleActionsPath" `
    -d "NetgridIcon=$iconPath" `
    -d "FirstRunTitleDe=$($uiCatalog.de.'first.title')" `
    -d "FirstRunTitleEn=$($uiCatalog.en.'first.title')" `
    -d "FirstRunTitleFr=$($uiCatalog.fr.'first.title')" `
    -intermediateFolder (Join-Path $intermediateRoot "product") `
    -pdbtype none `
    -o $msiPath `
    installer/product/Product.wxs
  if ($LASTEXITCODE -ne 0) { throw "NETGRID-MSI konnte nicht gebaut werden." }

  $msiSha256 = (Get-FileHash -LiteralPath $msiPath -Algorithm SHA256).Hash.ToLowerInvariant()
  $footprint = & (Join-Path $PSScriptRoot 'read-windows-msi-footprint.ps1') -MsiPath $msiPath
  & $dotnet publish apps/windows/Netgrid.SetupHost/Netgrid.SetupHost.csproj `
    -c Release -r win-x64 --self-contained true `
    -p:DebugType=None -p:DebugSymbols=false `
    "-p:EmbeddedMsiPath=$msiPath" `
    "-p:EmbeddedMsiSha256=$msiSha256" `
    "-p:NetgridProductVersion=$productVersion" `
    "-p:NetgridPayloadBytes=$($footprint.payloadBytes)" `
    "-p:NetgridPayloadFileCount=$($footprint.payloadFileCount)" `
    "-p:NetgridMsiBytes=$($footprint.msiBytes)" `
    -o $setupHostRoot
  if ($LASTEXITCODE -ne 0) { throw "Der geführte NETGRID-Setuphost konnte nicht gebaut werden." }
  $setupHostExecutable = Join-Path $setupHostRoot "NETGRID.Setup.exe"
  if (-not (Test-Path -LiteralPath $setupHostExecutable -PathType Leaf)) {
    throw "Der selbst enthaltene NETGRID-Setuphost fehlt."
  }
  Copy-Item -LiteralPath $setupHostExecutable -Destination $setupPath -Force

  $uiMatrixRoot = Join-Path $projectRoot "output\windows-ui-matrix"
  Reset-BuildDirectory -Path $uiMatrixRoot -ProjectRoot $projectRoot
  foreach ($language in @("de", "en", "fr")) {
    foreach ($scale in @(100, 125, 150)) {
      $previewPath = Join-Path $uiMatrixRoot "setup-$language-$scale.png"
      $previewProcess = Start-Process -FilePath $setupHostExecutable -ArgumentList @("--render-preview", $language, [string]$scale, $previewPath) -Wait -PassThru -WindowStyle Hidden
      if ($previewProcess.ExitCode -ne 0) { throw "Die Windows-UI-Vorschau $language/$scale konnte nicht erzeugt werden." }
      $languagePreviewPath = Join-Path $uiMatrixRoot "language-$language-$scale.png"
      $languagePreviewProcess = Start-Process -FilePath $setupHostExecutable -ArgumentList @("--render-language-preview", $language, [string]$scale, $languagePreviewPath) -Wait -PassThru -WindowStyle Hidden
      if ($languagePreviewProcess.ExitCode -ne 0) { throw "Die Windows-Sprachauswahl-Vorschau $language/$scale konnte nicht erzeugt werden." }
      $uninstallPreviewPath = Join-Path $uiMatrixRoot "uninstall-$language-$scale.png"
      $uninstallPreviewProcess = Start-Process -FilePath $setupHostExecutable -ArgumentList @("--render-uninstall-preview", $language, [string]$scale, $uninstallPreviewPath) -Wait -PassThru -WindowStyle Hidden
      if ($uninstallPreviewProcess.ExitCode -ne 0) { throw "Die Windows-Deinstallationsvorschau $language/$scale konnte nicht erzeugt werden." }
    }
  }
  & node scripts/check-windows-ui.mjs --matrix $uiMatrixRoot
  if ($LASTEXITCODE -ne 0) { throw "Die Windows-Lokalisierungs- oder Layoutmatrix ist fehlgeschlagen." }

  & node scripts/check-windows-installer.mjs --release $ReleaseRoot --installer-input $installerInputRoot --msi $msiPath --setup $setupPath --dotnet $dotnet
  if ($LASTEXITCODE -ne 0) { throw "Installer-Payloadprüfung ist fehlgeschlagen." }

  $releaseMetadata = [ordered]@{
    schemaVersion = "netgrid-windows-installer-release-v1"
    product = $layout.product
    platform = "windows-x64"
    unsignedPrivateAlpha = $true
    runtime = [ordered]@{
      nodeVersion = [string]$nodeDefinition.version
      nodeArchiveSha256 = [string]$nodeDefinition.sha256
      runtimeConfigSha256 = (Get-FileHash -LiteralPath $runtimeConfigExecutable -Algorithm SHA256).Hash.ToLowerInvariant()
      launcherSha256 = (Get-FileHash -LiteralPath $launcherExecutable -Algorithm SHA256).Hash.ToLowerInvariant()
      firstRunSha256 = (Get-FileHash -LiteralPath $firstRunExecutable -Algorithm SHA256).Hash.ToLowerInvariant()
      updaterSha256 = (Get-FileHash -LiteralPath $updaterExecutable -Algorithm SHA256).Hash.ToLowerInvariant()
      setupHostSha256 = (Get-FileHash -LiteralPath $setupHostExecutable -Algorithm SHA256).Hash.ToLowerInvariant()
      installerLifecycleSha256 = (Get-FileHash -LiteralPath $lifecycleActionsPath -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    dataContract = [ordered]@{
      defaultRoot = "C:\ProgramData\NETGRID"
      mutableDirectories = @("runtime", "card-images")
      installerManagedDirectories = @("config")
      retainOnUninstall = $true
    }
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
