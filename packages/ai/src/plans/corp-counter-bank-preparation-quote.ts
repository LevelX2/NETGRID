import {
  CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
  type AiDecisionInput,
  type VisibleCard,
  type VisibleCorpCounterBankPreparationQuote,
} from "@netgrid/shared";

/**
 * Revalidates the current Engine quote before plan code treats a visible card
 * as a counter bank. The quote proves capability and current location only;
 * strategic use remains with the owning score plan.
 */
export function readCorpCounterBankPreparationQuote(
  input: AiDecisionInput,
  card: VisibleCard,
  expectedLocation: "corp_hq" | "installed_root",
  expectedServerId?: string,
): VisibleCorpCounterBankPreparationQuote | undefined {
  const quote = card.counterBankPreparationQuote;
  if (
    !card.known ||
    !card.definitionId ||
    quote?.schemaVersion !==
      CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION ||
    quote.context !== "corp_counter_bank_preparation" ||
    quote.sourceCardId !== card.instanceId ||
    quote.expiresAtStateVersion !== input.playerView.stateVersion ||
    !Number.isSafeInteger(quote.advancementCounters) ||
    quote.advancementCounters < 0 ||
    quote.advancementCounters !== Math.max(0, card.advancementCounters ?? 0) ||
    quote.advanceableBeforeRez !== true ||
    quote.activatedAbilitiesRequireRez !== true ||
    quote.cashout.advancementCounterCost !== 1 ||
    quote.cashout.creditGain !== 1 ||
    quote.cashout.actionCost !== 0 ||
    quote.transfer.actionCost !== 1 ||
    quote.transfer.minimumSourceCounters !== 1 ||
    quote.transfer.source !== "source_card" ||
    quote.transfer.target !== "chosen_installed_advanceable_card" ||
    quote.transfer.maximum !== "all" ||
    (expectedLocation === "corp_hq"
      ? quote.location.kind !== "corp_hq"
      : quote.location.kind !== "installed_root" ||
        quote.location.serverId !== expectedServerId)
  ) {
    return undefined;
  }
  return quote;
}
