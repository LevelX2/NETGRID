import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

import { quoteRunnerRunPath } from "./runner-run-plan-path-quote";
import type { RunnerRunPlan } from "./runner-run-plan-types";

describe("runner run plan path quote", () => {
  it("quotes direct break as the current access-preserving sequence", () => {
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_261_quandary",
      iceTitle: "Quandary",
      iceStrength: 2,
      breakerStrength: 2,
      legalActions: [
        breakAction({ costs: [] }),
        continueAction({
          encounterWillEndRun: true,
          unbrokenSubroutineCount: 1,
        }),
      ],
    });

    const quote = quoteRunnerRunPath(input, runPlan());
    const sequence = quote.iceQuotes[0]?.cheapestAccessPreservingSequence;

    expect(sequence?.steps.map((step) => step.actionType)).toEqual([
      "break_subroutine",
    ]);
    expect(sequence?.usesPump).toBe(false);
    expect(sequence?.usesBreak).toBe(true);
    expect(sequence?.totalCost).toBe(0);
  });

  it("quotes a direct break for visible non-ETR survival damage", () => {
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
      legalActions: [
        breakAction({ costs: [], subroutineIndex: 0 }),
        continueAction({
          encounterWillEndRun: false,
          unbrokenSubroutineCount: 1,
        }),
      ],
    });

    const quote = quoteRunnerRunPath(input, runPlan());
    const sequence = quote.iceQuotes[0]?.cheapestAccessPreservingSequence;

    expect(sequence?.steps.map((step) => step.actionType)).toEqual([
      "break_subroutine",
    ]);
    expect(sequence?.evidence).toContain("required_subroutine_indexes:0");
    expect(quote.canReachAccess).toBe(true);
  });

  it("prefers same-cost multi-break when it clears damage and ETR together", () => {
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_269_shotgun-wire",
      iceTitle: "Shotgun Wire",
      iceStrength: 5,
      breakerStrength: 7,
      subroutines: [
        {
          id: "shotgun-wire-net-damage",
          type: "do_damage",
          unbrokenRunEffect: { causesDamageOrProgramTrash: true },
        },
        {
          id: "shotgun-wire-etr",
          type: "end_the_run",
        },
      ],
      legalActions: [
        breakAction({
          actionId: "pile-driver-break-damage",
          costs: [{ credits: 3 }],
          subroutineIndexes: "0",
        }),
        breakAction({
          actionId: "pile-driver-break-both",
          costs: [{ credits: 3 }],
          subroutineIndexes: "0,1",
        }),
        breakAction({
          actionId: "pile-driver-break-etr",
          costs: [{ credits: 3 }],
          subroutineIndexes: "1",
        }),
        continueAction({
          encounterWillEndRun: true,
          unbrokenSubroutineCount: 2,
        }),
      ],
    });

    const quote = quoteRunnerRunPath(input, runPlan());
    const sequence = quote.iceQuotes[0]?.cheapestAccessPreservingSequence;

    expect(sequence?.steps.map((step) => step.actionId)).toEqual([
      "pile-driver-break-both",
    ]);
    expect(sequence?.totalCost).toBe(3);
    expect(sequence?.evidence).toContain("required_subroutine_indexes:0,1");
  });

  it("targets the required ETR subroutine instead of a cheaper harmless break", () => {
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_261_quandary",
      iceTitle: "Quandary",
      iceStrength: 2,
      breakerStrength: 2,
      subroutines: [
        { id: "harmless-subroutine", type: "corp_gain_credit" },
        { id: "etr-subroutine", type: "end_the_run" },
      ],
      legalActions: [
        breakAction({
          actionId: "break-harmless",
          costs: [],
          subroutineIndex: 0,
        }),
        breakAction({
          actionId: "break-etr",
          costs: [{ credits: 3 }],
          subroutineIndex: 1,
        }),
        continueAction({
          encounterWillEndRun: true,
          unbrokenSubroutineCount: 2,
        }),
      ],
    });

    const quote = quoteRunnerRunPath(input, runPlan());
    const sequence = quote.iceQuotes[0]?.cheapestAccessPreservingSequence;

    expect(sequence?.steps.map((step) => step.actionId)).toEqual(["break-etr"]);
    expect(sequence?.totalCost).toBe(3);
    expect(sequence?.evidence).toContain("required_subroutine_indexes:1");
  });

  it("quotes Codecracker pumping before a future break against Quandary generically", () => {
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_261_quandary",
      iceTitle: "Quandary",
      iceStrength: 2,
      legalActions: [
        pumpAction({ costs: [{ credits: 1 }] }),
        continueAction({
          encounterWillEndRun: true,
          unbrokenSubroutineCount: 1,
        }),
      ],
    });

    const quote = quoteRunnerRunPath(input, runPlan());
    const sequence = quote.iceQuotes[0]?.cheapestAccessPreservingSequence;

    expect(sequence?.steps.map((step) => step.actionType)).toEqual([
      "pump_breaker",
      "pump_breaker",
    ]);
    expect(sequence?.usesPump).toBe(true);
    expect(sequence?.usesBreak).toBe(true);
    expect(sequence?.totalCost).toBe(2);
    expect(sequence?.riskTags).toContain("break_action_expected_after_pump");
    expect(sequence?.evidence).toContain("pump_required_count:2");
    expect(quote.canReachAccess).toBe(true);
  });

  it("quotes Codecracker pumping before a future break against Keeper generically", () => {
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_252_keeper",
      iceTitle: "Keeper",
      iceStrength: 4,
      legalActions: [
        pumpAction({ costs: [{ credits: 1 }] }),
        continueAction({
          encounterWillEndRun: true,
          unbrokenSubroutineCount: 1,
        }),
      ],
    });

    const quote = quoteRunnerRunPath(input, runPlan());
    const sequence = quote.iceQuotes[0]?.cheapestAccessPreservingSequence;

    expect(sequence?.steps.map((step) => step.actionType)).toEqual([
      "pump_breaker",
      "pump_breaker",
      "pump_breaker",
      "pump_breaker",
    ]);
    expect(sequence?.totalCost).toBe(4);
    expect(sequence?.evidence).toContain("pump_required_count:4");
    expect(quote.expectedRemainingCredits).toBe(3);
  });

  it("uses visible non-noisy recurring credits as non-cash pump budget against Keeper", () => {
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_252_keeper",
      iceTitle: "Keeper",
      iceStrength: 4,
      credits: 2,
      extraRig: [quietPrograms()],
      legalActions: [
        pumpAction({ costs: [{ credits: 1 }] }),
        continueAction({
          encounterWillEndRun: true,
          unbrokenSubroutineCount: 1,
        }),
      ],
    });

    const quote = quoteRunnerRunPath(input, runPlan());
    const sequence = quote.iceQuotes[0]?.cheapestAccessPreservingSequence;

    expect(sequence?.steps.map((step) => step.actionType)).toEqual([
      "pump_breaker",
      "pump_breaker",
      "pump_breaker",
      "pump_breaker",
    ]);
    expect(sequence?.totalCost).toBe(4);
    expect(sequence?.cashCost).toBe(2);
    expect(sequence?.restrictedCreditCost).toBe(2);
    expect(sequence?.evidence).toContain("sequence_cash_cost:2");
    expect(sequence?.evidence).toContain("sequence_restricted_credits_spent:2");
    expect(quote.expectedRemainingCredits).toBe(0);
    expect(quote.canReachAccess).toBe(true);
  });

  it("does not re-quote passed outer ICE while breaking the inner ICE", () => {
    const passedKeeper = visibleIce({
      instanceId: "passed-keeper",
      iceDefinitionId: "onr_v1_252_keeper",
      iceTitle: "Keeper",
      iceStrength: 4,
    });
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_261_quandary",
      iceTitle: "Quandary",
      iceStrength: 2,
      credits: 2,
      passedOuterIce: [passedKeeper],
      legalActions: [
        pumpAction({ costs: [{ credits: 1 }] }),
        continueAction({
          encounterWillEndRun: true,
          unbrokenSubroutineCount: 1,
        }),
      ],
    });

    const quote = quoteRunnerRunPath(input, runPlan());
    const sequence = quote.iceQuotes[0]?.cheapestAccessPreservingSequence;

    expect(
      quote.iceQuotes.map((iceQuote) => iceQuote.iceRef.instanceId),
    ).toEqual(["ice-1"]);
    expect(sequence?.steps.map((step) => step.actionType)).toEqual([
      "pump_breaker",
      "pump_breaker",
    ]);
    expect(quote.totalKnownCost).toBe(2);
    expect(quote.expectedRemainingCredits).toBe(0);
    expect(quote.canReachAccess).toBe(true);
    expect(quote.cannotReachReason).toBeUndefined();
  });

  it("requires breaking hard future-path modifiers before visible future ICE", () => {
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_261_quandary",
      iceTitle: "Quandary",
      iceStrength: 2,
      breakerStrength: 2,
      futureIce: [
        visibleIce({
          instanceId: "future-ice-1",
          iceDefinitionId: "onr_v1_261_quandary",
          iceTitle: "Future Quandary",
          iceStrength: 2,
        }),
      ],
      subroutines: [
        {
          id: "future-breaking-lock",
          type: "corp_gain_credit",
          unbrokenRunEffect: { preventsFutureBreaking: true },
        },
      ],
      legalActions: [
        breakAction({ costs: [], subroutineIndex: 0 }),
        continueAction({
          encounterWillEndRun: false,
          unbrokenSubroutineCount: 1,
        }),
      ],
    });

    const quote = quoteRunnerRunPath(input, runPlan());
    const currentIceQuote = quote.iceQuotes[0];
    const sequence = currentIceQuote?.cheapestAccessPreservingSequence;

    expect(currentIceQuote?.subroutineQuotes[0]?.threatClass).toBe(
      "must_break_for_access",
    );
    expect(currentIceQuote?.subroutineQuotes[0]?.evidence).toContain(
      "subroutine_future_path_modifier_required:true",
    );
    expect(sequence?.steps.map((step) => step.actionType)).toEqual([
      "break_subroutine",
    ]);
    expect(sequence?.evidence).toContain(
      "current_encounter_future_path_modifier_required:true",
    );
    expect(sequence?.evidence).toContain(
      "run_remainder_effect_must_break:true",
    );
    expect(quote.canReachAccess).toBe(true);
  });

  it("does not re-quote passed ICE after the active run reaches the server", () => {
    const input = runnerServerMovementInput({
      iceDefinitionId: "onr_v1_252_keeper",
      iceTitle: "Keeper",
      iceStrength: 4,
      credits: 0,
    });

    const quote = quoteRunnerRunPath(input, runPlan());

    expect(quote.iceQuotes).toEqual([]);
    expect(quote.totalKnownCost).toBe(0);
    expect(quote.expectedRemainingCredits).toBe(0);
    expect(quote.reserveViolation).toBe(false);
    expect(quote.canReachAccess).toBe(true);
    expect(quote.cannotReachReason).toBeUndefined();
  });

  it("does not quote a pump-break sequence when the breaker cannot cover the ICE", () => {
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_253_laser-wire",
      iceTitle: "Laser Wire",
      iceStrength: 2,
      legalActions: [
        pumpAction({ costs: [{ credits: 1 }] }),
        continueAction({
          encounterWillEndRun: true,
          unbrokenSubroutineCount: 1,
        }),
      ],
    });

    const quote = quoteRunnerRunPath(input, runPlan());

    expect(
      quote.iceQuotes[0]?.cheapestAccessPreservingSequence,
    ).toBeUndefined();
    expect(quote.canReachAccess).toBe(false);
    expect(quote.cannotReachReason).toBe("known_ice_unbreakable");
  });
});

