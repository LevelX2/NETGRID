import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import { rolesHaveBreakerRole } from "./breaker-role-match";
import { rolesMatch } from "./role-match";

export type ProgramSacrificeCategory = "critical" | "high" | "medium" | "low";

export type ProgramSacrificeCandidate = {
  option?: NonNullable<
    AiDecisionInput["playerView"]["pendingChoice"]
  >["options"][number];
  card?: VisibleCard;
  memoryCost: number;
  protectedRole: boolean;
  sacrificePenalty: number;
  category: ProgramSacrificeCategory;
  acceptable: boolean;
  score: number;
  reasonCategories: string[];
};

export type RunnerProgramInstallTrashAssessment = {
  memoryRequired: boolean;
  requiredMemoryToFree: number;
  candidates: ProgramSacrificeCandidate[];
  selectedCandidates: ProgramSacrificeCandidate[];
  memoryFreedBySelectedCandidates: number;
  canFreeRequiredMemory: boolean;
  evidence: string[];
};

export function selectedProgramSacrificeCandidates(
  candidates: readonly ProgramSacrificeCandidate[],
  requiredMemoryToFree: number,
): {
  selectedCandidates: ProgramSacrificeCandidate[];
  memoryFreed: number;
  canFreeRequiredMemory: boolean;
} {
  if (requiredMemoryToFree <= 0) {
    return {
      selectedCandidates: [],
      memoryFreed: 0,
      canFreeRequiredMemory: true,
    };
  }
  const selectedCandidates: ProgramSacrificeCandidate[] = [];
  let memoryFreed = 0;
  for (const candidate of candidates) {
    if (!candidate.acceptable) continue;
    selectedCandidates.push(candidate);
    memoryFreed += candidate.memoryCost;
    if (memoryFreed >= requiredMemoryToFree) break;
  }
  return {
    selectedCandidates,
    memoryFreed,
    canFreeRequiredMemory: memoryFreed >= requiredMemoryToFree,
  };
}

export function runnerProgramInstallTrashAssessmentEvidence(params: {
  requiredMemoryToFree: number;
  candidates: readonly ProgramSacrificeCandidate[];
  selection: ReturnType<typeof selectedProgramSacrificeCandidates>;
}): string[] {
  const bestCandidate =
    params.selection.selectedCandidates[0] ?? params.candidates[0];
  return [
    "choice_source:runner_program_trash_before_install",
    "runner_program_trash_before_install:true",
    `memory_required:${params.requiredMemoryToFree}`,
    `trash_candidates:${params.candidates.length}`,
    `protected_icebreakers:${params.candidates.filter((candidate) => candidate.protectedRole).length}`,
    `program_sacrifice_candidates:${params.candidates.length}`,
    `program_sacrifice_acceptable_candidates:${params.candidates.filter((candidate) => candidate.acceptable).length}`,
    `program_sacrifice_counter_value_candidates:${
      params.candidates.filter((candidate) =>
        candidate.reasonCategories.includes("counters_or_stored_value"),
      ).length
    }`,
    `program_sacrifice_can_free_required:${params.selection.canFreeRequiredMemory}`,
    `program_sacrifice_memory_freed:${params.selection.memoryFreed}`,
    `program_sacrifice_selected_candidates:${params.selection.selectedCandidates.length}`,
    `program_sacrifice_selected_category:${params.selection.selectedCandidates[0]?.category ?? "none"}`,
    ...(bestCandidate
      ? [
          `program_sacrifice_best_category:${bestCandidate.category}`,
          `program_sacrifice_best_penalty:${bestCandidate.sacrificePenalty}`,
          ...bestCandidate.reasonCategories
            .slice(0, 4)
            .map((reason) => `program_sacrifice_reason:${reason}`),
        ]
      : ["program_sacrifice_best_category:none"]),
  ];
}

export function runnerProgramInstallDisplacementPenalty(
  assessment: RunnerProgramInstallTrashAssessment | undefined,
): number {
  if (!assessment?.memoryRequired) return 0;
  if (!assessment.canFreeRequiredMemory) return 3200;
  const selectedPenalty = assessment.selectedCandidates.reduce(
    (sum, candidate) => sum + candidate.sacrificePenalty,
    0,
  );
  return Math.min(2600, 240 + selectedPenalty);
}

export function programSacrificeCategory(
  sacrificePenalty: number,
  protectedRole: boolean,
): ProgramSacrificeCategory {
  if (protectedRole || sacrificePenalty >= 1100) return "critical";
  if (sacrificePenalty >= 650) return "high";
  if (sacrificePenalty >= 260) return "medium";
  return "low";
}

export function sacrificeCandidateLabel(
  candidate: ProgramSacrificeCandidate,
): string {
  return (
    candidate.option?.label ??
    candidate.card?.title ??
    candidate.card?.definitionId ??
    ""
  );
}

export function programSacrificeCandidateIsRedundant(
  card: VisibleCard | undefined,
  breakerRoles: readonly string[],
  rig: readonly VisibleCard[],
  roleCounts: ReadonlyMap<string, number>,
): boolean {
  if (!card) return false;
  if (
    card.definitionId &&
    rig.filter((candidate) => candidate.definitionId === card.definitionId)
      .length > 1
  ) {
    return true;
  }
  if (breakerRoles.length === 0) return false;
  return breakerRoles.every((role) => (roleCounts.get(role) ?? 0) > 1);
}

