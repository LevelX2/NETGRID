import { describe, expect, it } from "vitest";
import type { LegalAction, Side } from "@netgrid/shared";
import { accessDecisionDisplayLabel, accessDecisionLabel, accessRevealActionGroups } from "./access-reveal-ui";

describe("access reveal UI helpers", () => {
  it("keeps R&D access actions limited to the provided legal actions", () => {
    const trash = legalAction("trash_accessed_card", "PAD Campaign trashen");
    const ok = legalAction("decline_trash", "Nicht trashen");

    const groups = accessRevealActionGroups([trash, ok]);

    expect(groups.primaryActions).toEqual([trash]);
    expect(groups.declineAction).toBe(ok);
    expect(groups.primaryActions.map((action) => accessDecisionLabel(action))).toEqual(["Trashen"]);
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

  it("can include the accessed server in decision labels", () => {
    const next = legalAction("access_card", "Weiter accessen");
    const trash = legalAction("trash_accessed_card", "PAD Campaign trashen");
    const steal = legalAction("steal_agenda", "Agenda stehlen");
    const ok = legalAction("decline_trash", "Access abschließen");

    expect(accessDecisionLabel(next, "R&D")).toBe("Nächste R&D-Karte");
    expect(accessDecisionLabel(trash, "HQ")).toBe("Aus HQ trashen");
    expect(accessDecisionLabel(steal, "Remote 1")).toBe("Agenda aus Remote 1 stehlen");
    expect(accessDecisionLabel(ok, "Archive")).toBe("Archiv-Zugriff abschließen");
  });

  it("makes Red Herrings payment explicit before stealing an agenda", () => {
    const steal = legalAction("steal_agenda", "Priority Requisition stehlen");
    steal.payload = {
      stealAdditionalCost: 5,
      stealCost: 5,
      stealCostSourceTitles: "Red Herrings"
    };

    expect(accessDecisionLabel(steal, "Remote 1")).toBe(
      "5 Credits wegen Red Herrings bezahlen und Agenda aus Remote 1 stehlen"
    );
    expect(accessDecisionDisplayLabel(steal, "Remote 1")).toBe("Zahlen & stehlen");
  });

  it("labels free access trash actions as free", () => {
    const trash = legalAction("trash_accessed_card", "Dog Pile kostenlos trashen");
    trash.payload = {
      freeAccessTrash: true,
      proteusRunnerVirusFreeTrashCounterType: "garbage"
    };

    expect(accessDecisionLabel(trash)).toBe("Kostenlos trashen");
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
