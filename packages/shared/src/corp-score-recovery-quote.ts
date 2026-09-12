/** Own-side facts for one current Archives recovery action, not future actions. */
export type CorpScoreRecoveryQuote = Readonly<{
  schemaVersion: "corp-score-recovery-quote-v1";
  actionId: string;
  sourceCardId: string;
  stateVersion: number;
  options: readonly Readonly<{
    cardId: string;
    definitionId: string;
    playClicks: number;
    playCredits: number;
    advancementAmount: number;
  }>[];
}>;
