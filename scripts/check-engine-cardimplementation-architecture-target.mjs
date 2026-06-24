#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const scannedRoots = [
  "packages/engine/src/ability-engine",
  "packages/engine/src/game",
  "packages/engine/src/mechanics",
  "packages/engine/src/card-implementations",
  "packages/shared/src",
];

const productionExtensions = new Set([".ts", ".mts", ".mjs"]);
const maxFindingsPerCheck = 30;

const checks = [];

function toRepoPath(path) {
  return relative(repoRoot, path).split(sep).join("/");
}

function readRepoFile(path) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

function listFiles(root) {
  const start = resolve(repoRoot, root);
  const result = [];
  function visit(directory) {
    for (const entry of readdirSync(directory)) {
      const absolute = resolve(directory, entry);
      const stats = statSync(absolute);
      if (stats.isDirectory()) {
        if (
          entry === "node_modules" ||
          entry === "dist" ||
          entry === "coverage" ||
          entry === ".next"
        ) {
          continue;
        }
        visit(absolute);
      } else if (productionExtensions.has(extname(entry))) {
        result.push(toRepoPath(absolute));
      }
    }
  }
  visit(start);
  return result;
}

const sourceFiles = scannedRoots.flatMap(listFiles).sort();
const cardNameProblemCategories = new Set([
  "functional_kind_uses_card_name",
  "runtime_state_field_uses_card_name",
  "payload_key_uses_card_name",
  "resolver_function_uses_card_name",
  "mechanics_constant_controls_behavior_by_card_id",
  "new_unclassified_card_name_leak",
]);
const functionalCardNameFiles = new Set([
  "packages/engine/src/ability-engine/definition-types.ts",
  "packages/shared/src/index.ts",
]);

