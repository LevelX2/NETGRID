#!/usr/bin/env node
import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const JSON_REPORT = "docs/reviews/ai/ai031-033-tactic-signal-taxonomy-finalization-report-2026-06-03.json";
const MD_REPORT = "docs/reviews/ai/ai031-033-tactic-signal-taxonomy-finalization-2026-06-03.md";
const AI028_R_REPORT = "docs/reviews/ai/ai028-r-netgrid-semantic-audit-pack-refresh-2026-06-03.json";
const SIGNALS = "data/ai/tactic-signals-v1.json";
const DERIVATION = "data/ai/function-signal-derivation-v1.json";
const STRATEGY_GOALS = "data/ai/strategy-goals-v1.json";

const NO_EFFECT_KEYS = [
  "plannerEffect",
  "actionScoreEffect",
  "planWeightEffect",
  "targetingAiEffect",
  "engineEffect",
  "legalEffect",
  "profileOrDefaultSwitch",
  "uiDerivationEffect",
  "hiddenInfoLeakEffect",
];
const BREAKER_SIGNALS = ["breaker.code_gate", "breaker.sentry", "breaker.wall"];
const REQUIRED_SECTIONS = [
  "Kurzfazit",
  "Scope / Out-of-Scope",
  "Verwendete Quellen",
  "Ausgangsbefund aus AI028-R",
  "AI031: Breaker-Signal-Entscheidung",
  "AI032: Legacy-/Aggregation-Entscheidung",
  "AI033: Descriptor-Schema-Design",
  "StrategySupportPair-Rollenmodell-Inventar",
  "Explizit deferred: requires_advancement_counter / AI034",
  "Geänderte Signale",
  "Beibehaltene Signale mit Begründung",
  "Retired / Alias / Migration",
  "Descriptor-Warning-Triage",
  "Tactic Signal Taxonomy Release Candidate",
  "No-Effect-Bestätigung",
  "Verifikation",
  "Risiken / nächste Schritte",
];

const errors = [];

if (!exists(JSON_REPORT)) fail(`Missing ${JSON_REPORT}`);
if (!exists(MD_REPORT)) fail(`Missing ${MD_REPORT}`);

