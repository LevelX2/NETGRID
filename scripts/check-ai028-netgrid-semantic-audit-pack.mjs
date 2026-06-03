#!/usr/bin/env node
import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const TASK_ID = "AI028";
const GENERATED_AT = "2026-06-03";
const GUIDE_VERSION = "V3";
const GUIDE_PATH = "docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md";
const JSON_REPORT_PATH = "docs/reviews/ai/ai028-netgrid-semantic-audit-pack-2026-06-03.json";
const MARKDOWN_REPORT_PATH = "docs/reviews/ai/ai028-netgrid-semantic-audit-pack-2026-06-03.md";

const CARD_FILES = [
  "data/cards/originalset-v1-cards.json",
  "data/cards/proteus-cards.json",
  "data/cards/classic-cards.json",
  "data/cards/testset-cards.json",
];

const INPUT_FILES = [
  GUIDE_PATH,
  "data/ai/tactic-signals-v1.json",
  "data/ai/function-signal-derivation-v1.json",
  "data/ai/ai-card-hints-active.json",
  "data/ai/ai-card-hints-compiled.json",
  "data/ai/ai-hint-inspector-index.json",
  "data/ai/strategy-goals-v1.json",
  "data/ai/strategic-roles-v1.json",
  ...CARD_FILES,
  "docs/reviews/ai/ai024-1-corp-ice-semantics-polish-report-2026-06-02.json",
  "docs/reviews/ai/ai025-1-corp-operations-semantics-polish-report-2026-06-02.json",
  "docs/reviews/ai/ai026-1-corp-nodes-assets-semantics-polish-report-2026-06-02.json",
  "docs/reviews/ai/ai027-derivation-inspector-guide-v3-alignment-report-2026-06-03.json",
];

const REQUIRED_REPORT_KEYS = [
  "taskId",
  "generatedAt",
  "sourceCommit",
  "guideVersion",
  "inputs",
  "counts",
  "cardInventory",
  "cardSemanticProfiles",
  "signalCatalogSummary",
  "signalUsageIndex",
  "strategySupportPairInventory",
  "targetProfileInventory",
  "conditionInventory",
  "riskInventory",
  "constraintInventory",
  "hiddenInfoPolicyInventory",
  "legacyAggregationSignals",
  "supportingEvidenceOnlySignals",
  "derivedPossibleStrategyAnchorInventory",
  "reviewedStrategySupportPairInventory",
  "testFixtureCardSeparation",
  "guideV3RuleFindings",
  "taxonomySmells",
  "deferredItems",
  "recommendedFollowups",
  "noEffectFlags",
  "verification",
];

