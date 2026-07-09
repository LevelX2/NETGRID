#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const maxFindingsPerCheck = 30;
const selfTest = process.argv.includes("--self-test");

const scannedRoots = [
  "packages/engine/src/ability-engine",
  "packages/engine/src/game",
  "packages/engine/src/mechanics",
  "packages/engine/src/card-implementations",
  "packages/shared/src",
];

const productionExtensions = new Set([".ts", ".tsx", ".mts", ".mjs", ".js"]);
const tsNoCheckScopes = [
  "packages/engine/src/game/engine-runtime-internal/",
  "packages/engine/src/game/card-implementation/",
  "packages/engine/src/ability-engine/",
];
const runtimeEscapeScopes = tsNoCheckScopes;

const allowedCardNameContexts = [
  "packages/engine/src/card-implementations/classic/",
  "packages/engine/src/card-implementations/onr-v1/",
  "packages/engine/src/card-implementations/proteus/",
  "packages/engine/src/card-implementations/subregistries/",
];

const knownCardSpecificRuntimeTokens = [
  "karl_successful_run_credit",
  "databroker_agenda_point_credits",
  "nevinyrral_action_and_lose_on_rezzed_leave",
  "schlaghund_tag_die_meat_damage",
  "crash_everett_draw_extra_choose_trash_or_top",
  "hacker_tracker_trace_bits",
  "crybaby_crying_counter",
  "prearrangedDrop",
  "promisesPromises",
  "remoteDetonator",
  "live_news_feed",
  "subliminal_corruption",
  "silver_lining_recovery",
  "shell_traders_delayed_install",
  "some_card_name_special",
];

const roleLineLimits = [
  {
    name: "registry aggregator",
    match: (file) =>
      file.includes("/card-implementations/") && file.includes("registr"),
    limit: 220,
  },
  {
    name: "effect family",
    match: (file) => file.includes("/ability-engine/effect-families/"),
    limit: 360,
  },
];

function toRepoPath(path) {
  return relative(repoRoot, path).split(sep).join("/");
}

function readRepoFile(path) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

