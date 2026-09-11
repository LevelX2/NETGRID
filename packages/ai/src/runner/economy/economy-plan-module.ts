import type { RunnerFundingNeedSignal } from "../../plans/runner-funding-contracts";
import { validRunnerFundingNeedContract } from "../../plans/runner-funding-contracts";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { PlanInstance } from "../../plans/plan-kernel-types";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import {
  runnerPlanProposal as proposal,
  runnerPlanAssessment as assessment,
  runnerPlanDomain,
} from "../../plans/runner-plan-module-support";
import type {
  EconomyState,
  RunnerInstalledCardLiquidationChoiceSignal,
} from "./economy-types";
import {
  runnerFundingRouteCandidateIsMaterializable,
  runnerTurnLiquidityCandidateIsMaterializable,
} from "../../plans/runner-funding-candidates";
export function createRunnerEconomyModule(): PlanModule {
  return {
    moduleId: "runner.economy",
    side: "runner",
    discover: (context) => [
      ...runnerPlanDomain<{
        fundingNeeds: RunnerFundingNeedSignal[];
        installedCardLiquidationChoices?: RunnerInstalledCardLiquidationChoiceSignal[];
      }>(context)
        .fundingNeeds.filter((need) => need.gap > 0)
        .map((need) => {
          const validSupportContract = validRunnerFundingNeedContract(
            need,
            context.input.playerView.stateVersion,
          );
          const routeExists = economyCandidates(context, need).length > 0;
          return proposal({
            moduleId: "runner.economy",
            dedupeKey: need.needId,
            moduleState: { kind: "economy", need } satisfies EconomyState,
            priorityClass: need.priorityClass,
            target: { kind: "capability", id: need.needId },
            routeExists: validSupportContract && routeExists,
            blockerCode: validSupportContract
              ? "no_compatible_credit_route"
              : need.kind === "develop_liquidity"
                ? "invalid_turn_liquidity_revalidation"
                : need.kind === "parent_plan_support"
                  ? "orphaned_funding_need"
                  : "invalid_funding_need_revalidation",
            evidenceCode: need.evidenceCode,
            ...(need.kind === "parent_plan_support"
              ? {
                  parentInstanceId: need.parentPlanInstanceId,
                  parentNeedId: need.needId,
                }
              : {}),
          });
        }),
      ...(
        runnerPlanDomain<{
          fundingNeeds: RunnerFundingNeedSignal[];
          installedCardLiquidationChoices?: RunnerInstalledCardLiquidationChoiceSignal[];
        }>(context).installedCardLiquidationChoices ?? []
      ).map((signal) =>
        proposal({
          moduleId: "runner.economy",
          dedupeKey: signal.conversionId,
          moduleState: {
            kind: "installed_card_liquidation_choice",
            signal,
          } satisfies EconomyState,
          priorityClass: signal.priorityClass,
          target: {
            kind: "card",
            id: signal.sourceResourceDefinitionId,
          },
          routeExists:
            installedCardLiquidationChoiceCandidates(context, signal).length >
            0,
          blockerCode: "installed_card_liquidation_choice_unavailable",
          evidenceCode:
            signal.evidenceCodes[0] ??
            "runner_installed_card_liquidation_choice_owned_by_economy",
        }),
      ),
    ],
    assess: (instance, context, portfolio) => {
      const economyState = instance.moduleState as EconomyState;
      if (economyState.kind === "installed_card_liquidation_choice") {
        const signal = economyState.signal;
        return assessment(
          instance,
          signal.priorityClass,
          installedCardLiquidationChoiceCandidates(context, signal).length > 0,
          signal.value,
          portfolio.executorInstanceId,
        );
      }
      const need = economyState.need;
      const parentMaterialValue =
        need.kind === "parent_plan_support"
          ? portfolio.instances
              .map((candidate) =>
                runnerFundingParentMaterialValue(candidate, need),
              )
              .find((value): value is number => value !== undefined)
          : undefined;
      const parentIsResidentAndMaterial =
        need.kind === "portfolio_reserve" ||
        need.kind === "develop_liquidity" ||
        parentMaterialValue !== undefined;
      const supportContractValid = validRunnerFundingNeedContract(
        need,
        context.input.playerView.stateVersion,
      );
      const routeExists =
        parentIsResidentAndMaterial &&
        supportContractValid &&
        economyCandidates(context, need).length > 0;
      const result = assessment(
        instance,
        need.priorityClass,
        routeExists,
        need.kind === "develop_liquidity"
          ? -9_999
          : (parentMaterialValue ?? need.gap * 10),
        portfolio.executorInstanceId,
      );
      if (!parentIsResidentAndMaterial && need.kind === "parent_plan_support") {
        result.blockers = [
          {
            code: "orphaned_funding_need",
            owner: "plan_module",
            removable: true,
            resumeCondition: { code: "material_parent_plan_ready" },
          },
        ];
      } else if (!supportContractValid) {
        result.blockers = [
          {
            code: "invalid_funding_need_revalidation",
            owner: "plan_module",
            removable: true,
            resumeCondition: { code: "funding_need_revalidated" },
          },
        ];
      }
      return result;
    },
    materialize: (instance, currentAssessment, context) => {
      const economyState = instance.moduleState as EconomyState;
      if (economyState.kind === "installed_card_liquidation_choice") {
        const signal = economyState.signal;
        const candidates = installedCardLiquidationChoiceCandidates(
          context,
          signal,
        );
        return {
          step: {
            stepId: `${instance.instanceId}:resolve_optional_liquidation`,
            capability: {
              capabilityId: "resolve_optional_installed_card_liquidation",
              semanticActionTypes: ["choice.resolve"],
            },
            purpose:
              "Resolve the current optional installed-card liquidation without inventing an unquoted target valuation.",
          },
          candidates,
        };
      }
      const need = economyState.need;
      const candidates = economyCandidates(context, need).map((entry) =>
        need.kind === "parent_plan_support"
          ? {
              ...entry,
              stepValue: Math.max(
                entry.stepValue,
                currentAssessment.withinClassValue,
              ),
            }
          : entry,
      );
      return {
        step: {
          stepId: `${instance.instanceId}:fund:${need.needId}`,
          capability: {
            capabilityId: "gain_general_liquid_credits",
            semanticActionTypes: [
              ...new Set(
                candidates.map((entry) => entry.candidate.semanticActionType),
              ),
            ],
          },
          purpose:
            need.kind === "develop_liquidity"
              ? "Develop guaranteed immediate unrestricted Runner liquidity through the strongest exact current route."
              : `Close the bound credit gap ${need.needId}.`,
        },
        candidates,
      };
    },
  };
}

