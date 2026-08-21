import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import {
  type CardInstance,
  type CardInstanceId,
  type GameState,
  type ImminentEvent,
  type LegalAction,
  type PlayerAction,
  type SubroutineDefinition,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  consumeForcedJackOutAfterEncounter,
  encounterResolutionHost,
  handlePostPassProgramTrashChoices,
  passedIceFollowupMarkersForCurrentIce,
  preparePayOrEndRunSubroutinePayment,
  resolvePostEncounterNetDamage,
  resolvePassRezzedIceProgramTrashChoice,
  resolveRunDurationMarkerSubroutine,
  startPassRezzedIceProgramTrashChoice,
  type DamageSummary,
} from "./encounter-resolution";
import {
  payEncounterTaxForFutureIce,
  runDurationPaymentHost,
} from "./run-duration-payment";

function instance(
  id: string,
  definitionId: string,
  zone: CardInstance["zone"],
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId,
    owner: zone.side,
    controller: zone.side,
    zone,
    faceup: options.faceup ?? true,
    rezzed: options.rezzed ?? true,
    counters: options.counters,
    ...options,
  } as CardInstance;
}

function makeState(): GameState {
  return {
    stateVersion: 9,
    activeSide: "runner",
    phase: "run",
    timingPoint: "run.encounter_ice",
    runner: {
      credits: 6,
      tags: 0,
      identity: "runner_identity",
      rig: {
        programs: ["program_1", "program_2"] as CardInstanceId[],
        hardware: [],
        resources: [],
      },
      scoreArea: [],
    },
    corp: {
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      servers: [
        {
          id: "rd",
          kind: "rd",
          ice: ["ice_1" as CardInstanceId],
          root: [],
        },
        { id: "hq", kind: "hq", ice: [], root: [] },
        { id: "archives", kind: "archives", ice: [], root: [] },
      ],
    },
    cardInstances: {
      ice_1: instance("ice_1", "onr_v1_276_viral-15", {
        side: "corp",
        zone: "serverIce",
        serverId: "rd",
      }),
      program_1: instance("program_1", "simple_decoder", {
        side: "runner",
        zone: "rig",
      }),
      program_2: instance("program_2", "simple_fracter", {
        side: "runner",
        zone: "rig",
      }),
    },
    run: {
      runId: "run_1",
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      encounteredIceId: "ice_1" as CardInstanceId,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
    },
  } as unknown as GameState;
}

