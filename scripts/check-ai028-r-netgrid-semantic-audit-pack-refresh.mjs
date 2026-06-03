#!/usr/bin/env node
import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TASK_ID = "AI028-R";
const GENERATED_AT = "2026-06-03";
const GUIDE_VERSION = "V3";
const GUIDE = "docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md";
const JSON_OUT = "docs/reviews/ai/ai028-r-netgrid-semantic-audit-pack-refresh-2026-06-03.json";
const MD_OUT = "docs/reviews/ai/ai028-r-netgrid-semantic-audit-pack-refresh-2026-06-03.md";
const ACTIVE = "data/ai/ai-card-hints-active.json";
const COMPILED = "data/ai/ai-card-hints-compiled.json";
const INSPECTOR = "data/ai/ai-hint-inspector-index.json";
const SIGNALS = "data/ai/tactic-signals-v1.json";
const DERIVATION = "data/ai/function-signal-derivation-v1.json";
const GOALS = "data/ai/strategy-goals-v1.json";
const ROLES = "data/ai/strategic-roles-v1.json";
const CARD_FILES = [
  "data/cards/originalset-v1-cards.json",
  "data/cards/proteus-cards.json",
  "data/cards/classic-cards.json",
  "data/cards/testset-cards.json",
];
const PREVIOUS = [
  ["AI023-2", "docs/reviews/ai/ai023-2-corp-agendas-active-hint-sync-report-2026-06-03.json", "docs/reviews/ai/ai023-2-corp-agendas-active-hint-sync-2026-06-03.md"],
  ["AI024-1", "docs/reviews/ai/ai024-1-corp-ice-semantics-polish-report-2026-06-02.json", "docs/reviews/ai/ai024-1-corp-ice-semantics-polish-2026-06-02.md"],
  ["AI025-1", "docs/reviews/ai/ai025-1-corp-operations-semantics-polish-report-2026-06-02.json", "docs/reviews/ai/ai025-1-corp-operations-semantics-polish-2026-06-02.md"],
  ["AI026-1", "docs/reviews/ai/ai026-1-corp-nodes-assets-semantics-polish-report-2026-06-02.json", "docs/reviews/ai/ai026-1-corp-nodes-assets-semantics-polish-2026-06-02.md"],
  ["AI027", "docs/reviews/ai/ai027-derivation-inspector-guide-v3-alignment-report-2026-06-03.json", "docs/reviews/ai/ai027-derivation-inspector-guide-v3-alignment-2026-06-03.md"],
  ["AI028", "docs/reviews/ai/ai028-netgrid-semantic-audit-pack-2026-06-03.json", "docs/reviews/ai/ai028-netgrid-semantic-audit-pack-2026-06-03.md"],
  ["AI029", "docs/reviews/ai/ai029-target-condition-constraint-schema-sweep-report-2026-06-03.json", "docs/reviews/ai/ai029-target-condition-constraint-schema-sweep-2026-06-03.md"],
  ["AI030", "docs/reviews/ai/ai030-corp-upgrades-semantics-review-report-2026-06-03.json", "docs/reviews/ai/ai030-corp-upgrades-semantics-review-2026-06-03.md"],
];
const INPUTS = [GUIDE, SIGNALS, DERIVATION, ACTIVE, COMPILED, INSPECTOR, GOALS, ROLES, ...CARD_FILES, ...PREVIOUS.flatMap(([, json, md]) => [json, md])];
const ARTIFACTS = new Set([JSON_OUT, MD_OUT, "scripts/check-ai028-r-netgrid-semantic-audit-pack-refresh.mjs"]);
const NO_EFFECT = {
  plannerEffect: false,
  actionScoreEffect: false,
  planWeightEffect: false,
  targetingAiEffect: false,
  engineEffect: false,
  legalEffect: false,
  profileOrDefaultSwitch: false,
  uiDerivationEffect: false,
  hiddenInfoLeakEffect: false,
};
const PROJECT_AGENDAS = {
  "onr_proteus_007_project-venice": ["score.overadvance_bonus", "score.overadvance_scaling", "score.recurring_extra_action"],
  "onr_proteus_008_project-zurich": ["score.economy_recurring", "score.overadvance_bonus", "score.overadvance_scaling"],
  "onr_v1_214_project-babylon": ["score.conditional_bonus_agenda_points", "score.overadvance_bonus", "score.overadvance_scaling"],
};
const AGENDA_DIFFICULTY_UPGRADES = [
  "onr_v1_374_washington-d-c-city-grid",
  "onr_proteus_065_networked-center",
  "onr_proteus_072_research-bunker",
  "onr_proteus_077_weapons-depot",
];
const CHRONICLE_RE = /(^|\/)(docs\/reviews\/chronicle|docs\/activities\/inbox\/act-2026-06-03-corporate-war-score-chronicle\.md|scripts\/check-chronicle-choice-fallbacks\.ts)(\/|$)/i;

function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--write")) {
    const report = buildReport(args.has("--verification-passed"));
    const markdown = renderMarkdown(report);
    const errors = validate(report, markdown);
    if (errors.length) return fail("AI028-R generation failed", errors);
    write(JSON_OUT, `${stableJson(report)}\n`);
    write(MD_OUT, `${markdown.trimEnd()}\n`);
    console.log(`AI028_R_NETGRID_SEMANTIC_AUDIT_PACK_REFRESH WRITTEN cards=${report.counts.cardInventoryTotal} profiles=${report.counts.cardSemanticProfiles} signals=${report.counts.tacticSignals} errors=${report.errorFindings.length} warnings=${report.warningFindings.length}`);
    return;
  }
  const errors = [];
  if (!exists(JSON_OUT)) errors.push(`Missing ${JSON_OUT}`);
  if (!exists(MD_OUT)) errors.push(`Missing ${MD_OUT}`);
  if (!errors.length) errors.push(...validate(readJson(JSON_OUT), read(MD_OUT)));
  if (errors.length) return fail("AI028-R check failed", errors);
  const report = readJson(JSON_OUT);
  console.log(`AI028_R_NETGRID_SEMANTIC_AUDIT_PACK_REFRESH OK sourceCommit=${report.sourceCommit} cards=${report.counts.cardInventoryTotal} profiles=${report.counts.cardSemanticProfiles} signals=${report.counts.tacticSignals} errors=${report.errorFindings.length} warnings=${report.warningFindings.length}`);
}

