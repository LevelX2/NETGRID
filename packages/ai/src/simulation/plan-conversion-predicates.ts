export type PlanConversionDecisionEntry = {
  side?: string;
  actionType?: string;
  advancementCountersAdded?: number;
  runnerRelevantRemoteTrashTaken?: boolean;
  runnerHandUseActionTaken?: boolean;
};

const NON_STRATEGIC_ACTION_TYPES = [
  "continue_run",
  "access_card",
  "mandatory_draw",
  "pump_breaker",
  "break_subroutine",
  "decline_rez",
  "approach_ice",
  "encounter_ice",
];

const RUNNER_STRATEGIC_ACTION_TYPES = [
  "install_card",
  "play_event",
  "start_run",
  "gain_credit",
  "draw_card",
  "trash_accessed_card",
  "jack_out",
  "activated_card_ability",
  "trigger_ability",
  "end_turn",
];

const CORP_STRATEGIC_ACTION_TYPES = [
  "score_agenda",
  "advance_card",
  "install_card",
  "play_operation",
  "gain_credit",
  "draw_card",
  "rez_ice",
  "activated_card_ability",
  "trigger_ability",
  "end_turn",
];

export function isStrategicPlanDecision(
  entry: PlanConversionDecisionEntry,
): boolean {
  if (NON_STRATEGIC_ACTION_TYPES.includes(entry.actionType ?? ""))
    return false;
  if (entry.actionType === "resolve_choice")
    return (
      entry.advancementCountersAdded !== undefined ||
      entry.runnerRelevantRemoteTrashTaken === true ||
      entry.runnerHandUseActionTaken === true
    );
  if (entry.side === "runner") {
    return RUNNER_STRATEGIC_ACTION_TYPES.includes(entry.actionType ?? "");
  }
  return CORP_STRATEGIC_ACTION_TYPES.includes(entry.actionType ?? "");
}

export function ownStrategicWindow<T extends PlanConversionDecisionEntry>(
  sequence: T[],
  index: number,
  ownDecisions: number,
): T[] {
  const side = sequence[index]?.side;
  if (!side) return [];
  const window: T[] = [];
  for (let cursor = index + 1; cursor < sequence.length; cursor += 1) {
    const entry = sequence[cursor]!;
    if (entry.side !== side) continue;
    if (!isStrategicPlanDecision(entry)) continue;
    window.push(entry);
    if (window.length >= ownDecisions) break;
  }
  return window;
}

export function previousOwnStrategicWindow<
  T extends PlanConversionDecisionEntry,
>(sequence: T[], index: number, ownDecisions: number): T[] {
  const side = sequence[index]?.side;
  if (!side) return [];
  const window: T[] = [];
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const entry = sequence[cursor]!;
    if (entry.side !== side) continue;
    if (!isStrategicPlanDecision(entry)) continue;
    window.push(entry);
    if (window.length >= ownDecisions) break;
  }
  return window;
}
