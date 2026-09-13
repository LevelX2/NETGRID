import { describe, expect, it } from "vitest";
import type { ApiSidePayload, LegalAction, PlayerView } from "@netgrid/shared";

import {
  withPlayerView,
  withVersionedLegalActions,
} from "./client-payload-helpers";

const credit = {
  actionId: "corp.gain_credit",
  type: "gain_credit",
  side: "corp",
} as LegalAction;
const endTurn = {
  actionId: "corp.end_turn",
  type: "end_turn",
  side: "corp",
} as LegalAction;

function view(
  stateVersion: number,
  clicks: number,
  legalActions: LegalAction[],
): PlayerView {
  return { stateVersion, own: { clicks }, legalActions } as PlayerView;
}

function beforeLastCredit(): ApiSidePayload {
  return {
    matchId: "match_credit",
    playerView: view(51, 1, [credit]),
    legalActions: [credit],
  } as ApiSidePayload;
}

describe("authoritative match actions", () => {
  it("removes Take credit together with the last click, before the separate actions message arrives", () => {
    const next = withPlayerView(beforeLastCredit(), view(52, 0, [endTurn]));
    expect(next.playerView.own.clicks).toBe(0);
    expect(next.legalActions.map((action) => action.actionId)).toEqual([
      "corp.end_turn",
    ]);
    expect(next.legalActions).toBe(next.playerView.legalActions);
  });

  it("keeps credit taking available when a click remains", () => {
    const next = withPlayerView(beforeLastCredit(), view(52, 1, [credit]));
    expect(next.legalActions).toEqual([credit]);
  });

  it.each([51, 53, undefined])(
    "does not replace current actions with an unbound delivery (%s)",
    (stateVersion) => {
      const next = withPlayerView(beforeLastCredit(), view(52, 0, [endTurn]));
      expect(
        withVersionedLegalActions(next, {
          ...(stateVersion === undefined ? {} : { stateVersion }),
          legalActions: [credit],
        }),
      ).toBe(next);
    },
  );

  it("keeps both action lists coherent for a matching delivery", () => {
    const next = withVersionedLegalActions(beforeLastCredit(), {
      stateVersion: 51,
      legalActions: [endTurn],
    });
    expect(next.legalActions).toEqual([endTurn]);
    expect(next.playerView.legalActions).toBe(next.legalActions);
  });

  it("accepts an authoritative undo together with its restored actions", () => {
    const exhausted = withPlayerView(
      beforeLastCredit(),
      view(52, 0, [endTurn]),
    );
    const restored = withPlayerView(exhausted, view(51, 1, [credit]));
    expect(restored.playerView.stateVersion).toBe(51);
    expect(restored.legalActions).toEqual([credit]);
  });
});
