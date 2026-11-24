import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import { describe, expect, it } from "vitest";

import type { AiCardHint } from "../ai-hints";
import { randomBreakOrDamageRiskProfileForHint } from "./risk-action-projection";

describe("random break-or-damage risk profile", () => {
  it("projects an unseen card from functional hint semantics without an id registry", () => {
    const hint = {
      cardId: syntheticCardDefinitionId("future-random-breaker"),
      side: "runner",
      aiSupportStatus: "ai_supported",
      breakerProfile: {
        coverage: ["universal"],
        randomOutcome: {
          kind: "random_break_or_damage",
          successProbabilityPerAttempt: 0.75,
          failureDamageType: "net",
          maxSingleFailureDamage: 2,
        },
      },
    } as AiCardHint;

    expect(randomBreakOrDamageRiskProfileForHint(hint)).toEqual({
      kind: "random_break_or_damage",
      profileId: "random_break_or_damage:net:0.75:2",
      successProbabilityPerAttempt: 0.75,
      failureDamageType: "net",
      maxSingleFailureDamage: 2,
    });
  });

  it("fails closed when the functional random outcome is missing", () => {
    expect(
      randomBreakOrDamageRiskProfileForHint({
        cardId: syntheticCardDefinitionId("ordinary-breaker"),
        side: "runner",
        aiSupportStatus: "ai_supported",
        breakerProfile: { coverage: ["wall"] },
      } as AiCardHint),
    ).toBeUndefined();
  });
});
