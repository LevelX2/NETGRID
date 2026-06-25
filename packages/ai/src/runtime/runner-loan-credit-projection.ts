import type { LegalAction } from "@netgrid/shared";

export function runnerProjectedCreditGainForAction(
  action: LegalAction,
): number {
  const payload = action.payload ?? {};
  const payloadValues = [
    payload.gainCreditsAmount,
    payload.gainedCredits,
    payload.creditsGained,
    payload.amount,
  ].filter((value): value is number => typeof value === "number");
  const payloadGain = Math.max(0, ...payloadValues);
  if (action.type === "gain_credit") return Math.max(1, payloadGain);
  if (
    action.type === "trigger_ability" ||
    action.type === "activated_card_ability" ||
    action.type === "play_event"
  ) {
    return payloadGain;
  }
  return 0;
}
