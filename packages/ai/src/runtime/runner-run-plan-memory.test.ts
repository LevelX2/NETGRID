import { describe, expect, it, beforeEach } from "vitest";
import type {
  AiDecisionDebug,
  AiDecisionInput,
  LegalAction,
  PlayerView,
} from "@netgrid/shared";
import { chooseSemanticRuntimeAction } from "./semantic-runtime";
import type { SemanticRuntimeDependencies } from "./semantic-runtime";
import {
  getRunnerRunPlanMemorySnapshot,
  MissingRunnerRunPlanError,
  rememberRunnerRunPlanMemorySnapshot,
  requireActiveRunnerRunPlan,
  resetRunnerRunPlanMemory,
} from "./runner-run-plan-memory";
import { runnerRunPlanSemanticChoice } from "./runner-run-plan-policy";
import { createRunnerRunPlanForSelectedAction } from "./runner-run-plan-start";
import type { RunnerRunPlan } from "./runner-run-plan-types";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";

describe("runner run plan memory", () => {
  beforeEach(() => {
    resetRunnerRunPlanMemory();
  });

  it("throws when a runner decision reaches an active run without a run plan", () => {
    const input = runnerInput({ activeRun: true });

    expect(() => requireActiveRunnerRunPlan(input)).toThrow(
      MissingRunnerRunPlanError,
    );
  });

  it("clears the stored plan when the runner is no longer in a run", () => {
    const activeInput = runnerInput({ activeRun: true });
    const inactiveInput = runnerInput({ activeRun: false });

    rememberRunnerRunPlanMemorySnapshot(activeInput, runPlan());

    expect(getRunnerRunPlanMemorySnapshot(activeInput)?.id).toBe("runplan-1");
    expect(getRunnerRunPlanMemorySnapshot(inactiveInput)).toBeUndefined();
    expect(getRunnerRunPlanMemorySnapshot(activeInput)).toBeUndefined();
  });

  it("lets the semantic runtime recover from a missing active run plan", () => {
    const continueRun = action("continue_run");
    const runtimeChoice = choice(continueRun, "simple_run_choice", 300);
    const input = runnerInput({
      activeRun: true,
      legalActions: [continueRun],
    });

    const decision = chooseSemanticRuntimeAction(
      input,
      {},
      runtimeDependenciesForStartRun(runtimeChoice, continueRun),
    );

    expect(decision.actionId).toBe("continue_run");
    expect(decision.evidence).toContain("active_runner_run_plan_missing:true");
    expect(decision.evidence).toContain(
      "active_runner_run_plan_recovery:semantic_runtime_fallback",
    );
  });

  it("selects active run actions through a run plan annotated choice", () => {
    const input = runnerInput({ activeRun: true });
    const activePlan = runPlan();
    activePlan.budget.runOnlyCredits = 2;
    activePlan.budget.stealthCredits = 1;
    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: activePlan,
      choices: [
        choice(action("gain_credit"), "basic_economy_draw", 200),
        choice(action("continue_run"), "simple_run_choice", 100),
      ],
    });

    expect(selected?.action.type).toBe("continue_run");
    expect(selected?.reasonCode).toBe("runner.run_plan.simple_run_choice");
    expect(selected?.evidence).toContain("runner_run_plan_active:true");
    expect(selected?.evidence).toContain("runner_run_plan_id:runplan-1");
    expect(selected?.evidence).toContain("runner_run_plan_budget_run_only:2");
    expect(selected?.evidence).toContain("runner_run_plan_budget_stealth:1");
  });

  it("creates a run plan from a selected start-run action and run target evaluation", () => {
    const startRun = action("start_run", { serverId: "rd" });
    const plan = createRunnerRunPlanForSelectedAction({
      input: runnerInput({ activeRun: false, legalActions: [startRun] }),
      selectedAction: startRun,
      runnerRunTargetEvaluations: [runTargetEvaluation(startRun)],
      runnerTacticalGoals: [
        {
          schemaVersion: "runner-tactical-goal-v1",
          goalId: "runner.pressure_good_central_target",
          family: "pressure",
          priority: 100,
          urgency: "medium",
          targetServerId: "rd",
          source: "run_target_evaluation",
          evidence: ["goal:rd_pressure"],
        },
      ],
      runnerStrategicIntent: {
        schemaVersion: "runner-strategic-intent-profile-v1",
        side: "runner",
        source: {
          deckStrategyProfile: "ai_internal_strategy_profile",
          deckCapabilities: "ai_internal",
          plannerEffect: "runtime_projection",
        },
        primaryWinIntent: "runner.steal_agendas_default",
        setupEngine: [],
        pressureVectors: ["runner.central_probe_pressure"],
        riskProfile: [],
        rejectedIntents: [],
        confidence: "medium",
        evidence: ["strategic_intent:central_probe"],
      },
    });

    expect(plan?.objective.kind).toBe("access_rnd_top");
    expect(plan?.targetServer.id).toBe("rd");
    expect(plan?.runStartActionId).toBe("start_run");
    expect(plan?.sourceTacticalGoalIds).toContain(
      "runner.pressure_good_central_target",
    );
    expect(plan?.pathQuote.totalKnownCost).toBe(2);
    expect(plan?.accessIntent?.trashPolicy).toBe("trash_if_value_positive");
  });

  it("records specialized run credits in the run plan budget", () => {
    const startRun = action("start_run", {
      serverId: "rd",
      runOnlyCredits: 2,
      recurringLinkCredits: 1,
    });
    const input = runnerInput({
      activeRun: false,
      legalActions: [startRun],
      rig: [
        {
          instanceId: "stealth-rig",
          definitionId: "stealth-rig",
          title: "Stealth Rig",
          owner: "runner",
          controller: "runner",
          type: "hardware",
          known: true,
          subtypes: ["stealth"],
          counterDisplays: [
            {
              id: "stealth-recurring",
              amount: 2,
              displayKind: "recurring_credit",
              label: "2",
              ariaLabel: "2 recurring credits",
              creditPool: {
                kind: "recurring_credit",
                uses: [
                  "using_icebreaker_during_run",
                  "using_icebreaker_during_run_non_noisy",
                ],
              },
            },
          ],
        },
      ],
    });
    const plan = createRunnerRunPlanForSelectedAction({
      input,
      selectedAction: startRun,
      runnerRunTargetEvaluations: [runTargetEvaluation(startRun)],
    });

    expect(plan?.budget.runOnlyCredits).toBe(2);
    expect(plan?.budget.recurringBreakerCredits).toBe(2);
    expect(plan?.budget.recurringLinkCredits).toBe(1);
    expect(plan?.budget.stealthCredits).toBe(2);
    expect(plan?.budget.nonNoisyBreakerCredits).toBe(2);
    expect(plan?.debug.items).toEqual(
      expect.arrayContaining([
        "runner_run_plan_budget_run_only:2",
        "runner_run_plan_budget_recurring_breaker:2",
        "runner_run_plan_budget_recurring_link:1",
        "runner_run_plan_budget_stealth:2",
        "runner_run_plan_budget_non_noisy_breaker:2",
      ]),
    );
  });

  it("creates a decline-low-value access intent only for known low-value targets", () => {
    const startRun = action("start_run", { serverId: "rd" });
    const plan = createRunnerRunPlanForSelectedAction({
      input: runnerInput({ activeRun: false, legalActions: [startRun] }),
      selectedAction: startRun,
      runnerRunTargetEvaluations: [
        runTargetEvaluation(startRun, { accessPayoff: "known_low_value" }),
      ],
    });

    expect(plan?.accessIntent?.trashPolicy).toBe("decline_low_value");
  });

  it("reserves known remote trash cost when creating a remote trash run plan", () => {
    const startRun = action("start_run", { serverId: "remote_1" });
    const plan = createRunnerRunPlanForSelectedAction({
      input: runnerInput({
        activeRun: false,
        legalActions: [startRun],
        servers: [
          {
            id: "remote_1",
            label: "Remote 1",
            ice: [],
            root: [
              {
                instanceId: "asset-1",
                known: true,
                title: "Simple Economy Asset",
                definitionId: "simple_economy_asset",
                type: "asset",
                rezzed: true,
              },
            ],
          },
        ],
      }),
      selectedAction: startRun,
      runnerRunTargetEvaluations: [
        runTargetEvaluation(startRun, {
          targetServerId: "remote_1",
          targetKind: "remote",
          accessPayoff: "trash_affordable",
        }),
      ],
    });

    expect(plan?.accessIntent?.reserveForStealOrTrash).toBe(3);
    expect(plan?.budget.reservedCreditsForSteal).toBe(0);
    expect(plan?.budget.reservedCreditsForTrash).toBe(3);
    expect(plan?.reserve.preserveStealOrTrashCredits).toBe(3);
    expect(plan?.reserve.evidence).toEqual(
      expect.arrayContaining([
        "runner_run_plan_reserve_trash_cost:3",
        "runner_run_plan_reserve_payoff:trash_affordable",
      ]),
    );
  });

  it("creates a run plan from a selected card run action with a concrete target evaluation", () => {
    const runEvent = action("play_event", {
      sourceDefinitionId: "simple_run_event",
    });
    const plan = createRunnerRunPlanForSelectedAction({
      input: runnerInput({ activeRun: false, legalActions: [runEvent] }),
      selectedAction: runEvent,
      runnerRunTargetEvaluations: [runTargetEvaluation(runEvent)],
    });

    expect(plan?.origin).toBe("card_initiated_run");
    expect(plan?.targetServer.id).toBe("rd");
    expect(plan?.runStartActionId).toBe("play_event");
    expect(plan?.objective.kind).toBe("access_rnd_top");
  });

  it("creates a run plan from a run-choice action with a public selected server", () => {
    const runChoice = action("resolve_choice", {
      selectedServerId: "hq",
    });
    const plan = createRunnerRunPlanForSelectedAction({
      input: runnerInput({ activeRun: false, legalActions: [runChoice] }),
      selectedAction: runChoice,
    });

    expect(plan?.targetServer.id).toBe("hq");
    expect(plan?.runStartActionId).toBe("resolve_choice");
    expect(plan?.objective.kind).toBe("access_hq_card");
  });

  it("remembers a run plan when the semantic runtime selects start_run", () => {
    const startRun = action("start_run", { serverId: "rd" });
    const input = runnerInput({ activeRun: false, legalActions: [startRun] });
    const runtimeChoice = choice(startRun, "simple_hq_or_rnd_pressure", 500);

    const decision = chooseSemanticRuntimeAction(
      input,
      {},
      runtimeDependenciesForStartRun(runtimeChoice, startRun),
    );

    const activeRunInput = runnerInput({ activeRun: true });
    const remembered = getRunnerRunPlanMemorySnapshot(activeRunInput);
    expect(decision.actionId).toBe("start_run");
    expect(remembered?.runStartActionId).toBe("start_run");
    expect(remembered?.objective.kind).toBe("access_rnd_top");
  });
});

