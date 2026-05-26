#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const DEFAULT_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const DEFAULT_INVENTORY_PATH =
  "docs/reviews/ai/ai-hint-consumer-contract-inventory-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/ai-hint-quality-gate-report-2026-05-25.json";

const CONSUMED_ROLE_EXPECTATIONS = [
  "agenda",
  "corp_score_agenda",
  "corp_install_ice",
  "corp_rez_ice",
  "etr_ice",
  "barrier_ice",
  "code_gate_ice",
  "sentry_ice",
  "breaker_fracter",
  "breaker_decoder",
  "breaker_killer",
  "economy",
  "draw",
  "build_rig",
  "recover_economy",
  "pressure_rnd",
  "pressure_hq",
  "multiaccess",
  "run_tax",
  "remote_upgrade_tax",
  "protect_remote",
  "build_scoring_remote",
  "tag_punishment",
  "tag_ice",
  "trace_ice",
  "trash_cost_payment",
  "stack_search",
];

const CODE_ONLY_EXPECTATIONS = [
  "breaker_generic",
  "score",
  "pressure",
  "interface",
];

const DENYLIST_BY_CARD = {
  "onr_v1_355_crystal-palace-station-grid": [
    "economy",
    "counter",
    "power_counter",
    "remote_upgrade_economy",
  ],
};

const SYNONYM_GROUPS = [
  ["rd_pressure", "pressure_rnd"],
  ["rd_run", "pressure_rnd"],
  ["hq_run", "pressure_hq"],
  ["hq_pressure", "pressure_hq"],
  ["wall_breaker", "breaker_fracter"],
  ["barrier_breaker", "breaker_fracter"],
  ["code_gate_breaker", "breaker_decoder"],
  ["sentry_breaker", "breaker_killer"],
  ["tag_remove", "tag_removal", "clear_tags", "remove_tags"],
];

const DIRECT_CLASSIFICATIONS = new Set([
  "direct_decision_effect",
  "direct_or_doctrine_effect",
  "indirect_generic_effect",
]);