const NO_EFFECT_FLAGS = {
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

const FINDING_SEVERITIES = new Set(["info", "warning", "error"]);
const FINDING_CATEGORIES = new Set([
  "taxonomy",
  "card_semantics",
  "strategy_anchor",
  "target_profile",
  "condition",
  "risk",
  "constraint",
  "hidden_info",
  "legacy",
  "test_fixture",
]);

const FORBIDDEN_CHRONICLE_PATTERNS = [
  /docs[\\/]+reviews[\\/]+chronicle/i,
  /check-chronicle-choice-fallbacks/i,
  /chronicle/i,
];

const PRECISE_DAMAGE_SIGNAL_RE = /(^|\.)(brain|meat|net|damage)(\.|_|$)|damage_(ambush|kill|prevention)|access\.corp_.*damage|ice\..*damage|tag\..*damage|trace\..*damage/i;
const TESTSET_V08_RE = /^v08_/;

function main() {
  const args = new Set(process.argv.slice(2));

  if (args.has("--write")) {
    const report = buildReport({ verificationPassed: args.has("--verification-passed") });
    const markdown = renderMarkdown(report);
    const errors = validateReport(report, markdown);
    if (errors.length > 0) {
      failWithErrors("AI028 semantic audit pack generation failed", errors);
      return;
    }
    writeText(JSON_REPORT_PATH, `${stableJson(report)}\n`);
    writeText(MARKDOWN_REPORT_PATH, `${markdown.trimEnd()}\n`);
    process.stdout.write(
      [
        "AI028_NETGRID_SEMANTIC_AUDIT_PACK WRITTEN",
        `cards=${report.counts.cardInventoryTotal}`,
        `profiles=${report.counts.cardSemanticProfiles}`,
        `signals=${report.counts.tacticSignals}`,
        `findings=${report.guideV3RuleFindings.length}`,
      ].join(" ") + "\n",
    );
    return;
  }

  const errors = [];
  if (!fs.existsSync(repoPath(JSON_REPORT_PATH))) errors.push(`Missing ${JSON_REPORT_PATH}`);
  if (!fs.existsSync(repoPath(MARKDOWN_REPORT_PATH))) errors.push(`Missing ${MARKDOWN_REPORT_PATH}`);
  if (errors.length === 0) {
    const report = readJson(JSON_REPORT_PATH);
    const markdown = readText(MARKDOWN_REPORT_PATH);
    errors.push(...validateReport(report, markdown));
    errors.push(...validateNoChronicleState(report, markdown));
  }

  if (errors.length > 0) {
    failWithErrors("AI028 semantic audit pack check failed", errors);
    return;
  }

  const report = readJson(JSON_REPORT_PATH);
  process.stdout.write(
    [
      "AI028_NETGRID_SEMANTIC_AUDIT_PACK OK",
      `sourceCommit=${report.sourceCommit}`,
      `cards=${report.counts.cardInventoryTotal}`,
      `profiles=${report.counts.cardSemanticProfiles}`,
      `signals=${report.counts.tacticSignals}`,
      `findings=${report.guideV3RuleFindings.length}`,
    ].join(" ") + "\n",
  );
}

function buildReport({ verificationPassed }) {
  const tacticSignalData = readJson("data/ai/tactic-signals-v1.json");
  const derivationData = readJson("data/ai/function-signal-derivation-v1.json");
  const activeHintData = readJson("data/ai/ai-card-hints-active.json");
  const compiledHintData = readJson("data/ai/ai-card-hints-compiled.json");
  const inspectorData = readJson("data/ai/ai-hint-inspector-index.json");
  const strategyGoalData = readJson("data/ai/strategy-goals-v1.json");
  const strategicRoleData = readJson("data/ai/strategic-roles-v1.json");
  const previousReports = readPreviousReports();
  const cardCatalog = buildCardCatalog();

  const signals = sortBy(tacticSignalData.signals ?? [], (signal) => signal.signalId);
  const derivationRules = derivationData.derivationRules ?? [];
  const activeHints = sortBy(activeHintData.cards ?? [], (card) => card.cardId);
  const compiledHints = sortBy(compiledHintData.cards ?? [], (card) => card.cardId);
  const inspectorCards = sortBy(inspectorData.cards ?? [], (card) => card.cardId);
  const strategyGoals = sortBy(strategyGoalData.strategyGoals ?? [], (goal) => goal.strategyId);
  const strategicRoles = sortBy(strategicRoleData.strategicRoles ?? [], (role) => role.roleId);

  const activeById = new Map(activeHints.map((card) => [card.cardId, card]));
  const compiledById = new Map(compiledHints.map((card) => [card.cardId, card]));
  const inspectorById = new Map(inspectorCards.map((card) => [card.cardId, card]));
  const signalById = new Map(signals.map((signal) => [signal.signalId, signal]));
  const derivationRulesBySignal = groupBy(derivationRules, (rule) => rule.signalId);
  const strategyIds = new Set(strategyGoals.map((goal) => goal.strategyId));

  const inventoryIds = sortedUnique([
    ...activeById.keys(),
    ...compiledById.keys(),
    ...inspectorById.keys(),
    ...cardCatalog.cards
      .filter((card) => card.setId === "classic" && !activeById.has(card.cardId) && !compiledById.has(card.cardId))
      .map((card) => card.cardId),
    ...cardCatalog.cards
      .filter((card) => card.setId === "testset" && !activeById.has(card.cardId) && !compiledById.has(card.cardId))
      .map((card) => card.cardId),
  ]);

  const cardInventory = inventoryIds.map((cardId) =>
    buildCardInventoryEntry({
      cardId,
      activeById,
      compiledById,
      inspectorById,
      cardCatalog,
    }),
  );

  const cardSemanticProfiles = sortedUnique([
    ...activeById.keys(),
    ...compiledById.keys(),
    ...inspectorById.keys(),
  ]).map((cardId) =>
    buildCardSemanticProfile({
      cardId,
      activeById,
      compiledById,
      inspectorById,
      cardCatalog,
      signalById,
      derivationRulesBySignal,
    }),
  );

  const signalUsageIndex = buildSignalUsageIndex({
    signals,
    derivationRulesBySignal,
    activeHints,
    compiledHints,
    inspectorCards,
  });
  const signalCatalogSummary = buildSignalCatalogSummary({ signals, signalUsageIndex });
  const reviewedStrategySupportPairInventory = buildReviewedStrategySupportPairInventory({
    inspectorCards,
    cardCatalog,
  });
  const derivedPossibleStrategyAnchorInventory = buildDerivedPossibleStrategyAnchorInventory({
    inspectorCards,
    cardCatalog,
    signalById,
    derivationRulesBySignal,
  });
  const strategySupportPairInventory = buildStrategySupportPairInventory({
    cardSemanticProfiles,
    reviewedStrategySupportPairInventory,
    derivedPossibleStrategyAnchorInventory,
  });
  const targetProfileInventory = buildTargetProfileInventory({ compiledHints, activeHints, cardCatalog });
  const conditionInventory = buildConditionInventory({ compiledHints, activeHints, cardCatalog });
  const riskInventory = buildRiskInventory({ compiledHints, activeHints, cardCatalog });
  const constraintInventory = buildConstraintInventory({ compiledHints, activeHints, cardCatalog });
  const hiddenInfoPolicyInventory = buildHiddenInfoPolicyInventory({ targetProfileInventory, compiledHints, cardCatalog });
  const legacyAggregationSignals = signals
    .filter((signal) => signal.legacy === true || signal.aggregation === true || signal.notForDirectScoring === true)
    .map((signal) => ({
      signalId: signal.signalId,
      supportOnly: signal.supportOnly,
      mayAnchorStrategy: signal.mayAnchorStrategy,
      allowedStrategyAnchors: signal.allowedStrategyAnchors ?? [],
      legacy: signal.legacy === true,
      aggregation: signal.aggregation === true,
      notForDirectScoring: signal.notForDirectScoring === true,
      directActiveUsageCount: signalUsageIndex.find((entry) => entry.signalId === signal.signalId)?.activeTacticUsageCount ?? 0,
      directCompiledUsageCount:
        signalUsageIndex.find((entry) => entry.signalId === signal.signalId)?.compiledTacticUsageCount ?? 0,
    }));
  const supportingEvidenceOnlySignals = buildSupportingEvidenceOnlySignals({
    signals,
    inspectorCards,
    signalUsageIndex,
  });
  const testFixtureCardSeparation = buildTestFixtureCardSeparation({ cardInventory, cardCatalog });
  const taxonomySmells = buildTaxonomySmells({
    signals,
    signalUsageIndex,
    cardSemanticProfiles,
    reviewedStrategySupportPairInventory,
    targetProfileInventory,
    hiddenInfoPolicyInventory,
  });
  const guideV3RuleFindings = buildGuideV3RuleFindings({
    taxonomySmells,
    cardSemanticProfiles,
    reviewedStrategySupportPairInventory,
    targetProfileInventory,
    conditionInventory,
    hiddenInfoPolicyInventory,
    testFixtureCardSeparation,
    strategyGoals,
  });

  const counts = buildCounts({
    activeHints,
    compiledHints,
    inspectorCards,
    signals,
    derivationRules,
    strategyGoals,
    strategicRoles,
    cardInventory,
    cardSemanticProfiles,
    signalUsageIndex,
    reviewedStrategySupportPairInventory,
    derivedPossibleStrategyAnchorInventory,
    targetProfileInventory,
    conditionInventory,
    riskInventory,
    constraintInventory,
    hiddenInfoPolicyInventory,
    testFixtureCardSeparation,
    taxonomySmells,
    guideV3RuleFindings,
  });

  return {
    schemaVersion: "ai028-netgrid-semantic-audit-pack-v1",
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    status: verificationPassed ? "verified" : "generated",
    sourceCommit: shortGitHead(),
    guideVersion: GUIDE_VERSION,
    guidePath: GUIDE_PATH,
    inputs: {
      inputFiles: INPUT_FILES,
      previousSemanticBatches: previousReports,
      generationMode:
        "read-only semantic inventory and Guide V3 audit; no card hint, tactic signal, derivation, inspector, runtime, planner, engine, legal, targeting or UI semantic change",
    },
    counts,
    cardInventory,
    cardSemanticProfiles,
    signalCatalogSummary,
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
    deferredItems: buildDeferredItems({ taxonomySmells, targetProfileInventory, conditionInventory }),
    recommendedFollowups: buildRecommendedFollowups({ taxonomySmells, targetProfileInventory, conditionInventory }),
    noEffectFlags: { ...NO_EFFECT_FLAGS },
    verification: buildVerification({ verificationPassed }),
  };
}

function buildCardCatalog() {
  const cards = [];
  const byId = new Map();
  for (const relativePath of CARD_FILES) {
    const data = readJson(relativePath);
    for (const card of data.cards ?? []) {
      const entry = {
        cardId: card.cardId,
        title: card.title,
        side: card.side,
        cardType: card.type,
        subtypes: card.subtypes ?? [],
        setId: card.setId ?? data.setId ?? setIdFromPath(relativePath),
        setName: card.setName ?? data.setName,
        collectorNumber: card.collectorNumber,
        sourceCardFile: relativePath,
      };
      cards.push(entry);
      byId.set(entry.cardId, entry);
    }
  }
  return { cards: sortBy(cards, (card) => card.cardId), byId };
}

function buildCardInventoryEntry({ cardId, activeById, compiledById, inspectorById, cardCatalog }) {
  const active = activeById.get(cardId);
  const compiled = compiledById.get(cardId);
  const inspector = inspectorById.get(cardId);
  const card = cardCatalog.byId.get(cardId);
  const hint = compiled ?? active ?? {};
  const setId = card?.setId ?? inferSetId(cardId);
  const inventoryClass = inventoryClassFor({ cardId, setId, active, compiled });
  return removeUndefined({
    cardId,
    title: card?.title,
    side: hint.side ?? inspector?.side ?? card?.side,
    cardType: hint.cardType ?? inspector?.cardType ?? card?.cardType,
    setId,
    setName: card?.setName,
    sourceCardFile: card?.sourceCardFile,
    inventoryClass,
    presentInActiveHints: Boolean(active),
    presentInCompiledHints: Boolean(compiled),
    presentInInspector: Boolean(inspector),
    aiSupportStatus: hint.aiSupportStatus ?? inspector?.supportStatus?.aiSupportStatus ?? "not_active",
    tacticSignalCount: (hint.tacticSignals ?? []).length,
    lineSupportCount: (hint.lineSupport ?? []).length,
    targetProfileCount: (hint.targetProfiles ?? []).length,
    conditionCount: (hint.conditions ?? []).length,
    riskTagCount: (hint.riskTags ?? []).length,
    inspectorWarningCount: inspector?.supportStatus?.warningCount,
    inspectorWarningCategories: inspector?.warningCategories ?? undefined,
  });
}

function buildCardSemanticProfile({
  cardId,
  activeById,
  compiledById,
  inspectorById,
  cardCatalog,
  signalById,
  derivationRulesBySignal,
}) {
  const active = activeById.get(cardId);
  const compiled = compiledById.get(cardId);
  const inspector = inspectorById.get(cardId);
  const hint = compiled ?? active ?? {};
  const card = cardCatalog.byId.get(cardId);
  const setId = card?.setId ?? inferSetId(cardId);
  const derivedAnchorSupportSignals = {};
  for (const strategyId of inspector?.derivedPossibleStrategyAnchors ?? []) {
    derivedAnchorSupportSignals[strategyId] = signalsThatAnchor({
      strategyId,
      signals: inspector?.derivedFunctionSignals ?? [],
      signalById,
      derivationRulesBySignal,
    });
  }
  return removeUndefined({
    cardId,
    title: card?.title,
    side: hint.side ?? inspector?.side ?? card?.side,
    cardType: hint.cardType ?? inspector?.cardType ?? card?.cardType,
    setId,
    inventoryClass: inventoryClassFor({ cardId, setId, active, compiled }),
    roles: hint.roles ?? [],
    planRoles: hint.planRoles ?? [],
    strategicRole: hint.strategicRole ?? [],
    requiredMechanics: hint.requiredMechanics ?? [],
    tacticSignals: hint.tacticSignals ?? [],
    lineSupport: hint.lineSupport ?? [],
    effectKinds: sortedUnique((hint.effects ?? []).map((effect) => effect.kind).filter(Boolean)),
    effectTimings: sortedUnique((hint.effects ?? []).map((effect) => effect.timing).filter(Boolean)),
    targetProfileCount: (hint.targetProfiles ?? []).length,
    conditionCount: (hint.conditions ?? []).length,
    riskTags: hint.riskTags ?? [],
    constraintSummary: summarizeCardConstraints(hint),
    hiddenInfoPolicies: hiddenInfoPoliciesForHint(hint),
    cardLevelStrategyAnchors: inspector?.cardLevelStrategyAnchors ?? [],
    derivedFunctionSignals: inspector?.derivedFunctionSignals ?? [],
    derivedPossibleStrategyAnchors: inspector?.derivedPossibleStrategyAnchors ?? [],
    derivedAnchorSupportSignals,
    reviewedStrategySupportPairs: inspector?.reviewedStrategySupportPairs ?? [],
    supportingEvidenceOnly: inspector?.supportingEvidenceOnly ?? [],
    descriptorGaps: inspector?.descriptorGaps ?? [],
    warningCategories: inspector?.warningCategories ?? [],
    legacyStatus: inspector?.legacyStatus,
    activeHintFound: Boolean(active),
    compiledHintFound: Boolean(compiled),
    inspectorFound: Boolean(inspector),
  });
}

function buildSignalUsageIndex({ signals, derivationRulesBySignal, activeHints, compiledHints, inspectorCards }) {
  const activeUsage = usageMapFromCards(activeHints, (card) => card.tacticSignals ?? []);
  const compiledUsage = usageMapFromCards(compiledHints, (card) => card.tacticSignals ?? []);
  const derivedUsage = usageMapFromCards(inspectorCards, (card) => card.derivedFunctionSignals ?? []);
  const supportingOnlyUsage = usageMapFromCards(inspectorCards, (card) => card.supportingEvidenceOnly ?? []);
  const signalIds = sortedUnique([
    ...signals.map((signal) => signal.signalId),
    ...activeUsage.keys(),
    ...compiledUsage.keys(),
    ...derivedUsage.keys(),
    ...supportingOnlyUsage.keys(),
  ]);

  const signalById = new Map(signals.map((signal) => [signal.signalId, signal]));
  return signalIds.map((signalId) => {
    const signal = signalById.get(signalId);
    const derivationRules = derivationRulesBySignal.get(signalId) ?? [];
    return {
      signalId,
      cataloged: Boolean(signal),
      group: signal?.group,
      sideScope: signal?.sideScope,
      supportOnly: signal?.supportOnly ?? false,
      mayAnchorStrategy: signal?.mayAnchorStrategy ?? false,
      allowedStrategyAnchors: signal?.allowedStrategyAnchors ?? [],
      legacy: signal?.legacy === true,
      aggregation: signal?.aggregation === true,
      notForDirectScoring: signal?.notForDirectScoring === true,
      targetProfileRelevant: signal?.targetProfileRelevant === true,
      derivationRuleCount: derivationRules.length,
      derivationStrategyAnchors: sortedUnique(
        derivationRules.flatMap((rule) => rule.strategyAnchorFor ?? []),
      ),
      activeTacticUsageCount: (activeUsage.get(signalId) ?? []).length,
      activeTacticUsageCards: activeUsage.get(signalId) ?? [],
      compiledTacticUsageCount: (compiledUsage.get(signalId) ?? []).length,
      compiledTacticUsageCards: compiledUsage.get(signalId) ?? [],
      inspectorDerivedUsageCount: (derivedUsage.get(signalId) ?? []).length,
      inspectorDerivedUsageCards: derivedUsage.get(signalId) ?? [],
      inspectorSupportingOnlyCount: (supportingOnlyUsage.get(signalId) ?? []).length,
      inspectorSupportingOnlyCards: supportingOnlyUsage.get(signalId) ?? [],
    };
  });
}

function buildSignalCatalogSummary({ signals, signalUsageIndex }) {
  return {
    totalSignals: signals.length,
    byGroup: countBy(signals, (signal) => signal.group),
    bySideScope: countBy(signals, (signal) => signal.sideScope),
    supportOnly: signals.filter((signal) => signal.supportOnly === true).length,
    mayAnchorStrategy: signals.filter((signal) => signal.mayAnchorStrategy === true).length,
    legacyOrAggregation: signals.filter(
      (signal) => signal.legacy === true || signal.aggregation === true || signal.notForDirectScoring === true,
    ).length,
    targetProfileRelevant: signals.filter((signal) => signal.targetProfileRelevant === true).length,
    uncatalogedSignalsUsed: signalUsageIndex.filter((entry) => !entry.cataloged).map((entry) => entry.signalId),
    signalsWithNoDirectCompiledUsage: signalUsageIndex
      .filter((entry) => entry.cataloged && entry.compiledTacticUsageCount === 0 && entry.inspectorDerivedUsageCount === 0)
      .map((entry) => entry.signalId),
  };
}

function buildReviewedStrategySupportPairInventory({ inspectorCards, cardCatalog }) {
  const entries = [];
  for (const card of inspectorCards) {
    for (const pair of card.reviewedStrategySupportPairs ?? []) {
      const catalogCard = cardCatalog.byId.get(card.cardId);
      entries.push({
        inventoryKind: "reviewed_strategy_support_pair",
        cardId: card.cardId,
        title: catalogCard?.title,
        side: card.side,
        cardType: card.cardType,
        strategyId: pair.strategyId,
        sourceField: pair.sourceField,
        sourceValue: pair.sourceValue,
        triageCategory: pair.triageCategory,
        rationale: pair.rationale,
      });
    }
  }
  return sortBy(entries, (entry) => `${entry.cardId}:${entry.strategyId}:${entry.sourceValue}`);
}

function buildDerivedPossibleStrategyAnchorInventory({ inspectorCards, cardCatalog, signalById, derivationRulesBySignal }) {
  const entries = [];
  for (const card of inspectorCards) {
    for (const strategyId of card.derivedPossibleStrategyAnchors ?? []) {
      const catalogCard = cardCatalog.byId.get(card.cardId);
      entries.push({
        inventoryKind: "derived_possible_strategy_anchor",
        cardId: card.cardId,
        title: catalogCard?.title,
        side: card.side,
        cardType: card.cardType,
        strategyId,
        sourceField: "derivedFunctionSignals",
        sourceSignals: signalsThatAnchor({
          strategyId,
          signals: card.derivedFunctionSignals ?? [],
          signalById,
          derivationRulesBySignal,
        }),
      });
    }
  }
  return sortBy(entries, (entry) => `${entry.cardId}:${entry.strategyId}`);
}

function buildStrategySupportPairInventory({
  cardSemanticProfiles,
  reviewedStrategySupportPairInventory,
  derivedPossibleStrategyAnchorInventory,
}) {
  const reviewedByCard = groupBy(reviewedStrategySupportPairInventory, (entry) => entry.cardId);
  const derivedByCard = groupBy(derivedPossibleStrategyAnchorInventory, (entry) => entry.cardId);
  return cardSemanticProfiles
    .filter(
      (profile) =>
        (profile.lineSupport ?? []).length > 0 ||
        (profile.cardLevelStrategyAnchors ?? []).length > 0 ||
        (profile.derivedPossibleStrategyAnchors ?? []).length > 0 ||
        (profile.reviewedStrategySupportPairs ?? []).length > 0,
    )
    .map((profile) => ({
      cardId: profile.cardId,
      title: profile.title,
      side: profile.side,
      cardType: profile.cardType,
      lineSupport: profile.lineSupport ?? [],
      cardLevelStrategyAnchors: profile.cardLevelStrategyAnchors ?? [],
      reviewedStrategySupportPairs: reviewedByCard.get(profile.cardId) ?? [],
      derivedPossibleStrategyAnchors: derivedByCard.get(profile.cardId) ?? [],
      separationStatus:
        "reviewedStrategySupportPairs are lineSupport/card-level review evidence; derivedPossibleStrategyAnchors are function-signal candidates only",
    }));
}

function buildTargetProfileInventory({ compiledHints, activeHints, cardCatalog }) {
  const activeById = new Map(activeHints.map((card) => [card.cardId, card]));
  const entries = [];
  for (const hint of compiledHints) {
    const activeHint = activeById.get(hint.cardId);
    for (const [index, profile] of (hint.targetProfiles ?? []).entries()) {
      const catalogCard = cardCatalog.byId.get(hint.cardId);
      entries.push({
        cardId: hint.cardId,
        title: catalogCard?.title,
        side: hint.side,
        cardType: hint.cardType,
        source: hasDeepEqualProfile(activeHint?.targetProfiles ?? [], profile) ? "active_or_compiled" : "compiled_generated",
        index,
        schemaVersion: profile.schemaVersion,
        kind: profile.kind,
        timing: profile.timing,
        targetType: profile.targetType,
        purpose: profile.purpose,
        hiddenInfoPolicy: profile.hiddenInfoPolicy,
        avoid: profile.avoid ?? [],
        preferences: profile.preferences ?? [],
        profile,
      });
    }
  }
  return sortBy(entries, (entry) => `${entry.cardId}:${entry.index}`);
}

function buildConditionInventory({ compiledHints, activeHints, cardCatalog }) {
  const activeById = new Map(activeHints.map((card) => [card.cardId, card]));
  const entries = [];
  for (const hint of compiledHints) {
    const activeHint = activeById.get(hint.cardId);
    for (const [index, condition] of (hint.conditions ?? []).entries()) {
      const catalogCard = cardCatalog.byId.get(hint.cardId);
      entries.push({
        cardId: hint.cardId,
        title: catalogCard?.title,
        side: hint.side,
        cardType: hint.cardType,
        source: hasDeepEqualProfile(activeHint?.conditions ?? [], condition) ? "active_or_compiled" : "compiled_generated",
        index,
        kind: condition.kind,
        condition,
      });
    }
  }
  return sortBy(entries, (entry) => `${entry.cardId}:${entry.index}`);
}

function buildRiskInventory({ compiledHints, activeHints, cardCatalog }) {
  const entries = [];
  for (const hint of compiledHints) {
    const catalogCard = cardCatalog.byId.get(hint.cardId);
    for (const riskTag of hint.riskTags ?? []) {
      entries.push({
        riskId: riskTag,
        sourceField: "riskTags",
        cardId: hint.cardId,
        title: catalogCard?.title,
        side: hint.side,
        cardType: hint.cardType,
      });
    }
    for (const signalId of (hint.tacticSignals ?? []).filter((signalId) => signalId.startsWith("risk."))) {
      entries.push({
        riskId: signalId,
        sourceField: "tacticSignals",
        cardId: hint.cardId,
        title: catalogCard?.title,
        side: hint.side,
        cardType: hint.cardType,
      });
    }
    if (hint.valueHints?.risk) {
      entries.push({
        riskId: String(hint.valueHints.risk),
        sourceField: "valueHints.risk",
        cardId: hint.cardId,
        title: catalogCard?.title,
        side: hint.side,
        cardType: hint.cardType,
      });
    }
  }
  const activeOnlyRiskCards = activeHints.filter((card) => !compiledHints.some((compiled) => compiled.cardId === card.cardId));
  for (const hint of activeOnlyRiskCards) {
    const catalogCard = cardCatalog.byId.get(hint.cardId);
    for (const riskTag of hint.riskTags ?? []) {
      entries.push({
        riskId: riskTag,
        sourceField: "riskTags",
        cardId: hint.cardId,
        title: catalogCard?.title,
        side: hint.side,
        cardType: hint.cardType,
      });
    }
  }
  return sortBy(entries, (entry) => `${entry.riskId}:${entry.cardId}:${entry.sourceField}`);
}

function buildConstraintInventory({ compiledHints, activeHints, cardCatalog }) {
  const entries = [];
  for (const hint of compiledHints) {
    const catalogCard = cardCatalog.byId.get(hint.cardId);
    const base = {
      cardId: hint.cardId,
      title: catalogCard?.title,
      side: hint.side,
      cardType: hint.cardType,
    };
    if (hasMeaningfulValue(hint.costProfile)) {
      entries.push({ ...base, constraintKind: "costProfile", sourceField: "costProfile", value: hint.costProfile });
    }
    if (hasMeaningfulValue(hint.breakerProfile)) {
      entries.push({ ...base, constraintKind: "breakerProfile", sourceField: "breakerProfile", value: hint.breakerProfile });
    }
    if (hasMeaningfulValue(hint.remoteRole?.serverScope)) {
      entries.push({
        ...base,
        constraintKind: "remoteRole.serverScope",
        sourceField: "remoteRole.serverScope",
        value: hint.remoteRole.serverScope,
      });
    }
    for (const [index, effect] of (hint.effects ?? []).entries()) {
      for (const field of ["actionCost", "perTurnLimit"]) {
        if (hasMeaningfulValue(effect[field])) {
          entries.push({
            ...base,
            constraintKind: `effects.${field}`,
            sourceField: `effects[${index}].${field}`,
            value: effect[field],
          });
        }
      }
    }
    for (const [index, targetProfile] of (hint.targetProfiles ?? []).entries()) {
      for (const field of [
        "avoid",
        "preferences",
        "oncePerRun",
        "shuffleAfter",
        "showToOpponent",
        "installCost",
        "installsTarget",
        "targetCardType",
        "zone",
      ]) {
        if (hasMeaningfulValue(targetProfile[field])) {
          entries.push({
            ...base,
            constraintKind: `targetProfiles.${field}`,
            sourceField: `targetProfiles[${index}].${field}`,
            value: targetProfile[field],
          });
        }
      }
    }
  }

  const activeOnly = activeHints.filter((hint) => !compiledHints.some((compiled) => compiled.cardId === hint.cardId));
  for (const hint of activeOnly) {
    const catalogCard = cardCatalog.byId.get(hint.cardId);
    if (hasMeaningfulValue(hint.costProfile)) {
      entries.push({
        cardId: hint.cardId,
        title: catalogCard?.title,
        side: hint.side,
        cardType: hint.cardType,
        constraintKind: "costProfile",
        sourceField: "costProfile",
        value: hint.costProfile,
      });
    }
  }

  return sortBy(entries, (entry) => `${entry.cardId}:${entry.sourceField}`);
}

function buildHiddenInfoPolicyInventory({ targetProfileInventory, compiledHints, cardCatalog }) {
  const entries = [];
  for (const target of targetProfileInventory) {
    entries.push({
      policyId: target.hiddenInfoPolicy ?? "missing_hidden_info_policy",
      sourceField: "targetProfiles.hiddenInfoPolicy",
      cardId: target.cardId,
      title: target.title,
      side: target.side,
      cardType: target.cardType,
      targetProfilePurpose: target.purpose,
    });
  }
  for (const hint of compiledHints) {
    if (hint.valueHints?.hidden_zone) {
      const catalogCard = cardCatalog.byId.get(hint.cardId);
      entries.push({
        policyId: String(hint.valueHints.hidden_zone),
        sourceField: "valueHints.hidden_zone",
        cardId: hint.cardId,
        title: catalogCard?.title,
        side: hint.side,
        cardType: hint.cardType,
      });
    }
  }
  return sortBy(entries, (entry) => `${entry.policyId}:${entry.cardId}:${entry.sourceField}`);
}

function buildSupportingEvidenceOnlySignals({ signals, inspectorCards, signalUsageIndex }) {
  const catalogById = new Map(signals.map((signal) => [signal.signalId, signal]));
  const supportOnlyIds = new Set([
    ...signals.filter((signal) => signal.supportOnly).map((signal) => signal.signalId),
    ...inspectorCards.flatMap((card) => card.supportingEvidenceOnly ?? []),
  ]);
  return [...supportOnlyIds].sort().map((signalId) => {
    const signal = catalogById.get(signalId);
    const usage = signalUsageIndex.find((entry) => entry.signalId === signalId);
    return {
      signalId,
      catalogSupportOnly: signal?.supportOnly === true,
      mayAnchorStrategy: signal?.mayAnchorStrategy ?? false,
      allowedStrategyAnchors: signal?.allowedStrategyAnchors ?? [],
      directCompiledUsageCount: usage?.compiledTacticUsageCount ?? 0,
      inspectorSupportingOnlyCount: usage?.inspectorSupportingOnlyCount ?? 0,
      sampleSupportingOnlyCards: (usage?.inspectorSupportingOnlyCards ?? []).slice(0, 20),
    };
  });
}

function buildTestFixtureCardSeparation({ cardInventory, cardCatalog }) {
  const byClass = groupBy(cardInventory, (entry) => entry.inventoryClass);
  const activeTestFixtures = cardInventory.filter(
    (entry) =>
      entry.inventoryClass === "active_test_fixture" &&
      entry.presentInActiveHints &&
      entry.presentInCompiledHints,
  );
  const activeV08 = activeTestFixtures.filter((entry) => TESTSET_V08_RE.test(entry.cardId));
  const inactiveClassic = byClass.get("inactive_classic") ?? [];
  const inactiveTestFixture = byClass.get("inactive_test_fixture") ?? [];
  const productionTitleContainsTest = cardCatalog.cards.filter(
    (card) =>
      card.setId !== "testset" &&
      /test/i.test(`${card.cardId} ${card.title ?? ""}`) &&
      cardInventory.some((entry) => entry.cardId === card.cardId && entry.presentInActiveHints),
  );
  return {
    classificationPolicy:
      "Fixture separation uses card set/cardId source, not a raw title substring. Production cards whose names contain Test remain production cards.",
    activeTestFixtureCount: activeTestFixtures.length,
    activeV08FixtureCount: activeV08.length,
    activeNonV08TestFixtureCount: activeTestFixtures.length - activeV08.length,
    inactiveTestFixtureCount: inactiveTestFixture.length,
    inactiveClassicCount: inactiveClassic.length,
    productionOriginalsetActiveCount: (byClass.get("production_originalset") ?? []).filter((entry) => entry.presentInActiveHints).length,
    productionProteusActiveCount: (byClass.get("production_proteus") ?? []).filter((entry) => entry.presentInActiveHints).length,
    activeTestFixtureCards: activeTestFixtures.map((entry) => entry.cardId),
    activeV08FixtureCards: activeV08.map((entry) => entry.cardId),
    inactiveClassicCards: inactiveClassic.map((entry) => entry.cardId),
    inactiveTestFixtureCards: inactiveTestFixture.map((entry) => entry.cardId),
    productionCardsWithTestInNameKeptAsProduction: productionTitleContainsTest.map((card) => ({
      cardId: card.cardId,
      title: card.title,
      setId: card.setId,
    })),
  };
}

function buildTaxonomySmells({
  signals,
  signalUsageIndex,
  cardSemanticProfiles,
  reviewedStrategySupportPairInventory,
  targetProfileInventory,
  hiddenInfoPolicyInventory,
}) {
  const typeSubtypeSignalSmells = signals
    .filter((signal) => {
      const id = signal.signalId;
      if (/^(agenda|asset|event|hardware|identity|operation|program|resource|upgrade)$/.test(id)) return true;
      if (/\.(agenda|asset|event|hardware|identity|operation|program|resource|upgrade)$/.test(id)) return true;
      if (/\.(wall|sentry|code_gate)$/.test(id)) return true;
      return false;
    })
    .map((signal) => signal.signalId);

  const supportOnlySignalsWithAnchors = signals
    .filter((signal) => signal.supportOnly === true && (signal.allowedStrategyAnchors ?? []).length > 0)
    .map((signal) => signal.signalId);

  const mayAnchorWithoutAllowedAnchor = signals
    .filter((signal) => signal.mayAnchorStrategy === true && (signal.allowedStrategyAnchors ?? []).length === 0)
    .map((signal) => signal.signalId);

  const uncatalogedSignalsUsed = signalUsageIndex
    .filter((entry) => !entry.cataloged)
    .map((entry) => entry.signalId);

  const directLegacyAggregationUsage = signalUsageIndex
    .filter(
      (entry) =>
        (entry.legacy || entry.aggregation || entry.notForDirectScoring) &&
        (entry.activeTacticUsageCount > 0 || entry.compiledTacticUsageCount > 0),
    )
    .map((entry) => ({
      signalId: entry.signalId,
      activeTacticUsageCount: entry.activeTacticUsageCount,
      compiledTacticUsageCount: entry.compiledTacticUsageCount,
      sampleCards: sortedUnique([...(entry.activeTacticUsageCards ?? []), ...(entry.compiledTacticUsageCards ?? [])]).slice(0, 20),
    }));

  const broadDamageOnlyAnchors = cardSemanticProfiles
    .filter((profile) => {
      const tacticSignals = profile.tacticSignals ?? [];
      if (!tacticSignals.includes("damage.payoff")) return false;
      const preciseDamageSignals = tacticSignals.filter(
        (signalId) => signalId !== "damage.payoff" && PRECISE_DAMAGE_SIGNAL_RE.test(signalId),
      );
      const hasDamageKill = [
        ...(profile.lineSupport ?? []),
        ...(profile.cardLevelStrategyAnchors ?? []),
        ...(profile.derivedPossibleStrategyAnchors ?? []),
      ].includes("corp.damage_kill");
      return hasDamageKill && preciseDamageSignals.length === 0;
    })
    .map((profile) => ({
      cardId: profile.cardId,
      title: profile.title,
      lineSupport: profile.lineSupport ?? [],
      cardLevelStrategyAnchors: profile.cardLevelStrategyAnchors ?? [],
      derivedPossibleStrategyAnchors: profile.derivedPossibleStrategyAnchors ?? [],
      tacticSignals: profile.tacticSignals ?? [],
    }));

  const reviewedPairsWithNonLineSupportSource = reviewedStrategySupportPairInventory.filter(
    (entry) => entry.sourceField !== "lineSupport",
  );

  const targetProfilesMissingHiddenInfoPolicy = targetProfileInventory
    .filter((entry) => !entry.hiddenInfoPolicy)
    .map((entry) => ({ cardId: entry.cardId, title: entry.title, index: entry.index, purpose: entry.purpose }));

  const unsafeHiddenInfoPolicyRefs = hiddenInfoPolicyInventory.filter((entry) =>
    /private|fullState|stateHash|legalActions|playerActions|secret|token|reconnect|undo/i.test(entry.policyId),
  );

  const descriptorGapCards = cardSemanticProfiles
    .filter((profile) => (profile.descriptorGaps ?? []).length > 0)
    .map((profile) => ({
      cardId: profile.cardId,
      title: profile.title,
      descriptorGapCount: profile.descriptorGaps.length,
      descriptorGaps: profile.descriptorGaps,
    }));

  return {
    typeSubtypeSignalSmells,
    supportOnlySignalsWithAnchors,
    mayAnchorWithoutAllowedAnchor,
    uncatalogedSignalsUsed,
    directLegacyAggregationUsage,
    broadDamageOnlyAnchors,
    reviewedPairsWithNonLineSupportSource,
    targetProfilesMissingHiddenInfoPolicy,
    unsafeHiddenInfoPolicyRefs,
    descriptorGapCards,
    inspectorWarningCategoryCounts: countWarningCategories(cardSemanticProfiles),
  };
}

function buildGuideV3RuleFindings({
  taxonomySmells,
  cardSemanticProfiles,
  reviewedStrategySupportPairInventory,
  targetProfileInventory,
  conditionInventory,
  hiddenInfoPolicyInventory,
  testFixtureCardSeparation,
  strategyGoals,
}) {
  const findings = [];
  const add = (finding) => findings.push(finding);

  add({
    findingId: "AI028-F001",
    severity: "info",
    category: "taxonomy",
    description: `Strategy-goal taxonomy remains at ${strategyGoals.length} IDs; AI028 adds no strategy ID.`,
    guideV3Rule: "Strategyanker are a controlled taxonomy and are not created by audit/report work.",
    recommendedAction: "Keep AI028 as evidence only.",
    suggestedTask: "none",
  });

  if (taxonomySmells.uncatalogedSignalsUsed.length > 0) {
    add({
      findingId: "AI028-F002",
      severity: "error",
      category: "taxonomy",
      description: `Uncataloged tactic signals are used: ${taxonomySmells.uncatalogedSignalsUsed.join(", ")}`,
      guideV3Rule: "Taktiksignale must be controlled catalog values.",
      recommendedAction: "Catalog or remove the affected signal IDs in a dedicated semantic cleanup.",
      suggestedTask: "AI029 candidate",
    });
  } else {
    add({
      findingId: "AI028-F002",
      severity: "info",
      category: "taxonomy",
      description: "All active, compiled and inspector-derived tactic signals are cataloged.",
      guideV3Rule: "Taktiksignale must be controlled catalog values.",
      recommendedAction: "No AI028 semantic change.",
      suggestedTask: "none",
    });
  }

  if (taxonomySmells.typeSubtypeSignalSmells.length > 0) {
    add({
      findingId: "AI028-F003",
      severity: "warning",
      category: "taxonomy",
      description: `Potential type/subtype-shaped signal IDs need later review: ${taxonomySmells.typeSubtypeSignalSmells.join(", ")}`,
      guideV3Rule: "Card types and subtypes are card semantics first, not automatic tactic signals.",
      recommendedAction: "Review as taxonomy candidates; do not rename inside AI028.",
      suggestedTask: "AI029 candidate",
    });
  } else {
    add({
      findingId: "AI028-F003",
      severity: "info",
      category: "taxonomy",
      description: "No exact type/subtype-only tactic signal smell was detected by the AI028 audit.",
      guideV3Rule: "Card types and subtypes are card semantics first, not automatic tactic signals.",
      recommendedAction: "No AI028 semantic change.",
      suggestedTask: "none",
    });
  }

  if (taxonomySmells.directLegacyAggregationUsage.length > 0) {
    add({
      findingId: "AI028-F004",
      severity: "warning",
      category: "legacy",
      signalId: taxonomySmells.directLegacyAggregationUsage.map((entry) => entry.signalId).join(", "),
      description: `Legacy/aggregation signals still appear directly on cards: ${taxonomySmells.directLegacyAggregationUsage
        .map((entry) => `${entry.signalId}=${entry.compiledTacticUsageCount}`)
        .join(", ")}`,
      guideV3Rule: "Legacy aggregation signals are supporting evidence only and should not be primary scoring inputs.",
      recommendedAction: "Keep as deferred evidence unless a later batch replaces the direct card usage with precise signals.",
      suggestedTask: "AI029/AI030 followup",
    });
  } else {
    add({
      findingId: "AI028-F004",
      severity: "info",
      category: "legacy",
      description: "No legacy/aggregation signal direct card usage remains.",
      guideV3Rule: "Legacy aggregation signals are supporting evidence only.",
      recommendedAction: "No AI028 semantic change.",
      suggestedTask: "none",
    });
  }

  if (taxonomySmells.broadDamageOnlyAnchors.length > 0) {
    add({
      findingId: "AI028-F005",
      severity: "warning",
      category: "card_semantics",
      description: `${taxonomySmells.broadDamageOnlyAnchors.length} damage-kill anchor candidate(s) rely on broad damage.payoff without a precise damage tactic signal.`,
      guideV3Rule: "Damage type and access/ICE damage context must be separated; broad damage.payoff is not enough.",
      recommendedAction: "Review these cards in a later semantic batch; report only in AI028.",
      suggestedTask: "AI029 candidate",
    });
  } else {
    add({
      findingId: "AI028-F005",
      severity: "info",
      category: "card_semantics",
      description: "No damage-kill anchor was detected that relies only on broad damage.payoff.",
      guideV3Rule: "Damage type and access/ICE damage context must be separated.",
      recommendedAction: "No AI028 semantic change.",
      suggestedTask: "none",
    });
  }

  if (taxonomySmells.reviewedPairsWithNonLineSupportSource.length > 0) {
    add({
      findingId: "AI028-F006",
      severity: "error",
      category: "strategy_anchor",
      description: `${taxonomySmells.reviewedPairsWithNonLineSupportSource.length} reviewed StrategySupportPair(s) are not sourced from lineSupport.`,
      guideV3Rule: "Reviewed StrategySupportPairs and derivedPossibleStrategyAnchors must remain separate inventories.",
      recommendedAction: "Fix inspector derivation in a dedicated followup.",
      suggestedTask: "AI029 blocker",
    });
  } else {
    add({
      findingId: "AI028-F006",
      severity: "info",
      category: "strategy_anchor",
      description: `${reviewedStrategySupportPairInventory.length} reviewed StrategySupportPair entries are sourced from lineSupport; derivedPossibleStrategyAnchors stay separate.`,
      guideV3Rule: "Reviewed StrategySupportPairs and derivedPossibleStrategyAnchors must remain separate inventories.",
      recommendedAction: "No AI028 semantic change.",
      suggestedTask: "none",
    });
  }

  if (taxonomySmells.targetProfilesMissingHiddenInfoPolicy.length > 0) {
    add({
      findingId: "AI028-F007",
      severity: "warning",
      category: "target_profile",
      description: `${taxonomySmells.targetProfilesMissingHiddenInfoPolicy.length} TargetProfile(s) lack an explicit hiddenInfoPolicy.`,
      guideV3Rule: "TargetProfiles guide legal target choice without leaking hidden information.",
      recommendedAction: "Add or normalize policy fields in a later TargetProfile schema batch.",
      suggestedTask: "AI029 candidate",
    });
  } else {
    add({
      findingId: "AI028-F007",
      severity: "info",
      category: "target_profile",
      description: `${targetProfileInventory.length} TargetProfile entries carry explicit hiddenInfoPolicy values.`,
      guideV3Rule: "TargetProfiles guide legal target choice without leaking hidden information.",
      recommendedAction: "No AI028 semantic change.",
      suggestedTask: "none",
    });
  }

  if (taxonomySmells.unsafeHiddenInfoPolicyRefs.length > 0) {
    add({
      findingId: "AI028-F008",
      severity: "error",
      category: "hidden_info",
      description: `${taxonomySmells.unsafeHiddenInfoPolicyRefs.length} hidden-info policy value(s) contain unsafe/private-state wording.`,
      guideV3Rule: "No hidden card data may leak into AI inputs, payloads, logs, replay or UI derivations.",
      recommendedAction: "Replace unsafe policy references in a dedicated hidden-info cleanup.",
      suggestedTask: "AI029 blocker",
    });
  } else {
    add({
      findingId: "AI028-F008",
      severity: "info",
      category: "hidden_info",
      description: `${hiddenInfoPolicyInventory.length} hidden-info policy inventory entries have no private-state/token wording.`,
      guideV3Rule: "No hidden card data may leak into AI inputs, payloads, logs, replay or UI derivations.",
      recommendedAction: "No AI028 semantic change.",
      suggestedTask: "none",
    });
  }

  if (taxonomySmells.descriptorGapCards.length > 0) {
    add({
      findingId: "AI028-F009",
      severity: "warning",
      category: "constraint",
      description: `${taxonomySmells.descriptorGapCards.length} card(s) still have inspector descriptor gaps; classify as deferred schema/descriptor work.`,
      guideV3Rule: "Conditions, risks, constraints and target profiles should be machine-readable where reusable.",
      recommendedAction: "Triage descriptor gaps separately; AI028 only records them.",
      suggestedTask: "AI030 followup",
    });
  } else {
    add({
      findingId: "AI028-F009",
      severity: "info",
      category: "constraint",
      description: "No inspector descriptor gaps are present.",
      guideV3Rule: "Conditions, risks, constraints and target profiles should be machine-readable where reusable.",
      recommendedAction: "No AI028 semantic change.",
      suggestedTask: "none",
    });
  }

  add({
    findingId: "AI028-F010",
    severity: "info",
    category: "condition",
    description: `${conditionInventory.length} machine-readable condition entries are inventoried for later schema review.`,
    guideV3Rule: "Conditions are prerequisites or filters, not strategy anchors.",
    recommendedAction: "Use this inventory as the baseline for a later condition normalization batch.",
    suggestedTask: "AI029/AI030 followup",
  });

  add({
    findingId: "AI028-F011",
    severity: "info",
    category: "test_fixture",
    description: `${testFixtureCardSeparation.activeTestFixtureCount} active Testset cards, including ${testFixtureCardSeparation.activeV08FixtureCount} V08 cards, are separated from production inventories; ${testFixtureCardSeparation.inactiveClassicCount} Classic cards remain inactive.`,
    guideV3Rule: "Test/V08 cards and inactive Classic cards are evidence partitions, not production semantic corrections.",
    recommendedAction: "Keep fixture and inactive Classic counts separate in future semantic reports.",
    suggestedTask: "none",
  });

  return findings;
}

function buildCounts({
  activeHints,
  compiledHints,
  inspectorCards,
  signals,
  derivationRules,
  strategyGoals,
  strategicRoles,
  cardInventory,
  cardSemanticProfiles,
  signalUsageIndex,
  reviewedStrategySupportPairInventory,
  derivedPossibleStrategyAnchorInventory,
  targetProfileInventory,
  conditionInventory,
  riskInventory,
  constraintInventory,
  hiddenInfoPolicyInventory,
  testFixtureCardSeparation,
  taxonomySmells,
  guideV3RuleFindings,
}) {
  return {
    activeHintCards: activeHints.length,
    compiledHintCards: compiledHints.length,
    inspectorCards: inspectorCards.length,
    cardInventoryTotal: cardInventory.length,
    cardSemanticProfiles: cardSemanticProfiles.length,
    productionOriginalsetActiveCards: testFixtureCardSeparation.productionOriginalsetActiveCount,
    productionProteusActiveCards: testFixtureCardSeparation.productionProteusActiveCount,
    activeTestFixtureCards: testFixtureCardSeparation.activeTestFixtureCount,
    activeV08FixtureCards: testFixtureCardSeparation.activeV08FixtureCount,
    inactiveClassicCards: testFixtureCardSeparation.inactiveClassicCount,
    inactiveTestFixtureCards: testFixtureCardSeparation.inactiveTestFixtureCount,
    bySide: countBy(compiledHints, (card) => card.side),
    byCardType: countBy(compiledHints, (card) => card.cardType),
    tacticSignals: signals.length,
    derivationRules: derivationRules.length,
    strategyGoals: strategyGoals.length,
    strategicRoles: strategicRoles.length,
    signalUsageEntries: signalUsageIndex.length,
    reviewedStrategySupportPairs: reviewedStrategySupportPairInventory.length,
    derivedPossibleStrategyAnchors: derivedPossibleStrategyAnchorInventory.length,
    targetProfiles: targetProfileInventory.length,
    conditions: conditionInventory.length,
    riskInventoryEntries: riskInventory.length,
    constraintInventoryEntries: constraintInventory.length,
    hiddenInfoPolicyEntries: hiddenInfoPolicyInventory.length,
    taxonomySmellCounts: {
      typeSubtypeSignalSmells: taxonomySmells.typeSubtypeSignalSmells.length,
      supportOnlySignalsWithAnchors: taxonomySmells.supportOnlySignalsWithAnchors.length,
      mayAnchorWithoutAllowedAnchor: taxonomySmells.mayAnchorWithoutAllowedAnchor.length,
      uncatalogedSignalsUsed: taxonomySmells.uncatalogedSignalsUsed.length,
      directLegacyAggregationUsage: taxonomySmells.directLegacyAggregationUsage.length,
      broadDamageOnlyAnchors: taxonomySmells.broadDamageOnlyAnchors.length,
      reviewedPairsWithNonLineSupportSource: taxonomySmells.reviewedPairsWithNonLineSupportSource.length,
      targetProfilesMissingHiddenInfoPolicy: taxonomySmells.targetProfilesMissingHiddenInfoPolicy.length,
      unsafeHiddenInfoPolicyRefs: taxonomySmells.unsafeHiddenInfoPolicyRefs.length,
      descriptorGapCards: taxonomySmells.descriptorGapCards.length,
    },
    findingCountsBySeverity: countBy(guideV3RuleFindings, (finding) => finding.severity),
    noEffectFlagsFalse: Object.values(NO_EFFECT_FLAGS).every((value) => value === false),
  };
}

function buildDeferredItems({ taxonomySmells, targetProfileInventory, conditionInventory }) {
  return [
    {
      itemId: "AI028-D001",
      status: "deferred",
      category: "target_profile",
      description: `${targetProfileInventory.length} TargetProfile entries are inventoried but not normalized by AI028.`,
      trigger: "Guide V3 separates target choice from legality and tactic signals.",
      suggestedTask: "AI029 TargetProfile schema and purpose normalization",
    },
    {
      itemId: "AI028-D002",
      status: "deferred",
      category: "condition",
      description: `${conditionInventory.length} condition entries are inventoried; AI028 does not change condition names or shapes.`,
      trigger: "Conditions are prerequisites/filters and not strategy anchors.",
      suggestedTask: "AI029/AI030 Condition catalog cleanup",
    },
    {
      itemId: "AI028-D003",
      status: "deferred",
      category: "legacy",
      description: `${taxonomySmells.directLegacyAggregationUsage.length} legacy aggregation signal class(es) still have direct card usage and remain evidence-only candidates.`,
      trigger: "Legacy aliases are reportable but should not be silently reinterpreted by the audit pack.",
      suggestedTask: "AI030 Legacy aggregation signal retirement review",
    },
    {
      itemId: "AI028-D004",
      status: "deferred",
      category: "constraint",
      description: `${taxonomySmells.descriptorGapCards.length} inspector descriptor-gap card(s) remain outside AI028 scope.`,
      trigger: "Descriptor gaps may need dedicated schema work across constraints, conditions, roles or target profiles.",
      suggestedTask: "AI030 Descriptor-gap triage",
    },
  ];
}

function buildRecommendedFollowups({ taxonomySmells, targetProfileInventory, conditionInventory }) {
  return [
    {
      taskId: "AI029",
      priority: "normal",
      title: "TargetProfile-, Condition- und Constraint-Schema-Sweep",
      rationale: `${targetProfileInventory.length} TargetProfiles and ${conditionInventory.length} Conditions are now inventoried for a controlled schema cleanup without changing strategy IDs.`,
    },
    {
      taskId: "AI030",
      priority: taxonomySmells.descriptorGapCards.length > 0 ? "normal" : "low",
      title: "Descriptor-gap and legacy aggregation triage",
      rationale: `${taxonomySmells.descriptorGapCards.length} descriptor-gap cards and ${taxonomySmells.directLegacyAggregationUsage.length} direct legacy aggregation signal classes need candidate/deferred decisions.`,
    },
    {
      taskId: "AI031",
      priority: "low",
      title: "StrategySupportPair role model completion",
      rationale:
        "Reviewed StrategySupportPairs are separated from derived candidates; a later batch can add explicit role-within-strategy metadata where the Guide V3 model needs it.",
    },
  ];
}

function buildVerification({ verificationPassed }) {
  const status = verificationPassed ? "passed" : "pending";
  const mark = (command, extra = {}) => ({ command, status, ...extra });
  return {
    status,
    note: verificationPassed
      ? "Verification commands were run after report generation; root package has no check:deck-doctrine script, so the existing equivalent check:ai-deck-doctrine-strategy was run."
      : "Generated before full command verification; rerun with --write --verification-passed after all listed commands pass.",
    commands: [
      mark("node scripts/check-ai024-1-corp-ice-semantics-polish.mjs"),
      mark("node scripts/check-ai025-1-corp-operations-semantics-polish.mjs"),
      mark("node scripts/check-ai026-1-corp-nodes-assets-semantics-polish.mjs"),
      mark("node scripts/check-ai027-derivation-inspector-guide-v3-alignment.mjs"),
      mark("node scripts/check-ai028-netgrid-semantic-audit-pack.mjs"),
      mark("corepack pnpm check:ai-strategy-taxonomy"),
      mark("corepack pnpm check:ai-hint-quality"),
      mark("corepack pnpm check:ai-hint-compiled-index"),
      mark("corepack pnpm check:ai-approval-consistency"),
      mark("corepack pnpm check:deck-doctrine", {
        status: verificationPassed ? "not_available_equivalent_passed" : "not_available_equivalent_pending",
        equivalentCommand: "corepack pnpm check:ai-deck-doctrine-strategy",
      }),
      mark("corepack pnpm --filter @netgrid/ai test"),
      mark("corepack pnpm --filter @netgrid/ai typecheck"),
      mark("corepack pnpm --filter @netgrid/web typecheck"),
      mark("git diff --check"),
    ],
  };
}

function renderMarkdown(report) {
  const counts = report.counts;
  const warningFindings = report.guideV3RuleFindings.filter((finding) => finding.severity === "warning");
  const errorFindings = report.guideV3RuleFindings.filter((finding) => finding.severity === "error");
  const topWarningCategories = Object.entries(report.taxonomySmells.inspectorWarningCategoryCounts ?? {})
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 10)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");

  return `# AI028: NETGRID Semantic Audit Pack

Stand: ${report.generatedAt}
Guide: ${report.guideVersion} (${report.guidePath})
Source Commit: ${report.sourceCommit}
Status: ${report.status}

## Scope

AI028 ist ein globales, maschinenlesbares Audit-Pack nach AI024-1, AI025-1, AI026-1 und AI027. Der Lauf ist bewusst read-only: keine Card-Hints, Taktiksignale, Strategie-IDs, Ableitungsregeln, Inspector-Logik, Runtime-, Planner-, Engine-, Legal-, Targeting- oder UI-Pfade wurden semantisch geändert.

## Counts

- Aktive Hints: ${counts.activeHintCards}
- Kompilierte Hints: ${counts.compiledHintCards}
- Inspector-Karten: ${counts.inspectorCards}
- Card Inventory gesamt: ${counts.cardInventoryTotal}
- Semantic Profiles: ${counts.cardSemanticProfiles}
- Originalset aktiv: ${counts.productionOriginalsetActiveCards}
- Proteus aktiv: ${counts.productionProteusActiveCards}
- Testset aktiv: ${counts.activeTestFixtureCards} (davon V08: ${counts.activeV08FixtureCards})
- Classic inaktiv: ${counts.inactiveClassicCards}
- Taktiksignale: ${counts.tacticSignals}
- Ableitungsregeln: ${counts.derivationRules}
- StrategyGoals: ${counts.strategyGoals}
- Reviewed StrategySupportPairs: ${counts.reviewedStrategySupportPairs}
- Derived possible StrategyAnchors: ${counts.derivedPossibleStrategyAnchors}
- TargetProfiles: ${counts.targetProfiles}
- Conditions: ${counts.conditions}
- Risk-Inventar-Einträge: ${counts.riskInventoryEntries}
- Constraint-Inventar-Einträge: ${counts.constraintInventoryEntries}
- Hidden-Info-Policy-Einträge: ${counts.hiddenInfoPolicyEntries}

## Coverage

Das JSON enthält die geforderten Maschineninventare: Card Inventory, Card Semantic Profiles, Signal Catalog Summary, Signal Usage Index, StrategySupportPair-Inventar, TargetProfile-, Condition-, Risk-, Constraint- und Hidden-Info-Policy-Inventare, Legacy-/Aggregation-Signale, Supporting-Evidence-only-Signale, getrennte Inventare für derivedPossibleStrategyAnchors und reviewedStrategySupportPairs sowie die Test-/V08-/Classic-Separation.

## Guide-V3 Findings

- Error Findings: ${errorFindings.length}
- Warning Findings: ${warningFindings.length}
- Info Findings: ${report.guideV3RuleFindings.filter((finding) => finding.severity === "info").length}

${report.guideV3RuleFindings
  .map(
    (finding) =>
      `- ${finding.findingId} [${finding.severity}/${finding.category}]: ${finding.description} Empfehlung: ${finding.recommendedAction}`,
  )
  .join("\n")}

## Taxonomy Smells

- Type-/Subtype-Signal-Smells: ${counts.taxonomySmellCounts.typeSubtypeSignalSmells}
- Support-only-Signale mit erlaubten Anchors: ${counts.taxonomySmellCounts.supportOnlySignalsWithAnchors}
- May-anchor ohne erlaubte Anchors: ${counts.taxonomySmellCounts.mayAnchorWithoutAllowedAnchor}
- Unkatalogisierte genutzte Signale: ${counts.taxonomySmellCounts.uncatalogedSignalsUsed}
- Direkte Legacy-/Aggregation-Nutzung: ${counts.taxonomySmellCounts.directLegacyAggregationUsage}
- Broad-Damage-only-Anker: ${counts.taxonomySmellCounts.broadDamageOnlyAnchors}
- Reviewed-Pairs mit Nicht-lineSupport-Quelle: ${counts.taxonomySmellCounts.reviewedPairsWithNonLineSupportSource}
- TargetProfiles ohne HiddenInfoPolicy: ${counts.taxonomySmellCounts.targetProfilesMissingHiddenInfoPolicy}
- Unsichere Hidden-Info-Policy-Refs: ${counts.taxonomySmellCounts.unsafeHiddenInfoPolicyRefs}
- Descriptor-Gap-Karten: ${counts.taxonomySmellCounts.descriptorGapCards}

### Inspector Warning Categories

${topWarningCategories || "- Keine"}

## Test-/V08-/Classic-Separation

Die Fixture-Separation nutzt Set-Quelle und Card-ID, nicht bloße Titelstrings. Produktionskarten mit "Test" im Namen bleiben Produktionskarten. Aktive Testset-Fixtures: ${report.testFixtureCardSeparation.activeTestFixtureCount}; aktive V08-Fixtures: ${report.testFixtureCardSeparation.activeV08FixtureCount}; inaktive Classic-Karten: ${report.testFixtureCardSeparation.inactiveClassicCount}.

## Deferred Items

${report.deferredItems
  .map((item) => `- ${item.itemId} [${item.category}/${item.status}]: ${item.description} Vorschlag: ${item.suggestedTask}`)
  .join("\n")}

## Recommended Followups

${report.recommendedFollowups
  .map((item) => `- ${item.taskId} [${item.priority}]: ${item.title}. ${item.rationale}`)
  .join("\n")}

## No-Effect

Alle no-effect Flags sind false: Planner, ActionScore, PlanWeight, Targeting-AI, Engine, Legal, Profile/Default, UI-Derivation und Hidden-Info-Leak.

## Verification

Status: ${report.verification.status}

${report.verification.commands
  .map((entry) =>
    entry.equivalentCommand
      ? `- ${entry.command}: ${entry.status}; Equivalent: ${entry.equivalentCommand}`
      : `- ${entry.command}: ${entry.status}`,
  )
  .join("\n")}
`;
}