function minimalRuntimeDependencies(
  overrides: Partial<SemanticRuntimeDependencies> = {},
): SemanticRuntimeDependencies {
  return {
    buildActionSemanticCandidates: () => [],
    ...overrides,
  } as unknown as SemanticRuntimeDependencies;
}

function runtimeDependenciesForStartRun(
  runtimeChoice: SemanticRuntimeChoice,
  startRun: LegalAction,
): SemanticRuntimeDependencies {
  const choices = [runtimeChoice];
  return minimalRuntimeDependencies({
    semanticRuntimeChoices: () => choices,
    semanticRuntimeChoiceIsReactive: () => false,
    getTacticalPlanMemorySnapshot: () => undefined,
    deckCapabilitiesForInput: () => ({ side: "runner" }) as never,
    runnerStrategicIntentForInput: () => ({
      schemaVersion: "runner-strategic-intent-profile-v1",
      side: "runner",
      source: {
        deckStrategyProfile: "ai_internal_strategy_profile",
        deckCapabilities: "ai_internal",
        plannerEffect: "runtime_projection",
      },
      primaryWinIntent: "runner.steal_agendas_default",
      setupEngine: [],
      pressureVectors: ["runner.central_probe_pressure"],
      riskProfile: [],
      rejectedIntents: [],
      confidence: "medium",
      evidence: ["strategic_intent:central_probe"],
    }),
    evaluateRunnerHandDevelopment: () => [],
    buildRunnerEconomyPosture: () => ({}) as never,
    evaluateRunnerRunTargets: () => [runTargetEvaluation(startRun)],
    buildRunnerTacticalGoals: () => [],
    evaluateTacticalPlans: () => ({ planAlternatives: [], blockedPlans: [] }),
    bestSemanticRuntimeChoice: () => runtimeChoice,
    bestSemanticRuntimeChoiceForTacticalPlanOverride: () => undefined,
    tacticalPlanMappedChoice: () => ({}),
    runnerSelfDamageImmediateWinSemanticChoice: () => undefined,
    semanticRuntimeChoiceWithEvidence: (choiceValue) => choiceValue,
    tacticalPlanMappingOverrideEvidence: () => [],
    tacticalPlanRuntimeAlignedToChoice: (planRuntime) => planRuntime,
    runnerRunOnlyActionAdjustedSemanticChoice: () => ({
      choice: runtimeChoice,
      rankedChoices: choices,
    }),
    semanticRuntimeCoverageSelectionDebug: () => undefined,
    selectedChoicesForDecision: () => undefined,
    rememberTacticalPlanRuntime: () => undefined,
    scrubEvidence: (evidence) => evidence,
    semanticRuntimeDecisionDebug: () =>
      ({
        schemaVersion: "ai-decision-debug-v1",
        aiLevel: 2,
        summary: "test",
        planKind: "test",
        score: 0,
        fallbackUsed: false,
        timeoutUsed: false,
      }) as AiDecisionDebug,
  });
}

