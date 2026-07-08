import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { runnerRunPlanSemanticChoice } from "./runner-run-plan-policy";
import type { RunnerRunPlan } from "./runner-run-plan-types";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";

describe("runner run plan access policy", () => {
  it("chooses agenda steal as the access objective", () => {
    const steal = action("steal_agenda", { costs: [{ credits: 1 }] });
    const decline = action("decline_trash");

    const selected = runnerRunPlanSemanticChoice({
      input: accessInput([decline, steal]),
      plan: runPlan(),
      choices: [choice(decline, 900), choice(steal, 100)],
    });

    expect(selected?.action.actionId).toBe(steal.actionId);
    expect(selected?.evidence).toContain(
      "runner_run_plan_access_selected:steal_agenda",
    );
  });

  it("opens access cards before lower-priority access choices", () => {
    const accessCard = action("access_card");
    const decline = action("decline_trash");

    const selected = runnerRunPlanSemanticChoice({
      input: accessInput([decline, accessCard]),
      plan: runPlan(),
      choices: [choice(decline, 900), choice(accessCard, 100)],
    });

    expect(selected?.action.actionId).toBe(accessCard.actionId);
    expect(selected?.evidence).toContain(
      "runner_run_plan_access_selected:access_card",
    );
  });

  it("declines trash when paying would violate the plan access reserve", () => {
    const trash = action("trash_accessed_card", { costs: [{ credits: 5 }] });
    const decline = action("decline_trash");

    const selected = runnerRunPlanSemanticChoice({
      input: accessInput([trash, decline], { credits: 5 }),
      plan: runPlan({ reserveForStealOrTrash: 2 }),
      choices: [choice(trash, 900), choice(decline, 100)],
    });

    expect(selected?.action.actionId).toBe(decline.actionId);
    expect(selected?.evidence).toContain(
      "runner_run_plan_access_trash_breaks_reserve:true",
    );
  });

  it("honors must-trash target access intent when trash is legal", () => {
    const trash = action("trash_accessed_card", { costs: [{ credits: 2 }] });
    const decline = action("decline_trash");

    const selected = runnerRunPlanSemanticChoice({
      input: accessInput([decline, trash], { credits: 5 }),
      plan: runPlan({ trashPolicy: "must_trash_target" }),
      choices: [choice(decline, 900), choice(trash, 100)],
    });

    expect(selected?.action.actionId).toBe(trash.actionId);
    expect(selected?.evidence).toContain(
      "runner_run_plan_access_trash_policy:must_trash_target",
    );
  });

  it("lets semantic trash value override decline-low-value access intent", () => {
    const trash = action("trash_accessed_card");
    const decline = action("decline_trash");

    const selected = runnerRunPlanSemanticChoice({
      input: accessInput([decline, trash], { credits: 5 }),
      plan: runPlan({ trashPolicy: "decline_low_value" }),
      choices: [choice(decline, -1745), choice(trash, -575)],
    });

    expect(selected?.action.actionId).toBe(trash.actionId);
    expect(selected?.evidence).toContain(
      "runner_run_plan_access_decline_low_value_yielded_to_score:true",
    );
  });

  it("keeps decline-low-value when decline is at least as good as trash", () => {
    const trash = action("trash_accessed_card", { costs: [{ credits: 1 }] });
    const decline = action("decline_trash");

    const selected = runnerRunPlanSemanticChoice({
      input: accessInput([trash, decline], { credits: 5 }),
      plan: runPlan({ trashPolicy: "decline_low_value" }),
      choices: [choice(trash, -900), choice(decline, 100)],
    });

    expect(selected?.action.actionId).toBe(decline.actionId);
    expect(selected?.evidence).toContain(
      "runner_run_plan_access_trash_policy:decline_low_value",
    );
  });

  it("falls back to score selection when the run plan is invalid during access", () => {
    const trash = action("trash_accessed_card");
    const decline = action("decline_trash");

    const selected = runnerRunPlanSemanticChoice({
      input: accessInput([trash, decline], { credits: 5 }),
      plan: runPlan({
        trashPolicy: "must_trash_target",
        revalidationStatus: "invalid",
      }),
      choices: [choice(trash, 100), choice(decline, 900)],
    });

    expect(selected?.action.actionId).toBe(decline.actionId);
    expect(selected?.evidence).toContain(
      "runner_run_plan_access_score_fallback:true",
    );
    expect(selected?.evidence).toContain(
      "runner_run_plan_access_fallback_reason:invalid_revalidation",
    );
  });
});