function trackedFiles() {
  const output = execFileSync("git", ["ls-files", ...scannedRoots], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((file) => productionExtensions.has(extname(file)))
    .filter((file) => !file.includes("/node_modules/"))
    .sort();
}

function filesystemSources() {
  return trackedFiles().map((file) => ({
    file,
    text: readRepoFile(file),
  }));
}

function lineNumber(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function lineText(text, line) {
  return text.split(/\r?\n/)[line - 1]?.trim() ?? "";
}

function snippet(text, index) {
  return text.slice(index).split(/\r?\n/, 1)[0]?.trim().slice(0, 180) ?? "";
}

function pushFinding(findings, file, line, message, detail) {
  findings.push({ file, line, message, detail });
}

function startsWithAny(file, prefixes) {
  return prefixes.some((prefix) => file.startsWith(prefix));
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

function isCommentOnly(line) {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("/*")
  );
}

function isCardImplementationFile(file) {
  return startsWithAny(file, allowedCardNameContexts);
}

function isCatalogOrAllowedCardContext(file, line) {
  if (isTestOrFixture(file)) return true;
  if (isCardImplementationFile(file)) return true;
  if (file === "packages/engine/src/card-implementations/coverage.ts")
    return true;
  if (file === "packages/shared/src/card-definitions.ts") {
    return (
      line.includes("id:") ||
      line.includes("title:") ||
      line.includes("text:") ||
      line.includes("flavorText:") ||
      line.includes("mechanics:")
    );
  }
  if (
    file.includes("/card-implementations/") &&
    line.includes("cardDefinitionId")
  ) {
    return true;
  }
  if (line.includes("cardDefinitionId:")) return true;
  if (line.includes('from "./') && file.includes("/card-implementations/"))
    return true;
  return isCommentOnly(line);
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
        : `${lower[0]?.toUpperCase() ?? ""}${lower.slice(1)}`;
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
  if (lowerWords[0] === "the" && lowerWords.length > 1) {
    for (const variant of variantsForWords(words.slice(1)))
      variants.add(variant);
  }
  return variants;
}

function definitionSlugForId(id) {
  return id.replace(/^onr_(?:v1|proteus|classic)_\d+_/, "");
}

function deriveCardNameTokens(sources) {
  const shared = sources.find(
    (source) => source.file === "packages/shared/src/card-definitions.ts",
  );
  const tokens = new Map();
  for (const token of knownCardSpecificRuntimeTokens) {
    tokens.set(token, { token, title: "known card-specific runtime token" });
  }
  if (!shared)
    return [...tokens.values()].sort((a, b) => a.token.localeCompare(b.token));

  const pattern =
    /id:\s*"(?<id>onr_(?:v1|proteus|classic)_\d+_[^"]+)",\s*\r?\n\s*title:\s*"(?<title>[^"]+)"/g;
  let match = pattern.exec(shared.text);
  while (match) {
    const id = match.groups.id;
    const title = match.groups.title;
    const variants = new Set([
      ...variantsForWords(wordsFor(title)),
      ...variantsForWords(wordsFor(definitionSlugForId(id))),
    ]);
    for (const token of variants) {
      if (!meaningfulToken(token) || tokens.has(token)) continue;
      tokens.set(token, { token, title, cardId: id });
    }
    match = pattern.exec(shared.text);
  }
  return [...tokens.values()].sort((a, b) => a.token.localeCompare(b.token));
}

function collectTsNoCheckFindings(sources) {
  const findings = [];
  for (const { file, text } of sources) {
    if (!startsWithAny(file, tsNoCheckScopes) || isTestOrFixture(file))
      continue;
    const regex = /@ts-nocheck/g;
    let match = regex.exec(text);
    while (match) {
      pushFinding(
        findings,
        file,
        lineNumber(text, match.index),
        "@ts-nocheck in productive architecture scope",
        snippet(text, match.index),
      );
      match = regex.exec(text);
    }
  }
  return findings;
}

function collectRuntimeEscapeFindings(sources) {
  const findings = [];
  const patterns = [
    {
      message: "open string index signature for runtime dependencies",
      regex:
        /\[[A-Za-z_$][A-Za-z0-9_$]*:\s*string\]\s*:\s*(?:unknown|any|RuntimeCallable|[^;{}]+)/g,
    },
    {
      message: "Record<string, unknown> runtime dependency bag",
      regex: /Record\s*<\s*string\s*,\s*unknown\s*>/g,
    },
    {
      message: "Record<string, any> runtime dependency bag",
      regex: /Record\s*<\s*string\s*,\s*any\s*>/g,
    },
    {
      message: "generic runtime bag type alias",
      regex: /type\s+[A-Za-z0-9_$]*(?:Runtime)?Bag[A-Za-z0-9_$]*\s*=/g,
    },
    {
      message: "general callable runtime bag",
      regex:
        /(?:RuntimeCallable|CallableBag|FunctionBag)|\(\s*\.\.\.[^)]*:\s*(?:unknown|any)\[\]\s*\)\s*=>\s*(?:unknown|any)/g,
    },
    {
      message: "dynamic string property resolution",
      regex:
        /\[[A-Za-z_$][A-Za-z0-9_$]*\s+as\s+keyof|\[[A-Za-z_$][A-Za-z0-9_$]*\]\s*(?:\(|;|,|\?|\.)/g,
      requiresRuntimeContext: true,
    },
    {
      message: "Proxy-based runtime dependency dispatch",
      regex: /\bnew\s+Proxy\b|\bruntimeProxy\b/g,
    },
    {
      message: "general runtime member resolver",
      regex:
        /\bresolveRuntimeMember\b|\blookupCapability\b|\bresolveCapability\b/g,
    },
    {
      message: "broad cast bypasses runtime contract",
      regex: /\bas\s+(?:any|Record\s*<\s*string\s*,\s*(?:unknown|any)\s*>)/g,
    },
  ];

  for (const { file, text } of sources) {
    if (isTestOrFixture(file) || !startsWithAny(file, runtimeEscapeScopes))
      continue;
    for (const pattern of patterns) {
      let match = pattern.regex.exec(text);
      while (match) {
        const detail = snippet(text, match.index);
        if (
          pattern.requiresRuntimeContext &&
          !/\b(runtime|deps|capabilit|member|lookup|resolve|binding)\b/i.test(
            detail,
          )
        ) {
          match = pattern.regex.exec(text);
          continue;
        }
        pushFinding(
          findings,
          file,
          lineNumber(text, match.index),
          pattern.message,
          detail,
        );
        match = pattern.regex.exec(text);
      }
    }
  }
  return findings;
}

function effectKindsByTypeName(sources) {
  const definition = sources.find(
    (source) =>
      source.file === "packages/engine/src/ability-engine/definition-types.ts",
  );
  if (!definition) return new Map();
  const union =
    /export type CardEffectImplementation =(?<body>[\s\S]*?);/m.exec(
      definition.text,
    )?.groups?.body;
  if (!union) return new Map();
  const typeNames = [
    ...union.matchAll(/\|\s*(?<name>[A-Za-z0-9]+EffectImplementation)\b/g),
  ].map((match) => match.groups.name);
  const result = new Map();
  for (const typeName of typeNames) {
    const body = new RegExp(
      `export type ${typeName} =(?<body>[\\s\\S]*?);\\r?\\n`,
      "m",
    ).exec(definition.text)?.groups?.body;
    const kind = body
      ? /kind:\s*"(?<kind>[^"]+)"/.exec(body)?.groups?.kind
      : undefined;
    if (kind) result.set(typeName, kind);
  }
  return result;
}

function collectEffectFamilyFindings(sources) {
  const findings = [];
  const familySources = sources.filter((source) =>
    source.file.startsWith(
      "packages/engine/src/ability-engine/effect-families/",
    ),
  );
  for (const { file, text } of familySources) {
    const basename = file.split("/").at(-1) ?? file;
    if (/context-effects(?:-part-\d+)?\.ts$/.test(basename)) {
      pushFinding(
        findings,
        file,
        1,
        "numbered or catch-all context effect family",
        basename,
      );
    }
    const acceptedKindMatches = [
      ...text.matchAll(/case\s+"([^"]+)"|kind\s*===\s*"([^"]+)"/g),
    ];
    const uniqueKinds = new Set(
      acceptedKindMatches.map((match) => match[1] ?? match[2]),
    );
    if (uniqueKinds.size > 12) {
      pushFinding(
        findings,
        file,
        1,
        "effect family accepts too many kinds for one responsibility",
        `${uniqueKinds.size} kinds`,
      );
    }
  }

  const interpreter = sources.find(
    (source) =>
      source.file ===
      "packages/engine/src/ability-engine/effect-interpreter.ts",
  );
  if (interpreter) {
    for (const regex of [
      /switch\s*\(\s*effect\.kind\s*\)/g,
      /\bcase\s+"[^"]+"/g,
    ]) {
      let match = regex.exec(interpreter.text);
      while (match) {
        pushFinding(
          findings,
          interpreter.file,
          lineNumber(interpreter.text, match.index),
          "central interpreter contains concrete effect kind dispatch",
          snippet(interpreter.text, match.index),
        );
        match = regex.exec(interpreter.text);
      }
    }
  }

  const kinds = effectKindsByTypeName(sources);
  const ownerByKind = new Map();
  for (const { file, text } of familySources) {
    for (const kind of kinds.values()) {
      if (new RegExp(`["']${kind}["']`).test(text)) {
        const owners = ownerByKind.get(kind) ?? [];
        owners.push(file);
        ownerByKind.set(kind, owners);
      }
    }
  }
  for (const [typeName, kind] of kinds) {
    const owners = ownerByKind.get(kind) ?? [];
    if (owners.length === 0) {
      pushFinding(
        findings,
        "packages/engine/src/ability-engine/definition-types.ts",
        1,
        "CardEffect kind has no effect-family owner",
        `${kind} (${typeName})`,
      );
    } else if (owners.length > 1) {
      pushFinding(
        findings,
        "packages/engine/src/ability-engine/definition-types.ts",
        1,
        "CardEffect kind has multiple effect-family owners",
        `${kind}: ${owners.join(", ")}`,
      );
    }
  }
  return findings;
}

