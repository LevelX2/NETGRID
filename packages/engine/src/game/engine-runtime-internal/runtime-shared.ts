import type {
  CardDefinition,
  ChoiceRequest,
  CounterType,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
  ResolvedGameEffect,
  RestrictedActionFamily,
  ServerId,
  Side,
} from "@netgrid/shared";
import type { DamageSummary } from "../damage/damage-core";
import type { CorpZoneChoiceHandlerHost } from "../hidden-zone/corp-zone-choice-handlers";
import type { HiddenZoneArrangeChoiceHandlerHost } from "../hidden-zone/arrange-choice-handlers";
import type { HiddenZoneNonSearchChoiceHandlerHost } from "../hidden-zone/nonsearch-choice-handlers";
import type {
  HiddenZoneSearchActivationHandlerHost,
  HiddenZoneSearchChoiceHandlerHost,
} from "../hidden-zone/search-choice-handlers";
import type { PendingChoiceResolutionHost } from "../choices/pending-choice-resolution";
import type {
  CardRunnerEventLongtailImplementation,
  RunnerTraceCounterEffectImplementation,
} from "../../ability-engine/definition-types";

// Runtime dependencies are the concrete composition-root surface. Do not
// reintroduce string-index bags, proxy dispatch or generic member lookup here.
type RuntimePortGroups = import("./runtime-port-contracts").RuntimePortGroups;
type RuntimePortSurface = RuntimePortGroups["actionRuntimeHosts"] &
  RuntimePortGroups["cardRuntimeHosts"] &
  RuntimePortGroups["cardRuntimeResolvers"] &
  RuntimePortGroups["choiceHiddenZoneResolvers"] &
  RuntimePortGroups["choiceHiddenZoneRuntime"] &
  RuntimePortGroups["corpRuntimeResolvers"] &
  RuntimePortGroups["flowRuntimeHosts"] &
  RuntimePortGroups["lifecycleRuntime"] &
  RuntimePortGroups["stateCorpRuntimeResolvers"] &
  RuntimePortGroups["stateRuntimeResolvers"] &
  RuntimePortGroups["stateRuntimeServices"] &
  RuntimePortGroups["turnCorpRuntime"] &
  RuntimePortGroups["turnRuntimeResolvers"];

export type RuntimeDeps = ReturnType<
  (typeof import("./state-runtime-bootstrap"))["initializeStateRuntimeBootstrap"]
> &
  RuntimePortSurface & {
    turnCorpRuntime: RuntimePortGroups["turnCorpRuntime"];
  };
export type {
  GameState,
  LegalAction,
  PlayerAction,
  ChoiceRequest,
  Side,
  CardDefinition,
};
export type CardDefinitionId = string;
export type CardInstanceId = string;
export type {
  CorpServer,
  CounterType,
  DamageSummary,
  ResolvedGameEffect,
  RestrictedActionFamily,
  ServerId,
};
export type {
  PendingChoiceResolutionHost,
  HiddenZoneSearchActivationHandlerHost,
  HiddenZoneSearchChoiceHandlerHost,
  HiddenZoneArrangeChoiceHandlerHost,
  HiddenZoneNonSearchChoiceHandlerHost,
  CorpZoneChoiceHandlerHost,
  CardRunnerEventLongtailImplementation,
};

export type ActiveRun = NonNullable<GameState["run"]>;
export type DrawTaxDecision = "auto" | "pay" | "tag" | "none";
export type RunnerDrawSummary = {
  drawnCount: number;
  drawnCardIds?: CardInstanceId[];
  drawTaxSourceCount: number;
  drawTaxCreditsPaid: number;
  drawTaxTagsAdded: number;
  crashEverettSourceCardId?: CardInstanceId;
  crashEverettChoiceOpened?: boolean;
};
export type RunnerEventActionPayload = NonNullable<LegalAction["payload"]>;
export type RunnerEventResolver = {
  name: string;
  startsRun?: boolean;
  requiresServer?: boolean;
  canPlay?: (state: GameState) => boolean;
  canPlayForServer?: (state: GameState, serverId: ServerId) => boolean;
  actionPayload?: (input: {
    state: GameState;
    cardId: CardInstanceId;
    definition: CardDefinition;
  }) => RunnerEventActionPayload;
  legalActions?: (input: {
    state: GameState;
    cardId: CardInstanceId;
    definition: CardDefinition;
    buildAction: (...args: any[]) => LegalAction;
    clickCost: number;
    creditCost: number;
  }) => LegalAction[];
  resolve: (state: GameState, legalAction: LegalAction) => void;
};
export type BreakSubroutineCostBreakdown = {
  baseCost: number;
  legacyRunAdditionalCost: number;
  runnerHardwareAdditionalCost: number;
  cardImplementationAdditionalCost: number;
  additionalCost: number;
  totalCost: number;
  publicPayload: NonNullable<LegalAction["payload"]>;
};
export type CorpAgendaPointCostResult = {
  paidPoints: number;
  bonusPointsSpent: number;
  spentAgendaIds: CardInstanceId[];
  spentAgendaDefinitionIds: CardDefinitionId[];
};
export type RunnerTraceCounterEffectRuntime =
  RunnerTraceCounterEffectImplementation & {
    sourceDefinitionId: CardDefinitionId;
  };
export type VisibleCounterPayload = {
  counterType: CounterType;
  addedCounterAmount?: number;
  removedCounterAmount?: number;
  remainingCounters: number;
};
export type VirusCounterPurgePreserveTarget =
  | {
      kind: "card";
      cardId: CardInstanceId;
      counterType: Extract<CounterType, "virus" | "pattel">;
      index: number;
    }
  | {
      kind: "pox";
      serverId: Exclude<ServerId, "new_remote">;
      index: number;
    };
export type AutomaticEffectCollector = ResolvedGameEffect[];
