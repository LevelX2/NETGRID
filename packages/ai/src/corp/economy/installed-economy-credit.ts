import type { LegalAction } from "@netgrid/shared";

export function corpInstalledEconomyCreditAmount(action: LegalAction): number {
  const { gainCreditsAmount, cardImplementationCreditAmount } =
    action.payload ?? {};
  const presentAmounts = [
    gainCreditsAmount,
    cardImplementationCreditAmount,
  ].filter((amount) => amount !== undefined);
  const [amount] = presentAmounts;
  return typeof amount === "number" &&
    Number.isSafeInteger(amount) &&
    amount > 0 &&
    presentAmounts.every((quoted) => quoted === amount)
    ? amount
    : 0;
}
