export type RunnerMuPressureSeverity =
  | "none"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type RunnerMuPressureAssessment = {
  memoryUsed: number;
  memoryLimit: number;
  memoryAvailable: number;
  pendingProgramInstallMemory: number;
  muAfterInstall: number;
  requiresProgramTrash: boolean;
  criticalProgramSacrificeRisk: boolean;
  usefulProgramsInHand: number;
  memorySupportLegalActions: number;
  affordableMemorySupportActions: number;
  memorySupportInHand: number;
  memorySupportSearchable: boolean;
  missingCreditsForCheapestMemorySupport?: number;
  severity: RunnerMuPressureSeverity;
  evidence: string[];
};

export function runnerMuPressureSeverity(context: {
  memoryAvailable: number;
  pendingProgramInstallMemory: number;
  requiresProgramTrash: boolean;
  criticalProgramSacrificeRisk: boolean;
  usefulProgramsInHand: number;
  memorySupportInHand: number;
  memorySupportLegalActions: number;
}): RunnerMuPressureSeverity {
  const hasUsefulProgramPressure =
    context.usefulProgramsInHand > 0 ||
    context.pendingProgramInstallMemory > context.memoryAvailable ||
    context.requiresProgramTrash;
  if (!hasUsefulProgramPressure) return "none";
  if (context.criticalProgramSacrificeRisk) return "critical";
  if (context.requiresProgramTrash) return "high";
  if (context.memoryAvailable <= 0 && context.usefulProgramsInHand > 0) {
    return "high";
  }
  if (context.memoryAvailable <= 1 && context.usefulProgramsInHand > 0) {
    return "medium";
  }
  if (context.pendingProgramInstallMemory > context.memoryAvailable) {
    return "medium";
  }
  return "none";
}

export function runnerMuPressureSeverityBonus(
  severity: RunnerMuPressureSeverity,
): number {
  switch (severity) {
    case "critical":
      return 1040;
    case "high":
      return 820;
    case "medium":
      return 460;
    case "low":
      return 140;
    case "none":
      return 0;
  }
}

export function runnerMuPressureSeverityFundingBonus(
  severity: RunnerMuPressureSeverity,
): number {
  switch (severity) {
    case "critical":
      return 860;
    case "high":
      return 700;
    case "medium":
      return 360;
    case "low":
      return 120;
    case "none":
      return 0;
  }
}

export function runnerMuPressureEvidence(
  assessment: Omit<RunnerMuPressureAssessment, "evidence">,
): string[] {
  if (assessment.severity === "none") return [];
  return sortedUnique([
    `runner_mu_pressure_severity:${assessment.severity}`,
    `runner_memory_used:${assessment.memoryUsed}`,
    `runner_memory_limit:${assessment.memoryLimit}`,
    `runner_memory_available:${assessment.memoryAvailable}`,
    `runner_pending_program_install_memory:${assessment.pendingProgramInstallMemory}`,
    `runner_mu_after_install:${assessment.muAfterInstall}`,
    `runner_program_install_requires_trash:${assessment.requiresProgramTrash}`,
    `runner_critical_program_sacrifice_risk:${assessment.criticalProgramSacrificeRisk}`,
    `runner_useful_programs_in_hand:${assessment.usefulProgramsInHand}`,
    `runner_memory_support_legal_actions:${assessment.memorySupportLegalActions}`,
    `runner_memory_support_affordable_actions:${assessment.affordableMemorySupportActions}`,
    `runner_memory_support_in_hand:${assessment.memorySupportInHand}`,
    `runner_memory_support_searchable:${assessment.memorySupportSearchable}`,
    ...(assessment.missingCreditsForCheapestMemorySupport !== undefined
      ? [
          `runner_memory_support_missing_credits:${assessment.missingCreditsForCheapestMemorySupport}`,
        ]
      : []),
    ...runnerMuPressureReasonTags(assessment),
  ]);
}

export function runnerMuPressureReason(
  assessment: RunnerMuPressureAssessment,
): string {
  return [
    assessment.severity,
    `memory_available:${assessment.memoryAvailable}`,
    `useful_programs:${assessment.usefulProgramsInHand}`,
    `memory_support:${assessment.affordableMemorySupportActions}`,
  ].join("|");
}

export function runnerMuPressureReasonTags(
  assessment: Omit<RunnerMuPressureAssessment, "evidence">,
): string[] {
  return [
    ...(assessment.memoryAvailable <= 0 && assessment.usefulProgramsInHand > 0
      ? ["runner_mu_pressure_reason:full_mu_with_useful_programs"]
      : []),
    ...(assessment.memoryAvailable === 1 && assessment.usefulProgramsInHand > 0
      ? ["runner_mu_pressure_reason:low_mu_with_useful_programs"]
      : []),
    ...(assessment.requiresProgramTrash
      ? ["runner_mu_pressure_reason:program_install_requires_trash"]
      : []),
    ...(assessment.criticalProgramSacrificeRisk
      ? ["runner_mu_pressure_reason:critical_sacrifice_alternative"]
      : []),
    ...(assessment.affordableMemorySupportActions > 0
      ? ["runner_mu_pressure_reason:memory_support_affordable"]
      : []),
    ...(assessment.missingCreditsForCheapestMemorySupport !== undefined
      ? ["runner_mu_pressure_reason:memory_support_missing_credits"]
      : []),
  ];
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right),
  );
}
