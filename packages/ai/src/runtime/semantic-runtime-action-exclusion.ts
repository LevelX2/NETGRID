import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { semanticRuntimeServerId } from "./semantic-runtime-scope";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

type PlayerViewServer = AiDecisionInput["playerView"]["servers"][number];
type KnownIcePathAssessment = ReturnType<typeof assessKnownRezzedIcePath>;

export type SemanticRuntimeActionExclusionDependencies = {
  planMemoryActionExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
  corpAdvancementCounterPlacementAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => { dominatedByBasicAdvance?: boolean; evidence: string[] } | undefined;
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
  ) => { targetServerId?: string; accessServerId?: string } | undefined;
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
  const selfDamageSurvivalExclusion =
    dependencies.runnerSelfDamageSurvivalExclusion(
      input,
      action,
      actionSemanticCandidate,
    );
  if (selfDamageSurvivalExclusion) return selfDamageSurvivalExclusion;
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
  const runTargetEvaluation =
    dependencies.runnerRunTargetEvaluationForAction(input, action);
  const serverId =
    runTargetEvaluation?.targetServerId ?? semanticRuntimeServerId(action);
  const accessServerId = runTargetEvaluation?.accessServerId ?? serverId;
  if (
    input.side !== "runner" ||
    !serverId ||
    !accessServerId
  )
    return undefined;
  const blinkRunExclusion = dependencies.runnerBlinkRunExclusion(input, action);
  if (blinkRunExclusion) return blinkRunExclusion;
  const knownCentralPayoffExclusion =
    dependencies.knownCentralPayoffExclusion(input, accessServerId);
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
  if (action.type !== "start_run") return undefined;
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
    server.root,
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