function installedCardLiquidationChoiceCandidates(
  context: PlanSchedulerContext,
  signal: RunnerInstalledCardLiquidationChoiceSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        candidate.actionId === signal.actionId &&
        candidate.semanticActionType === "choice.resolve" &&
        context.input.legalActions.some(
          (action) =>
            action.actionId === candidate.actionId &&
            action.side === "runner" &&
            action.type === "resolve_choice" &&
            action.timingPoint === context.input.playerView.timingPoint &&
            action.expiresAtStateVersion ===
              context.input.playerView.stateVersion &&
            action.choiceRequirements?.length === 1 &&
            action.choiceRequirements[0]?.choiceId === signal.choiceId,
        ),
    )
    .map((candidate) => ({ candidate, stepValue: signal.value }));
}

function economyCandidates(
  context: PlanSchedulerContext,
  need: RunnerFundingNeedSignal,
): PlanMaterialization["candidates"] {
  const routeActionIds = new Set(
    need.kind === "develop_liquidity" ? need.actionIds : need.routeActionIds,
  );
  const paymentInstall =
    need.kind === "parent_plan_support" &&
    (need.driver.kind === "contest" || need.driver.kind === "run")
      ? need.routeAssessment.paymentInstall
      : undefined;
  const isPaymentInstall = (candidate: ActionSemanticCandidate) =>
    paymentInstall?.actionId === candidate.actionId &&
    need.kind === "parent_plan_support" &&
    need.driver.targetId === paymentInstall.targetServerId &&
    context.actionCandidates.some(
      (entry) => entry.actionId === paymentInstall.runActionId,
    ) &&
    paymentInstall.sourceCardInstanceId === candidate.sourceCardInstanceId &&
    paymentInstall.sourceDefinitionId === candidate.sourceDefinitionId &&
    candidate.semanticActionType === "install.card" &&
    candidate.costProfile.costKnownStatus === "known" &&
    candidate.costProfile.clickCost === paymentInstall.installClickCost &&
    candidate.costProfile.creditCost === paymentInstall.installCreditCost;
  return context.actionCandidates
    .filter(
      (candidate) =>
        !context.actionDispositions?.some(
          (entry) => entry.actionId === candidate.actionId,
        ) &&
        routeActionIds.has(candidate.actionId) &&
        (need.kind === "develop_liquidity"
          ? runnerTurnLiquidityCandidateIsMaterializable(candidate)
          : runnerFundingRouteCandidateIsMaterializable(candidate) ||
            isPaymentInstall(candidate)),
    )
    .map((candidate) => {
      const netLiquidCreditGain = isPaymentInstall(candidate)
        ? paymentInstall!.netPaymentGain - paymentInstall!.installCreditCost
        : candidate.economyProjection!.netLiquidCreditGain!;
      const fundingGapProgress = Math.min(need.gap, netLiquidCreditGain);
      return {
        candidate,
        stepValue: fundingGapProgress * 100 + netLiquidCreditGain,
      };
    });
}

function runnerFundingParentMaterialValue(
  candidate: PlanInstance,
  need: Extract<RunnerFundingNeedSignal, { kind: "parent_plan_support" }>,
): number | undefined {
  if (
    candidate.instanceId !== need.parentPlanInstanceId ||
    (candidate.viability !== "ready" && candidate.viability !== "blocked")
  ) {
    return undefined;
  }
  const moduleState = candidate.moduleState as
    | {
        signal?: {
          supportNeedId?: unknown;
          marginalValue?: unknown;
          value?: unknown;
        };
      }
    | undefined;
  const waitsOnlyForThisFunding =
    candidate.blockers.length === 0 ||
    candidate.blockers.every(
      (blocker) =>
        blocker.code === "waiting_for_bound_funding_support" &&
        blocker.resumeCondition?.code === need.needId,
    );
  if (
    !waitsOnlyForThisFunding ||
    moduleState?.signal?.supportNeedId !== need.needId
  ) {
    return undefined;
  }
  if (
    typeof moduleState.signal.marginalValue === "number" &&
    moduleState.signal.marginalValue > 0
  ) {
    return moduleState.signal.marginalValue;
  }
  return typeof moduleState.signal.value === "number" &&
    moduleState.signal.value > 0
    ? moduleState.signal.value
    : undefined;
}
