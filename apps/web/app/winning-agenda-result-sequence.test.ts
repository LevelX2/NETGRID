import type { PublicGameEvent } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { retainedAccessRevealEvent } from "./action-board-ui";
import { latestStolenAgendaAccessEvent } from "./access-presentation";
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
    expect(latestStolenAgendaAccessEvent(events, [])?.eventId).toBe(
      "evt_access",
    );
    for (const side of ["runner", "corp"] as const) {
      const reveal = accessRevealFromLatestEvent(
        retained ?? undefined,
        details,
        [],
        side,
        events,
      );
      expect(reveal).toMatchObject({
        eventId: "evt_access",
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
    expect(latestStolenAgendaAccessEvent(events, ["evt_access"])).toBeNull();
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