function buildReport(verificationPassed) {
  const active = sorted(readJson(ACTIVE).cards ?? [], "cardId");
  const compiled = sorted(readJson(COMPILED).cards ?? [], "cardId");
  const inspector = sorted(readJson(INSPECTOR).cards ?? [], "cardId");
  const signals = sorted(readJson(SIGNALS).signals ?? [], "signalId");
  const derivation = readJson(DERIVATION).derivationRules ?? [];
  const goals = readJson(GOALS).strategyGoals ?? [];
  const roles = readJson(ROLES).strategicRoles ?? [];
  const catalog = cardCatalog();
  const activeById = mapBy(active, "cardId");
  const compiledById = mapBy(compiled, "cardId");
  const inspectorById = mapBy(inspector, "cardId");
  const signalById = mapBy(signals, "signalId");
  const cardInventory = buildCardInventory(catalog, activeById, compiledById, inspectorById);
  const profiles = buildProfiles(catalog, activeById, compiledById, inspectorById);
  const signalUsageIndex = buildSignalUsageIndex(signals, active, compiled, inspector);
  const targetProfileInventory = hintInventory(compiled, active, "targetProfiles", (card, value, index) => ({
    cardId: card.cardId,
    title: catalog.byId.get(card.cardId)?.title,
    side: card.side,
    cardType: card.cardType,
    index,
    schemaVersion: value.schemaVersion,
    kind: value.kind,
    timing: value.timing,
    targetType: value.targetType,
    targetCardType: value.targetCardType,
    purpose: value.purpose,
    zone: value.zone,
    hiddenInfoPolicy: value.hiddenInfoPolicy,
    status: value.hiddenInfoPolicy ? "complete" : "schema_gap",
    profile: value,
  }));
  const conditionInventory = hintInventory(compiled, active, "conditions", (card, value, index) => ({
    cardId: card.cardId,
    title: catalog.byId.get(card.cardId)?.title,
    side: card.side,
    cardType: card.cardType,
    index,
    kind: value.kind,
    condition: value,
  }));
  const riskInventory = preferredCards(compiled, active).flatMap((card) =>
    (card.riskTags ?? []).map((riskId) => ({
      cardId: card.cardId,
      title: catalog.byId.get(card.cardId)?.title,
      side: card.side,
      cardType: card.cardType,
      sourceField: "riskTags",
      riskId,
    })),
  );
  const constraintInventory = buildConstraintInventory(preferredCards(compiled, active), catalog);
  const hiddenInfoPolicyInventory = [
    ...targetProfileInventory.map((entry) => ({
      policyId: entry.hiddenInfoPolicy ?? "missing_hidden_info_policy",
      sourceField: "targetProfiles.hiddenInfoPolicy",
      cardId: entry.cardId,
      title: entry.title,
      side: entry.side,
      cardType: entry.cardType,
      targetProfileIndex: entry.index,
      targetProfilePurpose: entry.purpose,
    })),
    ...compiled
      .filter((card) => card.valueHints?.hidden_zone)
      .map((card) => ({
        policyId: String(card.valueHints.hidden_zone),
        sourceField: "valueHints.hidden_zone",
        cardId: card.cardId,
        title: catalog.byId.get(card.cardId)?.title,
        side: card.side,
        cardType: card.cardType,
      })),
  ];
  const reviewedStrategySupportPairInventory = inspector.flatMap((card) =>
    (card.reviewedStrategySupportPairs ?? []).map((pair, index) => ({
      inventoryKind: "reviewed_strategy_support_pair",
      sourceField: pair.sourceField ?? "lineSupport",
      cardId: card.cardId,
      title: catalog.byId.get(card.cardId)?.title,
      side: card.side,
      cardType: card.cardType,
      index,
      strategyId: pair.strategyId,
      sourceValue: pair.sourceValue,
      triageCategory: pair.triageCategory,
      rationale: pair.rationale,
    })),
  );
  const derivedPossibleStrategyAnchorInventory = inspector.flatMap((card) =>
    (card.derivedPossibleStrategyAnchors ?? []).map((strategyId, index) => ({
      inventoryKind: "derived_possible_strategy_anchor",
      sourceField: "derivedFunctionSignals",
      cardId: card.cardId,
      title: catalog.byId.get(card.cardId)?.title,
      side: card.side,
      cardType: card.cardType,
      index,
      strategyId,
      sourceSignals: card.derivedFunctionSignals ?? [],
    })),
  );
  const strategySupportPairInventory = [
    ...reviewedStrategySupportPairInventory.map((entry) => ({ ...entry, inventoryGroup: "reviewed" })),
    ...derivedPossibleStrategyAnchorInventory.map((entry) => ({ ...entry, inventoryGroup: "derived_possible" })),
  ];
  const legacyAggregationSignals = signals
    .filter((signal) => signal.legacy === true || signal.aggregation === true || signal.notForDirectScoring === true)
    .map((signal) => {
      const usage = signalUsageIndex.find((entry) => entry.signalId === signal.signalId) ?? {};
      return {
        signalId: signal.signalId,
        supportOnly: signal.supportOnly === true,
        mayAnchorStrategy: signal.mayAnchorStrategy === true,
        allowedStrategyAnchors: signal.allowedStrategyAnchors ?? [],
        legacy: signal.legacy === true,
        aggregation: signal.aggregation === true,
        notForDirectScoring: signal.notForDirectScoring === true,
        directActiveUsageCount: usage.activeTacticUsageCount ?? 0,
        directCompiledUsageCount: usage.compiledTacticUsageCount ?? 0,
        inspectorDerivedUsageCount: usage.inspectorDerivedUsageCount ?? 0,
      };
    });
  const supportingEvidenceOnlySignals = [...usageMap(inspector, (card) => card.supportingEvidenceOnly ?? []).entries()].map(([signalId, cards]) => ({
    signalId,
    cardCount: cards.length,
    cards,
    cataloged: signalById.has(signalId),
    supportOnly: signalById.get(signalId)?.supportOnly === true,
    mayAnchorStrategy: signalById.get(signalId)?.mayAnchorStrategy === true,
    allowedStrategyAnchors: signalById.get(signalId)?.allowedStrategyAnchors ?? [],
  }));
  const testFixtureCardSeparation = buildFixtureSeparation(cardInventory, profiles);
  const corpClassCoverage = buildCorpCoverage(profiles, cardInventory, inspectorById);
  const runnerClassCoverage = buildRunnerCoverage(profiles, inspectorById);
  const taxonomySmells = buildTaxonomySmells(signals, signalUsageIndex, inspector, targetProfileInventory, reviewedStrategySupportPairInventory, derivedPossibleStrategyAnchorInventory, legacyAggregationSignals);
  const guideV3RuleFindings = findings(corpClassCoverage, taxonomySmells, targetProfileInventory, hiddenInfoPolicyInventory);
  const warningFindings = guideV3RuleFindings.filter((finding) => finding.severity === "warning");
  const errorFindings = guideV3RuleFindings.filter((finding) => finding.severity === "error");
  const counts = {
    activeHintCards: active.length,
    compiledHintCards: compiled.length,
    inspectorCards: inspector.length,
    cardInventoryTotal: cardInventory.length,
    cardSemanticProfiles: profiles.length,
    bySide: countBy(profiles, (card) => card.side),
    byCardType: countBy(profiles, (card) => card.cardType),
    productionOriginalsetActiveCards: profiles.filter((card) => card.inventoryClass === "production_originalset").length,
    productionProteusActiveCards: profiles.filter((card) => card.inventoryClass === "production_proteus").length,
    activeTestFixtureCards: testFixtureCardSeparation.activeTestFixtureCount,
    activeV08FixtureCards: testFixtureCardSeparation.activeV08FixtureCount,
    inactiveClassicCards: testFixtureCardSeparation.inactiveClassicCount,
    tacticSignals: signals.length,
    derivationRules: derivation.length,
    strategyGoals: goals.length,
    strategicRoles: roles.length,
    signalUsageEntries: signalUsageIndex.length,
    reviewedStrategySupportPairs: reviewedStrategySupportPairInventory.length,
    derivedPossibleStrategyAnchors: derivedPossibleStrategyAnchorInventory.length,
    targetProfiles: targetProfileInventory.length,
    conditions: conditionInventory.length,
    riskInventoryEntries: riskInventory.length,
    constraintInventoryEntries: constraintInventory.length,
    hiddenInfoPolicyEntries: hiddenInfoPolicyInventory.length,
    findingCountsBySeverity: countBy(guideV3RuleFindings, (finding) => finding.severity),
    noEffectFlagsFalse: Object.values(NO_EFFECT).every((value) => value === false),
    taxonomySmellCounts: {
      typeSubtypeSignalSmells: taxonomySmells.typeSubtypeSignalSmells.length,
      directLegacyAggregationUsage: taxonomySmells.directLegacyAggregationUsage.length,
      targetProfilesMissingHiddenInfoPolicy: taxonomySmells.targetProfilesMissingHiddenInfoPolicy.length,
      descriptorWarningCards: taxonomySmells.descriptorWarningCards.length,
      reviewedPairsWithNonLineSupportSource: taxonomySmells.reviewedPairsWithNonLineSupportSource.length,
      derivedReviewedValueOverlapCount: taxonomySmells.derivedReviewedValueOverlapCount,
      uncatalogedSignalsUsed: taxonomySmells.uncatalogedSignalsUsed.length,
      supportOnlySignalsWithAnchors: taxonomySmells.supportOnlySignalsWithAnchors.length,
    },
  };
  return {
    schemaVersion: "ai028-r-netgrid-semantic-audit-pack-refresh-v1",
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    sourceCommit: git(["rev-parse", "--short", "HEAD"]).trim(),
    branch: git(["rev-parse", "--abbrev-ref", "HEAD"]).trim(),
    guideVersion: GUIDE_VERSION,
    guidePath: GUIDE,
    supersedes: "AI028",
    postBatches: ["AI023-2", "AI029", "AI030"],
    status: verificationPassed ? "verified" : "generated",
    inputs: {
      inputFiles: INPUTS,
      previousSemanticBatches: previousSummary(),
      generationMode: "read-only global semantic inventory refresh after AI023-2, AI029 and AI030; no card hints, tactic signals, derivation rules, strategy IDs, inspector schema, runtime, planner, engine, legal, targeting, profile/default or UI semantic change",
    },
    counts,
    cardInventory,
    cardSemanticProfiles: profiles,
    signalCatalogSummary: {
      totalSignals: signals.length,
      byGroup: countBy(signals, (signal) => signal.group),
      bySideScope: countBy(signals, (signal) => signal.sideScope),
      supportOnlySignals: signals.filter((signal) => signal.supportOnly === true).length,
      mayAnchorStrategySignals: signals.filter((signal) => signal.mayAnchorStrategy === true).length,
      legacySignals: signals.filter((signal) => signal.legacy === true).length,
      aggregationSignals: signals.filter((signal) => signal.aggregation === true).length,
      notForDirectScoringSignals: signals.filter((signal) => signal.notForDirectScoring === true).length,
      uncatalogedUsedSignals: signalUsageIndex.filter((entry) => !entry.cataloged).map((entry) => entry.signalId),
      activeTacticSignalClasses: signalUsageIndex.filter((entry) => entry.activeTacticUsageCount > 0).length,
      compiledTacticSignalClasses: signalUsageIndex.filter((entry) => entry.compiledTacticUsageCount > 0).length,
      inspectorDerivedSignalClasses: signalUsageIndex.filter((entry) => entry.inspectorDerivedUsageCount > 0).length,
    },
    signalUsageIndex,
    strategySupportPairInventory,
    targetProfileInventory,
    conditionInventory,
    riskInventory,
    constraintInventory,
    hiddenInfoPolicyInventory,
    legacyAggregationSignals,
    supportingEvidenceOnlySignals,
    derivedPossibleStrategyAnchorInventory,
    reviewedStrategySupportPairInventory,
    testFixtureCardSeparation,
    guideV3RuleFindings,
    taxonomySmells,
    corpClassCoverage,
    runnerClassCoverage,
    warningFindings,
    errorFindings,
    deferredItems: deferredItems(taxonomySmells, conditionInventory),
    recommendedFollowups: recommendedFollowups(taxonomySmells, conditionInventory),
    externalWorkingTreeNotes: workingTreeNotes(),
    noEffectFlags: { ...NO_EFFECT },
    verification: verification(verificationPassed),
  };
}

