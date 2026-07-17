import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import { corpPurgeImpactScoreComponent } from "../corp-purge-impact";
import { semanticRuntimeCorpEffectiveDefenseContext } from "../semantic-runtime-corp-effective-defense";
import {
  semanticRuntimeCorpBoardTriage,
  type CorpBoardTriage,
} from "../semantic-runtime-corp-board-triage";
import {
  corpIcePlacementCandidateForAction,
  corpIcePlacementScoreComponent,
} from "../corp-ice-placement/corp-ice-placement";
import { visibleCardDefinition } from "../card-definition-lookup";
import { createAiHintsByCard } from "../../ai-hints";
import { rolesMatch } from "../role-match";
import {
  candidateRequiresSuccessfulTrace,
  traceActionLeavesImmediatePunishWindow,
  traceTagExpectedSuccessEstimate,
} from "../trace-tag-success-estimate";
import { type SemanticRuntimeCorpScoreDependencies } from "./semantic-runtime-corp-score-contracts";
import { corpPreparedScoreRemotePipeline } from "./semantic-runtime-corp-score-facts";
import {
  corpBurstEconomyOperationForAction,
  positiveOrZeroNumber,
  semanticRuntimeCorpActionCreditCost,
  visibleActionSourceId,
  visibleSourceCardForAction,
} from "./semantic-runtime-corp-score-action-economy";
import {
  corpServerIceLocation,
  minimumInnerUnrezzedIceRezCost,
} from "./semantic-runtime-corp-score-install-sequencing";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export function corpIcePlacementComponent<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card" || action.payload?.placement !== "ice") {
    return undefined;
  }
  const serverId = corpInstallServerId(action);
  const server =
    serverId && serverId !== "new_remote"
      ? input.playerView.servers.find((candidate) => candidate.id === serverId)
      : undefined;
  const sourceCard = visibleSourceCardForAction(input, action);
  const scoringWindow = dependencies.corpScoringWindowAssessment?.(
    input,
    action,
    dependencies.rolesForAction(input, action),
  );
  return corpIcePlacementScoreComponent({
    input,
    action,
    serverId,
    server,
    sourceCard,
    actionCreditCost: semanticRuntimeCorpActionCreditCost(
      dependencies,
      action,
      actionSemanticCandidate,
    ),
    iceRezCost: sourceCard?.rezCost,
    hasUrgentScoreline:
      scoringWindow?.recommendedNextStep === "build_remote_ice" ||
      scoringWindow?.agendaStealSeverity === "game_ending",
  });
}

export function corpRemoteScorelineIceFundingPenaltyComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  roles: string[],
  icePlacement: AiDecisionScoreComponent | undefined,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card" || action.payload?.placement !== "ice") {
    return undefined;
  }
  const serverId = corpInstallServerId(action);
  if (!serverId?.startsWith("remote_")) return undefined;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const hasActiveScoreline = corpServerHasVisibleScorelineRoot(server);
  const preparedPipeline = corpPreparedScoreRemotePipeline(input);
  const isPreparedScoreRemote =
    !hasActiveScoreline && preparedPipeline?.serverId === serverId;
  if (!hasActiveScoreline && !isPreparedScoreRemote) return undefined;

  const placementReason = icePlacement?.reason ?? "";
  const placementPrefersFunding =
    placementReason.includes("recommendation:prefer_economy") ||
    placementReason.includes("defer_reason:rez_reserve_too_low");
  const scoringWindow = dependencies.corpScoringWindowAssessment?.(
    input,
    action,
    roles,
  );
  const windowNeedsFunding =
    scoringWindow?.recommendedNextStep === "gain_credit" ||
    scoringWindow?.corpCanRezRelevantIce === false ||
    scoringWindow?.corpCanRezFullPathWithDynamicReserve === false;
  if (!placementPrefersFunding && !windowNeedsFunding) return undefined;
  const value = -1900;

  return {
    key: "corp_remote_scoreline_unfunded_ice_install_penalty",
    label: "Remote-Scoreline-Funding",
    value,
    reason: [
      hasActiveScoreline
        ? "active_remote_scoreline:true"
        : "prepared_score_remote:true",
      `server:${serverId}`,
      `penalty_value:${value}`,
      ...(isPreparedScoreRemote && preparedPipeline
        ? [
            `prepared_ice_count:${preparedPipeline.iceCount}`,
            `prepared_reserve_floor:${preparedPipeline.reserveFloor}`,
          ]
        : []),
      `placement_prefers_funding:${placementPrefersFunding}`,
      `window_needs_funding:${windowNeedsFunding}`,
      ...(scoringWindow?.recommendedNextStep
        ? [`recommended_next_step:${scoringWindow.recommendedNextStep}`]
        : []),
      ...(scoringWindow?.dynamicProtectionReserve !== undefined
        ? [
            `dynamic_protection_reserve:${scoringWindow.dynamicProtectionReserve}`,
          ]
        : []),
    ].join("|"),
  };
}

