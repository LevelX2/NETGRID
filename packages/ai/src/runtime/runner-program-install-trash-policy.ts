import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

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
