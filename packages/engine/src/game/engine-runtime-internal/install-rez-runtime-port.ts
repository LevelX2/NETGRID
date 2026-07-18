/** Declarative typed port implemented by install-rez-runtime-hosts.ts. */
import type {
  CardDefinition,
  CardInstanceId,
  CorpServer,
  GameState,
} from "@netgrid/shared";
import type { RezActionExecutionHost } from "../rez/rez-action-execution";

export type InstallRezRuntimePort = {
  canInstallCorpRootCardInServer: (
    state: GameState,
    definition: CardDefinition,
    server: CorpServer,
  ) => boolean;
  corpRootAgendaOrNodeCapacityInServer: (
    state: GameState,
    server: CorpServer,
  ) => number;
  corpRegionUpgradeIdsInServer: (
    state: GameState,
    server: CorpServer,
  ) => CardInstanceId[];
  rezActionExecutionHost: (state: GameState) => RezActionExecutionHost;
};