function corpServerHasVisibleScorelineRoot(
  server: AiDecisionInput["playerView"]["servers"][number] | undefined,
): boolean {
  return (
    server?.root.some(
      (card) =>
        card.known !== false &&
        (card.type === "agenda" ||
          typeof card.advancementRequirement === "number" ||
          typeof visibleCardDefinition(card)?.advancementRequirement ===
            "number" ||
          (card.advancementCounters ?? 0) > 0),
    ) === true
  );
}

export function corpInstallServerId(action: LegalAction): string | undefined {
  const serverId =
    action.payload?.serverId ??
    action.payload?.targetServerId ??
    action.payload?.attackedServerId;
  return typeof serverId === "string" ? serverId : undefined;
}

export function corpPostPassIceLifecycleComponent(
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (
    action.type !== "continue_run" ||
    action.payload?.corpPostPassIceAbility !== "return_passed_ice_to_hq"
  ) {
    return undefined;
  }
  const decision =
    typeof action.payload.decision === "string"
      ? action.payload.decision
      : "unknown";
  const serverId =
    typeof action.payload.serverId === "string"
      ? action.payload.serverId
      : "unknown";
  const paymentAmount =
    typeof action.payload.paymentAmount === "number" &&
    Number.isFinite(action.payload.paymentAmount)
      ? Math.max(0, Math.floor(action.payload.paymentAmount))
      : 0;
  const isCentral = serverId === "hq" || serverId === "rd";
  const hqReinstallExtraCost = decision === "return_to_hq" && serverId === "hq";
  if (decision === "pay") {
    return {
      key: "corp_post_pass_ice_lifecycle_preserve",
      label: "ICE-Schutz erhalten",
      value: isCentral ? 1200 : 850,
      reason: [
        "post_pass_ice_lifecycle:pay",
        `server:${serverId}`,
        `payment_amount:${paymentAmount}`,
        "ice_remains_installed:true",
      ].join("|"),
    };
  }
  if (decision === "decline") {
    return {
      key: "corp_post_pass_ice_lifecycle_decline_return",
      label: "ICE liegen lassen",
      value: isCentral ? 650 : 450,
      reason: [
        "post_pass_ice_lifecycle:decline",
        `server:${serverId}`,
        "ice_remains_installed:true",
      ].join("|"),
    };
  }
  if (decision === "return_to_hq") {
    return {
      key: "corp_post_pass_ice_lifecycle_return_to_hq_penalty",
      label: "ICE-Schutzverlust",
      value: isCentral ? -1900 : -1200,
      reason: [
        "post_pass_ice_lifecycle:return_to_hq",
        `server:${serverId}`,
        "ice_remains_installed:false",
        "central_protection_loss:" + isCentral,
        ...(hqReinstallExtraCost ? ["hq_ice_reinstall_extra_cost:2"] : []),
      ].join("|"),
    };
  }
  return undefined;
}

export function corpDownstreamRezReserveAssessment<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  dependencies: Pick<
    SemanticRuntimeCorpScoreDependencies<TConsumer>,
    "actionCreditCost"
  >,
  effectiveDefense: ReturnType<
    typeof semanticRuntimeCorpEffectiveDefenseContext
  >,
): AiDecisionScoreComponent | undefined {
  if (!effectiveDefense?.isRezzableNow) return undefined;
  if (
    !effectiveDefense.visibleBreakerCoverage &&
    !effectiveDefense.zeroEffectRisk
  ) {
    return undefined;
  }
  const sourceId = visibleActionSourceId(action);
  if (!sourceId) return undefined;
  const location = corpServerIceLocation(input, sourceId);
  if (!location || location.iceIndex <= 0) return undefined;
  const innerRezFloor = minimumInnerUnrezzedIceRezCost(location);
  if (innerRezFloor === undefined) return undefined;
  const rezCost = semanticRuntimeCorpActionCreditCost(
    dependencies,
    action,
    actionSemanticCandidate,
  );
  const postRezCredits = input.playerView.own.credits - rezCost;
  if (postRezCredits >= innerRezFloor) return undefined;
  const isCentral = location.server.id === "hq" || location.server.id === "rd";
  const value = isCentral ? -1800 : -1300;
  return {
    key: "corp_downstream_rez_floor_preservation",
    label: "Innere ICE-Reserve",
    value,
    reason: [
      "downstream_rez_floor:blocked_after_current_rez",
      `server:${location.server.id}`,
      `post_rez_credits:${postRezCredits}`,
      `inner_rez_floor:${innerRezFloor}`,
      `visible_breaker_coverage:${effectiveDefense.visibleBreakerCoverage}`,
      `zero_effect_risk:${effectiveDefense.zeroEffectRisk}`,
      `downstream_reserve_value:${value}`,
    ].join("|"),
  };
}

