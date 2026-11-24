import type { PublicGameEvent } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { retainedAccessRevealEvent } from "./action-board-ui";
import { latestStolenAgendaEvent } from "./access-presentation";
import { matchOverlayPresentation } from "./match-overlay-presentation";
import { accessRevealFromLatestEvent } from "../features/actions/access-review-derivation";

describe("winning agenda access result sequence", () => {
  it("keeps the public R&D agenda access ahead of the finished result", () => {
    const earlierAccess = event(100, "access_card", {
      actor: "runner",
      cardDefinitionId: 517,
      title: "Team Restructuring",
      serverLabel: "R&D",
      accessOrigin: "rd",
      accessIndex: 0,
      effectiveAccessCount: 2,
    });
    const access = event(101, "access_card", {
      actor: "runner",
      cardDefinitionId: 411,
      title: "Employee Empowerment",
      serverLabel: "R&D",
      accessOrigin: "rd",
      accessIndex: 1,
      effectiveAccessCount: 2,
    });
    const steal = event(
      102,
      "steal_agenda",
      {
        actor: "runner",
        cardDefinitionId: 411,
        title: "Employee Empowerment",
        serverId: "rd",
        accessOrigin: "rd",
      },
      2,
    );
    const events = [earlierAccess, access, steal];
    const retained = retainedAccessRevealEvent(events, null);
    const details = {
      411: {
        catalogCardId: 411,
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

    expect(retained?.eventId).toBe(101);
    expect(latestStolenAgendaEvent(events, [])?.eventId).toBe(102);
    for (const side of ["runner", "corp"] as const) {
      const reveal = accessRevealFromLatestEvent(
        latestStolenAgendaEvent(events, []) ?? undefined,
        details,
        [],
        side,
        events,
      );
      expect(reveal).toMatchObject({
        eventId: 102,
        outcomeKind: "stolen",
        dismissLabel: "Agenda bestätigen",
        actions: [],
        card: {
          definitionId: 411,
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

    expect(retainedAccessRevealEvent(events, 101)).toBeNull();
    expect(latestStolenAgendaEvent(events, [101])?.eventId).toBe(
      102,
    );
    expect(latestStolenAgendaEvent(events, [102])).toBeNull();
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
      103,
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
      104,
      "steal_agenda",
      {
        actor: "runner",
        serverId: "rd",
        accessOrigin: "rd",
        accessIndex: 2,
        breachId: "breach_final",
        cardDefinitionId: 11035,
        title: "Main-Office Relocation",
      },
      326,
    );
    const earlierSteal = event(105, "steal_agenda", {
      actor: "runner",
      title: "Earlier agenda",
      cardDefinitionId: 11036,
      serverId: "hq",
    });
    const events = [earlierSteal, hiddenAccess, steal];
    const before = structuredClone(events);
    expect(
      accessRevealFromLatestEvent(hiddenAccess, {}, [], "corp", events),
    ).toBeNull();
    const revealEvent = latestStolenAgendaEvent(events, [103]);
    const reveal = accessRevealFromLatestEvent(
      revealEvent ?? undefined,
      {},
      [],
      "corp",
      events,
    );
    expect(reveal).toMatchObject({
      eventId: 104,
      kind: "access",
      serverLabel: "R&D",
      outcomeKind: "stolen",
      card: {
        definitionId: 11035,
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
    expect(latestStolenAgendaEvent(events, [104])).toBeNull();
    expect(events).toEqual(before);
    expect(hiddenAccess.publicPayload).not.toHaveProperty("cardDefinitionId");
  });
});

function event(
  eventId: number,
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
