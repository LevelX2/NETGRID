import {
  CORP_ZONE_TRANSITION_PROJECTION_SCHEMA_VERSION,
  type CardDefinitionId,
  type CardInstanceId,
  type CorpZoneTransitionProjection,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { strategicPlanningGroupDrawReplacementProjection } from "../choices/strategic-planning-group-draw-choice";

export function quoteCorporateShuffleZoneTransition(
  state: GameState,
  action: LegalAction,
  sourceCardInstanceId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
  baseDrawCount: number,
): CorpZoneTransitionProjection {
  const replacement = strategicPlanningGroupDrawReplacementProjection(state);
  const grossDrawCount = baseDrawCount + replacement.extraDrawCount;
  const complete = state.corp.rd.length >= grossDrawCount;
  const sourceHqConsumptionCount = 1;
  const postDrawDispositionCount = replacement.postDrawDispositionCount + 1;
  const rdCardsReplenishedAfterDrawCount = postDrawDispositionCount;
  const netHqDelta =
    grossDrawCount - sourceHqConsumptionCount - postDrawDispositionCount;
  const netRdDelta = rdCardsReplenishedAfterDrawCount - grossDrawCount;
  return {
    schemaVersion: CORP_ZONE_TRANSITION_PROJECTION_SCHEMA_VERSION,
    complete,
    sourceCardInstanceId,
    sourceDefinitionId,
    stateVersion: action.expiresAtStateVersion,
    timingPoint: action.timingPoint,
    actionId: action.actionId,
    kind: "draw_then_shuffle_one_hq_into_rd",
    resolution: complete ? "guaranteed" : "corp_deckout_before_completion",
    grossDrawCount,
    sourceHqConsumptionCount,
    postDrawDispositionCount,
    hqCardsRecycledBeforeDrawCount: 0,
    archivesCardsRecycledBeforeDrawCount: 0,
    rdCardsReplenishedAfterDrawCount,
    netHqDelta,
    netRdDelta,
    netRdConsumption: Math.max(0, -netRdDelta),
    visibleDrawReplacementSourceCount: replacement.sourceCount,
  };
}

export function quoteHqArchivesShuffleDrawZoneTransition(
  state: GameState,
  action: LegalAction,
  sourceCardInstanceId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
  baseDrawCount: number,
): CorpZoneTransitionProjection {
  return quoteRecycledCorpZonesThenDraw({
    state,
    action,
    sourceCardInstanceId,
    sourceDefinitionId,
    kind: "shuffle_hq_archives_into_rd_then_draw",
    baseDrawCount,
    hqCardsRecycledBeforeDrawCount: state.corp.hq.length,
    archivesCardsRecycledBeforeDrawCount: state.corp.archives.length,
  });
}

export function quoteHqShuffleRedrawZoneTransition(
  state: GameState,
  action: LegalAction,
  sourceCardInstanceId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
): CorpZoneTransitionProjection {
  return quoteRecycledCorpZonesThenDraw({
    state,
    action,
    sourceCardInstanceId,
    sourceDefinitionId,
    kind: "shuffle_hq_into_rd_then_draw_same_count",
    baseDrawCount: state.corp.hq.length,
    hqCardsRecycledBeforeDrawCount: state.corp.hq.length,
    archivesCardsRecycledBeforeDrawCount: 0,
  });
}

function quoteRecycledCorpZonesThenDraw(params: {
  state: GameState;
  action: LegalAction;
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  kind:
    | "shuffle_hq_archives_into_rd_then_draw"
    | "shuffle_hq_into_rd_then_draw_same_count";
  baseDrawCount: number;
  hqCardsRecycledBeforeDrawCount: number;
  archivesCardsRecycledBeforeDrawCount: number;
}): CorpZoneTransitionProjection {
  const replacement = strategicPlanningGroupDrawReplacementProjection(
    params.state,
  );
  const grossDrawCount = params.baseDrawCount + replacement.extraDrawCount;
  const postDrawDispositionCount = replacement.postDrawDispositionCount;
  const availableBeforeDraw =
    params.state.corp.rd.length +
    params.hqCardsRecycledBeforeDrawCount +
    params.archivesCardsRecycledBeforeDrawCount;
  const complete = availableBeforeDraw >= grossDrawCount;
  const rdCardsReplenishedAfterDrawCount = postDrawDispositionCount;
  const netHqDelta =
    grossDrawCount -
    postDrawDispositionCount -
    params.hqCardsRecycledBeforeDrawCount;
  const netRdDelta =
    params.hqCardsRecycledBeforeDrawCount +
    params.archivesCardsRecycledBeforeDrawCount +
    rdCardsReplenishedAfterDrawCount -
    grossDrawCount;
  return {
    schemaVersion: CORP_ZONE_TRANSITION_PROJECTION_SCHEMA_VERSION,
    complete,
    sourceCardInstanceId: params.sourceCardInstanceId,
    sourceDefinitionId: params.sourceDefinitionId,
    stateVersion: params.action.expiresAtStateVersion,
    timingPoint: params.action.timingPoint,
    actionId: params.action.actionId,
    kind: params.kind,
    resolution: complete ? "guaranteed" : "corp_deckout_before_completion",
    grossDrawCount,
    sourceHqConsumptionCount: 0,
    postDrawDispositionCount,
    hqCardsRecycledBeforeDrawCount: params.hqCardsRecycledBeforeDrawCount,
    archivesCardsRecycledBeforeDrawCount:
      params.archivesCardsRecycledBeforeDrawCount,
    rdCardsReplenishedAfterDrawCount,
    netHqDelta,
    netRdDelta,
    netRdConsumption: Math.max(0, -netRdDelta),
    visibleDrawReplacementSourceCount: replacement.sourceCount,
  };
}

export function corpZoneTransitionProjectionPayload(
  quote: CorpZoneTransitionProjection,
): NonNullable<LegalAction["payload"]> {
  return {
    corpZoneTransitionProjectionSchemaVersion: quote.schemaVersion,
    corpZoneTransitionProjectionComplete: quote.complete,
    corpZoneTransitionProjectionSourceCardInstanceId:
      quote.sourceCardInstanceId,
    corpZoneTransitionProjectionSourceDefinitionId: quote.sourceDefinitionId,
    corpZoneTransitionProjectionStateVersion: quote.stateVersion,
    corpZoneTransitionProjectionTimingPoint: quote.timingPoint,
    corpZoneTransitionProjectionActionId: quote.actionId,
    corpZoneTransitionProjectionKind: quote.kind,
    corpZoneTransitionProjectionResolution: quote.resolution,
    corpZoneTransitionProjectionGrossDrawCount: quote.grossDrawCount,
    corpZoneTransitionProjectionSourceHqConsumptionCount:
      quote.sourceHqConsumptionCount,
    corpZoneTransitionProjectionPostDrawDispositionCount:
      quote.postDrawDispositionCount,
    corpZoneTransitionProjectionHqCardsRecycledBeforeDrawCount:
      quote.hqCardsRecycledBeforeDrawCount,
    corpZoneTransitionProjectionArchivesCardsRecycledBeforeDrawCount:
      quote.archivesCardsRecycledBeforeDrawCount,
    corpZoneTransitionProjectionRdCardsReplenishedAfterDrawCount:
      quote.rdCardsReplenishedAfterDrawCount,
    corpZoneTransitionProjectionNetHqDelta: quote.netHqDelta,
    corpZoneTransitionProjectionNetRdDelta: quote.netRdDelta,
    corpZoneTransitionProjectionNetRdConsumption: quote.netRdConsumption,
    corpZoneTransitionProjectionVisibleDrawReplacementSourceCount:
      quote.visibleDrawReplacementSourceCount,
  };
}
