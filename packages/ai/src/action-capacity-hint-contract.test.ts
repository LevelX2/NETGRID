import { describe, expect, it } from "vitest";

import generatedArtifact from "../../../data/ai/card-spec-ai-hints-generated.json";
import type { AiCardHint } from "./ai-hints";

const hints = generatedArtifact.cards.map(({ hint }) => hint) as AiCardHint[];
const hintsByCard = new Map(hints.map((hint) => [hint.cardId, hint]));

describe("action-capacity hint contracts", () => {
  it.each([
    [329, "restricted_gain", 5],
    [399, "restricted_gain", 1],
    [404, "finite_bank", 1],
    [501, "restricted_gain", 3],
    [509, "immediate_gain", 2],
    [546, "finite_bank", 1],
    [104, "future_recurring_gain", 1],
    [290, "action_debt", 4],
  ] as const)(
    "%s publishes a %s amount %d profile",
    (cardId, family, amount) => {
      expect(hintsByCard.get(cardId)?.actionCapacityProfiles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            class: family,
            amount,
            amountKind: "fixed",
          }),
        ]),
      );
    },
  );

  it("keeps immediate, recurring, restricted, random, mandatory, debt and cost families distinct", () => {
    const families = new Set(
      hints.flatMap((hint) =>
        (hint.actionCapacityProfiles ?? []).map((profile) => profile.class),
      ),
    );

    expect([...families]).toEqual(
      expect.arrayContaining([
        "immediate_gain",
        "finite_bank",
        "recurring_gain",
        "future_recurring_gain",
        "restricted_gain",
        "random_gain",
        "mandatory_gain",
        "action_debt",
        "action_loss",
        "action_cost",
        "action_lock",
      ]),
    );
  });

  it("marks every concrete restriction with compatible action types", () => {
    for (const hint of hints) {
      for (const profile of hint.actionCapacityProfiles ?? []) {
        if (
          ![
            "install_only",
            "program_install_only",
            "run_only",
            "purge_only",
          ].includes(profile.restriction)
        )
          continue;
        expect(profile.actionTypes?.length, hint.cardId).toBeGreaterThan(0);
      }
    }
  });
});
