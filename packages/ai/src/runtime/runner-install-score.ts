import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { rolesHaveBreakerRole } from "./breaker-role-match";
import {
  runnerVisibleSearchCoverageNeed,
  visibleCardCoversRequiredCoverage,
} from "./runner-search-coverage-need";

type RunnerProgramSacrificeInstallAssessment = {
  memoryRequired: boolean;
  requiredMemoryToFree: number;
  selectedCandidates: RunnerProgramSacrificeInstallCandidate[];
  candidates: RunnerProgramSacrificeInstallCandidate[];
  memoryFreedBySelectedCandidates: number;
  canFreeRequiredMemory: boolean;
  evidence: string[];
};

type RunnerProgramSacrificeInstallCandidate = {
  memoryCost: number;
  protectedRole: boolean;
  sacrificePenalty: number;
  category: "critical" | "high" | "medium" | "low";
  acceptable: boolean;
  score: number;
  reasonCategories: string[];
};

export type RunnerInstallScoreDependencies = {
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  sourceCard: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => VisibleCard | undefined;
  muPressureInstallScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  persistentInstallFitScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  isRunnerEconomyRole: (role: string) => boolean;
  isRunnerPressureRole: (role: string) => boolean;
  badPublicityOrTraceTechCard: (
    card: VisibleCard | undefined,
    roles: readonly string[],
  ) => boolean;
  programInstallTrashAssessmentForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerProgramSacrificeInstallAssessment | undefined;
  programInstallDisplacementPenalty: (
    assessment: RunnerProgramSacrificeInstallAssessment,
  ) => number;
};

export function runnerInstallScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  context: { loanInstallAction: boolean },
  dependencies: RunnerInstallScoreDependencies,
): AiDecisionScoreComponent[] {
  if (action.type !== "install_card") return [];
  const components: AiDecisionScoreComponent[] = [];
  const roles = dependencies.rolesForAction(input, action);
  const sourceCard = dependencies.sourceCard(input, action);
  const muPressureMemorySupport = dependencies.muPressureInstallScoreComponent(
    input,
    action,
  );
  const persistentInstallFit = dependencies.persistentInstallFitScoreComponent(
    input,
    action,
  );
  if (muPressureMemorySupport) components.push(muPressureMemorySupport);
  if (persistentInstallFit) components.push(persistentInstallFit);
  if (rolesHaveBreakerRole(roles)) {
    components.push({
      key: "runner_install_breaker",
      label: "Breaker-Aufbau",
      value: 750,
      reason: "breaker_role",
    });
  }
  const visibleCoverageNeed = sourceCard
    ? runnerVisibleSearchCoverageNeed(input)
    : undefined;
  if (
    sourceCard &&
    visibleCoverageNeed &&
    visibleCardCoversRequiredCoverage(
      sourceCard,
      visibleCoverageNeed.requiredCoverage,
      (definitionId) => (definitionId === sourceCard.definitionId ? roles : []),
    )
  ) {
    components.push({
      key: "runner_install_required_coverage_answer",
      label: "Sichtbare Coverage-Antwort",
      value: 1250,
      reason: [
        `required:${visibleCoverageNeed.requiredCoverage}`,
        `server:${visibleCoverageNeed.serverId}`,
        `source:${sourceCard.definitionId ?? sourceCard.instanceId}`,
      ].join("|"),
    });
  }
  if (
    roles.some((role) => dependencies.isRunnerEconomyRole(role)) &&
    !context.loanInstallAction
  ) {
    components.push({
      key: "runner_install_economy",
      label: "Economy-Aufbau",
      value: 500,
      reason: "economy_role",
    });
  }
  if (roles.some((role) => dependencies.isRunnerPressureRole(role))) {
    components.push({
      key: "runner_install_pressure",
      label: "Druck-Aufbau",
      value: 650,
      reason: "pressure_role",
    });
  }
  if (dependencies.badPublicityOrTraceTechCard(sourceCard, roles)) {
    components.push({
      key: "runner_install_bad_publicity_trace_tech",
      label: "Bad-Publicity-/Trace-Tech",
      value: 520,
      reason: "bad_publicity_or_trace",
    });
  }
  const sacrificeAssessment =
    dependencies.programInstallTrashAssessmentForAction(input, action);
  if (sacrificeAssessment?.memoryRequired) {
    const sacrificePenalty =
      dependencies.programInstallDisplacementPenalty(sacrificeAssessment);
    components.push({
      key: "runner_program_sacrifice_penalty",
      label: "Programm-Opfer",
      value: -sacrificePenalty,
      reason: [
        `category:${sacrificeAssessment.selectedCandidates[0]?.category ?? sacrificeAssessment.candidates[0]?.category ?? "none"}`,
        `can_free:${sacrificeAssessment.canFreeRequiredMemory}`,
      ].join("|"),
    });
  }
  return components;
}
