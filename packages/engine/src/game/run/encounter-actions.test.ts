import {
  DEMO_CARDS_BY_ID,
  type CardDefinition,
  type CardInstance,
  type CardInstanceId,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildLegalAction } from "../turn/action-builders";
import { proteusTestCardDefinition } from "../../test/proteus-card-definitions";
import {
  buildRunnerEncounterActions,
  buildRunnerMovementActions,
  type RunnerEncounterActionHost,
} from "./encounter-actions";

function instance(
  id: string,
  definitionId: string,
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId,
    owner: options.owner ?? "runner",
    controller: options.controller ?? "runner",
    zone: options.zone ?? { side: "runner", zone: "rig" },
    faceup: options.faceup ?? true,
    rezzed: options.rezzed ?? true,
    strengthModifier: options.strengthModifier ?? 0,
    ...options,
  } as CardInstance;
}

function iceDefinition(
  options: Partial<CardDefinition> = {},
): CardDefinition {
  return {
    id: "test_sentry_ice",
    title: "Test Sentry",
    side: "corp",
    type: "ice",
    subtypes: ["sentry"],
    strength: 1,
    subroutines: [{ id: "test_sentry_etr", type: "end_the_run" }],
    ...options,
  } as CardDefinition;
}

function makeState(
  options: {
    breakerDefinitionId?: string;
    ice?: CardDefinition;
    runnerCredits?: number;
    encounteredIceId?: CardInstanceId | undefined;
    timingPoint?: GameState["timingPoint"];
    runPhase?: NonNullable<GameState["run"]>["phase"];
  } = {},
): GameState {
  const breakerId = "breaker_1" as CardInstanceId;
  const iceId = "ice_1" as CardInstanceId;
  const encounteredIceId = Object.hasOwn(options, "encounteredIceId")
    ? options.encounteredIceId
    : iceId;
  return {
    stateVersion: 7,
    activeSide: "runner",
    phase: "run",
    timingPoint: options.timingPoint ?? "run.encounter_ice",
    runner: {
      credits: options.runnerCredits ?? 5,
      clicks: 0,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: {
        programs: [breakerId],
        hardware: [],
        resources: [],
      },
    },
    corp: {
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [
        {
          id: "rd",
          kind: "rd",
          label: "R&D",
          ice: [iceId],
          root: [],
        },
      ],
    },
    cardInstances: {
      [breakerId]: instance(
        breakerId,
        options.breakerDefinitionId ?? "simple_killer",
      ),
      [iceId]: instance(iceId, "test_sentry_ice", {
        owner: "corp",
        controller: "corp",
        zone: { side: "corp", zone: "serverIce", serverId: "rd" },
      }),
    },
    run: {
      runId: "run_1",
      attackedServerId: "rd",
      phase: options.runPhase ?? "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      encounteredIceId,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
    },
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function hostFor(
  state: GameState,
  definitions: Record<string, CardDefinition>,
): RunnerEncounterActionHost {
  return {
    state,
    cards: {
      definitionFor: (cardId) =>
        definitions[state.cardInstances[cardId]!.definitionId]!,
      cardInstanceFor: (cardId) => state.cardInstances[cardId]!,
      cardCounter: () => 0,
      effectiveSubtypesForCard: (_cardId, definition) =>
        definition?.subtypes ?? [],
      hostedProgramStrengthModifier: () => 0,
      publicServerLabel: () => "R&D",
    },
    run: {
      currentRun: () => state.run!,
      currentEncounterSubroutines: (definition) => definition.subroutines ?? [],
      runnerDuringRunCardImplementationLegalActions: () => [],
      runRemainderStrengthBonusForBreaker: () => 0,
      canUseBreakerOnCurrentFort: () => true,
    },
    ice: {
      strengthForIce: (iceId) =>
        definitions[state.cardInstances[iceId]!.definitionId]!.strength ?? 0,
    },
    breaker: {
      dupreStrengthCounterBonus: () => 0,
    },
    payment: {
      availableRunnerRunCredits: () => state.runner.credits,
      runJackOutAdditionalCost: (run) =>
        Math.max(0, Math.floor(run.jackOutAdditionalCostForRun ?? 0)),
    },
    actions: {
      buildLegalAction: (type, label, source, costs, payload, metadata) =>
        buildLegalAction(
          state,
          "runner",
          type,
          label,
          source,
          costs,
          payload,
          metadata,
        ),
      abilityMetadata: (sourceCardInstanceId, abilityId, encounteredIceId) => ({
        abilityRef: { sourceCardInstanceId, abilityId },
        effectRef: `effect.${abilityId}`,
        targetRequirements: [
          { id: "encounteredIce", kind: "card", visibility: "public" },
          {
            id: "subroutine",
            kind: "subroutine",
            ...(encounteredIceId ? { sourceIceRef: encounteredIceId } : {}),
          },
        ],
      }),
    },
    costs: {
      breakSubroutineCostBreakdown: (baseCost) => ({
        baseCost,
        legacyRunAdditionalCost: 0,
        runnerHardwareAdditionalCost: 0,
        cardImplementationAdditionalCost: 0,
        additionalCost: 0,
        totalCost: baseCost,
        publicPayload: { breakSubroutineBaseCost: baseCost },
      }),
    },
    callbacks: {
      postPassSpecialWindowActions: () => [],
    },
  };
}

function definitionsFor(
  state: GameState,
  ice: CardDefinition,
): Record<string, CardDefinition> {
  const breakerDefinition =
    DEMO_CARDS_BY_ID[state.cardInstances.breaker_1!.definitionId]!;
  return {
    [breakerDefinition.id]: breakerDefinition,
    [ice.id]: ice,
  };
}

describe("runner encounter action generation", () => {
  it("returns no encounter actions without an active encountered ICE", () => {
    const state = makeState({ encounteredIceId: undefined });
    const ice = iceDefinition();

    const result = buildRunnerEncounterActions(
      hostFor(state, definitionsFor(state, ice)),
    );

    expect(result.legalActions).toEqual([]);
  });

  it("keeps pump, break and continue action order and payloads stable", () => {
    const state = makeState();
    const ice = iceDefinition();
    const before = structuredClone(state);

    const result = buildRunnerEncounterActions(
      hostFor(state, definitionsFor(state, ice)),
    );

    expect(result.legalActions.map((action) => action.type)).toEqual([
      "pump_breaker",
      "break_subroutine",
      "continue_run",
    ]);
    const pump = result.legalActions[0]!;
    expect(pump.actionId).toBe("runner.pump_breaker.breaker_1.breaker_1.ice_1");
    expect(pump.payload).toMatchObject({
      breakerId: "breaker_1",
      iceId: "ice_1",
    });
    const breaker = result.legalActions[1]!;
    expect(breaker.actionId).toBe(
      "runner.break_subroutine.breaker_1.breaker_1.ice_1.0.test_sentry_etr",
    );
    expect(breaker.costs).toEqual([{ credits: 1 }]);
    expect(breaker.payload).toMatchObject({
      breakerId: "breaker_1",
      iceId: "ice_1",
      subroutineIndex: 0,
      subroutineId: "test_sentry_etr",
      targetIceDefinitionId: "test_sentry_ice",
      targetIceTitle: "Test Sentry",
      breakSubroutineBaseCost: 1,
    });
    expect(result.legalActions[2]!.payload).toMatchObject({
      encounterContinue: true,
      sourceDefinitionId: "test_sentry_ice",
      unbrokenSubroutineCount: 1,
      encounterWillEndRun: true,
      encounterSubroutineIds: "test_sentry_etr",
    });
    expect(state).toEqual(before);
  });

  it("does not offer break or pump actions for an ineligible breaker", () => {
    const state = makeState({ breakerDefinitionId: "simple_decoder" });
    const ice = iceDefinition();

    const result = buildRunnerEncounterActions(
      hostFor(state, definitionsFor(state, ice)),
    );

    expect(result.legalActions.map((action) => action.type)).toEqual([
      "continue_run",
    ]);
  });

  it("uses the matching multi-break ability when a breaker also has a single-break ability", () => {
    const state = makeState({
      breakerDefinitionId: "test_dual_breaker",
      runnerCredits: 20,
    });
    const breakerDefinition = {
      id: "test_dual_breaker",
      title: "Dual Breaker",
      side: "runner",
      type: "program",
      subtypes: ["icebreaker"],
      strength: 10,
      abilities: [
        {
          id: "test_dual_breaker_single",
          type: "break_subroutine",
          cost: { credits: 9 },
          iceSubtype: "sentry",
          count: 1,
          timingPoint: "run.encounter_ice",
        },
        {
          id: "test_dual_breaker_multi",
          type: "break_subroutine",
          cost: { credits: 2 },
          iceSubtype: "sentry",
          count: 3,
          timingPoint: "run.encounter_ice",
        },
      ],
    } as CardDefinition;
    const ice = iceDefinition({
      subroutines: [
        { id: "test_sentry_etr_1", type: "end_the_run" },
        { id: "test_sentry_etr_2", type: "end_the_run" },
      ],
    });

    const result = buildRunnerEncounterActions(
      hostFor(state, {
        [breakerDefinition.id]: breakerDefinition,
        [ice.id]: ice,
      }),
    );

    const multiBreak = result.legalActions.find(
      (action) =>
        action.type === "break_subroutine" &&
        action.payload?.subroutineIndexes === "0,1",
    );
    expect(multiBreak).toMatchObject({
      costs: [{ credits: 2 }],
      payload: {
        breakSubroutineBaseCost: 2,
        breakSubroutineCount: 2,
        multiBreakSubroutines: true,
      },
      abilityRef: {
        sourceCardInstanceId: "breaker_1",
        abilityId: "test_dual_breaker_multi",
      },
    });
  });

  it("builds Proteus PRO004 simple icebreaker pump and break LegalActions from real Proteus definitions", () => {
    const cases = [
      {
        definitionId: "onr_proteus_079_big-frackin-gun",
        title: "Big Frackin' Gun",
        iceSubtype: "sentry",
        offSubtype: "wall",
        subroutineCount: 5,
        breakCost: 6,
        breakIndexes: "0,1,2,3,4",
        pumpCost: 1,
        pumpAmount: 1,
      },
      {
        definitionId: "onr_proteus_081_boring-bit",
        title: "Boring Bit",
        iceSubtype: "wall",
        offSubtype: "sentry",
        subroutineCount: 1,
        breakCost: 2,
        pumpCost: 1,
        pumpAmount: 1,
      },
      {
        definitionId: "onr_proteus_083_corrosion",
        title: "Corrosion",
        iceSubtype: "wall",
        offSubtype: "sentry",
        subroutineCount: 1,
        breakCost: 0,
        pumpCost: 1,
        pumpAmount: 1,
      },
      {
        definitionId: "onr_proteus_093_redecorator",
        title: "Redecorator",
        iceSubtype: "sentry",
        offSubtype: "wall",
        subroutineCount: 2,
        breakCost: 1,
        breakIndexes: "0,1",
        pumpCost: 3,
        pumpAmount: 1,
      },
      {
        definitionId: "onr_proteus_095_skeleton-passkeys",
        title: "Skeleton Passkeys",
        iceSubtype: "code_gate",
        offSubtype: "wall",
        subroutineCount: 1,
        breakCost: 0,
        pumpCost: 3,
        pumpAmount: 4,
      },
      {
        definitionId: "onr_proteus_100_wrecking-ball",
        title: "Wrecking Ball",
        iceSubtype: "wall",
        offSubtype: "sentry",
        subroutineCount: 1,
        breakCost: 0,
        pumpCost: 2,
        pumpAmount: 1,
      },
    ] as const;

    for (const testCase of cases) {
      const state = makeState({
        breakerDefinitionId: testCase.definitionId,
        runnerCredits: 20,
      });
      const breakerDefinition = proteusTestCardDefinition(testCase.definitionId);
      const matchingIce = iceDefinition({
        id: "test_sentry_ice",
        title: `Test ${testCase.iceSubtype}`,
        subtypes: [testCase.iceSubtype],
        strength: 0,
        subroutines: Array.from(
          { length: testCase.subroutineCount },
          (_unused, index) => ({
            id: `test_${testCase.iceSubtype}_${index}`,
            type: "end_the_run" as const,
          }),
        ),
      });

      const result = buildRunnerEncounterActions(
        hostFor(state, {
          [breakerDefinition.id]: breakerDefinition,
          [matchingIce.id]: matchingIce,
        }),
      );

      expect(
        result.legalActions.find((action) => action.type === "pump_breaker"),
        testCase.definitionId,
      ).toMatchObject({
        costs: [{ credits: testCase.pumpCost }],
        payload: { breakerId: "breaker_1", iceId: "ice_1" },
      });
      expect(
        result.legalActions.find((action) => action.type === "pump_breaker"),
        testCase.definitionId,
      ).toMatchObject({
        label: `${testCase.title}: Stärke +${testCase.pumpAmount}`,
      });

      const breakIndexes =
        "breakIndexes" in testCase ? testCase.breakIndexes : undefined;
      const breakAction = breakIndexes
        ? result.legalActions.find(
            (action) =>
              action.type === "break_subroutine" &&
              action.payload?.subroutineIndexes === breakIndexes,
          )
        : result.legalActions.find(
            (action) =>
              action.type === "break_subroutine" &&
              action.payload?.subroutineIndex === 0,
          );
      expect(breakAction, testCase.definitionId).toMatchObject({
        costs: [{ credits: testCase.breakCost }],
        payload: {
          breakerId: "breaker_1",
          iceId: "ice_1",
          breakSubroutineBaseCost: testCase.breakCost,
          ...(breakIndexes ? { multiBreakSubroutines: true } : {}),
        },
      });
      expect(breakAction?.label, testCase.definitionId).toContain(
        testCase.title,
      );
      expect(breakAction?.label, testCase.definitionId).not.toContain(
        "Pile Driver",
      );

      const offTypeState = makeState({
        breakerDefinitionId: testCase.definitionId,
        runnerCredits: 20,
      });
      const offTypeIce = iceDefinition({
        id: "test_sentry_ice",
        title: `Test ${testCase.offSubtype}`,
        subtypes: [testCase.offSubtype],
        strength: 0,
      });
      const offTypeResult = buildRunnerEncounterActions(
        hostFor(offTypeState, {
          [breakerDefinition.id]: breakerDefinition,
          [offTypeIce.id]: offTypeIce,
        }),
      );
      expect(
        offTypeResult.legalActions.some(
          (action) => action.type === "break_subroutine",
        ),
        testCase.definitionId,
      ).toBe(false);
    }
  });

  it("offers paid and unpaid continue actions for pay-or-end-run subroutines", () => {
    const state = makeState({
      breakerDefinitionId: "simple_decoder",
      ice: iceDefinition({
        subroutines: [
          {
            id: "test_pay_or_end",
            type: "end_the_run_unless_runner_pays",
            amount: 2,
          },
        ],
      }),
    });
    const ice = iceDefinition({
      subroutines: [
        {
          id: "test_pay_or_end",
          type: "end_the_run_unless_runner_pays",
          amount: 2,
        },
      ],
    });

    const result = buildRunnerEncounterActions(
      hostFor(state, definitionsFor(state, ice)),
    );

    expect(result.legalActions.map((action) => action.type)).toEqual([
      "continue_run",
      "continue_run",
    ]);
    expect(result.legalActions[0]!.label).toBe(
      "Subroutinen auslösen (Runner zahlt 2 Credit)",
    );
    expect(result.legalActions[0]!.costs).toEqual([{ credits: 2 }]);
    expect(result.legalActions[0]!.payload).toMatchObject({
      encounterContinue: true,
      encounterWillEndRun: false,
      payOrEndRunSubroutineIndexes: "0",
      payOrEndRunSubroutinePayment: 2,
    });
    expect(result.legalActions[1]!.payload).toMatchObject({
      encounterContinue: true,
      encounterWillEndRun: true,
    });
  });

  it("keeps movement jack-out and continue actions stable", () => {
    const state = makeState({
      timingPoint: "run.jack_out_window",
      runPhase: "movement",
    });
    const { encounteredIceId: _encounteredIceId, ...movementRun } = state.run!;
    void _encounteredIceId;
    state.run = {
      ...movementRun,
      jackOutAdditionalCostForRun: 2,
      activeIceProgramTrashSourceIceId: "ice_1" as CardInstanceId,
    };
    const ice = iceDefinition();

    const result = buildRunnerMovementActions(
      hostFor(state, definitionsFor(state, ice)),
    );

    expect(result.legalActions.map((action) => action.type)).toEqual([
      "jack_out",
      "continue_run",
    ]);
    expect(result.legalActions[0]!.actionId).toBe("runner.jack_out");
    expect(result.legalActions[0]!.costs).toEqual([{ credits: 2 }]);
    expect(result.legalActions[0]!.payload).toMatchObject({
      v1922CorpIceAbility: "jack_out_tax_after_passed_rezzed_ice",
      jackOutAdditionalCost: 2,
      sourceDefinitionId: "test_sentry_ice",
    });
    expect(result.legalActions[1]!.actionId).toBe("runner.continue_run");
  });
});
