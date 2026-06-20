export type StalePunishRootCause =
  | "missing_tag_window"
  | "missing_punish_payoff"
  | "scoreline_should_replace"
  | "protection_should_replace"
  | string;

export type StalePunishGoalSwitchInput = {
  rootCause: StalePunishRootCause;
  runnerTaggedWindow: boolean;
  payoffVisible: boolean;
  payoffLegal: boolean;
  payoffPayable: boolean;
  scorelineBetter: boolean;
  protectionBetter: boolean;
};

export type StalePunishGoalSwitchShadow = {
  schemaVersion: "stale-punish-goal-switch-shadow-v1";
  shadowOnly: true;
  punishIntentEnabled: boolean;
  replacementGoal:
    | "punish_remains_possible"
    | "corp.shadow_switch_to_scoreline"
    | "corp.shadow_switch_to_protection"
    | "corp.shadow_switch_to_economy_conversion"
    | "corp.shadow_disable_punish_without_replacement";
  reason: string;
  runtimeEffect: false;
  evidence: string[];
};

export function evaluateStalePunishGoalSwitchShadow(
  input: StalePunishGoalSwitchInput,
): StalePunishGoalSwitchShadow {
  const payoffLive = input.runnerTaggedWindow && input.payoffVisible && input.payoffLegal && input.payoffPayable;
  if (payoffLive) {
    return shadow("punish_remains_possible", true, "visible_legal_payoff_window", input);
  }
  if (input.scorelineBetter || input.rootCause === "scoreline_should_replace") {
    return shadow("corp.shadow_switch_to_scoreline", false, "scoreline_replacement_preferred", input);
  }
  if (input.protectionBetter || input.rootCause === "protection_should_replace") {
    return shadow("corp.shadow_switch_to_protection", false, "protection_replacement_preferred", input);
  }
  if (input.rootCause === "missing_tag_window" || input.rootCause === "missing_punish_payoff") {
    return shadow(
      "corp.shadow_switch_to_economy_conversion",
      false,
      input.rootCause,
      input,
    );
  }
  return shadow("corp.shadow_disable_punish_without_replacement", false, "no_real_punish_window", input);
}

function shadow(
  replacementGoal: StalePunishGoalSwitchShadow["replacementGoal"],
  punishIntentEnabled: boolean,
  reason: string,
  input: StalePunishGoalSwitchInput,
): StalePunishGoalSwitchShadow {
  return {
    schemaVersion: "stale-punish-goal-switch-shadow-v1",
    shadowOnly: true,
    punishIntentEnabled,
    replacementGoal,
    reason,
    runtimeEffect: false,
    evidence: [
      `rootCause:${input.rootCause}`,
      `runnerTaggedWindow:${input.runnerTaggedWindow}`,
      `payoffVisible:${input.payoffVisible}`,
      `payoffLegal:${input.payoffLegal}`,
      `payoffPayable:${input.payoffPayable}`,
      `scorelineBetter:${input.scorelineBetter}`,
      `protectionBetter:${input.protectionBetter}`,
      "shadow_only:true",
      "no_runtime_weight_change:true",
    ],
  };
}
