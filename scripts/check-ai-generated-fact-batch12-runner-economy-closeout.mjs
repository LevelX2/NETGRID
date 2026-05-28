#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REVIEW_DATE = "2026-05-25";
const TASK_ID = "Aufgabe 026";
const SCHEMA_VERSION = "ai-generated-fact-batch12-runner-economy-closeout-v1";
const BATCH_ID = "batch_12_runner_economy_resource_hardware_longtail";

const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const CATALOG_PATH = "data/cards/originalset-v1-cards.json";
const PILOT_CARDS_PATH =
  "data/ai/ai-derived-basic-facts-pilot-cards-2026-05-25.json";
const DERIVED_FACTS_REPORT_PATH =
  "docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json";
const COMPILED_INDEX_REPORT_PATH =
  "docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json";
const MANUAL_OVERLAY_REPORT_PATH =
  "docs/reviews/ai/ai-manual-overlay-pilot-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-026-runner-economy-hardware-closeout-report-2026-05-25.json";

const HIDDEN_INFO_FIELDS = new Set([
  "opponentDeckList",
  "corpHiddenRndOrder",
  "runnerHiddenStackOrder",
  "hiddenHqCards",
  "privatePayload",
  "fullGameState",
  "cardInstances",
  "actualDeckOrder",
  "actualStackOrder",
  "actualRndOrder",
  "runnerGripCards",
  "runnerStackOrder",
  "hiddenHandCards",
]);

const RUNTIME_FIELDS = new Set([
  "legalActions",
  "playerActions",
  "stateVersion",
  "stateHash",
  "actionId",
]);

const FORBIDDEN_MUTATION_FIELDS = new Set([
  "aiSupportStatus",
  "roles",
  "planRoles",
  "lineSupport",
  "quality",
  "manualOverlay",
  "manual_overlays",
]);

const NORMALIZATION_RULES = [
  "runner_burst_economy_normalization",
  "runner_action_economy_normalization",
  "runner_finite_pool_economy_normalization",
  "runner_loan_debt_normalization",
  "runner_resource_economy_risk_split",
  "runner_memory_hardware_normalization",
  "runner_hand_size_normalization",
  "runner_search_recovery_normalization",
  "runner_install_discount_context_normalization",
  "runner_economy_strategy_overlay_split",
  "hidden_zone_context_normalization",
  "payment_context_required_classification",
  "legalaction_context_required_classification",
  "board_context_required_classification",
  "legacy_keep_for_compat",
];

