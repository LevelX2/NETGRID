import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it, vi } from "vitest";

import { createCorpVisibleTagPunishOpportunityContext } from "./corp-visible-tag-punish-opportunities";

describe("Corp visible tag punish opportunities", () => {
  it("does not interpret cross-side legal actions as Corp opportunities", () => {
    const classify = vi.fn(() => "damage" as const);
    const context = createCorpVisibleTagPunishOpportunityContext({
      corpPunishKindForAction: classify,
      corpVisibleTagPayoffCategoryForAction: () => "damage" as never,
      sourceDefinitionIdForAction: () => "card",
    });
    const input = {
      side: "corp",
      legalActions: [{ side: "runner" } as LegalAction],
    } as AiDecisionInput;

    expect(context.corpVisibleTagPunishOpportunities(input)).toEqual([]);
    expect(classify).not.toHaveBeenCalled();
  });
});
