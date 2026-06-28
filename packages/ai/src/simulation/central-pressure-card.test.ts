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
});
