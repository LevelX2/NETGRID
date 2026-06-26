import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";

import { RUNTIME_CARDS } from "../ai-hints";
import type { CorpCentralRezReserveAssessment } from "./corp-scoring-assessment-types";

export type SemanticRuntimeCorpCentralRezContextDependencies = {
  actionCreditCost: (action: LegalAction) => number;
  actionServerId: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  actionSourceCard: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => VisibleCard | undefined;
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
};

export function createSemanticRuntimeCorpCentralRezContext(
  dependencies: SemanticRuntimeCorpCentralRezContextDependencies,
): {
  semanticRuntimeCorpActionIceRezCost: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number;
  semanticRuntimeCorpCentralRezReserveAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpCentralRezReserveAssessment | undefined;
  semanticRuntimeCorpHasAgendaInHq: (input: AiDecisionInput) => boolean;
  semanticRuntimeCorpHasCentralRezFloorFundingNeed: (
    input: AiDecisionInput,
  ) => boolean;
} {
  const semanticRuntimeCorpActionIceRezCost = (
    input: AiDecisionInput,
    action: LegalAction,
  ): number => {
    const sourceCard = dependencies.actionSourceCard(input, action);
    const sourceDefinitionId =
      sourceCard?.definitionId ??
      dependencies.sourceDefinitionIdForAction(input, action);
    return (
      sourceCard?.rezCost ??
      (sourceDefinitionId
        ? (RUNTIME_CARDS[sourceDefinitionId]?.numeric.rezCost ??
          DEMO_CARDS_BY_ID[sourceDefinitionId]?.rezCost)
        : undefined) ??
      0
    );
  };

  const semanticRuntimeCorpHasAgendaInHq = (
    input: AiDecisionInput,
  ): boolean =>
    input.playerView.own.gripOrHq.some(
      (card) => card.known && card.type === "agenda",
    );

  const semanticRuntimeCorpCentralRezReserveAssessment = (
    input: AiDecisionInput,
    action: LegalAction,
  ): CorpCentralRezReserveAssessment | undefined => {
    if (input.side !== "corp" || action.side !== "corp") return undefined;
    if (action.type !== "install_card" || action.payload?.placement !== "ice")
      return undefined;
    const serverId = dependencies.actionServerId(input, action);
    if (serverId !== "hq") return undefined;
    if (!semanticRuntimeCorpHasAgendaInHq(input)) return undefined;
    const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
      input,
      action,
    );
    if (!sourceDefinitionId) return undefined;
    const rezFloor = semanticRuntimeCorpActionIceRezCost(input, action);
    if (rezFloor <= 0) return undefined;
    const creditsAfterAction =
      input.playerView.own.credits - dependencies.actionCreditCost(action);
    const blockedByFloor = creditsAfterAction < rezFloor;
    return {
      serverId: "hq",
      sourceDefinitionId,
      rezFloor,
      creditsAfterAction,
      blockedByFloor,
      evidence: [
        "corp_central_rez_floor:true",
        "corp_hq_agenda_exposure:true",
        `central_rez_floor_server:${serverId}`,
        `source_definition:${sourceDefinitionId}`,
        `central_rez_floor:${rezFloor}`,
        `credits_after_action:${creditsAfterAction}`,
        `central_rez_reserve_below_floor:${blockedByFloor}`,
      ],
    };
  };

  const semanticRuntimeCorpHasCentralRezFloorFundingNeed = (
    input: AiDecisionInput,
  ): boolean => {
    if (input.side !== "corp") return false;
    return input.legalActions.some((action) => {
      const assessment = semanticRuntimeCorpCentralRezReserveAssessment(
        input,
        action,
      );
      return assessment?.blockedByFloor === true;
    });
  };

  return {
    semanticRuntimeCorpActionIceRezCost,
    semanticRuntimeCorpCentralRezReserveAssessment,
    semanticRuntimeCorpHasAgendaInHq,
    semanticRuntimeCorpHasCentralRezFloorFundingNeed,
  };
}