function validateReport(report, markdown) {
  const errors = [];
  for (const key of REQUIRED_REPORT_KEYS) {
    if (!(key in report)) errors.push(`Report missing top-level key ${key}`);
  }
  if (report.taskId !== TASK_ID) errors.push(`taskId must be ${TASK_ID}`);
  if (report.generatedAt !== GENERATED_AT) errors.push(`generatedAt must be ${GENERATED_AT}`);
  if (!report.sourceCommit || typeof report.sourceCommit !== "string") errors.push("sourceCommit must be set");
  if (report.guideVersion !== GUIDE_VERSION) errors.push(`guideVersion must be ${GUIDE_VERSION}`);
  if (report.guidePath !== GUIDE_PATH) errors.push("guidePath mismatch");
  if (!Array.isArray(report.inputs?.inputFiles) || report.inputs.inputFiles.length === 0) {
    errors.push("inputs.inputFiles must be a non-empty array");
  }
  for (const flag of Object.keys(NO_EFFECT_FLAGS)) {
    if (report.noEffectFlags?.[flag] !== false) errors.push(`noEffectFlags.${flag} must be false`);
  }
  if (!report.testFixtureCardSeparation || typeof report.testFixtureCardSeparation !== "object") {
    errors.push("testFixtureCardSeparation must exist");
  }
  if (!Array.isArray(report.derivedPossibleStrategyAnchorInventory)) {
    errors.push("derivedPossibleStrategyAnchorInventory must be an array");
  }
  if (!Array.isArray(report.reviewedStrategySupportPairInventory)) {
    errors.push("reviewedStrategySupportPairInventory must be an array");
  }
  for (const entry of report.derivedPossibleStrategyAnchorInventory ?? []) {
    if (entry.inventoryKind !== "derived_possible_strategy_anchor") {
      errors.push(`${entry.cardId ?? "unknown"} derived inventory entry has wrong inventoryKind`);
    }
    if (entry.sourceField !== "derivedFunctionSignals") {
      errors.push(`${entry.cardId ?? "unknown"} derived inventory entry must use derivedFunctionSignals sourceField`);
    }
  }
  for (const entry of report.reviewedStrategySupportPairInventory ?? []) {
    if (entry.inventoryKind !== "reviewed_strategy_support_pair") {
      errors.push(`${entry.cardId ?? "unknown"} reviewed inventory entry has wrong inventoryKind`);
    }
    if (entry.sourceField !== "lineSupport") {
      errors.push(`${entry.cardId ?? "unknown"} reviewed inventory entry must use lineSupport sourceField`);
    }
  }
  for (const finding of report.guideV3RuleFindings ?? []) {
    if (!finding.findingId) errors.push("finding missing findingId");
    if (!FINDING_SEVERITIES.has(finding.severity)) {
      errors.push(`${finding.findingId ?? "unknown"} has invalid severity ${finding.severity}`);
    }
    if (!FINDING_CATEGORIES.has(finding.category)) {
      errors.push(`${finding.findingId ?? "unknown"} has invalid category ${finding.category}`);
    }
    for (const field of ["description", "guideV3Rule", "recommendedAction", "suggestedTask"]) {
      if (!finding[field]) errors.push(`${finding.findingId ?? "unknown"} missing ${field}`);
    }
  }
  for (const key of [
    "cardInventory",
    "cardSemanticProfiles",
    "signalUsageIndex",
    "strategySupportPairInventory",
    "targetProfileInventory",
    "conditionInventory",
    "riskInventory",
    "constraintInventory",
    "hiddenInfoPolicyInventory",
    "legacyAggregationSignals",
    "supportingEvidenceOnlySignals",
    "deferredItems",
    "recommendedFollowups",
  ]) {
    if (!Array.isArray(report[key])) errors.push(`${key} must be an array`);
  }
  if (!markdown.includes("# AI028: NETGRID Semantic Audit Pack")) errors.push("Markdown report missing title");
  if (!markdown.includes("## Verification")) errors.push("Markdown report missing Verification section");
  if (!markdown.includes("## No-Effect")) errors.push("Markdown report missing No-Effect section");
  if (!markdown.includes("Test-/V08-/Classic-Separation")) errors.push("Markdown report missing fixture separation section");
  const text = `${stableJson(report)}\n${markdown}`;
  for (const pattern of FORBIDDEN_CHRONICLE_PATTERNS) {
    if (pattern.test(text)) errors.push(`Report references forbidden Chronicle pattern ${pattern}`);
  }
  return errors;
}

