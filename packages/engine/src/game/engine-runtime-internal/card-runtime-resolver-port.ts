import type { RandomHqDiscardContext } from "@netgrid/shared";
/** Declarative typed port for the cardRuntimeResolvers composition group. */
import type {
  CardHiddenReplacementLongtailImplementation,
  CardRunnerEventLongtailImplementation,
  CardScoredAgendaImplementation,
  CardVariableRezImplementation,
  MakeRunEffectImplementation,
} from "../../ability-engine/definition-types";
import type { DamageSummary } from "../damage/damage-core";
import type { RunnerDrawSummary } from "./runtime-shared";
import type { RunnerEventResolver } from "../play/runner-event-contract";
import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";

export type CardRuntimeResolverPort = {
  openPostMeatDamageReactionWindow: (
    state: GameState,
    summary: DamageSummary,
  ) => boolean;
  postMeatDamageHiddenResourceCandidates: (state: GameState) => Array<{
    cardId: CardInstanceId;
    definitionId: CardDefinitionId;
    title: string;
    amount: number;
  }>;
  resolvePostMeatDamageHiddenResourceChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  randomCorpHqDiscard: (
    state: GameState,
    amount: number,
    purposePrefix: RandomHqDiscardContext,
  ) => CardInstanceId[];
  installTargetBindingForDefinition: (
    definition: CardDefinition,
  ) =>
    | import("@netgrid/cards/engine").CardInstallTargetBindingImplementation
    | undefined;
  requiresDataFortInstallTarget: (definition: CardDefinition) => boolean;
  runnerEventLongtailForDefinition: (
    definition: CardDefinition,
  ) => CardRunnerEventLongtailImplementation | undefined;
  variableRezForDefinition: (
    definition: CardDefinition,
  ) => CardVariableRezImplementation | undefined;
  runnerEventLongtailKindForDefinition: (
    definition: CardDefinition,
  ) => CardRunnerEventLongtailImplementation["kind"] | undefined;
  hiddenReplacementLongtailForDefinition: (
    definition: CardDefinition,
  ) => CardHiddenReplacementLongtailImplementation | undefined;
  cardImplementationRunnerEventResolver: (
    definition: CardDefinition,
  ) => RunnerEventResolver | undefined;
  printedCostCardImplementationMakeRunEffect: (
    definition: CardDefinition,
  ) => MakeRunEffectImplementation | undefined;
  scoredAgendaImplementationForDefinitionId: (
    definitionId: CardDefinitionId,
  ) => CardScoredAgendaImplementation | undefined;
  scoredAgendaImplementationForDefinition: (
    definition: CardDefinition,
  ) => CardScoredAgendaImplementation | undefined;
  scoredAgendaKindForDefinition: (
    definition: CardDefinition,
  ) => CardScoredAgendaImplementation["kind"] | undefined;
  emptyRunnerDrawSummary: () => RunnerDrawSummary;
  mergeRunnerDrawSummary: (
    left: RunnerDrawSummary,
    right: RunnerDrawSummary,
  ) => RunnerDrawSummary;
  applyRunnerDrawSummaryPayload: (
    state: GameState,
    legalAction: LegalAction,
    summary: RunnerDrawSummary,
  ) => void;
  runnerDrawSummaryPublicPayload: (
    state: GameState,
    summary: RunnerDrawSummary,
  ) => Record<string, string | number | boolean>;
};