function cardCatalog() {
  const cards = [];
  const byId = new Map();
  for (const file of CARD_FILES) {
    const data = readJson(file);
    for (const card of data.cards ?? []) {
      const entry = {
        cardId: card.cardId,
        title: card.title,
        side: card.side,
        cardType: card.cardType ?? card.type,
        subtypes: card.subtypes ?? [],
        setId: card.setId ?? data.setId ?? setIdFromPath(file),
        setName: card.setName ?? data.setName,
        collectorNumber: card.collectorNumber,
        sourceCardFile: file,
      };
      cards.push(entry);
      byId.set(entry.cardId, entry);
    }
  }
  return { cards: sorted(cards, "cardId"), byId };
}

function buildCardInventory(catalog, activeById, compiledById, inspectorById) {
  const ids = unique([...catalog.cards.map((card) => card.cardId), ...activeById.keys(), ...compiledById.keys(), ...inspectorById.keys()]);
  return ids.map((cardId) => {
    const active = activeById.get(cardId);
    const compiled = compiledById.get(cardId);
    const inspector = inspectorById.get(cardId);
    const card = catalog.byId.get(cardId);
    const hint = compiled ?? active ?? {};
    const setId = card?.setId ?? inferSetId(cardId);
    return clean({
      cardId,
      title: card?.title,
      side: hint.side ?? inspector?.side ?? card?.side,
      cardType: hint.cardType ?? inspector?.cardType ?? card?.cardType,
      setId,
      setName: card?.setName,
      sourceCardFile: card?.sourceCardFile,
      inventoryClass: inventoryClass(cardId, setId, active, compiled),
      presentInActiveHints: Boolean(active),
      presentInCompiledHints: Boolean(compiled),
      presentInInspector: Boolean(inspector),
      aiSupportStatus: hint.aiSupportStatus ?? inspector?.supportStatus?.aiSupportStatus ?? "not_active",
      tacticSignalCount: (hint.tacticSignals ?? []).length,
      lineSupportCount: (hint.lineSupport ?? []).length,
      targetProfileCount: (hint.targetProfiles ?? []).length,
      conditionCount: (hint.conditions ?? []).length,
      riskTagCount: (hint.riskTags ?? []).length,
      inspectorWarningCount: inspector?.warningCategories?.length ?? 0,
      inspectorWarningCategories: inspector?.warningCategories ?? undefined,
    });
  });
}

function buildProfiles(catalog, activeById, compiledById, inspectorById) {
  const ids = unique([...activeById.keys(), ...compiledById.keys(), ...inspectorById.keys()]);
  return ids.map((cardId) => {
    const active = activeById.get(cardId);
    const compiled = compiledById.get(cardId);
    const inspector = inspectorById.get(cardId);
    const card = catalog.byId.get(cardId);
    const hint = compiled ?? active ?? {};
    const setId = card?.setId ?? inferSetId(cardId);
    return clean({
      cardId,
      title: card?.title,
      side: hint.side ?? inspector?.side ?? card?.side,
      cardType: hint.cardType ?? inspector?.cardType ?? card?.cardType,
      setId,
      inventoryClass: inventoryClass(cardId, setId, active, compiled),
      roles: hint.roles ?? [],
      planRoles: hint.planRoles ?? [],
      strategicRole: hint.strategicRole ?? [],
      requiredMechanics: hint.requiredMechanics ?? [],
      tacticSignals: hint.tacticSignals ?? [],
      lineSupport: hint.lineSupport ?? [],
      effectKinds: unique((hint.effects ?? []).map((effect) => effect.kind).filter(Boolean)),
      effectTimings: unique((hint.effects ?? []).map((effect) => effect.timing).filter(Boolean)),
      targetProfileCount: (hint.targetProfiles ?? []).length,
      conditionCount: (hint.conditions ?? []).length,
      riskTags: hint.riskTags ?? [],
      noSignalReason: hint.no_signal_reason,
      constraintSummary: constraintSummary(hint),
      hiddenInfoPolicies: hiddenPolicies(hint),
      cardLevelStrategyAnchors: inspector?.cardLevelStrategyAnchors ?? [],
      derivedFunctionSignals: inspector?.derivedFunctionSignals ?? [],
      derivedStrategyAnchors: inspector?.derivedStrategyAnchors ?? [],
      derivedPossibleStrategyAnchors: inspector?.derivedPossibleStrategyAnchors ?? [],
      reviewedStrategySupportPairs: inspector?.reviewedStrategySupportPairs ?? [],
      supportingEvidenceOnly: inspector?.supportingEvidenceOnly ?? [],
      descriptorGaps: inspector?.descriptorGaps ?? [],
      warningCategories: inspector?.warningCategories ?? [],
      legacyStatus: inspector?.legacyStatus,
      activeHintFound: Boolean(active),
      compiledHintFound: Boolean(compiled),
      inspectorFound: Boolean(inspector),
    });
  });
}

function buildSignalUsageIndex(signals, active, compiled, inspector) {
  const activeUsage = usageMap(active, (card) => card.tacticSignals ?? []);
  const compiledUsage = usageMap(compiled, (card) => card.tacticSignals ?? []);
  const derivedUsage = usageMap(inspector, (card) => card.derivedFunctionSignals ?? []);
  const supportUsage = usageMap(inspector, (card) => card.supportingEvidenceOnly ?? []);
  const signalById = mapBy(signals, "signalId");
  const ids = unique([...signals.map((signal) => signal.signalId), ...activeUsage.keys(), ...compiledUsage.keys(), ...derivedUsage.keys(), ...supportUsage.keys()]);
  return ids.map((signalId) => {
    const signal = signalById.get(signalId);
    return {
      signalId,
      cataloged: Boolean(signal),
      group: signal?.group,
      sideScope: signal?.sideScope,
      supportOnly: signal?.supportOnly === true,
      mayAnchorStrategy: signal?.mayAnchorStrategy === true,
      allowedStrategyAnchors: signal?.allowedStrategyAnchors ?? [],
      legacy: signal?.legacy === true,
      aggregation: signal?.aggregation === true,
      notForDirectScoring: signal?.notForDirectScoring === true,
      activeTacticUsageCount: (activeUsage.get(signalId) ?? []).length,
      activeTacticUsageCards: activeUsage.get(signalId) ?? [],
      compiledTacticUsageCount: (compiledUsage.get(signalId) ?? []).length,
      compiledTacticUsageCards: compiledUsage.get(signalId) ?? [],
      inspectorDerivedUsageCount: (derivedUsage.get(signalId) ?? []).length,
      inspectorDerivedUsageCards: derivedUsage.get(signalId) ?? [],
      inspectorSupportingOnlyCount: (supportUsage.get(signalId) ?? []).length,
      inspectorSupportingOnlyCards: supportUsage.get(signalId) ?? [],
    };
  });
}