function validateNoChronicleState(report, markdown) {
  const errors = [];
  const text = `${stableJson(report)}\n${markdown}`;
  for (const pattern of FORBIDDEN_CHRONICLE_PATTERNS) {
    if (pattern.test(text)) errors.push(`Report references forbidden Chronicle pattern ${pattern}`);
  }
  const status = git(["status", "--short"]);
  for (const line of status.split(/\r?\n/).filter(Boolean)) {
    if (/chronicle/i.test(line)) errors.push(`Working tree contains forbidden Chronicle change: ${line}`);
  }
  return errors;
}

function readPreviousReports() {
  return [
    {
      taskId: "AI024-1",
      path: "docs/reviews/ai/ai024-1-corp-ice-semantics-polish-report-2026-06-02.json",
    },
    {
      taskId: "AI025-1",
      path: "docs/reviews/ai/ai025-1-corp-operations-semantics-polish-report-2026-06-02.json",
    },
    {
      taskId: "AI026-1",
      path: "docs/reviews/ai/ai026-1-corp-nodes-assets-semantics-polish-report-2026-06-02.json",
    },
    {
      taskId: "AI027",
      path: "docs/reviews/ai/ai027-derivation-inspector-guide-v3-alignment-report-2026-06-03.json",
    },
  ].map((entry) => {
    const report = readJson(entry.path);
    return {
      taskId: entry.taskId,
      path: entry.path,
      status: report.status,
      sourceCommit: report.sourceCommit,
      guideVersion: report.guideVersion,
      noEffectFlags: report.noEffectFlags ?? pickNoEffectCounts(report.countsAfter ?? {}),
    };
  });
}

