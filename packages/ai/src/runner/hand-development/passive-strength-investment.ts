import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { projectVisibleIceAfterPassiveRunnerInstall } from "@netgrid/engine";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../../visible-run-analysis";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import type { RunnerHandDevelopmentEvaluation } from "./runner-hand-development-types";
import { assessPassiveStrengthDevelopment } from "./passive-strength-development";

/** Admission/value service of develop_board_and_hand; never chooses an action. */
export function assessPassiveStrengthInvestment(
  input: AiDecisionInput,
  evaluation: RunnerHandDevelopmentEvaluation,
  targets: readonly RunnerRunTargetEvaluation[],
  economy: RunnerEconomyPosture,
) {
  if (
    !evaluation.definitionId ||
    !AI_HINTS_BY_CARD.get(evaluation.definitionId)?.effects?.some(
      (e) =>
        e.kind === "global_modifier" &&
        e.timing === "persistent" &&
        e.target === "ice.strength_modifier",
    )
  )
    return undefined;
  const deferred = {
    admitted: false,
    value: 0,
    priorityClass: "P5" as const,
    evidenceCodes: ["runner_passive_strength_no_funded_amortizing_route"],
  };
  const own = input.playerView.own;
  const action = input.legalActions.find(
    (a) =>
      a.actionId === evaluation.legalActionId &&
      a.type === "install_card" &&
      a.side === "runner" &&
      a.source === evaluation.cardInstanceId &&
      a.expiresAtStateVersion === input.playerView.stateVersion,
  );
  const card = own.gripOrHq.find(
    (c) => c.instanceId === evaluation.cardInstanceId && c.known,
  );
  if (
    !action ||
    !card ||
    action.costs.some((cost) => (cost.clicks ?? 0) > own.clicks) ||
    action.payload?.runnerProgramTrashBeforeInstall === true ||
    action.targetRequirements.length ||
    (action.choiceRequirements?.length ?? 0) ||
    !Number.isSafeInteger(card.memoryCost) ||
    !Number.isSafeInteger(own.memoryUsed) ||
    !Number.isSafeInteger(own.memoryLimit) ||
    own.memoryUsed! + card.memoryCost! > own.memoryLimit! ||
    own.tags > 0 ||
    own.stackOrRdCount < 2 ||
    input.playerView.opponent.deckCount < 2 ||
    own.agendaPoints >= input.playerView.agendaPointsToWin - 2 ||
    input.playerView.opponent.agendaPoints >=
      input.playerView.agendaPointsToWin - 2 ||
    targets.some(
      (t) =>
        t.scoreThreat ||
        t.accessPayoff === "agenda" ||
        t.accessPayoff === "score_threat",
    )
  )
    return deferred;
  const installCredits = action.costs.reduce((n, c) => n + (c.credits ?? 0), 0);
  const installClicks = action.costs.reduce((n, c) => n + (c.clicks ?? 0), 0);
  const liquid = own.credits - installCredits;
  const rig = own.rig ?? [];
  // Refresh only explicitly renewable pools, never a consumable bank. This is
  // a conditional next-turn value comparison, not today's spendable money.
  const refreshedRig = rig.map((c) =>
    c.counterDisplays
      ? {
          ...c,
          counterDisplays: c.counterDisplays.map((d) =>
            d.creditPool?.refresh && Number.isSafeInteger(d.creditPool.capacity)
              ? { ...d, amount: d.creditPool.capacity! }
              : d,
          ),
        }
      : c,
  );
  const quotes = targets.flatMap((target) => {
    const run = input.legalActions.find(
      (a) =>
        a.actionId === target.actionId &&
        a.type === "start_run" &&
        a.expiresAtStateVersion === input.playerView.stateVersion,
    );
    const server = input.playerView.servers.find(
      (s) => s.id === target.targetServerId,
    );
    const reserve = target.prerunReserveQuote;
    if (
      !run ||
      !server ||
      !["hq", "rd"].includes(target.targetServerId) ||
      target.runActionProjection.sourceKind !== "basic_action" ||
      target.score <= 0 ||
      target.pathPassability !== "reachable" ||
      !["run_now", "run_if_free"].includes(target.recommendation) ||
      target.knownAccessState === "known_no_current_payoff" ||
      target.accessPayoff === "known_low_value" ||
      target.accessPayoffContestable === false ||
      target.unrezzedIceRiskUnderfunded ||
      target.riskyUniversalCoverage ||
      !reserve ||
      reserve.status === "blocked" ||
      reserve.status === "information_probe_only" ||
      own.gripOrHq.length - 1 < reserve.requiredHandBuffer ||
      liquid < reserve.requiredCredits ||
      liquid < economy.minimumCreditFloor ||
      own.clicks <
        installClicks + run.costs.reduce((n, c) => n + (c.clicks ?? 0), 0)
    )
      return [];
    const knownIce = server.ice.filter((ice) => ice.known && ice.rezzed);
    if (!knownIce.length) return [];
    const projected = knownIce.map((ice) =>
      projectVisibleIceAfterPassiveRunnerInstall(evaluation.definitionId!, ice),
    );
    if (projected.some((ice) => !ice)) return [];
    const cost = (
      ice: readonly VisibleCard[],
      sources: readonly VisibleCard[],
      availableCash: number,
    ) => {
      const path = assessKnownRezzedIcePath(
        [...ice],
        [...sources],
        runnerRunPathCreditBudgetWithVisiblePools(availableCash, sources),
        server.root,
        input.playerView.opponent.credits,
      );
      if (
        !path.canReachAccess ||
        path.blocked ||
        (path.futureClicksLost ?? 0) > 0 ||
        (path.conditionalAccessReasons?.length ?? 0) > 0 ||
        (path.conditionalRiskReasons?.length ?? 0) > 0 ||
        (path.postEncounterBreakerBranches?.length ?? 0) > 0 ||
        (path.unavoidableVisibleIceHazardCount ?? 0) > 0
      )
        return undefined;
      return availableCash - path.creditsAfterPath;
    };
    // Each alternative pays only its own costs. Charging the installation to
    // the no-install baseline can falsely make that baseline unquotable.
    const before = cost(knownIce, rig, own.credits),
      after = cost(projected as VisibleCard[], rig, liquid);
    const futureBefore = cost(knownIce, refreshedRig, own.credits),
      futureAfter = cost(projected as VisibleCard[], refreshedRig, liquid);
    if (
      before === undefined ||
      after === undefined ||
      futureBefore === undefined ||
      futureAfter === undefined
    )
      return [];
    const currentSaving = before - after,
      futureSaving = futureBefore - futureAfter;
    const net = currentSaving + futureSaving - installCredits - installClicks;
    if (
      currentSaving <= 0 ||
      futureSaving <= 0 ||
      net < 2 ||
      liquid < after + target.fundingNeed.protectedLiquidReserve ||
      liquid < after + economy.minimumCreditFloor
    )
      return [];
    return [
      {
        admitted: true,
        priorityClass: "P4" as const,
        value: Math.min(300, net * 100),
        evidenceCodes: [
          "runner_passive_strength_investment_admitted",
          `runner_passive_strength_route:${target.actionId}`,
          `runner_passive_strength_install:${action.actionId}`,
          `runner_passive_strength_current_saving:${currentSaving}`,
          `runner_passive_strength_refreshed_saving:${futureSaving}`,
          `runner_passive_strength_net:${net}`,
          `runner_passive_strength_before_liquid_cost:${before}`,
          `runner_passive_strength_after_liquid_cost:${after}`,
          `runner_passive_strength_protected_liquid_reserve:${target.fundingNeed.protectedLiquidReserve}`,
          `runner_passive_strength_unknown_ice:${server.ice.length - knownIce.length}`,
          "runner_passive_strength_horizon:current_run_plus_one_conditional_future_run",
          "runner_passive_strength_future_savings_not_spendable",
        ],
      },
    ];
  });
  const development = assessPassiveStrengthDevelopment(
    input,
    evaluation.definitionId,
    card.memoryCost!,
    installCredits,
    installClicks,
    economy.minimumCreditFloor,
    refreshedRig,
  );
  return (
    quotes.sort(
      (a, b) =>
        b.value - a.value ||
        a.evidenceCodes[1]!.localeCompare(b.evidenceCodes[1]!),
    )[0] ??
    development ??
    deferred
  );
}