if (errors.length === 0) {
  const report = readJson(JSON_REPORT);
  const markdown = read(MD_REPORT);
  const ai028 = readJson(AI028_R_REPORT);
  const signals = readJson(SIGNALS).signals ?? [];
  const derivationRules = readJson(DERIVATION).derivationRules ?? [];
  const strategyGoals = readJson(STRATEGY_GOALS).strategyGoals ?? [];
  const signalById = new Map(signals.map((signal) => [signal.signalId, signal]));

  expectEqual(report.taskId, "AI031-033", "taskId");
  expectEqual(report.guideVersion, "V3", "guideVersion");
  expectEqual(report.scope, "tactic_signal_taxonomy_finalization", "scope");
  expectIncludes(report.supersedesWarnings, "AI028-R-F005", "supersedes AI028-R-F005");
  expectIncludes(report.supersedesWarnings, "AI028-R-F006", "supersedes AI028-R-F006");
  expectIncludes(report.supersedesWarnings, "AI028-R-F007", "supersedes AI028-R-F007");
  expectIncludes(report.explicitlyDeferred, "AI028-R-F008", "explicitly deferred AI028-R-F008");

  for (const key of NO_EFFECT_KEYS) {
    expectEqual(report.noEffectFlags?.[key], false, `noEffectFlags.${key}`);
  }

  for (const section of REQUIRED_SECTIONS) {
    if (!markdown.includes(`## ${section}`)) fail(`Markdown missing section: ${section}`);
  }

  expectEqual(report.countsBefore?.tacticSignals, ai028.counts.tacticSignals, "AI028-R tactic signal baseline");
  expectEqual(report.countsAfter?.tacticSignals, signals.length, "current tactic signal count");
  expectEqual(report.countsAfter?.strategyGoals, strategyGoals.length, "current strategy goal count");
  expectEqual(strategyGoals.length, 20, "AI031-033 must not introduce strategy IDs");
  expectEqual(report.changedSignals?.length, 0, "changedSignals must be empty");
  expectEqual(report.renamedSignals?.length, 0, "renamedSignals must be empty");
  expectEqual(report.changedDerivationRules?.length, 0, "changedDerivationRules must be empty");
  expectEqual(report.changedHints?.length, 0, "changedHints must be empty");
  expectEqual(report.changedInspectorBehavior?.length, 0, "changedInspectorBehavior must be empty");

  const breakerDecisions = new Map((report.breakerSignalDecisions ?? []).map((decision) => [decision.signalId, decision]));
  for (const signalId of BREAKER_SIGNALS) {
    const catalog = signalById.get(signalId);
    const decision = breakerDecisions.get(signalId);
    if (!catalog) fail(`Missing catalog signal ${signalId}`);
    if (!decision) fail(`Missing breaker decision for ${signalId}`);
    if (!catalog || !decision) continue;

    expectEqual(catalog.supportOnly, true, `${signalId} catalog supportOnly`);
    expectEqual(catalog.mayAnchorStrategy, false, `${signalId} catalog mayAnchorStrategy`);
    expectArrayEqual(catalog.allowedStrategyAnchors ?? [], [], `${signalId} allowedStrategyAnchors`);
    expectEqual(decision.decision, "retain_as_support_only_coverage_signal", `${signalId} decision`);
    expectEqual(decision.describesBreakerCoverageAgainstIceType, true, `${signalId} coverage decision`);
    expectEqual(decision.describesOwnSubtype, false, `${signalId} subtype decision`);
    expectEqual(decision.supportOnly, true, `${signalId} report supportOnly`);
    expectEqual(decision.mayAnchorStrategy, false, `${signalId} report mayAnchorStrategy`);
    expectArrayEqual(decision.strategyAnchorFor ?? [], [], `${signalId} strategyAnchorFor`);
    expectEqual(decision.strategySupportPairGeneration, false, `${signalId} StrategySupportPair generation`);
    for (const rule of derivationRules.filter((rule) => rule.signalId === signalId)) {
      expectArrayEqual(rule.strategyAnchorFor ?? [], [], `${signalId} derivation strategyAnchorFor`);
      expectEqual(rule.source, "breakerProfile.coverage", `${signalId} derivation source`);
    }
  }

  const damageDecision = findDecision(report.legacyAggregationSignalDecisions, "damage.payoff");
  if (!damageDecision) {
    fail("Missing damage.payoff decision");
  } else {
    const damageSignal = signalById.get("damage.payoff");
    expectEqual(damageSignal?.supportOnly, true, "damage.payoff catalog supportOnly");
    expectEqual(damageSignal?.mayAnchorStrategy, false, "damage.payoff catalog mayAnchorStrategy");
    expectEqual(damageSignal?.legacy, true, "damage.payoff catalog legacy");
    expectEqual(damageSignal?.aggregation, true, "damage.payoff catalog aggregation");
    expectEqual(damageSignal?.notForDirectScoring, true, "damage.payoff catalog notForDirectScoring");
    expectEqual(damageDecision.decision, "retain_as_legacy_aggregation_supporting_only", "damage.payoff decision");
    expectEqual(damageDecision.allDirectUsageHasPreciseDamageSignal, true, "damage.payoff precise coverage");
    expectArrayEqual(damageDecision.cardsWithoutPreciseDamageSignals ?? [], [], "damage.payoff cardsWithoutPreciseDamageSignals");
    expectArrayEqual(damageDecision.strategyAnchorFor ?? [], [], "damage.payoff report strategyAnchorFor");
    for (const rule of derivationRules.filter((rule) => rule.signalId === "damage.payoff")) {
      expectArrayEqual(rule.strategyAnchorFor ?? [], [], "damage.payoff derivation strategyAnchorFor");
    }
    if ((damageDecision.directUsageCards ?? []).length === 0) fail("damage.payoff directUsageCards must not be empty");
    for (const card of damageDecision.directUsageCards ?? []) {
      if ((card.preciseDamageSignals ?? []).length === 0) fail(`damage.payoff direct card lacks precise damage signal: ${card.cardId}`);
    }
  }

  const actionDecision = findDecision(report.legacyAggregationSignalDecisions, "action.corp_repeatable_extra_action");
  if (!actionDecision) {
    fail("Missing action.corp_repeatable_extra_action decision");
  } else {
    const actionSignal = signalById.get("action.corp_repeatable_extra_action");
    expectEqual(actionSignal?.supportOnly, true, "action.corp_repeatable_extra_action catalog supportOnly");
    expectEqual(actionSignal?.mayAnchorStrategy, false, "action.corp_repeatable_extra_action catalog mayAnchorStrategy");
    expectEqual(actionSignal?.notForDirectScoring, true, "action.corp_repeatable_extra_action catalog notForDirectScoring");
    expectEqual(actionDecision.decision, "retain_as_support_deferred_extra_action_signal", "action.corp_repeatable_extra_action decision");
    expectArrayEqual(actionDecision.strategyAnchorFor ?? [], [], "action.corp_repeatable_extra_action report strategyAnchorFor");
    expectArrayEqual(
      (actionDecision.directUsageCards ?? []).map((card) => card.cardId).sort(),
      ["onr_v1_331_nevinyrral", "onr_v1_335_remote-facility"],
      "action.corp_repeatable_extra_action direct cards",
    );
    for (const card of actionDecision.directUsageCards ?? []) {
      expectArrayEqual(card.reviewedStrategySupportPairs ?? [], [], `${card.cardId} reviewedStrategySupportPairs`);
      expectArrayEqual(card.derivedPossibleStrategyAnchors ?? [], [], `${card.cardId} derivedPossibleStrategyAnchors`);
    }
    for (const rule of derivationRules.filter((rule) => rule.signalId === "action.corp_repeatable_extra_action")) {
      expectArrayEqual(rule.strategyAnchorFor ?? [], [], "action.corp_repeatable_extra_action derivation strategyAnchorFor");
    }
  }

  const expectedDescriptorWarnings = ai028.taxonomySmells.descriptorWarningCards.length;
  expectEqual(report.descriptorWarningInventory?.length, expectedDescriptorWarnings, "descriptor warning inventory count");
  expectEqual(report.descriptorWarningTriage?.length, expectedDescriptorWarnings, "descriptor warning triage count");
  expectEqual(report.descriptorSchemaProposal?.status, "proposed_only", "descriptor schema proposal status");
  expectEqual(report.descriptorSchemaProposal?.implementationStatus, "not_implemented_in_AI031_033", "descriptor schema implementation status");
  if (!report.descriptorSchemaProposal?.shape?.descriptorId) fail("Descriptor schema proposal missing descriptorId");
  for (const entry of report.descriptorWarningInventory ?? []) {
    if (!entry.cardId) fail("Descriptor warning entry without cardId");
    if (!entry.title) fail(`Descriptor warning entry without title: ${entry.cardId}`);
    if ((entry.triageCategories ?? []).length === 0) fail(`Descriptor warning entry without triageCategories: ${entry.cardId}`);
  }

  const roleInventory = report.strategySupportRoleModelInventory ?? [];
  expectEqual(roleInventory.length, ai028.reviewedStrategySupportPairInventory.length, "StrategySupportPair inventory count");
  expectEqual(report.strategySupportRoleModelSummary?.status, "inventoried_only_no_role_writeback", "StrategySupportPair role model status");
  for (const entry of roleInventory) {
    if (!entry.strategyId) fail(`StrategySupportPair entry missing strategyId: ${entry.cardId}`);
    if (!entry.proposedRoleCategory) fail(`StrategySupportPair entry missing proposedRoleCategory: ${entry.cardId}`);
  }

  const advancementDeferred = (report.deferredItems ?? []).find((entry) => entry.itemId === "AI028-R-F008");
  if (!advancementDeferred) {
    fail("Missing AI028-R-F008 deferred item");
  } else {
    expectEqual(advancementDeferred.status, "deferred_until_action_semantics", "AI028-R-F008 deferred status");
    expectEqual(advancementDeferred.currentUsageCount, 11, "requires_advancement_counter current usage count");
    expectEqual(advancementDeferred.implementedNow, false, "AI028-R-F008 implementedNow");
  }

  if (report.releaseCandidateSummary?.totalTacticSignals !== signals.length) {
    fail("Release Candidate totalTacticSignals must match catalog");
  }
  if (report.releaseCandidateSummary?.descriptorSchemaImplementation !== "proposed_only") {
    fail("Descriptor schema must remain proposed_only");
  }
  if (report.releaseCandidateSummary?.noCatalogChanges !== true) {
    fail("Release Candidate must state noCatalogChanges");
  }

  const referencedPaths = [
    ...(report.inputs ?? []),
    ...(report.changedSignals ?? []),
    ...(report.changedDerivationRules ?? []),
    ...(report.changedHints ?? []),
    ...(report.changedInspectorBehavior ?? []),
  ];
  for (const ref of referencedPaths) {
    if (/(^|[\\/])chronicle([\\/]|$)|CODEX_STATUS_CHRONICLE|GOAL_HISTORY/i.test(String(ref))) {
      fail(`Chronicle file referenced by AI031-033 report: ${ref}`);
    }
  }
  const changedFiles = gitChangedFiles();
  for (const file of changedFiles) {
    if (/(^|[\\/])chronicle([\\/]|$)|CODEX_STATUS_CHRONICLE|GOAL_HISTORY/i.test(file)) {
      fail(`Chronicle file changed by AI031-033 batch: ${file}`);
    }
  }
}