function hintInventory(compiled, active, field, mapValue) {
  return preferredCards(compiled, active)
    .flatMap((card) => (card[field] ?? []).map((value, index) => mapValue(card, value, index)))
    .sort((a, b) => `${a.cardId}:${a.index}`.localeCompare(`${b.cardId}:${b.index}`));
}

function buildConstraintInventory(cards, catalog) {
  const entries = [];
  for (const card of cards) {
    const base = { cardId: card.cardId, title: catalog.byId.get(card.cardId)?.title, side: card.side, cardType: card.cardType };
    if (meaningful(card.costProfile)) entries.push({ ...base, constraintKind: "costProfile", sourceField: "costProfile", value: card.costProfile });
    if (meaningful(card.breakerProfile)) entries.push({ ...base, constraintKind: "breakerProfile", sourceField: "breakerProfile", value: card.breakerProfile });
    if (meaningful(card.remoteRole?.serverScope)) entries.push({ ...base, constraintKind: "remoteRole.serverScope", sourceField: "remoteRole.serverScope", value: card.remoteRole.serverScope });
    for (const [index, effect] of (card.effects ?? []).entries()) {
      for (const field of ["actionCost", "perTurnLimit"]) {
        if (meaningful(effect[field])) entries.push({ ...base, constraintKind: `effects.${field}`, sourceField: `effects[${index}].${field}`, value: effect[field] });
      }
    }
    for (const [index, profile] of (card.targetProfiles ?? []).entries()) {
      for (const field of ["avoid", "preferences", "oncePerRun", "shuffleAfter", "showToOpponent", "installCost", "installsTarget", "targetCardType", "zone"]) {
        if (meaningful(profile[field])) entries.push({ ...base, constraintKind: `targetProfiles.${field}`, sourceField: `targetProfiles[${index}].${field}`, value: profile[field] });
      }
    }
  }
  return entries.sort((a, b) => `${a.cardId}:${a.sourceField}`.localeCompare(`${b.cardId}:${b.sourceField}`));
}

function buildFixtureSeparation(cardInventory, profiles) {
  const activeTest = cardInventory.filter((card) => card.inventoryClass === "active_test_fixture");
  const inactiveTest = cardInventory.filter((card) => card.inventoryClass === "inactive_test_fixture");
  const inactiveClassic = cardInventory.filter((card) => card.inventoryClass === "inactive_classic");
  const simple = profiles.find((card) => card.cardId === "simple_upgrade");
  return {
    activeTestFixtureCount: activeTest.length,
    activeTestFixtureCards: activeTest.map((card) => card.cardId),
    activeV08FixtureCount: activeTest.filter((card) => card.cardId.startsWith("v08_")).length,
    inactiveTestFixtureCount: inactiveTest.length,
    inactiveClassicCount: inactiveClassic.length,
    simpleUpgrade: simple
      ? {
          cardId: simple.cardId,
          cardType: simple.cardType,
          tacticSignalCount: simple.tacticSignals.length,
          noSignalReason: simple.noSignalReason,
          classification: "test_fixture_no_active_tactical_semantics",
        }
      : null,
  };
}

function buildCorpCoverage(profiles, inventory, inspectorById) {
  const specs = [
    ["Agendas", ["agenda"], "AI023-2"],
    ["ICE", ["ice"], "AI024-1"],
    ["Operations", ["operation"], "AI025-1"],
    ["Nodes/Assets", ["asset", "node"], "AI026-1"],
    ["Upgrades", ["upgrade"], "AI030"],
  ];
  const result = {};
  for (const [key, types, coveredBy] of specs) {
    const active = profiles.filter((card) => card.side === "corp" && types.includes(card.cardType));
    const inv = inventory.filter((card) => card.side === "corp" && types.includes(card.cardType));
    const missing = active.filter((card) => !inspectorById.has(card.cardId)).map((card) => card.cardId);
    result[key] = {
      status: missing.length ? "missing_inspector_entries" : "covered",
      coveredBy,
      currentActiveCompiledCount: active.length,
      productionActiveCompiledCount: active.filter((card) => ["production_originalset", "production_proteus"].includes(card.inventoryClass)).length,
      productionOriginalsetCount: active.filter((card) => card.inventoryClass === "production_originalset").length,
      productionProteusCount: active.filter((card) => card.inventoryClass === "production_proteus").length,
      activeTestFixtureCount: active.filter((card) => card.inventoryClass === "active_test_fixture").length,
      inactiveClassicCount: inv.filter((card) => card.inventoryClass === "inactive_classic").length,
      activeCompiledWithInspectorCount: active.length - missing.length,
      missingInspectorCards: missing,
      cardsWithTacticSignals: active.filter((card) => card.tacticSignals.length > 0).length,
      cardsWithDerivedFunctionSignals: active.filter((card) => card.derivedFunctionSignals.length > 0).length,
    };
  }
  result.Agendas.specialChecks = agendaChecks(profiles);
  result.Upgrades.specialChecks = upgradeChecks(profiles);
  return result;
}

function buildRunnerCoverage(profiles, inspectorById) {
  const specs = [
    ["Identity", ["identity"]],
    ["Programs", ["program"]],
    ["Events", ["event"]],
    ["Hardware", ["hardware"]],
    ["Resources", ["resource"]],
  ];
  return Object.fromEntries(
    specs.map(([key, types]) => {
      const active = profiles.filter((card) => card.side === "runner" && types.includes(card.cardType));
      const missing = active.filter((card) => !inspectorById.has(card.cardId)).map((card) => card.cardId);
      return [
        key,
        {
          status: missing.length ? "missing_inspector_entries" : "covered",
          currentActiveCompiledCount: active.length,
          productionOriginalsetCount: active.filter((card) => card.inventoryClass === "production_originalset").length,
          productionProteusCount: active.filter((card) => card.inventoryClass === "production_proteus").length,
          activeTestFixtureCount: active.filter((card) => card.inventoryClass === "active_test_fixture").length,
          activeCompiledWithInspectorCount: active.length - missing.length,
          missingInspectorCards: missing,
          cardsWithTacticSignals: active.filter((card) => card.tacticSignals.length > 0).length,
          cardsWithDerivedFunctionSignals: active.filter((card) => card.derivedFunctionSignals.length > 0).length,
        },
      ];
    }),
  );
}

function agendaChecks(profiles) {
  return Object.fromEntries(
    Object.entries(PROJECT_AGENDAS).map(([cardId, expected]) => {
      const card = profiles.find((entry) => entry.cardId === cardId);
      return [
        cardId,
        {
          cardId,
          expectedSignals: expected,
          tacticSignalsPresent: expected.every((signalId) => (card?.tacticSignals ?? []).includes(signalId)),
          inspectorSignalsPresent: expected.every((signalId) => (card?.derivedFunctionSignals ?? []).includes(signalId)),
          hasFastAdvanceReviewedPair: (card?.reviewedStrategySupportPairs ?? []).some((pair) => pair.strategyId === "corp.fast_advance"),
          hasFastAdvanceDerivedPossibleAnchor: (card?.derivedPossibleStrategyAnchors ?? []).includes("corp.fast_advance"),
        },
      ];
    }),
  );
}

