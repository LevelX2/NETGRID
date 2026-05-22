import { describe, expect, it } from "vitest";
import type { LegalAction, Side } from "@netgrid/shared";
import { accessDecisionLabel, accessRevealActionGroups } from "./access-reveal-ui";

describe("access reveal UI helpers", () => {
  it("keeps R&D access actions limited to the provided legal actions", () => {
    const trash = legalAction("trash_accessed_card", "PAD Campaign trashen");
    const ok = legalAction("decline_trash", "Nicht trashen");

    const groups = accessRevealActionGroups([trash, ok]);

    expect(groups.primaryActions).toEqual([trash]);
    expect(groups.declineAction).toBe(ok);
    expect(groups.primaryActions.map(accessDecisionLabel)).toEqual(["Trashen"]);
    expect(accessDecisionLabel(groups.declineAction!)).toBe("OK");
  });

  it("shows only OK when the accessed R&D card has no trash action", () => {
    const ok = legalAction("decline_trash", "Access abschließen");

    const groups = accessRevealActionGroups([ok]);

    expect(groups.primaryActions).toEqual([]);
    expect(groups.declineAction).toBe(ok);
    expect(accessDecisionLabel(ok)).toBe("OK");
  });

  it("keeps multiaccess continuation explicit", () => {
    const next = legalAction("access_card", "Weiter accessen");

    expect(accessDecisionLabel(next)).toBe("Nächste Karte");
  });
});

function legalAction(type: LegalAction["type"], label: string, side: Side = "runner"): LegalAction {
  return {
    actionId: `${side}.${type}`,
    side,
    type,
    label,
    source: "game_rule",
    timingPoint: "access.resolve_card",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1
  };
}
