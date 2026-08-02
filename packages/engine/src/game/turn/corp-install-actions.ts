import type {
  CardInstanceId,
  CorpAgendaInstallScoreHorizonPayload,
  CorpServer,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import { CORP_AGENDA_INSTALL_SCORE_HORIZON_QUOTE_SCHEMA_VERSION } from "@netgrid/shared";
import { effectiveAgendaDifficulty } from "../../ability-engine/effective-values";
import {
  corpIcePostInstallRezProjectionPayload,
  projectCorpIceRezCostAfterInstall,
} from "../payment";
import {
  definitionFor,
  serverDifficultyIncreaseFromRunCounters,
  serverDifficultyReductionFromUpgrades,
} from "../view/card-view";
import { guaranteedNextCorpTurnFlexibleClicks } from "../view/visible-corp-score-continuation-quote";
import { buildLegalAction } from "./action-builders";

export type CorpInstallServerRef = Pick<CorpServer, "id" | "label">;

export type CorpIceInstallCostDetails = {
  baseCost: number;
  additionalCost: number;
  reduction: number;
  reductionSourceDefinitionIds?: string;
  increaseSourceDefinitionIds?: string;
  totalCost: number;
};

export type CorpRootInstallOptions = {
  replacesRootAsset?: boolean;
  replacesRegion?: boolean;
};

export function buildCorpNewRemoteIceInstallAction(
  state: GameState,
  cardId: CardInstanceId,
): LegalAction {
  const rezProjection = projectCorpIceRezCostAfterInstall(
    state,
    cardId,
    "new_remote",
  );
  return buildLegalAction(
    state,
    "corp",
    "install_card",
    "ICE vor neuem Remote installieren",
    cardId,
    [{ clicks: 1 }],
    {
      cardId,
      serverId: "new_remote",
      placement: "ice",
      ...corpIcePostInstallRezProjectionPayload(rezProjection),
    },
  );
}

export function buildCorpServerIceInstallAction(
  state: GameState,
  cardId: CardInstanceId,
  server: CorpInstallServerRef,
  cost: CorpIceInstallCostDetails,
): LegalAction {
  const rezProjection = projectCorpIceRezCostAfterInstall(
    state,
    cardId,
    server.id,
  );
  return buildLegalAction(
    state,
    "corp",
    "install_card",
    `ICE vor ${server.label} installieren`,
    cardId,
    [{ clicks: 1, ...(cost.totalCost > 0 ? { credits: cost.totalCost } : {}) }],
    {
      cardId,
      serverId: server.id,
      placement: "ice",
      iceInstallBaseCost: cost.baseCost,
      iceInstallAdditionalCost: cost.additionalCost,
      iceInstallReduction: cost.reduction,
      ...(cost.reductionSourceDefinitionIds
        ? {
            iceInstallReductionSourceDefinitionIds:
              cost.reductionSourceDefinitionIds,
          }
        : {}),
      ...(cost.increaseSourceDefinitionIds
        ? {
            iceInstallIncreaseSourceDefinitionIds:
              cost.increaseSourceDefinitionIds,
          }
        : {}),
      iceInstallTotalCost: cost.totalCost,
      ...corpIcePostInstallRezProjectionPayload(rezProjection),
    },
  );
}

export function buildCorpNewRemoteRootInstallAction(
  state: GameState,
  cardId: CardInstanceId,
  installCost: number,
): LegalAction {
  return buildLegalAction(
    state,
    "corp",
    "install_card",
    "Karte in neuem Remote installieren",
    cardId,
    [{ clicks: 1, ...(installCost > 0 ? { credits: installCost } : {}) }],
    {
      cardId,
      serverId: "new_remote",
      placement: "root",
      ...corpAgendaInstallScoreHorizonPayload(state, cardId, "new_remote"),
    },
  );
}

export function buildCorpServerRootInstallAction(
  state: GameState,
  cardId: CardInstanceId,
  server: CorpInstallServerRef,
  installCost: number,
  options: CorpRootInstallOptions = {},
): LegalAction {
  return buildLegalAction(
    state,
    "corp",
    "install_card",
    `Karte in ${server.label} installieren`,
    cardId,
    [{ clicks: 1, ...(installCost > 0 ? { credits: installCost } : {}) }],
    {
      cardId,
      serverId: server.id,
      placement: "root",
      ...(options.replacesRootAsset
        ? { rootReplacement: "asset_to_agenda" }
        : {}),
      ...(options.replacesRegion ? { regionReplacementWarning: true } : {}),
      ...corpAgendaInstallScoreHorizonPayload(state, cardId, server.id),
    },
  );
}

function corpAgendaInstallScoreHorizonPayload(
  state: GameState,
  cardId: CardInstanceId,
  targetServerId: ServerId,
): CorpAgendaInstallScoreHorizonPayload | Record<string, never> {
  const instance = state.cardInstances[cardId];
  if (!instance) return {};
  const definition = definitionFor(state, cardId);
  if (definition.type !== "agenda") return {};

  const projectedState =
    targetServerId === "new_remote"
      ? state
      : projectAgendaIntoExistingServer(state, cardId, targetServerId);
  const advancementRequirement = effectiveAgendaDifficulty(
    {
      definitionFor,
      serverDifficultyIncreaseFromRunCounters,
      serverDifficultyReductionFromUpgrades,
    },
    projectedState,
    cardId,
  );
  const maximumCurrentTurnAdvances = Math.min(
    advancementRequirement,
    Math.max(0, Math.floor(state.corp.clicks) - 1),
  );
  const remainingAdvancesAfterCurrentTurn = Math.max(
    0,
    advancementRequirement - maximumCurrentTurnAdvances,
  );
  const nextCorpTurnGuaranteedFlexibleClicks =
    guaranteedNextCorpTurnFlexibleClicks(state);
  const binding = {
    agendaInstallScoreHorizonQuoteSchemaVersion:
      CORP_AGENDA_INSTALL_SCORE_HORIZON_QUOTE_SCHEMA_VERSION,
    agendaInstallScoreHorizonQuoteCardId: cardId,
    agendaInstallScoreHorizonQuoteTargetServerId: targetServerId,
    agendaInstallScoreHorizonQuoteExpiresAtStateVersion: state.stateVersion,
    agendaInstallScoreHorizonQuoteAdvancementRequirement:
      advancementRequirement,
    agendaInstallScoreHorizonQuoteMaximumCurrentTurnAdvances:
      maximumCurrentTurnAdvances,
    agendaInstallScoreHorizonQuoteRemainingAdvancesAfterCurrentTurn:
      remainingAdvancesAfterCurrentTurn,
    agendaInstallScoreHorizonQuoteNextCorpTurnGuaranteedFlexibleClicks:
      nextCorpTurnGuaranteedFlexibleClicks,
  } as const;
  if (
    remainingAdvancesAfterCurrentTurn > nextCorpTurnGuaranteedFlexibleClicks
  ) {
    return {
      ...binding,
      agendaInstallScoreHorizonQuoteComplete: false,
      agendaInstallScoreHorizonQuoteReason: "not_completable_by_next_corp_turn",
    };
  }
  return {
    ...binding,
    agendaInstallScoreHorizonQuoteComplete: true,
  };
}

function projectAgendaIntoExistingServer(
  state: GameState,
  cardId: CardInstanceId,
  serverId: Exclude<ServerId, "new_remote">,
): GameState {
  const instance = state.cardInstances[cardId]!;
  return {
    ...state,
    cardInstances: {
      ...state.cardInstances,
      [cardId]: {
        ...instance,
        zone: { side: "corp", zone: "serverRoot", serverId },
      },
    },
    corp: {
      ...state.corp,
      servers: state.corp.servers.map((server) =>
        server.id === serverId && !server.root.includes(cardId)
          ? { ...server, root: [...server.root, cardId] }
          : server,
      ),
    },
  };
}
