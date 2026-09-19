import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import { corpPurgeImpactScoreComponent } from "../../corp/virus-pressure/corp-purge-impact";
import { semanticRuntimeCorpEffectiveDefenseContext } from "../semantic-runtime-corp-effective-defense";
import { visibleCardDefinition } from "../card-definition-lookup";
import { createAiHintsByCard } from "../../ai-hints";
import { rolesMatch } from "../role-match";
import {
  candidateRequiresSuccessfulTrace,
  traceActionLeavesImmediatePunishWindow,
  traceTagExpectedSuccessEstimate,
} from "../trace-tag-success-estimate";
import { type SemanticRuntimeCorpScoreDependencies } from "./semantic-runtime-corp-score-contracts";
import {
  corpBurstEconomyOperationForAction,
  positiveOrZeroNumber,
  semanticRuntimeCorpActionCreditCost,
  visibleActionSourceId,
} from "./semantic-runtime-corp-score-action-economy";
import {
  corpServerIceLocation,
  minimumInnerUnrezzedIceRezCost,
} from "./semantic-runtime-corp-score-install-sequencing";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export function corpInstallServerId(action: LegalAction): string | undefined {
  const serverId =
    action.payload?.serverId ??
    action.payload?.targetServerId ??
    action.payload?.attackedServerId;
  return typeof serverId === "string" ? serverId : undefined;
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
  const installedAccessEffects =
    cardSpecPlanningCardByDefinitionId(
      sourceCard.definitionId,
    )?.planning.engine.accessEffects?.filter(
      (effect) =>
        effect.kind === "on_access" &&
        effect.sourceZones.includes("installed") &&
        !effect.ignoreIfAccessedFrom?.includes("installed"),
    ) ?? [];
  const accessAmbushResolvesUnrezzed =
    hint?.roles.includes("ambush") === true &&
    installedAccessEffects.length > 0 &&
    installedAccessEffects.every(
      (effect) =>
        effect.installedSourceActivation === "any_rez_state" ||
        effect.installedSourceActivation === "unrezzed_only",
    );
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
