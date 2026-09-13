import type {
  PlanModule,
  PlanMaterialization,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import {
  runnerPlanProposal as proposal,
  runnerPlanAssessment as assessment,
  runnerPlanDomain,
} from "../../plans/runner-plan-module-support";
import type {
  RunnerCreditBankSignal,
  CreditBankState,
} from "./credit-bank-types";
import { runnerFundingParentMaterialValue } from "../../plans/runner-funding-parent";

export function createRunnerCreditBankModule(): PlanModule {
  return {
    moduleId: "runner.credit_bank",
    side: "runner",
    discover: (context) =>
      runnerPlanDomain<{ creditBanks: RunnerCreditBankSignal[] }>(
        context,
      ).creditBanks.map((signal) =>
        proposal({
          moduleId: "runner.credit_bank",
          dedupeKey: signal.bankId,
          moduleState: {
            kind: "credit_bank",
            phase: signal.phase,
            signal,
          } satisfies CreditBankState,
          priorityClass: signal.priorityClass,
          target: { kind: "bank", id: signal.bankId },
          routeExists: bankCandidates(context, signal).length > 0,
          blockerCode: `no_credit_bank_${signal.phase}_route`,
          evidenceCode:
            signal.evidenceCodes[0] ?? `runner_credit_bank_${signal.phase}`,
          ...(signal.runFunding
            ? {
                parentInstanceId: signal.runFunding.parentPlanInstanceId,
                parentNeedId: signal.runFunding.needId,
              }
            : {}),
        }),
      ),
    assess: (instance, context, portfolio) => {
      const signal = (instance.moduleState as CreditBankState).signal;
      const parentValue =
        signal.runFunding &&
        signal.runFunding.stateVersion === context.input.playerView.stateVersion
          ? portfolio.instances
              .map((parent) =>
                runnerFundingParentMaterialValue(parent, signal.runFunding!),
              )
              .find((value) => value !== undefined)
          : undefined;
      return assessment(
        instance,
        signal.priorityClass,
        bankCandidates(context, signal).length > 0 &&
          (!signal.runFunding || parentValue !== undefined),
        parentValue ?? signal.value,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, currentAssessment, context) => {
      const signal = (instance.moduleState as CreditBankState).signal;
      const candidates = bankCandidates(context, signal).map((entry) =>
        signal.runFunding
          ? {
              ...entry,
              stepValue:
                currentAssessment.withinClassValue + signal.estimatedPayout,
            }
          : entry,
      );
      const prospectiveBuild =
        signal.phase === "install" &&
        signal.prospectivePlan?.build.kind === "activated" &&
        signal.prospectivePlan?.build.projection === "feasible_in_projection"
          ? signal.prospectivePlan.build
          : undefined;
      return {
        step: {
          stepId: `${instance.instanceId}:${signal.phase}`,
          capability: {
            capabilityId: `credit_bank_${signal.phase}`,
            semanticActionTypes: [
              ...new Set(
                candidates.map((entry) => entry.candidate.semanticActionType),
              ),
            ],
          },
          target: { kind: "bank", id: signal.bankId },
          purpose:
            signal.phase === "install"
              ? "Install the bound multi-turn credit bank."
              : signal.phase === "build"
                ? "Invest the current once-per-turn bank action."
                : signal.phase === "cash_out"
                  ? "Convert the stored bank value into a bound funding need."
                  : "Keep the credit-bank plan resident until its next admissible phase.",
        },
        candidates,
        ...(prospectiveBuild
          ? {
              continuation: {
                continuationId: `${instance.instanceId}:prospective:${prospectiveBuild.capabilityKey}`,
                trigger: "action_applied" as const,
                nextCapability: {
                  capabilityId: "credit_bank_build",
                  semanticActionTypes: ["card_ability.trigger"],
                  legalActionTypes: ["activated_card_ability"],
                  requiredSourceDefinitionIds: [
                    signal.prospectivePlan!.sourceDefinitionId,
                  ],
                },
                target: { kind: "bank" as const, id: signal.bankId },
                purpose:
                  "Rematerialize the exact current build capability after the bank installation is applied.",
              },
            }
          : {}),
      };
    },
  };
}

function bankCandidates(
  context: PlanSchedulerContext,
  signal: RunnerCreditBankSignal,
): PlanMaterialization["candidates"] {
  const actionIds = new Set(signal.actionIds);
  return context.actionCandidates
    .filter((candidate) => {
      if (!actionIds.has(candidate.actionId)) return false;
      if (signal.phase !== "build" && signal.phase !== "cash_out") return true;
      return (
        candidate.planOwnerBinding?.owner === "runner.credit_bank" &&
        candidate.planOwnerBinding.route === signal.phase
      );
    })
    .map((candidate) => ({
      candidate,
      stepValue:
        signal.value +
        (signal.phase === "cash_out"
          ? signal.estimatedPayout
          : signal.phase === "build"
            ? Math.max(0, 12 - signal.currentStoredCredits)
            : 1),
    }));
}
