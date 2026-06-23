import {
  DEMO_CARDS_BY_ID,
  type CardInstance,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type SubroutineDefinition,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  consumeForcedJackOutAfterEncounter,
  encounterResolutionHost,
  handlePostPassProgramTrashChoices,
  passedIceFollowupMarkersForCurrentIce,
  preparePayOrEndRunSubroutinePayment,
  resolveFatalAttractorPostEncounter,
  resolveRunDurationMarkerSubroutine,
  startActiveIceProgramTrashChoice,
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
        programs: ["program_1" as CardInstanceId],
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
    const definition = DEMO_CARDS_BY_ID["onr_v1_222_ball-and-chain"]!;
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
      setRunMarkers: ["encounterTaxForFutureIce"],
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
    const definition = DEMO_CARDS_BY_ID["onr_v1_276_viral-15"]!;
    const viralSubroutine = {
      id: "viral15",
      type: "set_run_active_ice_program_trash",
    } as SubroutineDefinition;
    const passTrashSubroutine = {
      id: "viral15_pass",
      type: "set_run_pass_rezzed_ice_program_trash",
    } as SubroutineDefinition;

    resolveRunDurationMarkerSubroutine(encounterResolutionHost(state), {
      definition,
      subroutine: viralSubroutine,
      legalAction,
    });
    resolveRunDurationMarkerSubroutine(encounterResolutionHost(state), {
      definition,
      subroutine: passTrashSubroutine,
      legalAction,
    });

    expect(state.run?.activeIceProgramTrashSourceIceId).toBe("ice_1");
    expect(state.run?.passRezzedIceProgramTrashSourceIceId).toBe("ice_1");
    expect(legalAction.payload).toMatchObject({
      v1922CorpIceAbility: "active_ice_program_trash_run_modifier",
      jackOutAdditionalCost: 1,
      passIceTrashProgramPrompt: true,
      sourceDefinitionId: "onr_v1_276_viral-15",
    });
    expect(state.pendingChoice).toBeUndefined();

    const markers = passedIceFollowupMarkersForCurrentIce(
      encounterResolutionHost(state),
    );
    expect(markers).toMatchObject({
      activeIceProgramTrashPendingPassedIceId: "ice_1",
      passRezzedIceProgramTrashPendingPassedIceId: "ice_1",
    });
  });

  it("opens the stable Viral-15 post-pass program-trash choice only in the pass window", () => {
    const state = makeState();
    state.run!.activeIceProgramTrashSourceIceId = "ice_1" as CardInstanceId;
    state.run!.activeIceProgramTrashPendingPassedIceId = "ice_1" as CardInstanceId;
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
      choiceId: "active_ice_program_trash_10",
      source: "card_implementation.active_ice_program_trash:ice_1:ice_1:10",
      kind: "select_cards",
      visibility: "hidden_info_barrier",
    });
    expect(legalAction.payload).toMatchObject({
      v1922CorpIceAbility: "active_ice_program_trash",
      hiddenZoneAction: "active_ice_program_trash_choice",
      activeIceProgramTrashChoiceOpened: true,
    });
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
      forcedJackOutAfterEncounter: true,
      runShouldEnd: true,
    });
    expect(legalAction.payload).toMatchObject({
      forcedJackOutAfterEncounter: true,
      forceJackOutAfterEncounterSourceDefinitionId: "onr_v1_276_viral-15",
    });
  });

  it("dispatches Fatal-Attractor next-encounter damage only when ICE is not fully broken", () => {
    const state = makeState();
    state.run!.fatalDamageActiveForEncounter = true;
    state.run!.fatalDamageAmountForEncounter = 3;
    const subroutines = [
      { id: "etr", type: "end_the_run" },
    ] as SubroutineDefinition[];
    const dealt: unknown[] = [];
    let damagePayload: DamageSummary | undefined;

    const result = resolveFatalAttractorPostEncounter(encounterResolutionHost(state), {
      subroutines,
      damageSummaries: [],
      dealDamage: (input) => {
        dealt.push(input);
        return {
          damageType: "net",
          amount: input.amount,
          cardsTrashed: 1,
          flatline: false,
          runnerGripBefore: 5,
          runnerGripAfter: 2,
        };
      },
      setDamagePayload: (summary) => {
        damagePayload = summary;
      },
    });

    expect(result).toMatchObject({ handled: true, stateChanged: true });
    expect(dealt).toEqual([
      {
        damageId: "run_1.ice_1.fatal_attractor",
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
    fullyBroken.run!.brokenSubroutineIndexes = [0];
    const fullyBrokenDealt: unknown[] = [];
    resolveFatalAttractorPostEncounter(encounterResolutionHost(fullyBroken), {
      subroutines,
      damageSummaries: [],
      dealDamage: (input) => {
        fullyBrokenDealt.push(input);
        return {
          damageType: "net",
          amount: input.amount,
          cardsTrashed: 1,
          flatline: false,
        };
      },
      setDamagePayload: () => undefined,
    });
    expect(fullyBrokenDealt).toEqual([]);
    expect(fullyBroken.run?.fullyBrokenIceIds).toEqual(["ice_1"]);
  });

  it("can start the Viral-15 choice directly with stable source and payload", () => {
    const state = makeState();
    state.run!.activeIceProgramTrashSourceIceId = "ice_1" as CardInstanceId;
    const legalAction = { payload: {} } as LegalAction;

    const result = startActiveIceProgramTrashChoice(
      encounterResolutionHost(state),
      "ice_1" as CardInstanceId,
      legalAction,
    );

    expect(result.choiceOpened).toBe(true);
    expect(state.pendingChoice?.source).toBe(
      "card_implementation.active_ice_program_trash:ice_1:ice_1:10",
    );
    expect(legalAction.payload).toMatchObject({
      sourceDefinitionId: "onr_v1_276_viral-15",
      hiddenZoneAction: "active_ice_program_trash_choice",
    });
  });
});
