import type { AiDecisionInput } from "@netgrid/shared";
import { actionMatchesCurrentDecision } from "../actions/current-legal-action";
import { actionClickCost } from "../runtime/action-cost";
import { runnerRunProjectionPreservesNormalAccess } from "../actions/run-action-projection";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "./runner-run-target-types";

export function compareRunnerCentralAccessRoutes(
  input: AiDecisionInput,
  economy: RunnerEconomyPosture,
  runTargets: readonly RunnerRunTargetEvaluation[],
) {
  if (input.side !== "runner" || runTargets.length < 2) return [];
  const policy = economy.creditReservePolicy;
  const protectedReserve = Math.max(
    economy.minimumCreditFloor,
    policy.emergencyReserve,
    policy.remotePressureReserve ?? 0,
    policy.remoteScoreThreat === "urgent" ? policy.contestReserve : 0,
  );
  const clickCostByActionId = new Map(
    input.legalActions
      .filter(
        (action) =>
          actionMatchesCurrentDecision(input, action) &&
          (action.type === "start_run" || action.type === "play_event"),
      )
      .map((action) => [
        action.actionId,
        actionClickCost(action),
      ]),
  );
  const routes = runTargets.filter((target) => {
    const projection = target.runActionProjection;
    return (
      clickCostByActionId.has(target.actionId) &&
      target.targetKind !== "remote" &&
      (target.accessTargetKind === "rd" || target.accessTargetKind === "hq") &&
      (projection.structure === "direct_start_run" ||
        projection.structure === "event_run") &&
      runnerRunProjectionPreservesNormalAccess(input, projection) &&
      (target.knownAccessState === "unknown" ||
        target.knownAccessState === "fresh") &&
      target.accessFacts.knownTargetDefinitionIds.length === 0 &&
      !target.multiaccessAvailable &&
      target.pathPassability === "reachable" &&
      target.accessPayoffContestable !== false &&
      target.routeQuote?.fundingGap === 0 &&
      target.routeQuote.reachability !== "no_access" &&
      (target.prerunReserveQuote?.status === "not_required" ||
        target.prerunReserveQuote?.status === "satisfied")
    );
  });
  const certainRoutes = routes.filter(
    (target) =>
      target.routeQuote?.reachability === "guaranteed_access" &&
      target.routeQuote.effects.length === 0 &&
      (target.routeQuote.conditionalRiskReasons?.length ?? 0) === 0 &&
      target.creditsAfterRun >= protectedReserve &&
      target.score > 0 &&
      !target.runActionProjection.postRunSelfDamage &&
      !target.runActionProjection.successfulRunSelfTags &&
      (target.recommendation === "run_now" ||
        target.recommendation === "run_if_free" ||
        (target.recommendation === "gain_credits_first" &&
          target.fundingNeed.reason === "post_run_floor_gap")),
  );
  return routes.flatMap((alternative) => {
    if (
      (alternative.recommendation !== "run_now" &&
        alternative.recommendation !== "run_if_free") ||
      alternative.runActionPayoff.futureSetupValue > 0 ||
      alternative.runActionPayoff.purgeTaxValue > 0 ||
      alternative.runActionPayoff.economyValue > 0 ||
      (alternative.runActionPayoff.immediateAccessValue > 0 &&
        // A possible free trash from a blind access cannot spend the reserve
        // when another route reaches the same cards and protects it.
        (!alternative.runActionProjection.accessPayoffSignals.includes(
          "target:access.free_trash",
        ) ||
          alternative.creditsAfterRun >= protectedReserve))
    ) {
      return [];
    }
    return certainRoutes.flatMap((preferred) => {
      if (
        preferred.actionId === alternative.actionId ||
        preferred.accessServerId !== alternative.accessServerId ||
        preferred.knownAccessState !== alternative.knownAccessState ||
        clickCostByActionId.get(preferred.actionId) !==
          clickCostByActionId.get(alternative.actionId)
      ) {
        return [];
      }
      const uncertain =
        alternative.routeQuote?.reachability === "conditional_access";
      const riskReserve = uncertain
        ? alternative.prerunReserveQuote!.requiredCredits
        : 0;
      const protectsMoreCredits =
        preferred.creditsAfterRun > alternative.creditsAfterRun;
      if (
        !(
          protectsMoreCredits ||
          (uncertain &&
            preferred.creditsAfterRun >=
              alternative.creditsAfterRun - riskReserve)
        )
      ) {
        return [];
      }
      return [
        {
          preferred,
          alternative,
          protectedReserve,
        },
      ];
    });
  });
}
