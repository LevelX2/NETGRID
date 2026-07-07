import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import { revalidateRunnerRunPlan } from "./runner-run-plan-revalidation";
import type { RunnerRunPlan } from "./runner-run-plan-types";

describe("runner run plan revalidation", () => {
  it("adjusts the active plan when the current known path quote changes", () => {
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_261_quandary",
      iceTitle: "Quandary",
      iceStrength: 2,
      legalActions: [
        pumpAction({ costs: [{ credits: 1 }] }),
        continueAction({ encounterWillEndRun: true, unbrokenSubroutineCount: 1 }),
      ],
    });
    const plan = runPlan({
      totalKnownCost: 0,
      expectedRemainingCredits: 7,
      reasons: ["fingerprint:previous"],
    });

    const revalidated = revalidateRunnerRunPlan(input, plan);

    expect(revalidated.revalidation.status).toBe("adjusted");
    expect(revalidated.lifecycle).toBe("adjusted");
    expect(revalidated.pathQuote.totalKnownCost).toBe(2);
    expect(revalidated.revalidation.reasons).toContain("path_quote_changed");
    expect(revalidated.revalidation.reasons).toContain(
      "run_state_fingerprint_changed",
    );
  });

  it("marks a plan abort-recommended when a known ETR path cannot preserve access", () => {
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_253_laser-wire",
      iceTitle: "Laser Wire",
      iceStrength: 2,
      legalActions: [
        pumpAction({ costs: [{ credits: 1 }] }),
        continueAction({ encounterWillEndRun: true, unbrokenSubroutineCount: 1 }),
        action("jack_out", {
          actionId: "jack-out",
          source: "game_rule",
          costs: [],
          payload: {},
        }),
      ],
    });

    const revalidated = revalidateRunnerRunPlan(input, runPlan());

    expect(revalidated.revalidation.status).toBe("abort_recommended");
    expect(revalidated.lifecycle).toBe("abort_recommended");
    expect(revalidated.pathQuote.canReachAccess).toBe(false);
    expect(revalidated.revalidation.reasons).toContain(
      "cannot_reach:known_ice_unbreakable",
    );
  });

  it("marks a plan invalid when the active run target no longer matches", () => {
    const input = runnerEncounterInput({
      attackedServerId: "hq",
      iceDefinitionId: "onr_v1_261_quandary",
      iceTitle: "Quandary",
      iceStrength: 2,
      legalActions: [],
    });

    const revalidated = revalidateRunnerRunPlan(input, runPlan());

    expect(revalidated.revalidation.status).toBe("invalid");
    expect(revalidated.lifecycle).toBe("invalid");
    expect(revalidated.revalidation.reasons).toContain("target_server_changed");
    expect(revalidated.revalidation.reasons).toContain("current_target:hq");
  });
});

function runnerEncounterInput(params: {
  attackedServerId?: "hq" | "rd";
  iceDefinitionId: string;
  iceTitle: string;
  iceStrength: number;
  legalActions: LegalAction[];
}): AiDecisionInput {
  const attackedServerId = params.attackedServerId ?? "rd";
  const ice = visibleIce(params);
  return {
    side: "runner",
    playerView: {
      stateVersion: 211,
      side: "runner",
      activeSide: "runner",
      timingPoint: "run.encounter",
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
        rig: [
          {
            instanceId: "codecracker-1",
            known: true,
            title: "Codecracker",
            definitionId: "onr_v1_014_codecracker",
            type: "program",
            subtypes: ["icebreaker"],
            strength: 0,
          },
        ],
        clicks: 3,
        credits: 7,
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
      servers: [
        {
          id: attackedServerId,
          label: attackedServerId.toUpperCase(),
          ice: [ice],
          root: [],
        },
      ],
      run: {
        attackedServerId,
        phase: "encounter_ice",
        position: { kind: "ice", serverId: attackedServerId, iceIndex: 0 },
        encounteredIce: ice,
        successful: false,
      },
      publicEvents: [],
    },
    eventTail: [],
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "runner-run-plan-revalidation-test",
    decisionId: "runner-run-plan-revalidation-test:211:runner",
    actionNumber: 1,
    profileId: "runner-run-plan-profile",
  } as unknown as AiDecisionInput;
}

function visibleIce(params: {
  iceDefinitionId: string;
  iceTitle: string;
  iceStrength: number;
}): VisibleCard {
  return {
    instanceId: "ice-1",
    known: true,
    title: params.iceTitle,
    definitionId: params.iceDefinitionId,
    type: "ice",
    subtypes:
      params.iceDefinitionId === "onr_v1_253_laser-wire"
        ? ["wall"]
        : ["code_gate"],
    rezzed: true,
    strength: params.iceStrength,
    effectiveRunQuote: {
      iceInstanceId: "ice-1",
      iceDefinitionId: params.iceDefinitionId,
      effectiveStrength: params.iceStrength,
      subroutines: [
        {
          id: `${params.iceDefinitionId}:etr`,
          type: "end_the_run",
        },
      ],
    },
  };
}

function runPlan(
  overrides: {
    totalKnownCost?: number;
    expectedRemainingCredits?: number;
    reasons?: string[];
  } = {},
): RunnerRunPlan {
  return {
    id: "runplan-revalidation-test",
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
      availableCredits: 7,
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
      totalKnownCost: overrides.totalKnownCost ?? 2,
      expectedUnknownCost: 0,
      expectedRemainingCredits: overrides.expectedRemainingCredits ?? 5,
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
      reasons: overrides.reasons ?? [],
      checkedAtStateVersion: 210,
    },
    abortPolicy: {
      allowJackOutWhenLegal: true,
      abortBelowCredits: 0,
      abortReasons: [],
    },
    visibilityEvidence: [{ kind: "player_view", ref: "run" }],
    debug: { summary: "test run plan", items: [] },
    createdAtStateVersion: 210,
    updatedAtStateVersion: 210,
  };
}

function pumpAction(params: { costs: LegalAction["costs"] }): LegalAction {
  return action("pump_breaker", {
    actionId: "pump-codecracker",
    source: "codecracker-1",
    costs: params.costs,
    payload: {
      breakerId: "codecracker-1",
      iceId: "ice-1",
      pumpStrengthAmount: 1,
    },
  });
}

function continueAction(params: {
  encounterWillEndRun: boolean;
  unbrokenSubroutineCount: number;
}): LegalAction {
  return action("continue_run", {
    actionId: "continue-run",
    source: "game_rule",
    costs: [],
    payload: {
      encounterContinue: true,
      encounterWillEndRun: params.encounterWillEndRun,
      unbrokenSubroutineCount: params.unbrokenSubroutineCount,
    },
  });
}

function action(
  type: LegalAction["type"],
  params: {
    actionId: string;
    source: LegalAction["source"];
    costs: LegalAction["costs"];
    payload: NonNullable<LegalAction["payload"]>;
  },
): LegalAction {
  return {
    actionId: params.actionId,
    side: "runner",
    type,
    label: params.actionId,
    source: params.source,
    timingPoint: "run.encounter",
    costs: params.costs,
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 211,
    payload: params.payload,
  } as unknown as LegalAction;
}
