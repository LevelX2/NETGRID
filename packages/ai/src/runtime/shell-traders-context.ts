import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import { shellTradersAbility } from "./shell-traders-action";

export function shellTradersDirectInstallAction(
  input: AiDecisionInput,
  action: LegalAction,
): LegalAction | undefined {
  const targetCardId =
    typeof action.payload?.targetCardId === "string"
      ? action.payload.targetCardId
      : "";
  if (!targetCardId) return undefined;
  return input.legalActions.find(
    (candidate) =>
      candidate.type === "install_card" && candidate.source === targetCardId,
  );
}

export function shellTradersBacklog(input: AiDecisionInput): {
  preparedCount: number;
  nearInstallCount: number;
} {
  const preparedCards =
    input.playerView.specialZones?.setAside.filter(
      (card) =>
        card.known &&
        card.owner === "runner" &&
        card.counters?.shell !== undefined,
    ) ?? [];
  return {
    preparedCount: preparedCards.length,
    nearInstallCount: preparedCards.filter(
      (card) => Math.max(0, card.counters?.shell ?? 0) <= 1,
    ).length,
  };
}

export function shellTradersImmediateRemoveAvailable(
  input: AiDecisionInput,
): boolean {
  return input.legalActions.some(
    (action) =>
      action.type === "trigger_ability" &&
      shellTradersAbility(action) === "remove_shell_counter" &&
      typeof action.payload?.remainingCountersBefore === "number" &&
      action.payload.remainingCountersBefore <= 1,
  );
}

export function shellTradersPrepareBaselinePenalty(
  input: AiDecisionInput,
  backlog: { preparedCount: number; nearInstallCount: number },
  immediateRemoveAvailable: boolean,
): number {
  let penalty = 0;
  if (backlog.preparedCount >= 2)
    penalty += 240 + Math.max(0, backlog.preparedCount - 2) * 55;
  else if (backlog.preparedCount === 1) penalty += 70;
  if (immediateRemoveAvailable) penalty += 120;
  if (backlog.nearInstallCount > 0) penalty += backlog.nearInstallCount * 40;
  if (input.playerView.own.credits <= 1 && backlog.preparedCount >= 2)
    penalty += 70;
  return penalty;
}