function runnerInput(params: {
  activeRun: boolean;
  legalActions?: LegalAction[];
  credits?: number;
  servers?: PlayerView["servers"];
  rig?: PlayerView["own"]["rig"];
}): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      stateVersion: 42,
      side: "runner",
      activeSide: "runner",
      turn: 1,
      click: 1,
      winner: null,
      agendaPointsToWin: 7,
      own: {
        identity: { instanceId: "runner-id", known: true },
        gripOrHq: [],
        heapOrArchives: [],
        scoreArea: [],
        rig: params.rig ?? [],
        clicks: 3,
        credits: params.credits ?? 5,
        tags: 0,
        badPublicity: 0,
      },
      opponent: {
        identity: { instanceId: "corp-id", known: true },
        gripOrHqCount: 5,
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
        clicks: 3,
        credits: 5,
        tags: 0,
        badPublicity: 0,
      },
      servers: params.servers ?? [],
      ...(params.activeRun
        ? {
            run: {
              attackedServerId: "rd",
              phase: "encounter_ice",
              position: { kind: "ice", serverId: "rd", iceIndex: 0 },
              successful: false,
            },
          }
        : {}),
      publicEvents: [],
    },
    eventTail: [],
    legalActions: params.legalActions ?? [],
    difficulty: "normal",
    seed: "runner-run-plan-test",
    decisionId: "runner-run-plan-test:42:runner",
    actionNumber: 1,
    profileId: "runner-run-plan-profile",
  } as unknown as AiDecisionInput;
}

