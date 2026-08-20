import { describe, expect, it } from "vitest";
import {
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "../../index";
import {
  agendaPoints,
  apply,
  applyChoice,
  applyChoices,
  cardCounterAmount,
  installRunnerProgramForTest,
  putCorpCardOnTopOfRd,
  putCorpRootInRemote,
  removeEverywhere,
  toRunnerTurnFromCorpMain,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import type {
  CardDefinitionId,
  DeckDefinition,
  GameState,
} from "@netgrid/shared";

const DATA_FORT_REMAPPING = "onr_classic_001_data-fort-remapping";
const SUPERSERUM = "onr_classic_002_superserum";
const UNLISTED_RESEARCH_LAB = "onr_classic_003_unlisted-research-lab";
const THEOREM_PROOF = "onr_classic_004_theorem-proof";

const CLASSIC_AGENDA_CORP_DECK: DeckDefinition = {
  id: "classic_agenda_smoke_corp",
  name: "Classic Agenda Smoke Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: DATA_FORT_REMAPPING, quantity: 1 },
    { id: SUPERSERUM, quantity: 1 },
    { id: UNLISTED_RESEARCH_LAB, quantity: 1 },
    { id: THEOREM_PROOF, quantity: 1 },
    { id: "simple_agenda", quantity: 8 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
  ],
};

function classicAgendaGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    corpDeck: CLASSIC_AGENDA_CORP_DECK,
    agendaPointsToWin: 99,
  });
}

function corpMainClassicAgendaGame(seed: string): GameState {
  const state = apply(
    classicAgendaGame(seed),
    "corp",
    (action) => action.type === "mandatory_draw",
  );
  state.corp.credits = 80;
  state.corp.clicks = 30;
  state.corp.maxHandSize = 100;
  return state;
}

function scoreClassicAgenda(
  state: GameState,
  definitionId: string,
  advancementRequirement: number,
): { state: GameState; agendaId: string } {
  const agendaId = putCorpRootInRemote(state, definitionId);
  state.cardInstances[agendaId] = {
    ...state.cardInstances[agendaId]!,
    advancementCounters: advancementRequirement,
  };
  return {
    agendaId,
    state: apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" && action.payload?.cardId === agendaId,
    ),
  };
}

