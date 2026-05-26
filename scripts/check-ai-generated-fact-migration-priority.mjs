import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REVIEW_DATE = "2026-05-25";
const SCHEMA_VERSION = "ai-generated-fact-migration-priority-v1";
const COMPILED_INDEX_REPORT_PATH =
  "docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json";
const DERIVED_FACTS_REPORT_PATH =
  "docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json";
const PILOT_CARDS_PATH =
  "data/ai/ai-derived-basic-facts-pilot-cards-2026-05-25.json";
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const OVERLAY_PATHS = [
  "data/ai/hints/overlays/onr-v1/corp/upgrades.json",
  "data/ai/hints/overlays/onr-v1/runner/programs.json",
];
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/ai-generated-fact-migration-priority-report-2026-05-25.json";

const MECHANICAL_FIELDS = [
  "effects",
  "conditions",
  "costProfile",
  "breakerProfile",
  "remoteRole",
  "targetProfiles",
];

const PRIORITY_POLICY = {
  "onr_v1_017_deep-thought": {
    migrationPriority: "P2",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "overlay_only",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Topdeck information is mechanically derivable, but the strategic R&D pressure value stays overlay-only.",
  },
  "onr_v1_037_japanese-water-torture": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "overlay_only",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 2,
    rationale:
      "Breaker coverage and forgo_actions side effect are exact implementation facts and low-risk generated candidates.",
  },
  onr_v1_039_krash: {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: ["safe_generated_now", "legacy_keep_for_compat"],
    recommendedMigrationBatch: 2,
    rationale:
      "Universal breaker profile is an exact mechanical fact and should not need long-term manual duplication.",
  },
  onr_v1_074_worm: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Wall breaker coverage and break/pump costs are stable generated facts; concrete encounter legality remains effectiveRunQuote context.",
  },
  "onr_v1_047_pile-driver": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Wall breaker coverage is stable, while stealth_loss must stay a side-effect fact rather than normal credit cost.",
  },
  onr_v1_014_codecracker: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Code-gate breaker coverage and costs are stable generated facts.",
  },
  onr_v1_016_cyfermaster: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Code-gate breaker coverage and costs are stable generated facts; printed trademark suffix is normalized by cardId.",
  },
  onr_v1_052_raffles: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Code-gate breaker coverage and costs are stable generated facts.",
  },
  onr_v1_054_raptor: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale: "Sentry breaker coverage and costs are stable generated facts.",
  },
  onr_v1_060_shaka: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale: "Sentry breaker coverage and costs are stable generated facts.",
  },
  "onr_v1_006_black-dahlia": {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale: "Sentry breaker coverage and costs are stable generated facts.",
  },
  "onr_v1_040_loony-goon": {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale: "Sentry breaker coverage and costs are stable generated facts.",
  },
  onr_v1_007_blink: {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Universal random breaker coverage is mechanically derivable, but random_failure and once-per-subroutine must not become deterministic break safety.",
  },
  onr_v1_019_dropp: {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Universal breaker coverage is derivable, but ends_run_after_use must remain a side effect and not be lost in normalization.",
  },
  onr_v1_056_replicator: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Trace-subroutine breaker coverage is stable and must remain distinct from universal coverage.",
  },
  onr_v1_055_reflector: {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "AP-special breaker coverage is derivable, but stun/hellbolt/knockout specificity remains a descriptor limitation.",
  },
  "onr_v1_002_ai-boon": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Sentry breaker coverage is derivable, but random run-start strength must remain random-context only.",
  },
  "onr_v1_005_bartmoss-memorial-icebreaker": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Universal breaker coverage is derivable, but random self-trash risk must remain a side effect and not deterministic safety.",
  },
  onr_v1_070_tinweasel: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Code-gate breaker coverage is stable; no-pump text remains comparison context.",
  },
  "onr_v1_073_wizards-book": {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Code-gate breaker coverage and costs are stable generated facts.",
  },
  "onr_v1_072_wild-card": {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale: "Sentry breaker coverage and costs are stable generated facts.",
  },
  "onr_v1_043_mystery-box": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "overlay_only",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 2,
    rationale:
      "Search, top-five target profile, free install and once-per-run are derivable, but install legality still belongs to LegalActions.",
  },
  onr_v1_048_poltergeist: {
    migrationPriority: "P2",
    migrationRisk: "low",
    fieldCategories: ["safe_generated_now", "legacy_keep_for_compat"],
    recommendedMigrationBatch: 2,
    rationale:
      "Dedicated trash-credit facts are mechanical and stable, but currently less critical than active consumer-facing effect classes.",
  },
  "onr_v1_050_r-and-d-protocol-files": {
    migrationPriority: "P2",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Topdeck info and access replacement are mechanical, but the successful-run condition must remain LegalAction-gated.",
  },
  "onr_v1_057_scatter-shot": {
    migrationPriority: "P2",
    migrationRisk: "low",
    fieldCategories: ["safe_generated_now", "legacy_keep_for_compat"],
    recommendedMigrationBatch: 2,
    rationale:
      "Dedicated trash-credit facts are mechanical and stable, but currently less critical than active consumer-facing effect classes.",
  },
  "onr_v1_059_self-modifying-code": {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "overlay_only",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 2,
    rationale:
      "Search and targetProfiles.installCost=normal are now aligned; actual installation still remains LegalAction-gated.",
  },
  "onr_v1_192_corporate-boon": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Scored-agenda activated extra-action facts are deterministic and high-value for later generated mechanical fields.",
  },
  "onr_v1_193_corporate-coup": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Scored-agenda counter-economy facts are deterministic and high-value for later generated mechanical fields.",
  },
  "onr_v1_199_employee-empowerment": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Scored-agenda draw facts are deterministic and high-value for later generated mechanical fields.",
  },
  "onr_v1_207_netwatch-operations-office": {
    migrationPriority: "P0",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Scored-agenda trace/tag facts are derivable, but trace success must stay runtime/LegalAction context.",
  },
  "onr_v1_208_on-call-solo-team": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Scored-agenda tagged-runner damage payoff has clear active consumer value and low semantic ambiguity.",
  },
  "onr_v1_210_political-overthrow": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Scored-agenda economy action is deterministic and a good first-batch generated mechanical field.",
  },
  "onr_v1_217_strike-force-kali": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Scored-agenda tagged-runner damage payoff has clear active consumer value and low semantic ambiguity.",
  },
  onr_v1_274_tutor: {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 4,
    rationale:
      "Future-run ICE pressure is mechanically recognizable, but the current derived fact remains coarse and encounter-state dependent.",
  },
  "onr_v1_276_viral-15": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 4,
    rationale:
      "Future-run program trash and jack-out tax are useful, but should wait for stronger future-run descriptor handling.",
  },
  onr_v1_277_virizz: {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 4,
    rationale:
      "Future-run tax is mechanically recognizable, but the current derived fact remains coarse and encounter-state dependent.",
  },
  "onr_v1_283_audit-of-call-records": {
    migrationPriority: "P0",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Trace/tag operation facts are clear generated candidates, with trace success remaining runtime context.",
  },
  "onr_v1_284_chance-observation": {
    migrationPriority: "P0",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Trace/tag operation facts are clear generated candidates, with trace success remaining runtime context.",
  },
  "onr_v1_285_closed-accounts": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Tagged-runner counter-economy payoff is exact, consumer-relevant and low ambiguity.",
  },
  "onr_v1_302_scorched-earth": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Tagged-runner damage payoff is exact, consumer-relevant and low ambiguity.",
  },
  "onr_v1_355_crystal-palace-station-grid": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "generated_with_board_context",
      "overlay_only",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 3,
    rationale:
      "Run tax is mechanical, but remote-protection value and active/rezzed context must remain board-aware.",
  },
  "onr_v1_366_red-herrings": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "generated_with_board_context",
      "overlay_only",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 3,
    rationale:
      "Agenda steal tax and access condition are mechanical, but remote-protection value remains contextual overlay.",
  },
  "onr_v1_370_tesseract-fort-construction": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Additional fort ICE subroutine is mechanically derivable, but active/rezzed/server context must remain board-aware.",
  },
  "onr_v1_361_namatoki-plaza": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Remote capacity and score-support mechanics are derivable, while actual remote safety remains board and server context.",
  },
  "onr_v1_359_jenny-jett": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Successful-run future-encounter support is mechanically recognizable, but hidden HQ choice and runpath context stay runtime-owned.",
  },
  "onr_v1_363_olivia-salazar": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "During-run source-bound rez discount is mechanical, but payment and temporary derez legality remain engine context.",
  },
  "onr_v1_367_rio-de-janeiro-city-grid": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Pass-rezzed-ICE random stop pressure is mechanically derivable, but concrete random outcome and path impact stay runtime context.",
  },
  "onr_v1_317_data-masons": {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Wall rez discount and wall strength modifiers are stable generated ICE-modifier facts.",
  },
  "onr_v1_350_antiquated-interface-routines": {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Same-fort ICE strength modifier is mechanically derivable and low-risk when board/server context remains explicit.",
  },
  "onr_v1_312_chicago-branch": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Activated advancement-counter placement is a stable mechanical score-acceleration fact; closeout valuation stays strategic.",
  },
};

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function stableStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(repoPath(relativePath), stableStringify(value), "utf8");
}

