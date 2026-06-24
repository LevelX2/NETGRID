import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

type RunnerPersistentInstallEvaluation = {
  stackabilityClass: string;
  capabilityDelta: string;
  duplicateRole: string;
  finalInstallFit: number;
  evidence: string[];
};

export type RunnerPersistentInstallFitScoreDependencies = {
  evaluationForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerPersistentInstallEvaluation | undefined;
};

export function runnerPersistentInstallFitScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerPersistentInstallFitScoreDependencies,
): AiDecisionScoreComponent | undefined {
  const evaluation = dependencies.evaluationForAction(input, action);
  if (!evaluation) return undefined;
  const scoreValue =
    evaluation.finalInstallFit < 0
      ? evaluation.finalInstallFit
      : Math.min(250, Math.round(evaluation.finalInstallFit / 4));
  return {
    key: "runner_persistent_install_fit",
    label: "Install-Grenznutzen",
    value: scoreValue,
    reason: sortedUnique([
      `stackability:${evaluation.stackabilityClass}`,
      `delta:${evaluation.capabilityDelta}`,
      `duplicate:${evaluation.duplicateRole}`,
      `fit:${evaluation.finalInstallFit}`,
    ]).join("|"),
  };
}

export function runnerPersistentInstallLegacyScoreDelta(
  evaluation: RunnerPersistentInstallEvaluation | undefined,
): number {
  if (!evaluation) return 0;
  return evaluation.finalInstallFit < 0
    ? evaluation.finalInstallFit
    : Math.min(180, Math.round(evaluation.finalInstallFit / 5));
}

export function runnerPersistentInstallEvidenceForAction(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerPersistentInstallFitScoreDependencies,
): string[] {
  const evaluation = dependencies.evaluationForAction(input, action);
  if (!evaluation) return [];
  return [
    "persistentInstallEvaluation:true",
    `persistentInstallStackability:${evaluation.stackabilityClass}`,
    `persistentInstallCapabilityDelta:${evaluation.capabilityDelta}`,
    `persistentInstallDuplicateRole:${evaluation.duplicateRole}`,
    `persistentInstallFinalFit:${evaluation.finalInstallFit}`,
    ...evaluation.evidence.slice(0, 16),
  ];
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "de"),
  );
}