function lineNumber(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function addCheck(name, findings) {
  checks.push({ name, findings });
}

function snippet(text, index) {
  const line = text.slice(index).split(/\r?\n/, 1)[0] ?? "";
  return line.trim().slice(0, 180);
}

function pushFinding(findings, file, line, message, detail) {
  findings.push({ file, line, message, detail });
}

function isTestOrFixture(file) {
  return (
    file.includes(".test.") ||
    file.includes(".spec.") ||
    file.includes("/__tests__/") ||
    file.includes("/test-fixtures/") ||
    file.endsWith(".d.ts")
  );
}

function isCatalogOrCardImplementationContext(file) {
  return (
    file === "packages/shared/src/index.ts" ||
    file.startsWith("packages/engine/src/card-implementations/onr-v1/") ||
    file.startsWith("packages/engine/src/card-implementations/proteus/") ||
    file.startsWith("packages/engine/src/card-implementations/subregistries/") ||
    file === "packages/engine/src/card-implementations/registry.ts" ||
    file.endsWith("/coverage.ts") ||
    file.endsWith("/types.ts") ||
    file.endsWith("/helpers.ts")
  );
}

function isCardCatalogPath(file) {
  return file.startsWith("packages/engine/src/card-implementations/");
}

function isCommentOnly(line) {
  const trimmed = line.trim();
  return trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");
}

function lineText(text, line) {
  return text.split(/\r?\n/)[line - 1]?.trim() ?? "";
}

function wordsFor(value) {
  return value
    .replace(/['']/g, "")
    .replace(/&/g, " and ")
    .split(/[^A-Za-z0-9]+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function camelCase(words) {
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      return index === 0
        ? lower
        : `${lower[0].toUpperCase()}${lower.slice(1)}`;
    })
    .join("");
}

function upperFirst(value) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

function meaningfulToken(token) {
  if (token.length < 5) return false;
  if (/^\d+$/.test(token)) return false;
  return !new Set([
    "action",
    "agenda",
    "asset",
    "card",
    "cards",
    "corp",
    "damage",
    "event",
    "fort",
    "grant",
    "install",
    "node",
    "program",
    "runner",
    "score",
    "server",
    "trace",
    "upgrade",
  ]).has(token.toLowerCase());
}

function variantsForWords(words) {
  const variants = new Set();
  const lowerWords = words.map((word) => word.toLowerCase());
  if (lowerWords.length < 2) return variants;
  variants.add(lowerWords.join("_"));
  variants.add(lowerWords.join("-"));
  const camel = camelCase(words);
  variants.add(camel);
  variants.add(upperFirst(camel));
  if (lowerWords[0] === "the" && words.length > 1) {
    for (const value of variantsForWords(words.slice(1))) variants.add(value);
  }
  return variants;
}

function definitionSlugForId(id) {
  return id.replace(/^onr_(?:v1|proteus)_\d+_/, "");
}

function deriveCardNameTokens() {
  const sharedIndex = readRepoFile("packages/shared/src/index.ts");
  const cards = [];
  const pattern =
    /id:\s*"(?<id>onr_(?:v1|proteus)_\d+_[^"]+)",\s*\r?\n\s*title:\s*"(?<title>[^"]+)"/g;
  let match = pattern.exec(sharedIndex);
  while (match) {
    cards.push({ id: match.groups.id, title: match.groups.title });
    match = pattern.exec(sharedIndex);
  }

  const tokens = new Map();
  for (const card of cards) {
    const variants = new Set([
      ...variantsForWords(wordsFor(card.title)),
      ...variantsForWords(wordsFor(definitionSlugForId(card.id))),
    ]);
    for (const token of variants) {
      if (!meaningfulToken(token) || tokens.has(token)) continue;
      tokens.set(token, { token, cardId: card.id, title: card.title });
    }
  }
  return [...tokens.values()].sort((a, b) => a.token.localeCompare(b.token));
}

function isDerivedAllowedCardNameContext(file, line) {
  if (isTestOrFixture(file)) return true;
  if (isCatalogOrCardImplementationContext(file)) return true;
  if (isCommentOnly(line)) return true;
  if (line.includes("cardDefinitionId")) return true;
  if (line.includes("card-implementations/")) return true;
  if (line.includes("Implementation.")) return true;
  if (file === "packages/shared/src/index.ts") {
    return (
      line.includes("id:") ||
      line.includes("title:") ||
      line.includes("text:") ||
      line.includes("flavorText:") ||
      line.includes("mechanics:")
    );
  }
  return false;
}

function classifyCardNameOccurrence({ file, token, line }) {
  if (isTestOrFixture(file)) return "test_only_card_name";
  if (file === "packages/engine/src/card-implementations/registry.ts") {
    return "allowed_catalog_reference";
  }
  if (isCardCatalogPath(file)) {
    if (line.includes("cardDefinitionId") || isCommentOnly(line)) {
      return "allowed_catalog_reference";
    }
    return line.includes("kind:")
      ? "functional_kind_uses_card_name"
      : "allowed_catalog_reference";
  }
  if (line.includes("kind:")) return "functional_kind_uses_card_name";
  if (line.includes("runnerUtilityAbility") || line.includes("corpAbility")) {
    return "payload_key_uses_card_name";
  }
  if (line.match(/\bfunction\s+resolve[A-Z]/) || line.match(/\bconst\s+resolve[A-Z]/)) {
    return "resolver_function_uses_card_name";
  }
  if (
    functionalCardNameFiles.has(file) &&
    (line.includes("?:") || line.includes(": {") || line.includes("= {"))
  ) {
    return "runtime_state_field_uses_card_name";
  }
  if (token === token.toUpperCase() && line.includes(token)) {
    return "mechanics_constant_controls_behavior_by_card_id";
  }
  if (file.includes("/game/") || file.includes("/mechanics/")) {
    return "runtime_state_field_uses_card_name";
  }
  return "new_unclassified_card_name_leak";
}

function checkCardSpecificRuntimeLeaks() {
  const tokens = deriveCardNameTokens();
  const findings = [];
  for (const file of sourceFiles) {
    if (file === "scripts/check-engine-cardimplementation-architecture-target.mjs") continue;
    const text = readRepoFile(file);
    for (const tokenInfo of tokens) {
      let index = text.indexOf(tokenInfo.token);
      while (index >= 0) {
        const line = lineNumber(text, index);
        const lineSnippet = lineText(text, line);
        if (isDerivedAllowedCardNameContext(file, lineSnippet)) {
          index = text.indexOf(tokenInfo.token, index + tokenInfo.token.length);
          continue;
        }
        const category = classifyCardNameOccurrence({
          file,
          token: tokenInfo.token,
          line: lineSnippet,
        });
        if (!cardNameProblemCategories.has(category)) {
          index = text.indexOf(tokenInfo.token, index + tokenInfo.token.length);
          continue;
        }
        pushFinding(
          findings,
          file,
          line,
          category,
          `${tokenInfo.token} (${tokenInfo.cardId}, ${tokenInfo.title}) :: ${lineSnippet}`,
        );
        index = text.indexOf(tokenInfo.token, index + tokenInfo.token.length);
      }
    }
  }
  addCheck("card-specific productive runtime leaks", findings);
}

function checkRuntimeEscapeHatches() {
  const findings = [];
  const patterns = [
    {
      name: "RuntimeDeps Record escape hatch",
      regex: /RuntimeDeps[^=\n]*=\s*[\s\S]{0,120}?Record<string,\s*unknown>/g,
    },
    {
      name: "Record<string, any>",
      regex: /Record<string,\s*any>/g,
    },
    {
      name: "generic RuntimeFunction any signature",
      regex: /RuntimeFunction\s*=\s*\([^)]*any\[\][^)]*\)\s*=>\s*any/g,
    },
    {
      name: "runtimeBinding property bag",
      regex: /\bruntimeBinding\b/g,
    },
    {
      name: "broad as any cast",
      regex: /\bas\s+any\b/g,
    },
  ];

  for (const file of sourceFiles) {
    if (
      isTestOrFixture(file) ||
      (!file.startsWith("packages/engine/src/game/engine-runtime-internal/") &&
        !file.startsWith("packages/engine/src/game/card-implementation/"))
    ) {
      continue;
    }
    const text = readRepoFile(file);
    for (const pattern of patterns) {
      let match = pattern.regex.exec(text);
      while (match) {
        pushFinding(
          findings,
          file,
          lineNumber(text, match.index),
          pattern.name,
          snippet(text, match.index),
        );
        match = pattern.regex.exec(text);
      }
    }
  }
  addCheck("runtime escape hatches removed", findings);
}