function pickNoEffectCounts(source) {
  const result = {};
  for (const key of Object.keys(NO_EFFECT_FLAGS)) result[key] = source[key];
  return result;
}

function inventoryClassFor({ cardId, setId, active, compiled }) {
  if (setId === "originalset-v1") return "production_originalset";
  if (setId === "proteus") return "production_proteus";
  if (setId === "classic") return active || compiled ? "active_classic_unexpected" : "inactive_classic";
  if (setId === "testset") return active || compiled ? "active_test_fixture" : "inactive_test_fixture";
  if (cardId.startsWith("v08_")) return "active_test_fixture";
  return active || compiled ? "active_unknown_source" : "inactive_unknown_source";
}

function inferSetId(cardId) {
  if (cardId.startsWith("onr_v1_")) return "originalset-v1";
  if (cardId.startsWith("onr_proteus_")) return "proteus";
  if (cardId.startsWith("onr_classic_")) return "classic";
  if (cardId.startsWith("v08_")) return "testset";
  return "unknown";
}

function setIdFromPath(relativePath) {
  if (relativePath.includes("originalset")) return "originalset-v1";
  if (relativePath.includes("proteus")) return "proteus";
  if (relativePath.includes("classic")) return "classic";
  if (relativePath.includes("testset")) return "testset";
  return "unknown";
}

