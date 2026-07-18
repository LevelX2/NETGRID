/** Declarative typed port implemented by zone-runtime-services. */
import type {
  CardDefinition,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";

export type ZoneRuntimePort = {
  corpIceInstallBaseCost: (server: CorpServer) => number;
  outermostIceIndex: (server: CorpServer) => number;
  poxCountersForServer: (
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ) => number;
  spyCountersForServer: (
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ) => number;
  poxInstallTax: (
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ) => number;
  corpIceInstallAdditionalCost: (
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ) => number;
  corpIceInstallTotalCost: (
    state: GameState,
    cardId: CardInstanceId,
    server: CorpServer,
  ) => {
    baseCost: number;
    additionalCost: number;
    reduction: number;
    reductionSourceDefinitionIds?: string;
    increaseSourceDefinitionIds?: string;
    totalCost: number;
  };
  assertCorpIceInstallCostValid: (
    state: GameState,
    cardId: CardInstanceId,
    definition: CardDefinition,
    legalAction: LegalAction,
  ) => import("..").CostQuote | undefined;
};
