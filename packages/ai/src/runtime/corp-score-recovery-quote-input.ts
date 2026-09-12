import type { CorpScoreRecoveryQuote, LegalAction } from "@netgrid/shared";

export function sanitizeCorpScoreRecoveryQuote(
  action: LegalAction,
): CorpScoreRecoveryQuote | undefined {
  const value = action.corpScoreRecoveryQuote;
  if (value === undefined) return undefined;
  const q = value as CorpScoreRecoveryQuote;
  if (
    !q ||
    typeof q !== "object" ||
    q.schemaVersion !== "corp-score-recovery-quote-v1" ||
    action.side !== "corp" ||
    action.type !== "play_operation" ||
    q.actionId !== action.actionId ||
    q.sourceCardId !== action.source ||
    q.stateVersion !== action.expiresAtStateVersion ||
    !Array.isArray(q.options) ||
    q.options.some(
      (o) =>
        !o ||
        typeof o.cardId !== "string" ||
        typeof o.definitionId !== "string" ||
        ![o.playClicks, o.playCredits, o.advancementAmount].every(
          (n) => Number.isSafeInteger(n) && n >= 0,
        ) ||
        o.playClicks <= 0 ||
        o.advancementAmount <= 0,
    )
  )
    throw new Error("invalid_corp_score_recovery_quote_binding");
  return {
    schemaVersion: q.schemaVersion,
    actionId: q.actionId,
    sourceCardId: q.sourceCardId,
    stateVersion: q.stateVersion,
    options: q.options.map((o) => ({
      cardId: o.cardId,
      definitionId: o.definitionId,
      playClicks: o.playClicks,
      playCredits: o.playCredits,
      advancementAmount: o.advancementAmount,
    })),
  };
}
