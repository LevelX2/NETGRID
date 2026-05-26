import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REVIEW_DATE = "2026-05-25";
const SCHEMA_VERSION = "ai-generated-fact-batch2-dry-run-v1";
const TASK_ID = "Aufgabe 008";
const BATCH_ID = "batch_2_breaker_target_trash_credit";
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const DERIVED_FACTS_REPORT_PATH =
  "docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json";
const MIGRATION_PRIORITY_REPORT_PATH =
  "docs/reviews/ai/ai-generated-fact-migration-priority-report-2026-05-25.json";
const COMPILED_INDEX_REPORT_PATH =
  "docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-008-generated-fact-batch2-dry-run-report-2026-05-25.json";
const OVERLAY_PATHS = ["data/ai/hints/overlays/onr-v1/runner/programs.json"];

const BATCH_CARDS = [
  {
    cardId: "onr_v1_037_japanese-water-torture",
    title: "Japanese Water Torture",
    expectedGroups: ["breaker"],
  },
  {
    cardId: "onr_v1_039_krash",
    title: "Krash",
    expectedGroups: ["breaker"],
  },
  {
    cardId: "onr_v1_043_mystery-box",
    title: "Mystery Box",
    expectedGroups: ["target_profile"],
  },
  {
    cardId: "onr_v1_048_poltergeist",
    title: "Poltergeist",
    expectedGroups: ["trash_credit"],
    expectedTrashCreditTarget: "node",
  },
  {
    cardId: "onr_v1_057_scatter-shot",
    title: "Scatter Shot",
    expectedGroups: ["trash_credit"],
    expectedTrashCreditTarget: "upgrade",
  },
  {
    cardId: "onr_v1_059_self-modifying-code",
    title: "Self-Modifying Code",
    expectedGroups: ["target_profile"],
  },
];
const BATCH_CARD_IDS = new Set(BATCH_CARDS.map((card) => card.cardId));
const IN_SCOPE_EFFECT_KINDS = new Set([
  "breaker",
  "search",
  "topdeck_info",
  "install_discount",
  "trash_credit",
]);
const IN_SCOPE_CONDITION_KINDS = new Set(["requires_during_run"]);
const BOARD_CONTEXT_KINDS = new Set([
  "search",
  "install_discount",
  "requires_during_run",
]);
const TARGET_PROFILE_CONTEXT_FIELDS = new Set([
  "installsTarget",
  "installCost",
  "oncePerRun",
  "shuffleAfter",
  "showToOpponent",
  "targetCardType",
  "zone",
]);
const KNOWN_PRIORITIES = new Set(["P0", "P1", "P2", "P3"]);
const KNOWN_RISKS = new Set(["low", "medium", "high"]);
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
]);
const FORBIDDEN_PREVIEW_FIELDS = new Set([
  "aiSupportStatus",
  "roles",
  "planRoles",
  "lineSupport",
  "quality",
  "manualNotes",
  "strategicNotes",
  "descriptorGaps",
  "opponentSignals",
  "remoteRole",
]);

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

function sortByKey(items) {
  return [...items].sort((left, right) =>
    JSON.stringify(left).localeCompare(JSON.stringify(right)),
  );
}

function countByKind(items) {
  return Object.fromEntries(
    [
      ...items
        .reduce(
          (counts, item) =>
            counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1),
          new Map(),
        )
        .entries(),
    ].sort(([left], [right]) => left.localeCompare(right)),
  );
}

function cleanObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, child]) =>
        child !== undefined &&
        !(Array.isArray(child) && child.length === 0) &&
        !(
          child &&
          typeof child === "object" &&
          Object.keys(child).length === 0
        ),
    ),
  );
}

function normalizeEffect(effect, source = "unknown") {
  return cleanObject({
    type: "effect",
    kind: effect.kind,
    timing: effect.timing,
    scope: effect.scope,
    resource: effect.resource,
    amount: effect.amount,
    repeatable: effect.repeatable,
    finite: effect.finite,
    confidence: effect.confidence,
    source: effect.source ?? source,
  });
}

