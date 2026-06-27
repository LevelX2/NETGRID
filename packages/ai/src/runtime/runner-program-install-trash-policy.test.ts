import { describe, expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";

import { programSacrificeCandidate } from "./runner-program-install-trash-policy";

describe("programSacrificeCandidate", () => {
  it("classifies structured support and breaker roles", () => {
    expect(candidate(["setup"]).reasonCategories).toContain(
      "setup_or_support_role",
    );
    expect(candidate(["stack_search"]).reasonCategories).toContain(
      "setup_or_support_role",
    );
    expect(candidate(["breaker_fracter"]).reasonCategories).toContain(
      "breaker_coverage",
    );
  });

  it("ignores substring-only sacrifice role noise", () => {
    expect(candidate(["setupsomething_noise"]).reasonCategories).toEqual([
      "low_visible_role",
    ]);
    expect(candidate(["searchlight_noise"]).reasonCategories).toEqual([
      "low_visible_role",
    ]);
    expect(candidate(["breakerish_noise"]).reasonCategories).toEqual([
      "low_visible_role",
    ]);
  });
});

function candidate(roles: readonly string[]) {
  return programSacrificeCandidate(
    card(),
    new Map(),
    undefined,
    {
      visibleMemoryCost: () => 1,
      rolesForCardId: () => roles,
      visibleBreakerRoles: () => [],
      isRunnerPressureRole: () => false,
      isRunnerEconomyRole: () => false,
      visibleCounterValue: () => 0,
      visibleInstallCost: () => 0,
      isRedundant: () => false,
    },
  );
}

function card(): VisibleCard {
  return {
    instanceId: "program-instance",
    definitionId: "program-definition",
    title: "Program",
    type: "program",
    known: true,
  } as VisibleCard;
}
