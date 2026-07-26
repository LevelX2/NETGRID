import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  CORP_CORE_ACTION_OWNERSHIP,
  createCorpCorePlanModules,
} from "../plans/corp-core-plan-modules";
import { createCorpTacticalPlanModules } from "../plans/corp-tactical-plan-modules";

const runtimeDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(runtimeDir, "..");

const readSource = (...segments: string[]): string =>
  readFileSync(path.join(srcDir, ...segments), "utf8");

const occurrences = (source: string, pattern: RegExp): number =>
  [...source.matchAll(pattern)].length;

describe("plan-first live authority structure", () => {
  it("locks the public live action boundary to the plan-first scheduler", () => {
    const publicIndex = readSource("index.ts");
    const publicEntrypoints = readSource("ai-runtime-public-entrypoints.ts");
    const decisionContext = readSource(
      "runtime",
      "semantic-runtime-decision-context.ts",
    );
    const planFirstRuntime = readSource(
      "runtime",
      "plan-first-live-runtime.ts",
    );

    expect(publicIndex).toContain('from "./ai-runtime-public-entrypoints";');
    expect(publicEntrypoints).toContain(
      "createAiLiveRuntimeComposition(aiLiveRuntimeDependencies)",
    );
    expect(decisionContext).toContain('from "./plan-first-live-runtime";');
    expect(decisionContext).toContain("choosePlanFirstLiveAction,");
    expect(occurrences(decisionContext, /\bchoosePlanFirstLiveAction\(/g)).toBe(
      1,
    );
    expect(decisionContext).toContain("return choosePlanFirstLiveAction(");
    expect(planFirstRuntime).toContain("const result = runPlanScheduler({");
    expect(occurrences(planFirstRuntime, /\brunPlanScheduler\(/g)).toBe(1);
  });

  it("keeps action-over-plan choosers, overlays and coverage fallbacks out of the productive selector", () => {
    const decisionContext = readSource(
      "runtime",
      "semantic-runtime-decision-context.ts",
    );
    const planFirstRuntime = readSource(
      "runtime",
      "plan-first-live-runtime.ts",
    );
    const forbiddenProductiveSelectors = [
      "semanticRuntimeChoices",
      "bestSemanticRuntimeChoice",
      "bestSemanticRuntimeChoiceForTacticalPlanOverride",
      "tacticalPlanMappedChoice",
      "applyPracticalTacticOverlay",
      "practicalMicroRuntimeCandidates",
      "semantic_coverage_fallback",
      "coverage_fallback",
    ];

    expect(decisionContext).not.toMatch(
      /import\s+\{[^}]*chooseSemanticRuntimeAction[^}]*\}\s+from\s+["']\.\/semantic-runtime["']/s,
    );
    expect(decisionContext).not.toContain('from "./practical-tactic-overlay"');
    expect(decisionContext).not.toMatch(
      /\b(?:semanticRuntimeChoices|bestSemanticRuntimeChoice|bestSemanticRuntimeChoiceForTacticalPlanOverride|tacticalPlanMappedChoice|applyPracticalTacticOverlay|practicalMicroRuntimeCandidates)\s*\(/,
    );
    for (const forbidden of forbiddenProductiveSelectors) {
      expect(planFirstRuntime, forbidden).not.toContain(forbidden);
    }
    expect(planFirstRuntime).not.toMatch(/\bfallbackUsed\s*:\s*true\b/);
  });

  it("keeps legacy TacticalGoal and semantic-choice wiring outside the live composition", () => {
    const liveSources = [
      readSource("ai-runtime-public-entrypoints.ts"),
      readSource("runtime", "ai-live-runtime-composition.ts"),
      readSource("runtime", "semantic-runtime-orchestration-composition.ts"),
      readSource("runtime", "semantic-runtime-entrypoints-composition.ts"),
      readSource("runtime", "semantic-runtime-decision-composition.ts"),
      readSource("runtime", "semantic-runtime-decision-context.ts"),
      readSource("runtime", "plan-first-live-runtime.ts"),
    ].join("\n");
    const publicIndex = readSource("index.ts");
    const decisionInput = readSource("runtime", "ai-decision-input.ts");

    for (const forbidden of [
      "SemanticRuntimeDependencies",
      "TacticalGoalLike",
      "buildRunnerTacticalGoals",
      "buildCorpTacticalGoals",
      "buildMergedTacticalGoals",
      "evaluateTacticalPlans",
      "getTacticalPlanMemorySnapshot",
      "rememberTacticalPlanRuntime",
      "semanticRuntimeChoices",
      "bestSemanticRuntimeChoice",
      "bestSemanticRuntimeChoiceForTacticalPlanOverride",
      "tacticalPlanMappedChoice",
      "practicalMicroRuntimeCandidates",
    ]) {
      expect(liveSources, forbidden).not.toContain(forbidden);
    }
    expect(publicIndex).not.toContain('from "./runner-tactical-goals"');
    expect(decisionInput).not.toContain("ownRunnerTacticalGoals");
  });

  it("keeps the public simulation adapter independent from legacy TacticalPlan memory", () => {
    const simulationEntrypoints = readSource(
      "ai-simulation-public-entrypoints.ts",
    );
    const simulator = readSource("simulation", "ai-game-simulator.ts");

    for (const source of [simulationEntrypoints, simulator]) {
      expect(source).not.toContain('from "./tactical-plans"');
      expect(source).not.toContain('from "../tactical-plans"');
      expect(source).not.toContain("getPlanContinuityMemorySnapshot");
      expect(source).not.toContain("resetTacticalPlanMemory");
    }
  });

  it("keeps legacy central-reserve scoring inputs outside the productive plan-first path", () => {
    const productiveSources = [
      readSource("runtime", "semantic-runtime-decision-context.ts"),
      readSource("runtime", "plan-first-live-runtime.ts"),
    ];
    const forbiddenLegacyInputs = [
      "semanticRuntimeCorpCentralRezReserveAssessment",
      "semanticRuntimeCorpHasCentralRezFloorFundingNeed",
      "semanticRuntimeCorpActionIceRezCost",
      "corpComponents",
      "corpEvidence",
    ];

    for (const source of productiveSources) {
      for (const forbidden of forbiddenLegacyInputs) {
        expect(source).not.toContain(forbidden);
      }
    }
  });

  it("keeps legacy score-window layer and funded-protection authority outside the productive plan-first path", () => {
    const decisionContext = readSource(
      "runtime",
      "semantic-runtime-decision-context.ts",
    );
    const planFirstRuntime = readSource(
      "runtime",
      "plan-first-live-runtime.ts",
    );
    const forbiddenLegacyScoreWindowAuthority = [
      "semanticRuntimeCorpScoringWindowAssessment",
      "scoringWindowRezBudget",
      "corpScoringWindowHasFundedPreScoreProtection",
      "CorpScoringWindowAssessment",
      "affordableIceCount",
      "relevantIceCount",
      "durableRelevantIceCount",
      "dynamicProtectionReserve",
      "corpCanRezFullPathWithDynamicReserve",
    ];

    for (const source of [decisionContext, planFirstRuntime]) {
      for (const forbidden of forbiddenLegacyScoreWindowAuthority) {
        expect(source, forbidden).not.toContain(forbidden);
      }
    }

    const fundedProtection = readSource(
      "runtime",
      "corp-funded-score-protection.ts",
    );
    const satisfiedStart = fundedProtection.indexOf(
      "export function corpFundedScoreProtectionCertifiesBinding(",
    );
    const satisfiedEnd = fundedProtection.indexOf(
      "\nexport type KnownCorpFundedIceInstallRouteProjection",
      satisfiedStart,
    );
    expect(satisfiedStart).toBeGreaterThanOrEqual(0);
    expect(satisfiedEnd).toBeGreaterThan(satisfiedStart);
    const satisfiedSource = fundedProtection.slice(
      satisfiedStart,
      satisfiedEnd,
    );
    expect(satisfiedSource).toContain(
      "need.parentProjectId === expectedParentProjectId",
    );
    expect(satisfiedSource).toContain(
      "need.targetServerId === expectedTargetServerId",
    );
    expect(satisfiedSource).toContain(
      "need.observedAtStateVersion === observedAtStateVersion",
    );
    expect(satisfiedSource).toContain('need.baseline.knowledge === "known"');
    expect(satisfiedSource).toContain("need.baseline.fundedProtection");
    expect(satisfiedSource).toContain("need.baseline.protection.protectsScore");
    expect(satisfiedSource).not.toMatch(
      /\b(?:ice|layer|quality|dynamicProtection)\b/i,
    );
  });

  it("binds defense funding only to exact funding-only parent projections", () => {
    const planFirstRuntime = readSource(
      "runtime",
      "plan-first-live-runtime.ts",
    );
    const reserveStart = planFirstRuntime.indexOf(
      "function corpDefenseReserveNeeds(",
    );
    const reserveEnd = planFirstRuntime.indexOf(
      "\nfunction punishSignals(",
      reserveStart,
    );

    expect(reserveStart).toBeGreaterThanOrEqual(0);
    expect(reserveEnd).toBeGreaterThan(reserveStart);

    const reserveSource = planFirstRuntime.slice(reserveStart, reserveEnd);

    expect(planFirstRuntime).not.toContain(
      "function corpCentralRezReserveNeeds(",
    );
    expect(reserveSource).toContain(
      'need.installRoute?.disposition !== "funding_only"',
    );
    expect(reserveSource).toContain(
      "knownInstallRouteHasUsefulEffectBlockedByFunding(projection)",
    );
    expect(reserveSource).toContain(
      "projection.after.minimumAdditionalCreditsToSatisfy",
    );
    expect(reserveSource).toContain('moduleId: "corp.defend_servers"');
    expect(reserveSource).toContain(
      "const fundingPriority = corpGenericDefensePriorityClass([need])",
    );
    expect(reserveSource).toContain("parentPriorityClass: fundingPriority");
    expect(reserveSource).not.toMatch(
      /\b(?:source|definition)\.rezCost\b|CARD_DEFINITIONS_BY_ID/,
    );
  });

  it("binds fort-run rez support only to the complete exact Engine quote", () => {
    const planFirstRuntime = readSource(
      "runtime",
      "plan-first-live-runtime.ts",
    );
    const assessmentStart = planFirstRuntime.indexOf(
      "function corpFortRunRezSupportAssessment(",
    );
    const assessmentEnd = planFirstRuntime.indexOf(
      "\ntype CorpExactCardRezSupportAssessment",
      assessmentStart,
    );

    expect(assessmentStart).toBeGreaterThanOrEqual(0);
    expect(assessmentEnd).toBeGreaterThan(assessmentStart);

    const assessmentSource = planFirstRuntime.slice(
      assessmentStart,
      assessmentEnd,
    );
    const requiredQuoteFields = [
      "cardImplementationFortRunRezSupportQuoteSchemaVersion",
      "cardImplementationFortRunRezSupportQuoteKind",
      "cardImplementationFortRunRezSupportQuoteComplete",
      "cardImplementationFortRunRezSupportQuoteSourceCardInstanceId",
      "cardImplementationFortRunRezSupportQuoteTargetServerId",
      "cardImplementationFortRunRezSupportQuoteStateVersion",
      "cardImplementationFortRunRezSupportQuoteActionId",
      "cardImplementationFortRunRezSupportQuoteRezCredits",
      "cardImplementationFortRunRezSupportQuoteInstallCredits",
      "cardImplementationFortRunRezSupportQuoteTotalCredits",
      "cardImplementationFortRunRezSupportQuoteTotalCreditsPayable",
      "cardImplementationFortRunRezSupportQuoteHasOwnHqIce",
    ];

    for (const field of requiredQuoteFields) {
      expect(assessmentSource, field).toContain(field);
    }
    expect(assessmentSource).toContain(
      "CORP_FORT_RUN_REZ_SUPPORT_QUOTE_SCHEMA_VERSION",
    );
    expect(assessmentSource).toContain("CORP_FORT_RUN_REZ_SUPPORT_KIND");
    expect(assessmentSource).toContain("legalAction.costs");
    expect(assessmentSource).not.toMatch(
      /\bgripOrHq\b|\bvisibleKnownCardType\b|\bserver\.ice\.length\b/,
    );
    expect(assessmentSource).not.toMatch(
      /\bcandidate\.costProfile\b|\?\?\s*0|\b(?:source|definition)\.rezCost\b/,
    );
  });

  it("keeps corp.defend_servers as the only global ICE allocator", () => {
    const corpModules = [
      ...createCorpCorePlanModules(),
      ...createCorpTacticalPlanModules(),
    ];
    const defenseAllocators = corpModules.filter(
      (module) => module.moduleId === "corp.defend_servers",
    );
    const productionPlanSources = [
      readSource("plans", "corp-core-plan-modules.ts"),
      readSource("plans", "corp-tactical-plan-modules.ts"),
    ].join("\n");

    expect(CORP_CORE_ACTION_OWNERSHIP["install.ice"]).toBe(
      "corp.defend_servers",
    );
    expect(defenseAllocators).toHaveLength(1);
    expect(
      occurrences(
        productionPlanSources,
        /["']install\.ice["']\s*:\s*["'][^"']+["']/g,
      ),
    ).toBe(1);
    expect(productionPlanSources).toContain(
      '"install.ice": "corp.defend_servers"',
    );
  });

  it("keeps the former ICE placement module sensor-and-facts only", () => {
    const icePlacement = readSource(
      "runtime",
      "corp-ice-placement",
      "corp-ice-placement.ts",
    );

    expect(icePlacement).not.toMatch(
      /from\s+["'][^"']*(?:plans\/|plan-scheduler|plan-assessment|choice-ranking|action-order)[^"']*["']/,
    );
    expect(icePlacement).not.toMatch(
      /\b(?:recommend(?:ation|ed)?|hold|override|policy|priority|veto|admission|admitted|selectedActionId|choose|rank)\b/i,
    );
    expect(icePlacement).not.toMatch(
      /\b(?:PlanModule|PlanProposal|PlanAssessment|AiDecision)\b/,
    );
    expect(icePlacement).toContain(
      "export function classifyCorpFutureRunIcePlacementProfile",
    );
    expect(icePlacement).toContain(
      "export function corpIcePlacementActionCostAgreementFact",
    );
    expect(icePlacement).toContain(
      "export function corpIcePlacementPostInstallRezCostFact",
    );

    const productiveDefenseSources = [
      readSource("plans", "corp-core-plan-modules.ts"),
      readSource("runtime", "plan-first-live-runtime.ts"),
      icePlacement,
    ].join("\n");
    for (const forbidden of [
      "assessCorpIceServerFitForAction",
      "buildCorpIceCardPlacementProfile",
      "genericLocalFit",
      "localFitValue",
      "visibleZeroEffectRisk",
      "defenseCandidateFit",
      "priorPlacements",
      "bestRemainingDefenseAllocationValue",
      "projectedSameServerFutureCreditCommitment",
      "effectiveRezValue",
      "currentIcePlacementAssessment",
      "defensePlacementEdges",
    ]) {
      expect(productiveDefenseSources, forbidden).not.toContain(forbidden);
    }
  });

  it("lets generic central-defense draw consume only the global allocator", () => {
    const defensiveDraw = readSource(
      "runtime",
      "corp-economy",
      "corp-defensive-draw.ts",
    );
    const targetStart = defensiveDraw.indexOf(
      "function corpMissingConcreteCentralDefenseTarget(",
    );
    const targetEnd = defensiveDraw.indexOf(
      "\nfunction corpConcreteCentralIceInstallAvailable(",
      targetStart,
    );

    expect(targetStart).toBeGreaterThanOrEqual(0);
    expect(targetEnd).toBeGreaterThan(targetStart);
    const targetSource = defensiveDraw.slice(targetStart, targetEnd);
    expect(targetSource).toContain('allocation?.status !== "known"');
    expect(targetSource).toContain(
      "const serverId = allocation.selectedServerId",
    );
    expect(targetSource).not.toContain(
      "semanticRuntimeCorpCentralPressureAssessment",
    );
    expect(targetSource).not.toMatch(/\.sort\(|\bpressure\s*:/);
  });
});
