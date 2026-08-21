/** Declarative typed port for the actionRuntimeHosts composition group. */
import type { BoardStateActionExecutionHost } from "../board/board-state-action-execution";
import type { CorpInstallRezSequenceHandlerHost } from "../corp/install-rez-sequence-handlers";
import type { ScoredAgendaAbilityHost } from "../corp/scored-agenda-abilities";
import type { ScoredAgendaFlowHost } from "../corp/scored-agenda-flow";
import type { CorpSpecialDamageAbilityHost } from "../corp/special-damage-abilities";
import type { CorpTraceDamageAbilityHost } from "../corp/trace-damage-abilities";
import type { CreditEconomyExecutionHost } from "../economy/credit-economy-execution";
import type { CorpOperationResolutionHost } from "../play/corp-operation-resolution";
import type { PlayCardExecutionHost } from "../play/play-card-execution";
import type { TurnBasicExecutionHost } from "../turn/turn-basic-execution";
import type {
  CardInstanceId,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
  Side,
} from "@netgrid/shared";

export type ActionRuntimePort = {
  corpRunnerActionPaidWindowActions: (state: GameState) => LegalAction[];
  runnerRunSpecialEffectActions: (state: GameState) => LegalAction[];
  specialZoneHarnessActions: (state: GameState, side: Side) => LegalAction[];
  turnBasicExecutionHost: (state: GameState) => TurnBasicExecutionHost;
  creditEconomyExecutionHost: (state: GameState) => CreditEconomyExecutionHost;
  corpInstallRezSequenceHandlerHost: (
    state: GameState,
    legalAction: LegalAction,
    playerAction?: PlayerAction,
  ) => CorpInstallRezSequenceHandlerHost;
  scoredAgendaFlowHost: (
    state: GameState,
    legalAction?: LegalAction,
    playerAction?: PlayerAction,
  ) => ScoredAgendaFlowHost;
  scoredAgendaAbilityHost: (
    state: GameState,
    legalAction?: LegalAction,
  ) => ScoredAgendaAbilityHost;
  corpTraceDamageAbilityHost: (
    state: GameState,
    legalAction?: LegalAction,
  ) => CorpTraceDamageAbilityHost;
  corpSpecialDamageAbilityHost: (
    state: GameState,
    legalAction?: LegalAction,
  ) => CorpSpecialDamageAbilityHost;
  playCardExecutionHost: (state: GameState) => PlayCardExecutionHost;
  corpOperationResolutionHost: (
    state: GameState,
  ) => CorpOperationResolutionHost;
  boardStateActionExecutionHost: (
    state: GameState,
  ) => BoardStateActionExecutionHost;
  hasHiddenResourceAccessStartActions: (
    state: GameState,
    run: NonNullable<GameState["run"]>,
    serverId: Exclude<ServerId, "new_remote">,
  ) => boolean;
  pushCorpTraceDamageOrCardImplementationActions: (
    state: GameState,
    actions: LegalAction[],
    cardId: CardInstanceId,
    host?: CorpTraceDamageAbilityHost,
  ) => void;
};
