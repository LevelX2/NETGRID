import type { VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { visibleCardDefinition } from "./card-definition-lookup";

describe("visibleCardDefinition", () => {
  it("resolves a definition only for an explicitly known card", () => {
    const card = {
      instanceId: "data-wall",
      definitionId: "onr_v1_237_data-wall",
      known: true,
    } as VisibleCard;

    expect(visibleCardDefinition(card)?.type).toBe("ice");
    expect(visibleCardDefinition({ ...card, known: false })).toBeUndefined();
  });
});
