import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import type { PlanOutcomeReceipt } from "../../plans/resident-plan-portfolio";
import { runnerCardRunHasVisibleDifferentialPayoff } from "../../plans/runner-run-payoff";
import {
  runnerTacticalAssessment as assessment,
  domain,
  exactRunnerParentSupportResourceGaps,
  runnerTacticalProposal as proposal,
  state,
} from "../../plans/runner-tactical-module-support";
import { RunnerPressureSignal } from "../../plans/runner-tactical-plan-contracts";
import type { RunnerRunTargetEvaluation } from "../../run-analysis/runner-run-target-types";
type PressureState = {
  kind: "central_pressure";
  signal: RunnerPressureSignal;
};

export function runnerPressureProgressReceipt(params: {
  planInstanceId: string;
  stateVersionBefore: number;
  stateVersionAfter: number;
  previousCounter: number;
  currentCounter: number;
  accessConverted: boolean;
  corpPurged: boolean;
}): PlanOutcomeReceipt {
  if (params.corpPurged) {
    return {
      planInstanceId: params.planInstanceId,
      stateVersionBefore: params.stateVersionBefore,
      stateVersionAfter: params.stateVersionAfter,
      progress: "regression",
      progressValue: 0,
      milestoneAfter: "counter_reset_by_corp_purge",
      reasonCode: "corp_purge_observed",
    };
  }
  const realProgress =
    params.accessConverted && params.currentCounter > params.previousCounter;
  return {
    planInstanceId: params.planInstanceId,
    stateVersionBefore: params.stateVersionBefore,
    stateVersionAfter: params.stateVersionAfter,
    progress: realProgress ? "progress" : "no_progress",
    progressValue: realProgress
      ? params.currentCounter
      : params.previousCounter,
    milestoneAfter: realProgress
      ? "access_conversion_observed"
      : "no_real_conversion",
    reasonCode: realProgress
      ? "highlighter_counter_increased_after_access"
      : "counter_did_not_increase",
  };
}

export function centralPressureModule(): PlanModule {
  return {
    moduleId: "runner.pressure_central",
    side: "runner",
    discover: (context) =>
      domain(context).centralPressure.map((signal) => {
        const candidates = pressureCandidates(context, signal);
        return proposal(
          "runner.pressure_central",
          signal.pressureId,
          { kind: "central_pressure", signal } satisfies PressureState,
          signal.priorityClass,
          signal.strategyLineIds,
          { kind: "server", id: signal.serverId },
          (signal.supportNeedId !== undefined ||
            (signal.reachable && candidates.length > 0)) &&
            signal.marginalValue > 0,
          signal.evidenceCode,
          undefined,
          signal.routePreparation === "develop_payoff" ||
            signal.routePreparation === "convert_accumulated_pressure" ||
            signal.routePreparation === "targeted_bypass" ||
            signal.routePreparation === "targeted_ice_trash"
            ? {
                phase: "develop_payoff",
                blockerCode: "central_pressure_payoff_route_unavailable",
                evidenceCodes: [
                  `central_pressure_preparation_actions:${signal.preparationActionIds?.length ?? 0}`,
                ],
              }
            : undefined,
        );
      }),
    assess: (instance, context, portfolio) => {
      const current = state<PressureState>(instance);
      const candidates = pressureCandidates(context, current.signal);
      const routeExists =
        current.signal.reachable &&
        current.signal.marginalValue > 0 &&
        candidates.length > 0;
      const resourceGaps = exactRunnerParentSupportResourceGaps(
        context,
        instance,
        current.signal.supportNeedId,
        routeExists,
      );
      const result = assessment(
        instance,
        current.signal.priorityClass,
        routeExists,
        current.signal.marginalValue,
        portfolio.executorInstanceId,
        undefined,
        current.signal.routePreparation === "targeted_bypass"
          ? "belief_supported"
          : "visible_state_forced",
        resourceGaps,
      );
      if (!routeExists && current.signal.supportNeedId) {
        result.blockers = [
          {
            code: "waiting_for_bound_funding_support",
            owner: "plan_module",
            removable: true,
            resumeCondition: { code: current.signal.supportNeedId },
          },
        ];
      }
      return result;
    },
    materialize: (instance, _assessment, context) => {
      const current = state<PressureState>(instance);
      const candidates = pressureCandidates(context, current.signal);
      return {
        step: {
          stepId: `${instance.instanceId}:pressure:${current.signal.serverId}`,
          capability: {
            capabilityId:
              (current.signal.routePreparation === "develop_payoff" ||
                current.signal.routePreparation ===
                  "convert_accumulated_pressure" ||
                current.signal.routePreparation === "targeted_bypass" ||
                current.signal.routePreparation === "targeted_ice_trash") &&
              current.signal.sourceDefinitionIds?.[0]
                ? current.signal.routePreparation ===
                  "convert_accumulated_pressure"
                  ? "central_pressure_convert_accumulated_pressure"
                  : `develop_${current.signal.sourceDefinitionIds[0]}`
                : `pressure_${current.signal.serverId}_${current.signal.purpose}`,
            semanticActionTypes: [
              ...new Set(
                candidates.map(
                  (candidate) => candidate.candidate.semanticActionType,
                ),
              ),
            ],
            ...(current.signal.routePreparation === "targeted_bypass"
              ? {
                  requiredFunctionalEffects: [
                    {
                      kind: "future_run_effect" as const,
                      timing: "action" as const,
                      scope: "server" as const,
                      target: "make_run",
                    },
                    {
                      kind: "future_encounter_effect" as const,
                      timing: "during_run" as const,
                      scope: "ice" as const,
                      target: "bypass_chosen_ice",
                    },
                  ],
                }
              : current.signal.routePreparation === "develop_payoff" &&
                  current.signal.sourceDefinitionIds
                ? {
                    requiredSourceDefinitionIds:
                      current.signal.sourceDefinitionIds,
                  }
                : current.signal.routePreparation === "targeted_ice_trash" &&
                    current.signal.sourceDefinitionIds
                  ? {
                      requiredSourceDefinitionIds:
                        current.signal.sourceDefinitionIds,
                    }
                  : {}),
          },
          ...(current.signal.routePreparation ||
          (current.signal.runActionIds?.length ?? 0) > 0
            ? {}
            : {
                target: {
                  kind: "server" as const,
                  id: current.signal.serverId,
                },
              }),
          purpose:
            current.signal.routePreparation === "targeted_bypass"
              ? `Execute the preflighted targeted bypass route on ${current.signal.serverId}.`
              : current.signal.routePreparation === "targeted_ice_trash"
                ? `Remove the preflighted rezzed ICE target from ${current.signal.serverId}.`
                : current.signal.routePreparation ===
                    "convert_accumulated_pressure"
                  ? "Convert the accumulated multi-central pressure into its current action-denial payoff."
                  : current.signal.routePreparation === "develop_payoff"
                    ? `Develop ${current.signal.purpose} payoff for ${current.signal.serverId}.`
                    : `Execute ${current.signal.purpose} pressure on ${current.signal.serverId}.`,
        },
        candidates,
        ...(current.signal.routePreparation === "develop_payoff"
          ? {
              continuation: {
                continuationId: `${instance.instanceId}:access-payoff:${current.signal.serverId}`,
                trigger: "action_applied" as const,
                nextCapability: {
                  capabilityId: `pressure_${current.signal.serverId}_access`,
                  semanticActionTypes: ["run.start"],
                },
                target: {
                  kind: "server" as const,
                  id: current.signal.serverId,
                },
                purpose: `Convert the installed access payoff into pressure on ${current.signal.serverId}.`,
              },
            }
          : {}),
      };
    },
  };
}

