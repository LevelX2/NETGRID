#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const productionExtensions = new Set([".ts", ".tsx", ".js", ".mjs"]);
const roots = ["packages", "apps/server/src", "apps/web"];
const packageRules = [
  { prefix: "packages/shared/", allow: new Set() },
  { prefix: "packages/catalog/", allow: new Set(["@netgrid/shared"]) },
  {
    prefix: "packages/decks/",
    allow: new Set(["@netgrid/catalog", "@netgrid/shared"]),
  },
  { prefix: "packages/engine/", allow: new Set(["@netgrid/shared"]) },
  {
    prefix: "packages/ai/",
    allow: new Set([
      "@netgrid/catalog",
      "@netgrid/decks",
      "@netgrid/engine",
      "@netgrid/shared",
    ]),
  },
];

if (process.argv.includes("--self-test")) runSelfTest();
else runRepositoryCheck();

function runRepositoryCheck() {
  const files = execFileSync("git", ["ls-files", ...roots], {
    cwd: root,
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((file) => existsSync(resolve(root, file)))
    .filter((file) => productionExtensions.has(extname(file)))
    .filter((file) => !/\.(test|spec)\.[^.]+$/.test(file));

  const findings = files.flatMap((file) =>
    boundaryFindings(file, readFileSync(resolve(root, file), "utf8")),
  );

  if (findings.length > 0) {
    console.error("PACKAGE_BOUNDARIES FAIL");
    for (const finding of findings) console.error(`- ${finding}`);
    process.exitCode = 1;
  } else console.log(`PACKAGE_BOUNDARIES OK files=${files.length}`);
}

function boundaryFindings(file, source) {
  const imports = importedPackages(source);
  const findings = [];
  const rule = packageRules.find((candidate) =>
    file.startsWith(candidate.prefix),
  );
  if (rule) {
    for (const imported of imports) {
      if (imported.startsWith("@netgrid/") && !rule.allow.has(imported))
        findings.push(
          `${file}: ${imported} ist in dieser Paketschicht nicht erlaubt`,
        );
    }
  }
  if (isNormalWebClientModule(file)) {
    for (const imported of imports) {
      if (imported === "@netgrid/engine" || imported === "@netgrid/ai")
        findings.push(
          `${file}: normaler Webclient darf ${imported} nicht direkt laden`,
        );
    }
  }
  return findings;
}

function runSelfTest() {
  const cases = [
    {
      file: "packages/shared/src/invalid.ts",
      source: 'import { applyAction } from "@netgrid/engine";',
      violationCount: 1,
    },
    {
      file: "packages/ai/src/valid.ts",
      source: 'import { applyAction } from "@netgrid/engine";',
      violationCount: 0,
    },
    {
      file: "apps/web/features/game/invalid.tsx",
      source: 'import { applyAction } from "@netgrid/engine";',
      violationCount: 1,
    },
    {
      file: "apps/web/app/api/current/route.ts",
      source: 'import { applyAction } from "@netgrid/engine";',
      violationCount: 0,
    },
  ];
  const failures = cases.filter(
    (testCase) =>
      boundaryFindings(testCase.file, testCase.source).length !==
      testCase.violationCount,
  );
  if (failures.length > 0) {
    console.error("PACKAGE_BOUNDARIES SELFTEST FAIL");
    for (const failure of failures) console.error(`- ${failure.file}`);
    process.exitCode = 1;
  } else console.log(`PACKAGE_BOUNDARIES SELFTEST OK cases=${cases.length}`);
}

function importedPackages(source) {
  const packages = new Set();
  const pattern = /(?:from\s+|import\s*\()(["'])(?<specifier>[^"']+)\1/g;
  let match = pattern.exec(source);
  while (match) {
    const specifier = match.groups?.specifier;
    if (specifier?.startsWith("@netgrid/")) {
      const [scope, name] = specifier.split("/");
      packages.add(`${scope}/${name}`);
    }
    match = pattern.exec(source);
  }
  return packages;
}

function isNormalWebClientModule(file) {
  if (!file.startsWith("apps/web/")) return false;
  if (file.startsWith("apps/web/app/api/")) return false;
  if (
    file === "apps/web/app/tutorial.ts" ||
    file === "apps/web/app/tutorial/page.tsx"
  )
    return false;
  return (
    file === "apps/web/app/page.tsx" || file.startsWith("apps/web/features/")
  );
}
