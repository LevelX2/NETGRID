import { describe, expect, it } from "vitest";
import { rankKnownRemoteAccessTargets } from "./access-target-ranking";
import type { KnownRemoteAccessCandidate } from "./access-target-ranking";

describe("known remote access target ranking", () => {
  it("keeps agendas above trash targets", () => {
    expect(
      rankKnownRemoteAccessTargets([
        candidate("root:1", "asset", "trash", "trash_affordable", 20),
        candidate("root:0", "agenda", "steal", "agenda_payoff", 1),
      ])[0]?.positionKey,
    ).toBe("root:0");
  });

  it("does not prefer a cheap low-value upgrade over a valuable asset", () => {
    const ranked = rankKnownRemoteAccessTargets([
      candidate("root:0", "upgrade", "trash", "trash_affordable", 1),
      candidate("root:1", "asset", "trash", "trash_affordable", 8),
    ]);

    expect(ranked.map((entry) => entry.positionKey)).toEqual([
      "root:1",
      "root:0",
    ]);
  });

  it("keeps deterministic position order for tied targets", () => {
    expect(
      rankKnownRemoteAccessTargets([
        candidate("root:2", "asset", "trash", "trash_affordable", 4),
        candidate("root:1", "asset", "trash", "trash_affordable", 4),
      ]).map((entry) => entry.positionKey),
    ).toEqual(["root:1", "root:2"]);
  });
});

function candidate(
  positionKey: string,
  targetKind: KnownRemoteAccessCandidate["targetKind"],
  intent: KnownRemoteAccessCandidate["commitment"]["intendedAccessAction"],
  reason: KnownRemoteAccessCandidate["commitment"]["reason"],
  valueScore: number,
): KnownRemoteAccessCandidate {
  return {
    positionKey,
    definitionId: `${targetKind}-${positionKey}`,
    targetKind,
    valueScore,
    commitment: {
      serverId: "remote_1",
      knownAccessState:
        intent === "decline" ? "known_no_current_payoff" : "known_payoff",
      intendedAccessAction: intent,
      reason,
      evidence: [],
    },
    projection: {
      source: "pre_run",
      serverId: "remote_1",
      target: targetKind,
      intendedAccessAction: intent,
      projections: [],
      evidence: [],
    },
  };
}

