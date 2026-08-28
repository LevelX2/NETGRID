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
