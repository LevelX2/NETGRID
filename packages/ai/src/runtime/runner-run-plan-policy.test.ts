import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import { runnerRunPlanSemanticChoice } from "./runner-run-plan-policy";
import type { RunnerRunPlan } from "./runner-run-plan-types";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";

describe("runner run plan policy", () => {
  it("chooses the quoted pump step over continue through an unbroken ETR", () => {
    const pump = pumpAction({ costs: [{ credits: 1 }] });
    const continueRun = continueAction({
      encounterWillEndRun: true,
      unbrokenSubroutineCount: 1,
    });
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_261_quandary",
      iceTitle: "Quandary",
      iceStrength: 2,
      legalActions: [pump, continueRun],
    });

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [
        choice(continueRun, "simple_run_choice", 900),
        choice(pump, "encounter_survival", 100),
      ],
    });

    expect(selected?.action.actionId).toBe(pump.actionId);
    expect(selected?.reasonCode).toBe("runner.run_plan.encounter_survival");
    expect(selected?.evidence).toContain("runner_run_plan_sequence_selected:true");
    expect(selected?.evidence).toContain("pump_required_count:2");
  });

  it("chooses a direct break step over continue through an unbroken ETR", () => {
    const breakSubroutine = breakAction({ costs: [] });
    const continueRun = continueAction({
      encounterWillEndRun: true,
      unbrokenSubroutineCount: 1,
    });
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_261_quandary",
      iceTitle: "Quandary",
      iceStrength: 2,
      breakerStrength: 2,
      legalActions: [breakSubroutine, continueRun],
    });

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [
        choice(continueRun, "simple_run_choice", 900),
        choice(breakSubroutine, "encounter_survival", 100),
      ],
    });

    expect(selected?.action.actionId).toBe(breakSubroutine.actionId);
    expect(selected?.evidence).toContain("current_encounter_direct_break_sequence:true");
  });

  it("chooses a direct break over continuing through visible non-ETR damage", () => {
    const breakSubroutine = breakAction({ costs: [], subroutineIndex: 0 });
    const continueRun = continueAction({
      encounterWillEndRun: false,
      unbrokenSubroutineCount: 1,
    });
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_261_quandary",
      iceTitle: "Quandary",
      iceStrength: 2,
      breakerStrength: 2,
      subroutines: [
        {
          id: "damage-subroutine",
          type: "do_damage",
          unbrokenRunEffect: { causesDamageOrProgramTrash: true },
        },
      ],
      legalActions: [breakSubroutine, continueRun],
    });

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [
        choice(continueRun, "simple_run_choice", 900),
        choice(breakSubroutine, "encounter_survival", 100),
      ],
    });

    expect(selected?.action.actionId).toBe(breakSubroutine.actionId);
    expect(selected?.evidence).toContain("required_subroutine_indexes:0");
  });

  it("chooses jack out when continue would end the run and no access-preserving sequence exists", () => {
    const pump = pumpAction({ costs: [{ credits: 1 }] });
    const continueRun = continueAction({
      encounterWillEndRun: true,
      unbrokenSubroutineCount: 1,
    });
    const jackOut = action("jack_out", {
      actionId: "jack-out",
      source: "game_rule",
      costs: [],
      payload: {},
    });
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_253_laser-wire",
      iceTitle: "Laser Wire",
      iceStrength: 2,
      legalActions: [pump, continueRun, jackOut],
    });

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [
        choice(pump, "encounter_survival", 800),
        choice(continueRun, "simple_run_choice", 700),
        choice(jackOut, "simple_run_choice", 100),
      ],
    });

    expect(selected?.action.actionId).toBe(jackOut.actionId);
    expect(selected?.evidence).toContain("runner_run_plan_abort_recommended:true");
  });

  it("continues after all encounter subroutines are already broken", () => {
    const continueRun = continueAction({
      encounterWillEndRun: false,
      unbrokenSubroutineCount: 0,
    });
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_261_quandary",
      iceTitle: "Quandary",
      iceStrength: 2,
      breakerStrength: 2,
      legalActions: [continueRun],
    });

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [choice(continueRun, "simple_run_choice", 100)],
    });

    expect(selected?.action.actionId).toBe(continueRun.actionId);
    expect(selected?.evidence).toContain("encounter_no_etr_break_required:true");
  });
});

function runnerEncounterInput(params: {
  iceDefinitionId: string;
  iceTitle: string;
  iceStrength: number;
  breakerStrength?: number;
  subroutines?: NonNullable<VisibleCard["effectiveRunQuote"]>["subroutines"];
  legalActions: LegalAction[];
}): AiDecisionInput {
  const ice = visibleIce(params);
  return {
    side: "runner",
    playerView: {
      stateVersion: 143,
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
            strength: params.breakerStrength ?? 0,
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
          id: "rd",
          label: "R&D",
          ice: [ice],
          root: [],
        },
      ],
      run: {
        attackedServerId: "rd",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "rd", iceIndex: 0 },
        encounteredIce: ice,
        successful: false,
      },
      publicEvents: [],
    },
    eventTail: [],
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "runner-run-plan-policy-test",
    decisionId: "runner-run-plan-policy-test:143:runner",
    actionNumber: 1,
    profileId: "runner-run-plan-profile",
  } as unknown as AiDecisionInput;
}

function visibleIce(params: {
  iceDefinitionId: string;
  iceTitle: string;
  iceStrength: number;
  subroutines?: NonNullable<VisibleCard["effectiveRunQuote"]>["subroutines"];
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
      subroutines: params.subroutines ?? [
        {
          id: `${params.iceDefinitionId}:etr`,
          type: "end_the_run",
        },
      ],
    },
  };
}

function runPlan(): RunnerRunPlan {
  return {
    id: "runplan-policy-test",
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
      totalKnownCost: 0,
      expectedUnknownCost: 0,
      expectedRemainingCredits: 7,
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
      checkedAtStateVersion: 143,
    },
    abortPolicy: {
      allowJackOutWhenLegal: true,
      abortBelowCredits: 0,
      abortReasons: [],
    },
    visibilityEvidence: [{ kind: "player_view", ref: "run" }],
    debug: { summary: "test run plan", items: [] },
    createdAtStateVersion: 142,
    updatedAtStateVersion: 143,
  };
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

function breakAction(params: {
  costs: LegalAction["costs"];
  subroutineIndex?: number;
}): LegalAction {
  return action("break_subroutine", {
    actionId: "break-codecracker",
    source: "codecracker-1",
    costs: params.costs,
    payload: {
      breakerId: "codecracker-1",
      iceId: "ice-1",
      subroutineIndex: params.subroutineIndex ?? 0,
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
    expiresAtStateVersion: 143,
    payload: params.payload,
  } as unknown as LegalAction;
}
