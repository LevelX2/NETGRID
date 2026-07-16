import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../visible-run-analysis";
import { runnerActionReserveExclusion } from "./runner-action-reserve";
import { semanticRuntimeServerId } from "./semantic-runtime-scope";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

type PlayerViewServer = AiDecisionInput["playerView"]["servers"][number];
type KnownIcePathAssessment = ReturnType<typeof assessKnownRezzedIcePath>;

export type SemanticRuntimeActionExclusionDependencies = {
  corpUpgradePlacementExclusion?: (
    input: AiDecisionInput,
    action: LegalAction,
    actionSemanticCandidate: ActionSemanticCandidate | undefined,
  ) => SemanticRuntimeExclusion | undefined;
  planMemoryActionExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
  corpAdvancementCounterPlacementAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) =>
    | {
        dominatedByBasicAdvance?: boolean;
        noConcreteConversion?: boolean;
        evidence: string[];
      }
    | undefined;
  runnerSelfDamageSurvivalExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
    actionSemanticCandidate: ActionSemanticCandidate | undefined,
  ) => SemanticRuntimeExclusion | undefined;
  runnerEncounterActionExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
  runnerProgramSacrificeExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
  runnerMultiRunEventExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
  runnerRunTargetEvaluationForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerRunTargetEvaluation | undefined;
  runnerBlinkRunExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
  knownCentralPayoffExclusion: (
    input: AiDecisionInput,
    accessServerId: string,
  ) => SemanticRuntimeExclusion | undefined;
  runnerArchivesExclusion: (
    input: AiDecisionInput,
    server: PlayerViewServer | undefined,
  ) => SemanticRuntimeExclusion | undefined;
  runnerEmptyRemoteExclusion: (
    server: PlayerViewServer,
  ) => SemanticRuntimeExclusion | undefined;
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  knownIcePathReason: (
    assessment: KnownIcePathAssessment,
    serverId: string,
  ) => string;
};