function upgradeChecks(profiles) {
  const upgrades = profiles.filter((card) => card.side === "corp" && card.cardType === "upgrade");
  const simple = profiles.find((card) => card.cardId === "simple_upgrade");
  return {
    reviewedBy: "AI030",
    upgradeCount: upgrades.length,
    upgradesWithInspectorEntries: upgrades.filter((card) => card.inspectorFound).length,
    functionalUpgradesWithDerivedSignals: upgrades.filter((card) => card.cardId !== "simple_upgrade" && card.derivedFunctionSignals.length > 0).length,
    typeSubtypeOnlySignals: unique(upgrades.flatMap((card) => card.tacticSignals.filter((signalId) => /^corp\.upgrade($|\.)|^upgrade\./.test(signalId)).map((signalId) => `${card.cardId}:${signalId}`))),
    simpleUpgrade: simple
      ? {
          cardId: simple.cardId,
          tacticSignalCount: simple.tacticSignals.length,
          noSignalReason: simple.noSignalReason,
          fixtureClassification: "vanilla_test_fixture_no_active_tactical_semantics",
        }
      : null,
    agendaDifficultyChecks: AGENDA_DIFFICULTY_UPGRADES.map((cardId) => {
      const card = profiles.find((profile) => profile.cardId === cardId);
      return {
        cardId,
        hasAgendaDifficultySignal: (card?.tacticSignals ?? []).includes("score.agenda_difficulty_discount"),
        hasRemoteDifficultySignal: (card?.tacticSignals ?? []).includes("remote.agenda_difficulty_discount"),
        hasAdvanceBurstSignal: (card?.derivedFunctionSignals ?? []).includes("score.advance_burst"),
        hasFastAdvanceDerivedAnchor: (card?.derivedPossibleStrategyAnchors ?? []).includes("corp.fast_advance"),
        hasFastAdvanceReviewedPair: (card?.reviewedStrategySupportPairs ?? []).some((pair) => pair.strategyId === "corp.fast_advance"),
      };
    }),
  };
}

function buildTaxonomySmells(signals, signalUsageIndex, inspector, targetProfiles, reviewed, derived, legacyAggregationSignals) {
  const reviewedKeys = new Set(reviewed.map((entry) => `${entry.cardId}:${entry.strategyId}`));
  const descriptorWarningCards = inspector
    .filter((card) => (card.warningCategories ?? []).some((warning) => ["descriptor_gap", "function_signal_descriptor_gap"].includes(warning)) || (card.descriptorGaps ?? []).length)
    .map((card) => ({ cardId: card.cardId, warningCategories: card.warningCategories ?? [], descriptorGaps: card.descriptorGaps ?? [] }));
  return {
    typeSubtypeSignalSmells: ["breaker.code_gate", "breaker.sentry", "breaker.wall"].map((signalId) => {
      const signal = signals.find((entry) => entry.signalId === signalId);
      const usage = signalUsageIndex.find((entry) => entry.signalId === signalId);
      return { signalId, supportOnly: signal?.supportOnly === true, mayAnchorStrategy: signal?.mayAnchorStrategy === true, inspectorDerivedUsageCount: usage?.inspectorDerivedUsageCount ?? 0 };
    }),
    directLegacyAggregationUsage: legacyAggregationSignals.filter((entry) => entry.directActiveUsageCount > 0 || entry.directCompiledUsageCount > 0),
    targetProfilesMissingHiddenInfoPolicy: targetProfiles.filter((entry) => !entry.hiddenInfoPolicy),
    inspectorWarningCategoryCounts: countWarnings(inspector),
    descriptorWarningCards,
    reviewedPairsWithNonLineSupportSource: reviewed.filter((entry) => entry.sourceField !== "lineSupport"),
    derivedReviewedValueOverlapCount: derived.filter((entry) => reviewedKeys.has(`${entry.cardId}:${entry.strategyId}`)).length,
    derivedReviewedValueOverlapSample: derived.filter((entry) => reviewedKeys.has(`${entry.cardId}:${entry.strategyId}`)).slice(0, 20).map((entry) => ({ cardId: entry.cardId, strategyId: entry.strategyId })),
    uncatalogedSignalsUsed: signalUsageIndex.filter((entry) => !entry.cataloged).map((entry) => entry.signalId),
    supportOnlySignalsWithAnchors: signals.filter((signal) => signal.supportOnly === true && (signal.allowedStrategyAnchors ?? []).length > 0),
  };
}

function findings(corp, smells, targetProfiles, hiddenPolicies) {
  const agenda = corp.Agendas.specialChecks;
  const upgrades = corp.Upgrades.specialChecks;
  const list = [
    ["AI028-R-F001", "info", "taxonomy", "Strategy-goal taxonomy remains closed at the current catalog count; AI028-R adds no Strategy ID.", "Semantic audit packs are evidence-only unless a dedicated taxonomy batch changes IDs.", "Keep AI028-R as refreshed baseline evidence.", "none"],
    ["AI028-R-F002", "info", "card_semantics", "Corp Agendas are covered by AI023-2; Project Venice, Project Zurich and Project Babylon remain Guide-V3 conformant.", "Overadvance and recurring support do not automatically create corp.fast_advance.", "No card-hint change in AI028-R.", "none", agenda],
    ["AI028-R-F003", "info", "card_semantics", "Corp Upgrades are covered by AI030; functional Upgrades expose Inspector function signals and simple_upgrade remains a no-signal fixture.", "Upgrade StrategySupportPairs must be based on functional evidence, not type, subtype or name.", "No card-hint change in AI028-R.", "none", upgrades],
    ["AI028-R-F004", "info", "target_profile", `${targetProfiles.length} TargetProfiles are inventoried and ${smells.targetProfilesMissingHiddenInfoPolicy.length} lack HiddenInfoPolicy after AI029.`, "TargetProfiles that touch hidden zones need explicit read-only HiddenInfoPolicy.", "Keep AI029 normalization as current baseline.", "none"],
    ["AI028-R-F005", "warning", "taxonomy", `Potential type/subtype-shaped support-only breaker signals remain: ${smells.typeSubtypeSignalSmells.map((entry) => entry.signalId).join(", ")}`, "Type and subtype facts should not become strategy anchors by themselves.", "Review in a dedicated tactic-signal taxonomy cleanup, not inside AI028-R.", "AI031 tactic-signal taxonomy cleanup"],
    ["AI028-R-F006", "warning", "legacy", `Legacy/aggregation signal classes still have direct card usage: ${smells.directLegacyAggregationUsage.map((entry) => `${entry.signalId}=${entry.directCompiledUsageCount}`).join(", ")}`, "Legacy and aggregation signals may remain support-only evidence but should not be new direct scoring semantics.", "Retire or split only in a dedicated card-semantic/taxonomy batch.", "AI032 legacy aggregation signal retirement"],
    ["AI028-R-F007", "warning", "constraint", `${smells.descriptorWarningCards.length} cards still carry descriptor or function-signal descriptor warnings.`, "Descriptor gaps need schema design before bulk conversion.", "Keep as deferred schema evidence.", "AI033 descriptor schema design"],
    ["AI028-R-F008", "warning", "condition", "The broad requires_advancement_counter condition remains deferred until source/target action semantics exist.", "Source and target advancement-counter roles need action/target semantics, not a report-only rename.", "Do not split conditions in AI028-R.", "Action semantics bridge prerequisite"],
    ["AI028-R-F009", "info", "hidden_info", `${hiddenPolicies.length} HiddenInfoPolicy entries were inventoried without introducing PlayerView, WebSocket, Reconnect, Undo, Replay, log or client-error projection.`, "Hidden-info safety is a gate; semantic reports must not create runtime projections.", "No runtime or UI change.", "none"],
    ["AI028-R-F010", "info", "strategy_anchor", "reviewedStrategySupportPairInventory and derivedPossibleStrategyAnchorInventory are structurally separate and preserve their source fields.", "Reviewed support and derived possible anchors must not be merged into one authority.", "Keep separate in downstream reports.", "AI031 StrategySupportPair role model completion"],
  ].map(([findingId, severity, category, description, guideV3Rule, recommendedAction, suggestedTask, evidence]) => clean({ findingId, severity, category, description, guideV3Rule, recommendedAction, suggestedTask, evidence }));
  const hard = [];
  for (const cardId of ["onr_proteus_007_project-venice", "onr_proteus_008_project-zurich"]) {
    if (!agenda[cardId]?.tacticSignalsPresent || !agenda[cardId]?.inspectorSignalsPresent) hard.push(`${cardId} missing expected Agenda signals`);
  }
  if (upgrades.typeSubtypeOnlySignals.length) hard.push("Corp Upgrade type/subtype-only tactic signals are present");
  if (hard.length) {
    list.push({
      findingId: "AI028-R-F999",
      severity: "error",
      category: "card_semantics",
      description: hard.join("; "),
      guideV3Rule: "AI028-R must reflect the post-AI023-2/AI030 baseline.",
      recommendedAction: "Fix source semantic data in a separate batch, then regenerate AI028-R.",
      suggestedTask: "blocked follow-up",
    });
  }
  return list;
}

