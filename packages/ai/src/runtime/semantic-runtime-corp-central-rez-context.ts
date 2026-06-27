import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";

import { RUNTIME_CARDS } from "../ai-hints";
import type { CorpCentralRezReserveAssessment } from "./corp-scoring-assessment-types";

type CentralServerId = "hq" | "rd";

type CorpCentralThreatAssessment = {
  serverId: CentralServerId;
  active: boolean;
  pressure: number;
  runOrAccessEvents: number;
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
    if (rezFloor <= 0) return undefined;
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
    return (["hq", "rd"] as const).some((serverId) => {
      const assessment = semanticRuntimeCorpExistingCentralRezFloorAssessment(
        input,
        serverId,
      );
      return assessment.blockedByFloor;
    });
  };

  const semanticRuntimeCorpExistingCentralRezFloorAssessment = (
    input: AiDecisionInput,
    serverId: CentralServerId,
  ): {
    rezFloor: number;
    blockedByFloor: boolean;
    evidence: string[];
  } => {
    const centralThreat = semanticRuntimeCorpCentralThreatAssessment(
      input,
      serverId,
    );
    if (!centralThreat.active) {
      return {
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
      .map(semanticRuntimeCorpVisibleIceRezCost)
      .filter((cost): cost is number => cost !== undefined && cost > 0);
    const rezFloor = rezCosts.length > 0 ? Math.min(...rezCosts) : 0;
    const blockedByFloor =
      rezFloor > 0 && input.playerView.own.credits < rezFloor;
    return {
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
  };

  return {
    semanticRuntimeCorpActionIceRezCost,
    semanticRuntimeCorpCentralRezReserveAssessment,
    semanticRuntimeCorpHasAgendaInHq,
    semanticRuntimeCorpHasCentralRezFloorFundingNeed,
  };
}

function semanticRuntimeCorpCentralThreatAssessment(
  input: AiDecisionInput,
  serverId: CentralServerId,
): CorpCentralThreatAssessment {
  const runOrAccessEvents = semanticRuntimeCorpCentralRunOrAccessEventCount(
    input,
    serverId,
  );
  const pressure = Math.min(
    1,
    runOrAccessEvents / 4 + (input.playerView.opponent.credits >= 6 ? 0.1 : 0),
  );
  const hqAgendaExposure =
    serverId === "hq" &&
    input.playerView.own.gripOrHq.some(
      (card) => card.known && card.type === "agenda",
    );
  const active =
    hqAgendaExposure ||
    pressure >= (serverId === "rd" ? 0.5 : 0.75);
  return {
    serverId,
    active,
    pressure,
    runOrAccessEvents,
    evidence: [
      `corp_central_pressure_server:${serverId}`,
      `corp_central_pressure_events:${runOrAccessEvents}`,
      `corp_central_pressure:${pressure.toFixed(2)}`,
      `corp_central_pressure_active:${active}`,
      ...(hqAgendaExposure ? ["corp_hq_agenda_exposure:true"] : []),
    ],
  };
}

function semanticRuntimeCorpCentralRunOrAccessEventCount(
  input: AiDecisionInput,
  serverId: CentralServerId,
): number {
  const eventsById = new Map(
    [...(input.playerView.publicEvents ?? []), ...(input.eventTail ?? [])].map(
      (event) => [event.eventId, event],
    ),
  );
  return [...eventsById.values()].filter((event) => {
    const payload = event.publicPayload;
    const actor = payload.actor;
    const actionType =
      typeof payload.actionType === "string" ? payload.actionType : event.type;
    return (
      actor === "runner" &&
      (actionType === "start_run" || actionType === "access_card") &&
      semanticRuntimeCorpNormalizeCentralServerId(
        typeof payload.serverId === "string"
          ? payload.serverId
          : typeof payload.serverLabel === "string"
            ? payload.serverLabel
            : undefined,
      ) === serverId
    );
  }).length;
}

function semanticRuntimeCorpNormalizeCentralServerId(
  value: string | undefined,
): CentralServerId | undefined {
  if (!value) return undefined;
  const normalized = value.toLocaleLowerCase("en-US");
  if (normalized === "hq") return "hq";
  if (normalized === "rd" || normalized === "r&d" || normalized === "rnd") {
    return "rd";
  }
  return undefined;
}

function semanticRuntimeCorpIsCentralServer(
  serverId: string | undefined,
): serverId is CentralServerId {
  return serverId === "hq" || serverId === "rd";
}

function semanticRuntimeCorpVisibleIceRezCost(
  ice: VisibleCard,
): number | undefined {
  return (
    ice.rezCost ??
    (ice.definitionId
      ? (RUNTIME_CARDS[ice.definitionId]?.numeric.rezCost ??
        DEMO_CARDS_BY_ID[ice.definitionId]?.rezCost)
      : undefined)
  );
}
