import type { GameState, LegalAction } from "@netgrid/shared";
import { buildLegalAction } from "./action-builders";

export function buildRunnerGainCreditAction(state: GameState): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "gain_credit",
    "1 Credit nehmen",
    "basic_action",
    [{ clicks: 1 }],
  );
}

export function buildRunnerEndTurnAction(state: GameState): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "end_turn",
    "Zug beenden",
    "game_rule",
  );
}

export function buildRunnerRemoveTagAction(state: GameState): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "remove_tag",
    "Tag entfernen",
    "basic_action",
    [{ clicks: 1, credits: 2 }],
  );
}
