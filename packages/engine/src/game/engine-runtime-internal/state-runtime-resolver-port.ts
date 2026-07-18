/** Declarative typed port for the StateRuntimeResolverPort composition boundary. */
import type { RunnerInstallCreditSpendResult } from "../install/runner-program-install-payment";
import type {
  AutomaticEffectCollector,
  VirusCounterPurgePreserveTarget,
  VisibleCounterPayload,
} from "./runtime-shared";
import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CounterType,
  EffectCommand,
  GameState,
  LegalAction,
  ModifierKind,
  PlayerAction,
  Side,
} from "@netgrid/shared";

export type StateRuntimeResolverPort = {
  resolveTraceHardwareWreckerSuccess: (
    state: GameState,
    sourceDefinitionId: CardDefinitionId,
    sourceCardInstanceId: CardInstanceId,
    traceId: string,
  ) => NonNullable<LegalAction["payload"]>;
  resolveTraceTrashRunnerResourceSuccess: (
    state: GameState,
    sourceDefinitionId: CardDefinitionId,
    sourceCardInstanceId: CardInstanceId,
    traceId: string,
    targetCardId: CardInstanceId | undefined,
  ) => NonNullable<LegalAction["payload"]>;
  encounterTemporaryTraceCreditsAvailable: (
    state: GameState,
    trace: NonNullable<GameState["trace"]>,
  ) => number;
  spendEncounterTemporaryTraceCredits: (
    state: GameState,
    trace: NonNullable<GameState["trace"]>,
    amount: number,
  ) => number;
  identityModifierAmount: (
    state: GameState,
    side: Side,
    kind: ModifierKind,
    duration: "setup" | "static",
  ) => number;
  identityDefinition: (state: GameState, side: Side) => CardDefinition;
  executeEffectCommands: (state: GameState, commands: EffectCommand[]) => void;
  assertNonNegativeAmount: (amount: number) => void;
  assertPositiveIntegerAmount: (amount: number) => void;
  withoutVariableIceState: (instance: CardInstance) => CardInstance;
  clickCostForAction: (legalAction: LegalAction) => number;
  creditCostForAction: (legalAction: LegalAction) => number;
  runnerActionsPerTurn: (state: GameState) => number;
  agendaPoints: (state: GameState, side: Side) => number;
  addVirusCounterWithCounterPrevention: (
    state: GameState,
    targetCardId: CardInstanceId,
    amount: number,
    legalAction?: LegalAction,
  ) => number;
  preventOneVirusCounterWithCounterPrevention: (state: GameState) => {
    prevented: boolean;
    creditsPaid: number;
    preventionChargesSpent: number;
  };
  addVisibleCardCounter: (
    state: GameState,
    cardId: CardInstanceId,
    counterType: CounterType,
    amount: number,
  ) => VisibleCounterPayload;
  spendVisibleCardCounter: (
    state: GameState,
    cardId: CardInstanceId,
    counterType: CounterType,
    amount: number,
  ) => VisibleCounterPayload;
  totalCounters: (state: GameState, counterType: CounterType) => number;
  installedVirusCounterPurgePreserveSourceIds: (
    state: GameState,
  ) => CardInstanceId[];
  virusCounterPurgePreserveTargets: (state: GameState) => Array<
    VirusCounterPurgePreserveTarget & {
      optionId: string;
      publicLabel: string;
    }
  >;
  startVirusCounterPurgePreserveChoice: (
    state: GameState,
    legalAction: LegalAction,
  ) => boolean;
  parseVirusCounterPurgePreserveOption: (
    optionId: string,
  ) => VirusCounterPurgePreserveTarget | undefined;
  restorePurgePreservedVirusCounters: (
    state: GameState,
    selectedOptionIds: string[],
  ) => {
    preserved: number;
    preservedCardDefinitionIds: CardDefinitionId[];
  };
  resolveVirusCounterPurgePreserveChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  installedProgramTrashBackupHardwareIds: (
    state: GameState,
  ) => CardInstanceId[];
  availableRunnerProgramInstallCredits: (state: GameState) => number;
  runnerCanPayInstallCost: (
    state: GameState,
    amount: number,
    cardType: CardDefinition["type"],
  ) => boolean;
  runnerCostPenaltySupportCreditCapacity: (state: GameState) => number;
  openRunnerCostPenaltySupportWindow: (
    state: GameState,
    legalAction: LegalAction,
    amount: number,
    cardType: CardDefinition["type"],
  ) => boolean;
  closeRunnerCostPenaltySupportWindowForPayment: (
    state: GameState,
    legalAction: LegalAction,
    amount: number,
  ) => void;
  runnerRecurringCredits: (state: GameState) => number;
  runnerProgramInstallRecurringCreditSourceIds: (
    state: GameState,
  ) => CardInstanceId[];
  spendRunnerInstallCredits: (
    state: GameState,
    amount: number,
    cardType: CardDefinition["type"],
    paymentPayload?: LegalAction["payload"],
  ) => RunnerInstallCreditSpendResult;
  runnerTagRemovalRecurringCreditSourceIds: (
    state: GameState,
  ) => CardInstanceId[];
  runnerTagRemovalRecurringCredits: (state: GameState) => number;
  availableRunnerTagRemovalCredits: (state: GameState) => number;
  spendRunnerTagRemovalCredits: (
    state: GameState,
    amount: number,
    legalAction: LegalAction,
  ) => void;
  refreshRecurringCredits: (
    state: GameState,
    side: Side,
    effects?: AutomaticEffectCollector,
  ) => void;
};