describe("encounter resolution boundary", () => {
  it("sets Ball-and-Chain encounter tax markers and leaves payment to run-duration payment", () => {
    const state = makeState();
    const legalAction = { payload: {} } as LegalAction;
    const definition = CARD_DEFINITIONS_BY_ID["onr_v1_222_ball-and-chain"]!;
    const subroutine = {
      id: "ball_tax",
      type: "set_run_encounter_tax",
      amount: 2,
    } as SubroutineDefinition;

    const result = resolveRunDurationMarkerSubroutine(
      encounterResolutionHost(state),
      { definition, subroutine, legalAction },
    );

    expect(result).toMatchObject({
      handled: true,
      encounterTaxAmount: 2,
      setRunMarkers: [
        "encounterTaxForFutureIce",
        "encounterTaxSourceDefinitionId",
      ],
    });
    expect(state.run?.encounterTaxForFutureIce).toBe(2);
    expect(legalAction.payload).toEqual({});

    const paymentAction = { payload: {} } as LegalAction;
    payEncounterTaxForFutureIce(runDurationPaymentHost(state), paymentAction);
    expect(paymentAction.payload).toMatchObject({
      encounterTaxForFutureIce: 2,
      encounterTaxPaid: 2,
      encounterTaxSource: "onr_v1_222_ball-and-chain",
    });
  });

  it("sets Viral-15 jack-out and pass-ice program-trash markers without opening the choice early", () => {
    const state = makeState();
    const legalAction = { payload: {} } as LegalAction;
    const definition = CARD_DEFINITIONS_BY_ID["onr_v1_276_viral-15"]!;
    const [jackOutSubroutine, passTrashSubroutine] = definition.subroutines!;

    resolveRunDurationMarkerSubroutine(encounterResolutionHost(state), {
      definition,
      subroutine: jackOutSubroutine!,
      legalAction,
    });
    resolveRunDurationMarkerSubroutine(encounterResolutionHost(state), {
      definition,
      subroutine: passTrashSubroutine!,
      legalAction,
    });

    expect(state.run?.activeIceProgramTrashSourceIceId).toBeUndefined();
    expect(state.run?.passRezzedIceProgramTrashModifiers).toEqual([
      expect.objectContaining({
        sourceCardInstanceId: "ice_1",
        sourceDefinitionId: "onr_v1_276_viral-15",
      }),
    ]);
    expect(legalAction.payload).toMatchObject({
      jackOutAdditionalCost: 1,
      passIceTrashProgramPrompt: true,
      sourceDefinitionId: "onr_v1_276_viral-15",
    });
    expect(state.pendingChoice).toBeUndefined();

    const markers = passedIceFollowupMarkersForCurrentIce(
      encounterResolutionHost(state),
    );
    expect(markers).toMatchObject({
      passRezzedIceProgramTrashPending: {
        passedIceId: "ice_1",
        remainingModifierIds: [expect.any(String)],
      },
    });
  });

  it("appends repeated Tutor and Viral-15 run-duration effects as distinct modifier instances", () => {
    const state = makeState();
    const tutor = CARD_DEFINITIONS_BY_ID["onr_v1_274_tutor"]!;
    const viral = CARD_DEFINITIONS_BY_ID["onr_v1_276_viral-15"]!;
    const host = encounterResolutionHost(state);

    for (let index = 0; index < 2; index += 1) {
      resolveRunDurationMarkerSubroutine(host, {
        definition: tutor,
        subroutine: tutor.subroutines![0]!,
      });
      resolveRunDurationMarkerSubroutine(host, {
        definition: viral,
        subroutine: viral.subroutines![1]!,
      });
    }

    expect(state.run?.runDurationAdditionalSubroutineModifiers).toHaveLength(
      2,
    );
    expect(state.run?.passRezzedIceProgramTrashModifiers).toHaveLength(2);
    expect(
      new Set(
        state.run?.runDurationAdditionalSubroutineModifiers?.map(
          (modifier) => modifier.modifierId,
        ),
      ).size,
    ).toBe(2);
    expect(
      new Set(
        state.run?.passRezzedIceProgramTrashModifiers?.map(
          (modifier) => modifier.modifierId,
        ),
      ).size,
    ).toBe(2);
  });

  it("opens the stable Viral-15 post-pass program-trash choice only in the pass window", () => {
    const state = makeState();
    state.run!.passRezzedIceProgramTrashModifiers = [
      {
        modifierId: "viral_modifier_1",
        sourceCardInstanceId: "ice_1" as CardInstanceId,
        sourceDefinitionId: "onr_v1_276_viral-15" as never,
      },
    ];
    state.run!.passRezzedIceProgramTrashPending = {
      passedIceId: "ice_1" as CardInstanceId,
      remainingModifierIds: ["viral_modifier_1"],
    };
    const legalAction = { payload: {} } as LegalAction;

    const result = handlePostPassProgramTrashChoices(
      encounterResolutionHost(state),
      legalAction,
    );

    expect(result).toMatchObject({
      handled: true,
      choiceOpened: true,
      sourceDefinitionId: "onr_v1_276_viral-15",
    });
    expect(state.pendingChoice).toMatchObject({
      choiceId: "p3_56_pass_ice_program_trash_10",
      source: "p3_56.pass_ice_program_trash:ice_1:ice_1:10",
      kind: "select_cards",
      visibility: "hidden_info_barrier",
    });
    expect(legalAction.payload).toMatchObject({
      passIceTrashProgramPrompt: true,
      hiddenZoneBarrier: true,
    });
  });

  it("resolves one separate Runner program-trash choice per active Viral-15 modifier", () => {
    const state = makeState();
    state.cardInstances.ice_2 = instance("ice_2", "onr_v1_276_viral-15", {
      side: "corp",
      zone: "serverIce",
      serverId: "rd",
    });
    state.run!.passRezzedIceProgramTrashModifiers = [
      {
        modifierId: "viral_modifier_1",
        sourceCardInstanceId: "ice_1" as CardInstanceId,
        sourceDefinitionId: "onr_v1_276_viral-15" as never,
      },
      {
        modifierId: "viral_modifier_2",
        sourceCardInstanceId: "ice_2" as CardInstanceId,
        sourceDefinitionId: "onr_v1_276_viral-15" as never,
      },
    ];
    state.run!.passRezzedIceProgramTrashPending = {
      passedIceId: "ice_1" as CardInstanceId,
      remainingModifierIds: ["viral_modifier_1", "viral_modifier_2"],
    };
    const trashed: CardInstanceId[] = [];
    const host = encounterResolutionHost(state, {
      trashRunnerInstalledProgram: (cardId) => {
        trashed.push(cardId);
        state.runner.rig.programs = state.runner.rig.programs.filter(
          (candidate) => candidate !== cardId,
        );
      },
    });

    const first = handlePostPassProgramTrashChoices(host);
    expect(first.choiceOpened).toBe(true);
    expect(state.pendingChoice?.sourceCardInstanceId).toBe("ice_1");

    const firstResolution = resolvePassRezzedIceProgramTrashChoice(
      host,
      { payload: {} } as LegalAction,
      {
        selectedChoices: { selectedOptionIds: ["card_program_1"] },
      } as unknown as PlayerAction,
    );
    expect(firstResolution.choiceOpened).toBe(true);
    expect(trashed).toEqual(["program_1"]);
    expect(state.pendingChoice?.sourceCardInstanceId).toBe("ice_2");

    const secondResolution = resolvePassRezzedIceProgramTrashChoice(
      host,
      { payload: {} } as LegalAction,
      {
        selectedChoices: { selectedOptionIds: ["card_program_2"] },
      } as unknown as PlayerAction,
    );
    expect(secondResolution.choiceOpened).toBeUndefined();
    expect(trashed).toEqual(["program_1", "program_2"]);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.run?.passRezzedIceProgramTrashPending).toBeUndefined();
  });

  it("validates and pays Tesseract-style pay-or-end subroutine cost through run payment", () => {
    const state = makeState();
    const subroutines = [
      {
        id: "tesseract_pay",
        type: "end_the_run_unless_runner_pays",
        amount: 1,
      },
    ] as SubroutineDefinition[];
    const legalAction = {
      costs: [{ credits: 1 }],
      payload: {
        encounterSubroutineIds: "tesseract_pay",
        payOrEndRunSubroutineIndexes: "0",
        payOrEndRunSubroutinePayment: 1,
      },
    } as unknown as LegalAction;

    const result = preparePayOrEndRunSubroutinePayment(
      encounterResolutionHost(state),
      subroutines,
      legalAction,
    );

    expect(result.paidPayOrEndRunIndexes?.has(0)).toBe(true);
    expect(result.payOrEndRunIndexesForThisContinue?.has(0)).toBe(true);
    expect(state.runner.credits).toBe(5);
  });

  it("consumes Submarine-style forced jack-out after the current encounter", () => {
    const state = makeState();
    state.run!.forceJackOutAfterEncounterSourceId = "ice_1" as CardInstanceId;
    const legalAction = { payload: {} } as LegalAction;

    const result = consumeForcedJackOutAfterEncounter(
      encounterResolutionHost(state),
      legalAction,
    );

    expect(result).toMatchObject({
      handled: true,
      forcedRunEndAfterEncounter: true,
      runShouldEnd: true,
    });
    expect(legalAction.payload).toMatchObject({
      forcedRunEndAfterEncounter: true,
      forceRunEndAfterEncounterSourceDefinitionId: "onr_v1_276_viral-15",
    });
  });

  it("dispatches Fatal-Attractor next-encounter damage only when ICE is not fully broken", () => {
    const state = makeState();
    state.run!.fatalDamageActiveForEncounter = true;
    state.run!.fatalDamageAmountForEncounter = 3;
    state.run!.fatalDamageSourceDefinitionId = "onr_v1_242_fatal-attractor";
    const subroutines = [
      { id: "etr", type: "end_the_run" },
    ] as SubroutineDefinition[];
    const dealt: unknown[] = [];
    let damagePayload: DamageSummary | undefined;

    const result = resolvePostEncounterNetDamage(
      encounterResolutionHost(state),
      {
        subroutines,
        damageSummaries: [],
        createDamageImminentEvent: (input) => {
          dealt.push(input);
          return { payload: input } as unknown as ImminentEvent;
        },
        openDamageResolutionWindow: () => false,
        resolveDamageImminentEvent: (event) => {
          const amount = Number(event.payload.amount);
          return {
            damageType: "net",
            amount,
            cardsTrashed: 1,
            flatline: false,
            runnerGripBefore: 5,
            runnerGripAfter: 2,
          };
        },
        setDamagePayload: (summary) => {
          damagePayload = summary;
        },
      },
    );

    expect(result).toMatchObject({ handled: true, stateChanged: true });
    expect(dealt).toEqual([
      {
        damageId: "run_1.ice_1.post_encounter_net_damage",
        damageType: "net",
        amount: 3,
        source: "subroutine:onr_v1_242_fatal-attractor:next_encounter",
      },
    ]);
    expect(damagePayload).toMatchObject({
      runnerGripBefore: 5,
      runnerGripAfter: 2,
    });

    const fullyBroken = makeState();
    fullyBroken.run!.fatalDamageActiveForEncounter = true;
    fullyBroken.run!.fatalDamageAmountForEncounter = 3;
    fullyBroken.run!.fatalDamageSourceDefinitionId =
      "onr_v1_242_fatal-attractor";
    fullyBroken.run!.brokenSubroutineIndexes = [0];
    const fullyBrokenDealt: unknown[] = [];
    resolvePostEncounterNetDamage(encounterResolutionHost(fullyBroken), {
      subroutines,
      damageSummaries: [],
      createDamageImminentEvent: (input) => {
        fullyBrokenDealt.push(input);
        return { payload: input } as unknown as ImminentEvent;
      },
      openDamageResolutionWindow: () => false,
      resolveDamageImminentEvent: (event) => {
        return {
          damageType: "net",
          amount: Number(event.payload.amount),
          cardsTrashed: 1,
          flatline: false,
        };
      },
      setDamagePayload: () => undefined,
    });
    expect(fullyBrokenDealt).toEqual([]);
    expect(fullyBroken.run?.fullyBrokenIceIds).toEqual(["ice_1"]);
  });

  it("opens normal prevention for Fatal-Attractor damage and consumes the delayed marker", () => {
    const state = makeState();
    state.run!.fatalDamageActiveForEncounter = true;
    state.run!.fatalDamageAmountForEncounter = 3;
    state.run!.fatalDamageSourceDefinitionId = "onr_v1_242_fatal-attractor";
    const legalAction = { payload: {} } as LegalAction;
    const event = { payload: { amount: 3 } } as unknown as ImminentEvent;

    const result = resolvePostEncounterNetDamage(
      encounterResolutionHost(state),
      {
        subroutines: [{ id: "etr", type: "end_the_run" }],
        damageSummaries: [],
        legalAction,
        createDamageImminentEvent: () => event,
        openDamageResolutionWindow: (openedEvent, action) => {
          expect(openedEvent).toBe(event);
          expect(action).toBe(legalAction);
          return true;
        },
        resolveDamageImminentEvent: () => {
          throw new Error("suspended damage must not resolve immediately");
        },
        setDamagePayload: () => undefined,
      },
    );

    expect(result).toMatchObject({
      handled: true,
      suspended: true,
      stateChanged: true,
    });
    expect(state.run?.fatalDamageActiveForEncounter).toBe(false);
    expect(state.run?.fatalDamageAmountForEncounter).toBeUndefined();
  });

  it("can start the Viral-15 pass choice directly with stable source and payload", () => {
    const state = makeState();
    const legalAction = { payload: {} } as LegalAction;

    const result = startPassRezzedIceProgramTrashChoice(
      encounterResolutionHost(state),
      "ice_1" as CardInstanceId,
      "ice_1" as CardInstanceId,
      legalAction,
    );

    expect(result.choiceOpened).toBe(true);
    expect(state.pendingChoice?.source).toBe(
      "p3_56.pass_ice_program_trash:ice_1:ice_1:10",
    );
    expect(legalAction.payload).toMatchObject({
      sourceDefinitionId: "onr_v1_276_viral-15",
      hiddenZoneBarrier: true,
    });
  });
});