function runnerEncounterInput(params: {
  iceDefinitionId: string;
  iceTitle: string;
  iceStrength: number;
  credits?: number;
  extraRig?: VisibleCard[];
  breakerStrength?: number;
  futureIce?: VisibleCard[];
  passedOuterIce?: VisibleCard[];
  subroutines?: NonNullable<VisibleCard["effectiveRunQuote"]>["subroutines"];
  legalActions: LegalAction[];
}): AiDecisionInput {
  const ice = visibleIce(params);
  const futureIce = params.futureIce ?? [];
  const passedOuterIce = params.passedOuterIce ?? [];
  return {
    side: "runner",
    playerView: {
      stateVersion: 86,
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
          ...(params.extraRig ?? []),
        ],
        clicks: 3,
        credits: params.credits ?? 7,
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
          ice: [...futureIce, ice, ...passedOuterIce],
          root: [],
        },
      ],
      run: {
        attackedServerId: "rd",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "rd", iceIndex: futureIce.length },
        encounteredIce: ice,
        successful: false,
      },
      publicEvents: [],
    },
    eventTail: [],
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "runner-run-plan-path-quote-test",
    decisionId: "runner-run-plan-path-quote-test:86:runner",
    actionNumber: 1,
    profileId: "runner-run-plan-profile",
  } as unknown as AiDecisionInput;
}

