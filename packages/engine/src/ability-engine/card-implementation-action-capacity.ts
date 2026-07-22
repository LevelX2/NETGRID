import type { CardEffectImplementation } from "./definition-types";

export type ActionCapacityLegalActionPayload = {
  gainActionsAmount?: number;
  actionCapacityTiming?: "immediate" | "future_turn_start";
  actionCapacityRestriction?:
    | "unrestricted"
    | "install_only"
    | "program_install_only"
    | "run_only";
  actionCapacityAllowedActionType?: string;
  actionCapacityReliability?: "guaranteed" | "conditional" | "random";
  actionCapacityExpiresAt?: "side_turn_end" | "duration_end";
  actionCapacitySelfFinancing?: boolean;
  actionCapacityGainAmountPerTurn?: number;
  actionCapacityDurationTurns?: number;
};

/**
 * Projects only deterministic action-capacity effects whose complete contract
 * is known when the LegalAction is generated. Variable, random and delayed
 * nested effects stay out of this payload unless they expose their own exact
 * structured timing contract.
 */
export function actionCapacityLegalActionPayloadForEffects(
  effects: readonly CardEffectImplementation[],
  controller: "corp" | "runner",
): ActionCapacityLegalActionPayload {
  const unrestrictedGain = effects.reduce(
    (sum, effect) =>
      effect.kind === "gain_actions" &&
      (effect.recipient === "controller" || effect.recipient === controller)
        ? sum + Math.max(0, Math.floor(effect.amount))
        : sum,
    0,
  );
  if (unrestrictedGain > 0) {
    return {
      gainActionsAmount: unrestrictedGain,
      actionCapacityTiming: "immediate",
      actionCapacityRestriction: "unrestricted",
      actionCapacityReliability: "guaranteed",
      actionCapacityExpiresAt: "side_turn_end",
    };
  }

  const programInstallBundle = effects.find(
    (effect) => effect.kind === "start_runner_program_install_action_bundle",
  );
  if (
    controller === "runner" &&
    programInstallBundle?.kind ===
      "start_runner_program_install_action_bundle" &&
    programInstallBundle.actionCount > 0
  ) {
    return {
      gainActionsAmount: Math.floor(programInstallBundle.actionCount),
      actionCapacityTiming: "immediate",
      actionCapacityRestriction: "program_install_only",
      actionCapacityAllowedActionType: "install_card",
      actionCapacityReliability: "guaranteed",
      actionCapacityExpiresAt: "side_turn_end",
    };
  }

  return {};
}
