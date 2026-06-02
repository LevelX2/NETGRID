#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { deriveFunctionSignalsFromHint } from "./check-ai-strategy-taxonomy.mjs";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const COMPILED_HINTS_PATH = "data/ai/ai-card-hints-compiled.json";
const INSPECTOR_PATH = "data/ai/ai-hint-inspector-index.json";
const TACTIC_SIGNALS_PATH = "data/ai/tactic-signals-v1.json";
const DERIVATION_PATH = "data/ai/function-signal-derivation-v1.json";
const REPORT_PATH =
  "docs/reviews/ai/ai022-1-tactic-signal-taxonomy-cleanup-report-2026-06-02.json";

const SOURCE_COMMIT = "f6fb69f8";

const COUNTS_BEFORE = {
  inspectorCards: 564,
  cardsWithTacticOrFunctionSignals: 458,
  catalogedSignals: 318,
  usedSignals: 306,
  usedSignalGroups: 74,
  usedButUncatalogedSignals: 0,
  catalogedUnusedSignals: 12,
};

const REMOVED_HARDWARE_SUBTYPE_SIGNALS = [
  "setup.vehicle",
  "setup.memory_chip",
  "setup.cybernetics",
];

const FORBIDDEN_STATIC_SIGNAL_PREFIXES = ["anti.ice."];

const GENERIC_SIGNALS_REQUIRING_NOTES = [
  "economy.generic",
  "economy.recurring",
  "defense.damage_prevention",
  "setup.search",
  "setup.recovery",
  "setup.draw",
  "run.make_run",
];

