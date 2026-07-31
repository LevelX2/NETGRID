import { describe, expect, it } from "vitest";
import type { LegalAction, PlayerView, Side } from "@netgrid/shared";
import {
  accessDecisionDisplayLabel,
  accessDecisionLabel,
  accessRevealActionGroups,
  confirmedNextAccessAction,
  shouldKeepAccessRevealOpen,
} from "./access-reveal-ui";

describe("access reveal UI helpers", () => {
  it("keeps R&D access actions limited to the provided legal actions", () => {
    const trash = legalAction("trash_accessed_card", "PAD Campaign trashen");
    const ok = legalAction("decline_trash", "Nicht trashen");

    const groups = accessRevealActionGroups([trash, ok]);

    expect(groups.primaryActions).toEqual([trash]);
    expect(groups.declineAction).toBe(ok);
    expect(
      groups.primaryActions.map((action) => accessDecisionLabel(action)),
    ).toEqual(["Trashen"]);
    expect(accessDecisionLabel(groups.declineAction!)).toBe("Nicht trashen");
  });

  it("shows only OK when the accessed R&D card has no trash action", () => {
    const ok = legalAction("decline_trash", "Access abschließen");

    const groups = accessRevealActionGroups([ok]);

    expect(groups.primaryActions).toEqual([]);
    expect(groups.declineAction).toBe(ok);
    expect(accessDecisionLabel(ok)).toBe("Zugriff abschließen");
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
    expect(accessDecisionLabel(steal, "Remote 1")).toBe(
      "Agenda aus Remote 1 stehlen",
    );
    expect(accessDecisionLabel(ok, "Archive")).toBe("Zugriff abschließen");
  });

  it("distinguishes non-final and final access declines", () => {
    const decline = legalAction("decline_trash", "Weiter accessen");

    expect(
      accessDecisionLabel(decline, "HQ", {
        cardType: "upgrade",
        hasMoreAccesses: true,
      }),
    ).toBe("Nicht trashen – nächste Karte");
    expect(
      accessDecisionLabel(decline, "HQ", {
        cardType: "upgrade",
        hasMoreAccesses: false,
      }),
    ).toBe("Nicht trashen – Zugriff beenden");
    expect(shouldKeepAccessRevealOpen(decline, true)).toBe(true);
    expect(shouldKeepAccessRevealOpen(decline, false)).toBe(false);
    expect(
      shouldKeepAccessRevealOpen(
        legalAction("trash_accessed_card", "Trashen"),
        true,
      ),
    ).toBe(true);
    expect(
      shouldKeepAccessRevealOpen(
        legalAction("steal_agenda", "Agenda stehlen"),
        true,
      ),
    ).toBe(true);
  });

  it("continues only with a newly confirmed sole access action", () => {
    const access = legalAction("access_card", "Karte accessen");
    access.expiresAtStateVersion = 13;
    const continuation = {
      accessEventId: "evt_access_1",
      breachId: "breach_1",
      fromStateVersion: 12,
      nextAccessSubmitted: false,
    };
    const view = {
      stateVersion: 13,
      run: { breach: { breachId: "breach_1" } },
    } as PlayerView;

    expect(confirmedNextAccessAction(continuation, view, [access])).toBe(
      access,
    );
    expect(
      confirmedNextAccessAction(continuation, view, [
        access,
        legalAction("trigger_ability", "Zwischenentscheidung"),
      ]),
    ).toBeNull();
    expect(
      confirmedNextAccessAction(
        continuation,
        { ...view, pendingChoice: { choiceId: "choice" } } as PlayerView,
        [access],
      ),
    ).toBeNull();
    expect(
      confirmedNextAccessAction(
        continuation,
        { ...view, stateVersion: 12 } as PlayerView,
        [access],
      ),
    ).toBeNull();
  });

  it("makes Red Herrings payment explicit before stealing an agenda", () => {
    const steal = legalAction("steal_agenda", "Priority Requisition stehlen");
    steal.payload = {
      stealAdditionalCost: 5,
      stealCost: 5,
      stealCostSourceTitles: "Red Herrings",
    };

    expect(accessDecisionLabel(steal, "Remote 1")).toBe(
      "5 Credits wegen Red Herrings bezahlen und Agenda aus Remote 1 stehlen",
    );
    expect(accessDecisionDisplayLabel(steal, "Remote 1")).toBe(
      "Zahlen & stehlen",
    );
  });

  it("keeps agenda access replacements distinct from stealing", () => {
    const install = legalAction(
      "steal_agenda",
      "Theorem Proof als Programm installieren",
    );
    install.payload = {
      agendaAccessReplacement: "install_as_runner_program",
      installedRunnerProgramMemoryCost: 2,
    };
    const decline = legalAction(
      "decline_trash",
      "Theorem Proof nicht installieren",
    );
    decline.payload = {
      agendaAccessReplacement: "declined_install_as_runner_program",
      installedRunnerProgramMemoryCost: 2,
    };

    expect(accessDecisionLabel(install, "R&D")).toBe(
      "Theorem Proof als Programm installieren",
    );
    expect(accessDecisionDisplayLabel(install, "R&D")).toBe(
      "Theorem Proof als Programm installieren",
    );
    expect(accessDecisionLabel(decline, "R&D")).toBe(
      "Theorem Proof nicht installieren",
    );
  });

  it("labels free access trash actions as free", () => {
    const trash = legalAction(
      "trash_accessed_card",
      "Dog Pile kostenlos trashen",
    );
    trash.payload = {
      freeAccessTrash: true,
      proteusRunnerVirusFreeTrashCounterType: "garbage",
    };

    expect(accessDecisionLabel(trash)).toBe("Kostenlos trashen");
  });
});

function legalAction(
  type: LegalAction["type"],
  label: string,
  side: Side = "runner",
): LegalAction {
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
    expiresAtStateVersion: 1,
  };
}
