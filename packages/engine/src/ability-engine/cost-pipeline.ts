import type {
  CardDefinitionId,
  CardInstanceId,
  Cost,
  LegalAction,
} from "@netgrid/shared";

export type CostPurpose = "corp_rez";

export type CorpRezCostOptions = {
  oliviaSalazarSourceCardId?: CardInstanceId;
};

export type CostModifierQuote = {
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  label: string;
  amount: number;
  kind: "reduction" | "increase" | "alternate_payment" | "restricted_credit";
};

export type CostQuote = {
  purpose: CostPurpose;
  side: "corp";
  targetCardId: CardInstanceId;
  baseCredits: number;
  finalCredits: number;
  costs: Cost[];
  modifiers: CostModifierQuote[];
  canPay: boolean;
  publicPayload: NonNullable<LegalAction["payload"]>;
};

export function costQuoteToLegalActionCosts(quote: CostQuote): Cost[] {
  return quote.costs.map((cost) => ({ ...cost }));
}

export function costQuotePublicPayload(
  quote: CostQuote,
): NonNullable<LegalAction["payload"]> {
  return { ...quote.publicPayload };
}