function pressureCandidates(
  context: PlanSchedulerContext,
  signal: RunnerPressureSignal,
): PlanMaterialization["candidates"] {
  if (
    signal.routePreparation === "develop_payoff" ||
    signal.routePreparation === "convert_accumulated_pressure" ||
    signal.routePreparation === "targeted_bypass" ||
    signal.routePreparation === "targeted_ice_trash"
  ) {
    const preparationActionIds = new Set(signal.preparationActionIds ?? []);
    return context.actionCandidates
      .filter((candidate) => preparationActionIds.has(candidate.actionId))
      .map((candidate) => ({
        candidate,
        stepValue: signal.marginalValue,
      }));
  }
  const exactDifferentialPayoffActionIds = new Set(
    signal.runActionDifferentialPayoffIds ?? [],
  );
  const runCandidates = context.actionCandidates.filter(
    (candidate) =>
      (signal.runActionIds?.length
        ? signal.runActionIds.includes(candidate.actionId)
        : (candidate.semanticActionType === "run.start" &&
            candidate.runProjectionSummary?.serverId === signal.serverId) ||
          (candidate.semanticActionType === "play.runner_event" &&
            candidate.sourceDefinitionId !== undefined &&
            candidate.runProjectionSummary?.serverId === signal.serverId &&
            (signal.sourceDefinitionIds ?? []).includes(
              candidate.sourceDefinitionId,
            ))) &&
      (signal.runActionExclusions?.[candidate.actionId]?.length ?? 0) === 0 &&
      signal.reachable &&
      signal.marginalValue > 0,
  );
  const directRunAvailable = runCandidates.some(
    (candidate) => candidate.semanticActionType === "run.start",
  );
  return runCandidates
    .filter(
      (candidate) =>
        candidate.semanticActionType !== "play.runner_event" ||
        !directRunAvailable ||
        exactDifferentialPayoffActionIds.has(candidate.actionId) ||
        runnerCardRunHasVisibleDifferentialPayoff(
          context.input,
          candidate,
          signal.serverId,
          domain(context).runTargetEvaluations,
        ),
    )
    .map((candidate) => ({
      candidate,
      stepValue:
        signal.marginalValue +
        runnerCardRunRoutePreference(
          context,
          candidate,
          signal.serverId,
          directRunAvailable,
          domain(context).runTargetEvaluations,
        ) +
        (signal.runActionValues?.[candidate.actionId] ?? 0),
    }));
}

function runnerCardRunRoutePreference(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
  serverId: RunnerPressureSignal["serverId"],
  directRunAvailable: boolean,
  runTargetEvaluations?: readonly RunnerRunTargetEvaluation[],
): number {
  if (candidate.semanticActionType !== "play.runner_event") return 0;
  if (
    !directRunAvailable ||
    runnerCardRunHasVisibleDifferentialPayoff(
      context.input,
      candidate,
      serverId,
      runTargetEvaluations,
    )
  ) {
    return 5;
  }
  const knownCreditCost =
    candidate.costProfile.costKnownStatus === "known" &&
    Number.isSafeInteger(candidate.costProfile.creditCost) &&
    candidate.costProfile.creditCost! >= 0
      ? candidate.costProfile.creditCost!
      : 0;
  return -1 - knownCreditCost;
}