function effectImplementationTypeNames() {
  const text = readRepoFile("packages/engine/src/ability-engine/definition-types.ts");
  const union = /export type CardEffectImplementation =(?<body>[\s\S]*?);/m.exec(
    text,
  )?.groups?.body;
  if (!union) return [];
  return [...union.matchAll(/\|\s*(?<name>[A-Za-z0-9]+EffectImplementation)\b/g)]
    .map((match) => match.groups.name)
    .sort();
}

function effectKindsByTypeName() {
  const text = readRepoFile("packages/engine/src/ability-engine/definition-types.ts");
  const kindsByTypeName = new Map();
  for (const typeName of effectImplementationTypeNames()) {
    const typePattern = new RegExp(
      `export type ${typeName} =(?<body>[\\s\\S]*?);\\r?\\n`,
      "m",
    );
    const body = typePattern.exec(text)?.groups?.body;
    if (!body) continue;
    const kind = /kind:\s*"(?<kind>[^"]+)"/.exec(body)?.groups?.kind;
    if (kind) kindsByTypeName.set(typeName, kind);
  }
  return kindsByTypeName;
}

function checkEffectInterpreterDispatch() {
  const findings = [];
  const interpreterPath = "packages/engine/src/ability-engine/effect-interpreter.ts";
  const interpreter = readRepoFile(interpreterPath);
  for (const regex of [/switch\s*\(\s*effect\.kind\s*\)/g, /\bcase\s+"[^"]+"/g]) {
    let match = regex.exec(interpreter);
    while (match) {
      pushFinding(
        findings,
        interpreterPath,
        lineNumber(interpreter, match.index),
        "effect interpreter still contains concrete kind dispatch",
        snippet(interpreter, match.index),
      );
      match = regex.exec(interpreter);
    }
  }

  const familyFiles = sourceFiles.filter((file) =>
    file.startsWith("packages/engine/src/ability-engine/effect-families/"),
  );
  const familyText = familyFiles.map(readRepoFile).join("\n");
  const kinds = effectKindsByTypeName();
  for (const [typeName, kind] of kinds) {
    if (!new RegExp(`["']${kind}["']`).test(familyText)) {
      pushFinding(
        findings,
        "packages/engine/src/ability-engine/definition-types.ts",
        1,
        "CardEffect kind is not covered by an effect family module",
        `${kind} (${typeName})`,
      );
    }
  }
  addCheck("effect interpreter family dispatch target", findings);
}

