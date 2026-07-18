/** Declarative typed port for the lifecycleRuntime composition group. */
import type {
  CardDefinitionId,
  CardInstanceId,
  DrawTaxDecision,
  GameState,
  LegalAction,
  PlayerAction,
  RunnerDrawSummary,
  ServerId,
} from "./runtime-shared";

export type LifecycleRuntimePort = {
  discardRandomCorpHqCards: (
    state: GameState,
    maxCount: number,
    purposePrefix: string,
  ) => CardInstanceId[];
  trashRunnerInstalledProgram: (
    state: GameState,
    cardId: CardInstanceId,
  ) => void;
  backupProgramsOnTrashBackupHardwareBeforeTrash: (
    state: GameState,
    candidateProgramIds: CardInstanceId[],
  ) => CardInstanceId[];
  runnerProgramUsesMemory: (
    state: GameState,
    cardId: CardInstanceId,
  ) => boolean;
  trashRunnerInstalledCardToHeap: (
    state: GameState,
    cardId: CardInstanceId,
    legalAction?: LegalAction,
  ) => void;
  returnRunnerInstalledCardToGrip: (
    state: GameState,
    cardId: CardInstanceId,
  ) => void;
  returnRunnerInstalledProgramsToGripForAccess: (
    state: GameState,
    cardIds: readonly CardInstanceId[],
  ) => {
    publicPayload: Record<string, string | number | boolean>;
  };
  trashCorpInstalledCardToArchives: (
    state: GameState,
    cardId: CardInstanceId,
    legalAction?: LegalAction,
  ) => void;
  cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay: (
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
    sourceDefinitionId: CardDefinitionId,
    legalAction?: LegalAction,
  ) => void;
  drawRunnerCard: (
    state: GameState,
    drawTaxDecision?: DrawTaxDecision,
  ) => RunnerDrawSummary;
  activeCrashEverettSourceId: (state: GameState) => CardInstanceId | undefined;
  startCrashEverettDrawChoice: (
    state: GameState,
    sourceCardId: CardInstanceId,
    drawnCardIds: readonly CardInstanceId[],
  ) => void;
  drawRunnerCards: (
    state: GameState,
    amount: number,
    drawTaxDecision?: DrawTaxDecision,
  ) => RunnerDrawSummary;
  resolveCrashEverettDrawChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveRunnerDrawSequenceChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resumeRunnerDrawSequenceAfterTagPrevention: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
};
