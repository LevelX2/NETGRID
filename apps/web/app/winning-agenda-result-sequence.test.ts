import type { PublicGameEvent } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { retainedAccessRevealEvent } from "./action-board-ui";
import { latestStolenAgendaEvent } from "./access-presentation";
import { matchOverlayPresentation } from "./match-overlay-presentation";
import { accessRevealFromLatestEvent } from "../features/actions/access-review-derivation";

describe("winning agenda access result sequence", () => {
  it("keeps the public R&D agenda access ahead of the finished result", () => {
    const earlierAccess = event("evt_access_earlier", "access_card", {
      actor: "runner",
      cardDefinitionId: "onr_v1_305_team-restructuring",
      title: "Team Restructuring",
      serverLabel: "R&D",
      accessOrigin: "rd",
      accessIndex: 0,
      effectiveAccessCount: 2,
    });
    const access = event("evt_access", "access_card", {
      actor: "runner",
      cardDefinitionId: "onr_v1_199_employee-empowerment",
      title: "Employee Empowerment",
      serverLabel: "R&D",
      accessOrigin: "rd",
      accessIndex: 1,
      effectiveAccessCount: 2,
    });
    const steal = event(
      "evt_steal",
      "steal_agenda",
      {
        actor: "runner",
        cardDefinitionId: "onr_v1_199_employee-empowerment",
        title: "Employee Empowerment",
        serverId: "rd",
        accessOrigin: "rd",
      },
      2,
    );
    const events = [earlierAccess, access, steal];
    const retained = retainedAccessRevealEvent(events, null);
    const details = {
      "onr_v1_199_employee-empowerment": {
        catalogCardId: "onr_v1_199_employee-empowerment",
        title: "Employee Empowerment",
        side: "corp" as const,
        type: "agenda",
        subtypes: [],
        setId: "test",
        setName: "Test",
        collectorNumber: "1",
        text: "",
        numeric: {},
      },
    };

    expect(retained?.eventId).toBe("evt_access");
    expect(latestStolenAgendaEvent(events, [])?.eventId).toBe("evt_steal");
    for (const side of ["runner", "corp"] as const) {
      const reveal = accessRevealFromLatestEvent(
        latestStolenAgendaEvent(events, []) ?? undefined,
        details,
        [],
        side,
        events,
      );
      expect(reveal).toMatchObject({
        eventId: "evt_steal",
        outcomeKind: "stolen",
        dismissLabel: "Agenda bestätigen",
        actions: [],
        card: {
          definitionId: "onr_v1_199_employee-empowerment",
          title: "Employee Empowerment",
        },
      });
      expect(
        matchOverlayPresentation({
          accessRevealAvailable: Boolean(reveal),
          accessRevealDismissed: false,
          accessRevealKind: reveal?.kind ?? null,
          accessOutcomeKind: reveal?.outcomeKind ?? null,
          matchEnded: true,
          damagePresentationPending: false,
          resultAvailable: true,
          resultDismissed: false,
          runnerWonByAgendaPoints: true,
          terminalAccessFlatline: false,
        }),
      ).toMatchObject({
        showAccessReveal: true,
        showResultModal: false,
      });
    }

    expect(retainedAccessRevealEvent(events, "evt_access")).toBeNull();
    expect(latestStolenAgendaEvent(events, ["evt_access"])?.eventId).toBe(
      "evt_steal",
    );
    expect(latestStolenAgendaEvent(events, ["evt_steal"])).toBeNull();
    expect(
      matchOverlayPresentation({
        accessRevealAvailable: false,
        accessRevealDismissed: true,
        accessRevealKind: null,
        accessOutcomeKind: null,
        matchEnded: true,
        damagePresentationPending: false,
        resultAvailable: true,
        resultDismissed: false,
        runnerWonByAgendaPoints: true,
        terminalAccessFlatline: false,
      }),
    ).toMatchObject({
      showAccessReveal: false,
      showResultModal: true,
    });
  });

  it("shows the publicly stolen winning agenda after a redacted third R&D access for the Corp", () => {
    const hiddenAccess = event(
      "evt_access_3",
      "access_card",
      {
        actor: "runner",
        serverId: "rd",
        serverLabel: "R&D",
        accessOrigin: "rd",
        breachId: "breach_final",
        accessIndex: 2,
        effectiveAccessCount: 3,
        redactedKind: "accessed_card",
      },
      325,
    );
    const steal = event(
      "evt_final_steal",
      "steal_agenda",
      {
        actor: "runner",
        serverId: "rd",
        accessOrigin: "rd",
        accessIndex: 2,
        breachId: "breach_final",
        cardDefinitionId: "main_office_relocation",
        title: "Main-Office Relocation",
      },
      326,
    );
    const earlierSteal = event("evt_earlier_steal", "steal_agenda", {
      actor: "runner",
      title: "Earlier agenda",
      cardDefinitionId: "earlier",
      serverId: "hq",
    });
    const events = [earlierSteal, hiddenAccess, steal];
    const before = structuredClone(events);
    expect(
      accessRevealFromLatestEvent(hiddenAccess, {}, [], "corp", events),
    ).toBeNull();
    const revealEvent = latestStolenAgendaEvent(events, ["evt_access_3"]);
    const reveal = accessRevealFromLatestEvent(
      revealEvent ?? undefined,
      {},
      [],
      "corp",
      events,
    );
    expect(reveal).toMatchObject({
      eventId: "evt_final_steal",
      kind: "access",
      serverLabel: "R&D",
      outcomeKind: "stolen",
      card: {
        definitionId: "main_office_relocation",
        title: "Main-Office Relocation",
      },
      actions: [],
      dismissLabel: "Agenda bestätigen",
      hasMoreAccesses: false,
    });
    const presentation = (confirmed: boolean) =>
      matchOverlayPresentation({
        accessRevealAvailable: Boolean(reveal),
        accessRevealDismissed: confirmed,
        accessRevealKind: reveal?.kind ?? null,
        accessOutcomeKind: reveal?.outcomeKind ?? null,
        matchEnded: true,
        damagePresentationPending: false,
        resultAvailable: true,
        resultDismissed: false,
        runnerWonByAgendaPoints: true,
        terminalAccessFlatline: false,
      });
    expect(presentation(false)).toMatchObject({
      showAccessReveal: true,
      showResultModal: false,
    });
    expect(presentation(true)).toMatchObject({
      showAccessReveal: false,
      showResultModal: true,
    });
    expect(latestStolenAgendaEvent(events, ["evt_final_steal"])).toBeNull();
    expect(events).toEqual(before);
    expect(hiddenAccess.publicPayload).not.toHaveProperty("cardDefinitionId");
  });
});

function event(
  eventId: string,
  actionType: string,
  payload: Record<string, unknown>,
  stateVersionAfter = 1,
): PublicGameEvent {
  return {
    eventId,
    type: "action",
    stateVersionBefore: Math.max(0, stateVersionAfter - 1),
    stateVersionAfter,
    stateHashAfter: `fnv1a:${eventId}`,
    publicPayload: { actionType, ...payload },
  };
}
