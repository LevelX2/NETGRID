import { describe, expect, it } from "vitest";
import type { ApiSidePayload, LegalAction, PlayerView } from "@netgrid/shared";

import { latestSideUpdate } from "./client-payload-helpers";

function update(
  matchVersion: number,
  stateVersion: number,
  clicks: number,
): ApiSidePayload {
  const action = {
    type: clicks ? "gain_credit" : "end_turn",
    side: "corp",
  } as LegalAction;
  return {
    matchId: "match_credit",
    side: "corp",
    matchVersion,
    playerView: {
      stateVersion,
      own: { clicks },
      legalActions: [action],
    } as PlayerView,
  } as ApiSidePayload;
}

describe("authoritative match updates", () => {
  it("applies the last click together with the new legal actions", () => {
    const next = latestSideUpdate(update(7, 51, 1), update(8, 52, 0));
    expect(next.playerView.own.clicks).toBe(0);
    expect(next.playerView.legalActions.map((action) => action.type)).toEqual([
      "end_turn",
    ]);
  });

  it("accepts an authoritative undo and rejects older match versions", () => {
    const discarded = update(8, 52, 0);
    const restored = update(10, 51, 1);
    expect(latestSideUpdate(discarded, restored)).toBe(restored);
    expect(latestSideUpdate(restored, discarded)).toBe(restored);
  });
});
