import { describe, expect, it, vi } from "vitest";
import { centralPressureTargetsForCard } from "./central-pressure-card";

const cardRoleMock = vi.hoisted(() => ({
  roles: [] as string[],
}));

vi.mock("../runtime/card-role-lookup", () => ({
  cardRolesForId: () => cardRoleMock.roles,
}));

describe("centralPressureTargetsForCard", () => {
  it("matches multiaccess roles by bounded role terms", () => {
    cardRoleMock.roles = ["interface_multiaccess"];
    expect(
      centralPressureTargetsForCard("onr_v1_024_expert-schedule-analyzer"),
    ).toEqual(["hq", "rd"]);

    cardRoleMock.roles = ["multiaccessory_noise"];
    expect(
      centralPressureTargetsForCard("onr_v1_024_expert-schedule-analyzer"),
    ).toEqual([]);
  });

  it("matches central pressure roles by bounded role terms", () => {
    cardRoleMock.roles = [
      "pressure_rnd",
      "support_hq_pressure",
      "archives_pressure",
    ];
    expect(centralPressureTargetsForCard("test-pressure-card")).toEqual([
      "archives",
      "hq",
      "rd",
    ]);

    cardRoleMock.roles = [
      "pressure_rndish_noise",
      "support_hq_pressureish_noise",
      "archives_pressureish_noise",
    ];
    expect(centralPressureTargetsForCard("test-pressure-card")).toEqual([]);
  });
});
