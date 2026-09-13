import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { legalActionCreditCost } from "../../runtime/legal-action-credit-cost";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";

export type ShellTradersAccessAssessment = {
  status: "funded" | "blocked" | "unknown";
  reason: string;
  stateVersion: number;
  targetServerId: string;
  targetRunActionId?: string;
  completionCardIds?: string[];
  completionCredits?: number;
  knownPathCost?: number;
  requiredCredits?: number;
  requiredClicks?: number;
};

/** A current-use witness for paid acceleration, never a future action queue. */
export function assessShellTradersAccess(
  input: AiDecisionInput,
  sourceCardInstanceId: string,
  targetCardInstanceId: string,
  targetServerId: string,
  allowedReplacementIds: readonly string[] = [],
): ShellTradersAccessAssessment {
  const base = { stateVersion: input.playerView.stateVersion, targetServerId };
  const server = input.playerView.servers.find(
    (entry) => entry.id === targetServerId,
  );
  const run = input.legalActions.find(
    (action) =>
      action.side === "runner" &&
      action.type === "start_run" &&
      action.payload?.serverId === targetServerId &&
      action.expiresAtStateVersion === base.stateVersion,
  );
  if (
    !server ||
    !run ||
    server.ice.some(
      (ice) => !ice.known || !ice.rezzed || !ice.effectiveRunQuote,
    )
  )
    return {
      ...base,
      status: "unknown",
      reason: "current_known_run_quote_missing",
    };
  const runClicks = run.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  if (runClicks <= 0 || runClicks > input.playerView.own.clicks)
    return { ...base, status: "blocked", reason: "run_click_unavailable" };

  const rig = input.playerView.own.rig ?? [];
  const memoryUsed = input.playerView.own.memoryUsed;
  const memoryLimit = input.playerView.own.memoryLimit;
  if (memoryUsed === undefined || memoryLimit === undefined)
    return { ...base, status: "unknown", reason: "memory_quote_missing" };
  const prepared = (input.playerView.specialZones?.setAside ?? []).flatMap(
    (card) => {
      if (
        !card.known ||
        card.type !== "program" ||
        !card.subtypes?.includes("icebreaker") ||
        card.memoryCost === undefined
      )
        return [];
      const action = input.legalActions.find(
        (entry) =>
          entry.side === "runner" &&
          entry.type === "trigger_ability" &&
          entry.source === sourceCardInstanceId &&
          entry.expiresAtStateVersion === base.stateVersion &&
          entry.payload?.delayedInstallAbility === "remove_shell_counter" &&
          entry.payload.targetCardId === card.instanceId &&
          entry.payload.targetCardDefinitionId === card.definitionId &&
          entry.payload.removeCounterAmount === 1 &&
          entry.payload.remainingCountersBefore === card.counters?.shell,
      );
      const counters = card.counters?.shell;
      if (
        !action ||
        !Number.isSafeInteger(counters) ||
        (counters ?? 0) <= 0 ||
        action.costs.some((cost) => (cost.clicks ?? 0) !== 0)
      )
        return [];
      return [
        { card, credits: (counters as number) * legalActionCreditCost(action) },
      ];
    },
  );
  const target = prepared.find(
    (entry) => entry.card.instanceId === targetCardInstanceId,
  );
  if (!target)
    return {
      ...base,
      status: "unknown",
      reason: "prepared_target_quote_missing",
    };
  const optional = prepared.filter((entry) => entry !== target);
  if (optional.length > 8)
    return { ...base, status: "unknown", reason: "prepared_combination_limit" };

  let best: ShellTradersAccessAssessment | undefined;
  for (let mask = 0; mask < 2 ** optional.length; mask += 1) {
    const entries = [
      target,
      ...optional.filter((_, index) => (mask & (1 << index)) !== 0),
    ];
    const cards: VisibleCard[] = entries.map((entry) => entry.card);
    const neededMemory =
      memoryUsed +
      cards.reduce((sum, card) => sum + card.memoryCost!, 0) -
      memoryLimit;
    const replacements =
      neededMemory > 0
        ? rig.filter((card) => allowedReplacementIds.includes(card.instanceId))
        : [];
    if (
      replacements.some((card) => card.memoryCost === undefined) ||
      neededMemory >
        replacements.reduce((sum, card) => sum + card.memoryCost!, 0)
    )
      continue;
    const projectedRig = rig.filter((card) => !replacements.includes(card));
    const completionCredits = entries.reduce(
      (sum, entry) => sum + entry.credits,
      0,
    );
    const available =
      input.playerView.own.credits -
      completionCredits -
      legalActionCreditCost(run);
    if (available < 0) continue;
    const path = assessKnownRezzedIcePath(
      server.ice,
      [...projectedRig, ...cards],
      available,
      server.root,
      input.playerView.opponent.credits,
      {
        targetServerId,
        availableRunnerClicks: input.playerView.own.clicks,
        ...(input.playerView.traceRulesProfile
          ? { traceRulesProfile: input.playerView.traceRulesProfile }
          : {}),
        ...(input.playerView.own.runnerTraceSupportQuote
          ? {
              runnerTraceSupportQuote:
                input.playerView.own.runnerTraceSupportQuote,
            }
          : {}),
      },
    );
    if (
      !path.canReachAccess ||
      path.blocked ||
      path.visibleBreakCost === undefined ||
      (path.conditionalAccessReasons?.length ?? 0) > 0 ||
      (path.conditionalRiskReasons?.length ?? 0) > 0 ||
      path.preRunPreparation ||
      (path.futureClicksLost ?? 0) > 0
    )
      continue;
    const requiredCredits =
      completionCredits + legalActionCreditCost(run) + path.visibleBreakCost;
    if (requiredCredits > input.playerView.own.credits) continue;
    if (!best || requiredCredits < best.requiredCredits!)
      best = {
        ...base,
        status: "funded",
        reason: "prepared_completion_and_known_access_funded",
        targetRunActionId: run.actionId,
        completionCardIds: cards.map((card) => card.instanceId),
        completionCredits,
        knownPathCost: path.visibleBreakCost,
        requiredCredits,
        requiredClicks: runClicks,
      };
  }
  return (
    best ?? { ...base, status: "blocked", reason: "complete_access_not_funded" }
  );
}