function usageMapFromCards(cards, valuesForCard) {
  const map = new Map();
  for (const card of cards) {
    for (const value of sortedUnique(valuesForCard(card).filter(Boolean))) {
      if (!map.has(value)) map.set(value, []);
      map.get(value).push(card.cardId);
    }
  }
  for (const [key, cardIds] of map) map.set(key, sortedUnique(cardIds));
  return map;
}

function signalsThatAnchor({ strategyId, signals, signalById, derivationRulesBySignal }) {
  const sourceSignals = [];
  for (const signalId of signals) {
    const catalogSignal = signalById.get(signalId);
    const catalogAnchors = catalogSignal?.allowedStrategyAnchors ?? [];
    const ruleAnchors = (derivationRulesBySignal.get(signalId) ?? []).flatMap((rule) => rule.strategyAnchorFor ?? []);
    if ([...catalogAnchors, ...ruleAnchors].includes(strategyId)) sourceSignals.push(signalId);
  }
  return sortedUnique(sourceSignals);
}

function summarizeCardConstraints(hint) {
  const constraints = [];
  if (hasMeaningfulValue(hint.costProfile)) constraints.push("costProfile");
  if (hasMeaningfulValue(hint.breakerProfile)) constraints.push("breakerProfile");
  if (hasMeaningfulValue(hint.remoteRole?.serverScope)) constraints.push("remoteRole.serverScope");
  for (const effect of hint.effects ?? []) {
    if (hasMeaningfulValue(effect.actionCost)) constraints.push("effects.actionCost");
    if (hasMeaningfulValue(effect.perTurnLimit)) constraints.push("effects.perTurnLimit");
  }
  for (const targetProfile of hint.targetProfiles ?? []) {
    for (const field of ["avoid", "preferences", "oncePerRun", "shuffleAfter", "showToOpponent"]) {
      if (hasMeaningfulValue(targetProfile[field])) constraints.push(`targetProfiles.${field}`);
    }
  }
  return sortedUnique(constraints);
}

