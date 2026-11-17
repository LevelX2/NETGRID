import { describe, expect, it } from "vitest";
import type { MatchActionSubmission } from "@netgrid/shared";
import {
  applyAction,
  buildMatchPlayerOffer,
  bindMatchActionOffer,
  createGame,
  createGameAfterSetup,
  getPlayerView,
} from "../index";

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
    const offer = buildMatchPlayerOffer(getPlayerView(state, "runner"));
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
    const bound = bindMatchActionOffer(state, input);
    if (!("action" in bound)) throw new Error(bound.errorCode);
    expect(bound.action.selectedChoices?.selectedOptionIds).toEqual(["keep"]);
    expect(applyAction(state, bound.action).ok).toBe(true);
    expect(bindMatchActionOffer(state, { ...input, actionId: 99 })).toEqual({
      errorCode: "ERR_UNKNOWN_ACTION",
    });
    expect(bindMatchActionOffer(state, {
      ...input,
      selectedChoices: { choiceId: choice.choiceId, selectedOptionIds: [99] },
    })).toEqual({ errorCode: "ERR_INVALID_CHOICE" });
  });
});