function sortStrings(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function countBy(values) {
  return Object.fromEntries(
    [
      ...values.reduce(
        (counts, value) => counts.set(value, (counts.get(value) ?? 0) + 1),
        new Map(),
      ),
    ].sort(([left], [right]) => left.localeCompare(right)),
  );
}

function orderedCounts(counts, keys) {
  return Object.fromEntries(keys.map((key) => [key, counts[key] ?? 0]));
}

function overlayMap() {
  const map = new Map();
  for (const overlayPath of OVERLAY_PATHS) {
    const json = readJson(overlayPath);
    for (const card of json.cards ?? []) {
      map.set(card.cardId, {
        path: overlayPath,
        fields: Object.keys(card.overlay ?? {}).sort(),
      });
    }
  }
  return map;
}

function activeMechanicalFields(activeHint) {
  return MECHANICAL_FIELDS.filter((field) => activeHint?.[field] !== undefined);
}

function warningGroups(card) {
  return Object.fromEntries(
    [...(card.warnings ?? [])]
      .reduce(
        (counts, warning) =>
          counts.set(
            warning.classification,
            (counts.get(warning.classification) ?? 0) + 1,
          ),
        new Map(),
      )
      .entries(),
  );
}

function doNotMigrateFields(card, activeHint, overlay) {
  const fields = ["aiSupportStatus", "roles", "planRoles"];
  for (const field of [
    "requiredMechanics",
    "valueHints",
    "riskTags",
    "scenarioRefs",
  ]) {
    if (activeHint?.[field] !== undefined) fields.push(field);
  }
  fields.push(...(overlay?.fields ?? []));
  if (card.strategyFieldsFromOverlay?.length > 0)
    fields.push(...card.strategyFieldsFromOverlay);
  return sortStrings(fields);
}

export function buildGeneratedFactMigrationPriorityReport() {
  const compiledReport = readJson(COMPILED_INDEX_REPORT_PATH);
  const derivedReport = readJson(DERIVED_FACTS_REPORT_PATH);
  const pilotCards = readJson(PILOT_CARDS_PATH);
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const activeHintById = new Map(
    (activeHints.cards ?? []).map((hint) => [hint.cardId, hint]),
  );
  const derivedById = new Map(
    (derivedReport.cards ?? []).map((card) => [card.cardId, card]),
  );
  const overlayById = overlayMap();

  const candidateIds = sortStrings(
    (compiledReport.migrationCandidates ?? []).map((card) => card.cardId),
  );
  const cards = candidateIds.map((cardId) => {
    const compiledCard = compiledReport.cards.find(
      (card) => card.cardId === cardId,
    );
    const derivedCard = derivedById.get(cardId);
    const activeHint = activeHintById.get(cardId);
    const overlay = overlayById.get(cardId);
    const policy = PRIORITY_POLICY[cardId];
    if (!compiledCard || !derivedCard || !activeHint || !policy) {
      throw new Error(`Missing migration priority input for ${cardId}`);
    }
    return {
      cardId,
      title: compiledCard.title,
      side: compiledCard.side,
      cardType: compiledCard.cardType,
      migrationPriority: policy.migrationPriority,
      migrationRisk: policy.migrationRisk,
      fieldCategories: sortStrings(policy.fieldCategories),
      generatedFields: sortStrings(compiledCard.generatedFields ?? []),
      generatedMechanicalFacts: sortStrings(
        compiledCard.mechanicalFactsFromGenerated ?? [],
      ),
      monolithFields: activeMechanicalFields(activeHint),
      duplicatedActiveMechanicalFields: sortStrings(
        compiledCard.duplicatedActiveMechanicalFields ?? [],
      ),
      generatedOnlyFields: sortStrings(compiledCard.generatedOnlyFields ?? []),
      overlayFields: sortStrings(overlay?.fields ?? []),
      warningGroups: warningGroups(compiledCard),
      recommendedNextAction: compiledCard.recommendedNextAction,
      migrationReadiness: compiledCard.migrationReadiness,
      recommendedMigrationBatch: policy.recommendedMigrationBatch,
      rationale: policy.rationale,
      doNotMigrateFields: doNotMigrateFields(compiledCard, activeHint, overlay),
      derivedRationale: derivedCard.rationale,
    };
  });

  const batchPlan = [1, 2, 3, 4, 5].map((batch) => ({
    batch,
    title: {
      1: "Scored-agenda and tag/trace/punish generated facts",
      2: "BreakerProfile, targetProfiles and dedicated credits",
      3: "RemoteRole run_tax and agenda_steal_tax",
      4: "Future-run and future-encounter ICE facts",
      5: "Remaining longtail mechanical facts",
    }[batch],
    cardIds: cards
      .filter((card) => card.recommendedMigrationBatch === batch)
      .map((card) => card.cardId),
  }));

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    taskId: "Aufgabe 002",
    sourceReport: COMPILED_INDEX_REPORT_PATH,
    sources: {
      compiledIndexReport: COMPILED_INDEX_REPORT_PATH,
      derivedFactsReport: DERIVED_FACTS_REPORT_PATH,
      pilotCards: PILOT_CARDS_PATH,
      manualOverlays: OVERLAY_PATHS,
      activeHints: ACTIVE_HINTS_PATH,
    },
    mode: "read-only prioritization; no active hint migration, no runtime compile, no planner or consumer binding",
    candidateCount: cards.length,
    priorityCounts: orderedCounts(
      countBy(cards.map((card) => card.migrationPriority)),
      ["P0", "P1", "P2", "P3"],
    ),
    fieldCategoryCounts: countBy(cards.flatMap((card) => card.fieldCategories)),
    riskCounts: orderedCounts(
      countBy(cards.map((card) => card.migrationRisk)),
      ["low", "medium", "high"],
    ),
    batchPlan,
    cards,
  };
}

function parseArgs(argv) {
  const options = {
    check: false,
    write: false,
    json: false,
    reportPath: DEFAULT_REPORT_PATH,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") options.check = true;
    else if (arg === "--write") options.write = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--report") {
      index += 1;
      if (!argv[index]) throw new Error("--report requires a path");
      options.reportPath = argv[index];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!options.check && !options.write && !options.json) options.check = true;
  return options;
}

export function runCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const report = buildGeneratedFactMigrationPriorityReport();
  const serializedReport = stableStringify(report);

  if (options.write) writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed generated-fact migration priority report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated migration priority report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-migration-priority.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_MIGRATION_PRIORITY OK candidates=${report.candidateCount} P0=${report.priorityCounts.P0 ?? 0} P1=${report.priorityCounts.P1 ?? 0} P2=${report.priorityCounts.P2 ?? 0} P3=${report.priorityCounts.P3 ?? 0}\n`,
    );
  }
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
