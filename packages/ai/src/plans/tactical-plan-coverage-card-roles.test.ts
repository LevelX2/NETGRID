import { describe, expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";

import { cardPlanRoleForCoverageSearch } from "./tactical-plan-coverage-card-roles";

describe("cardPlanRoleForCoverageSearch", () => {
  it("classifies coverage search roles by bounded card tokens", () => {
    expect(cardPlanRoleForCoverageSearch(card({ rulesText: "Search your stack." }))).toBe(
      "search",
    );
    expect(cardPlanRoleForCoverageSearch(card({ rulesText: "Draw 2 cards." }))).toBe(
      "draw",
    );
    expect(cardPlanRoleForCoverageSearch(card({ rulesText: "Gain 3 credits." }))).toBe(
      "economy",
    );
    expect(
      cardPlanRoleForCoverageSearch(
        card({ rulesText: "Searching drawish creditor gainish 3." }),
      ),
    ).toBe("resource");
  });
});

function card(overrides: Partial<VisibleCard>): VisibleCard {
  return {
    instanceId: "visible-card",
    definitionId: "visible-card",
    title: "Visible Card",
    type: "resource",
    known: true,
    owner: "runner",
    controller: "runner",
    ...overrides,
  } as VisibleCard;
}