function runPlan(): RunnerRunPlan {
  return {
    id: "runplan-1",
    side: "runner",
    lifecycle: "active",
    origin: "basic_start_run",
    objective: { kind: "access_rnd_top", expectedValue: 100 },
    targetServer: { id: "rd" },
    accessIntent: {
      server: "rd",
      expectedAccessCount: 1,
      stealAgendaPolicy: "steal_if_affordable",
      trashPolicy: "trash_if_value_positive",
      reserveForStealOrTrash: 0,
    },
    runStartActionId: "run-rd",
    sourceTacticalGoalIds: ["runner.opportunistic_central_run:rd"],
    sourceStrategyEvidence: ["deck_strategy:rd_pressure"],
    budget: {
      availableCredits: 5,
      runOnlyCredits: 0,
      recurringBreakerCredits: 0,
      recurringKillerCredits: 0,
      recurringLinkCredits: 0,
      stealthCredits: 0,
      nonNoisyBreakerCredits: 0,
      reservedCreditsAfterRun: 0,
      reservedCreditsForSteal: 0,
      reservedCreditsForTrash: 0,
      damageSafetyReserve: {
        minimumGripAfterRun: 0,
        preventionCreditsReserved: 0,
        evidence: [],
      },
      tagSafetyReserve: {
        minimumCreditsAfterTags: 0,
        expectedTagCount: 0,
        evidence: [],
      },
    },
    reserve: {
      minimumCreditsAfterRun: 0,
      minimumGripAfterRun: 0,
      preserveStealOrTrashCredits: 0,
      evidence: [],
    },
    pathQuote: {
      server: "rd",
      quoteStatus: "unknown",
      iceQuotes: [],
      totalKnownCost: 0,
      expectedUnknownCost: 0,
      expectedRemainingCredits: 5,
      reserveViolation: false,
      canReachAccess: true,
      requiredSequences: [],
    },
    currentEncounter: {
      server: "rd",
      phase: "encounter_ice",
      iceIndex: 0,
    },
    revalidation: {
      status: "valid",
      reasons: [],
      checkedAtStateVersion: 42,
    },
    abortPolicy: {
      allowJackOutWhenLegal: true,
      abortBelowCredits: 0,
      abortReasons: [],
    },
    visibilityEvidence: [{ kind: "player_view", ref: "run" }],
    debug: { summary: "test run plan", items: [] },
    createdAtStateVersion: 41,
    updatedAtStateVersion: 42,
  };
}