function normalizeCondition(condition, source = "unknown") {
  return cleanObject({
    type: "condition",
    kind: condition.kind,
    confidence: condition.confidence,
    source: condition.source ?? source,
  });
}

function normalizeBreakerProfile(profile, source = "unknown") {
  return cleanObject({
    type: "breakerProfile",
    coverage: profile.coverage ? [...profile.coverage].sort() : undefined,
    baseStrength: profile.baseStrength,
    pumpCost: profile.pumpCost,
    breakCost: profile.breakCost,
    sideEffects: profile.sideEffects
      ? [...profile.sideEffects].sort()
      : undefined,
    confidence: profile.confidence,
    source: profile.source ?? source,
  });
}

function normalizeTargetProfile(profile, source = "unknown") {
  return cleanObject({
    type: "targetProfile",
    zone: profile.zone,
    lookCount: profile.lookCount,
    targetCardType: profile.targetCardType,
    installsTarget: profile.installsTarget,
    installCost: profile.installCost,
    oncePerRun: profile.oncePerRun,
    shuffleAfter: profile.shuffleAfter,
    showToOpponent: profile.showToOpponent,
    source: profile.source ?? source,
  });
}

function normalizeCostProfile(profile, source = "unknown") {
  return cleanObject({
    type: "costProfile",
    clicks: profile.clicks,
    credits: profile.credits,
    memory: profile.memory,
    reserveRisk: profile.reserveRisk,
    opportunityCost: profile.opportunityCost,
    source: profile.source ?? source,
  });
}

function factLabel(fact) {
  if (fact.type === "effect" || fact.type === "condition") {
    return `${fact.type}:${fact.kind}`;
  }
  return fact.type;
}

function exactKey(fact) {
  const { confidence, source, ...stableFact } = fact;
  return JSON.stringify(stableFact);
}

function semanticKey(fact) {
  if (fact.type === "effect") {
    if (fact.kind === "install_discount") {
      return [
        fact.type,
        fact.kind,
        fact.timing ?? "",
        fact.resource ?? "",
      ].join(":");
    }
    return [
      fact.type,
      fact.kind,
      fact.timing ?? "",
      fact.scope ?? "",
      fact.resource ?? "",
    ].join(":");
  }
  if (fact.type === "condition") return `${fact.type}:${fact.kind}`;
  if (fact.type === "breakerProfile") {
    return `${fact.type}:${(fact.coverage ?? []).join(",")}`;
  }
  if (fact.type === "targetProfile") {
    return [
      fact.type,
      fact.zone ?? "",
      fact.targetCardType ?? "",
      fact.installsTarget ?? "",
      fact.installCost ?? "",
    ].join(":");
  }
  return fact.type;
}

function generatedFactsInScope(derivedCard) {
  const facts = [];
  for (const effect of derivedCard?.derivedFacts?.effects ?? []) {
    if (IN_SCOPE_EFFECT_KINDS.has(effect.kind)) {
      facts.push(normalizeEffect(effect, "derived.effects"));
    }
  }
  for (const condition of derivedCard?.derivedFacts?.conditions ?? []) {
    if (IN_SCOPE_CONDITION_KINDS.has(condition.kind)) {
      facts.push(normalizeCondition(condition, "derived.conditions"));
    }
  }
  if (derivedCard?.derivedFacts?.breakerProfile) {
    facts.push(
      normalizeBreakerProfile(
        derivedCard.derivedFacts.breakerProfile,
        "derived.breakerProfile",
      ),
    );
  }
  for (const targetProfile of derivedCard?.derivedFacts?.targetProfiles ?? []) {
    facts.push(normalizeTargetProfile(targetProfile, "derived.targetProfiles"));
  }
  if (Object.keys(derivedCard?.derivedFacts?.costProfile ?? {}).length > 0) {
    facts.push(
      normalizeCostProfile(
        derivedCard.derivedFacts.costProfile,
        "derived.costProfile",
      ),
    );
  }
  return sortByKey(facts);
}

