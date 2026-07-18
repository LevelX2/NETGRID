/** Declarative typed port for the ChoiceResolverRuntimePort composition boundary. */
import type { ActiveRun } from "./runtime-shared";
import type {
  CardDefinitionId,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";

export type ChoiceResolverRuntimePort = {
  startRunnerPrivateLookChoice: (
    state: GameState,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinitionId,
    zone: Extract<ServerId, "rd" | "hq">,
    count: number | "all",
    reason: "ability" | "successful_run" | "post_access",
    legalAction?: LegalAction,
  ) => boolean;
  resolveRunnerPrivateLookChoice: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  startPostAccessInstalledProgramChoice: (
    state: GameState,
    run: ActiveRun,
    legalAction?: LegalAction,
  ) => boolean;
  v1915InstalledRevealHelperIds: (state: GameState) => CardDefinitionId[];
  runnerHasInstalledDefinition: (
    state: GameState,
    definitionId: CardDefinitionId,
  ) => boolean;
  trashOlderRegionUpgradesInServer: (
    state: GameState,
    server: CorpServer,
    keepCardId: CardInstanceId,
    legalAction?: LegalAction,
  ) => void;
  appendRegionReplacementTrashEffect: (
    state: GameState,
    server: CorpServer,
    sourceCardId: CardInstanceId,
    trashedCardId: CardInstanceId,
    legalAction?: LegalAction,
  ) => void;
};
