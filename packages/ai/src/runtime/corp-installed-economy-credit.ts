import { type LegalAction } from "@netgrid/shared";

export function corpInstalledEconomyCreditAmount(action: LegalAction): number {
  const payloadAmount = Number(
    action.payload?.cardImplementationCreditAmount ?? 0,
  );
  if (Number.isFinite(payloadAmount) && payloadAmount > 0) return payloadAmount;
  const match = action.label.match(/(\d+)\s+Credits?\s+nehmen/i);
  if (!match) return 0;
  const labelAmount = Number(match[1]);
  return Number.isFinite(labelAmount) ? labelAmount : 0;
}
