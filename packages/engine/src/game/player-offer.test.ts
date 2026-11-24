import { describe, expect, it, vi } from "vitest";
import type { MatchActionSubmission } from "@netgrid/shared";
import {
  applyAction,
  applyMatchActionOffer,
  buildMatchPlayerOffer,
  createGame,
  createGameAfterSetup,
  getPlayerView,
} from "../index";
import * as legalActions from "./legal-actions";

describe("numeric match action offers", () => {
  it("numbers the authoritative side's ordered actions deterministically", () => {
    const state = createGameAfterSetup({ seed: "match-offer-order" });
    const view = getPlayerView(state, "corp");
    const offer = buildMatchPlayerOffer(view);

    expect(offer.legalActions.map((action) => action.actionId)).toEqual(
      view.legalActions.map((_, index) => index + 1),
    );
    expect(buildMatchPlayerOffer(getPlayerView(state, "corp"))).toEqual(offer);
    expect(buildMatchPlayerOffer(getPlayerView(state, "runner")).legalActions).toEqual([]);
  });

  it("binds numeric choice and option IDs to their authoritative values", () => {
    const state = createGame({ seed: "match-offer-choice" });
    const view = getPlayerView(state, "runner");
    const offer = buildMatchPlayerOffer(view);
    const choice = offer.pendingChoice!;
    const action = offer.legalActions.find((action) => action.type === "resolve_choice")!;
    const keep = choice.options.find((option) => option.presentation === "keep")!;
    const input: MatchActionSubmission = {
      matchId: state.matchId,
      side: "runner",
      actionId: action.actionId,
      clientKnownMatchVersion: 1,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "keep-opening-hand",
      selectedChoices: {
        choiceId: choice.choiceId,
        selectedOptionIds: [keep.id],
      },
    };
    expect(choice.choiceId).toBe(state.stateVersion + 1);
    expect(choice.options.map((option) => option.id)).toEqual([1, 2]);
    expect(action.choiceRequirements?.[0]?.optionIds).toEqual([1, 2]);
    expect(action.payload?.choiceId).toBe(choice.choiceId);
    const expected = applyAction(state, {
      matchId: state.matchId,
      side: input.side,
      clientKnownStateVersion: input.clientKnownStateVersion,
      idempotencyKey: input.idempotencyKey,
      actionId: view.legalActions[action.actionId - 1]!.actionId,
      selectedChoices: {
        choiceId: view.pendingChoice!.choiceId,
        selectedOptionIds: ["keep"],
      },
    });
    expect(expected.ok).toBe(true);
    const actionGeneration = vi.spyOn(legalActions, "getLegalActions");
    try {
      expect(applyMatchActionOffer(state, input)).toEqual(expected);
      expect(actionGeneration).toHaveBeenCalledExactlyOnceWith(state, "runner");
    } finally {
      actionGeneration.mockRestore();
    }
    expect(applyMatchActionOffer(state, { ...input, actionId: 99 })).toMatchObject({
      ok: false,
      error: { code: "ERR_UNKNOWN_ACTION" },
    });
    expect(applyMatchActionOffer(state, {
      ...input,
      selectedChoices: { choiceId: choice.choiceId, selectedOptionIds: [99] },
    })).toMatchObject({ ok: false, error: { code: "ERR_INVALID_CHOICE" } });
    expect(applyMatchActionOffer(state, {
      ...input,
      selectedChoices: { choiceId: choice.choiceId, selectedOptionIds: [] },
    })).toMatchObject({ ok: false, error: { code: "ERR_INVALID_CHOICE" } });
    expect(applyMatchActionOffer(state, {
      ...input,
      clientKnownStateVersion: state.stateVersion + 1,
    })).toMatchObject({ ok: false, error: { code: "ERR_STALE_STATE" } });
    expect(applyMatchActionOffer(state, { ...input, side: "corp" })).toMatchObject({
      ok: false,
      error: { code: "ERR_UNKNOWN_ACTION" },
    });
  });
});
