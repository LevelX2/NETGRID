import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
} from "../../index";
import {
  apply,
  ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK,
  ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK,
  putCorpRootInRemote,
  scoreCorpAgendaForTest,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import { visibleCorpScoreContinuationQuote } from "../view/visible-corp-score-continuation-quote";

const tycho = 432;
const corporateWar = 408;
const directors = 401;
const washington = 586;

function prepare(region?: number, agenda = tycho, directorsCount = 1) {
  const state = apply(
    createGameAfterSetup({
      seed: "agenda-difficulty-modifier-authority",
      runnerDeck: ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK,
      corpDeck: {
        ...ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK,
        cards: [
          ...ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK.cards.map((entry) =>
            entry.id === directors
              ? { ...entry, quantity: directorsCount }
              : entry,
          ),
          { id: agenda, quantity: 1 },
        ],
      },
    }),
    "corp",
    (action) => action.type === "mandatory_draw",
  );
  const agendaId = putCorpRootInRemote(state, agenda);
  state.cardInstances[agendaId]!.advancementCounters = 3;
  if (region) {
    const regionId = putCorpRootInRemote(state, region);
    state.cardInstances[regionId]!.rezzed = true;
    state.cardInstances[regionId]!.faceup = true;
  }
  return { state, agendaId };
}

describe("agenda difficulty follows declared modifiers", () => {
  it.each([
    [undefined, 4, 1],
    [580, 4, 1],
    [washington, 3, 0],
  ] as const)(
    "projects and quotes %s without an unrelated or duplicate discount",
    (region, requirement, remaining) => {
      const { state, agendaId } = prepare(region);
      const before = hashState(state);
      const card = getPlayerView(state, "corp")
        .servers.find((s) => s.id === "r1")!
        .root.find((c) => c.instanceId === agendaId);
      expect(card?.advancementRequirement).toBe(requirement);
      expect(
        visibleCorpScoreContinuationQuote(state, agendaId, "r1"),
      ).toMatchObject({
        complete: true,
        remainingAdvancementCounters: remaining,
      });
      expect(
        getLegalActions(state, "corp").some((a) => a.type === "score_agenda"),
      ).toBe(remaining === 0);
      expect(hashState(state)).toBe(before);
      expect(
        getPlayerView(state, "runner")
          .servers.find((s) => s.id === "r1")!
          .root.find((c) => !c.known),
      ).not.toHaveProperty("advancementRequirement");
    },
  );

  it("projects the net difficulty change only while a remote agenda is known", () => {
    const { state, agendaId } = prepare(washington, corporateWar, 3);
    const agenda = state.cardInstances[agendaId]!;
    const remoteRoot = (side: "corp" | "runner") =>
      getPlayerView(state, side).servers.find((s) => s.id === "r1")!.root;
    const visibleAgenda = (side: "corp" | "runner") =>
      remoteRoot(side).find((card) => card.instanceId === agendaId);

    scoreCorpAgendaForTest(state, directors);
    expect(visibleAgenda("corp")).toMatchObject({
      advancementRequirement: 1,
      agendaDifficultyModifier: -2,
    });
    const hiddenAgenda = remoteRoot("runner").find((card) => !card.known);
    expect(hiddenAgenda).toBeDefined();
    expect(hiddenAgenda).not.toHaveProperty("agendaDifficultyModifier");
    agenda.faceup = true;
    expect(visibleAgenda("runner")).toMatchObject({
      advancementRequirement: 1,
      agendaDifficultyModifier: -2,
    });

    state.serverAgendaCostCountersByServer = { r1: 4 };
    expect(visibleAgenda("corp")?.advancementRequirement).toBe(3);
    expect(visibleAgenda("corp")).not.toHaveProperty(
      "agendaDifficultyModifier",
    );
    state.serverAgendaCostCountersByServer = { r1: 6 };
    expect(visibleAgenda("corp")).toMatchObject({
      advancementRequirement: 4,
      agendaDifficultyModifier: 1,
    });

    state.serverAgendaCostCountersByServer = {};
    scoreCorpAgendaForTest(state, directors);
    scoreCorpAgendaForTest(state, directors);
    expect(visibleAgenda("corp")).toMatchObject({
      advancementRequirement: 0,
      agendaDifficultyModifier: -3,
    });
    scoreCorpAgendaForTest(state, corporateWar);
    const scoredAgenda = getPlayerView(state, "corp").own.scoreArea.find(
      (card) => card.instanceId === agendaId,
    );
    expect(scoredAgenda).toBeDefined();
    expect(scoredAgenda).not.toHaveProperty("agendaDifficultyModifier");
  });

  it("rejects a formerly offered score after its actual difficulty modifier leaves", () => {
    const { state, agendaId } = prepare(washington);
    const score = getLegalActions(state, "corp").find(
      (a) => a.type === "score_agenda",
    )!;
    expect(score).toBeDefined();
    const regionId = state.corp.servers
      .find((s) => s.id === "r1")!
      .root.find((id) => id !== agendaId)!;
    state.cardInstances[regionId]!.rezzed = false;
    state.cardInstances[regionId]!.faceup = false;
    const before = hashState(state);
    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: score.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "revalidate-score-modifier",
    });
    expect(result.ok).toBe(false);
    expect(hashState(state)).toBe(before);
  });

  it("requires and scores all four Tycho counters beside a run-lock region", () => {
    const { state, agendaId } = prepare(580);
    state.cardInstances[agendaId]!.advancementCounters = 4;
    const score = getLegalActions(state, "corp").find(
      (a) => a.type === "score_agenda",
    )!;
    expect(score).toBeDefined();
    const request = {
      matchId: state.matchId,
      side: "corp" as const,
      actionId: score.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "score-at-four",
    };
    const result = applyAction(state, request);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected valid score");
    expect(getPlayerView(result.state, "corp").own.agendaPoints).toBe(4);
    const repeated = applyAction(state, request);
    expect(repeated.ok).toBe(true);
    if (repeated.ok)
      expect(hashState(repeated.state)).toBe(hashState(result.state));
  });
});
