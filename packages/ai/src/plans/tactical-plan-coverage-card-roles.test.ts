import { describe, expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";

import {
  cardPlanRoleForCoverageSearch,
  coveragePlanRoleMatches,
} from "./tactical-plan-coverage-card-roles";

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

describe("coveragePlanRoleMatches", () => {
  it("matches bounded coverage role tokens and compound phrases", () => {
    expect(coveragePlanRoleMatches("remote_economy_asset_support", ["economy"])).toBe(
      true,
    );
    expect(
      coveragePlanRoleMatches("runner.pressure_hq.support", ["pressure_hq"]),
    ).toBe(true);
    expect(coveragePlanRoleMatches("breaker_fracter", ["breaker_"])).toBe(true);
  });

  it("ignores substring-only coverage role noise", () => {
    expect(coveragePlanRoleMatches("microeconomy", ["economy"])).toBe(false);
    expect(coveragePlanRoleMatches("economyish_support", ["economy"])).toBe(false);
    expect(coveragePlanRoleMatches("breakerish_fracter", ["breaker_"])).toBe(
      false,
    );
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
