import type { AiDecisionInput } from "@netgrid/shared";
import {
  eventRefreshesCentralTarget,
  mergedPublicHistory,
  runStartServerIdFromEvent,
} from "../public-event-history";
import type { CentralServerId } from "../runtime/server-target";

export function recentCentralRunSameTargetWithoutRefresh(
  input: AiDecisionInput,
  target: CentralServerId,
): boolean {
  const history = mergedPublicHistory(input);
  let lastSameRun = -1;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index]!;
    if (runStartServerIdFromEvent(event) === target) {
      lastSameRun = index;
      break;
    }
  }
  if (lastSameRun < 0) return false;
  const last = history[lastSameRun];
  if (
    !last ||
    input.playerView.stateVersion - (last.stateVersionAfter ?? 0) > 8
  )
    return false;
  const after = history.slice(lastSameRun + 1);
  return !after.some((event) => eventRefreshesCentralTarget(event, target));
}

export function centralRunStreakWithoutValueForMetrics(
  input: AiDecisionInput,
  target: CentralServerId,
): number {
  const history = mergedPublicHistory(input);
  let streak = 0;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index]!;
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    const actor =
      typeof event.publicPayload.actor === "string"
        ? event.publicPayload.actor
        : undefined;
    if (runStartServerIdFromEvent(event) === target) {
      streak += 1;
      continue;
    }
    if (
      actionType === "score_agenda" ||
      eventRefreshesCentralTarget(event, target) ||
      (actor === "runner" && actionType === "install_card")
    )
      break;
  }
  return streak;
}

export function isRepeatedLowValueCentralRunForMetrics(
  input: AiDecisionInput,
  target: CentralServerId,
): boolean {
  return centralRunStreakWithoutValueForMetrics(input, target) > 0;
}

export function centralRepeatHasFreshValueForMetrics(
  input: AiDecisionInput,
  target: CentralServerId,
  context: {
    matchingInterface: boolean;
    anyMultiaccessInstalled: boolean;
    eventGoodTarget: boolean;
    trueCloseout: boolean;
  },
): boolean {
  if (
    context.matchingInterface ||
    context.anyMultiaccessInstalled ||
    context.eventGoodTarget ||
    context.trueCloseout
  )
    return true;
  return !recentCentralRunSameTargetWithoutRefresh(input, target);
}
