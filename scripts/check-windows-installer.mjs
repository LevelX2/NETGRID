import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:net";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { checkLifecycleBinary, checkLifecycleAuthoring } from "./check-windows-installer-lifecycle.mjs";

const releaseRoot = requiredPath("--release");
const installerInputRoot = requiredPath("--installer-input");
const msiPath = requiredPath("--msi");
const setupPath = requiredPath("--setup");
const dotnetPath = requiredPath("--dotnet");
// Keep this path deliberately short: Windows Installer still enforces the
// traditional path limit during administrative extraction.
const scratch = mkdtempSync(path.join(tmpdir(), "ngi-"));

try {
  assertFile(msiPath, "installer_msi_missing");
  assertFile(setupPath, "installer_setup_missing");
  run("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(import.meta.dirname, "check-windows-msi-lifecycle.ps1"), "-MsiPath", msiPath]);
  run("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(import.meta.dirname, "check-windows-msi-framework.ps1"), "-MsiPath", msiPath]);
  const administrativeRoot = path.join(scratch, "a");
  run("msiexec.exe", ["/a", msiPath, "/qn", `TARGETDIR=${administrativeRoot}`]);
  const layoutMatches = findFiles(administrativeRoot, "product-layout.json");
  if (layoutMatches.length !== 1)
    throw new Error(`installer_product_root_ambiguous:${layoutMatches.length}`);
  const installedProductRoot = path.dirname(layoutMatches[0]);
  const productLayout = JSON.parse(readFileSync(layoutMatches[0], "utf8"));
  const manifest = JSON.parse(
    readFileSync(path.join(releaseRoot, "product-manifest.json"), "utf8"),
  );
  const expected = new Map(
    manifest.files.map((entry) => [
      entry.path,
      { bytes: entry.bytes, sha256: entry.sha256 },
    ]),
  );
  expected.set("product-manifest.json", {
    bytes: statSync(path.join(releaseRoot, "product-manifest.json")).size,
    sha256: sha256(path.join(releaseRoot, "product-manifest.json")),
  });
  const installerFiles = new Map([
    ["legal/NETGRID-LICENSE.txt", "legal/NETGRID-LICENSE.txt"],
    ["legal/THIRD-PARTY-NOTICES.txt", "legal/THIRD-PARTY-NOTICES.txt"],
    ["legal/NODE-LICENSE.txt", "legal/NODE-LICENSE.txt"],
    ["legal/DOTNET-LICENSE.txt", "legal/DOTNET-LICENSE.txt"],
    ["legal/WIX-DTF-NOTICES.txt", "legal/WIX-DTF-NOTICES.txt"],
    [
      "legal/DOTNET-THIRD-PARTY-NOTICES.txt",
      "legal/DOTNET-THIRD-PARTY-NOTICES.txt",
    ],
    ["runtime/node/node.exe", "runtime/node/node.exe"],
    [
      "tools/NETGRID.RuntimeConfig.exe",
      "runtime-config/NETGRID.RuntimeConfig.exe",
    ],
    ["NETGRID.exe", "launcher/NETGRID.exe"],
    ["NETGRID.FirstRun.exe", "first-run/NETGRID.FirstRun.exe"],
    ["NETGRID.Updater.exe", "updater/NETGRID.Updater.exe"],
    ["tools/NETGRID.SetupStub.exe", "setup-stub/NETGRID.Setup.exe"],
  ]);
  for (const [installedRelative, inputRelative] of installerFiles) {
    const input = path.join(installerInputRoot, ...inputRelative.split("/"));
    assertFile(input, `installer_input_missing:${inputRelative}`);
    expected.set(installedRelative, {
      bytes: statSync(input).size,
      sha256: sha256(input),
    });
  }
  for (const [relative, metadata] of expected) {
    const installed = path.join(installedProductRoot, ...relative.split("/"));
    assertFile(installed, `installer_payload_missing:${relative}`);
    if (
      statSync(installed).size !== metadata.bytes ||
      sha256(installed) !== metadata.sha256
    )
      throw new Error(`installer_payload_mismatch:${relative}`);
  }
  const installedFiles = collectFiles(installedProductRoot).map((file) =>
    slash(path.relative(installedProductRoot, file)),
  );
  for (const relative of installedFiles)
    if (!expected.has(relative))
      throw new Error(`installer_payload_unexpected:${relative}`);
  const nodeRuntime = path.join(
    installedProductRoot,
    "runtime",
    "node",
    "node.exe",
  );
  const nodeVersion = run(nodeRuntime, ["--version"]).stdout.trim();
  if (!/^v24\.\d+\.\d+$/.test(nodeVersion))
    throw new Error(`installer_node_version_invalid:${nodeVersion}`);
  for (const executable of [setupPath, ...["NETGRID.exe", "NETGRID.FirstRun.exe", "NETGRID.Updater.exe", "tools/NETGRID.RuntimeConfig.exe", "tools/NETGRID.SetupStub.exe"]
    .map(relative => path.join(installedProductRoot, relative))])
    run("powershell.exe", ["-NoProfile", "-File", path.join(import.meta.dirname, "check-windows-native-version.ps1"),
      "-Executable", executable, "-Version", productLayout.product.installerVersion]);

  const decompiledPath = path.join(scratch, "package.wxs");
  run(dotnetPath, [
    "tool",
    "run",
    "wix",
    "--",
    "-acceptEula",
    "wix7",
    "msi",
    "decompile",
    msiPath,
    "-o",
    decompiledPath,
    "-x",
    path.join(scratch, "embedded"),
  ]);
  const authoring = readFileSync(decompiledPath, "utf8");
  checkLifecycleAuthoring(authoring);
  const lifecycleInput = path.join(installerInputRoot, "lifecycle", "NETGRID.InstallerActions.CA.dll");
  checkLifecycleBinary(lifecycleInput);
  const dtfPackageRoot = run(dotnetPath, ["msbuild", "apps/windows/Netgrid.InstallerActions/Netgrid.InstallerActions.csproj", "-nologo", "-getProperty:PkgWixToolset_Dtf_CustomAction"]).stdout.trim();
  if (!dtfPackageRoot) throw new Error("installer_action_dtf_package_path_missing");
  run("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(import.meta.dirname, "check-windows-installer-action-payload.ps1"),
    "-Binary", lifecycleInput, "-ExpectedBuildDirectory", path.resolve("apps/windows/Netgrid.InstallerActions/bin/x64/Release/net48"), "-DtfToolRoot", path.join(dtfPackageRoot, "tools")]);
  const lifecycleExport = path.join(scratch, "embedded", "Binary", "NetgridLifecycleActions");
  assertFile(lifecycleExport, "installer_lifecycle_embedded_binary_missing");
  if (sha256(lifecycleExport) !== sha256(lifecycleInput)) throw new Error("installer_lifecycle_embedded_binary_mismatch");
  const uiCatalog = JSON.parse(readFileSync(path.resolve(import.meta.dirname, '../apps/windows/Common/windows-ui-strings.json'), 'utf8'));
  if (!authoring.includes('Name="UiLanguage"') ||
      !authoring.includes('Id="ResolveNetgridUiLanguage"') ||
      !authoring.includes('Id="DefaultNetgridUiLanguage"'))
    throw new Error('installer_shortcut_language_not_bound');
  for (const language of ['de', 'en', 'fr']) {
    const title = uiCatalog[language]['first.title'];
    if (!authoring.includes(`Name="${title}"`) || !authoring.includes(`Condition="NETGRID_UI_LANGUAGE = &quot;${language}&quot;"`))
      throw new Error(`installer_shortcut_translation_missing:${language}`);
  }
  // EXE actions have no MSI session: their argument string must be resolved
  // from the prepared property while Windows Installer schedules the action.
  for (const action of ["InitializeNetgridRuntime", "CacheNetgridMsi", "CacheNetgridSetup", "RemoveNetgridFirewall", "DeleteNetgridData"]) {
    const definition = authoring.match(new RegExp(`<CustomAction Id="${action}"[^>]+>`))?.[0];
    if (!definition?.includes(`ExeCommand="[${action}]"`))
      throw new Error(`installer_exe_arguments_unbound:${action}`);
  }
  if (
    !authoring.includes('UpgradeCode="{D8271ACB-E70F-4CD5-9832-DEFE6A052B9F}"')
  )
    throw new Error("installer_upgrade_code_invalid");
  if (
    !authoring.includes(`Version="${productLayout.product.installerVersion}"`)
  )
    throw new Error("installer_product_version_invalid");
  // Scheduling is verified from the real MSI sequence table at entry;
  // downgrade support is checked by checkLifecycleAuthoring above.
  if (!authoring.includes('Property="SOURCELIST"') ||
      !authoring.includes('[NETGRID_DATA_ROOT]\\config\\installer\\[ProductCode]') ||
      !authoring.includes('--source &quot;[OriginalDatabase]&quot;') ||
      !authoring.includes('Name="RuntimeDataRoot"') ||
      !authoring.includes('Name="InstallDirectory"'))
    throw new Error("installer_persistent_repair_source_missing");
  if (
    !authoring.includes(
      '<CustomAction Id="InitializeNetgridRuntime" HideTarget="yes" Impersonate="no" Execute="deferred"',
    ) ||
    !authoring.includes(
      '<Custom Action="InitializeNetgridRuntime" Condition="NOT REMOVE~=&quot;ALL&quot;"',
    ) ||
    !authoring.includes('<Property Id="NETGRID_DATA_ROOT" Secure="yes" />') ||
    !authoring.includes(
      '<Property Id="NETGRID_DEPLOYMENT_PROFILE" Value="local" Secure="yes" />',
    ) ||
    !authoring.includes(
      '<Property Id="NETGRID_RETENTION_DAYS" Value="30" Secure="yes" />',
    ) ||
    !authoring.includes(
      '<Property Id="NETGRID_ACCOUNT_ACCESS_MODE" Value="simple" Secure="yes" />',
    ) ||
    !authoring.includes(
      '<Property Id="INSTALLDESKTOPSHORTCUT" Value="1" Secure="yes" />',
    ) ||
    !authoring.includes('Name="DesktopShortcutPreference"') ||
    !authoring.includes(
      '<Custom Action="SetINSTALLDESKTOPSHORTCUT" Condition="NETGRID_PREVIOUS_DESKTOP_SHORTCUT &lt;&gt; &quot;&quot;" Before="CostFinalize"',
    ) ||
    !authoring.includes("--configure-firewall &quot;true&quot;") ||
    !authoring.includes("--desktop-shortcut &quot;[INSTALLDESKTOPSHORTCUT]&quot;") ||
    !authoring.includes("--ui-language &quot;[NETGRID_UI_LANGUAGE]&quot;") ||
    !authoring.includes('Id="CacheNetgridSetup" HideTarget="yes"') ||
    !authoring.includes('<Custom Action="CacheNetgridSetup" Condition="NOT REMOVE~=&quot;ALL&quot;"') ||
    !authoring.includes(
      '<Property Id="DELETEUSERDATA" Value="0" Secure="yes" />',
    ) ||
    !authoring.includes('Id="DeleteNetgridData" HideTarget="yes"') ||
    !authoring.includes("DELETEUSERDATA = 1") ||
    !authoring.includes(
      '<CustomAction Id="RemoveNetgridFirewall" HideTarget="yes" Impersonate="no" Execute="deferred"',
    ) ||
    !authoring.includes(
      '<Custom Action="RemoveNetgridFirewall" Condition="REMOVE~=&quot;ALL&quot; AND NOT UPGRADINGPRODUCTCODE" Before="SetDeleteNetgridData"',
    ) ||
    !authoring.includes(
      '<Custom Action="DeleteNetgridData" Condition="REMOVE~=&quot;ALL&quot; AND DELETEUSERDATA = 1 AND NOT UPGRADINGPRODUCTCODE" Before="RemoveRegistryValues"',
    ) ||
    !authoring.includes('Condition="INSTALLDESKTOPSHORTCUT = 1"') ||
    !authoring.includes('Name="NETGRID Maintenance"') ||
    !authoring.includes('Arguments="--open-maintenance"') ||
    !authoring.includes('Name="NETGRID Ersteinrichtung"') ||
    !authoring.includes('Name="NETGRID Setup"') ||
    !authoring.includes('Arguments="--uninstall"')
  )
    throw new Error("installer_runtime_initialization_contract_invalid");
  if (!authoring.includes('File Id="NetgridUpdater"'))
    throw new Error("installer_updater_missing");

  const embeddedMsi = path.join(scratch, "embedded.msi");
  run(setupPath, ["--extract-msi", embeddedMsi]);
  const expectedMsiHash = sha256(msiPath);
  if (sha256(embeddedMsi) !== expectedMsiHash)
    throw new Error("installer_setup_msi_mismatch");
  run("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(import.meta.dirname, "test-windows-setup-reconstruction.ps1"),
    "-ProgramRoot", installedProductRoot, "-MsiPath", msiPath, "-SetupPath", setupPath]);
  const contractPath = path.join(scratch, "setup-contract.json");
  run(setupPath, ["--audit-contract", contractPath]);
  const setupContract = JSON.parse(readFileSync(contractPath, "utf8"));
  const footprint = setupContract.installationSpace?.footprint;
  if (
    footprint?.PayloadBytes !== [...expected.values()].reduce((total, file) => total + file.bytes, 0) ||
    footprint?.PayloadFileCount !== installedFiles.length ||
    footprint?.MsiBytes !== statSync(msiPath).size ||
    setupContract.installationSpace.initialDataReserveBytes !== 512 * 1024 * 1024 ||
    setupContract.installationSpace.includesTemporaryPayloadReserve !== true ||
    setupContract.installationSpace.aggregatesSharedDrives !== true
  ) throw new Error("installer_disk_space_footprint_unbound");
  if (
    setupContract.schemaVersion !== "netgrid-guided-setup-contract-v1" ||
    JSON.stringify(setupContract.setupModes) !==
      JSON.stringify(["recommended", "custom"]) ||
    setupContract.defaultSetupMode !== "recommended" ||
    JSON.stringify(setupContract.deploymentProfiles) !==
      JSON.stringify(["local", "private_lan"]) ||
    setupContract.defaultDeploymentProfile !== "local" ||
    JSON.stringify(setupContract.retentionValues) !==
      JSON.stringify(["7", "30", "90", "180", "365", "never"]) ||
    setupContract.defaultRetention !== "30" ||
    JSON.stringify(setupContract.accountAccessModes) !==
      JSON.stringify(["simple", "protected"]) ||
    setupContract.defaultAccountAccessMode !== "simple" ||
    setupContract.desktopShortcutDefault !== true ||
    setupContract.launchAfterInstallDefault !== true ||
    JSON.stringify(setupContract.firewallProfiles) !==
      JSON.stringify(["private"]) ||
    setupContract.publicFirewallProfileEnabled !== false ||
    setupContract.updateChannel !== "github-releases-only" ||
    JSON.stringify(setupContract.updateCommands) !==
      JSON.stringify(["install-update", "uninstall-update"]) ||
    setupContract.uninstall?.defaultMode !== "retain-data" ||
    setupContract.uninstall?.explicitMode !== "delete-data" ||
    setupContract.uninstall?.localizedConfirmation !== true ||
    setupContract.installerRollback !== "msi-major-upgrade"
  )
    throw new Error("installer_guided_setup_contract_invalid");
  const localizationPath = path.join(scratch, "localization.json");
  run(setupPath, ["--audit-localization", localizationPath]);
  const localization = JSON.parse(readFileSync(localizationPath, "utf8"));
  if (
    localization.schemaVersion !== "netgrid-windows-ui-localization-v1" ||
    JSON.stringify(localization.languages) !==
      JSON.stringify(["de", "en", "fr"]) ||
    localization.fallbackLanguage !== "en" ||
    localization.complete !== true ||
    localization.keyCount < 80
  )
    throw new Error("installer_localization_contract_invalid");
  await checkPortConflict(setupPath);
  process.stdout.write(
    `WINDOWS_INSTALLER_CHECK_OK files=${installedFiles.length} msi=${msiPath} setup=${setupPath}\n`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

function requiredPath(name) {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? undefined : process.argv[index + 1];
  if (!value) throw new Error(`installer_argument_missing:${name}`);
  return path.resolve(value);
}

function assertFile(file, code) {
  if (!existsSync(file) || !statSync(file).isFile()) throw new Error(code);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `installer_command_failed:${command}:${result.status}:${result.stderr.trim()}`,
    );
  return result;
}

function collectFiles(root) {
  const result = [];
  visit(root);
  return result;
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (entry.isFile()) result.push(target);
    }
  }
}

function findFiles(root, name) {
  return collectFiles(root).filter(
    (file) => path.basename(file).toLowerCase() === name.toLowerCase(),
  );
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function slash(value) {
  return value.replaceAll(path.sep, "/");
}

async function checkPortConflict(setup) {
  const busy = createServer();
  const free = createServer();
  await Promise.all([
    new Promise((resolve, reject) =>
      busy.once("error", reject).listen(0, "127.0.0.1", resolve),
    ),
    new Promise((resolve, reject) =>
      free.once("error", reject).listen(0, "127.0.0.1", resolve),
    ),
  ]);
  const busyPort = busy.address().port;
  const freePort = free.address().port;
  free.close();
  try {
    const result = spawnSync(
      setup,
      ["--probe-ports", "local", String(busyPort), String(freePort)],
      { encoding: "utf8", windowsHide: true },
    );
    if (result.error) throw result.error;
    if (result.status !== 2)
      throw new Error(`installer_setup_port_conflict_missed:${result.status}`);
  } finally {
    busy.close();
  }
}