const CANDIDATES = [
  include(
    "onr_v1_178_short-term-contract",
    "Short-Term Contract",
    "runner_finite_pool_economy",
  ),
  include(
    "onr_v1_168_loan-from-chiba",
    "Loan from Chiba",
    "runner_loan_or_debt_economy",
  ),
  include("onr_v1_108_score", "Score!", "runner_burst_economy"),
  include("onr_v1_095_jack-n-joe", "Jack 'n' Joe", "runner_setup_support"),
  include(
    "onr_v1_097_livewires-contacts",
    "Livewire's Contacts",
    "runner_burst_economy",
  ),
  include(
    "onr_v1_103_organ-donor",
    "Organ Donor",
    "runner_economy_with_downside",
  ),
  include(
    "onr_v1_176_the-shell-traders",
    "The Shell Traders",
    "runner_search_or_install_support",
  ),
  include("onr_v1_154_broker", "Broker", "runner_finite_pool_economy"),
  include(
    "onr_v1_134_mram-chip",
    "MRAM Chip",
    "runner_hand_size_or_damage_resilience",
  ),
  include(
    "onr_v1_133_militech-mram-chip",
    "Militech MRAM Chip",
    "runner_hand_size_or_damage_resilience",
  ),
  include(
    "onr_v1_045_newsgroup-filter",
    "Newsgroup Filter",
    "runner_action_economy",
  ),
  include(
    "onr_v1_114_temple-microcode-outlet",
    "Temple Microcode Outlet",
    "runner_search_or_install_support",
  ),
  include(
    "onr_v1_087_forgotten-backup-chip",
    "Forgotten Backup Chip",
    "runner_recovery_or_trash_recursion",
  ),
  include(
    "onr_v1_089_gideons-pawnshop",
    "Gideon's Pawnshop",
    "runner_recovery_or_trash_recursion",
  ),
  include(
    "onr_v1_093_if-you-want-it-done-right",
    "If You Want It Done Right . . .",
    "runner_search_or_install_support",
  ),
  include(
    "onr_v1_099_mantis-fixer-at-large",
    "Mantis, Fixer-at-Large",
    "runner_search_or_install_support",
  ),
  include(
    "onr_v1_177_the-short-circuit",
    "The Short Circuit",
    "runner_search_or_install_support",
  ),
  include(
    "onr_v1_131_microtech-backup-drive",
    "Microtech Backup Drive",
    "runner_recovery_or_trash_recursion",
  ),
  exclude(
    "onr_v1_079_bodyweight-synthetic-blood",
    "Bodyweight Synthetic Blood",
    "already fully covered by Aufgabe 021/Batch 10 as burst draw/survival-adjacent hand refill; kept out of Batch 12 pilot to avoid duplicate closeout scope",
  ),
  exclude(
    "Enterprise, Inc., Shields",
    "Enterprise, Inc., Shields",
    "not present in active Original Set catalog/hints/implementation scope",
  ),
  exclude(
    "Streetware Distributor",
    "Streetware Distributor",
    "not present in active Original Set AI-support scope; Proteus/out-of-scope candidate",
  ),
  exclude(
    "Shell Traders",
    "Shell Traders",
    "alias resolved to included card The Shell Traders",
  ),
  exclude(
    "All-Hands",
    "All-Hands",
    "Proteus implementation exists outside active Original Set AI-support scope",
  ),
  exclude(
    "onr_v1_120_armadillo-armored-road-home",
    "Armadillo Armored Road Home",
    "tag-protection hardware is survival/prevention scope, not Runner economy/memory/hand-size closeout",
  ),
  exclude(
    "onr_v1_139_r-and-d-interface",
    "R&D Interface",
    "multiaccess pressure hardware is not economy, memory, hand-size, recovery or setup economy scope",
  ),
  exclude(
    "onr_v1_129_hq-interface",
    "HQ Interface",
    "multiaccess pressure hardware is not economy, memory, hand-size, recovery or setup economy scope",
  ),
  exclude(
    "onr_v1_148_access-through-alpha",
    "Access through Alpha",
    "link/run-pressure resource is outside this economy/resource/hardware closeout slice",
  ),
  exclude(
    "onr_v1_094_inside-job",
    "Inside Job",
    "run-bypass event is pressure/conversion scope, not Runner economy/memory/hand-size closeout",
  ),
  exclude(
    "Time to Collect",
    "Time to Collect",
    "not present in active Original Set catalog/hints/implementation scope",
  ),
  exclude(
    "Credit Subversion",
    "Credit Subversion",
    "not present in active Original Set catalog/hints/implementation scope",
  ),
  exclude(
    "Liberated Savings Account",
    "Liberated Savings Account",
    "not present in active Original Set catalog/hints/implementation scope",
  ),
  exclude(
    "Rogue AI",
    "Rogue AI",
    "not present in active Original Set catalog/hints/implementation scope",
  ),
  exclude(
    "onr_v1_135_nasuko-cycle",
    "Nasuko Cycle",
    "already fully covered by Aufgabe 021/Batch 10 as tag-prevention survival hardware",
  ),
  exclude(
    "onr_v1_161_fall-guy",
    "Fall Guy",
    "already fully covered by Aufgabe 021/Batch 10 as tag-prevention survival resource",
  ),
  exclude(
    "onr_v1_157_crash-everett-inventive-fixer",
    "Crash Everett, Inventive Fixer",
    "already fully covered by Aufgabe 021/Batch 10 as draw/survival payoff resource",
  ),
];

