import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type GameState,
  type LegalAction,
  type PlayerAction,
} from "@netgrid/shared";
import { expect, it } from "vitest";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";

const agendaDefinition = "onr_v1_196_corporate-war",
  supportDefinition = "onr_v1_300_project-consultants";
const extras = [agendaDefinition, supportDefinition];
const corpDeck = {
  ...DEMO_DECKS.demo_corp_001,
  id: "conversion-credit-order",
  cards: [
    ...DEMO_DECKS.demo_corp_001.cards.filter((c) => !extras.includes(c.id)),
    ...extras.map((id) => ({ id, quantity: 3 })),
  ],
};
function apply(
  state: GameState,
  predicate: (action: LegalAction) => boolean,
  selectedChoices?: PlayerAction["selectedChoices"],
): GameState {
  const action = getLegalActions(state, "corp").find(predicate);
  expect(action).toBeDefined();
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: action!.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: "order:" + state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw Error(JSON.stringify(result.error));
  return result.state;
}
it.each([true, false])(
  "preserves one credit after a complete conversion, agenda installed=%s",
  (installed) => {
    let initial = createGameAfterSetup({
      matchId: "conversion-order",
      seed: "conversion-order",
      agendaPointsToWin: 7,
      runnerDeck: DEMO_DECKS.demo_runner_001,
      corpDeck,
    });
    initial = apply(initial, (a) => a.type === "mandatory_draw");
    RealEngineFixtureBuilder.forState(initial)
      .withCorpHqSize(0)
      .withCorpCredits(installed ? 12 : 13)
      .withCorpCardInHq(agendaDefinition)
      .withCorpCardInHq(supportDefinition);
    const agenda = initial.corp.hq.find(
      (id) => initial.cardInstances[id]!.definitionId === agendaDefinition,
    )!;
    const install = (s: GameState) =>
      apply(
        s,
        (a) =>
          a.type === "install_card" &&
          a.source === agenda &&
          a.payload?.serverId === "new_remote",
      );
    if (installed) initial = install(initial);
    function branch(creditFirst: boolean) {
      let state = structuredClone(initial);
      const eventStart = state.eventLog.length;
      if (creditFirst) state = apply(state, (a) => a.type === "gain_credit");
      if (!installed) state = install(state);
      state = apply(
        state,
        (a) =>
          a.type === "play_operation" &&
          state.cardInstances[a.source!]!.definitionId === supportDefinition,
      );
      const choice = state.pendingChoice!,
        option = choice.options.find((o) => o.value === `${agenda}:4`)!;
      expect(option).toBeDefined();
      state = apply(state, (a) => a.type === "resolve_choice", {
        choiceId: choice.choiceId,
        selectedOptionIds: [option.id],
        selectedOptionValues: { [option.id]: 4 },
      });
      state = apply(
        state,
        (a) => a.type === "score_agenda" && a.source === agenda,
      );
      if (!creditFirst) state = apply(state, (a) => a.type === "gain_credit");
      const replay = replayEvents(initial, state.eventLog.slice(eventStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
      return state;
    }
    const before = branch(true),
      after = branch(false);
    expect(before.corp.credits).toBe(0);
    expect(after.corp.credits).toBe(1);
    expect(before.corp.clicks).toBe(0);
    expect(after.corp.clicks).toBe(0);
    expect(after.corp.scoreArea).toEqual(before.corp.scoreArea);
    expect(after.corp.scoreArea).toContain(agenda);
  },
);