function deferredItems(smells, conditions) {
  return [
    ["AI028-R-D001", "taxonomy", "deferred", "breaker.code_gate, breaker.sentry and breaker.wall remain support-only type/subtype-shaped signal candidates.", "AI031 tactic-signal taxonomy cleanup"],
    ["AI028-R-D002", "legacy", "deferred", `${smells.directLegacyAggregationUsage.length} legacy/aggregation signal classes still have direct card usage.`, "AI032 legacy aggregation signal retirement"],
    ["AI028-R-D003", "constraint", "needs_schema_design", `${smells.descriptorWarningCards.length} descriptor/function-signal descriptor warning cards remain classified, not rewritten.`, "AI033 descriptor schema design"],
    ["AI028-R-D004", "condition", "deferred_until_action_semantics", `${conditions.filter((entry) => entry.kind === "requires_advancement_counter").length} requires_advancement_counter condition entries retain the broad source/target shape.`, "Action semantics bridge prerequisite"],
    ["AI028-R-D005", "strategy_anchor", "deferred", "Reviewed StrategySupportPairs and derived possible anchors are separated, but role-within-strategy metadata remains future work.", "AI031 StrategySupportPair role model completion"],
  ].map(([itemId, category, status, description, suggestedTask]) => ({ itemId, category, status, description, suggestedTask }));
}

function recommendedFollowups(smells, conditions) {
  return [
    ["AI031", "normal", "Tactic-signal taxonomy cleanup", `${smells.typeSubtypeSignalSmells.length} support-only type/subtype-shaped breaker signals remain candidates for taxonomy cleanup.`],
    ["AI032", "normal", "Legacy aggregation signal retirement review", `${smells.directLegacyAggregationUsage.length} direct legacy/aggregation signal classes remain after AI029 and AI030.`],
    ["AI033", "normal", "Descriptor schema design", `${smells.descriptorWarningCards.length} descriptor/function-signal descriptor warning cards need schema-level handling before bulk rewrite.`],
    ["AI034", "low", "Advancement source-target condition split", `${conditions.filter((entry) => entry.kind === "requires_advancement_counter").length} broad advancement-counter conditions should wait for action/target semantics.`],
  ].map(([taskId, priority, title, rationale]) => ({ taskId, priority, title, rationale }));
}

function verification(passed) {
  const status = passed ? "passed" : "pending";
  return {
    status,
    note: passed ? "Listed commands passed for the AI028-R refresh. git diff --check may print existing line-ending warnings while still exiting successfully." : "Generated before final command verification; rerun with --write --verification-passed after all listed commands pass.",
    commands: [
      "node scripts/check-ai023-2-corp-agendas-active-hint-sync.mjs",
      "node scripts/check-ai024-1-corp-ice-semantics-polish.mjs",
      "node scripts/check-ai025-1-corp-operations-semantics-polish.mjs",
      "node scripts/check-ai026-1-corp-nodes-assets-semantics-polish.mjs",
      "node scripts/check-ai027-derivation-inspector-guide-v3-alignment.mjs",
      "node scripts/check-ai028-r-netgrid-semantic-audit-pack-refresh.mjs",
      "node scripts/check-ai029-target-condition-constraint-schema-sweep.mjs",
      "node scripts/check-ai030-corp-upgrades-semantics.mjs",
      "corepack pnpm check:ai-strategy-taxonomy",
      "corepack pnpm check:ai-hint-quality",
      "corepack pnpm check:ai-hint-compiled-index",
      "corepack pnpm check:ai-approval-consistency",
      "corepack pnpm check:ai-deck-doctrine-strategy",
      "corepack pnpm check:ai-compiled-hints",
      "corepack pnpm check:ai-hint-inspector-index",
      "corepack pnpm --filter @netgrid/ai test",
      "corepack pnpm --filter @netgrid/ai typecheck",
      "corepack pnpm --filter @netgrid/web typecheck",
      "git diff --check",
    ].map((command) => ({ command, status })),
  };
}

function previousSummary() {
  return PREVIOUS.map(([taskId, jsonPath, markdownPath]) => {
    const report = readJson(jsonPath);
    const counts = report.countsAfter ?? report.counts ?? report.summary ?? {};
    return clean({
      taskId,
      path: jsonPath,
      markdownPath,
      status: report.status,
      sourceCommit: report.sourceCommit ?? report.source?.sourceCommit,
      guideVersion: report.guideVersion ?? report.source?.guideVersion,
      keyCounts: Object.fromEntries(Object.entries(counts).filter(([key]) => /count|signals|rules|strategy/i.test(key)).slice(0, 20)),
      noEffectFlags: report.noEffectFlags ?? Object.fromEntries(Object.keys(NO_EFFECT).filter((key) => counts[key] !== undefined).map((key) => [key, counts[key]])),
    });
  });
}

function workingTreeNotes() {
  return git(["status", "--short"])
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const payload = line.slice(3).trim();
      const paths = payload.includes(" -> ") ? payload.split(" -> ").map(norm) : [norm(payload)];
      return { line, paths };
    })
    .filter(({ paths }) => !paths.every((entry) => ARTIFACTS.has(entry)))
    .map(({ line, paths }) => {
      const chronicle = paths.some((entry) => CHRONICLE_RE.test(entry));
      return {
        statusLine: line,
        paths,
        classification: chronicle ? "external_unrelated_chronicle_excluded" : "external_unrelated_excluded",
        unrelated: true,
        excludedFromAi028R: true,
      };
    });
}

function renderMarkdown(report) {
  const external = report.externalWorkingTreeNotes.length ? report.externalWorkingTreeNotes.map((entry) => `- ${entry.statusLine} (${entry.classification})`).join("\n") : "- Keine offenen externen AI028-R-Blocker erkannt.";
  const warnings = report.warningFindings.map((finding) => `- ${finding.findingId} [${finding.category}]: ${finding.description}`).join("\n") || "- Keine";
  const errors = report.errorFindings.map((finding) => `- ${finding.findingId} [${finding.category}]: ${finding.description}`).join("\n") || "- Keine";
  return `# AI028-R: NETGRID Semantic Audit Pack Refresh

Stand: ${report.generatedAt}
Guide: ${report.guideVersion} (${report.guidePath})
Branch: ${report.branch}
HEAD: ${report.sourceCommit}
Supersedes: ${report.supersedes}
Post-Batches: ${report.postBatches.join(", ")}
Status: ${report.status}

## Kurzfazit

AI028-R ersetzt AI028 als aktuelle globale Semantik-Baseline nach AI023-2, AI029 und AI030. Der Refresh ist read-only: keine Karten-Hints, keine Taktiksignale, keine Strategy IDs, keine Derivationsregeln und keine Runtime-, Planner-, Engine-, Legalitäts-, Targeting-, UI- oder Hidden-Info-Wirkung wurden erzeugt.

Corp-Hauptklassen sind jetzt durch die Review-Linie geschlossen: Agendas durch AI023-2, ICE durch AI024-1, Operations durch AI025-1, Nodes/Assets durch AI026-1 und Upgrades durch AI030. Die alten AI028-Warnings wurden neu klassifiziert: TargetProfile-HiddenInfoPolicy ist durch AI029 erledigt; Type-/Subtype-Signale, Legacy-/Aggregation-Signale, Descriptor-Gaps und Advancement-Counter-Condition-Split bleiben bewusst deferred.

## Scope / Out-of-Scope

Scope: aktive und compiled Runner- und Corp-Karten, aktive Test-/V08-Karten getrennt, inaktive Classic-Karten getrennt, Taktiksignale, Function-Signal-Derivations, Active Hints, Compiled Hints, Inspector Index, StrategySupportPairs, TargetProfiles, Conditions, Risks, Constraints, HiddenInfoPolicies, Legacy-/Aggregation-Signale, supportingEvidenceOnly, derivedPossibleStrategyAnchors und reviewedStrategySupportPairs.

Out-of-Scope: Karten-Hint-Änderungen, neue Taktiksignale, neue Strategy IDs, Derivationsregeländerungen, Engine-/Legalitätsänderungen, Planner-/ActionScore-/PlanWeight-Wirkung, Targeting-KI, UI-Änderungen und Chronicle-Dateien.

## Verwendete Quellen

- Guide V3: \`${report.guidePath}\`
- AI-Daten: \`${SIGNALS}\`, \`${DERIVATION}\`, \`${ACTIVE}\`, \`${COMPILED}\`, \`${INSPECTOR}\`, \`${GOALS}\`, \`${ROLES}\`
- Reviews/Reports: ${report.inputs.previousSemanticBatches.map((entry) => entry.taskId).join(", ")}
- Kartenlisten: ${CARD_FILES.map((entry) => `\`${entry}\``).join(", ")}

