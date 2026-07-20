import { describe, expect, it } from "vitest";
import type { PublicMatchEntry } from "../../lib/client-api";
import {
  publicMatchActionLabel,
  publicMatchParticipantLabel,
  publicMatchTarget,
} from "./public-match-navigation";

function entry(status: PublicMatchEntry["status"]): PublicMatchEntry {
  return {
    matchId: "match mit leerzeichen",
    status,
    matchMode: "human_vs_human",
    matchFormat: "single_game",
    createdAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-20T10:01:00.000Z",
    participantNames: { runner: "Ada", corp: "Grace" },
  };
}

describe("public match navigation", () => {
  it("maps every public match status to the intended action", () => {
    expect(publicMatchActionLabel("open")).toBe("Beitreten");
    expect(publicMatchActionLabel("active")).toBe("Zuschauen");
    expect(publicMatchActionLabel("finished")).toBe("Replay ansehen");
  });

  it("routes active and finished matches without creating a route for open joins", () => {
    expect(publicMatchTarget(entry("open"))).toBeUndefined();
    expect(publicMatchTarget(entry("active"))).toBe(
      "/spectate?matchId=match%20mit%20leerzeichen",
    );
    expect(publicMatchTarget(entry("finished"))).toBe(
      "/replays?matchId=match%20mit%20leerzeichen",
    );
  });

  it("shows both known participants", () => {
    expect(publicMatchParticipantLabel(entry("active"))).toBe("Ada vs Grace");
  });
});