if (errors.length > 0) {
  console.error("AI031_033_TACTIC_SIGNAL_TAXONOMY_FINALIZATION FAILED");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("AI031_033_TACTIC_SIGNAL_TAXONOMY_FINALIZATION OK");

function exists(filePath) {
  return fs.existsSync(path.join(ROOT, filePath));
}

function read(filePath) {
  return fs.readFileSync(path.join(ROOT, filePath), "utf8");
}

function readJson(filePath) {
  return JSON.parse(read(filePath));
}

function fail(message) {
  errors.push(message);
}

function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    fail(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function expectIncludes(values, value, label) {
  if (!Array.isArray(values) || !values.includes(value)) {
    fail(`${label}: missing ${value}`);
  }
}

function expectArrayEqual(actual, expected, label) {
  const actualJson = JSON.stringify(actual ?? []);
  const expectedJson = JSON.stringify(expected ?? []);
  if (actualJson !== expectedJson) {
    fail(`${label}: expected ${expectedJson}, got ${actualJson}`);
  }
}

function findDecision(decisions, signalId) {
  return (decisions ?? []).find((decision) => decision.signalId === signalId);
}

function gitChangedFiles() {
  try {
    const output = childProcess.execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" });
    return output
      .split(/\r?\n/)
      .map((line) => line.slice(3).trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
