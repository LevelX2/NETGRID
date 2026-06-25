import type { AiDecisionInput } from "@netgrid/shared";
import {
  eventRefreshesCentralTarget,
  serverIdFromEvent,
} from "../runtime/public-event-history";
import type { CentralServerId } from "../runtime/server-target";

export function recentCentralRunSameTargetWithoutRefresh(
  input: AiDecisionInput,
  target: CentralServerId,
): boolean {
  const history = centralRunHistory(input);
  let lastSameRun = -1;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index]!;
    if (
      serverIdFromEvent(event) === target &&
      (event.publicPayload.actionType === "start_run" ||
        event.type === "run_started")
    ) {
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
  const history = centralRunHistory(input);
  let streak = 0;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index]!;
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    if (
      actionType === "steal_agenda" ||
      actionType === "trash_accessed_card" ||
      actionType === "score_agenda"
    )
      break;
    if (serverIdFromEvent(event) === target && actionType === "start_run") {
      streak += 1;
      continue;
    }
    if (
      (target === "hq" &&
        (actionType === "draw_card" || actionType === "mandatory_draw")) ||
      (target === "rd" &&
        (actionType === "draw_card" ||
          actionType === "mandatory_draw" ||
          actionType === "shuffle_stack")) ||
      actionType === "install_card"
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

function centralRunHistory(input: AiDecisionInput) {
  return [...input.playerView.publicEvents, ...input.eventTail].sort(
    (left, right) =>
      (left.stateVersionAfter ?? 0) - (right.stateVersionAfter ?? 0),
  );
}
