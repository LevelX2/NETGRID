import type {
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
} from "@netgrid/shared";
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
  return buildLegalAction(
    state,
    "corp",
    "install_card",
    "ICE vor neuem Remote installieren",
    cardId,
    [{ clicks: 1 }],
    { cardId, serverId: "new_remote", placement: "ice" },
  );
}

export function buildCorpServerIceInstallAction(
  state: GameState,
  cardId: CardInstanceId,
  server: CorpInstallServerRef,
  cost: CorpIceInstallCostDetails,
): LegalAction {
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
        ? { iceInstallReductionSourceDefinitionIds: cost.reductionSourceDefinitionIds }
        : {}),
      ...(cost.increaseSourceDefinitionIds
        ? { iceInstallIncreaseSourceDefinitionIds: cost.increaseSourceDefinitionIds }
        : {}),
      iceInstallTotalCost: cost.totalCost,
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
    { cardId, serverId: "new_remote", placement: "root" },
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
      ...(options.replacesRootAsset ? { rootReplacement: "asset_to_agenda" } : {}),
      ...(options.replacesRegion ? { regionReplacementWarning: true } : {}),
    },
  );
}
