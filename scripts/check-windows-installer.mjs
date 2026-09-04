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
  for (const [relative, metadata] of expected) {
    const installed = path.join(installedProductRoot, ...relative.split("/"));
    assertFile(installed, `installer_payload_missing:${relative}`);
    if (
      statSync(installed).size !== metadata.bytes ||
      sha256(installed) !== metadata.sha256
    )
      throw new Error(`installer_payload_mismatch:${relative}`);
  }
  const allowedExtras = new Set([
    "legal/NETGRID-LICENSE.txt",
    "legal/THIRD-PARTY-NOTICES.txt",
  ]);
  const installedFiles = collectFiles(installedProductRoot).map((file) =>
    slash(path.relative(installedProductRoot, file)),
  );
  for (const relative of installedFiles)
    if (!expected.has(relative) && !allowedExtras.has(relative))
      throw new Error(`installer_payload_unexpected:${relative}`);
  for (const relative of allowedExtras)
    assertFile(
      path.join(installedProductRoot, ...relative.split("/")),
      `installer_legal_payload_missing:${relative}`,
    );

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
