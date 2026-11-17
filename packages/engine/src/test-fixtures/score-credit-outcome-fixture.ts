import { CURRENT_RULES_BASELINE, DEMO_DECKS } from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../card-definitions";
import {
  apply,
  createMechanicFixtureGameAfterSetup,
  putCorpRootInRemote,
  scoreCorpAgendaForTest,
} from "./mechanic-smoke-fixtures";

export function currentCorpScoreCreditFixture(
  credits: number,
  terminal = false,
  definitionId = 408,
) {
  const initial = createMechanicFixtureGameAfterSetup({
    seed: `score-credit-outcome-${credits}-${terminal}`,
    baseline: CURRENT_RULES_BASELINE,
    corpDeck: {
      ...DEMO_DECKS.demo_corp_001,
      cards: [
        { id: 408, quantity: 3 },
        { id: 405, quantity: 3 },
        { id: 424, quantity: 3 },
        { id: 502, quantity: 3 },
        { id: 491, quantity: 3 },
        { id: 415, quantity: 3 },
      ],
    },
  });
  const state = apply(initial, "corp", (a) => a.type === "mandatory_draw");
  const agendaId = putCorpRootInRemote(state, definitionId);
  const requirement =
    CARD_DEFINITIONS_BY_ID[definitionId]?.advancementRequirement;
  if (typeof requirement !== "number")
    throw new Error("score_credit_fixture_requires_agenda");
  state.cardInstances[agendaId]!.advancementCounters = requirement;
  state.corp.credits = credits;
  state.corp.clicks = 0;
  if (terminal) {
    scoreCorpAgendaForTest(state, 405);
    scoreCorpAgendaForTest(state, 424);
  }
  return { state, agendaId };
}
