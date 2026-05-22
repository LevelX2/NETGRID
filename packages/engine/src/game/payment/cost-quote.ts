/**
 * ARCH-7 Payment-/CostQuote-Helfer.
 * Keine State-Mutation, keine LegalAction-Erzeugung, keine Action-Ausführung.
 * Revalidation bleibt an Quote gekoppelt; kein Import aus index.ts.
 */
import type {
  CardDefinitionId,
  CardInstanceId,
  Cost,
  LegalAction,
} from "@netgrid/shared";

export type CostPurpose = "corp_rez" | "corp_install";

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

/**
 * Converts an immutable quote into LegalAction costs so action generation and
 * revalidation use the same cost vocabulary.
 */
export function costQuoteToLegalActionCosts(quote: CostQuote): Cost[] {
  return quote.costs.map((cost) => ({ ...cost }));
}

export function costQuotePublicPayload(
  quote: CostQuote,
): NonNullable<LegalAction["payload"]> {
  return { ...quote.publicPayload };
}
