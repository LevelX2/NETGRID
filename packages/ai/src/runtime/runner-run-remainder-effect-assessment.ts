import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import {
  currentEncounteredIceCard,
  currentRunHasFutureVisibleIce,
  currentRunRemainingIce,
} from "./current-encounter";
import { isTrashUnlessRunnerPaysSubroutine } from "./encounter-subroutine";
import { currentRunFuturePathAssessment } from "./runner-future-path-assessment";
import { runnerHasInstalledPrograms } from "./runner-installed-program";
import { parseSubroutineIndexes } from "./subroutine-indexes";

type RunRemainderEffectEntry = {
  index: number;
  effect: NonNullable<
    NonNullable<
      VisibleCard["effectiveRunQuote"]
    >["subroutines"][number]["unbrokenRunEffect"]
  >;
  subroutineType: string | undefined;
};

export type EncounterRunRemainderEffectAssessment = {
  hasRunRemainderEffect: boolean;
  mustBreak: boolean;
  futurePathBlocked: boolean;
  futureCostDelta: number;
  ignoredBecauseNoRemainingIce: boolean;
  remainingIceCount: number;
  remainingVisibleIceCount: number;
  paidConditionalPaymentRemediatesEffect: boolean;
  paidConditionalPaymentWithoutBeneficialEffect: boolean;
  evidence: string[];
};

