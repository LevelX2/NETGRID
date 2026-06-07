import { describe, expect, it } from "vitest";
import { aiDecisionDebugHqHandRows } from "./ai-decision-debug-ui";

describe("aiDecisionDebugHqHandRows", () => {
  it("formats safe, ambiguous and unknown HQ hand memory from redacted ledger summary", () => {
    const rows = aiDecisionDebugHqHandRows({
      handCount: 4,
      knownCount: 2,
      allCardsKnown: false,
      safeKnownCards: [
        { definitionId: "simple_economy_operation", title: "Simple Economy Operation", type: "operation", count: 2 },
      ],
      summary: {
        safeKnownCount: 2,
        ambiguousCount: 1,
        unknownCount: 1,
        candidateGroupCount: 1,
      },
      candidateGroups: [
        {
          category: "hidden_root_install",
          serverId: "remote_1",
          ambiguousCount: 1,
          unknownCandidateCount: 0,
          departureCount: 1,
        },
      ],
    });

    expect(rows).toContainEqual([
      "HQ-Hand-Wissen",
      "2 sicher bekannt / 1 unklar / 1 unbekannt · teilweise",
    ]);
    expect(rows).toContainEqual([
      "HQ-Hand-Inhalt",
      "Simple Economy Operation x2 (operation) · 1 unklar · 1 unbekannt",
    ]);
    expect(rows).toContainEqual([
      "HQ-Hand-Kandidaten",
      "Remote 1: Root-Install-Kandidaten · 1 unklar · 1 abgegangen",
    ]);
    expect(JSON.stringify(rows)).not.toMatch(
      /cardInstances|privatePayload|FullState|sessionToken|reconnectToken|joinToken|decklist|hidden-card/i,
    );
  });

  it("keeps the old known-count display when the ledger summary is missing", () => {
    const rows = aiDecisionDebugHqHandRows({
      handCount: 3,
      knownCount: 1,
      allCardsKnown: false,
      knownCards: [
        { definitionId: "simple_agenda", title: "Simple Agenda", type: "agenda", count: 1 },
      ],
    });

    expect(rows).toEqual([
      ["HQ-Hand-Wissen", "1/3 Karten namentlich bekannt · teilweise"],
      ["HQ-Hand-Inhalt", "Simple Agenda (agenda) · 2 unbekannt"],
    ]);
  });
});