function accessInput(
  legalActions: LegalAction[],
  options: { credits?: number } = {},
): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      stateVersion: 300,
      side: "runner",
      activeSide: "runner",
      timingPoint: "run.access",
      phase: "runner_action",
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
        credits: options.credits ?? 5,
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
      servers: [{ id: "rd", label: "R&D", ice: [], root: [] }],
      run: {
        attackedServerId: "rd",
        phase: "access",
        position: { kind: "server", serverId: "rd" },
        successful: true,
      },
      publicEvents: [],
    },
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "runner-run-plan-access-policy-test",
    decisionId: "runner-run-plan-access-policy-test:300:runner",
    actionNumber: 1,
    profileId: "runner-run-plan-profile",
  } as unknown as AiDecisionInput;
}

function runPlan(
  options: {
    trashPolicy?: NonNullable<RunnerRunPlan["accessIntent"]>["trashPolicy"];
    reserveForStealOrTrash?: number;
    revalidationStatus?: RunnerRunPlan["revalidation"]["status"];
  } = {},
): RunnerRunPlan {
  const reserveForStealOrTrash = options.reserveForStealOrTrash ?? 0;
  return {
    id: "runplan-access-policy-test",
    side: "runner",
    lifecycle: "active",
    origin: "basic_start_run",
    objective: { kind: "access_rnd_top", expectedValue: 100 },
    targetServer: { id: "rd" },
    accessIntent: {
      server: "rd",
      expectedAccessCount: 1,
      stealAgendaPolicy: "steal_if_affordable",
      trashPolicy: options.trashPolicy ?? "trash_if_value_positive",
      reserveForStealOrTrash,
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
      reservedCreditsForSteal: reserveForStealOrTrash,
      reservedCreditsForTrash: reserveForStealOrTrash,
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
      preserveStealOrTrashCredits: reserveForStealOrTrash,
      evidence: [],
    },
    pathQuote: {
      server: "rd",
      quoteStatus: "known_complete",
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
      phase: "access",
    },
    revalidation: {
      status: options.revalidationStatus ?? "valid",
      reasons: [],
      checkedAtStateVersion: 300,
    },
    abortPolicy: {
      allowJackOutWhenLegal: true,
      abortBelowCredits: 0,
      abortReasons: [],
    },
    visibilityEvidence: [{ kind: "player_view", ref: "run" }],
    debug: { summary: "test run plan", items: [] },
    createdAtStateVersion: 299,
    updatedAtStateVersion: 300,
  };
}

function choice(
  legalAction: LegalAction,
  score: number,
): SemanticRuntimeChoice {
  return {
    action: legalAction,
    scopeId: "access_trash_steal",
    score,
    scoreBreakdown: [
      {
        key: "test_score",
        label: "Test score",
        value: score,
        reason: "test",
      },
    ],
    reasonCode: "runner.semantic.access_trash_steal",
    explanation: "access",
    evidence: [`action_type:${legalAction.type}`],
  };
}

function action(
  type: LegalAction["type"],
  options: { costs?: LegalAction["costs"] } = {},
): LegalAction {
  return {
    actionId: type,
    side: "runner",
    type,
    label: type,
    source: "game_rule",
    timingPoint: "run.access",
    costs: options.costs ?? [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 300,
    payload: {},
  } as unknown as LegalAction;
}
