import { describe, expect, it } from "vitest";

import {
  isRunnerEconomyRole,
  isRunnerNonAdditiveUtilityRole,
  isRunnerPressureRole,
} from "./runner-role-classification";

describe("runner role classification", () => {
  it("classifies structured economy and pressure roles", () => {
    expect(isRunnerEconomyRole("asset_economy")).toBe(true);
    expect(isRunnerEconomyRole("tempo")).toBe(true);
    expect(isRunnerPressureRole("run_pressure")).toBe(true);
    expect(isRunnerPressureRole("runner.pressure_hq.support")).toBe(true);
    expect(isRunnerPressureRole("interface_multiaccess")).toBe(true);
  });

  it("ignores substring-only role noise", () => {
    expect(isRunnerEconomyRole("microeconomy")).toBe(false);
    expect(isRunnerPressureRole("pressurewasher")).toBe(false);
    expect(isRunnerPressureRole("accessory_noise")).toBe(false);
  });

  it("keeps non-additive setup utility paths structured", () => {
    expect(isRunnerNonAdditiveUtilityRole("setup.recovery")).toBe(true);
    expect(isRunnerNonAdditiveUtilityRole("setup.recovery.heap")).toBe(true);
    expect(isRunnerNonAdditiveUtilityRole("setup.stack_filter")).toBe(true);
    expect(isRunnerNonAdditiveUtilityRole("pre_setup.recovery_noise")).toBe(
      false,
    );
  });
});
