import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";
import { generateReleaseCardSpecImportIndex } from "./generate-card-spec-import-index.mjs";

const scriptsRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptsRoot, "..");
const outputBase = path.join(repositoryRoot, "output");
const outputArgument = optionValue("--output");
const outputRoot = path.resolve(
  repositoryRoot,
  outputArgument ?? "output/windows-release",
);
assertSafeOutputRoot(outputRoot);

const temporaryRoot = path.join(outputBase, ".windows-release-build");
const webRoot = path.join(repositoryRoot, "apps", "web");
const webDistName = ".next-release";
const webDist = path.join(webRoot, webDistName);
const releaseCardIndex = path.join(temporaryRoot, "card-spec-release-index.ts");
const releaseDeckFixtures = path.join(
  repositoryRoot,
  "packages",
  "runtime-data",
  "src",
  "release-deck-fixtures.ts",
);

try {
  rmSync(outputRoot, { recursive: true, force: true });
  rmSync(temporaryRoot, { recursive: true, force: true });
  rmSync(webDist, { recursive: true, force: true });
  mkdirSync(temporaryRoot, { recursive: true });
  mkdirSync(outputRoot, { recursive: true });

  const releaseIndexSource = await generateReleaseCardSpecImportIndex(
    repositoryRoot,
    slash(path.relative(repositoryRoot, releaseCardIndex)),
  );
  writeFileSync(releaseCardIndex, releaseIndexSource, "utf8");

  runCorepack(
    ["pnpm", "--filter", "@netgrid/web", "exec", "next", "build", "--webpack"],
    {
      ...process.env,
      NETGRID_RUNTIME_PROFILE: "release",
      NETGRID_RELEASE_BUILD: "true",
      NETGRID_RELEASE_CARD_INDEX: releaseCardIndex,
      NETGRID_NEXT_DIST_DIR: webDistName,
      NEXT_PUBLIC_NETGRID_SERVER_URL:
        process.env.NEXT_PUBLIC_NETGRID_SERVER_URL ?? "http://127.0.0.1:8787",
    },
  );

  const standaloneRoot = path.join(webDist, "standalone");
  if (!existsSync(path.join(standaloneRoot, "apps", "web", "server.js")))
    throw new Error("next_standalone_server_missing");
  const applicationRoot = path.join(outputRoot, "app");
  cpSync(standaloneRoot, applicationRoot, { recursive: true });
  rmSync(path.join(applicationRoot, "packages"), {
    recursive: true,
    force: true,
  });
  writeFileSync(
    path.join(applicationRoot, "package.json"),
    `${JSON.stringify(
      {
        name: "netgrid-product-runtime",
        private: true,
        type: "module",
        engines: { node: ">=24 <25" },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  copyIfPresent(
    path.join(webRoot, "public"),
    path.join(applicationRoot, "apps", "web", "public"),
  );
  copyIfPresent(
    path.join(webDist, "static"),
    path.join(applicationRoot, "apps", "web", webDistName, "static"),
  );
  materializeNextRuntimeDependencies(applicationRoot);

  const serverResult = await build({
    entryPoints: [path.join(repositoryRoot, "apps/server/src/index.ts")],
    outfile: path.join(applicationRoot, "server.mjs"),
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node24",
    banner: {
      js: 'import { createRequire as __netgridCreateRequire } from "node:module"; const require = __netgridCreateRequire(import.meta.url);',
    },
    treeShaking: true,
    metafile: true,
    external: ["sharp"],
    alias: {
      "@netgrid/runtime-data/deck-format-profiles": releaseDeckFixtures,
      "@netgrid/runtime-data/legacy-demo-decks": releaseDeckFixtures,
    },
    plugins: [releaseCardIndexPlugin()],
  });
  const serverSource = readFileSync(
    path.join(applicationRoot, "server.mjs"),
    "utf8",
  );
  for (const forbidden of [
    "packages/cards/src/specs/testset",
    "demo_runner_008_snapshot_v0_8",
  ])
    if (serverSource.includes(forbidden))
      throw new Error(
        `release_server_contains_development_content:${forbidden}`,
      );

  copySharpWindowsRuntime(applicationRoot);
  if (!existsSync(path.join(applicationRoot, "node_modules", "sharp")))
    throw new Error("release_sharp_runtime_missing");

  mkdirSync(path.join(outputRoot, "config"), { recursive: true });
  cpSync(
    path.join(repositoryRoot, "config", "windows-release.env.example"),
    path.join(outputRoot, "config", "runtime.env.example"),
  );
  writeFileSync(
    path.join(outputRoot, "product-layout.json"),
    `${JSON.stringify(
      {
        schemaVersion: "netgrid-product-layout-v1",
        platform: "windows-x64",
        runtime: { node: ">=24 <25" },
        entrypoints: {
          web: "app/apps/web/server.js",
          server: "app/server.mjs",
        },
        defaultPorts: { web: 3100, server: 8787 },
        locales: ["de", "en", "fr"],
        mutableDataLocation: "external:NETGRID_DATA_ROOT",
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  writeProductManifest(outputRoot);
  writeFileSync(
    path.join(temporaryRoot, "server-metafile.json"),
    `${JSON.stringify(serverResult.metafile, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(`WINDOWS_RELEASE_OUTPUT_OK ${outputRoot}\n`);
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
  rmSync(webDist, { recursive: true, force: true });
}

function releaseCardIndexPlugin() {
  return {
    name: "netgrid-release-card-index",
    setup(buildContext) {
      buildContext.onResolve({ filter: /card-spec-import-index$/ }, (args) =>
        args.importer.endsWith("registry-runtime.ts")
          ? { path: releaseCardIndex }
          : undefined,
      );
    },
  };
}

function runCorepack(arguments_, env) {
  const corepackEntrypoint = path.join(
    path.dirname(process.execPath),
    "node_modules",
    "corepack",
    "dist",
    "corepack.js",
  );
  const result = spawnSync(
    process.execPath,
    [corepackEntrypoint, ...arguments_],
    {
      cwd: repositoryRoot,
      env,
      stdio: "inherit",
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`release_build_command_failed:${result.status}`);
}

function copyIfPresent(source, target) {
  if (existsSync(source)) cpSync(source, target, { recursive: true });
}

function copySharpWindowsRuntime(applicationRoot) {
  const sharpSource = realpathSync(
    path.join(
      repositoryRoot,
      "packages",
      "card-images",
      "node_modules",
      "sharp",
    ),
  );
  const dependencyRoot = path.dirname(sharpSource);
  const targets = [
    [sharpSource, path.join(applicationRoot, "node_modules", "sharp")],
    [
      path.join(dependencyRoot, "detect-libc"),
      path.join(applicationRoot, "node_modules", "detect-libc"),
    ],
    [
      path.join(dependencyRoot, "semver"),
      path.join(applicationRoot, "node_modules", "semver"),
    ],
    [
      path.join(dependencyRoot, "@img", "colour"),
      path.join(applicationRoot, "node_modules", "@img", "colour"),
    ],
    [
      path.join(dependencyRoot, "@img", "sharp-win32-x64"),
      path.join(applicationRoot, "node_modules", "@img", "sharp-win32-x64"),
    ],
  ];
  for (const [source, target] of targets) {
    if (!existsSync(source))
      throw new Error(`release_sharp_dependency_missing:${source}`);
    cpSync(source, target, { recursive: true, dereference: true });
  }
}

function materializeNextRuntimeDependencies(applicationRoot) {
  const nextSource = realpathSync(
    path.join(repositoryRoot, "apps", "web", "node_modules", "next"),
  );
  const nextPackage = JSON.parse(
    readFileSync(path.join(nextSource, "package.json"), "utf8"),
  );
  const targetNodeModules = path.join(
    applicationRoot,
    "apps",
    "web",
    "node_modules",
  );
  const visited = new Set();
  for (const dependencyName of Object.keys(nextPackage.dependencies ?? {}))
    materializePackageDependency(
      nextSource,
      dependencyName,
      targetNodeModules,
      visited,
    );
  const webPackage = JSON.parse(
    readFileSync(path.join(webRoot, "package.json"), "utf8"),
  );
  for (const dependencyName of Object.keys(webPackage.dependencies ?? {})) {
    if (dependencyName === "next" || dependencyName.startsWith("@netgrid/"))
      continue;
    materializePackageDependency(
      webRoot,
      dependencyName,
      targetNodeModules,
      visited,
    );
  }
}

function materializePackageDependency(
  requiringPackageRoot,
  dependencyName,
  targetNodeModules,
  visited,
) {
  const sourceCandidate = path.join(
    path.dirname(requiringPackageRoot),
    ...dependencyName.split("/"),
  );
  let source;
  if (existsSync(sourceCandidate)) source = realpathSync(sourceCandidate);
  else {
    const requireFromPackage = createRequire(
      path.join(requiringPackageRoot, "package.json"),
    );
    let resolvedEntry;
    try {
      resolvedEntry = requireFromPackage.resolve(dependencyName);
    } catch (error) {
      throw new Error(
        `release_next_dependency_missing:${dependencyName}:${requiringPackageRoot}`,
        { cause: error },
      );
    }
    source = packageRootFor(resolvedEntry, dependencyName);
  }
  const target = path.join(targetNodeModules, ...dependencyName.split("/"));
  const visitKey = `${source}\0${target}`;
  if (visited.has(visitKey)) return;
  visited.add(visitKey);
  cpSync(source, target, { recursive: true, dereference: true });

  const packageMetadataPath = path.join(source, "package.json");
  if (!existsSync(packageMetadataPath)) return;
  const packageMetadata = JSON.parse(readFileSync(packageMetadataPath, "utf8"));
  const nestedTargetNodeModules = path.join(target, "node_modules");
  for (const nestedDependencyName of Object.keys(
    packageMetadata.dependencies ?? {},
  ))
    materializePackageDependency(
      source,
      nestedDependencyName,
      nestedTargetNodeModules,
      visited,
    );
}

function packageRootFor(resolvedEntry, expectedName) {
  let current = path.dirname(realpathSync(resolvedEntry));
  while (true) {
    const metadataPath = path.join(current, "package.json");
    if (existsSync(metadataPath)) {
      const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
      if (metadata.name === expectedName) return current;
    }
    const parent = path.dirname(current);
    if (parent === current)
      throw new Error(`release_next_package_root_missing:${expectedName}`);
    current = parent;
  }
}

function writeProductManifest(root) {
  const manifestPath = path.join(root, "product-manifest.json");
  const files = collectFiles(root)
    .filter((file) => file !== manifestPath)
    .map((file) => {
      const content = readFileSync(file);
      return {
        path: slash(path.relative(root, file)),
        bytes: content.byteLength,
        sha256: createHash("sha256").update(content).digest("hex"),
      };
    });
  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        schemaVersion: "netgrid-product-manifest-v1",
        hashAlgorithm: "sha256",
        files,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(target) : [target];
    });
}

function optionValue(name) {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--"))
    throw new Error(`missing_option_value:${name}`);
  return value;
}

function assertSafeOutputRoot(candidate) {
  if (
    candidate === outputBase ||
    !candidate.startsWith(`${outputBase}${path.sep}`)
  )
    throw new Error("release_output_must_be_below_repository_output");
}

function slash(value) {
  return value.replaceAll(path.sep, "/");
}
