import { type LegalAction } from "@netgrid/shared";

export function corpInstalledEconomyCreditAmount(action: LegalAction): number {
  const payloadAmount = Math.max(
    Number(action.payload?.gainCreditsAmount ?? 0),
    Number(action.payload?.cardImplementationCreditAmount ?? 0),
  );
  if (Number.isFinite(payloadAmount) && payloadAmount > 0) return payloadAmount;
  return 0;
}