function action(
  type: LegalAction["type"],
  payload: Record<string, string | number | boolean> = {},
): LegalAction {
  return {
    actionId: type,
    side: "runner",
    type,
    label: type,
    source: "game_rule",
    timingPoint: "runner_action",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 42,
    payload,
  } as unknown as LegalAction;
}

function choice(
  legalAction: LegalAction,
  scopeId: string,
  score: number,
): SemanticRuntimeChoice {
  return {
    action: legalAction,
    scopeId,
    score,
    scoreBreakdown: [
      {
        key: "test_score",
        label: "Test score",
        value: score,
        reason: "test",
      },
    ],
    reasonCode: `runner.semantic.${scopeId}`,
    explanation: scopeId,
    evidence: [`action_type:${legalAction.type}`],
  };
}

function runTargetEvaluation(
  actionValue: LegalAction,
  options: {
    accessPayoff?: RunnerRunTargetEvaluation["accessPayoff"];
    targetServerId?: string;
    targetKind?: RunnerRunTargetEvaluation["targetKind"];
  } = {},
): RunnerRunTargetEvaluation {
  const accessPayoff = options.accessPayoff ?? "unknown";
  const targetServerId = options.targetServerId ?? "rd";
  const targetKind = options.targetKind ?? "rd";
  return {
    schemaVersion: "runner-run-target-evaluation-v1",
    targetServerId,
    targetKind,
    accessServerId: targetServerId,
    accessTargetKind: targetKind,
    actionId: actionValue.actionId,
    accessPayoff,
    knownAccessState:
      accessPayoff === "known_low_value"
        ? "known_no_current_payoff"
        : "unknown",
    multiaccessAvailable: false,
    pathPassability: "reachable",
    pathCost: 2,
    creditsAfterRun: 3,
    stealOrTrashAffordable: "unknown",
    installedRunPayoff: {
      immediateAccessValue: 0,
      futureSetupValue: 0,
      purgeTaxValue: 0,
      economyValue: 0,
      riskPenalty: 0,
      scoreBonus: 0,
      multiaccessAvailable: false,
      evidence: [],
    },
    runActionPayoff: {
      immediateAccessValue: 0,
      futureSetupValue: 0,
      purgeTaxValue: 0,
      economyValue: 0,
      riskPenalty: 0,
      scoreBonus: 0,
      multiaccessAvailable: false,
      evidence: [],
    },
    runActionProjection: {
      actionId: actionValue.actionId,
      actionType: actionValue.type,
      targetServerId,
      targetKind,
      sourceKind: actionValue.type === "start_run" ? "basic_action" : "event",
      structure:
        actionValue.type === "start_run" ? "direct_start_run" : "event_run",
      accessPayoffSignals: [],
      constraintSignals: [],
      riskSignals: [],
      noNoisyBreakers: false,
      bypassFirstIce: false,
      projectionStatus: "concrete_target",
      evidence: [],
    },
    riskyUniversalCoverage: false,
    scoreThreat: false,
    recommendation: "run_now",
    score: 100,
    evidence: [`target:${targetServerId}`],
  };
}
