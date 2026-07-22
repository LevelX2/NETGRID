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
import { removesPersistentTraceTagCounter } from "../actions/trace-counter-semantics";
import { runnerRunReleaseForEvaluation } from "./runner-run-release";
import { mergedPublicHistory } from "./public-event-history";

type PlayerViewServer = AiDecisionInput["playerView"]["servers"][number];
type KnownIcePathAssessment = ReturnType<typeof assessKnownRezzedIcePath>;

export type SemanticRuntimeActionExclusionDependencies = {
  previousPlan?: (input: AiDecisionInput) =>
    | {
        type?: string;
        status?: string;
        target?: { kind?: string; id?: string };
        selectedStepKind?: string;
        ttlDecisionsRemaining?: number;
        blockedBy?: readonly string[];
        updatedAtStateVersion?: number;
      }
    | undefined;
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
  const advancementCounterRefillExclusion =
    corpAdvancementCounterRefillAfterCreditPayoutExclusion(input, action);
  if (advancementCounterRefillExclusion) {
    return advancementCounterRefillExclusion;
  }
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
    {
      fundedPlanContinuation: runnerInstallCompletesFundedPlan(
        input,
        action,
        dependencies,
      ),
    },
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
  if (
    input.side === "runner" &&
    structuredImmediateRunAction(action) &&
    !runTargetEvaluation
  ) {
    return {
      key: "runner_run_projection_missing",
      label: "Run-Projektion fehlt",
      reason: `action:${action.actionId}|structured_immediate_run:true`,
    };
  }
  const actionTargetServerId = semanticRuntimeServerId(action);
  if (
    runTargetEvaluation &&
    actionTargetServerId &&
    actionTargetServerId !== runTargetEvaluation.targetServerId
  ) {
    return {
      key: "runner_run_target_mismatch",
      label: "Run-Ziel und Bewertung widersprechen sich",
      reason: [
        `action:${action.actionId}`,
        `action_target:${actionTargetServerId}`,
        `evaluation_target:${runTargetEvaluation.targetServerId}`,
      ].join("|"),
    };
  }
  const serverId =
    runTargetEvaluation?.targetServerId ?? semanticRuntimeServerId(action);
  const accessServerId = runTargetEvaluation?.accessServerId ?? serverId;
  if (input.side !== "runner" || !serverId || !accessServerId) return undefined;
  const releaseDecision = runTargetEvaluation
    ? runnerRunReleaseForEvaluation(input, runTargetEvaluation)
    : undefined;
  if (releaseDecision?.status === "blocked") {
    return {
      key: "runner_run_release_blocked",
      label: "Run-Freigabe nicht erfüllt",
      reason: [
        `action:${action.actionId}`,
        `target:${runTargetEvaluation?.targetServerId}`,
        `release_reason:${releaseDecision.reason}`,
        ...releaseDecision.evidence,
      ].join("|"),
    };
  }
  const conditionalRouteReleased =
    releaseDecision?.status === "released_conditional";
  if (
    runTargetEvaluation &&
    [
      "blocked_missing_coverage",
      "blocked_unpayable",
      "blocked_unbreakable",
    ].includes(runTargetEvaluation.pathPassability) &&
    !conditionalRouteReleased
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
  const persistentTraceCounterRunExclusion =
    runnerAvoidablePersistentTraceCounterRunExclusion(
      input,
      action,
      runTargetEvaluation,
    );
  if (persistentTraceCounterRunExclusion) {
    return persistentTraceCounterRunExclusion;
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
  if (
    runTargetEvaluation?.runActionProjection.accessReplacement &&
    runTargetEvaluation.knownAccessState === "known_no_current_payoff"
  ) {
    return {
      key: "runner_access_replacement_no_payoff",
      label: "Access-Ersatz ohne neuen Payoff",
      reason: [
        `action:${action.actionId}`,
        `target:${runTargetEvaluation.targetServerId}`,
        `access_replacement:${runTargetEvaluation.runActionProjection.accessReplacement}`,
        "known_access_state:known_no_current_payoff",
      ].join("|"),
    };
  }
  const knownCentralPayoffExclusion = runTargetEvaluation?.runActionProjection
    .accessReplacement
    ? undefined
    : dependencies.knownCentralPayoffExclusion(input, accessServerId);
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

function corpAdvancementCounterRefillAfterCreditPayoutExclusion(
  input: AiDecisionInput,
  action: LegalAction,
): SemanticRuntimeExclusion | undefined {
  if (input.side !== "corp" || action.type !== "advance_card") {
    return undefined;
  }
  const targetId =
    typeof action.source === "string" && action.source !== "game_rule"
      ? action.source
      : typeof action.payload?.cardId === "string"
        ? action.payload.cardId
        : undefined;
  if (!targetId) return undefined;
  const installedCards = input.playerView.servers.flatMap((server) => [
    ...server.root,
    ...server.ice,
  ]);
  const target = installedCards.find(
    (card) => card.instanceId === targetId && card.known,
  );
  if (
    !target?.definitionId ||
    target.type === "agenda" ||
    target.advancementCounters !== 0
  ) {
    return undefined;
  }
  const matchingVisibleSources = installedCards.filter(
    (card) => card.known && card.definitionId === target.definitionId,
  );
  if (matchingVisibleSources.length !== 1) return undefined;

  const previousEvent = mergedPublicHistory(input).at(-1);
  const payload = previousEvent?.publicPayload;
  const counterCost = positiveInteger(
    payload?.cardImplementationAdvancementCounterCost,
  );
  const gainedCredits = positiveInteger(payload?.gainedCredits);
  const advanceCreditCost = action.costs.reduce(
    (sum, cost) => sum + Math.max(0, cost.credits ?? 0),
    0,
  );
  if (
    !previousEvent ||
    previousEvent.stateVersionAfter !== input.playerView.stateVersion ||
    payload?.actor !== "corp" ||
    payload.actionType !== "activated_card_ability" ||
    payload.sourceDefinitionId !== target.definitionId ||
    counterCost !== 1 ||
    gainedCredits === undefined ||
    advanceCreditCost <= 0 ||
    gainedCredits > advanceCreditCost
  ) {
    return undefined;
  }
  return {
    key: "corp_advancement_counter_refill_after_credit_payout_cycle",
    label: "Dominierter Counter-Refill",
    reason: [
      `action:${action.actionId}`,
      `source_definition:${target.definitionId}`,
      `counter_cost:${counterCost}`,
      `credits_gained:${gainedCredits}`,
      `refill_credit_cost:${advanceCreditCost}`,
      "source_advancement_counters:0",
      "immediately_preceding_payout:true",
    ].join("|"),
  };
}

function positiveInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : undefined;
}

function structuredImmediateRunAction(action: LegalAction): boolean {
  return (
    action.type === "start_run" ||
    action.payload?.cardImplementationEffectKind === "make_run" ||
    action.payload?.effectKind === "make_run" ||
    action.payload?.runActionKind === "make_run"
  );
}

function runnerAvoidablePersistentTraceCounterRunExclusion(
  input: AiDecisionInput,
  action: LegalAction,
  evaluation: RunnerRunTargetEvaluation | undefined,
): SemanticRuntimeExclusion | undefined {
  if (
    input.side !== "runner" ||
    action.type !== "start_run" ||
    !evaluation?.visibleIceRunHazards?.some(
      (hazard) =>
        hazard.kind === "trace_tag_counter" && hazard.unavoidable === true,
    )
  ) {
    return undefined;
  }
  const actionClickCost = action.costs.reduce(
    (sum, cost) => sum + Math.max(0, cost.clicks ?? 0),
    0,
  );
  if (input.playerView.own.clicks > actionClickCost) return undefined;
  const counterRemoval = input.legalActions.find(
    removesPersistentTraceTagCounter,
  );
  if (!counterRemoval) return undefined;
  return {
    key: "avoidable_persistent_trace_counter_last_click",
    label: "Vermeidbarer persistenter Trace-Zähler",
    reason: [
      `action:${action.actionId}`,
      `target:${evaluation.targetServerId}`,
      `action_click_cost:${actionClickCost}`,
      `runner_clicks:${input.playerView.own.clicks}`,
      `counter_removal:${counterRemoval.actionId}`,
      "unavoidable_trace_tag_counter:true",
    ].join("|"),
  };
}

function runnerInstallCompletesFundedPlan(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeActionExclusionDependencies,
): boolean {
  if (input.side !== "runner" || action.type !== "install_card") return false;
  const previousPlan = dependencies.previousPlan?.(input);
  return (
    previousPlan?.type === "runner.develop_hand_card" &&
    previousPlan.status === "progressing" &&
    previousPlan.target?.kind === "card" &&
    previousPlan.target.id === action.source &&
    previousPlan.selectedStepKind === "gain_credits" &&
    (previousPlan.ttlDecisionsRemaining ?? 0) > 0 &&
    previousPlan.blockedBy?.includes("missing_credits") === true &&
    input.playerView.stateVersion ===
      (previousPlan.updatedAtStateVersion ?? -2) + 1
  );
}