describe("Classic Agenda Implementation Smokes", () => {
  it("scores Data Fort Remapping with a Remap counter that can end a run", () => {
    let state = corpMainClassicAgendaGame("classic-data-fort-remapping");
    const scored = scoreClassicAgenda(state, DATA_FORT_REMAPPING, 4);
    state = scored.state;

    expect(cardCounterAmount(state, scored.agendaId, "remap")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      cardDefinitionId: DATA_FORT_REMAPPING,
      addedCounterAmount: 1,
      counterType: "remap",
    });

    state = toRunnerTurnFromCorpMain(state);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const runAbility = getLegalActions(state, "corp").find(
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === scored.agendaId,
    );
    expect(runAbility).toBeDefined();
    if (!runAbility)
      throw new Error("Missing Data Fort Remapping run ability.");
    expect(runAbility.payload).toMatchObject({
      cardImplementationAbilityTiming: "corp_during_run",
      cardImplementationEffectKind: "end_run",
      cardImplementationSourceCounterType: "remap",
      cardImplementationSourceCounterCost: 1,
    });

    state = apply(
      state,
      "corp",
      (action) => action.actionId === runAbility.actionId,
    );

    expect(state.run).toBeUndefined();
    expect(cardCounterAmount(state, scored.agendaId, "remap")).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: DATA_FORT_REMAPPING,
      cardImplementationSourceCounterType: "remap",
      cardImplementationSourceCounterCost: 1,
      runEnded: true,
      runSuccessful: false,
    });
  });

  it("scores Superserum by purging runner virus counters and banking two prevention charges", () => {
    let state = corpMainClassicAgendaGame("classic-superserum");
    state.purgeableRunnerVirusCounters = {
      corp: { highlighter: 2, scaldan: 1 },
      servers: { rd: { socket_rd: 1 } },
    };
    const scored = scoreClassicAgenda(state, SUPERSERUM, 3);
    state = scored.state;

    expect(state.purgeableRunnerVirusCounters).toBeUndefined();
    expect(state.corpRunnerVirusCounterPreventionCharges).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      cardDefinitionId: SUPERSERUM,
      runnerVirusCountersPurged: 4,
      runnerVirusCounterPurgeSummary:
        "corp:highlighter=2;corp:scaldan=1;server:rd:socket_rd=1",
      runnerVirusCounterPreventionChargesAdded: 2,
      corpRunnerVirusCounterPreventionChargesAfter: 2,
    });
  });

  it("draws Unlisted Research Lab's additional start-turn card mandatorily", () => {
    let state = corpMainClassicAgendaGame("classic-unlisted-research-lab");
    state = scoreClassicAgenda(state, UNLISTED_RESEARCH_LAB, 3).state;
    const runnerTurn = apply(
      state,
      "corp",
      (action) => action.type === "end_turn",
    );
    const hqBeforeTurnStart = runnerTurn.corp.hq.length;
    const startTurnInitial = structuredClone(runnerTurn);
    const startTurnReplayStart = runnerTurn.eventLog.length;
    const nextTurnStart = apply(
      runnerTurn,
      "runner",
      (action) => action.type === "end_turn",
    );

    expect(nextTurnStart.pendingChoice).toBeUndefined();
    expect(nextTurnStart.corp.hq.length).toBe(hqBeforeTurnStart);
    expect(
      getLegalActions(nextTurnStart, "corp").map((action) => action.type),
    ).toEqual(["mandatory_draw"]);
    const afterMandatoryDraw = apply(
      nextTurnStart,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    expect(afterMandatoryDraw.corp.hq.length).toBe(hqBeforeTurnStart + 2);
    expect(afterMandatoryDraw.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "mandatory_draw",
      corpMandatoryCardCount: 1,
      corpMandatoryAgendaCardCount: 1,
      corpMandatoryTotalBaseDrawCount: 2,
      resolvedEffects: [
        expect.objectContaining({
          kind: "draw_cards",
          amount: 1,
          reason: "start_of_turn",
          sourceDefinitionId: UNLISTED_RESEARCH_LAB,
        }),
      ],
    });
    const startTurnReplay = replayEvents(
      startTurnInitial,
      afterMandatoryDraw.eventLog.slice(startTurnReplayStart),
    );
    expect(startTurnReplay.ok).toBe(true);
    expect(hashState(startTurnReplay.state)).toBe(
      hashState(afterMandatoryDraw),
    );
  });

  it("installs accessed Theorem Proof as a 2 MU program before the Runner scores it", () => {
    let state = classicAgendaGame("classic-theorem-proof");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = toRunnerTurnFromCorpMain(state);
    state.runner.credits = 20;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    const theoremId = putCorpCardOnTopOfRd(state, THEOREM_PROOF);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "steal_agenda" &&
        action.payload?.cardId === theoremId &&
        action.payload?.agendaAccessReplacement === "install_as_runner_program",
    );

    expect(state.runner.scoreArea).not.toContain(theoremId);
    expect(state.runner.rig.programs).toContain(theoremId);
    expect(state.runner.memoryUsed).toBe(2);
    expect(
      state.cardInstances[theoremId]?.installedAsRunnerProgram,
    ).toMatchObject({
      memoryCost: 2,
      scoreAsAgendaAction: true,
      removeFromGameOnLeavePlay: true,
    });

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === theoremId,
    );

    expect(state.runner.rig.programs).not.toContain(theoremId);
    expect(state.runner.scoreArea).toContain(theoremId);
    expect(state.runner.memoryUsed).toBe(0);
    expect(
      state.cardInstances[theoremId]?.installedAsRunnerProgram,
    ).toBeUndefined();
    expect(agendaPoints(state, "runner")).toBe(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: THEOREM_PROOF,
      scoredSourceAsAgenda: true,
      scoredAgendaPointValue: 3,
      runnerMemoryUsedAfter: 0,
    });
  });

  it("scores declined Theorem Proof from the same fort at the next Runner turn with replay-safe state", () => {
    let state = classicAgendaGame("classic-theorem-proof-declined-delayed-score");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = toRunnerTurnFromCorpMain(state);
    state.runner.credits = 20;
    state.runner.clicks = 4;
    const theoremId = putCorpRootInRemote(state, THEOREM_PROOF);
    const hiddenHqId = state.corp.hq[0];
    if (!hiddenHqId) throw new Error("HQ-Testkarte fehlt.");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "decline_trash" &&
        action.payload?.cardId === theoremId &&
        action.payload?.agendaAccessReplacement ===
          "declined_install_as_runner_program",
    );

    expect(state.runner.scoreArea).not.toContain(theoremId);
    expect(state.delayedAccessEffects).toEqual([
      expect.objectContaining({
        agendaId: theoremId,
        serverId: "remote_1",
        sourceDefinitionId: THEOREM_PROOF,
        resolveAt: "runner_start_turn",
      }),
    ]);
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(hiddenHqId);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    if (
      state.pendingChoice?.source === "discard_phase" &&
      state.pendingChoice.side === "corp"
    ) {
      state = applyChoice(
        state,
        "corp",
        String(state.pendingChoice.options[0]?.id),
      );
    }

    expect(state.runner.scoreArea).toContain(theoremId);
    expect(state.delayedAccessEffects).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "score_agenda",
          side: "runner",
          sourceDefinitionId: THEOREM_PROOF,
        }),
      ]),
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("offers Theorem Proof at full MU and installs it after a private two-program trash choice", () => {
    let state = classicAgendaGame("classic-theorem-proof-full-mu");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = toRunnerTurnFromCorpMain(state);
    state.runner.credits = 20;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    const firstProgram = installRunnerProgramForTest(state, "simple_decoder");
    const secondProgram = installRunnerProgramForTest(state, "simple_fracter");
    installRunnerProgramForTest(state, "simple_killer");
    const fourthProgram = Object.values(state.cardInstances).find(
      (instance) =>
        instance.definitionId === "simple_decoder" &&
        instance.instanceId !== firstProgram,
    )?.instanceId;
    if (!fourthProgram) throw new Error("Zweite Simple-Decoder-Instanz fehlt.");
    removeEverywhere(state, fourthProgram);
    state.runner.rig.programs.push(fourthProgram);
    state.runner.memoryUsed += 1;
    state.cardInstances[fourthProgram] = {
      ...state.cardInstances[fourthProgram]!,
      zone: { side: "runner", zone: "rig" },
      faceup: true,
      rezzed: true,
    };
    const theoremId = putCorpCardOnTopOfRd(state, THEOREM_PROOF);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "steal_agenda" &&
          action.payload?.agendaAccessReplacement ===
            "install_as_runner_program",
      ),
    ).toBe(true);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "steal_agenda" &&
        action.payload?.agendaAccessReplacement === "install_as_runner_program",
    );
    expect(state.pendingChoice?.source).toContain(
      "runner.program_install_memory:access",
    );
    expect(state.runner.rig.programs).not.toContain(theoremId);
    const trashOptionIds = [firstProgram, secondProgram].map(
      (cardId) =>
        state.pendingChoice?.options.find((option) => option.value === cardId)
          ?.id ?? "",
    );
    expect(trashOptionIds.every(Boolean)).toBe(true);
    state = applyChoices(state, "runner", trashOptionIds);

    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.heap).toEqual(
      expect.arrayContaining([firstProgram, secondProgram]),
    );
    expect(state.runner.rig.programs).toContain(theoremId);
    expect(state.runner.memoryUsed).toBe(4);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_cards",
      sourceDefinitionId: THEOREM_PROOF,
      runnerMemoryUsedAfter: 4,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});
