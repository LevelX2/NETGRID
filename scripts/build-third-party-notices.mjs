import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const releaseRoot = path.resolve(
  optionValue("--release") ?? "output/windows-release",
);
const outputPath = path.resolve(
  optionValue("--output") ??
    "output/windows-installer-input/legal/THIRD-PARTY-NOTICES.txt",
);
const manifest = JSON.parse(
  readFileSync(path.join(releaseRoot, "product-manifest.json"), "utf8"),
);
const packages = new Map();

for (const entry of manifest.files ?? []) {
  if (
    !entry.path.includes("/node_modules/") ||
    !entry.path.endsWith("/package.json")
  )
    continue;
  let metadata;
  try {
    metadata = JSON.parse(
      readFileSync(path.join(releaseRoot, ...entry.path.split("/")), "utf8"),
    );
  } catch {
    throw new Error(`third_party_package_metadata_invalid:${entry.path}`);
  }
  if (typeof metadata.name !== "string" || typeof metadata.version !== "string")
    continue;
  const license = normalizedLicense(metadata.license);
  if (!license)
    throw new Error(
      `third_party_license_missing:${metadata.name}@${metadata.version}`,
    );
  packages.set(`${metadata.name}@${metadata.version}`, {
    name: metadata.name,
    version: metadata.version,
    license,
  });
}

const identity = JSON.parse(
  readFileSync(path.join(releaseRoot, "product-layout.json"), "utf8"),
).product;
const lines = [
  "NETGRID THIRD-PARTY NOTICES",
  "",
  `Product build: ${identity?.installerVersion ?? "unknown"}`,
  "",
  "The following runtime packages are included in the audited product output.",
  "Associated license and copyright files remain alongside their packages.",
  "",
  ...[...packages.values()]
    .sort((left, right) =>
      `${left.name}@${left.version}`.localeCompare(
        `${right.name}@${right.version}`,
      ),
    )
    .map((entry) => `${entry.name}@${entry.version} — ${entry.license}`),
  "",
];
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, lines.join("\n"), "utf8");
process.stdout.write(
  `WINDOWS_THIRD_PARTY_NOTICES_OK packages=${packages.size} output=${outputPath}\n`,
);

function normalizedLicense(value) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && typeof value.type === "string")
    return value.type.trim();
  return "";
}

function optionValue(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}