export function corpRootRezTimingComponent(
  input: AiDecisionInput,
  action: LegalAction,
  sourceCard: VisibleCard | undefined,
): AiDecisionScoreComponent | undefined {
  if (!sourceCard || sourceCard.type === "ice" || !sourceCard.definitionId) {
    return undefined;
  }
  const location = input.playerView.servers.find((server) =>
    server.root.some((card) => card.instanceId === sourceCard.instanceId),
  );
  if (!location) return undefined;
  const hint = AI_HINTS_BY_CARD.get(sourceCard.definitionId);
  const effects = hint?.effects ?? [];
  const accessAmbushResolvesUnrezzed =
    hint?.roles.includes("ambush") === true &&
    effects.some(
      (effect) => effect.timing === "on_access" && effect.kind === "damage",
    ) &&
    hint.conditions?.some(
      (condition) => condition.kind === "requires_accessed_card",
    ) === true;
  if (accessAmbushResolvesUnrezzed) {
    return {
      key: "corp_root_rez_unnecessary_access_ambush",
      label: "Access-Ambush verdeckt lassen",
      value: -5000,
      reason: [
        "root_rez_timing:access_ambush_resolves_unrezzed",
        `card:${sourceCard.instanceId}`,
        `server:${location.id}`,
        `timing:${input.playerView.timingPoint}`,
      ].join("|"),
    };
  }
  const runRelevant =
    effects.some((effect) =>
      ["on_access", "during_run", "successful_run"].includes(effect.timing),
    ) || hint?.remoteRole?.kind === "agenda_steal_tax";
  const run = input.playerView.run;
  if (!runRelevant) {
    if (!run) return undefined;
    return {
      key: "corp_root_rez_defer_irrelevant_during_run",
      label: "Nicht runrelevante Root-Karte verdeckt lassen",
      value: -4000,
      reason: [
        "root_rez_timing:no_current_run_effect",
        `card:${sourceCard.instanceId}`,
        `server:${location.id}`,
        `attacked_server:${run.attackedServerId}`,
        `timing:${input.playerView.timingPoint}`,
      ].join("|"),
    };
  }
  if (!run || run.attackedServerId !== location.id) {
    return {
      key: "corp_root_rez_defer_until_relevant_run",
      label: "Root-Rez vertagen",
      value: -2200,
      reason: [
        "root_rez_timing:no_relevant_run",
        `card:${sourceCard.instanceId}`,
        `server:${location.id}`,
      ].join("|"),
    };
  }
  const position = run.position;
  const beforeLastIce =
    position?.kind === "ice" &&
    typeof position.iceIndex === "number" &&
    position.iceIndex > 0;
  if (beforeLastIce) {
    return {
      key: "corp_root_rez_defer_until_last_window",
      label: "Root-Rez bis zum letzten Fenster vertagen",
      value: -3600,
      reason: [
        "root_rez_timing:before_last_ice",
        `card:${sourceCard.instanceId}`,
        `server:${location.id}`,
        `ice_index:${position.iceIndex}`,
        `timing:${input.playerView.timingPoint}`,
      ].join("|"),
    };
  }
  return {
    key: "corp_root_rez_latest_relevant_window",
    label: "Root-Rez im letzten relevanten Fenster",
    value: 1600,
    reason: [
      "root_rez_timing:latest_relevant_window",
      `card:${sourceCard.instanceId}`,
      `server:${location.id}`,
      `run_phase:${run.phase}`,
      `timing:${input.playerView.timingPoint}`,
    ].join("|"),
  };
}