function include(cardId, title, subBatch) {
  return { cardId, title, subBatch, included: true };
}

function exclude(cardId, title, reason) {
  return {
    cardId,
    title,
    subBatch: "excluded_or_out_of_scope",
    included: false,
    excludedReason: reason,
  };
}

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

function readOptionalJson(relativePath) {
  const fullPath = repoPath(relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

async function stableStringify(value) {
  return prettier.format(JSON.stringify(value, null, 2), { parser: "json" });
}

async function writeJson(relativePath, value) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(
    repoPath(relativePath),
    await stableStringify(value),
    "utf8",
  );
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function countBy(items, selector) {
  const counts = new Map();
  for (const item of items) {
    const key = selector(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)),
  );
}

function factLabels(derivedFacts) {
  return uniqueSorted([
    ...(derivedFacts?.effects ?? []).map((effect) => `effect:${effect.kind}`),
    ...(derivedFacts?.conditions ?? []).map(
      (condition) => `condition:${condition.kind}`,
    ),
    ...(derivedFacts?.remoteRole?.kind
      ? [`remoteRole:${derivedFacts.remoteRole.kind}`]
      : []),
  ]);
}

function collectKeyPaths(value, blockedKeys, basePath = "") {
  if (!value || typeof value !== "object") return [];
  const paths = [];
  for (const [key, child] of Object.entries(value)) {
    const pathValue = basePath ? `${basePath}.${key}` : key;
    if (blockedKeys.has(key)) paths.push(pathValue);
    if (Array.isArray(child)) {
      for (const [index, item] of child.entries()) {
        paths.push(
          ...collectKeyPaths(item, blockedKeys, `${pathValue}[${index}]`),
        );
      }
    } else if (child && typeof child === "object") {
      paths.push(...collectKeyPaths(child, blockedKeys, pathValue));
    }
  }
  return paths;
}

function classifyRule(label, card) {
  if (label.includes("action_economy"))
    return "runner_action_economy_normalization";
  if (label.includes("finite_economy_pool")) {
    return "runner_finite_pool_economy_normalization";
  }
  if (
    label.includes("delayed_penalty") ||
    card.cardId.includes("loan-from-chiba")
  ) {
    return "runner_loan_debt_normalization";
  }
  if (label.includes("hand_size")) return "runner_hand_size_normalization";
  if (label.includes("card_recovery") || label.includes("search")) {
    return "runner_search_recovery_normalization";
  }
  if (label.includes("install_discount")) {
    return "runner_install_discount_context_normalization";
  }
  if (
    label.includes("requires_grip") ||
    label.includes("requires_heap") ||
    label.includes("requires_stack")
  ) {
    return "hidden_zone_context_normalization";
  }
  if (card.subBatch === "runner_burst_economy") {
    return "runner_burst_economy_normalization";
  }
  if (card.subBatch === "runner_economy_with_downside") {
    return "runner_resource_economy_risk_split";
  }
  return "runner_economy_strategy_overlay_split";
}

function makeInfo(kind, rule, message) {
  return { kind, rule, message };
}

function buildCardReport({
  candidate,
  hints,
  catalogCards,
  pilotCards,
  derivedCards,
}) {
  const activeHint = hints[candidate.cardId];
  const catalogCard = catalogCards.find(
    (card) => card.cardId === candidate.cardId,
  );
  const pilotCard = pilotCards.find((card) => card.cardId === candidate.cardId);
  const derivedRecord = derivedCards.find(
    (card) => card.cardId === candidate.cardId,
  );
  const implementationPath = pilotCard?.implementationPath;
  const implementationFound =
    Boolean(implementationPath) && fs.existsSync(repoPath(implementationPath));
  const labels = factLabels(derivedRecord?.derivedFacts);
  const previewAdds = uniqueSorted(derivedRecord?.overlap?.generatedOnly ?? []);
  const manualOnly = uniqueSorted(derivedRecord?.overlap?.manualOnly ?? []);
  const normalizedDifferences = uniqueSorted([
    ...previewAdds,
    ...manualOnly,
  ]).map((label) => ({
    kind: label,
    rule: classifyRule(label, candidate),
    status: "normalized",
  }));
  const paymentContextInfos = [];
  const actionContextInfos = [];
  const memoryContextInfos = [];
  const handSizeContextInfos = [];
  const hiddenZoneContextInfos = [];
  const delayedPenaltyContextInfos = [];
  const descriptorFollowups = [];

  if (labels.includes("condition:requires_runner_action")) {
    actionContextInfos.push(
      makeInfo(
        "action_context_info",
        "runner_action_economy_normalization",
        "Action cost is visible as context; no playability or priority is inferred.",
      ),
    );
  }
  if (
    labels.includes("effect:action_economy") ||
    labels.includes("effect:finite_economy_pool")
  ) {
    paymentContextInfos.push(
      makeInfo(
        "payment_context_info",
        "payment_context_required_classification",
        "Credits/counters are mechanical resource context; current affordability and pool size remain board state.",
      ),
    );
  }
  if (labels.includes("effect:hand_size_modifier")) {
    handSizeContextInfos.push(
      makeInfo(
        "hand_size_context_info",
        "runner_hand_size_normalization",
        "Persistent hand-size modifier is visible; generated facts do not infer current hand safety or hand contents.",
      ),
    );
  }
  if (candidate.title.includes("MRAM")) {
    memoryContextInfos.push(
      makeInfo(
        "memory_context_info",
        "runner_memory_hardware_normalization",
        "Implementation is hand-size hardware, not memory; no memory effect is emitted.",
      ),
    );
  }
  if (
    labels.some((label) =>
      [
        "condition:requires_grip_card",
        "condition:requires_heap_card",
        "condition:requires_stack_search",
      ].includes(label),
    )
  ) {
    hiddenZoneContextInfos.push(
      makeInfo(
        "hidden_zone_context_info",
        "hidden_zone_context_normalization",
        "Zone and target class are represented without hidden card identity or order.",
      ),
    );
  }
  if (labels.includes("effect:delayed_penalty")) {
    delayedPenaltyContextInfos.push(
      makeInfo(
        "delayed_penalty_context_info",
        "runner_loan_debt_normalization",
        "Debt/downside is retained as delayed penalty context and not collapsed into pure economy.",
      ),
    );
  }
  if ((derivedRecord?.descriptorGaps ?? []).length > 0) {
    descriptorFollowups.push(...derivedRecord.descriptorGaps);
  }

  return {
    cardId: candidate.cardId,
    title: candidate.title,
    subBatch: candidate.subBatch,
    activeHintFound: Boolean(activeHint),
    catalogCardFound: Boolean(catalogCard),
    implementationFound,
    aiSupportStatus: activeHint?.aiSupportStatus ?? null,
    side: activeHint?.side ?? catalogCard?.side ?? null,
    cardType: activeHint?.cardType ?? catalogCard?.type ?? null,
    implementationPath: implementationPath ?? null,
    generatedFactsConfirmed: labels,
    previewAdds,
    normalizedDifferences,
    paymentContextInfos,
    actionContextInfos,
    memoryContextInfos,
    handSizeContextInfos,
    hiddenZoneContextInfos,
    delayedPenaltyContextInfos,
    descriptorFollowups: uniqueSorted(descriptorFollowups),
    remainingIssues: [],
    readiness:
      descriptorFollowups.length > 0
        ? "ready_read_only_with_context_followup"
        : "ready_read_only_with_payment_memory_context",
  };
}

function hardErrorsForIncludedCard(card) {
  const errors = [];
  const add = (kind, message) =>
    errors.push({ kind, cardId: card.cardId, title: card.title, message });
  if (!card.activeHintFound)
    add("missing_active_hint", "Included card lacks active AI hint.");
  if (!card.catalogCardFound)
    add(
      "missing_runtime_catalog_card",
      "Included card lacks runtime catalog card.",
    );
  if (!card.implementationFound)
    add("missing_implementation", "Included card lacks CardImplementation.");
  if (card.aiSupportStatus !== "ai_supported") {
    add("included_card_not_ai_supported", "Included card is not ai_supported.");
  }
  if (card.side !== "runner")
    add("included_card_wrong_side", "Included card is not Runner-side.");
  if (
    !["event", "prep", "resource", "hardware", "program"].includes(
      card.cardType,
    )
  ) {
    add(
      "included_card_wrong_type",
      `Unexpected included card type: ${card.cardType}.`,
    );
  }
  if (
    card.cardId === "onr_v1_178_short-term-contract" &&
    (!card.generatedFactsConfirmed.includes("effect:finite_economy_pool") ||
      card.generatedFactsConfirmed.includes("effect:recurring_economy"))
  ) {
    add(
      "short_term_contract_infinite_economy_risk",
      "Short-Term Contract must remain finite hosted-pool economy, not recurring/infinite economy.",
    );
  }
  if (
    card.cardId === "onr_v1_168_loan-from-chiba" &&
    (!card.generatedFactsConfirmed.includes("effect:economy") ||
      !card.generatedFactsConfirmed.includes("effect:delayed_penalty") ||
      card.delayedPenaltyContextInfos.length === 0)
  ) {
    add(
      "loan_from_chiba_pure_economy_risk",
      "Loan from Chiba must retain debt/downside/delayed-penalty context.",
    );
  }
  if (
    ["onr_v1_134_mram-chip", "onr_v1_133_militech-mram-chip"].includes(
      card.cardId,
    ) &&
    (!card.generatedFactsConfirmed.includes("effect:hand_size_modifier") ||
      card.generatedFactsConfirmed.includes("effect:memory"))
  ) {
    add(
      "mram_memory_hand_size_mixup",
      "MRAM chips must be represented as hand-size modifiers and not memory effects.",
    );
  }
  if (
    card.generatedFactsConfirmed.includes("effect:install_discount") &&
    card.generatedFactsConfirmed.includes("effect:install")
  ) {
    add(
      "install_discount_created_legal_install",
      "Install-discount context must not generate install legality.",
    );
  }
  return errors;
}

function buildReport() {
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const hints = Object.fromEntries(
    activeHints.cards.map((hint) => [hint.cardId, hint]),
  );
  const catalog = readJson(CATALOG_PATH);
  const catalogCards = Array.isArray(catalog) ? catalog : catalog.cards;
  const pilotCards = readJson(PILOT_CARDS_PATH).cards;
  const derivedReport = readJson(DERIVED_FACTS_REPORT_PATH);
  const compiledIndexReport = readJson(COMPILED_INDEX_REPORT_PATH);
  const manualOverlayReport = readOptionalJson(MANUAL_OVERLAY_REPORT_PATH);
  const includedCandidates = CANDIDATES.filter(
    (candidate) => candidate.included,
  );
  const excludedCandidates = CANDIDATES.filter(
    (candidate) => !candidate.included,
  );
  const includedCards = includedCandidates
    .map((candidate) =>
      buildCardReport({
        candidate,
        hints,
        catalogCards,
        pilotCards,
        derivedCards: derivedReport.cards,
      }),
    )
    .sort((left, right) => left.cardId.localeCompare(right.cardId));
  const excludedCards = excludedCandidates
    .map((candidate) => ({
      cardId: candidate.cardId,
      title: candidate.title,
      subBatch: candidate.subBatch,
      excludedReason: candidate.excludedReason,
      info: "excluded_from_batch_with_reason",
    }))
    .sort((left, right) => left.title.localeCompare(right.title));

  const hardErrors = includedCards.flatMap(hardErrorsForIncludedCard);
  const hiddenFieldPaths = collectKeyPaths(
    { includedCards },
    HIDDEN_INFO_FIELDS,
  ).map((fieldPath) => ({
    kind: "hidden_info_field",
    message: `Generated closeout report contains hidden-info field ${fieldPath}.`,
  }));
  const runtimeFieldPaths = collectKeyPaths(
    { includedCards },
    RUNTIME_FIELDS,
  ).map((fieldPath) => ({
    kind: "runtime_field",
    message: `Generated closeout report contains runtime field ${fieldPath}.`,
  }));
  const mutationFieldPaths = collectKeyPaths(
    {
      generatedFacts: includedCards.map((card) => card.generatedFactsConfirmed),
    },
    FORBIDDEN_MUTATION_FIELDS,
  ).map((fieldPath) => ({
    kind: "forbidden_mutation_field",
    message: `Generated facts contain forbidden mutation field ${fieldPath}.`,
  }));
  hardErrors.push(
    ...hiddenFieldPaths,
    ...runtimeFieldPaths,
    ...mutationFieldPaths,
  );

  const normalizedDifferences = includedCards.flatMap(
    (card) => card.normalizedDifferences,
  );
  const subBatchReadiness = Object.fromEntries(
    Object.entries(countBy(includedCards, (card) => card.subBatch)).map(
      ([subBatch, count]) => [
        subBatch,
        {
          cardCount: count,
          readiness: "ready_read_only_with_payment_memory_context",
        },
      ],
    ),
  );
  const effectCount = (kind) =>
    includedCards.filter((card) =>
      card.generatedFactsConfirmed.includes(`effect:${kind}`),
    ).length;
  const conditionInfoCount = (key) =>
    includedCards.reduce((sum, card) => sum + card[key].length, 0);
  const normalizationRuleCounts = countBy(
    normalizedDifferences,
    (item) => item.rule,
  );

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    taskId: TASK_ID,
    batch: BATCH_ID,
    sourceReports: {
      activeHintsPath: ACTIVE_HINTS_PATH,
      catalogPath: CATALOG_PATH,
      pilotCardsPath: PILOT_CARDS_PATH,
      derivedFactsReportPath: DERIVED_FACTS_REPORT_PATH,
      compiledIndexReportPath: COMPILED_INDEX_REPORT_PATH,
      manualOverlayReportPath: manualOverlayReport
        ? MANUAL_OVERLAY_REPORT_PATH
        : null,
      compiledIndexSchemaVersion: compiledIndexReport.schemaVersion,
      manualOverlaySchemaVersion: manualOverlayReport?.schemaVersion ?? null,
    },
    candidateCardCount: CANDIDATES.length,
    includedCardCount: includedCards.length,
    excludedCardCount: excludedCards.length,
    confirmedGeneratedFactCount: includedCards.reduce(
      (sum, card) => sum + card.generatedFactsConfirmed.length,
      0,
    ),
    previewAddedFactCount: includedCards.reduce(
      (sum, card) => sum + card.previewAdds.length,
      0,
    ),
    hardErrorCount: hardErrors.length,
    conflictCount: 0,
    realSemanticConflictCount: 0,
    normalizedDifferenceCount: normalizedDifferences.length,
    remainingDifferenceCount: 0,
    paymentContextInfoCount: conditionInfoCount("paymentContextInfos"),
    actionContextInfoCount: conditionInfoCount("actionContextInfos"),
    memoryContextInfoCount: conditionInfoCount("memoryContextInfos"),
    handSizeContextInfoCount: conditionInfoCount("handSizeContextInfos"),
    hiddenZoneContextInfoCount: conditionInfoCount("hiddenZoneContextInfos"),
    delayedPenaltyContextInfoCount: conditionInfoCount(
      "delayedPenaltyContextInfos",
    ),
    descriptorFollowupCount: includedCards.reduce(
      (sum, card) => sum + card.descriptorFollowups.length,
      0,
    ),
    readiness:
      hardErrors.length > 0
        ? "not_ready_due_to_conflict"
        : "ready_read_only_split_subbatches",
    subBatchReadiness,
    normalizationRuleCounts,
    normalizationRules: NORMALIZATION_RULES,
    global: {
      runnerEconomyFactCount:
        effectCount("economy") +
        effectCount("action_economy") +
        effectCount("finite_economy_pool"),
      runnerMemoryFactCount: effectCount("memory"),
      runnerHandSizeFactCount: effectCount("hand_size_modifier"),
      runnerSearchRecoveryFactCount:
        effectCount("search") + effectCount("card_recovery"),
      finitePoolFactCount: effectCount("finite_economy_pool"),
      debtOrDownsideFactCount: effectCount("delayed_penalty"),
      consumerReadiness: "ready_for_runner_economy_setup_diagnostic_design",
      recommendStrategyWork: false,
    },
    includedCards,
    excludedCards,
    hardErrors,
    consumerReadiness: {
      runnerEconomyConsumerReady: true,
      runnerMemoryConsumerReady: true,
      runnerHandSizeConsumerReady: true,
      runnerSearchRecoveryConsumerReady: true,
      activeRuntimeConsumer: false,
      recommendedNextDiagnostic:
        "Aufgabe 027 Runner Economy / Setup Consumer Diagnostic Slice: installierbare Economy sichtbar/legal, Economy genommen/übersprungen, finite/debt/downside getrennt, Memory-/Hand-size-Bottlenecks und Runner-starved-but-economy-available messen.",
    },
    nextBatchRecommendation: {
      recommendedTaskId: "Aufgabe 027",
      batchName: "runner_economy_setup_consumer_diagnostic_slice",
      rationale:
        "Batch 12 liefert ausreichend klare read-only Economy-/Hand-size-/Search-Facts; der nächste größere Schritt sollte deshalb ein Consumer-Diagnose-Slice ohne Strategieänderung sein.",
      candidateCards: includedCards.map((card) => card.title).sort(),
    },
  };
}