const KNOWN_CARD_EXPECTATIONS = new Map([
  [
    "onr_v1_077_anonymous-tip",
    {
      requiredSignals: ["ice.derez_black_ice"],
      forbiddenSignals: ["info.expose", "info.expose_installed_cards"],
      forbiddenAnchors: [],
    },
  ],
  [
    "onr_v1_080_core-command-jettison-ice",
    {
      requiredSignals: ["ice.trash_rezzed"],
      forbiddenSignals: [],
      forbiddenAnchors: [],
    },
  ],
  [
    "onr_proteus_123_senatorial-field-trip",
    {
      requiredSignals: ["ice.derez_black_ice", "corp.bad_publicity_pressure"],
      forbiddenSignals: [],
      forbiddenAnchors: [],
    },
  ],
  [
    "onr_proteus_112_identity-donor",
    {
      requiredSignals: [
        "defense.meat_damage_prevention",
        "corp.bad_publicity_pressure",
      ],
      forbiddenSignals: [],
      forbiddenAnchors: ["runner.survival_defense"],
    },
  ],
  [
    "onr_v1_096_kilroy-was-here",
    {
      requiredSignals: [
        "access.free_trash",
        "access.trash_untrashable",
        "access.rnd_trash_pressure",
      ],
      forbiddenSignals: ["economy.trash_credit"],
      forbiddenAnchors: [],
    },
  ],
  [
    "onr_v1_107_romp-through-hq",
    {
      requiredSignals: [
        "access.free_trash",
        "access.trash_untrashable",
        "access.hq_trash_pressure",
      ],
      forbiddenSignals: ["economy.trash_credit"],
      forbiddenAnchors: [],
    },
  ],
  [
    "onr_proteus_144_lucidrinetm-drip-feed",
    {
      requiredSignals: [
        "action.recurring_extra_action",
        "risk.brain_damage_self_inflicted",
      ],
      forbiddenSignals: ["economy.action"],
      forbiddenAnchors: [],
    },
  ],
  [
    "onr_v1_142_record-reconstructor",
    {
      requiredSignals: [
        "corp.archives_to_rnd_pressure",
        "run.archives_replacement_access",
      ],
      forbiddenSignals: [],
      forbiddenAnchors: ["runner.rnd_pressure"],
    },
  ],
  [
    "onr_v1_083_desperate-competitor",
    {
      requiredSignals: ["score.conditional_agenda_point"],
      forbiddenSignals: [],
      forbiddenAnchors: [],
    },
  ],
  [
    "onr_v1_018_dogcatcher",
    {
      requiredSignals: [
        "breaker.sentry_subtype_limited",
        "breaker.subtype.watchdog",
      ],
      forbiddenSignals: ["breaker.watchdog"],
      forbiddenAnchors: [],
    },
  ],
]);

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(repoPath(relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function byCardId(cards) {
  return new Map((cards ?? []).map((card) => [card.cardId, card]));
}

function collectCardsById() {
  const files = [
    "data/cards/classic-cards.json",
    "data/cards/originalset-v1-cards.json",
    "data/cards/proteus-cards.json",
  ];
  return new Map(
    files.flatMap((file) =>
      (readJson(file).cards ?? []).map((card) => [
        card.cardId,
        { title: card.title, side: card.side, cardType: card.type, source: file },
      ]),
    ),
  );
}

function signalAnchorsByDerivation(rules) {
  const result = new Map();
  for (const rule of rules ?? []) {
    const anchors = result.get(rule.signalId) ?? new Set();
    for (const anchor of rule.strategyAnchorFor ?? []) anchors.add(anchor);
    result.set(rule.signalId, anchors);
  }
  return result;
}

function buildReport() {
  const active = readJson(ACTIVE_HINTS_PATH);
  const compiled = readJson(COMPILED_HINTS_PATH);
  const inspector = readJson(INSPECTOR_PATH);
  const tacticSignals = readJson(TACTIC_SIGNALS_PATH);
  const derivation = readJson(DERIVATION_PATH);
  const cardInfoById = collectCardsById();
  const activeById = byCardId(active.cards);
  const compiledById = byCardId(compiled.cards);
  const catalogBySignal = new Map(
    (tacticSignals.signals ?? []).map((signal) => [signal.signalId, signal]),
  );
  const derivationAnchorsBySignal = signalAnchorsByDerivation(
    derivation.derivationRules,
  );

  const derivedByCard = new Map();
  const usageBySignal = new Map();
  for (const hint of compiled.cards ?? []) {
    const derived = deriveFunctionSignalsFromHint(
      hint,
      derivation.derivationRules ?? [],
    );
    derivedByCard.set(hint.cardId, derived);
    for (const signal of derived.signals) {
      const entry =
        usageBySignal.get(signal) ??
        {
          signal,
          cardIds: new Set(),
          cardLevelStrategyAnchorsObserved: new Set(),
        };
      entry.cardIds.add(hint.cardId);
      for (const anchor of derived.anchorStrategyIds) {
        entry.cardLevelStrategyAnchorsObserved.add(anchor);
      }
      usageBySignal.set(signal, entry);
    }
  }

  const usedSignals = sortedUnique([...usageBySignal.keys()]);
  const catalogSignals = sortedUnique([...catalogBySignal.keys()]);
  const uncatalogedUsedSignals = usedSignals.filter(
    (signal) => !catalogBySignal.has(signal),
  );
  const unusedCatalogedSignals = catalogSignals.filter(
    (signal) => !usageBySignal.has(signal),
  );
  const usedGroups = sortedUnique(
    usedSignals.map((signal) => catalogBySignal.get(signal)?.group).filter(Boolean),
  );

  const signalUsageCatalog = usedSignals.map((signal) => {
    const catalog = catalogBySignal.get(signal);
    const usage = usageBySignal.get(signal);
    const causedAnchors = sortedUnique([
      ...(derivationAnchorsBySignal.get(signal) ?? []),
    ]);
    return {
      signal,
      group: catalog?.group ?? "uncataloged",
      supportOnly: catalog?.supportOnly ?? null,
      signalMayAnchorStrategy: catalog?.mayAnchorStrategy ?? null,
      anchorCausedBySignal: causedAnchors.length > 0,
      strategyAnchorsAllowedBySignal: catalog?.allowedStrategyAnchors ?? [],
      strategyAnchorsDerivedBySignal: causedAnchors,
      cardLevelStrategyAnchorsObserved: sortedUnique([
        ...(usage?.cardLevelStrategyAnchorsObserved ?? []),
      ]),
      cardCount: usage?.cardIds.size ?? 0,
    };
  });

  const cardFixes = [...KNOWN_CARD_EXPECTATIONS.entries()].map(
    ([cardId, expectation]) => {
      const derived = derivedByCard.get(cardId);
      const activeHint = activeById.get(cardId);
      const compiledHint = compiledById.get(cardId);
      const cardInfo = cardInfoById.get(cardId) ?? {};
      const signals = derived?.signals ?? [];
      const anchors = derived?.anchorStrategyIds ?? [];
      return {
        cardId,
        title: cardInfo.title,
        requiredSignals: expectation.requiredSignals,
        forbiddenSignals: expectation.forbiddenSignals,
        forbiddenAnchors: expectation.forbiddenAnchors,
        actualSignals: signals,
        actualStrategyAnchors: anchors,
        activeEffects: activeHint?.effects ?? [],
        compiledEffects: compiledHint?.effects ?? [],
        status:
          expectation.requiredSignals.every((signal) => signals.includes(signal)) &&
          expectation.forbiddenSignals.every((signal) => !signals.includes(signal)) &&
          expectation.forbiddenAnchors.every((anchor) => !anchors.includes(anchor))
            ? "ok"
            : "fail",
      };
    },
  );

  const retainedLegacySignals = GENERIC_SIGNALS_REQUIRING_NOTES.map(
    (signalId) => {
      const signal = catalogBySignal.get(signalId);
      return {
        signalId,
        status: signal
          ? "retained_broad_support_not_for_direct_scoring"
          : "missing",
        notes: signal?.notes,
      };
    },
  );

  const deferredItems = [
    {
      item: "corp.* neutral rename",
      decision: "retain_legacy_document_prefix",
      reason:
        "Existing gates and reports already consume corp.bad_publicity_pressure and corp.archives_to_rnd_pressure; AI022-1 documents corp.* as affected Corp state/zone instead of renaming.",
    },
    {
      item: "run.event_tempo deck line",
      decision: "retain_aggregation_deferred_scoring_review",
      reason:
        "The signal remains broad and anchor-capable, but later scoring must require run creation, payoff, risk coverage and density evidence.",
    },
    {
      item: "Trait and hidden resource signals",
      decision: "retain_legacy_visibility_trait_context",
      reason:
        "resource.connection, resource.position, resource.unique and hidden.* are kept for compatibility and documented as not direct DeckDoctrine strategy anchors.",
    },
    {
      item: "Record Reconstructor TargetProfile",
      decision: "retain_deferred",
      reason:
        "TargetProfile remains a candidate until the LegalAction Semantic Bridge models the run/access replacement choice.",
    },
  ];

  return {
    schemaVersion: "ai022-1-tactic-signal-taxonomy-cleanup-report-v1",
    taskId: "AI022-1",
    generatedAt: "2026-06-02",
    status: "complete",
    sourceCommit: SOURCE_COMMIT,
    countsBefore: COUNTS_BEFORE,
    countsAfter: {
      inspectorCards: inspector.summary?.cardCount ?? (inspector.cards ?? []).length,
      cardsWithTacticOrFunctionSignals: (inspector.cards ?? []).filter(
        (card) => (card.derivedFunctionSignals ?? []).length > 0,
      ).length,
      catalogedSignals: catalogSignals.length,
      usedSignals: usedSignals.length,
      usedSignalGroups: usedGroups.length,
      usedButUncatalogedSignals: uncatalogedUsedSignals.length,
      catalogedUnusedSignals: unusedCatalogedSignals.length,
      cardsWithStrategyAnchors: inspector.summary?.cardsWithStrategyAnchors,
    },
    changedSignals: [
      {
        signalId: "economy.action",
        change:
          "Narrowed derivation to action_economy with resource=credits so extra actions are not credit economy.",
      },
      {
        signalId: "economy.trash_credit",
        change:
          "Narrowed derivation to real runner/remote trash-credit support; free trash on accessed cards stays access.*.",
      },
      {
        signalId: "ice.derez_black_ice",
        change:
          "Added precise support-only ICE-control signal for Anonymous Tip and Senatorial Field Trip.",
      },
      {
        signalId: "ice.trash_rezzed",
        change:
          "Added derivation for existing Core Command: Jettison Ice effect target rezzed_ice.",
      },
      {
        signalId: "defense.meat_damage_prevention",
        change:
          "Added event-side derivation for Identity Donor's meat damage prevention.",
      },
      {
        signalId: "access.trash_untrashable",
        change:
          "Added event-side derivation and card effects for Kilroy Was Here and Romp through HQ.",
      },
    ],
    renamedSignals: [],
    removedSignals: [],
    retainedLegacySignals,
    cardFixes,
    prefixConvention: tacticSignals.signalPolicy?.prefixConvention,
    supportOnlyAnchorPolicy: tacticSignals.signalPolicy?.supportOnlyAnchorPolicy,
    broadSignalPolicy: tacticSignals.signalPolicy?.broadSignalPolicy,
    signalUsageCatalog,
    uncatalogedUsedSignals,
    unusedCatalogedSignals,
    deferredItems,
    verification: {
      generatedBy: "scripts/check-ai022-1-tactic-signal-taxonomy-cleanup.mjs --write-report",
      plannerEffect: false,
      actionScoreEffect: false,
      planWeightEffect: false,
      targetingAiEffect: false,
      engineEffect: false,
      legalEffect: false,
      profileOrDefaultSwitch: false,
      uiDerivationEffect: false,
    },
  };
}

function validateReport(report) {
  const errors = [];
  const catalog = readJson(TACTIC_SIGNALS_PATH);
  const derivation = readJson(DERIVATION_PATH);
  const catalogBySignal = new Map(
    (catalog.signals ?? []).map((signal) => [signal.signalId, signal]),
  );

  if (report.countsAfter.usedButUncatalogedSignals !== 0) {
    errors.push("used but uncataloged signals exist");
  }
  for (const signal of catalog.signals ?? []) {
    if (
      FORBIDDEN_STATIC_SIGNAL_PREFIXES.some((prefix) =>
        signal.signalId.startsWith(prefix),
      )
    ) {
      errors.push(`forbidden static signal ${signal.signalId}`);
    }
  }
  for (const signal of REMOVED_HARDWARE_SUBTYPE_SIGNALS) {
    const usage = report.signalUsageCatalog.find((entry) => entry.signal === signal);
    if (usage) errors.push(`removed hardware subtype signal still used: ${signal}`);
  }
  for (const signal of catalog.signals ?? []) {
    if (signal.supportOnly === true && signal.mayAnchorStrategy !== false) {
      errors.push(`supportOnly signal may anchor: ${signal.signalId}`);
    }
    if (
      signal.supportOnly === true &&
      (signal.allowedStrategyAnchors ?? []).length > 0
    ) {
      errors.push(`supportOnly signal lists anchors: ${signal.signalId}`);
    }
  }
  for (const rule of derivation.derivationRules ?? []) {
    const signal = catalogBySignal.get(rule.signalId);
    if (
      signal?.supportOnly === true &&
      (rule.strategyAnchorFor ?? []).length > 0
    ) {
      errors.push(`supportOnly signal derives anchors: ${rule.signalId}`);
    }
  }
  for (const fix of report.cardFixes) {
    if (fix.status !== "ok") errors.push(`card fix failed: ${fix.cardId}`);
  }
  for (const retained of report.retainedLegacySignals) {
    if (retained.status === "missing") {
      errors.push(`generic signal missing: ${retained.signalId}`);
      continue;
    }
    const notes = retained.notes ?? "";
    if (
      !notes.includes("broad_support") ||
      !notes.includes("not_for_direct_scoring")
    ) {
      errors.push(`generic signal lacks broad_support note: ${retained.signalId}`);
    }
  }
  if (!report.prefixConvention?.includes("affected Corp state/zone")) {
    errors.push("corp.* prefix convention is not documented");
  }
  if (!report.supportOnlyAnchorPolicy?.includes("card-level strategy anchors")) {
    errors.push("support-only/card-level anchor distinction is not documented");
  }
  const lucidrine = report.cardFixes.find(
    (fix) => fix.cardId === "onr_proteus_144_lucidrinetm-drip-feed",
  );
  if (lucidrine?.actualSignals.includes("economy.action")) {
    errors.push("Lucidrine Drip Feed still derives economy.action");
  }
  return errors;
}

function main() {
  const writeReport = process.argv.includes("--write-report");
  const report = buildReport();
  if (writeReport) writeJson(REPORT_PATH, report);
  const errors = validateReport(report);
  if (errors.length > 0) {
    for (const error of errors) console.error(`[FAIL] ${error}`);
    console.error(`AI022_1_TACTIC_SIGNAL_TAXONOMY_FAIL errors=${errors.length}`);
    process.exit(1);
  }
  console.log(
    `AI022_1_TACTIC_SIGNAL_TAXONOMY_OK cards=${report.countsAfter.inspectorCards} usedSignals=${report.countsAfter.usedSignals} catalogedSignals=${report.countsAfter.catalogedSignals} uncataloged=${report.countsAfter.usedButUncatalogedSignals}`,
  );
}

main();
