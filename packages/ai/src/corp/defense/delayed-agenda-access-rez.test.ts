import { afterEach, describe, expect, it } from "vitest";
import {
  applyAction,
  buildMatchPlayerOffer,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { planningCardByDefinitionId } from "@netgrid/cards/planning";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput, chooseCorpAction } from "../../index";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";

const encryption = 563;
const tycho = 432;

afterEach(resetResidentPlanPortfolioMemory);

function play(
  state: GameState,
  isAction: (action: LegalAction) => boolean,
): GameState {
  const action = getLegalActions(state, state.activeSide).find(isAction);
  if (!action) throw new Error(`Missing action at ${state.timingPoint}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: state.activeSide,
    clientKnownStateVersion: state.stateVersion,
    actionId: action.actionId,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function accessWindow(variant: "agenda_after" | "agenda_before" | "no_agenda") {
  const deckCards = [
    { id: encryption, quantity: 1 },
    { id: tycho, quantity: 1 },
    ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
      (card) => card.id !== encryption && card.id !== tycho,
    ),
  ];
  let state = createGameAfterSetup({
    seed: "remote-agenda-delay-final-rez",
    traceRulesProfile: "modern_open",
    corpDeck: { ...ORIGINALSET_DEFAULT_DECKS.corp, cards: deckCards },
  });
  state = play(state, (a) => a.type === "mandatory_draw");
  const fixture = RealEngineFixtureBuilder.forState(state).withCorpHqSize(0);
  if (variant === "agenda_before") fixture.withCorpRemoteRoot("r1", tycho, 1);
  fixture.withCorpRemoteRoot("r1", encryption);
  if (variant === "agenda_after") fixture.withCorpRemoteRoot("r1", tycho, 1);
  state.corp.credits = 3;
  state.corp.clicks = 0;
  state = play(state, (a) => a.type === "end_turn");
  state = play(
    state,
    (a) => a.type === "start_run" && a.payload?.serverId === "r1",
  );
  const approach = state;
  for (
    let step = 0;
    step < 10 &&
    !(state.timingPoint === "run.movement_rez_window" &&
      state.run?.position.kind === "server");
    step++
  ) {
    state = play(state, (a) => a.type === "continue_run" || a.type === "decline_rez");
  }
  expect(state.timingPoint).toBe("run.movement_rez_window");
  const input = buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    eventTail: state.eventLog,
    ownDeckSnapshot: {
      deckSnapshotId: "remote-agenda-delay-final-rez",
      side: "corp",
      cards: deckCards.map(({ id, quantity }) => ({ cardId: id, quantity })),
    },
  });
  const source = (action: LegalAction) =>
    action.type === "rez_card" &&
    !!action.source &&
    state.cardInstances[action.source]?.definitionId === encryption;
  const rez = input.legalActions.find(source);
  if (!rez) throw new Error("Missing legal upgrade rez.");
  return { state, input, rez, source, approach };
}

describe("remote agenda delay at the last root rez window", () => {
  it("projects the actual CardSpec capability to the hint consumed by defense", () => {
    expect(planningCardByDefinitionId(encryption)?.engine.hiddenReplacementLongtail)
      .toMatchObject({ kind: "delayed_agenda_access_replacement" });
    expect(AI_HINTS_BY_CARD.get(encryption)?.effects).toContainEqual({
      kind: "remote_protection",
      scope: "fort",
      timing: "on_access",
      target: "access.corp_delayed_agenda_score",
    });
  });

  it("uses the exact free rez to delay points even when the Runner trashes the upgrade", () => {
    const { state, input, rez, source, approach } = accessWindow("agenda_after");
    expect(getLegalActions(approach, "corp").find(source)?.payload?.rootRezDelaysAgendaAccess)
      .toBeUndefined();
    expect(rez.payload?.rootRezDelaysAgendaAccess).toBe(true);
    expect(buildMatchPlayerOffer(getPlayerView(state, "corp")).legalActions
      .some((a) => a.payload?.rootRezDelaysAgendaAccess !== undefined)).toBe(false);
    const decision = chooseCorpAction(input);
    expect(decision.actionId).toBe(rez.actionId);
    const plan = decision.decisionDebug?.planFirstDecision;
    expect(plan?.selectedPlan?.moduleId).toBe("corp.defend_servers");
    expect(plan?.route).toMatchObject({
      actionId: rez.actionId,
      stateVersion: state.stateVersion,
    });
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);

    let next = play(state, (a) => a.actionId === rez.actionId);
    expect(next.corp.credits).toBe(state.corp.credits);
    expect(next.corp.clicks).toBe(state.corp.clicks);
    for (const type of ["access_card", "trash_accessed_card", "access_card", "steal_agenda"]) {
      next = play(next, (a) => a.type === type);
    }
    expect(getPlayerView(next, "runner").own.agendaPoints).toBe(0);
    expect(next.delayedAccessEffects).toMatchObject([
      { kind: "delayed_agenda_access_replacement", serverId: "r1" },
    ]);
    const replay = replayEvents(state, next.eventLog.slice(state.eventLog.length));
    expect(replay.ok).toBe(true);
    expect(hashGameState(replay.state)).toBe(hashGameState(next));
  });

  it.each(["agenda_before", "no_agenda"] as const)(
    "leaves the upgrade unrezzed when no later agenda has protection value (%s)",
    (variant) => {
      const { input, rez } = accessWindow(variant);
      expect(rez.payload?.rootRezDelaysAgendaAccess).toBeUndefined();
      expect(chooseCorpAction(input).actionId).not.toBe(rez.actionId);
    },
  );
});
