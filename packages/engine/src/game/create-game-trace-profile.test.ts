import { describe, expect, it } from "vitest";

import { createGame } from "./create-game";
import { hashStateSnapshot } from "../state-hash";

describe("createGame trace rules profile", () => {
  it("persists Modern Open as the authoritative default", () => {
    const state = createGame({ matchId: "modern-default", seed: "seed" });

    expect(state.traceRulesProfile).toBe("modern_open");
    expect(state.eventLog[0]?.publicPayload).toMatchObject({
      traceRulesProfile: "modern_open",
    });
  });

  it("binds an explicitly selected Classic profile into state and hash", () => {
    const classic = createGame({
      matchId: "classic",
      seed: "seed",
      traceRulesProfile: "classic_blind",
    });
    const modern = createGame({
      matchId: "classic",
      seed: "seed",
      traceRulesProfile: "modern_open",
    });

    expect(classic.traceRulesProfile).toBe("classic_blind");
    expect(classic.eventLog[0]?.publicPayload).toMatchObject({
      traceRulesProfile: "classic_blind",
    });
    expect(hashStateSnapshot(classic)).not.toBe(hashStateSnapshot(modern));
  });
});