export function analyzeAiHintQuality(options = {}) {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const hintsPath = resolvePath(
    repoRoot,
    options.hintsPath ?? DEFAULT_HINTS_PATH,
  );
  const inventoryPath = resolvePath(
    repoRoot,
    options.inventoryPath ?? DEFAULT_INVENTORY_PATH,
  );
  const deckFiles = options.deckFiles ?? defaultDeckFiles();

  const hintsData = readJson(hintsPath);
  const inventory = readJson(inventoryPath);
  const hints = hintsData.cards ?? [];
  const hintByCard = new Map(hints.map((hint) => [hint.cardId, hint]));
  const activeRoleContract = new Set(
    inventory.roles.map((entry) => entry.value),
  );
  const activePlanRoleContract = new Set(
    inventory.planRoles.map((entry) => entry.value),
  );
  const roleClassification = new Map(
    [...inventory.roles, ...inventory.planRoles].map((entry) => [
      entry.value,
      entry.classification,
    ]),
  );

  const errors = [];
  const warnings = [];

  const unknownRoles = [];
  const unknownPlanRoles = [];
  const denylistViolations = [];
  const weakSupportedCards = [];

  for (const hint of hints) {
    const roles = hint.roles ?? [];
    const planRoles = hint.planRoles ?? [];
    for (const role of roles) {
      if (!activeRoleContract.has(role))
        unknownRoles.push({ cardId: hint.cardId, role });
    }
    for (const role of planRoles) {
      if (!activePlanRoleContract.has(role))
        unknownPlanRoles.push({ cardId: hint.cardId, planRole: role });
    }
    for (const denied of DENYLIST_BY_CARD[hint.cardId] ?? []) {
      if (roles.includes(denied) || planRoles.includes(denied))
        denylistViolations.push({ cardId: hint.cardId, deniedRole: denied });
    }
    if (hint.aiSupportStatus === "ai_supported") {
      const allRoles = [...roles, ...planRoles];
      const hasKnown = allRoles.some(
        (role) =>
          activeRoleContract.has(role) || activePlanRoleContract.has(role),
      );
      const hasStrategic = allRoles.some((role) =>
        DIRECT_CLASSIFICATIONS.has(roleClassification.get(role) ?? ""),
      );
      if (!hasKnown || !hasStrategic)
        weakSupportedCards.push({
          cardId: hint.cardId,
          roles,
          planRoles,
          reason: hasKnown ? "no_consumed_role" : "no_known_role",
        });
    }
  }

  const missingConsumedRoles = CONSUMED_ROLE_EXPECTATIONS.filter(
    (role) =>
      !activeRoleContract.has(role) &&
      !activePlanRoleContract.has(role) &&
      !CODE_ONLY_EXPECTATIONS.includes(role),
  );

  const suspiciousSingletonRoles = inventory.roles
    .filter(
      (entry) =>
        entry.count === 1 &&
        entry.codeExactReference !== true &&
        entry.codeSubstringReference !== true,
    )
    .map((entry) => entry.value);
  const suspiciousSingletonPlanRoles = inventory.planRoles
    .filter(
      (entry) =>
        entry.count === 1 &&
        entry.codeExactReference !== true &&
        entry.codeSubstringReference !== true,
    )
    .map((entry) => entry.value);
  const synonymWarnings = SYNONYM_GROUPS.map((group) => {
    const present = group.filter(
      (role) =>
        activeRoleContract.has(role) || activePlanRoleContract.has(role),
    );
    return present.length > 1 ? { group, present } : undefined;
  }).filter(Boolean);

  const benchmarkCoverage = collectBenchmarkCoverage(
    repoRoot,
    deckFiles,
    hintByCard,
  );

  if (unknownRoles.length > 0)
    errors.push({ kind: "unknown_roles", items: unknownRoles });
  if (unknownPlanRoles.length > 0)
    errors.push({ kind: "unknown_plan_roles", items: unknownPlanRoles });
  if (missingConsumedRoles.length > 0)
    errors.push({
      kind: "missing_consumed_role_contract",
      items: missingConsumedRoles,
    });
  if (denylistViolations.length > 0)
    errors.push({ kind: "denylist_violations", items: denylistViolations });
  if (benchmarkCoverage.missingHintCards.length > 0)
    errors.push({
      kind: "benchmark_deck_cards_missing_hints",
      items: benchmarkCoverage.missingHintCards,
    });

  if (weakSupportedCards.length > 0)
    warnings.push({
      kind: "weak_ai_supported_cards",
      items: weakSupportedCards,
    });
  if (suspiciousSingletonRoles.length > 0)
    warnings.push({
      kind: "suspicious_singleton_roles",
      count: suspiciousSingletonRoles.length,
      items: suspiciousSingletonRoles,
    });
  if (suspiciousSingletonPlanRoles.length > 0)
    warnings.push({
      kind: "suspicious_singleton_plan_roles",
      count: suspiciousSingletonPlanRoles.length,
      items: suspiciousSingletonPlanRoles,
    });
  if (synonymWarnings.length > 0)
    warnings.push({ kind: "role_synonym_candidates", items: synonymWarnings });
  if (benchmarkCoverage.riskCards.length > 0)
    warnings.push({
      kind: "benchmark_deck_cards_with_quality_risk",
      count: benchmarkCoverage.riskCards.length,
      items: benchmarkCoverage.riskCards,
    });

  return {
    schemaVersion: "ai-hint-quality-gate-report-v1",
    generatedAt: "2026-05-25",
    hintCount: hints.length,
    roleContractCount: activeRoleContract.size,
    planRoleContractCount: activePlanRoleContract.size,
    errors,
    warnings,
    errorCount: errors.reduce((sum, entry) => sum + itemCount(entry), 0),
    warningCount: warnings.reduce((sum, entry) => sum + itemCount(entry), 0),
    gates: {
      unknownRolesFail: true,
      consumedRoleContractFail: true,
      benchmarkMissingHintFail: true,
      crystalPalaceDenylistFail: true,
      unusedSingletonRolesWarn: true,
      synonymGroupsWarn: true,
      benchmarkQualityRiskWarn: true,
    },
    benchmarkCoverage,
  };
}

function itemCount(entry) {
  return Array.isArray(entry.items) ? entry.items.length : (entry.count ?? 1);
}

function collectBenchmarkCoverage(repoRoot, deckFiles, hintByCard) {
  const benchmarkDeckCards = new Map();
  const skippedDecks = [];
  for (const file of deckFiles) {
    const absolute = resolvePath(repoRoot, file);
    if (!fs.existsSync(absolute)) continue;
    const json = readJson(absolute);
    for (const deck of findDeckLikeObjects(json)) {
      const deckId =
        deck.deckSnapshotId ?? deck.snapshotId ?? deck.deckId ?? file;
      const skipReason = aiHintCoverageSkipReason(deck);
      if (skipReason) {
        skippedDecks.push({
          deckId,
          file,
          reason: skipReason,
        });
        continue;
      }
      const deckUse =
        deck.holdoutUse ?? deck.tuningUse ?? deck.classification ?? "benchmark";
      for (const cardId of deckCardIds(deck)) {
        const entry = benchmarkDeckCards.get(cardId) ?? {
          cardId,
          decks: new Set(),
          holdoutOnly: true,
        };
        entry.decks.add(deckId);
        entry.holdoutOnly = entry.holdoutOnly && deckUse === "holdout_only";
        benchmarkDeckCards.set(cardId, entry);
      }
    }
  }

  const missingHintCards = [];
  const riskCards = [];
  for (const entry of benchmarkDeckCards.values()) {
    const hint = hintByCard.get(entry.cardId);
    if (!hint) {
      missingHintCards.push({
        cardId: entry.cardId,
        decks: [...entry.decks].sort(),
      });
      continue;
    }
    const allRoles = [...(hint.roles ?? []), ...(hint.planRoles ?? [])];
    const onlyGeneric =
      allRoles.length > 0 &&
      allRoles.every((role) =>
        [
          "runner",
          "corp",
          "program",
          "hardware",
          "resource",
          "event",
          "agenda",
          "ice",
          "operation",
          "asset",
          "upgrade",
          "per_card_longtail",
        ].includes(role),
      );
    const hasSuspiciousOnly =
      allRoles.length > 0 &&
      allRoles.every(
        (role) => role.includes("longtail") || role.includes("choice"),
      );
    if (onlyGeneric || hasSuspiciousOnly) {
      riskCards.push({
        cardId: entry.cardId,
        decks: [...entry.decks].sort(),
        holdoutOnly: entry.holdoutOnly,
        reason: onlyGeneric ? "only_generic_roles" : "suspicious_role_only",
        roles: hint.roles ?? [],
        planRoles: hint.planRoles ?? [],
      });
    }
  }

  return {
    deckFiles,
    totalUniqueCards: benchmarkDeckCards.size,
    skippedDecks: skippedDecks.sort((a, b) => a.deckId.localeCompare(b.deckId)),
    missingHintCards: missingHintCards.sort((a, b) =>
      a.cardId.localeCompare(b.cardId),
    ),
    riskCards: riskCards.sort((a, b) => a.cardId.localeCompare(b.cardId)),
  };
}