function collectCardSpecificRuntimeNameFindings(sources) {
  const findings = [];
  const tokens = deriveCardNameTokens(sources);
  const productionSources = sources.filter(
    ({ file }) =>
      !isTestOrFixture(file) &&
      file !==
        "scripts/check-engine-cardimplementation-architecture-target.mjs",
  );

  for (const { file, text } of productionSources) {
    for (const tokenInfo of tokens) {
      let index = text.indexOf(tokenInfo.token);
      while (index >= 0) {
        const line = lineNumber(text, index);
        const currentLine = lineText(text, line);
        if (isCatalogOrAllowedCardContext(file, currentLine)) {
          index = text.indexOf(tokenInfo.token, index + tokenInfo.token.length);
          continue;
        }
        const suspiciousContext =
          currentLine.includes("kind:") ||
          currentLine.includes("payload") ||
          currentLine.includes("Payload") ||
          currentLine.includes("source") ||
          currentLine.includes("Source") ||
          currentLine.includes("resolver") ||
          currentLine.includes("Resolver") ||
          currentLine.includes("Ability") ||
          currentLine.includes("runtime") ||
          file.includes("/mechanics/") ||
          file.includes("/game/") ||
          file.includes("/ai/") ||
          file.startsWith("scripts/");
        if (suspiciousContext) {
          pushFinding(
            findings,
            file,
            line,
            "card-specific name appears in productive runtime or semantic logic",
            `${tokenInfo.token}${tokenInfo.cardId ? ` (${tokenInfo.cardId})` : ""}: ${currentLine}`,
          );
        }
        index = text.indexOf(tokenInfo.token, index + tokenInfo.token.length);
      }
    }
  }
  return findings;
}

