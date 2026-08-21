/** Declarative typed port implemented by damage-trace-runtime-hosts.ts. */
import type {
  CardDefinitionId,
  CardInstanceId,
  CounterType,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import type {
  CardRemainingReplacementLongtailImplementation,
  CardRunnerUtilityLongtailImplementation,
  CardUniqueDirectLongtailImplementation,
} from "../../ability-engine/definition-types";
import type { RunnerTraceCounterEffectRuntime } from "./runtime-shared";

export type DamageTraceRuntimePort = {
  runnerTraceCounterEffectDefinitions: () => RunnerTraceCounterEffectRuntime[];
  runnerCounterDisplayName: (counterType: CounterType) => string;
  traceCounterEffectDefinitionFor: (
    counterType: unknown,
  ) => RunnerTraceCounterEffectRuntime | undefined;
  runnerUtilityLongtailKindForDefinition: (
    definitionId: CardDefinitionId,
  ) => CardRunnerUtilityLongtailImplementation["kind"] | undefined;
  runnerUtilityLongtailKindForCard: (
    state: GameState,
    cardId: CardInstanceId,
  ) => CardRunnerUtilityLongtailImplementation["kind"] | undefined;
  runnerUtilityLongtailImplementationForCard: (
    state: GameState,
    cardId: CardInstanceId,
  ) => CardRunnerUtilityLongtailImplementation | undefined;
  uniqueDirectLongtailImplementationForDefinition: (
    definitionId: CardDefinitionId,
  ) => CardUniqueDirectLongtailImplementation | undefined;
  uniqueDirectLongtailKindForDefinition: (
    definitionId: CardDefinitionId,
  ) => CardUniqueDirectLongtailImplementation["kind"] | undefined;
  uniqueDirectLongtailImplementationForCard: (
    state: GameState,
    cardId: CardInstanceId,
  ) => CardUniqueDirectLongtailImplementation | undefined;
  uniqueDirectLongtailKindForCard: (
    state: GameState,
    cardId: CardInstanceId,
  ) => CardUniqueDirectLongtailImplementation["kind"] | undefined;
  remainingReplacementLongtailImplementationForDefinition: (
    definitionId: CardDefinitionId,
  ) => CardRemainingReplacementLongtailImplementation | undefined;
  remainingReplacementLongtailKindForDefinition: (
    definitionId: CardDefinitionId,
  ) => CardRemainingReplacementLongtailImplementation["kind"] | undefined;
  remainingReplacementLongtailImplementationForCard: (
    state: GameState,
    cardId: CardInstanceId,
  ) => CardRemainingReplacementLongtailImplementation | undefined;
  remainingReplacementLongtailKindForCard: (
    state: GameState,
    cardId: CardInstanceId,
  ) => CardRemainingReplacementLongtailImplementation["kind"] | undefined;
  isObligationDebtDefinition: (definitionId: CardDefinitionId) => boolean;
  isDrawTaxSourceDefinition: (
    state: GameState,
    cardId: CardInstanceId,
  ) => boolean;
  isCorpInstalledEconomyCreditSource: (
    state: GameState,
    cardId: CardInstanceId,
  ) => boolean;
  isCorpTraceCounterPoolSource: (
    state: GameState,
    cardId: CardInstanceId,
  ) => boolean;
  applyRunnerTraceCounterRunStartEffects: (
    state: GameState,
    legalAction?: LegalAction,
  ) => boolean;
  resumeRunnerTraceCounterRunStartEffects: (
    state: GameState,
    legalAction: LegalAction,
  ) => boolean;
  corpTraceCounterPoolSourceIds: (state: GameState) => CardInstanceId[];
  corpTraceCounterPoolCounterType: (
    state: GameState,
    cardId: CardInstanceId,
  ) => "bit" | "power";
  corpTraceCounterPoolTotal: (state: GameState) => number;
  spendCorpTraceCounterPoolCounters: (
    state: GameState,
    amount: number,
  ) => number;
  addCorpTraceCounterPoolCounters: (state: GameState) => number;
  rabbitTraceLimitReductionForIceTrace: (state: GameState) => number;
};
