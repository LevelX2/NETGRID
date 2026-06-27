import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

export type SemanticRuntimePlanMemorySnapshot = {
  type?: string;
};

export type SemanticRuntimePlanMemoryExclusionDependencies = {
  previousPlan: (
    input: AiDecisionInput,
  ) => SemanticRuntimePlanMemorySnapshot | undefined;
  isRunnerBankCashOutAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  runnerBankCashOutIsUsefulNow: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  runnerBankInvestmentCommitmentEvidence: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string[];
};

export type SemanticRuntimePlanMemoryExclusionContext = {
  semanticRuntimePlanMemoryActionExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
};

export function createSemanticRuntimePlanMemoryExclusionContext(
  dependencies: SemanticRuntimePlanMemoryExclusionDependencies,
): SemanticRuntimePlanMemoryExclusionContext {
  function actionExclusion(
    input: AiDecisionInput,
    action: LegalAction,
  ): SemanticRuntimeExclusion | undefined {
    return semanticRuntimePlanMemoryActionExclusion(input, action, dependencies);
  }

  return { semanticRuntimePlanMemoryActionExclusion: actionExclusion };
}

export function semanticRuntimePlanMemoryActionExclusion(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimePlanMemoryExclusionDependencies,
): SemanticRuntimeExclusion | undefined {
  const previousPlan = dependencies.previousPlan(input);
  if (
    input.side === "runner" &&
    previousPlan?.type === "runner.build_credit_bank" &&
    input.playerView.own.credits > 3 &&
    action.type === "trigger_ability" &&
    dependencies.isRunnerBankCashOutAction(input, action)
  ) {
    return {
      key: "bank_cashout_deferred_after_build",
      label: "Bank-Auszahlung verschoben",
      reason:
        "previous build_credit_bank plan is still stable and no concrete funding need is visible",
    };
  }
  if (
    input.side === "runner" &&
    dependencies.isRunnerBankCashOutAction(input, action) &&
    !dependencies.runnerBankCashOutIsUsefulNow(input, action)
  ) {
    return {
      key: "bank_cashout_without_funding_need",
      label: "Bank-Auszahlung ohne Bedarf",
      reason: dependencies
        .runnerBankInvestmentCommitmentEvidence(input, action)
        .filter(
          (entry) =>
            entry.startsWith("bankCommitmentStatus:") ||
            entry.startsWith("bankStoredCredits:") ||
            entry.startsWith("cashOutPriority:") ||
            entry.startsWith("why_cashout_now:"),
        )
        .join("|"),
    };
  }
  return undefined;
}
