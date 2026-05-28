import type {
  CardInstanceId,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import {
  handleTriggerAbilityExecution,
  type TriggerAbilityExecutionHost,
} from "../abilities/trigger-ability-execution";
import {
  handleAccessExecution,
  type AccessFlowHost,
} from "../access/access-flow";
import {
  handleBoardStateActionExecution,
  type BoardStateActionExecutionHost,
} from "../board/board-state-action-execution";
import {
  handleActivatedCardImplementationAction,
  type ActivatedCardImplementationExecutionHost,
} from "../card-implementation/activated-action-execution";
import {
  resolvePendingChoice,
  type PendingChoiceResolutionHost,
} from "../choices/pending-choice-resolution";
import {
  handleCreditEconomyExecution,
  type CreditEconomyExecutionHost,
} from "../economy/credit-economy-execution";
import {
  scoreAgenda,
  type ScoredAgendaFlowHost,
} from "../corp/scored-agenda-flow";
import { installCard as executeInstallCard, type InstallCardHost } from "../install/install-card";
import {
  handlePlayCardExecution,
  type PlayCardExecutionHost,
} from "../play/play-card-execution";
import {
  handleRezActionExecution,
  type RezActionExecutionHost,
} from "../rez/rez-action-execution";
import {
  handleRunMovementAction,
  type RunMovementHost,
} from "../run/run-movement";
import {
  handleRunnerBreakerActionExecution,
  type RunnerBreakerActionExecutionHost,
} from "../run/runner-breaker-action-execution";
import {
  handleStartRunActionExecution,
  type StartRunActionExecutionHost,
} from "../run/start-run-action-execution";
import {
  handleTurnBasicExecution,
  type TurnBasicExecutionHost,
} from "../turn/turn-basic-execution";

type HandledResult = {
  handled: boolean;
};

export type PerformActionExecutionHost = {
  turn: {
    handleTurnBasicExecution: (legalAction: LegalAction) => HandledResult;
  };
  economy: {
    handleCreditEconomyExecution: (legalAction: LegalAction) => void;
  };
  abilities: {
    handleTriggerAbilityExecution: (legalAction: LegalAction) => void;
  };
  cardImplementation: {
    handleActivatedCardImplementationAction: (legalAction: LegalAction) => void;
  };
  play: {
    handlePlayCardExecution: (legalAction: LegalAction) => void;
  };
  install: {
    executeInstallCard: (legalAction: LegalAction) => void;
  };
  board: {
    handleBoardStateActionExecution: (legalAction: LegalAction) => void;
  };
  corp: {
    scoreAgenda: (legalAction: LegalAction, cardId: CardInstanceId) => void;
  };
  run: {
    handleStartRunActionExecution: (legalAction: LegalAction) => void;
    handleRunMovementAction: (legalAction: LegalAction) => HandledResult;
    handleRunnerBreakerActionExecution: (legalAction: LegalAction) => void;
    continueRun: (legalAction: LegalAction) => void;
  };
  rez: {
    handleRezActionExecution: (legalAction: LegalAction) => void;
  };
  access: {
    handleAccessExecution: (legalAction: LegalAction) => HandledResult;
  };
  choices: {
    resolvePendingChoice: (
      legalAction: LegalAction,
      playerAction: PlayerAction,
    ) => void;
  };
};

export type PerformActionExecutionDependencies = {
  turn: {
    turnBasicExecutionHost: (state: GameState) => TurnBasicExecutionHost;
  };
  economy: {
    creditEconomyExecutionHost: (state: GameState) => CreditEconomyExecutionHost;
  };
  abilities: {
    triggerAbilityExecutionHost: (state: GameState) => TriggerAbilityExecutionHost;
  };
  cardImplementation: {
    activatedCardImplementationExecutionHost: (
      state: GameState,
      legalAction: LegalAction,
    ) => ActivatedCardImplementationExecutionHost;
  };
  play: {
    playCardExecutionHost: (state: GameState) => PlayCardExecutionHost;
  };
  install: {
    installCardHost: (state: GameState) => InstallCardHost;
  };
  board: {
    boardStateActionExecutionHost: (
      state: GameState,
    ) => BoardStateActionExecutionHost;
  };
  corp: {
    scoredAgendaFlowHost: (
      state: GameState,
      legalAction: LegalAction,
    ) => ScoredAgendaFlowHost;
  };
  run: {
    startRunActionExecutionHost: (
      state: GameState,
    ) => StartRunActionExecutionHost;
    runMovementHostForState: (state: GameState) => RunMovementHost;
    runnerBreakerActionExecutionHost: (
      state: GameState,
    ) => RunnerBreakerActionExecutionHost;
    continueRun: (state: GameState, legalAction: LegalAction) => void;
  };
  rez: {
    rezActionExecutionHost: (state: GameState) => RezActionExecutionHost;
  };
  access: {
    accessFlowHost: (state: GameState) => AccessFlowHost;
  };
  choices: {
    pendingChoiceResolutionHost: (
      state: GameState,
    ) => PendingChoiceResolutionHost;
  };
};

export function createPerformActionExecutor(
  hostForState: (state: GameState) => PerformActionExecutionHost,
): (
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
) => void {
  return (state, legalAction, playerAction) =>
    performAction(hostForState(state), legalAction, playerAction);
}

export function createPerformActionExecutorFromDependencies(
  dependencies: PerformActionExecutionDependencies,
): (
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
) => void {
  return createPerformActionExecutor((state) => ({
    turn: {
      handleTurnBasicExecution: (legalAction) =>
        handleTurnBasicExecution(
          dependencies.turn.turnBasicExecutionHost(state),
          legalAction,
        ),
    },
    economy: {
      handleCreditEconomyExecution: (legalAction) =>
        handleCreditEconomyExecution(
          dependencies.economy.creditEconomyExecutionHost(state),
          legalAction,
        ),
    },
    abilities: {
      handleTriggerAbilityExecution: (legalAction) =>
        handleTriggerAbilityExecution(
          dependencies.abilities.triggerAbilityExecutionHost(state),
          legalAction,
        ),
    },
    cardImplementation: {
      handleActivatedCardImplementationAction: (legalAction) =>
        handleActivatedCardImplementationAction(
          dependencies.cardImplementation.activatedCardImplementationExecutionHost(
            state,
            legalAction,
          ),
        ),
    },
    play: {
      handlePlayCardExecution: (legalAction) =>
        handlePlayCardExecution(dependencies.play.playCardExecutionHost(state), legalAction),
    },
    install: {
      executeInstallCard: (legalAction) =>
        executeInstallCard(dependencies.install.installCardHost(state), legalAction),
    },
    board: {
      handleBoardStateActionExecution: (legalAction) =>
        handleBoardStateActionExecution(
          dependencies.board.boardStateActionExecutionHost(state),
          legalAction,
        ),
    },
    corp: {
      scoreAgenda: (legalAction, cardId) =>
        scoreAgenda(
          dependencies.corp.scoredAgendaFlowHost(state, legalAction),
          cardId,
        ),
    },
    run: {
      handleStartRunActionExecution: (legalAction) =>
        handleStartRunActionExecution(
          dependencies.run.startRunActionExecutionHost(state),
          legalAction,
        ),
      handleRunMovementAction: (legalAction) =>
        handleRunMovementAction(
          dependencies.run.runMovementHostForState(state),
          legalAction,
        ),
      handleRunnerBreakerActionExecution: (legalAction) =>
        handleRunnerBreakerActionExecution(
          dependencies.run.runnerBreakerActionExecutionHost(state),
          legalAction,
        ),
      continueRun: (legalAction) => dependencies.run.continueRun(state, legalAction),
    },
    rez: {
      handleRezActionExecution: (legalAction) =>
        handleRezActionExecution(
          dependencies.rez.rezActionExecutionHost(state),
          legalAction,
        ),
    },
    access: {
      handleAccessExecution: (legalAction) =>
        handleAccessExecution(dependencies.access.accessFlowHost(state), legalAction),
    },
    choices: {
      resolvePendingChoice: (legalAction, playerAction) =>
        resolvePendingChoice(
          dependencies.choices.pendingChoiceResolutionHost(state),
          legalAction,
          playerAction,
        ),
    },
  }));
}

export function performAction(
  host: PerformActionExecutionHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  if (host.turn.handleTurnBasicExecution(legalAction).handled) return;

  switch (legalAction.type) {
    case "activated_card_ability":
      host.cardImplementation.handleActivatedCardImplementationAction(legalAction);
      return;
    case "gain_credit":
      host.economy.handleCreditEconomyExecution(legalAction);
      return;
    case "play_event":
    case "play_operation":
      host.play.handlePlayCardExecution(legalAction);
      return;
    case "install_card":
      host.install.executeInstallCard(legalAction);
      return;
    case "advance_card":
      host.board.handleBoardStateActionExecution(legalAction);
      return;
    case "score_agenda":
      host.corp.scoreAgenda(
        legalAction,
        String(legalAction.payload?.cardId) as CardInstanceId,
      );
      return;
    case "start_run":
      host.run.handleStartRunActionExecution(legalAction);
      return;
    case "jack_out":
      host.run.handleRunMovementAction(legalAction);
      return;
    case "rez_ice":
    case "decline_rez":
      host.rez.handleRezActionExecution(legalAction);
      return;
    case "pump_breaker":
    case "break_subroutine":
      host.run.handleRunnerBreakerActionExecution(legalAction);
      return;
    case "continue_run":
      if (host.run.handleRunMovementAction(legalAction).handled) return;
      host.run.continueRun(legalAction);
      return;
    case "access_card":
    case "steal_agenda":
    case "trash_accessed_card":
      if (host.access.handleAccessExecution(legalAction).handled) return;
      throw new Error("Die Access-Aktion ist nicht gueltig.");
    case "trash_resource":
      host.board.handleBoardStateActionExecution(legalAction);
      return;
    case "decline_trash":
      if (host.access.handleAccessExecution(legalAction).handled) return;
      throw new Error("Die Access-Aktion ist nicht gueltig.");
    case "move_to_set_aside":
    case "move_to_removed_from_game":
    case "return_from_set_aside":
    case "change_card_control":
      host.board.handleBoardStateActionExecution(legalAction);
      return;
    case "resolve_choice":
      host.choices.resolvePendingChoice(legalAction, playerAction);
      return;
    case "trigger_ability":
      host.abilities.handleTriggerAbilityExecution(legalAction);
      return;
  }
}