function collectCardIdBehaviorFindings(sources) {
  const findings = [];
  const patterns = [
    {
      message: "card-id set or constant can control behavior",
      regex:
        /\b[A-Z][A-Z0-9_]*(?:_CARD_ID|_CARD_IDS|_DEFINITION_ID|_DEFINITION_IDS)\b|\bnew\s+Set\s*<\s*[^>]*CardDefinitionId[^>]*>\s*\(/g,
    },
    {
      message: "direct ONR/Proteus definition id in productive rule path",
      regex: /["']onr_(?:v1|proteus|classic)_\d+_[^"']+["']/g,
    },
  ];
  for (const { file, text } of sources) {
    if (isTestOrFixture(file) || isCardImplementationFile(file)) continue;
    if (
      file.includes("/compatibility/") ||
      file.includes("payload-compatibility")
    )
      continue;
    if (
      !(
        file.startsWith("packages/engine/src/game/") ||
        file.startsWith("packages/engine/src/mechanics/") ||
        file.startsWith("packages/shared/src/") ||
        file.startsWith("packages/ai/src/") ||
        file.startsWith("scripts/")
      )
    ) {
      continue;
    }
    for (const pattern of patterns) {
      let match = pattern.regex.exec(text);
      while (match) {
        const line = lineText(text, lineNumber(text, match.index));
        if (!isCatalogOrAllowedCardContext(file, line)) {
          pushFinding(
            findings,
            file,
            lineNumber(text, match.index),
            pattern.message,
            line,
          );
        }
        match = pattern.regex.exec(text);
      }
    }
  }
  return findings;
}

function collectRegistryFindings(sources) {
  const findings = [];
  for (const { file, text } of sources) {
    if (!file.startsWith("packages/engine/src/card-implementations/")) continue;
    const basename = file.split("/").at(-1) ?? file;
    if (/all-card-implementations\.(?:ts|js|mjs)$/.test(basename)) {
      pushFinding(
        findings,
        file,
        1,
        "registry replacement monolith is forbidden",
        basename,
      );
    }
    const directCardImports = [
      ...text.matchAll(
        /from\s+["'](?:\.\.\/)*((?:classic|onr-v1|proteus)\/[^"']+)["']/g,
      ),
    ].filter((match) => match[1].split("/").length >= 4);
    if (directCardImports.length > 20) {
      pushFinding(
        findings,
        file,
        1,
        "registry aggregator imports too many individual card implementations",
        `${directCardImports.length} direct card imports`,
      );
    }
  }
  return findings;
}

function collectReplacementMonolithFindings(sources) {
  const findings = [];
  for (const { file, text } of sources) {
    if (isTestOrFixture(file)) continue;
    const role = roleLineLimits.find((candidate) => candidate.match(file));
    if (!role) continue;
    const lines = text.split(/\r?\n/).length;
    if (lines > role.limit) {
      pushFinding(
        findings,
        file,
        1,
        `${role.name} module exceeds role limit`,
        `${lines} lines > ${role.limit}`,
      );
    }
  }
  return findings;
}

function analyzeSources(sources) {
  return [
    {
      name: "@ts-nocheck in productive architecture scope",
      findings: collectTsNoCheckFindings(sources),
    },
    {
      name: "runtime escape hatches removed",
      findings: collectRuntimeEscapeFindings(sources),
    },
    {
      name: "effect families are domain-owned and exhaustive",
      findings: collectEffectFamilyFindings(sources),
    },
    {
      name: "card-specific productive runtime names",
      findings: collectCardSpecificRuntimeNameFindings(sources),
    },
    {
      name: "active card-id rule decisions removed",
      findings: collectCardIdBehaviorFindings(sources),
    },
    {
      name: "registry uses real grouped registries",
      findings: collectRegistryFindings(sources),
    },
    {
      name: "no replacement monoliths",
      findings: collectReplacementMonolithFindings(sources),
    },
  ];
}

function runSelfTest() {
  const sources = [
    {
      file: "packages/shared/src/card-definitions.ts",
      text: 'export const DEMO_CARDS = [{\n  id: "onr_v1_001_hacker_tracker",\n  title: "Hacker Tracker",\n}];\n',
    },
    {
      file: "packages/engine/src/game/engine-runtime-internal/synthetic-runtime.ts",
      text: `// @ts-nocheck
type ArbitraryBag = { [key: string]: unknown };
type CallableBag = (...args: unknown[]) => unknown;
const runtime: Record<string, unknown> = {};
function lookupCapability(name: string) {
  return (runtime as any)[name];
}
const proxy = new Proxy({}, { get: (_target, property) => runtime[property as string] });
const IDS = new Set<CardDefinitionId>([SOME_CARD_ID]);
`,
    },
    {
      file: "packages/engine/src/ability-engine/effect-families/context-effects-part-7.ts",
      text: 'export function execute(effect) { if (effect.kind === "some_card_name_special") return; }\n',
    },
    {
      file: "packages/engine/src/card-implementations/subregistries/all-card-implementations.ts",
      text: Array.from(
        { length: 25 },
        (_, index) =>
          `import { card${index} } from "../onr-v1/corp/assets/card-${index}";`,
      ).join("\n"),
    },
    {
      file: "scripts/synthetic-ai-semantic-check.mjs",
      text: 'const profile = { kind: "hacker_tracker_trace_bits" };\n',
    },
  ];
  const checks = analyzeSources(sources);
  const required = new Map([
    ["@ts-nocheck in productive architecture scope", "@ts-nocheck"],
    ["runtime escape hatches removed", "runtime escape hatch"],
    [
      "effect families are domain-owned and exhaustive",
      "context effect family",
    ],
    ["card-specific productive runtime names", "card-specific runtime name"],
    ["active card-id rule decisions removed", "card-id rule decision"],
    ["registry uses real grouped registries", "all-card registry monolith"],
  ]);
  const failures = [];
  for (const [checkName, label] of required) {
    const check = checks.find((candidate) => candidate.name === checkName);
    if (!check || check.findings.length === 0) failures.push(label);
  }
  if (failures.length > 0) {
    console.error(
      `Architecture guard self-test failed: ${failures.join(", ")}`,
    );
    process.exit(1);
  }
  console.log("Architecture guard self-test passed.");
}

function runCheck() {
  const checks = analyzeSources(filesystemSources());
  const summary = Object.fromEntries(
    checks.map((check) => [check.name, check.findings.length]),
  );
  const failingChecks = checks.filter((check) => check.findings.length > 0);

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
    console.log(
      "\n[PASS] Engine CardImplementation architecture target reached.",
    );
  }
}

if (selfTest) {
  runSelfTest();
} else {
  runCheck();
}
