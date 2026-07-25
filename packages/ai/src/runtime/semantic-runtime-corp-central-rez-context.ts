import {
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";

import type { CorpCentralRezReserveAssessment } from "./corp-scoring-assessment-types";
import {
  semanticRuntimeCorpCentralPressureAssessment,
  semanticRuntimeCorpNormalizeCentralServerId,
  type CorpCentralServerId,
} from "./semantic-runtime-corp-central-pressure";

type CorpCentralThreatAssessment = {
  serverId: CorpCentralServerId;
  active: boolean;
  pressure: number;
  runOrAccessEvents: number;
  evidence: string[];
};

export type CorpExistingCentralRezFloorAssessment = {
  serverId: CorpCentralServerId;
  rezFloor: number;
  blockedByFloor: boolean;
  evidence: string[];
};

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
  ) => number | undefined;
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
  ): number | undefined => {
    const sourceCard = dependencies.actionSourceCard(input, action);
    const serverId = dependencies.actionServerId(input, action);
    const payload = action.payload;
    const finalCredits = payload?.postInstallRezQuoteFinalCredits;
    if (
      !sourceCard ||
      !semanticRuntimeCorpIsCentralServer(serverId) ||
      payload?.postInstallRezQuoteComplete !== true ||
      payload.postInstallRezQuoteCardId !== sourceCard.instanceId ||
      payload.postInstallRezQuoteTargetServerId !== serverId ||
      payload.postInstallRezQuoteProjectedServerId !== serverId ||
      payload.postInstallRezQuoteExpiresAtStateVersion !==
        input.playerView.stateVersion ||
      !Number.isSafeInteger(finalCredits) ||
      (finalCredits as number) < 0 ||
      payload.postInstallRezQuoteMandatoryAgendaPointCost !== 0 ||
      payload.postInstallRezQuoteMandatoryAdditionalCostKind !== undefined
    ) {
      return undefined;
    }
    return finalCredits as number;
  };

  const semanticRuntimeCorpHasAgendaInHq = (input: AiDecisionInput): boolean =>
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
    if (!semanticRuntimeCorpIsCentralServer(serverId)) return undefined;
    const centralThreat = semanticRuntimeCorpCentralThreatAssessment(
      input,
      serverId,
    );
    if (!centralThreat.active) return undefined;
    const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
      input,
      action,
    );
    if (!sourceDefinitionId) return undefined;
    const rezFloor = semanticRuntimeCorpActionIceRezCost(input, action);
    if (rezFloor === undefined || rezFloor <= 0) return undefined;
    const creditsAfterAction =
      input.playerView.own.credits - dependencies.actionCreditCost(action);
    const blockedByFloor = creditsAfterAction < rezFloor;
    return {
      serverId,
      sourceDefinitionId,
      rezFloor,
      creditsAfterAction,
      blockedByFloor,
      evidence: [
        "corp_central_rez_floor:true",
        ...centralThreat.evidence,
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
    if (
      input.legalActions.some((action) => {
        const assessment = semanticRuntimeCorpCentralRezReserveAssessment(
          input,
          action,
        );
        return assessment?.blockedByFloor === true;
      })
    ) {
      return true;
    }
    return semanticRuntimeCorpExistingCentralRezFloorAssessments(input).some(
      (assessment) => assessment.blockedByFloor,
    );
  };

  return {
    semanticRuntimeCorpActionIceRezCost,
    semanticRuntimeCorpCentralRezReserveAssessment,
    semanticRuntimeCorpHasAgendaInHq,
    semanticRuntimeCorpHasCentralRezFloorFundingNeed,
  };
}

export function semanticRuntimeCorpExistingCentralRezFloorAssessments(
  input: AiDecisionInput,
): CorpExistingCentralRezFloorAssessment[] {
  return (["hq", "rd"] as const).map((serverId) => {
    const centralThreat = semanticRuntimeCorpCentralThreatAssessment(
      input,
      serverId,
    );
    if (!centralThreat.active) {
      return {
        serverId,
        rezFloor: 0,
        blockedByFloor: false,
        evidence: centralThreat.evidence,
      };
    }
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === serverId,
    );
    const rezCosts = (server?.ice ?? [])
      .filter((ice) => ice.rezzed !== true)
      .map((ice) => semanticRuntimeCorpVisibleIceRezCost(input, serverId, ice))
      .filter((cost): cost is number => cost !== undefined && cost > 0);
    const rezFloor = rezCosts.length > 0 ? Math.min(...rezCosts) : 0;
    const blockedByFloor =
      rezFloor > 0 && input.playerView.own.credits < rezFloor;
    return {
      serverId,
      rezFloor,
      blockedByFloor,
      evidence: [
        ...centralThreat.evidence,
        `central_rez_floor_server:${serverId}`,
        `central_rez_floor:${rezFloor}`,
        `credits:${input.playerView.own.credits}`,
        `central_rez_reserve_below_floor:${blockedByFloor}`,
      ],
    };
  });
}

function semanticRuntimeCorpCentralThreatAssessment(
  input: AiDecisionInput,
  serverId: CorpCentralServerId,
): CorpCentralThreatAssessment {
  const assessment = semanticRuntimeCorpCentralPressureAssessment(
    input,
    serverId,
  );
  return {
    serverId,
    active: assessment.active,
    pressure: assessment.pressure,
    runOrAccessEvents: assessment.runOrAccessEvents,
    evidence: assessment.evidence,
  };
}

function semanticRuntimeCorpIsCentralServer(
  serverId: string | undefined,
): serverId is CorpCentralServerId {
  return serverId === "hq" || serverId === "rd";
}

function semanticRuntimeCorpVisibleIceRezCost(
  input: AiDecisionInput,
  serverId: CorpCentralServerId,
  ice: VisibleCard,
): number | undefined {
  const quote = ice.effectiveRezCostQuote;
  if (
    quote?.context !== "installed" ||
    !quote.complete ||
    quote.cardId !== ice.instanceId ||
    quote.targetServerId !== serverId ||
    quote.projectedServerId !== serverId ||
    quote.expiresAtStateVersion !== input.playerView.stateVersion ||
    !Number.isSafeInteger(quote.finalCredits) ||
    quote.finalCredits < 0 ||
    quote.mandatoryAdditionalCosts.agendaPoints !== 0
  ) {
    return undefined;
  }
  return quote.finalCredits;
}
