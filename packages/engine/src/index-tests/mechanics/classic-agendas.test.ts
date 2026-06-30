import { describe, expect, it } from "vitest";
import { createGameAfterSetup, getLegalActions } from "../../index";
import {
  agendaPoints,
  apply,
  applyChoice,
  cardCounterAmount,
  putCorpCardOnTopOfRd,
  putCorpRootInRemote,
  toRunnerTurnFromCorpMain,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import type { CardDefinitionId, DeckDefinition, GameState } from "@netgrid/shared";

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
        action.type === "score_agenda" &&
        action.payload?.cardId === agendaId,
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
    if (!runAbility) throw new Error("Missing Data Fort Remapping run ability.");

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

  it("offers Unlisted Research Lab's scored start-turn draw choice", () => {
    let state = corpMainClassicAgendaGame("classic-unlisted-research-lab");
    state = scoreClassicAgenda(state, UNLISTED_RESEARCH_LAB, 3).state;
    const nextTurnStart = apply(
      apply(state, "corp", (action) => action.type === "end_turn"),
      "runner",
      (action) => action.type === "end_turn",
    );

    expect(nextTurnStart.pendingChoice?.source).toContain(
      "scored_agenda.start_draw_choice",
    );
    const hqBeforeDraw = nextTurnStart.corp.hq.length;
    const afterDraw = applyChoice(nextTurnStart, "corp", "draw");

    expect(afterDraw.corp.hq.length).toBe(hqBeforeDraw + 1);
    expect(afterDraw.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      sourceDefinitionId: UNLISTED_RESEARCH_LAB,
      scoredAgendaStartDrawDecision: "draw",
      drawnCards: 1,
    });
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
        action.payload?.agendaAccessReplacement ===
          "install_as_runner_program",
    );

    expect(state.runner.scoreArea).not.toContain(theoremId);
    expect(state.runner.rig.programs).toContain(theoremId);
    expect(state.runner.memoryUsed).toBe(2);
    expect(state.cardInstances[theoremId]?.installedAsRunnerProgram).toMatchObject({
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
    expect(state.cardInstances[theoremId]?.installedAsRunnerProgram).toBeUndefined();
    expect(agendaPoints(state, "runner")).toBe(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: THEOREM_PROOF,
      scoredSourceAsAgenda: true,
      scoredAgendaPointValue: 3,
      runnerMemoryUsedAfter: 0,
    });
  });
});
