import { describe, expect, it, beforeEach } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
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
import type { RunnerRunPlan } from "./runner-run-plan-types";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";

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

  it("makes missing active run plans fail through the semantic runtime entry", () => {
    const input = runnerInput({ activeRun: true });

    expect(() =>
      chooseSemanticRuntimeAction(input, {}, minimalRuntimeDependencies()),
    ).toThrow(MissingRunnerRunPlanError);
  });

  it("selects active run actions through a run plan annotated choice", () => {
    const input = runnerInput({ activeRun: true });
    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [
        choice(action("gain_credit"), "basic_economy_draw", 200),
        choice(action("continue_run"), "simple_run_choice", 100),
      ],
    });

    expect(selected?.action.type).toBe("continue_run");
    expect(selected?.reasonCode).toBe("runner.run_plan.simple_run_choice");
    expect(selected?.evidence).toContain("runner_run_plan_active:true");
    expect(selected?.evidence).toContain("runner_run_plan_id:runplan-1");
  });
});

function minimalRuntimeDependencies(): SemanticRuntimeDependencies {
  return {
    buildActionSemanticCandidates: () => [],
  } as unknown as SemanticRuntimeDependencies;
}

function runnerInput(params: { activeRun: boolean }): AiDecisionInput {
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
        rig: [],
        clicks: 3,
        credits: 5,
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
      servers: [],
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
    legalActions: [],
    difficulty: "standard",
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

function action(type: LegalAction["type"]): LegalAction {
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
    reasonCode: `runner.semantic.${scopeId}`,
    explanation: scopeId,
    evidence: [`action_type:${legalAction.type}`],
  };
}
