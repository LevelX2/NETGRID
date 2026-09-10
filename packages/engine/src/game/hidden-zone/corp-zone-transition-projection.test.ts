import type {
  CardDefinitionId,
  CardInstanceId,
  LegalAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { createGame } from "../create-game";
import {
  quoteHqArchivesShuffleDrawZoneTransition,
  quoteHqShuffleRedrawZoneTransition,
} from "./corp-zone-transition-projection";

describe("Corp composite zone transition projection", () => {
  it("projects a Rescheduler refresh as hand- and deck-neutral", () => {
    const state = createGame({
      seed: "corp-zone-transition-rescheduler",
      setupMode: "completed",
    });
    state.timingPoint = "corp_action.main";
    state.corp.hq = ids("hq", 3);
    state.corp.rd = ids("rd", 4);
    state.corp.archives = ids("archives", 2);
    const action = legalAction(state.stateVersion, state.timingPoint);

    const quote = quoteHqShuffleRedrawZoneTransition(
      state,
      action,
      "rescheduler" as CardInstanceId,
      "onr_v1_336_rescheduler" as CardDefinitionId,
    );

    expect(quote).toMatchObject({
      complete: true,
      kind: "shuffle_hq_into_rd_then_draw_same_count",
      grossDrawCount: 3,
      postDrawDispositionCount: 0,
      hqCardsRecycledBeforeDrawCount: 3,
      archivesCardsRecycledBeforeDrawCount: 0,
      netHqDelta: 0,
      netRdDelta: 0,
      netRdConsumption: 0,
    });
  });

  it("fails a HQ/Archives recycle draw closed when the merged pool is too small", () => {
    const state = createGame({
      seed: "corp-zone-transition-ai-cfo",
      setupMode: "completed",
    });
    state.timingPoint = "corp_action.main";
    state.corp.hq = ids("hq", 1);
    state.corp.rd = ids("rd", 1);
    state.corp.archives = ids("archives", 1);
    const action = legalAction(state.stateVersion, state.timingPoint);

    const quote = quoteHqArchivesShuffleDrawZoneTransition(
      state,
      action,
      "ai-cfo" as CardInstanceId,
      "onr_v1_188_ai-chief-financial-officer" as CardDefinitionId,
      5,
    );

    expect(quote).toMatchObject({
      complete: false,
      resolution: "corp_deckout_before_completion",
      kind: "shuffle_hq_archives_into_rd_then_draw",
      grossDrawCount: 5,
      hqCardsRecycledBeforeDrawCount: 1,
      archivesCardsRecycledBeforeDrawCount: 1,
      netHqDelta: 4,
      netRdDelta: -3,
      netRdConsumption: 3,
    });
  });
});

function ids(prefix: string, count: number): CardInstanceId[] {
  return Array.from(
    { length: count },
    (_, index) => `${prefix}-${index + 1}` as CardInstanceId,
  );
}

function legalAction(
  stateVersion: number,
  timingPoint: LegalAction["timingPoint"],
): LegalAction {
  return {
    actionId: "corp.composite-zone-transition",
    side: "corp",
    type: "gain_credit",
    label: "Composite zone transition",
    source: "test-source",
    costs: [],
    targetRequirements: [],
    timingPoint,
    visibility: "private_to_actor",
    expiresAtStateVersion: stateVersion,
  };
}