function aiHintCoverageSkipReason(deck) {
  const formatProfileId = stringValue(deck.formatProfileId);
  const publicFormatProfileId = stringValue(
    deck.publicMetadata?.formatProfileId,
  );
  const cardPoolVersion = stringValue(deck.cardPoolVersion);
  const publicCardPoolVersion = stringValue(
    deck.publicMetadata?.cardPoolVersion,
  );

  if (
    [
      formatProfileId,
      publicFormatProfileId,
      cardPoolVersion,
      publicCardPoolVersion,
    ].some((value) => value.includes("proteus_playtest"))
  ) {
    return "proteus_playtest_not_active_ai_hint_scope";
  }

  return undefined;
}

function stringValue(value) {
  return typeof value === "string" ? value : "";
}

function defaultDeckFiles() {
  return [
    "data/decks/deck-snapshots-0.8.json",
    "data/ai/ai-local-realistic-benchmark-deck-snapshots-2026-05-23.json",
    "data/ai/ai-real-scene-benchmark-deck-snapshots-2026-05-24.json",
  ];
}

function findDeckLikeObjects(value) {
  const decks = [];
  visit(value);
  return decks;

  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (
      (typeof node.deckSnapshotId === "string" ||
        typeof node.snapshotId === "string" ||
        typeof node.deckId === "string") &&
      (Array.isArray(node.cards) || Array.isArray(node.cardIds))
    ) {
      decks.push(node);
    }
    for (const value of Object.values(node)) visit(value);
  }
}

function deckCardIds(deck) {
  const cards = new Set();
  if (typeof deck.identityCardId === "string") cards.add(deck.identityCardId);
  if (Array.isArray(deck.cardIds)) {
    for (const cardId of deck.cardIds) {
      if (typeof cardId === "string") cards.add(cardId);
    }
  }
  if (Array.isArray(deck.cards)) {
    for (const card of deck.cards) {
      if (typeof card === "string") cards.add(card);
      if (typeof card?.cardId === "string") cards.add(card.cardId);
    }
  }
  return [...cards];
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolvePath(repoRoot, candidate) {
  return path.isAbsolute(candidate)
    ? candidate
    : path.join(repoRoot, candidate);
}

function parseArgs(argv) {
  const args = {
    json: false,
    writeReport: false,
    reportPath: DEFAULT_REPORT_PATH,
    hintsPath: DEFAULT_HINTS_PATH,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") args.json = true;
    else if (arg === "--write-report") args.writeReport = true;
    else if (arg === "--report") args.reportPath = argv[++index];
    else if (arg === "--hints") args.hintsPath = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const report = analyzeAiHintQuality({ hintsPath: args.hintsPath });
  if (args.writeReport) {
    const reportPath = resolvePath(REPO_ROOT, args.reportPath);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  if (args.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(
      [
        `AI_HINT_QUALITY ${report.errorCount === 0 ? "OK" : "FAIL"}`,
        `hints=${report.hintCount}`,
        `roles=${report.roleContractCount}`,
        `planRoles=${report.planRoleContractCount}`,
        `errors=${report.errorCount}`,
        `warnings=${report.warningCount}`,
        `benchmarkCards=${report.benchmarkCoverage.totalUniqueCards}`,
      ].join(" ") + "\n",
    );
    for (const error of report.errors) {
      process.stdout.write(`ERROR ${error.kind} ${itemCount(error)}\n`);
    }
    for (const warning of report.warnings) {
      process.stdout.write(`WARN ${warning.kind} ${itemCount(warning)}\n`);
    }
  }
  if (report.errorCount > 0) process.exitCode = 1;
}
