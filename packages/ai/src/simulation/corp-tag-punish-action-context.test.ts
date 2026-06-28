import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { createCorpTagPunishActionContext } from "./corp-tag-punish-action-context";

describe("createCorpTagPunishActionContext", () => {
  it("matches tag-punish roles by bounded role terms", () => {
    const context = createCorpTagPunishActionContext({
      sourceDefinitionIdForAction: () => "unknown",
      rolesForAction: (_input, action) => rolesByActionId[action.actionId] ?? [],
    });
    const input = corpInput();

    expect(context.isCorpTagSourceAction(input, action("tag-source"))).toBe(
      true,
    );
    expect(context.isCorpTagSourceAction(input, action("tag-noise"))).toBe(
      false,
    );
    expect(context.isCorpTraceTagSourceAction(input, action("trace-source")))
      .toBe(true);
    expect(context.isCorpTraceTagSourceAction(input, action("trace-noise")))
      .toBe(false);
    expect(context.corpPunishKindForAction(input, action("punish"))).toBe(
      "unknown",
    );
    expect(context.corpPunishKindForAction(input, action("punish-noise")))
      .toBeUndefined();
  });
});

const rolesByActionId: Record<string, string[]> = {
  "tag-source": ["tag_source"],
  "tag-noise": ["tagalong_source", "tag_sourceish_noise"],
  "trace-source": ["trace_tag"],
  "trace-noise": ["traceroute_noise"],
  punish: ["tag_punishment"],
  "punish-noise": ["tag_punishmentish_noise"],
};

function corpInput(): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      opponent: { tags: 0 },
    },
    legalActions: [],
  } as unknown as AiDecisionInput;
}

function action(actionId: string): LegalAction {
  return {
    actionId,
    side: "corp",
    type: "trigger_ability",
    label: "Use action",
    source: "basic_action",
    timingPoint: "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}
