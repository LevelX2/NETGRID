import type {
  AiDecision,
  AiDecisionInput,
  LegalAction,
} from "@netgrid/shared";

export type RunnerBaselinePlanGuardContextDependencies = {
  delayedInstallAbilityForAction: (
    action: LegalAction,
  ) => string | undefined;
  runnerHasInstalledPrograms: (input: AiDecisionInput) => boolean;
};

export type RunnerBaselinePlanGuardContext = {
  runnerHasConditionalPaymentContinueDecision: (
    input: AiDecisionInput,
    action: LegalAction | undefined,
  ) => boolean;
  baselineShellTradersPlanIsVisible: (
    input: AiDecisionInput,
    decision: AiDecision,
  ) => boolean;
};

export function createRunnerBaselinePlanGuardContext(
  dependencies: RunnerBaselinePlanGuardContextDependencies,
): RunnerBaselinePlanGuardContext {
  function runnerHasConditionalPaymentContinueDecision(
    input: AiDecisionInput,
    action: LegalAction | undefined,
  ): boolean {
    if (!action || action.type !== "continue_run") return false;
    if (action.payload?.encounterContinue !== true) return false;
    const payOrTrashProgramPayment = Number(
      action.payload?.payOrTrashProgramSubroutinePayment ?? 0,
    );
    const payOrEndRunPayment = Number(
      action.payload?.payOrEndRunSubroutinePayment ?? 0,
    );
    const hasConditionalTrashPay =
      Number.isFinite(payOrTrashProgramPayment) &&
      payOrTrashProgramPayment > 0 &&
      typeof action.payload?.payOrTrashProgramSubroutineIndexes === "string";
    const hasConditionalEndRunPay =
      Number.isFinite(payOrEndRunPayment) &&
      payOrEndRunPayment > 0 &&
      typeof action.payload?.payOrEndRunSubroutineIndexes === "string";
    if (!hasConditionalTrashPay && !hasConditionalEndRunPay) return false;
    return dependencies.runnerHasInstalledPrograms(input);
  }

  function baselineShellTradersPlanIsVisible(
    input: AiDecisionInput,
    decision: AiDecision,
  ): boolean {
    if (
      decision.reasonCode !== "runner.shell_traders.prepare_install" &&
      decision.reasonCode !== "runner.shell_traders.remove_counter"
    )
      return false;
    const action = input.legalActions.find(
      (candidate) => candidate.actionId === decision.actionId,
    );
    if (!action || action.type !== "trigger_ability") return false;
    const delayedInstallAbility =
      dependencies.delayedInstallAbilityForAction(action);
    if (
      delayedInstallAbility !== "set_aside_from_grip" &&
      delayedInstallAbility !== "remove_shell_counter"
    )
      return false;
    if (action.source === "basic_action" || action.source === "game_rule")
      return false;
    return Boolean(
      input.playerView.own.rig?.some(
        (card) => card.known && card.instanceId === action.source,
      ),
    );
  }

  return {
    runnerHasConditionalPaymentContinueDecision,
    baselineShellTradersPlanIsVisible,
  };
}
