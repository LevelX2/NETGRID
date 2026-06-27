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
  });

  it("ignores substring-only role noise", () => {
    expect(rolesMatch(["microeconomy"], ["economy"])).toBe(false);
    expect(rolesMatch(["remotecontrol_noise"], ["remote"])).toBe(false);
    expect(rolesMatch(["tagalong"], ["tag"])).toBe(false);
  });
});