function hiddenInfoPoliciesForHint(hint) {
  return sortedUnique([
    ...(hint.targetProfiles ?? []).map((profile) => profile.hiddenInfoPolicy).filter(Boolean),
    hint.valueHints?.hidden_zone,
  ].filter(Boolean).map(String));
}

function countWarningCategories(cards) {
  const counts = {};
  for (const card of cards) {
    for (const category of card.warningCategories ?? []) counts[category] = (counts[category] ?? 0) + 1;
  }
  return sortObject(counts);
}

function hasDeepEqualProfile(list, value) {
  const target = stableJson(value);
  return list.some((entry) => stableJson(entry) === target);
}

function hasMeaningfulValue(value) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  if (typeof value === "string") return value.length > 0;
  return true;
}

function sortedUnique(values) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null))].sort((left, right) =>
    String(left).localeCompare(String(right)),
  );
}

function groupBy(values, keyFn) {
  const map = new Map();
  for (const value of values) {
    const key = keyFn(value);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
  }
  return map;
}

function countBy(values, keyFn) {
  const counts = {};
  for (const value of values) {
    const key = keyFn(value) ?? "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return sortObject(counts);
}

function sortBy(values, keyFn) {
  return [...values].sort((left, right) => String(keyFn(left)).localeCompare(String(keyFn(right))));
}

function sortObject(object) {
  return Object.fromEntries(Object.entries(object).sort(([left], [right]) => left.localeCompare(right)));
}

function removeUndefined(value) {
  if (Array.isArray(value)) return value.map(removeUndefined);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, removeUndefined(entryValue)]),
    );
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(sortDeep(value), null, 2);
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortDeep(value[key])]),
    );
  }
  return value;
}

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function readText(relativePath) {
  return fs.readFileSync(repoPath(relativePath), "utf8");
}

function writeText(relativePath, text) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(repoPath(relativePath), text, "utf8");
}

function shortGitHead() {
  return git(["rev-parse", "--short", "HEAD"]).trim();
}

function git(args) {
  return childProcess.execFileSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function failWithErrors(title, errors) {
  console.error(`${title} with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
}

main();
