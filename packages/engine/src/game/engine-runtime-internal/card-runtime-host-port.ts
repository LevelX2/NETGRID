/** Declarative typed port for the cardRuntimeHosts composition group. */
import type { ActivatedCardAbilityImplementation } from "../../ability-engine/definition-types";
import type { RuntimeIcebreakerAbility } from "../../ability-engine/icebreaker-abilities";
import type { CounterUtilityTriggerExecutionHost } from "../abilities/counter-utility-trigger-execution";
import type { RunFortTriggerExecutionHost } from "../abilities/run-fort-trigger-execution";
import type { RunnerSpecialTriggerExecutionHost } from "../abilities/runner-special-trigger-execution";
import type { TriggerAbilityExecutionHost } from "../abilities/trigger-ability-execution";
import type { InstallCardHost } from "../install/install-card";
import type { RezCardHost } from "../rez/rez-card";
import type { TraceOrchestrationHost } from "../trace/trace-orchestration";
import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
  Side,
} from "@netgrid/shared";

export type CardRuntimeHostPort = {
  selectedServerIcebreakerStrengthCounterBonus: (
    state: GameState,
    breakerId: CardInstanceId,
  ) => number;
  permanentIcebreakerStrengthCounterBonus: (
    state: GameState,
    breakerId: CardInstanceId,
  ) => number;
  pumpAmountForLegalAction: (
    state: GameState,
    legalAction: LegalAction,
  ) => number;
  pumpAbilityForLegalAction: (
    state: GameState,
    legalAction: LegalAction,
  ) => RuntimeIcebreakerAbility | undefined;
  breakAbilityForLegalAction: (
    state: GameState,
    legalAction: LegalAction,
  ) => RuntimeIcebreakerAbility | undefined;
  pumpDurationForLegalAction: (
    state: GameState,
    legalAction: LegalAction,
  ) => "current_encounter" | "current_run" | "current_turn";
  assertCurrentSubroutineMatchesLegalAction: (
    state: GameState,
    iceDefinition: CardDefinition,
    subroutineIndex: number,
    legalAction: LegalAction,
  ) => NonNullable<CardDefinition["subroutines"]>[number];
  resolveMultiBreakSubroutinesAction: (
    state: GameState,
    breakerId: CardInstanceId,
    legalAction: LegalAction,
    options?: {
      costAlreadyPaid?: boolean;
      skipAardvarkInterception?: boolean;
    },
  ) => {
    paid: boolean;
    resolved: boolean;
    suspended: boolean;
  };
  assertBreakSubroutineCostQuoteValid: (
    state: GameState,
    breakerId: CardInstanceId | undefined,
    legalAction: LegalAction,
    subroutine: NonNullable<CardDefinition["subroutines"]>[number],
  ) => void;
  subroutinesForCurrentEncounter: (
    state: GameState,
    iceDefinition: CardDefinition,
  ) => NonNullable<CardDefinition["subroutines"]>;
  variableTraceSubroutineForCurrentEncounter: (
    state: GameState,
    iceId: CardInstanceId | undefined,
    subroutine: NonNullable<CardDefinition["subroutines"]>[number],
  ) => NonNullable<CardDefinition["subroutines"]>[number];
  relativeDamageSubroutineForCurrentEncounter: (
    state: GameState,
    iceId: CardInstanceId | undefined,
    subroutine: NonNullable<CardDefinition["subroutines"]>[number],
  ) => NonNullable<CardDefinition["subroutines"]>[number];
  relativeTraceSubroutinesForCurrentEncounter: (
    state: GameState,
    iceId: CardInstanceId,
  ) => NonNullable<CardDefinition["subroutines"]>;
  runCardImplementationActionHost: (state: GameState) => {
    state: GameState;
    cards: {
      cardInstanceFor: (cardId: CardInstanceId) => CardInstance | undefined;
      definitionFor: (cardId: CardInstanceId) => CardDefinition;
      runnerInstalledCardIds: () => string[];
      cardImplementationForDefinitionId: (
        definitionId: string,
      ) =>
        | import("../../card-implementations/types").CardImplementationDefinition
        | undefined;
    };
    actions: {
      buildLegalAction: (
        type: LegalAction["type"],
        label: string,
        source: LegalAction["source"],
        costs?: LegalAction["costs"],
        payload?: LegalAction["payload"],
      ) => LegalAction;
    };
    runtime: {
      pushActivatedActionsForTiming: (
        actions: LegalAction[],
        side: Side,
        sourceCardId: CardInstanceId,
        definition: CardDefinition,
        timing: ActivatedCardAbilityImplementation["timing"],
      ) => void;
    };
  };
  runStartTaxForServerUpgrades: (
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ) => {
    amount: number;
    sourceDefinitionIds: CardDefinitionId[];
    runStartLossAmount?: number;
    runStartLossSourceDefinitionIds?: CardDefinitionId[];
  };
  runStartTaxForCorpRootAssets: (state: GameState) => {
    amount: number;
    sourceDefinitionIds: CardDefinitionId[];
  };
  spendRunnerAccessTrashCredits: (
    state: GameState,
    amount: number,
    accessedCardId: CardInstanceId,
  ) => {
    recurringSpent: number;
    runnerCreditsSpent: number;
  };
  runnerSpecialTriggerExecutionHost: (
    state: GameState,
  ) => RunnerSpecialTriggerExecutionHost;
  runFortTriggerExecutionHost: (
    state: GameState,
  ) => RunFortTriggerExecutionHost;
  counterUtilityTriggerExecutionHost: (
    state: GameState,
  ) => CounterUtilityTriggerExecutionHost;
  triggerAbilityExecutionHost: (
    state: GameState,
  ) => TriggerAbilityExecutionHost;
  installCardHost: (state: GameState) => InstallCardHost;
  rezCardHost: (state: GameState) => RezCardHost;
  traceOrchestrationHost: (state: GameState) => TraceOrchestrationHost;
  activatedCardImplementationExecutionHost: (
    state: GameState,
    legalAction: LegalAction,
  ) => {
    state: GameState;
    action: {
      legalAction: LegalAction;
    };
    callbacks: {
      handleCorpTraceDamageActivatedAbility: (
        actionToResolve: LegalAction,
      ) => boolean;
      handleScoredAgendaActivatedAbilityAction: (
        actionToResolve: LegalAction,
      ) => boolean;
      resolveActivatedCardImplementationAbility: (
        actionToResolve: LegalAction,
      ) => boolean;
    };
  };
  resolveRunnerTargetedEventImplementation: (
    state: GameState,
    definition: CardDefinition,
    legalAction: LegalAction,
  ) => boolean;
  resolvePostOnPlayGenericFollowups: (
    state: GameState,
    definition: CardDefinition,
    legalAction: LegalAction,
  ) => void;
  resolveRunnerGripHeapStackShuffleDrawEvent: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  shuffleGripTrashAndStackThenDrawForCardImplementation: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    drawCount: number,
    removePlayedCardFromGame: true,
  ) => {
    publicPayload: Record<string, string | number | boolean>;
  };
  startRunnerProgramTrashBeforeInstallChoice: (
    state: GameState,
    sourceCardId: CardInstanceId,
    legalAction: LegalAction,
  ) => void;
  resolveRunnerProgramTrashBeforeInstallChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
};
