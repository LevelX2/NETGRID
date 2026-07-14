import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

const COMFORTABLE_RUNNER_CREDIT_TARGET = 6;

export function runnerMarginalCreditYieldMultiplier(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  const credits = input.playerView.own.credits;
  if (credits < COMFORTABLE_RUNNER_CREDIT_TARGET) return 1;
  if (!runnerHasMeaningfulCreditConversionAlternative(input, action)) return 1;
  const excess = credits - COMFORTABLE_RUNNER_CREDIT_TARGET;
  if (excess >= 8) return 0.1;
  if (excess >= 4) return 0.25;
  if (excess >= 2) return 0.5;
  return 0.75;
}

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