function runnerServerMovementInput(params: {
  iceDefinitionId: string;
  iceTitle: string;
  iceStrength: number;
  credits: number;
}): AiDecisionInput {
  const ice = visibleIce(params);
  return {
    side: "runner",
    playerView: {
      stateVersion: 167,
      side: "runner",
      activeSide: "runner",
      timingPoint: "run.jack_out_window",
      phase: "runner_action",
      turn: 1,
      click: 3,
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
            strength: params.iceStrength,
          },
        ],
        clicks: 1,
        credits: params.credits,
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
        phase: "movement",
        position: { kind: "server", serverId: "rd" },
        encounteredIce: ice,
        successful: false,
      },
      publicEvents: [],
    },
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "runner-run-plan-path-quote-server-movement-test",
    decisionId: "runner-run-plan-path-quote-server-movement-test:167:runner",
    actionNumber: 3,
    profileId: "runner-run-plan-profile",
  } as unknown as AiDecisionInput;
}

function visibleIce(params: {
  instanceId?: string;
  iceDefinitionId: string;
  iceTitle: string;
  iceStrength: number;
  subroutines?: NonNullable<VisibleCard["effectiveRunQuote"]>["subroutines"];
}): VisibleCard {
  return {
    instanceId: params.instanceId ?? "ice-1",
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

function quietPrograms(): VisibleCard {
  return {
    instanceId: "quiet-1",
    known: true,
    title: "Vewy Vewy Quiet",
    definitionId: "onr_v1_071_vewy-vewy-quiet",
    type: "program",
    subtypes: ["stealth"],
    counterDisplays: [
      {
        id: "quiet-1-recurring",
        counterType: "recurring_credit",
        amount: 2,
        displayKind: "recurring_credit",
        label: "Recurring credits",
        ariaLabel: "2 recurring credits",
        creditPool: {
          kind: "recurring_credit",
          uses: ["using_icebreaker_during_run_non_noisy"],
        },
      },
    ],
  } as VisibleCard;
}

function runPlan(): RunnerRunPlan {
  return {
    id: "runplan-quote-test",
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
      checkedAtStateVersion: 86,
    },
    abortPolicy: {
      allowJackOutWhenLegal: true,
      abortBelowCredits: 0,
      abortReasons: [],
    },
    visibilityEvidence: [{ kind: "player_view", ref: "run" }],
    debug: { summary: "test run plan", items: [] },
    createdAtStateVersion: 85,
    updatedAtStateVersion: 86,
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
  actionId?: string;
  costs: LegalAction["costs"];
  subroutineIndex?: number;
  subroutineIndexes?: string;
}): LegalAction {
  return action("break_subroutine", {
    actionId: params.actionId ?? "break-codecracker",
    source: "codecracker-1",
    costs: params.costs,
    payload: {
      breakerId: "codecracker-1",
      iceId: "ice-1",
      ...(params.subroutineIndexes
        ? { subroutineIndexes: params.subroutineIndexes }
        : { subroutineIndex: params.subroutineIndex ?? 0 }),
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
    expiresAtStateVersion: 86,
    payload: params.payload,
  } as unknown as LegalAction;
}