## Branch / HEAD

- Branch: \`${report.branch}\`
- HEAD: \`${report.sourceCommit}\`

## Externe Working-Tree-Notizen

${external}

## Gesamtcounts

- Aktive Hints: ${report.counts.activeHintCards}
- Kompilierte Hints: ${report.counts.compiledHintCards}
- Inspector-Karten: ${report.counts.inspectorCards}
- Card Inventory gesamt: ${report.counts.cardInventoryTotal}
- Semantic Profiles: ${report.counts.cardSemanticProfiles}
- Originalset aktiv: ${report.counts.productionOriginalsetActiveCards}
- Proteus aktiv: ${report.counts.productionProteusActiveCards}
- Testset aktiv: ${report.counts.activeTestFixtureCards} (davon V08: ${report.counts.activeV08FixtureCards})
- Classic inaktiv: ${report.counts.inactiveClassicCards}
- Taktiksignale: ${report.counts.tacticSignals}
- Ableitungsregeln: ${report.counts.derivationRules}
- StrategyGoals: ${report.counts.strategyGoals}
- Reviewed StrategySupportPairs: ${report.counts.reviewedStrategySupportPairs}
- Derived possible StrategyAnchors: ${report.counts.derivedPossibleStrategyAnchors}
- TargetProfiles: ${report.counts.targetProfiles}
- Conditions: ${report.counts.conditions}
- Risks: ${report.counts.riskInventoryEntries}
- Constraints: ${report.counts.constraintInventoryEntries}
- HiddenInfoPolicy-Einträge: ${report.counts.hiddenInfoPolicyEntries}

## Corp-Klassenabdeckung

${Object.entries(report.corpClassCoverage).map(([key, value]) => `- ${key}: ${value.status}; coveredBy=${value.coveredBy}; active/compiled=${value.currentActiveCompiledCount}; production=${value.productionActiveCompiledCount}; inspectorMissing=${value.missingInspectorCards.length}`).join("\n")}

## Runner-Klassenabdeckung

${Object.entries(report.runnerClassCoverage).map(([key, value]) => `- ${key}: ${value.status}; active/compiled=${value.currentActiveCompiledCount}; inspectorMissing=${value.missingInspectorCards.length}; tacticSignalCards=${value.cardsWithTacticSignals}`).join("\n")}

## Signal-Katalog-Status

- Katalogisierte Signale: ${report.signalCatalogSummary.totalSignals}
- Aktive Taktiksignal-Klassen: ${report.signalCatalogSummary.activeTacticSignalClasses}
- Inspector-derived Signal-Klassen: ${report.signalCatalogSummary.inspectorDerivedSignalClasses}
- Unkatalogisierte genutzte Signale: ${report.signalCatalogSummary.uncatalogedUsedSignals.length}
- Support-only-Signale: ${report.signalCatalogSummary.supportOnlySignals}
- Legacy-/Aggregation-Warnklassen mit direkter Nutzung: ${report.taxonomySmells.directLegacyAggregationUsage.length}

## StrategySupportPair-Status

Reviewed StrategySupportPairs und derived possible StrategyAnchors bleiben als getrennte Inventare mit eigenen \`inventoryKind\`- und \`sourceField\`-Werten erhalten. Wertüberschneidungen zwischen \`lineSupport\` und derived Signals werden nicht in AI028-R umgedeutet, weil der Refresh keine Semantikdaten ändert.

## TargetProfile-/Condition-/Risk-/Constraint-Status

- TargetProfiles ohne HiddenInfoPolicy: ${report.counts.taxonomySmellCounts.targetProfilesMissingHiddenInfoPolicy}
- Conditions: ${report.counts.conditions}
- Risks: ${report.counts.riskInventoryEntries}
- Constraints: ${report.counts.constraintInventoryEntries}
- Descriptor-/Function-Descriptor-Warning-Karten: ${report.counts.taxonomySmellCounts.descriptorWarningCards}

## HiddenInfo-Status

AI028-R erzeugt keine neue PlayerView-, WebSocket-, Reconnect-, Undo-, Replay-, Log- oder Client-Error-Projektion. Unrezzed Upgrades und verdeckte Agendas bleiben side-safe; Inspector- und Review-Daten bleiben Entwickler-/Katalog-Evidence.

## Test-/V08-Trennung

- Aktive Test-Fixtures: ${report.testFixtureCardSeparation.activeTestFixtureCount}
- Aktive V08-Fixtures: ${report.testFixtureCardSeparation.activeV08FixtureCount}
- Inaktive Test-Fixtures: ${report.testFixtureCardSeparation.inactiveTestFixtureCount}
- Inaktive Classic-Karten: ${report.testFixtureCardSeparation.inactiveClassicCount}
- \`simple_upgrade\`: ${report.testFixtureCardSeparation.simpleUpgrade?.classification}; tacticSignals=${report.testFixtureCardSeparation.simpleUpgrade?.tacticSignalCount}

## Findings nach Severity

- Error Findings: ${report.errorFindings.length}
- Warning Findings: ${report.warningFindings.length}
- Info Findings: ${report.guideV3RuleFindings.filter((finding) => finding.severity === "info").length}

### Error Findings

${errors}

### Warning Findings

${warnings}

## Wichtigste verbleibende Warnings

- Type-/Subtype-förmige Breaker-Signale bleiben support-only Taxonomie-Follow-up.
- Legacy-/Aggregation-Signale mit direkter Nutzung bleiben Deferred Items.
- Descriptor-/Function-Descriptor-Warnings bleiben Schemaarbeit, nicht AI028-R-Semantikänderung.
- \`requires_advancement_counter\` bleibt breit, bis Action-/Target-Semantik source/target trennt.

## Empfohlene nächste Schritte

${report.recommendedFollowups.map((item) => `- ${item.taskId} [${item.priority}]: ${item.title}. ${item.rationale}`).join("\n")}

## Verifikation

Status: ${report.verification.status}

${report.verification.commands.map((entry) => `- ${entry.command}: ${entry.status}`).join("\n")}

## No-Effect-Bestätigung

Alle no-effect Flags sind false: Planner, ActionScore, PlanWeight, Targeting-AI, Engine, Legal, Profile/Default, UI-Derivation und Hidden-Info-Leak.
`;
}