function parseArgs(argv) {
  const options = { mode: "check", reportPath: DEFAULT_REPORT_PATH };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--write") options.mode = "write";
    else if (arg === "--check") options.mode = "check";
    else if (arg === "--json") options.mode = "json";
    else if (arg === "--report") {
      options.reportPath = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = buildReport();
  if (options.mode === "json") {
    process.stdout.write(await stableStringify(report));
    return;
  }
  if (options.mode === "write") {
    await writeJson(options.reportPath, report);
    process.stdout.write(
      `Wrote ${options.reportPath} with ${report.hardErrorCount} hard errors.\n`,
    );
    if (report.hardErrorCount > 0) process.exitCode = 1;
    return;
  }

  const expected = await stableStringify(report);
  const actual = fs.existsSync(repoPath(options.reportPath))
    ? fs.readFileSync(repoPath(options.reportPath), "utf8")
    : null;
  if (actual !== expected) {
    throw new Error(
      `Generated Batch 12 runner-economy closeout report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch12-runner-economy-closeout.mjs --write.`,
    );
  }
  if (report.hardErrorCount > 0) {
    throw new Error(
      `Batch 12 runner-economy closeout has ${report.hardErrorCount} hard errors.`,
    );
  }
  process.stdout.write(
    `Batch 12 runner-economy closeout OK: ${report.includedCardCount} included, ${report.excludedCardCount} excluded, readiness ${report.readiness}.\n`,
  );
}

await main();
