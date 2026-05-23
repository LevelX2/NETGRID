import type { GameState, LegalAction } from "@netgrid/shared";
import { buildLegalAction } from "./action-builders";

export function buildCorpGainCreditAction(state: GameState): LegalAction {
  return buildLegalAction(
    state,
    "corp",
    "gain_credit",
    "1 Credit nehmen",
    "basic_action",
    [{ clicks: 1 }],
  );
}

export function buildCorpDrawAction(state: GameState): LegalAction {
  return buildLegalAction(
    state,
    "corp",
    "draw_card",
    "Karte ziehen",
    "basic_action",
    [{ clicks: 1 }],
  );
}

export function buildCorpEndTurnAction(state: GameState): LegalAction {
  return buildLegalAction(
    state,
    "corp",
    "end_turn",
    "Zug beenden",
    "game_rule",
  );
}

export function buildCorpPurgeVirusAction(state: GameState): LegalAction {
  return buildLegalAction(
    state,
    "corp",
    "purge_virus_counters",
    "Virus-Counter purgen",
    "basic_action",
    [{ clicks: 3 }],
    { purgedCounterType: "virus" },
    { targetRequirements: [] },
  );
}
