import { describe, expect, it } from "vitest";
import { evaluateStalePunishGoalSwitchShadow } from "./stale-punish-goal-switch-shadow";

describe("stale punish goal switch shadow", () => {
  it("does not prioritize punish when there is no tagged-runner window", () => {
    const shadow = evaluateStalePunishGoalSwitchShadow({
      rootCause: "missing_tag_window",
      runnerTaggedWindow: false,
      payoffVisible: false,
      payoffLegal: false,
      payoffPayable: false,
      scorelineBetter: false,
      protectionBetter: false,
    });

    expect(shadow.punishIntentEnabled).toBe(false);
    expect(shadow.replacementGoal).toBe("corp.shadow_switch_to_economy_conversion");
    expect(shadow.runtimeEffect).toBe(false);
  });

  it("keeps punish possible when tagged runner and legal payoff are visible", () => {
    const shadow = evaluateStalePunishGoalSwitchShadow({
      rootCause: "missing_punish_payoff",
      runnerTaggedWindow: true,
      payoffVisible: true,
      payoffLegal: true,
      payoffPayable: true,
      scorelineBetter: true,
      protectionBetter: true,
    });

    expect(shadow.punishIntentEnabled).toBe(true);
    expect(shadow.replacementGoal).toBe("punish_remains_possible");
  });

  it("switches to scoreline or protection when no payoff is live", () => {
    expect(
      evaluateStalePunishGoalSwitchShadow({
        rootCause: "scoreline_should_replace",
        runnerTaggedWindow: true,
        payoffVisible: false,
        payoffLegal: false,
        payoffPayable: false,
        scorelineBetter: true,
        protectionBetter: false,
      }).replacementGoal,
    ).toBe("corp.shadow_switch_to_scoreline");
    expect(
      evaluateStalePunishGoalSwitchShadow({
        rootCause: "protection_should_replace",
        runnerTaggedWindow: true,
        payoffVisible: false,
        payoffLegal: false,
        payoffPayable: false,
        scorelineBetter: false,
        protectionBetter: true,
      }).replacementGoal,
    ).toBe("corp.shadow_switch_to_protection");
  });
});
