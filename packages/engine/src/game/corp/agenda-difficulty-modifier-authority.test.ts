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
} from "../../test-fixtures/mechanic-smoke-fixtures";
import { visibleCorpScoreContinuationQuote } from "../view/visible-corp-score-continuation-quote";

function prepare(region?: string) {
  const state = apply(
    createGameAfterSetup({
      seed: "agenda-difficulty-modifier-authority",
      runnerDeck: ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK,
      corpDeck: {
        ...ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK,
        cards: [
          ...ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK.cards,
          { id: "onr_v1_220_tycho-extension", quantity: 1 },
        ],
      },
    }),
    "corp",
    (action) => action.type === "mandatory_draw",
  );
  const agendaId = putCorpRootInRemote(state, "onr_v1_220_tycho-extension");
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
    ["onr_v1_368_roving-submarine", 4, 1],
    ["onr_v1_374_washington-d-c-city-grid", 3, 0],
  ] as const)(
    "projects and quotes %s without an unrelated or duplicate discount",
    (region, requirement, remaining) => {
      const { state, agendaId } = prepare(region);
      const before = hashState(state);
      const card = getPlayerView(state, "corp")
        .servers.find((s) => s.id === "remote_1")!
        .root.find((c) => c.instanceId === agendaId);
      expect(card?.advancementRequirement).toBe(requirement);
      expect(
        visibleCorpScoreContinuationQuote(state, agendaId, "remote_1"),
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
          .servers.find((s) => s.id === "remote_1")!
          .root.find((c) => !c.known),
      ).not.toHaveProperty("advancementRequirement");
    },
  );

  it("rejects a formerly offered score after its actual difficulty modifier leaves", () => {
    const { state, agendaId } = prepare("onr_v1_374_washington-d-c-city-grid");
    const score = getLegalActions(state, "corp").find(
      (a) => a.type === "score_agenda",
    )!;
    expect(score).toBeDefined();
    const regionId = state.corp.servers
      .find((s) => s.id === "remote_1")!
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
    const { state, agendaId } = prepare("onr_v1_368_roving-submarine");
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
