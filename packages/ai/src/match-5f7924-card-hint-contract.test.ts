import { describe, expect, it } from "vitest";

import activeHints from "../../../data/ai/ai-card-hints-active.json";

describe("match 5F7924 card-hint contracts", () => {
  it("models Marked Accounts as an access-triggered tag source", () => {
    const hint = activeHints.cards.find(
      (entry) => entry.cardId === "onr_proteus_005_marked-accounts",
    );

    expect(hint?.effects).toContainEqual(
      expect.objectContaining({
        kind: "tag_source",
        resource: "tags",
        scope: "runner",
        timing: "on_access",
      }),
    );
    expect(hint?.actionTacticSignals).toContain("effect_timing:on_access");
    expect(hint?.actionTacticSignals).not.toContain(
      "effect_timing:scored_activated",
    );
    expect(hint?.functionSignals).toContain("tag.source");
  });
});