export function encounterRunRemainderEffectAssessment(
  input: AiDecisionInput,
  action?: LegalAction,
): EncounterRunRemainderEffectAssessment {
  const quote = currentEncounteredIceCard(input)?.effectiveRunQuote;
  const targetIndexes =
    action?.type === "break_subroutine" &&
    typeof action.payload?.subroutineIndex === "number"
      ? [action.payload.subroutineIndex]
      : (quote?.subroutines
          .map((subroutine, index) =>
            subroutine.unbrokenRunEffect ? index : undefined,
          )
          .filter((index): index is number => index !== undefined) ?? []);
  const effects: RunRemainderEffectEntry[] = targetIndexes.flatMap((index) => {
    const effect = quote?.subroutines[index]?.unbrokenRunEffect;
    const subroutineType = quote?.subroutines[index]?.type;
    return effect ? [{ index, effect, subroutineType }] : [];
  });
  if (!quote || effects.length === 0) {
    return {
      hasRunRemainderEffect: false,
      mustBreak: false,
      futurePathBlocked: false,
      futureCostDelta: 0,
      ignoredBecauseNoRemainingIce: false,
      remainingIceCount: 0,
      remainingVisibleIceCount: 0,
      paidConditionalPaymentRemediatesEffect: false,
      paidConditionalPaymentWithoutBeneficialEffect: false,
      evidence: [],
    };
  }

  const payOrTrashProgramIndexes = parseSubroutineIndexes(
    action?.payload?.payOrTrashProgramSubroutineIndexes,
  );
  const payOrEndRunIndexes = parseSubroutineIndexes(
    action?.payload?.payOrEndRunSubroutineIndexes,
  );
  const payOrTrashProgramPayment = Number(
    action?.payload?.payOrTrashProgramSubroutinePayment ?? 0,
  );
  const payOrEndRunPayment = Number(
    action?.payload?.payOrEndRunSubroutinePayment ?? 0,
  );
  const hasInstalledPrograms = runnerHasInstalledPrograms(input);
  const actionableEffects = effects.filter(
    (entry) =>
      !(
        isTrashUnlessRunnerPaysSubroutine(entry.subroutineType) &&
        !hasInstalledPrograms
      ),
  );
  const remainingEffects = actionableEffects.filter((entry) => {
    if (
      isTrashUnlessRunnerPaysSubroutine(entry.subroutineType) &&
      Number.isFinite(payOrTrashProgramPayment) &&
      payOrTrashProgramPayment > 0 &&
      hasInstalledPrograms &&
      payOrTrashProgramIndexes.has(entry.index)
    )
      return false;
    if (
      entry.subroutineType === "end_the_run_unless_runner_pays" &&
      Number.isFinite(payOrEndRunPayment) &&
      payOrEndRunPayment > 0 &&
      payOrEndRunIndexes.has(entry.index)
    )
      return false;
    return true;
  });
  const paidConditionalPaymentRequested =
    (Number.isFinite(payOrTrashProgramPayment) &&
      payOrTrashProgramPayment > 0 &&
      payOrTrashProgramIndexes.size > 0) ||
    (Number.isFinite(payOrEndRunPayment) &&
      payOrEndRunPayment > 0 &&
      payOrEndRunIndexes.size > 0);
  const paidConditionalPaymentRemediatesEffect =
    paidConditionalPaymentRequested &&
    remainingEffects.length < actionableEffects.length;
  const paidConditionalPaymentWithoutBeneficialEffect =
    paidConditionalPaymentRequested && !paidConditionalPaymentRemediatesEffect;

  const remainingIce = currentRunRemainingIce(input);
  const remainingIceCount = remainingIce.length;
  const remainingVisibleIceCount = remainingIce.filter(
    (ice) => ice.known && ice.rezzed === true,
  ).length;
  const seriousNonCostRiskAfterAction = remainingEffects.some(
    ({ effect }) =>
      effect.causesDamageOrProgramTrash === true ||
      effect.preventsJackOut === true ||
      (effect.createsRunLockOrActionTax ?? 0) > 0,
  );
  const ignoredBecauseNoRemainingIce =
    remainingIceCount === 0 && !seriousNonCostRiskAfterAction;
  const basePath = currentRunFuturePathAssessment(input);
  const projectedPath = currentRunFuturePathAssessment(input, remainingEffects);
  const futureCostDelta = Math.max(
    0,
    (projectedPath.visibleBreakCost ?? 0) - (basePath.visibleBreakCost ?? 0),
  );
  const createsHardLock = remainingEffects.some(
    ({ effect }) => effect.preventsFutureBreaking === true,
  );
  const mustBreak =
    (!ignoredBecauseNoRemainingIce && projectedPath.blocked) ||
    (!ignoredBecauseNoRemainingIce &&
      createsHardLock &&
      currentRunHasFutureVisibleIce(input)) ||
    (seriousNonCostRiskAfterAction && !basePath.blocked);
  const evidence = [
    "run_remainder_subroutine_effect:true",
    `run_remainder_effect_subroutines:${effects.map(({ index }) => index).join(",")}`,
    `future_effect_remaining_ice:${remainingIceCount}`,
    `future_effect_remaining_visible_ice:${remainingVisibleIceCount}`,
    `future_path_blocked_if_unbroken:${projectedPath.blocked}`,
    `future_path_cost_delta_if_unbroken:${futureCostDelta}`,
    ...(ignoredBecauseNoRemainingIce
      ? ["unbroken_run_effect_ignored_because_no_remaining_ice:true"]
      : []),
    ...(!ignoredBecauseNoRemainingIce && remainingIceCount > 0
      ? ["unbroken_run_effect_applied_to_remaining_path:true"]
      : []),
    ...(remainingEffects.some(
      ({ effect }) => (effect.addsFutureEndTheRunSubroutines ?? 0) > 0,
    )
      ? ["adds_future_end_the_run_subroutines:true"]
      : []),
    ...(remainingEffects.some(
      ({ effect }) => (effect.increasesFutureBreakCostPerSubroutine ?? 0) > 0,
    )
      ? ["increases_future_break_cost:true"]
      : []),
    ...(remainingEffects.some(
      ({ effect }) => (effect.increasesFutureIceStrength ?? 0) > 0,
    )
      ? ["increases_future_ice_strength:true"]
      : []),
    ...(mustBreak ? ["run_remainder_effect_must_break:true"] : []),
  ];
  return {
    hasRunRemainderEffect:
      remainingEffects.length > 0 && !ignoredBecauseNoRemainingIce,
    paidConditionalPaymentRemediatesEffect,
    paidConditionalPaymentWithoutBeneficialEffect,
    mustBreak,
    futurePathBlocked: projectedPath.blocked,
    futureCostDelta,
    ignoredBecauseNoRemainingIce,
    remainingIceCount,
    remainingVisibleIceCount,
    evidence,
  };
}