export function semanticRuntimeActionExclusion(
  input: AiDecisionInput,
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  dependencies: SemanticRuntimeActionExclusionDependencies,
): SemanticRuntimeExclusion | undefined {
  const planMemoryExclusion = dependencies.planMemoryActionExclusion(
    input,
    action,
  );
  if (planMemoryExclusion) return planMemoryExclusion;
  const corpAdvancementPlacement =
    dependencies.corpAdvancementCounterPlacementAssessment(input, action);
  if (corpAdvancementPlacement?.dominatedByBasicAdvance) {
    return {
      key: "corp_advancement_counter_placement_dominated_by_basic_advance",
      label: "Basic-Advance-Dominanz",
      reason: corpAdvancementPlacement.evidence.join("|"),
    };
  }
  if (corpAdvancementPlacement?.noConcreteConversion) {
    return {
      key: "corp_advancement_counter_placement_without_conversion",
      label: "Advancement ohne Conversion",
      reason: corpAdvancementPlacement.evidence.join("|"),
    };
  }
  const corpUpgradePlacementExclusion =
    dependencies.corpUpgradePlacementExclusion?.(
      input,
      action,
      actionSemanticCandidate,
    );
  if (corpUpgradePlacementExclusion) return corpUpgradePlacementExclusion;
  const selfDamageSurvivalExclusion =
    dependencies.runnerSelfDamageSurvivalExclusion(
      input,
      action,
      actionSemanticCandidate,
    );
  if (selfDamageSurvivalExclusion) return selfDamageSurvivalExclusion;
  const reserveExclusion = runnerActionReserveExclusion(
    input,
    action,
    actionSemanticCandidate,
  );
  if (reserveExclusion) return reserveExclusion;
  const encounterExclusion = dependencies.runnerEncounterActionExclusion(
    input,
    action,
  );
  if (encounterExclusion) return encounterExclusion;
  const programSacrificeExclusion =
    dependencies.runnerProgramSacrificeExclusion(input, action);
  if (programSacrificeExclusion) return programSacrificeExclusion;
  const multiRunEventExclusion = dependencies.runnerMultiRunEventExclusion(
    input,
    action,
  );
  if (multiRunEventExclusion) return multiRunEventExclusion;
  const runTargetEvaluation = dependencies.runnerRunTargetEvaluationForAction(
    input,
    action,
  );
  const serverId =
    runTargetEvaluation?.targetServerId ?? semanticRuntimeServerId(action);
  const accessServerId = runTargetEvaluation?.accessServerId ?? serverId;
  if (input.side !== "runner" || !serverId || !accessServerId) return undefined;
  if (
    runTargetEvaluation &&
    [
      "blocked_missing_coverage",
      "blocked_unpayable",
      "blocked_unbreakable",
    ].includes(runTargetEvaluation.pathPassability)
  ) {
    return {
      key: "projected_run_path_no_access",
      label:
        runTargetEvaluation.pathPassability === "blocked_unpayable"
          ? "Projizierter Run nicht bezahlbar"
          : "Projizierter Run nicht erreichbar",
      reason: [
        `action:${action.actionId}`,
        `target:${runTargetEvaluation.targetServerId}`,
        `access:${runTargetEvaluation.accessServerId}`,
        `path:${runTargetEvaluation.pathPassability}`,
        `credits_after:${runTargetEvaluation.creditsAfterRun}`,
        ...runTargetEvaluation.evidence.filter(
          (entry) =>
            entry.startsWith("missing_coverage:") ||
            entry.startsWith("run_action_credit_cost:") ||
            entry.startsWith("run_action_projection_") ||
            entry.startsWith("visible_break_cost:"),
        ),
      ].join("|"),
    };
  }
  if (
    runTargetEvaluation &&
    runTargetEvaluation.runActionProjection.structure === "event_run" &&
    action.costs.some((cost) => (cost.credits ?? 0) > 0) &&
    !runTargetEvaluation.bypassedFirstIce &&
    runTargetEvaluation.runActionPayoff.scoreBonus <= 0 &&
    input.legalActions.some(
      (candidate) =>
        candidate.type === "start_run" &&
        semanticRuntimeServerId(candidate) ===
          runTargetEvaluation.targetServerId,
    )
  ) {
    return {
      key: "run_event_dominated_by_basic_run",
      label: "Run-Event ohne genutzten Vorteil",
      reason: [
        `action:${action.actionId}`,
        `target:${runTargetEvaluation.targetServerId}`,
        "basic_run_available:true",
        "bypassed_first_ice:false",
        `run_action_payoff_score:${runTargetEvaluation.runActionPayoff.scoreBonus}`,
      ].join("|"),
    };
  }
  const blinkRunExclusion = dependencies.runnerBlinkRunExclusion(input, action);
  if (blinkRunExclusion) return blinkRunExclusion;
  const knownCentralPayoffExclusion = dependencies.knownCentralPayoffExclusion(
    input,
    accessServerId,
  );
  if (knownCentralPayoffExclusion) return knownCentralPayoffExclusion;
  const server = input.playerView.servers.find(
    (entry) => entry.id === serverId,
  );
  if (serverId === "archives" && accessServerId === "archives") {
    const archivesExclusion = dependencies.runnerArchivesExclusion(
      input,
      server,
    );
    if (archivesExclusion) return archivesExclusion;
  }
  if (!server) return undefined;
  if (dependencies.isRemoteServerTarget(serverId)) {
    const emptyRemoteExclusion =
      dependencies.runnerEmptyRemoteExclusion(server);
    if (emptyRemoteExclusion) return emptyRemoteExclusion;
  }
  if (runTargetEvaluation?.pathPassability === "reachable") return undefined;
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig ?? [],
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.own.credits,
      input.playerView.own.rig ?? [],
    ),
    server.root,
    input.playerView.opponent.credits,
    {
      visibleRemoteServerCount: input.playerView.servers.filter((candidate) =>
        candidate.id.startsWith("remote_"),
      ).length,
      visibleCorpCredits: input.playerView.opponent.credits,
    },
  );
  if (assessment.assessedKnownIceCount <= 0 || assessment.canReachAccess)
    return undefined;
  return {
    key: "known_ice_path_no_access",
    label: assessment.knownPathBlockedByUnbreakableIce
      ? "Run-Ziel nicht erreichbar"
      : "Run-Ziel nicht bezahlbar",
    reason: dependencies.knownIcePathReason(assessment, server.id),
  };
}
