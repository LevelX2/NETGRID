import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REVIEW_DATE = "2026-05-25";
const SCHEMA_VERSION = "ai-generated-fact-batch3-dry-run-v1";
const TASK_ID = "Aufgabe 012";
const BATCH_ID = "batch_3_remote_role_future_run_ice";
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const DERIVED_FACTS_REPORT_PATH =
  "docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json";
const MIGRATION_PRIORITY_REPORT_PATH =
  "docs/reviews/ai/ai-generated-fact-migration-priority-report-2026-05-25.json";
const COMPILED_INDEX_REPORT_PATH =
  "docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json";
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/aufgabe-012-generated-fact-batch3-dry-run-report-2026-05-25.json";
const OVERLAY_PATHS = [
  "data/ai/hints/overlays/onr-v1/corp/upgrades.json",
  "data/ai/hints/overlays/onr-v1/runner/programs.json",
];

const BATCH_CARDS = [
  {
    cardId: "onr_v1_274_tutor",
    title: "Tutor",
    expectedGroups: ["future_run_ice"],
    expectedContext: "future_run_ice",
  },
  {
    cardId: "onr_v1_277_virizz",
    title: "Virizz",
    expectedGroups: ["future_run_ice", "run_tax"],
    expectedContext: "future_run_ice",
  },
  {
    cardId: "onr_v1_276_viral-15",
    title: "Viral 15",
    expectedGroups: ["future_run_ice", "run_tax", "program_trash"],
    expectedContext: "future_run_ice",
  },
  {
    cardId: "onr_v1_355_crystal-palace-station-grid",
    title: "Crystal Palace Station Grid",
    expectedGroups: ["remote_role", "run_tax"],
    expectedRemoteRoleKind: "run_tax",
    expectedContext: "remote_upgrade",
  },
  {
    cardId: "onr_v1_366_red-herrings",
    title: "Red Herrings",
    expectedGroups: ["remote_role", "agenda_steal_tax"],
    expectedRemoteRoleKind: "agenda_steal_tax",
    expectedContext: "remote_upgrade",
  },
];
const BATCH_CARD_IDS = new Set(BATCH_CARDS.map((card) => card.cardId));
const IN_SCOPE_EFFECT_KINDS = new Set([
  "future_run_effect",
  "future_encounter_effect",
  "run_tax",
  "program_trash",
  "remote_protection",
]);
const IN_SCOPE_CONDITION_KINDS = new Set([
  "requires_during_run",
  "requires_accessed_card",
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
  "breakerProfile",
  "targetProfiles",
  "costProfile",
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

function normalizeRemoteRole(remoteRole, source = "unknown") {
  return cleanObject({
    type: "remoteRole",
    kind: remoteRole.kind,
    threatLevel: remoteRole.threatLevel,
    serverScope: remoteRole.serverScope,
    activeWhile: remoteRole.activeWhile,
    sameServerAsSource: remoteRole.sameServerAsSource,
    confidence: remoteRole.confidence,
    source: remoteRole.source ?? source,
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
    return [
      fact.type,
      fact.kind,
      fact.timing ?? "",
      fact.scope ?? "",
      fact.resource ?? "",
    ].join(":");
  }
  if (fact.type === "condition") return `${fact.type}:${fact.kind}`;
  if (fact.type === "remoteRole") return `${fact.type}:${fact.kind}`;
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
  if (derivedCard?.derivedFacts?.remoteRole) {
    facts.push(
      normalizeRemoteRole(
        derivedCard.derivedFacts.remoteRole,
        "derived.remoteRole",
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
  if (activeHint?.remoteRole) {
    facts.push(normalizeRemoteRole(activeHint.remoteRole, "active.remoteRole"));
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
    remoteRole: facts.find((fact) => fact.type === "remoteRole"),
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
    remoteRole:
      activeHint.remoteRole ??
      (generated.remoteRole
        ? stripFactMetadata(generated.remoteRole)
        : undefined),
  });
}

function classifyDifference(generated, active) {
  if (generated.type === "remoteRole") return "remote_role_shape_difference";
  if (
    generated.type === "effect" &&
    ["future_run_effect", "program_trash"].includes(generated.kind)
  ) {
    return "future_run_shape_difference";
  }
  if (
    generated.type === "effect" &&
    generated.kind === "future_encounter_effect"
  ) {
    return "future_encounter_shape_difference";
  }
  if (
    generated.type === "effect" &&
    generated.kind === "run_tax" &&
    generated.scope === "run_path"
  ) {
    return "future_run_shape_difference";
  }
  if (
    generated.type === "effect" &&
    generated.kind === "run_tax" &&
    ["fort", "accessed_card"].includes(generated.scope)
  ) {
    return "remote_role_shape_difference";
  }
  if (active?.type === "remoteRole") return "remote_role_shape_difference";
  return "shape_difference";
}

function addContextWarnings(batchCard, generated, warnings) {
  const label = factLabel(generated);
  if (batchCard.expectedContext === "future_run_ice") {
    addIssue(
      warnings,
      "board_context_required",
      `Generated ${label} must not be interpreted without current run, encounter and LegalAction state.`,
      { fact: label },
    );
    addIssue(
      warnings,
      "runpath_context_required",
      `Generated ${label} depends on remaining run path, later ICE or future encounter context.`,
      { fact: label },
    );
    return;
  }
  if (batchCard.expectedContext === "remote_upgrade") {
    addIssue(
      warnings,
      "board_context_required",
      `Generated ${label} must remain gated by current fort/server board state.`,
      { fact: label },
    );
    if (generated.type === "remoteRole" || generated.timing === "persistent") {
      addIssue(
        warnings,
        "active_state_context_required",
        `Generated ${label} depends on rezzed/active/same-server context and is not a static playability signal.`,
        { fact: label },
      );
    }
  }
}

function compareGeneratedToActive(batchCard, generatedFacts, activeFacts) {
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
  const remoteRoleDifferences = [];
  const futureRunDifferences = [];
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
      const differenceKind = classifyDifference(generated, semantic);
      shapeDifferences.push(difference);
      addIssue(
        warnings,
        "shape_difference",
        `Generated ${label} matches active monolith semantically but has a different shape.`,
        { fact: label },
      );
      if (differenceKind === "remote_role_shape_difference") {
        remoteRoleDifferences.push(difference);
        addIssue(
          warnings,
          "remote_role_shape_difference",
          `Generated ${label} needs RemoteRole shape review before any migration.`,
          { fact: label },
        );
      }
      if (
        differenceKind === "future_run_shape_difference" ||
        differenceKind === "future_encounter_shape_difference"
      ) {
        futureRunDifferences.push(difference);
        addIssue(
          warnings,
          differenceKind,
          `Generated ${label} needs future-run/runpath shape review before any migration.`,
          { fact: label },
        );
      }
    } else {
      wouldAddToPreview.push(generated);
      addIssue(
        warnings,
        "generated_fact_added_in_preview",
        `Generated ${label} would be added to the preview.`,
        { fact: label },
      );
      if (generated.type === "remoteRole") {
        remoteRoleDifferences.push({ fact: label, generated, active: null });
        addIssue(
          warnings,
          "remote_role_shape_difference",
          "Generated remoteRole would be added to the preview only.",
          { fact: label },
        );
      }
    }

    addContextWarnings(batchCard, generated, warnings);
    addIssue(
      warnings,
      "consumer_active_for_fact_type",
      `Generated ${label} belongs to the Batch-3 diagnostic/consumer-relevant fact set.`,
      { fact: label },
    );
  }

  for (const active of activeFacts) {
    if (!generatedSemanticKeys.has(semanticKey(active))) {
      const label = factLabel(active);
      addIssue(
        warnings,
        "monolith_only_mechanical_fact",
        `Active monolith ${label} is in Batch-3 scope but not generated.`,
        { fact: label },
      );
      if (label === "effect:remote_protection") {
        addIssue(
          warnings,
          "descriptor_context_required",
          "Remote protection is present in active hints but remains strategic/contextual and is not generated in Batch 3.",
          { fact: label },
        );
      }
    }
  }

  if (wouldAddToPreview.length === 0) {
    addIssue(
      infos,
      "no_change_needed",
      "Dry-run preview adds no new Batch-3 fact.",
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
    remoteRoleDifferences: sortByKey(remoteRoleDifferences),
    futureRunDifferences: sortByKey(futureRunDifferences),
    warnings: sortByKey(warnings),
    infos: sortByKey(infos),
  };
}

function classifyReadiness(card) {
  if (card.conflicts.length > 0) return "not_ready";
  if (
    card.expectedContext === "future_run_ice" &&
    card.warnings.some((warning) =>
      [
        "future_run_shape_difference",
        "runpath_context_required",
        "descriptor_context_required",
      ].includes(warning.kind),
    )
  ) {
    return "needs_future_run_descriptor_review";
  }
  if (
    card.shapeDifferences.length > 0 ||
    card.remoteRoleDifferences.length > 0 ||
    card.futureRunDifferences.length > 0 ||
    card.warnings.some(
      (warning) =>
        warning.kind === "monolith_only_mechanical_fact" ||
        warning.kind === "descriptor_context_required",
    )
  ) {
    return "needs_diff_review";
  }
  if (
    card.warnings.some((warning) =>
      ["board_context_required", "active_state_context_required"].includes(
        warning.kind,
      ),
    )
  ) {
    return "ready_but_board_context_required";
  }
  return "ready_for_future_generated_migration";
}

function validateGuardrails(batchCard, generatedFacts, hardErrors, warnings) {
  const effects = generatedFacts.filter((fact) => fact.type === "effect");
  const remoteRole = generatedFacts.find((fact) => fact.type === "remoteRole");

  if (batchCard.cardId === "onr_v1_355_crystal-palace-station-grid") {
    if (
      effects.some((effect) =>
        ["economy", "counter_economy", "power_counter"].includes(effect.kind),
      )
    ) {
      addIssue(
        hardErrors,
        "crystal_palace_economy_counter_regression",
        "Crystal Palace Station Grid must not be generated as economy/counter support.",
        { cardId: batchCard.cardId },
      );
    }
    if (remoteRole?.kind === "agenda_steal_tax") {
      addIssue(
        hardErrors,
        "crystal_palace_agenda_steal_tax_regression",
        "Crystal Palace Station Grid must not be classified as agenda_steal_tax.",
        { cardId: batchCard.cardId },
      );
    }
  }

  if (batchCard.cardId === "onr_v1_366_red-herrings") {
    if (remoteRole?.kind !== "agenda_steal_tax") {
      addIssue(
        hardErrors,
        "red_herrings_missing_agenda_steal_tax",
        "Red Herrings must keep remoteRole.kind=agenda_steal_tax.",
        { cardId: batchCard.cardId },
      );
    }
    if (
      effects.some((effect) => effect.kind === "run_tax") &&
      remoteRole?.kind === "agenda_steal_tax"
    ) {
      addIssue(
        warnings,
        "remote_role_shape_difference",
        "Red Herrings generated effect uses run_tax shape, but remoteRole keeps agenda_steal_tax semantics.",
        { fact: "effect:run_tax" },
      );
    }
  }

  if (batchCard.expectedContext === "future_run_ice") {
    for (const effect of effects) {
      if (
        effect.timing !== "encounter" ||
        !["run_path", "runner"].includes(effect.scope)
      ) {
        addIssue(
          hardErrors,
          "future_run_ice_direct_legality_regression",
          "Future-run ICE fact must not be interpreted as current direct LegalAction or immediate self-ETR safety.",
          { cardId: batchCard.cardId, fact: factLabel(effect) },
        );
      }
    }
  }
}

export function buildBatchThreeDryRunReport() {
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
        "Batch-3 card is missing from active monolith.",
        { cardId: batchCard.cardId },
      );
    }
    if (!derivedFactsFound) {
      addIssue(
        hardErrors,
        "batch_card_missing_derived_facts",
        "Batch-3 card is missing from derived facts report.",
        { cardId: batchCard.cardId },
      );
    }
    if (!migrationPriorityFound) {
      addIssue(
        hardErrors,
        "batch_card_missing_priority",
        "Batch-3 card is missing from migration priority report.",
        { cardId: batchCard.cardId },
      );
    }
    if (!compiledIndexFound) {
      addIssue(
        hardErrors,
        "batch_card_missing_compiled_index",
        "Batch-3 card is missing from compiled index report.",
        { cardId: batchCard.cardId },
      );
    }
    if (
      priorityCard?.recommendedMigrationBatch !== undefined &&
      ![3, 4].includes(priorityCard.recommendedMigrationBatch)
    ) {
      addIssue(
        hardErrors,
        "batch_card_unexpected_priority_batch",
        "Batch-3 card is not marked for the RemoteRole/future-run priority batches.",
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
    const guardrailWarnings = [];
    validateGuardrails(
      batchCard,
      generatedFacts,
      hardErrors,
      guardrailWarnings,
    );

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

    const comparison = compareGeneratedToActive(
      batchCard,
      generatedFacts,
      activeFacts,
    );
    comparison.warnings.push(...guardrailWarnings);

    for (const descriptorGap of derivedCard?.descriptorGaps ?? []) {
      addIssue(
        comparison.warnings,
        "descriptor_context_required",
        descriptorGap,
        { descriptorGap },
      );
    }
    for (const missingOverlay of derivedCard?.missingManualOverlay ?? []) {
      addIssue(
        comparison.warnings,
        "descriptor_context_required",
        `Manual/strategic overlay remains intentionally separate: ${missingOverlay}.`,
        { missingOverlay },
      );
    }

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

    const conflicts = [];
    const card = {
      cardId: batchCard.cardId,
      title: batchCard.title,
      priority: priorityCard?.migrationPriority ?? "unknown",
      risk: priorityCard?.migrationRisk ?? "unknown",
      batchIncluded: true,
      expectedGroups: batchCard.expectedGroups,
      expectedContext: batchCard.expectedContext,
      expectedRemoteRoleKind: batchCard.expectedRemoteRoleKind,
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
      wouldRemoveFromManualFuture: sortByKey(activeFacts),
      shapeDifferences: comparison.shapeDifferences,
      remoteRoleDifferences: comparison.remoteRoleDifferences,
      futureRunDifferences: comparison.futureRunDifferences,
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
  const warningCountsByKind = countByKind(warnings);

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
    warningCountsByKind,
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
    remoteRoleDifferenceCount: cards.reduce(
      (sum, card) => sum + card.remoteRoleDifferences.length,
      0,
    ),
    futureRunDifferenceCount: cards.reduce(
      (sum, card) => sum + card.futureRunDifferences.length,
      0,
    ),
    boardContextRequiredCount: warningCountsByKind.board_context_required ?? 0,
    runpathContextRequiredCount:
      warningCountsByKind.runpath_context_required ?? 0,
    activeStateContextRequiredCount:
      warningCountsByKind.active_state_context_required ?? 0,
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
    boardRunpathContextRules: [
      {
        kind: "remoteRole",
        rule: "RemoteRole describes static card function; active impact still depends on rezzed, activeWhile, same-server and fort/server context.",
      },
      {
        kind: "crystal_palace_station_grid",
        rule: "Crystal Palace Station Grid is run_tax/break-subroutine-cost context, not economy, counter or agenda_steal_tax.",
      },
      {
        kind: "red_herrings",
        rule: "Red Herrings is agenda_steal_tax in an access/agenda-steal context, not generic run_tax remote safety.",
      },
      {
        kind: "future_run_ice",
        rule: "Future-run ICE facts describe static subroutine/run consequences only; current relevance depends on runpath, remaining ICE, encounter state, unbroken subroutines and LegalActions.",
      },
      {
        kind: "legacyCompatibility",
        rule: "roles, planRoles, aiSupportStatus, lineSupport and quality remain active monolith/overlay fields and are not changed by this dry-run.",
      },
    ],
    batchCardIds: cards.map((card) => card.cardId),
    batchThreeStatus:
      hardErrors.length === 0 && conflicts.length === 0
        ? "needs_diff_review"
        : "not_ready",
    scopeAssessment:
      "Future-run ICE is tractable as a read-only comparison batch, but the three ICE cards need Aufgabe 013 diff/normalization review because runpath descriptor context is intentionally still coarse.",
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
      // Batch 3 is intentionally fixed to five Derived-Facts pilot cards.
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
  const report = buildBatchThreeDryRunReport();
  const serializedReport = stableStringify(report);

  if (options.write) writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed Batch-3 dry-run report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated Batch-3 dry-run report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-batch3-dry-run.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_BATCH3_DRY_RUN OK batchCards=${report.batchCardCount} errors=${report.hardErrorCount} warnings=${report.warningCount} previewAddedFacts=${report.previewAddedFactCount} status=${report.batchThreeStatus}\n`,
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