export function runnerProgramInstallTrashAssessmentFromCards(params: {
  memoryUsed: number;
  memoryLimit: number;
  sourceMemoryCost: number;
  candidates: readonly ProgramSacrificeCandidate[];
}): RunnerProgramInstallTrashAssessment {
  const requiredMemoryToFree = Math.max(
    0,
    params.memoryUsed + params.sourceMemoryCost - params.memoryLimit,
  );
  const sortedCandidates = [...params.candidates]
    .filter((candidate) => candidate.memoryCost > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.memoryCost - left.memoryCost ||
        sacrificeCandidateLabel(left).localeCompare(
          sacrificeCandidateLabel(right),
          "de",
        ),
    );
  const selection = selectedProgramSacrificeCandidates(
    sortedCandidates,
    requiredMemoryToFree,
  );
  const evidence = runnerProgramInstallTrashAssessmentEvidence({
    requiredMemoryToFree,
    candidates: sortedCandidates,
    selection,
  });
  return {
    memoryRequired: requiredMemoryToFree > 0,
    requiredMemoryToFree,
    candidates: sortedCandidates,
    selectedCandidates: selection.selectedCandidates,
    memoryFreedBySelectedCandidates: selection.memoryFreed,
    canFreeRequiredMemory: selection.canFreeRequiredMemory,
    evidence,
  };
}

export type ProgramSacrificeCandidateDependencies = {
  visibleMemoryCost: (card: VisibleCard | undefined) => number;
  rolesForCardId: (definitionId: string | undefined) => readonly string[];
  visibleBreakerRoles: (card: VisibleCard) => readonly string[];
  isRunnerPressureRole: (role: string) => boolean;
  isRunnerEconomyRole: (role: string) => boolean;
  visibleCounterValue: (card: VisibleCard | undefined) => number;
  visibleInstallCost: (card: VisibleCard | undefined) => number;
  isRedundant: (
    card: VisibleCard | undefined,
    breakerRoles: readonly string[],
  ) => boolean;
};

export function programSacrificeCandidate(
  card: VisibleCard | undefined,
  installedBreakerRoleCounts: ReadonlyMap<string, number>,
  option: ProgramSacrificeCandidate["option"] | undefined,
  dependencies: ProgramSacrificeCandidateDependencies,
): ProgramSacrificeCandidate {
  const memoryCost = dependencies.visibleMemoryCost(card);
  const roles = dependencies.rolesForCardId(card?.definitionId);
  const breakerRoles = card ? dependencies.visibleBreakerRoles(card) : [];
  const protectedRole =
    breakerRoles.length > 0 &&
    breakerRoles.some((role) => installedBreakerRoleCounts.get(role) === 1);
  const reasonCategories: string[] = [];
  let sacrificePenalty = 40;

  if (protectedRole) {
    sacrificePenalty += 1500;
    reasonCategories.push("unique_breaker_coverage");
  } else if (
    breakerRoles.length > 0 ||
    rolesHaveBreakerRole(roles)
  ) {
    sacrificePenalty += 420;
    reasonCategories.push("breaker_coverage");
  }

  if (roles.some(dependencies.isRunnerPressureRole)) {
    sacrificePenalty += 420;
    reasonCategories.push("run_or_access_payoff");
  }
  if (roles.some(dependencies.isRunnerEconomyRole)) {
    sacrificePenalty += 280;
    reasonCategories.push("economy_engine");
  }
  if (
    rolesMatch(roles, [
      "draw",
      "setup",
      "build_rig",
      "memory",
      "memory_support",
      "defense",
      "protection",
      "hosting",
      "recovery",
      "search",
    ])
  ) {
    sacrificePenalty += 210;
    reasonCategories.push("setup_or_support_role");
  }

  const counterValue = dependencies.visibleCounterValue(card);
  if (counterValue > 0) {
    sacrificePenalty += Math.min(240, 80 + counterValue * 25);
    reasonCategories.push("counters_or_stored_value");
  }

  const installCost = dependencies.visibleInstallCost(card);
  if (installCost > 0) {
    sacrificePenalty += Math.min(220, installCost * 25);
    reasonCategories.push("sunk_install_cost");
  }

  const redundant = dependencies.isRedundant(card, breakerRoles);
  if (redundant) {
    sacrificePenalty = Math.max(20, sacrificePenalty - 260);
    reasonCategories.push("redundant_or_replaceable");
  }
  if (reasonCategories.length === 0) reasonCategories.push("low_visible_role");

  const category = programSacrificeCategory(sacrificePenalty, protectedRole);
  const acceptable = category === "low" || category === "medium";
  return {
    ...(option ? { option } : {}),
    ...(card ? { card } : {}),
    memoryCost,
    protectedRole,
    sacrificePenalty,
    category,
    acceptable,
    score: memoryCost * 70 - sacrificePenalty + (redundant ? 120 : 0),
    reasonCategories: sortedUnique(reasonCategories),
  };
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right),
  );
}
