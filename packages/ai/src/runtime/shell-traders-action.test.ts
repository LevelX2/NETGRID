import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { shellTradersTargetValue } from "./shell-traders-action";
import { shellTradersDirectInstallUrgency } from "./shell-traders-urgency";

describe("shell traders role scoring", () => {
  it("matches target value roles by bounded role terms", () => {
    expect(
      shellTradersTargetValue(
        ["support_memory", "setup", "runner_economy"],
        2,
      ),
    ).toBe(140);
    expect(
      shellTradersTargetValue(
        ["memoryish_noise", "setupish_noise", "economyish_noise"],
        2,
      ),
    ).toBe(20);
    expect(shellTradersTargetValue(["support_breaker_fracter"], 0)).toBe(105);
    expect(shellTradersTargetValue(["breaker_fracterish_noise"], 0)).toBe(0);
  });

  it("matches direct install urgency roles by bounded role terms", () => {
    expect(
      shellTradersDirectInstallUrgency(
        input(),
        ["support_memory", "build_rig", "tempo"],
        action(),
        new Set(),
      ),
    ).toBe(255);
    expect(
      shellTradersDirectInstallUrgency(
        input(),
        ["memoryish_noise", "build_rigish_noise", "tempoish_noise"],
        action(),
        new Set(),
      ),
    ).toBe(45);
    expect(
      shellTradersDirectInstallUrgency(
        input(),
        ["support_breaker_fracter"],
        action(),
        new Set(),
      ),
    ).toBe(190);
    expect(
      shellTradersDirectInstallUrgency(
        input(),
        ["support_breaker_fracter"],
        action(),
        new Set(["breaker_fracter"]),
      ),
    ).toBe(45);
    expect(
      shellTradersDirectInstallUrgency(
        input(),
        ["breaker_fracterish_noise"],
        action(),
        new Set(),
      ),
    ).toBe(45);
  });
});

function input(): AiDecisionInput {
  return {
    playerView: {
      own: {
        credits: 3,
        memoryLimit: 4,
        memoryUsed: 3,
        rig: [],
      },
    },
  } as unknown as AiDecisionInput;
}

function action(): LegalAction {
  return {
    actionId: "install",
    type: "install_card",
    side: "runner",
    costs: [{ kind: "credits", amount: 1 }],
  } as unknown as LegalAction;
}
