import { describe, expect, it } from "vitest";

import { rolesMatch } from "./role-match";

describe("rolesMatch", () => {
  it("matches exact, prefix and compound role segments", () => {
    expect(rolesMatch(["economy"], ["economy"])).toBe(true);
    expect(rolesMatch(["breaker_fracter"], ["breaker_"])).toBe(true);
    expect(rolesMatch(["asset_economy"], ["economy"])).toBe(true);
    expect(rolesMatch(["runner.pressure_hq.support"], ["pressure_hq"])).toBe(
      true,
    );
    expect(rolesMatch(["remote_economy_asset_support"], ["economy_asset"])).toBe(
      true,
    );
    expect(rolesMatch(["runner.pre_economy_support"], ["economy"])).toBe(
      true,
    );
  });

  it("ignores substring-only role noise", () => {
    expect(rolesMatch(["microeconomy"], ["economy"])).toBe(false);
    expect(rolesMatch(["remotecontrol_noise"], ["remote"])).toBe(false);
    expect(rolesMatch(["tagalong"], ["tag"])).toBe(false);
    expect(rolesMatch(["runner.pre_economyish_support"], ["economy"])).toBe(
      false,
    );
    expect(rolesMatch(["breakerish_fracter"], ["breaker_"])).toBe(false);
  });
});
