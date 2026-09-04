import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
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
  ]);
  const authoring = readFileSync(decompiledPath, "utf8");
  if (
    !authoring.includes('UpgradeCode="{D8271ACB-E70F-4CD5-9832-DEFE6A052B9F}"')
  )
    throw new Error("installer_upgrade_code_invalid");
  if (
    !authoring.includes(`Version="${productLayout.product.installerVersion}"`)
  )
    throw new Error("installer_product_version_invalid");
  if (
    !authoring.includes(
      '<CustomAction Id="InitializeNetgridRuntime" HideTarget="yes" Impersonate="no" Execute="deferred"',
    ) ||
    !authoring.includes(
      '<Custom Action="InitializeNetgridRuntime" Condition="NOT REMOVE~=&quot;ALL&quot;"',
    ) ||
    !authoring.includes('<Property Id="NETGRID_DATA_ROOT" Secure="yes" />') ||
    !authoring.includes(
      '<Property Id="INSTALLDESKTOPSHORTCUT" Value="1" Secure="yes" />',
    ) ||
    !authoring.includes('Condition="INSTALLDESKTOPSHORTCUT = 1"') ||
    !authoring.includes('Name="NETGRID Maintenance"') ||
    !authoring.includes('Arguments="--open-maintenance"')
  )
    throw new Error("installer_runtime_initialization_contract_invalid");

  const bundleRoot = path.join(scratch, "bundle");
  run(dotnetPath, [
    "tool",
    "run",
    "wix",
    "--",
    "burn",
    "extract",
    "-acceptEula",
    "wix7",
    setupPath,
    "-o",
    bundleRoot,
  ]);
  // Burn assigns opaque container names (for example `a0`) to extracted
  // payloads, so bind the embedded MSI by its exact release hash.
  const expectedMsiHash = sha256(msiPath);
  const embeddedMsi = collectFiles(bundleRoot).filter(
    (file) => sha256(file) === expectedMsiHash,
  );
  if (embeddedMsi.length !== 1)
    throw new Error("installer_bundle_msi_mismatch");
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