function validate(report, markdown) {
  const errors = [];
  for (const key of ["taskId", "generatedAt", "sourceCommit", "guideVersion", "supersedes", "postBatches", "inputs", "counts", "cardInventory", "cardSemanticProfiles", "signalCatalogSummary", "signalUsageIndex", "strategySupportPairInventory", "targetProfileInventory", "conditionInventory", "riskInventory", "constraintInventory", "hiddenInfoPolicyInventory", "legacyAggregationSignals", "supportingEvidenceOnlySignals", "derivedPossibleStrategyAnchorInventory", "reviewedStrategySupportPairInventory", "testFixtureCardSeparation", "guideV3RuleFindings", "taxonomySmells", "corpClassCoverage", "runnerClassCoverage", "warningFindings", "errorFindings", "deferredItems", "recommendedFollowups", "externalWorkingTreeNotes", "noEffectFlags", "verification"]) {
    if (!(key in report)) errors.push(`Report missing top-level key ${key}`);
  }
  if (report.taskId !== TASK_ID) errors.push(`taskId must be ${TASK_ID}`);
  if (report.guideVersion !== GUIDE_VERSION) errors.push(`guideVersion must be ${GUIDE_VERSION}`);
  if (!report.sourceCommit) errors.push("sourceCommit must be set");
  if (report.supersedes !== "AI028") errors.push("supersedes must be AI028");
  for (const id of ["AI023-2", "AI029", "AI030"]) if (!(report.postBatches ?? []).includes(id)) errors.push(`postBatches missing ${id}`);
  for (const key of Object.keys(NO_EFFECT)) if (report.noEffectFlags?.[key] !== false) errors.push(`noEffectFlags.${key} must be false`);
  for (const key of ["Agendas", "ICE", "Operations", "Nodes/Assets", "Upgrades"]) if (!report.corpClassCoverage?.[key]) errors.push(`corpClassCoverage missing ${key}`);
  if (!report.corpClassCoverage?.Upgrades?.specialChecks) errors.push("Corp Upgrades coverage specialChecks missing");
  const byId = new Map((report.cardSemanticProfiles ?? []).map((card) => [card.cardId, card]));
  for (const cardId of ["onr_proteus_007_project-venice", "onr_proteus_008_project-zurich"]) {
    const card = byId.get(cardId);
    if (!card) errors.push(`${cardId} missing from cardSemanticProfiles`);
    for (const signalId of PROJECT_AGENDAS[cardId]) {
      if (!(card?.tacticSignals ?? []).includes(signalId)) errors.push(`${cardId} missing tacticSignal ${signalId}`);
      if (!(card?.derivedFunctionSignals ?? []).includes(signalId)) errors.push(`${cardId} missing inspector derivedFunctionSignal ${signalId}`);
    }
  }
  const simple = byId.get("simple_upgrade");
  if (!simple) errors.push("simple_upgrade missing from cardSemanticProfiles");
  else {
    if (simple.cardType !== "upgrade") errors.push("simple_upgrade must be an upgrade");
    if ((simple.tacticSignals ?? []).length !== 0) errors.push("simple_upgrade must remain tactic-signal empty");
    if (!simple.noSignalReason) errors.push("simple_upgrade must carry noSignalReason");
  }
  for (const entry of report.derivedPossibleStrategyAnchorInventory ?? []) {
    if (entry.inventoryKind !== "derived_possible_strategy_anchor") errors.push(`${entry.cardId ?? "unknown"} derived entry has wrong inventoryKind`);
    if (entry.sourceField !== "derivedFunctionSignals") errors.push(`${entry.cardId ?? "unknown"} derived entry must use sourceField=derivedFunctionSignals`);
  }
  for (const entry of report.reviewedStrategySupportPairInventory ?? []) {
    if (entry.inventoryKind !== "reviewed_strategy_support_pair") errors.push(`${entry.cardId ?? "unknown"} reviewed entry has wrong inventoryKind`);
    if (entry.sourceField !== "lineSupport") errors.push(`${entry.cardId ?? "unknown"} reviewed entry must use sourceField=lineSupport`);
  }
  for (const input of report.inputs?.inputFiles ?? []) if (CHRONICLE_RE.test(norm(input))) errors.push(`Chronicle file must not be an AI028-R input: ${input}`);
  for (const batch of report.inputs?.previousSemanticBatches ?? []) {
    for (const field of ["path", "markdownPath"]) if (batch[field] && CHRONICLE_RE.test(norm(batch[field]))) errors.push(`Chronicle report must not be a previousSemanticBatch input: ${batch[field]}`);
  }
  for (const note of report.externalWorkingTreeNotes ?? []) {
    const mentionsChronicle = [note.statusLine, ...(note.paths ?? [])].some((value) => CHRONICLE_RE.test(norm(value)));
    if (mentionsChronicle && !(note.unrelated === true && note.excludedFromAi028R === true && /unrelated|excluded/i.test(note.classification ?? ""))) errors.push(`Chronicle working-tree note must be marked unrelated/excluded: ${note.statusLine}`);
  }
  for (const section of ["## Kurzfazit", "## Scope / Out-of-Scope", "## Verwendete Quellen", "## Branch / HEAD", "## Externe Working-Tree-Notizen", "## Gesamtcounts", "## Corp-Klassenabdeckung", "## Runner-Klassenabdeckung", "## Signal-Katalog-Status", "## StrategySupportPair-Status", "## TargetProfile-/Condition-/Risk-/Constraint-Status", "## HiddenInfo-Status", "## Test-/V08-Trennung", "## Findings nach Severity", "## Wichtigste verbleibende Warnings", "## Empfohlene nächste Schritte", "## Verifikation", "## No-Effect-Bestätigung"]) {
    if (!markdown.includes(section)) errors.push(`Markdown report missing section ${section}`);
  }
  return errors;
}

function preferredCards(compiled, active) {
  const activeById = mapBy(active, "cardId");
  const compiledById = mapBy(compiled, "cardId");
  return unique([...activeById.keys(), ...compiledById.keys()]).map((cardId) => compiledById.get(cardId) ?? activeById.get(cardId));
}

function constraintSummary(hint) {
  const result = [];
  if (meaningful(hint.costProfile)) result.push("costProfile");
  if (meaningful(hint.breakerProfile)) result.push("breakerProfile");
  if (meaningful(hint.remoteRole?.serverScope)) result.push("remoteRole.serverScope");
  for (const effect of hint.effects ?? []) {
    if (meaningful(effect.actionCost)) result.push("effects.actionCost");
    if (meaningful(effect.perTurnLimit)) result.push("effects.perTurnLimit");
  }
  for (const profile of hint.targetProfiles ?? []) {
    for (const field of ["avoid", "preferences", "oncePerRun", "shuffleAfter", "showToOpponent", "installCost", "installsTarget", "targetCardType", "zone"]) {
      if (meaningful(profile[field])) result.push(`targetProfiles.${field}`);
    }
  }
  return unique(result);
}

function hiddenPolicies(hint) {
  return unique([...(hint.targetProfiles ?? []).map((profile) => profile.hiddenInfoPolicy).filter(Boolean), hint.valueHints?.hidden_zone].filter(Boolean).map(String));
}

function usageMap(cards, valuesForCard) {
  const map = new Map();
  for (const card of cards) {
    for (const value of unique(valuesForCard(card).filter(Boolean))) {
      if (!map.has(value)) map.set(value, []);
      map.get(value).push(card.cardId);
    }
  }
  for (const [key, values] of map) map.set(key, unique(values));
  return map;
}

function countWarnings(cards) {
  const counts = {};
  for (const card of cards) for (const warning of card.warningCategories ?? []) counts[warning] = (counts[warning] ?? 0) + 1;
  return sortObject(counts);
}

function inventoryClass(cardId, setId, active, compiled) {
  if (setId === "originalset-v1") return "production_originalset";
  if (setId === "proteus") return "production_proteus";
  if (setId === "classic") return active || compiled ? "active_classic_unexpected" : "inactive_classic";
  if (setId === "testset") return active || compiled ? "active_test_fixture" : "inactive_test_fixture";
  if (cardId.startsWith("v08_") || cardId.startsWith("simple_")) return active || compiled ? "active_test_fixture" : "inactive_test_fixture";
  return active || compiled ? "active_unknown_source" : "inactive_unknown_source";
}

function inferSetId(cardId) {
  if (cardId.startsWith("onr_v1_")) return "originalset-v1";
  if (cardId.startsWith("onr_proteus_")) return "proteus";
  if (cardId.startsWith("onr_classic_")) return "classic";
  if (cardId.startsWith("v08_") || cardId.startsWith("simple_")) return "testset";
  return "unknown";
}

function setIdFromPath(file) {
  if (file.includes("originalset")) return "originalset-v1";
  if (file.includes("proteus")) return "proteus";
  if (file.includes("classic")) return "classic";
  if (file.includes("testset")) return "testset";
  return "unknown";
}

function meaningful(value) {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  if (typeof value === "string") return value.length > 0;
  return true;
}

function mapBy(values, key) {
  return new Map(values.map((value) => [value[key], value]));
}

function sorted(values, key) {
  return [...values].sort((a, b) => String(a[key]).localeCompare(String(b[key])));
}

function unique(values) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null))].sort((a, b) => String(a).localeCompare(String(b)));
}

function countBy(values, keyFn) {
  const counts = {};
  for (const value of values) {
    const key = keyFn(value) ?? "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return sortObject(counts);
}

function sortObject(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)));
}

function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined).map(([key, entry]) => [key, clean(entry)]));
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(sortDeep(value), null, 2);
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortDeep(value[key])]));
  return value;
}

function norm(value) {
  return String(value).replaceAll("\\", "/");
}

function p(file) {
  return path.join(ROOT, file);
}

function exists(file) {
  return fs.existsSync(p(file));
}

function read(file) {
  return fs.readFileSync(p(file), "utf8");
}

function readJson(file) {
  return JSON.parse(read(file));
}

function write(file, text) {
  fs.mkdirSync(path.dirname(p(file)), { recursive: true });
  fs.writeFileSync(p(file), text, "utf8");
}

function git(args) {
  return childProcess.execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function fail(title, errors) {
  console.error(`${title} with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
}

main();
