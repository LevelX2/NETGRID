import { describe, expect, it } from "vitest";
import type { AiDecision, LegalAction } from "@netgrid/shared";

import { corpTagPunishSkipReason } from "./corp-tag-punish-skip-reason";

describe("corp tag punish skip reason", () => {
  it("classifies structured reason-code segments", () => {
    expect(
      corpTagPunishSkipReason(action("install_card"), decision("corp.plan.protect_rnd")),
    ).toBe("central_protection");
    expect(
      corpTagPunishSkipReason(
        action("draw_card"),
        decision("corp.plan.recover_economy"),
      ),
    ).toBe("economy");
    expect(
      corpTagPunishSkipReason(
        action("draw_card"),
        decision("corp.remote.unsafe_remote"),
      ),
    ).toBe("remote_protection");
  });

  it("ignores reason-code substring matches inside larger words", () => {
    expect(
      corpTagPunishSkipReason(
        action("draw_card"),
        decision("corp.plan.unprotected_remote_guess"),
      ),
    ).toBe("draw");
    expect(
      corpTagPunishSkipReason(
        action("trigger_ability"),
        decision("corp.plan.prescoreboard_setup"),
      ),
    ).toBe("unknown_higher_priority");
  });
});

function action(type: LegalAction["type"]): LegalAction {
  return {
    actionId: `${type}-1`,
    side: "corp",
    type,
    label: type,
    source: "basic_action",
    timingPoint: "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
  };
}

function decision(reasonCode: string): AiDecision {
  return {
    actionId: "chosen",
    reasonCode,
    explanation: reasonCode,
    confidence: 0.5,
    evidence: [],
    consideredActionIds: ["chosen"],
    fallbackUsed: false,
  };
}
