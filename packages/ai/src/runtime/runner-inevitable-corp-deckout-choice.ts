import type { AiDecisionInput } from "@netgrid/shared";

import { semanticRuntimeChoiceWithEvidence } from "./semantic-runtime-score-components";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";

const INEVITABLE_CORP_DECKOUT_SCORE_FLOOR = 100_000;

export function runnerInevitableCorpDeckoutSemanticChoice(
  input: AiDecisionInput,
  choices: readonly SemanticRuntimeChoice[],
): SemanticRuntimeChoice | undefined {
  if (
    input.side !== "runner" ||
    input.playerView.winner !== null ||
    input.playerView.opponent.deckCount !== 0
  ) {
    return undefined;
  }
  const endTurnChoice = choices.find(
    (choice) => !choice.exclusion && choice.action.type === "end_turn",
  );
  if (!endTurnChoice) return undefined;
  return semanticRuntimeChoiceWithEvidence(endTurnChoice, {
    minimumScore: INEVITABLE_CORP_DECKOUT_SCORE_FLOOR,
    reasonCode: "runner.endgame.inevitable_corp_deckout",
    explanation:
      "Der Runner beendet den Zug, weil das sichtbare leere R&D den obligatorischen Corp-Draw zum sicheren Sieg macht.",
    evidence: [
      "runner_inevitable_corp_deckout:true",
      "corp_visible_deck_count:0",
      "runner_end_turn_legal:true",
    ],
  });
}
