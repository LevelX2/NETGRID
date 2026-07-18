import { describe, expect, it } from "vitest";
import {
  agendaCard,
  corpAction,
  corpInputWithHqCardsAndServers,
} from "../semantic-runtime-corp-score.test-support";
import { corpConditionalScoreEconomyComponent } from "./semantic-runtime-corp-score-conditional-economy";

describe("conditional score economy", () => {
  it.each([
    [2, -120, false],
    [12, 720, true],
  ])(
    "models the visible threshold tradeoff at %i credits",
    (credits, expectedValue, thresholdMet) => {
      const agenda = agendaCard("corporate-war", 3);
      agenda.definitionId = "onr_v1_196_corporate-war";
      const action = corpAction(
        "score-corporate-war",
        "score_agenda",
        { cardId: agenda.instanceId },
        agenda.instanceId,
      );
      const input = corpInputWithHqCardsAndServers(
        credits,
        [],
        [
          {
            id: "remote_1",
            label: "Remote 1",
            ice: [],
            root: [agenda],
          },
        ],
        [action],
      );

      const component = corpConditionalScoreEconomyComponent(input, action);

      expect(component).toMatchObject({
        key: "corp_conditional_score_economy",
        value: expectedValue,
      });
      expect(component?.reason).toContain(`threshold_met:${thresholdMet}`);
    },
  );

  it("does not invent threshold semantics for an ordinary agenda", () => {
    const agenda = agendaCard("ordinary-agenda", 2);
    agenda.definitionId = "onr_v1_201_foetal-ai";
    const action = corpAction(
      "score-ordinary-agenda",
      "score_agenda",
      { cardId: agenda.instanceId },
      agenda.instanceId,
    );
    const input = corpInputWithHqCardsAndServers(
      12,
      [],
      [
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [],
          root: [agenda],
        },
      ],
      [action],
    );

    expect(corpConditionalScoreEconomyComponent(input, action)).toBeUndefined();
  });
});