function checkRegistryIndirection() {
  const findings = [];
  const registryPath = "packages/engine/src/card-implementations/registry.ts";
  const registry = readRepoFile(registryPath);
  const directImportPattern = /from\s+["']\.\/(?:onr-v1|proteus)\//g;
  let match = directImportPattern.exec(registry);
  while (match) {
    pushFinding(
      findings,
      registryPath,
      lineNumber(registry, match.index),
      "registry imports card implementation families directly",
      snippet(registry, match.index),
    );
    match = directImportPattern.exec(registry);
  }
  addCheck("registry uses subregistries only", findings);
}

function checkMechanicsCardIdBehavior() {
  const findings = [];
  const behaviorScopes = sourceFiles.filter(
    (file) =>
      !isTestOrFixture(file) &&
      (file.startsWith("packages/engine/src/mechanics/") ||
        file.startsWith("packages/engine/src/game/") ||
        file.startsWith("packages/shared/src/")) &&
      !isCatalogOrCardImplementationContext(file),
  );

  const patterns = [
    {
      name: "card-id set or constant controls behavior",
      regex: /\b[A-Z][A-Z0-9_]*_CARD_IDS?\b|\bnew Set<[^>]*CardDefinitionId[^>]*>\s*\(/g,
    },
    {
      name: "direct ONR/Proteus card id branch in runtime mechanics",
      regex: /["']onr_(?:v1|proteus)_\d+_[^"']+["']/g,
    },
  ];

  for (const file of behaviorScopes) {
    const text = readRepoFile(file);
    for (const pattern of patterns) {
      let match = pattern.regex.exec(text);
      while (match) {
        pushFinding(
          findings,
          file,
          lineNumber(text, match.index),
          pattern.name,
          snippet(text, match.index),
        );
        match = pattern.regex.exec(text);
      }
    }
  }
  addCheck("mechanics avoid card-id behavior branches", findings);
}

function checkReplacementMonoliths() {
  const findings = [];
  const productionRuntimeFiles = sourceFiles.filter(
    (file) =>
      !isTestOrFixture(file) &&
      (file.startsWith("packages/engine/src/game/card-implementation/") ||
        file.startsWith("packages/engine/src/ability-engine/")) &&
      !file.endsWith("definition-types.ts"),
  );

  for (const file of productionRuntimeFiles) {
    const lines = readRepoFile(file).split(/\r?\n/).length;
    const threshold = file.endsWith("effect-interpreter.ts") ? 240 : 420;
    if (lines > threshold) {
      pushFinding(
        findings,
        file,
        1,
        "module exceeds target size guard",
        `${lines} lines > ${threshold}`,
      );
    }
  }
  addCheck("no replacement monoliths", findings);
}

checkCardSpecificRuntimeLeaks();
checkRuntimeEscapeHatches();
checkEffectInterpreterDispatch();
checkRegistryIndirection();
checkMechanicsCardIdBehavior();
checkReplacementMonoliths();

const failingChecks = checks.filter((check) => check.findings.length > 0);
const summary = Object.fromEntries(
  checks.map((check) => [check.name, check.findings.length]),
);

console.log("NETGRID Engine CardImplementation Architecture Target Check");
console.log(JSON.stringify(summary, null, 2));

for (const check of failingChecks) {
  console.log(`\n[FAIL] ${check.name}: ${check.findings.length}`);
  for (const finding of check.findings.slice(0, maxFindingsPerCheck)) {
    console.log(
      `- ${finding.file}:${finding.line} ${finding.message}: ${finding.detail}`,
    );
  }
  if (check.findings.length > maxFindingsPerCheck) {
    console.log(`- ... ${check.findings.length - maxFindingsPerCheck} more`);
  }
}

if (failingChecks.length > 0) {
  process.exitCode = 1;
} else {
  console.log("\n[PASS] Engine CardImplementation architecture target reached.");
}
