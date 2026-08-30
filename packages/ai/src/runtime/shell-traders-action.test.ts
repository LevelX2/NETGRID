import { describe, expect, it } from "vitest";
import { shellTradersTargetValue } from "./shell-traders-action";

describe("shell traders role scoring", () => {
  it("matches target value roles by bounded role terms", () => {
    expect(
      shellTradersTargetValue(["support_memory", "setup", "runner_economy"], 2),
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
});
