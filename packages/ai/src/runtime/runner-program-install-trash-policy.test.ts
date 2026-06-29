import { describe, expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";

import {
  programSacrificeCandidate,
  runnerProgramInstallTrashAssessmentEvidence,
  type ProgramSacrificeCandidate,
} from "./runner-program-install-trash-policy";

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
    expect(candidate(["support_breaker_fracter"]).reasonCategories).toContain(
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
    expect(candidate(["breaker_fracterish_noise"]).reasonCategories).toEqual([
      "low_visible_role",
    ]);
  });

  it("counts counter-value reason categories exactly in evidence", () => {
    const counterValueCandidate = candidateWithReasonCategories([
      "counters_or_stored_value",
    ]);
    const noisyCandidate = candidateWithReasonCategories([
      "counters_or_stored_value_noise",
    ]);

    expect(
      runnerProgramInstallTrashAssessmentEvidence({
        requiredMemoryToFree: 1,
        candidates: [counterValueCandidate, noisyCandidate],
        selection: {
          selectedCandidates: [counterValueCandidate],
          memoryFreed: 1,
          canFreeRequiredMemory: true,
        },
      }),
    ).toContain("program_sacrifice_counter_value_candidates:1");
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

function candidateWithReasonCategories(
  reasonCategories: string[],
): ProgramSacrificeCandidate {
  return {
    card: card(),
    memoryCost: 1,
    protectedRole: false,
    sacrificePenalty: 40,
    category: "low",
    acceptable: true,
    score: 30,
    reasonCategories,
  };
}
