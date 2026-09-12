import type {
  AiDecisionInput,
  CorpScoreRecoveryQuote,
  LegalAction,
} from "@netgrid/shared";

export type CorpScoreRecoveryPreparation = {
  action: LegalAction;
  option: CorpScoreRecoveryQuote["options"][number];
};

export function corpScoreRecoveryPreparations(
  input: AiDecisionInput,
): CorpScoreRecoveryPreparation[] {
  const result: CorpScoreRecoveryPreparation[] = [];
  for (const action of input.legalActions) {
    const q = action.corpScoreRecoveryQuote;
    if (
      !q ||
      q.schemaVersion !== "corp-score-recovery-quote-v1" ||
      action.side !== "corp" ||
      action.type !== "play_operation" ||
      action.expiresAtStateVersion !== input.playerView.stateVersion ||
      q.stateVersion !== input.playerView.stateVersion ||
      q.actionId !== action.actionId ||
      q.sourceCardId !== action.source ||
      !Array.isArray(q.options) ||
      !input.playerView.own.gripOrHq.some(
        (c) => c.known && c.instanceId === q.sourceCardId,
      ) ||
      action.costs.some((c) =>
        Object.keys(c).some((k) => k !== "clicks" && k !== "credits"),
      ) ||
      action.costs.some((c) =>
        [c.clicks, c.credits].some(
          (n) => n !== undefined && (!Number.isSafeInteger(n) || n < 0),
        ),
      )
    )
      continue;
    for (const option of q.options) {
      if (
        !option ||
        !input.playerView.own.heapOrArchives.some(
          (c) =>
            c.known &&
            c.instanceId === option.cardId &&
            c.definitionId === option.definitionId &&
            c.type === "operation",
        ) ||
        input.playerView.own.gripOrHq.some(
          (c) => c.instanceId === option.cardId,
        ) ||
        ![
          option.playClicks,
          option.playCredits,
          option.advancementAmount,
        ].every((n) => Number.isSafeInteger(n) && n >= 0) ||
        option.playClicks <= 0 ||
        option.advancementAmount <= 0
      )
        continue;
      result.push({ action, option });
    }
  }
  return result;
}
