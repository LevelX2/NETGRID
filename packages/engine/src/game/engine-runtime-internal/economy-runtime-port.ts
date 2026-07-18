/** Declarative typed port implemented by economy-runtime-services. */
import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import type { RunnerDrawActionContext } from "../turn/runner-draw-actions";

export type EconomyRuntimePort = {
  expireScoredAgendaInstallRezCreditAbilities: (state: GameState) => void;
  isCorpInstallableCardType: (definition: CardDefinition) => boolean;
  edgerunnerTempsInstallActionsRemaining: (state: GameState) => number;
  clearEdgerunnerTempsInstallFlags: (state: GameState) => void;
  consumeEdgerunnerTempsInstallAction: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  valuPakProgramInstallActionsRemaining: (state: GameState) => number;
  valuPakTemporaryProgramInstallCredits: (state: GameState) => number;
  runnerInstallableProgramIdsForValuPak: (state: GameState) => CardInstanceId[];
  installedRunnerProgramTrashOptionsForInstall: (
    state: GameState,
  ) => CardInstanceId[];
  runnerProgramInstallMemoryReachableAfterTrash: (
    state: GameState,
    definition: CardDefinition,
  ) => boolean;
  shouldOfferRunnerProgramTrashBeforeInstall: (
    state: GameState,
    definition: CardDefinition,
  ) => boolean;
  clearValuPakProgramInstallFlags: (state: GameState) => void;
  consumeValuPakProgramInstallAction: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  runnerDrawActionContext: (state: GameState) => RunnerDrawActionContext;
};
