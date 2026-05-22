/**
 * Compatibility re-export for ARCH-7 Payment-/CostQuote-Helfer.
 *
 * The implementation lives in game/payment. Keep this path for existing
 * imports while avoiding a second CostQuote source of truth.
 */
export type {
  CorpInstallCostOptions,
  CorpRezCostOptions,
  CostModifierQuote,
  CostPurpose,
  CostQuote,
} from "../game/payment";
export {
  assertCorpRezCostQuoteValid,
  corpServerIdForInstalledCard,
  costQuotePublicPayload,
  costQuoteToLegalActionCosts,
  oliviaSalazarRezSourcesForRunIce,
  quoteCorpIceInstallCost,
  quoteCorpRezCost,
  rezCostForCard,
  rezCostReductionSourceDefinitionIdsFor,
} from "../game/payment";
