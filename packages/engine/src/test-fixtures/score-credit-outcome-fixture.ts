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
  definitionId = "onr_v1_196_corporate-war",
) {
  const initial = createMechanicFixtureGameAfterSetup({
    seed: `score-credit-outcome-${credits}-${terminal}`,
    baseline: CURRENT_RULES_BASELINE,
    corpDeck: {
      ...DEMO_DECKS.demo_corp_001,
      cards: [
        { id: "onr_v1_196_corporate-war", quantity: 3 },
        { id: "onr_v1_193_corporate-coup", quantity: 3 },
        { id: "onr_v1_212_priority-requisition", quantity: 3 },
        { id: "onr_v1_290_efficiency-experts", quantity: 3 },
        { id: "onr_v1_279_wall-of-static", quantity: 3 },
        { id: "onr_v1_203_hostile-takeover", quantity: 3 },
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
    scoreCorpAgendaForTest(state, "onr_v1_193_corporate-coup");
    scoreCorpAgendaForTest(state, "onr_v1_212_priority-requisition");
  }
  return { state, agendaId };
}
