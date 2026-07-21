import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

export function runnerHasMeaningfulCreditConversionAlternative(
  input: AiDecisionInput,
  selectedAction: LegalAction,
): boolean {
  return input.legalActions.some(
    (candidate) =>
      candidate.actionId !== selectedAction.actionId &&
      isMeaningfulCreditConversionAction(candidate),
  );
}

function isMeaningfulCreditConversionAction(action: LegalAction): boolean {
  if (
    action.type === "draw_card" ||
    action.type === "install_card" ||
    action.type === "play_event" ||
    action.type === "start_run"
  ) {
    return true;
  }
  if (
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  ) {
    return false;
  }
  if (positivePayloadNumber(action, "gainCreditsAmount") > 0) return false;
  if (positivePayloadNumber(action, "gainedCredits") > 0) return false;
  if (action.payload?.cardImplementationAddsHostedCredits === true)
    return false;
  return true;
}

function positivePayloadNumber(action: LegalAction, key: string): number {
  const value = action.payload?.[key];
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}
