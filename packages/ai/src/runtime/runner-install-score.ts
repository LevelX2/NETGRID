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
import { rolesMatch } from "./role-match";

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
  context: {
    loanInstallAction: boolean;
    semanticRiskKinds?: readonly string[];
  },
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
    sourceCard &&
    visibleCoverageNeed &&
    rolesMatch(roles, ["program_search", "breaker_search"])
  ) {
    components.push({
      key: "runner_install_coverage_search",
      label: "Konkrete Breaker-Suche aufbauen",
      value: 1400,
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
  if (roles.includes("server_ice_install")) {
    components.push(...runnerServerIceInstallTaxComponents(input, action));
  }
  if (dependencies.badPublicityOrTraceTechCard(sourceCard, roles)) {
    components.push({
      key: "runner_install_bad_publicity_trace_tech",
      label: "Bad-Publicity-/Trace-Tech",
      value: 520,
      reason: "bad_publicity_or_trace",
    });
  }
  if (
    context.semanticRiskKinds?.includes("mandatory_action") &&
    context.semanticRiskKinds.includes("random_outcome")
  ) {
    components.push({
      key: "runner_install_mandatory_random_action_risk",
      label: "Zufällige Pflichtaktion",
      value: -500,
      reason: "mandatory_action|random_outcome",
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

function runnerServerIceInstallTaxComponents(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent[] {
  const selectedServerId =
    typeof action.payload?.selectedServerId === "string"
      ? action.payload.selectedServerId
      : undefined;
  if (!selectedServerId) return [];
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === selectedServerId,
  );
  if (!server) return [];

  const targetValue =
    selectedServerId === "archives"
      ? -1400
      : selectedServerId === "rd"
        ? 780 + server.ice.length * 100
        : selectedServerId === "hq"
          ? 720 + server.ice.length * 100
          : 320 + server.ice.length * 100 + server.root.length * 120;
  const components: AiDecisionScoreComponent[] = [
    {
      key: "runner_install_server_ice_tax_target",
      label: "ICE-Installationssteuer-Ziel",
      value: targetValue,
      reason: [
        `server:${selectedServerId}`,
        `ice:${server.ice.length}`,
        `root:${server.root.length}`,
      ].join("|"),
    },
  ];

  const urgentAdvancedRemote = input.playerView.servers.some(
    (candidate) =>
      candidate.id.startsWith("remote_") &&
      candidate.root.some((card) => (card.advancementCounters ?? 0) > 0),
  );
  const immediateRemoteContestAvailable = input.legalActions.some(
    (candidate) =>
      candidate.type === "start_run" &&
      typeof candidate.payload?.serverId === "string" &&
      candidate.payload.serverId.startsWith("remote_"),
  );
  if (
    urgentAdvancedRemote &&
    immediateRemoteContestAvailable &&
    input.playerView.own.clicks <= 2
  ) {
    components.push({
      key: "runner_install_server_ice_tax_too_late",
      label: "ICE-Steuer kommt für den akuten Contest zu spät",
      value: -1600,
      reason: "advanced_remote_requires_immediate_contest",
    });
  }
  return components;
}