function activeMechanicalFieldsInScope(activeHint) {
  const facts = [];
  for (const effect of activeHint?.effects ?? []) {
    if (IN_SCOPE_EFFECT_KINDS.has(effect.kind)) {
      facts.push(normalizeEffect(effect, "active.effects"));
    }
  }
  for (const condition of activeHint?.conditions ?? []) {
    if (IN_SCOPE_CONDITION_KINDS.has(condition.kind)) {
      facts.push(normalizeCondition(condition, "active.conditions"));
    }
  }
  if (activeHint?.breakerProfile) {
    facts.push(
      normalizeBreakerProfile(
        activeHint.breakerProfile,
        "active.breakerProfile",
      ),
    );
  }
  for (const targetProfile of activeHint?.targetProfiles ?? []) {
    facts.push(normalizeTargetProfile(targetProfile, "active.targetProfiles"));
  }
  if (activeHint?.costProfile) {
    facts.push(
      normalizeCostProfile(activeHint.costProfile, "active.costProfile"),
    );
  }
  return sortByKey(facts);
}

function readManualOverlayCardIds() {
  const ids = new Set();
  for (const overlayPath of OVERLAY_PATHS) {
    if (!fs.existsSync(repoPath(overlayPath))) continue;
    const overlay = readJson(overlayPath);
    for (const card of overlay.cards ?? []) ids.add(card.cardId);
  }
  return ids;
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

function addIssue(target, kind, message, details = {}) {
  target.push({ kind, message, ...details });
}

function splitGeneratedFacts(facts) {
  return {
    effects: sortByKey(
      facts
        .filter((fact) => fact.type === "effect")
        .map(({ type, source, confidence, ...effect }) => effect),
    ),
    conditions: sortByKey(
      facts
        .filter((fact) => fact.type === "condition")
        .map(({ type, source, confidence, ...condition }) => condition),
    ),
    breakerProfile:
      facts.find((fact) => fact.type === "breakerProfile") ?? undefined,
    targetProfiles: sortByKey(
      facts.filter((fact) => fact.type === "targetProfile"),
    ),
    costProfile: facts.find((fact) => fact.type === "costProfile") ?? undefined,
  };
}

function stripFactMetadata(fact) {
  const { type, source, confidence, ...payload } = fact;
  return payload;
}

function previewFromActive(activeHint, generatedAdditions) {
  const generated = splitGeneratedFacts(generatedAdditions);
  return cleanObject({
    cardId: activeHint.cardId,
    side: activeHint.side,
    cardType: activeHint.cardType,
    effects: sortByKey([...(activeHint.effects ?? []), ...generated.effects]),
    conditions: sortByKey([
      ...(activeHint.conditions ?? []),
      ...generated.conditions,
    ]),
    breakerProfile:
      activeHint.breakerProfile ??
      (generated.breakerProfile
        ? stripFactMetadata(generated.breakerProfile)
        : undefined),
    targetProfiles: sortByKey([
      ...(activeHint.targetProfiles ?? []),
      ...generated.targetProfiles.map(stripFactMetadata),
    ]),
    costProfile:
      activeHint.costProfile ??
      (generated.costProfile
        ? stripFactMetadata(generated.costProfile)
        : undefined),
  });
}

function compareGeneratedToActive(generatedFacts, activeFacts) {
  const exactActive = new Map(
    activeFacts.map((fact) => [exactKey(fact), fact]),
  );
  const semanticActive = new Map(
    activeFacts.map((fact) => [semanticKey(fact), fact]),
  );
  const generatedSemanticKeys = new Set(generatedFacts.map(semanticKey));
  const confirmedByGeneratedFacts = [];
  const wouldAddToPreview = [];
  const shapeDifferences = [];
  const targetProfileDifferences = [];
  const trashCreditDifferences = [];
  const costProfileDifferences = [];
  const warnings = [];
  const infos = [];

  for (const generated of generatedFacts) {
    const exact = exactActive.get(exactKey(generated));
    const semantic = semanticActive.get(semanticKey(generated));
    const label = factLabel(generated);

    if (exact) {
      confirmedByGeneratedFacts.push({
        relation: "exact",
        fact: label,
        generated,
        active: exact,
      });
      addIssue(
        warnings,
        "generated_fact_already_present",
        `Generated ${label} is already present in active monolith.`,
        { fact: label },
      );
    } else if (semantic) {
      confirmedByGeneratedFacts.push({
        relation: "equivalent_shape_difference",
        fact: label,
        generated,
        active: semantic,
      });
      const difference = { fact: label, generated, active: semantic };
      shapeDifferences.push(difference);
      addIssue(
        warnings,
        "shape_difference",
        `Generated ${label} matches active monolith semantically but has a different shape.`,
        { fact: label },
      );
      if (generated.kind === "trash_credit") {
        trashCreditDifferences.push({
          ...difference,
          reason:
            "Generated trash-credit fact confirms the source but does not yet carry target/recurring amount shape.",
        });
        addIssue(
          warnings,
          "trash_credit_target_shape_difference",
          "Dedicated trash-credit target/amount shape is not fully present in generated facts.",
          { fact: label },
        );
      }
    } else if (generated.type === "targetProfile") {
      wouldAddToPreview.push(generated);
      targetProfileDifferences.push({
        fact: label,
        generated,
        active: null,
        reason:
          "Target profile is generated from implementation but is not present as a structured active monolith field.",
      });
      addIssue(
        warnings,
        "target_profile_shape_difference",
        "Generated target profile would be added to the preview only.",
        { fact: label },
      );
      addIssue(
        warnings,
        "generated_fact_added_in_preview",
        "Generated target profile would be added to the dry-run preview.",
        { fact: label },
      );
    } else {
      wouldAddToPreview.push(generated);
      addIssue(
        warnings,
        "generated_fact_added_in_preview",
        `Generated ${label} would be added to the preview.`,
        { fact: label },
      );
    }

    if (
      BOARD_CONTEXT_KINDS.has(generated.kind) ||
      (generated.type === "targetProfile" &&
        Object.keys(generated).some((field) =>
          TARGET_PROFILE_CONTEXT_FIELDS.has(field),
        ))
    ) {
      addIssue(
        warnings,
        "board_context_required",
        `Generated ${label} must remain gated by board state or LegalActions.`,
        { fact: label },
      );
    }
    addIssue(
      warnings,
      "consumer_active_for_fact_type",
      `Generated ${label} belongs to the Batch-2 diagnostic/consumer-relevant fact set.`,
      { fact: label },
    );
  }

  for (const active of activeFacts) {
    if (
      active.type === "costProfile" &&
      !generatedFacts.some((fact) => fact.type === "costProfile")
    ) {
      costProfileDifferences.push({
        fact: "costProfile",
        active,
        generated: null,
        reason:
          "Active monolith costProfile remains legacy/diagnostic; Batch 2 only migrates generated costProfile if the derived report contains one.",
      });
      addIssue(
        warnings,
        "cost_profile_shape_difference",
        "Active costProfile is not generated in Batch 2 and remains monolith-only for compatibility.",
        { fact: "costProfile" },
      );
      continue;
    }
    if (
      ["effect", "condition", "breakerProfile", "targetProfile"].includes(
        active.type,
      ) &&
      !generatedSemanticKeys.has(semanticKey(active))
    ) {
      addIssue(
        warnings,
        "monolith_only_mechanical_fact",
        `Active monolith ${factLabel(active)} is in Batch-2 scope but not generated.`,
        { fact: factLabel(active) },
      );
    }
  }

  if (wouldAddToPreview.length === 0) {
    addIssue(
      infos,
      "no_change_needed",
      "Dry-run preview adds no new Batch-2 fact.",
    );
  }
  addIssue(
    infos,
    "preview_only",
    "Dry-run does not write ai-card-hints-active.json.",
  );
  addIssue(
    infos,
    "legacy_keep_for_compat",
    "roles, planRoles and aiSupportStatus remain active monolith fields.",
  );

  return {
    confirmedByGeneratedFacts: sortByKey(confirmedByGeneratedFacts),
    wouldAddToPreview: sortByKey(wouldAddToPreview),
    shapeDifferences: sortByKey(shapeDifferences),
    targetProfileDifferences: sortByKey(targetProfileDifferences),
    trashCreditDifferences: sortByKey(trashCreditDifferences),
    costProfileDifferences: sortByKey(costProfileDifferences),
    warnings: sortByKey(warnings),
    infos: sortByKey(infos),
  };
}

function classifyReadiness(card) {
  if (card.conflicts.length > 0) return "not_ready";
  if (
    card.shapeDifferences.length > 0 ||
    card.targetProfileDifferences.length > 0 ||
    card.trashCreditDifferences.length > 0 ||
    card.costProfileDifferences.length > 0
  ) {
    return "needs_diff_review";
  }
  if (
    card.warnings.some((warning) => warning.kind === "board_context_required")
  ) {
    return "ready_but_board_context_required";
  }
  return "ready_for_future_generated_migration";
}

function validateGuardrails(batchCard, generatedFacts, hardErrors) {
  const effects = generatedFacts.filter((fact) => fact.type === "effect");
  const targetProfiles = generatedFacts.filter(
    (fact) => fact.type === "targetProfile",
  );

  if (
    batchCard.cardId === "onr_v1_059_self-modifying-code" &&
    effects.some((effect) => effect.kind === "install_discount")
  ) {
    addIssue(
      hardErrors,
      "self_modifying_code_install_discount_regression",
      "Self-Modifying Code must not generate install_discount.",
      { cardId: batchCard.cardId },
    );
  }
  if (batchCard.cardId === "onr_v1_043_mystery-box") {
    if (!effects.some((effect) => effect.kind === "install_discount")) {
      addIssue(
        hardErrors,
        "mystery_box_missing_install_discount",
        "Mystery Box must keep its generated free-install discount fact.",
        { cardId: batchCard.cardId },
      );
    }
    if (!targetProfiles.some((profile) => profile.installCost === "free")) {
      addIssue(
        hardErrors,
        "mystery_box_install_cost_not_free",
        "Mystery Box target profile must keep installCost=free.",
        { cardId: batchCard.cardId },
      );
    }
  }
  if (batchCard.cardId === "onr_v1_059_self-modifying-code") {
    if (!targetProfiles.some((profile) => profile.installCost === "normal")) {
      addIssue(
        hardErrors,
        "self_modifying_code_install_cost_not_normal",
        "Self-Modifying Code target profile must keep installCost=normal.",
        { cardId: batchCard.cardId },
      );
    }
  }
  for (const profile of targetProfiles) {
    if (
      batchCard.expectedTrashCreditTarget === "node" &&
      profile.targetCardType === "upgrade"
    ) {
      addIssue(
        hardErrors,
        "poltergeist_upgrade_only_trash_credit_regression",
        "Poltergeist must not be marked as upgrade-only trash-credit support.",
        { cardId: batchCard.cardId },
      );
    }
    if (
      batchCard.expectedTrashCreditTarget === "upgrade" &&
      profile.targetCardType === "node"
    ) {
      addIssue(
        hardErrors,
        "scatter_shot_node_only_trash_credit_regression",
        "Scatter Shot must not be marked as node-only trash-credit support.",
        { cardId: batchCard.cardId },
      );
    }
  }
}

export function buildBatchTwoDryRunReport() {
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const derivedReport = readJson(DERIVED_FACTS_REPORT_PATH);
  const priorityReport = readJson(MIGRATION_PRIORITY_REPORT_PATH);
  const compiledIndexReport = readJson(COMPILED_INDEX_REPORT_PATH);
  const overlayCardIds = readManualOverlayCardIds();
  const activeById = new Map(
    (activeHints.cards ?? []).map((card) => [card.cardId, card]),
  );
  const derivedById = new Map(
    (derivedReport.cards ?? []).map((card) => [card.cardId, card]),
  );
  const priorityById = new Map(
    (priorityReport.cards ?? []).map((card) => [card.cardId, card]),
  );
  const compiledById = new Map(
    (compiledIndexReport.cards ?? []).map((card) => [card.cardId, card]),
  );
  const hardErrors = [];

  for (const priorityCard of priorityReport.cards ?? []) {
    if (
      priorityCard.recommendedMigrationBatch === 2 &&
      !BATCH_CARD_IDS.has(priorityCard.cardId)
    ) {
      addIssue(
        hardErrors,
        "unexpected_batch_two_priority_card",
        "Migration-priority report contains a Batch-2 card outside the approved Aufgabe-008 scope.",
        { cardId: priorityCard.cardId },
      );
    }
  }

  const cards = BATCH_CARDS.map((batchCard) => {
    const activeHint = activeById.get(batchCard.cardId);
    const derivedCard = derivedById.get(batchCard.cardId);
    const priorityCard = priorityById.get(batchCard.cardId);
    const compiledCard = compiledById.get(batchCard.cardId);
    const activeHintFound = Boolean(activeHint);
    const derivedFactsFound = Boolean(derivedCard);
    const migrationPriorityFound = Boolean(priorityCard);
    const compiledIndexFound = Boolean(compiledCard);

    if (!activeHintFound) {
      addIssue(
        hardErrors,
        "batch_card_missing_active_hint",
        "Batch-2 card is missing from active monolith.",
        { cardId: batchCard.cardId },
      );
    }
    if (!derivedFactsFound) {
      addIssue(
        hardErrors,
        "batch_card_missing_derived_facts",
        "Batch-2 card is missing from derived facts report.",
        { cardId: batchCard.cardId },
      );
    }
    if (!migrationPriorityFound) {
      addIssue(
        hardErrors,
        "batch_card_missing_priority",
        "Batch-2 card is missing from migration priority report.",
        { cardId: batchCard.cardId },
      );
    }
    if (!compiledIndexFound) {
      addIssue(
        hardErrors,
        "batch_card_missing_compiled_index",
        "Batch-2 card is missing from compiled index report.",
        { cardId: batchCard.cardId },
      );
    }
    if (
      priorityCard?.recommendedMigrationBatch !== undefined &&
      priorityCard.recommendedMigrationBatch !== 2
    ) {
      addIssue(
        hardErrors,
        "batch_card_wrong_priority_batch",
        "Batch-2 card is not marked for recommendedMigrationBatch=2.",
        { cardId: batchCard.cardId },
      );
    }
    if (
      priorityCard?.migrationPriority &&
      !KNOWN_PRIORITIES.has(priorityCard.migrationPriority)
    ) {
      addIssue(
        hardErrors,
        "unknown_migration_priority",
        `Unknown migration priority ${priorityCard.migrationPriority}.`,
        { cardId: batchCard.cardId },
      );
    }
    if (
      priorityCard?.migrationRisk &&
      !KNOWN_RISKS.has(priorityCard.migrationRisk)
    ) {
      addIssue(
        hardErrors,
        "unknown_migration_risk",
        `Unknown migration risk ${priorityCard.migrationRisk}.`,
        { cardId: batchCard.cardId },
      );
    }

    const generatedFacts = generatedFactsInScope(derivedCard);
    const activeFacts = activeMechanicalFieldsInScope(activeHint);
    validateGuardrails(batchCard, generatedFacts, hardErrors);

    for (const fieldPath of collectKeyPaths(
      generatedFacts,
      HIDDEN_INFO_FIELDS,
    )) {
      addIssue(
        hardErrors,
        "generated_hidden_info_field",
        `Generated facts contain hidden-info field ${fieldPath}.`,
        { cardId: batchCard.cardId, fieldPath },
      );
    }

    const comparison = compareGeneratedToActive(generatedFacts, activeFacts);
    const compiledAfterMigrationPreview = previewFromActive(
      activeHint,
      comparison.wouldAddToPreview,
    );
    for (const fieldPath of collectKeyPaths(
      compiledAfterMigrationPreview,
      FORBIDDEN_PREVIEW_FIELDS,
    )) {
      addIssue(
        hardErrors,
        "forbidden_preview_field",
        `Dry-run preview contains forbidden field ${fieldPath}.`,
        { cardId: batchCard.cardId, fieldPath },
      );
    }

    if (overlayCardIds.has(batchCard.cardId)) {
      addIssue(
        comparison.infos,
        "manual_overlay_present",
        "Manual overlay exists for strategic/quality notes only.",
      );
      addIssue(
        comparison.infos,
        "manual_overlay_not_runtime",
        "Manual overlay is not used by runtime or planner.",
      );
    }
    if (batchCard.expectedTrashCreditTarget) {
      addIssue(
        comparison.warnings,
        "descriptor_context_required",
        `Dedicated trash-credit target remains card-specific context (${batchCard.expectedTrashCreditTarget}); dry-run does not infer payment legality.`,
        { expectedTrashCreditTarget: batchCard.expectedTrashCreditTarget },
      );
    }

    const conflicts = [];
    const card = {
      cardId: batchCard.cardId,
      title: batchCard.title,
      priority: priorityCard?.migrationPriority ?? "unknown",
      risk: priorityCard?.migrationRisk ?? "unknown",
      batchIncluded: true,
      expectedGroups: batchCard.expectedGroups,
      expectedTrashCreditTarget: batchCard.expectedTrashCreditTarget,
      activeHintFound,
      derivedFactsFound,
      migrationPriorityFound,
      compiledIndexFound,
      manualOverlayFound: overlayCardIds.has(batchCard.cardId),
      generatedFactsInScope: generatedFacts,
      activeMechanicalFieldsInScope: activeFacts,
      compiledAfterMigrationPreview,
      confirmedByGeneratedFacts: comparison.confirmedByGeneratedFacts,
      wouldAddToPreview: comparison.wouldAddToPreview,
      wouldRemoveFromManualFuture: sortByKey(
        activeFacts.filter((fact) => fact.type !== "costProfile"),
      ),
      shapeDifferences: comparison.shapeDifferences,
      targetProfileDifferences: comparison.targetProfileDifferences,
      trashCreditDifferences: comparison.trashCreditDifferences,
      costProfileDifferences: comparison.costProfileDifferences,
      conflicts,
      warnings: sortByKey(comparison.warnings),
      infos: sortByKey(comparison.infos),
    };
    return {
      ...card,
      readiness: classifyReadiness(card),
    };
  });

  const warnings = sortByKey(
    cards.flatMap((card) =>
      card.warnings.map((warning) => ({ cardId: card.cardId, ...warning })),
    ),
  );
  const infos = sortByKey(
    cards.flatMap((card) =>
      card.infos.map((info) => ({ cardId: card.cardId, ...info })),
    ),
  );
  const conflicts = sortByKey(
    cards.flatMap((card) =>
      card.conflicts.map((conflict) => ({ cardId: card.cardId, ...conflict })),
    ),
  );
  const previewChangedCards = cards.filter(
    (card) => card.wouldAddToPreview.length > 0,
  );

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    taskId: TASK_ID,
    batch: BATCH_ID,
    sources: {
      activeHintsPath: ACTIVE_HINTS_PATH,
      derivedFactsReportPath: DERIVED_FACTS_REPORT_PATH,
      migrationPriorityReportPath: MIGRATION_PRIORITY_REPORT_PATH,
      compiledIndexReportPath: COMPILED_INDEX_REPORT_PATH,
      overlayPaths: OVERLAY_PATHS,
    },
    mode: "read-only dry-run; does not write ai-card-hints-active.json and has no runtime, planner or consumer binding",
    hardErrorCount: hardErrors.length,
    warningCount: warnings.length,
    infoCount: infos.length,
    warningCountsByKind: countByKind(warnings),
    infoCountsByKind: countByKind(infos),
    batchCardCount: cards.length,
    previewChangedCardCount: previewChangedCards.length,
    confirmedFactCount: cards.reduce(
      (sum, card) => sum + card.confirmedByGeneratedFacts.length,
      0,
    ),
    previewAddedFactCount: cards.reduce(
      (sum, card) => sum + card.wouldAddToPreview.length,
      0,
    ),
    conflictCount: conflicts.length,
    shapeDifferenceCount: cards.reduce(
      (sum, card) => sum + card.shapeDifferences.length,
      0,
    ),
    targetProfileDifferenceCount: cards.reduce(
      (sum, card) => sum + card.targetProfileDifferences.length,
      0,
    ),
    trashCreditDifferenceCount: cards.reduce(
      (sum, card) => sum + card.trashCreditDifferences.length,
      0,
    ),
    costProfileDifferenceCount: cards.reduce(
      (sum, card) => sum + card.costProfileDifferences.length,
      0,
    ),
    boardContextRequiredCount:
      countByKind(warnings).board_context_required ?? 0,
    manualOverlayPresentCount: cards.filter((card) => card.manualOverlayFound)
      .length,
    readinessCounts: Object.fromEntries(
      [
        ...cards
          .reduce(
            (counts, card) =>
              counts.set(card.readiness, (counts.get(card.readiness) ?? 0) + 1),
            new Map(),
          )
          .entries(),
      ].sort(([left], [right]) => left.localeCompare(right)),
    ),
    boardContextRules: [
      {
        kind: "breakerProfile",
        rule: "Generated BreakerProfile describes static card function only; actual break legality remains LegalAction, run, encounter and Engine state.",
      },
      {
        kind: "targetProfiles",
        rule: "Generated TargetProfiles describe search/install target shape; actual search and install legality remain Engine/LegalAction state. SMC installCost=normal is not a discount; Mystery Box installCost=free is local to that effect.",
      },
      {
        kind: "trashCredits",
        rule: "Generated trash-credit facts describe a dedicated credit source; actual payment remains Cost/LegalAction-gated and card-specific node/upgrade targeting must not be swapped.",
      },
      {
        kind: "legacyCompatibility",
        rule: "roles, planRoles, aiSupportStatus, lineSupport and quality remain active monolith/overlay fields and are not changed by this dry-run.",
      },
    ],
    batchCardIds: cards.map((card) => card.cardId),
    cards,
    errors: sortByKey(hardErrors),
    warnings,
    infos,
    conflicts,
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
    else if (arg === "--pilot-only") {
      // Batch 2 is intentionally fixed to the six Derived-Facts pilot cards.
    } else if (arg === "--report") {
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
  const report = buildBatchTwoDryRunReport();
  const serializedReport = stableStringify(report);

  if (options.write) writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed Batch-2 dry-run report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated Batch-2 dry-run report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch2-dry-run.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH2_DRY_RUN OK batchCards=${report.batchCardCount} errors=${report.hardErrorCount} warnings=${report.warningCount} previewAddedFacts=${report.previewAddedFactCount}\n`,
    );
  }

  if (report.hardErrorCount > 0 || report.conflictCount > 0) {
    process.exitCode = 1;
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
