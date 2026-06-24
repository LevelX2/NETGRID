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
import type { CardRunnerEventLongtailImplementation } from "../../ability-engine/definition-types";

// Runtime dependencies are the concrete composition-root surface. Do not
// reintroduce string-index bags, proxy dispatch or generic member lookup here.
export type RuntimeDeps = ReturnType<
  typeof import("./state-runtime-bootstrap")["initializeStateRuntimeBootstrap"]
> & {
  turnCorpRuntime?: ReturnType<
    typeof import("./turn-corp-runtime")["createTurnCorpRuntime"]
  >;
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
export type { CorpServer, CounterType, DamageSummary, ResolvedGameEffect, RestrictedActionFamily, ServerId };
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
export type DrawTaxDecision = "auto" | "pay" | "tag";
export type RunnerDrawSummary = {
  drawnCount: number;
  drawnCardIds?: CardInstanceId[];
  drawTaxSourceCount: number;
  drawTaxCreditsPaid: number;
  drawTaxTagsAdded: number;
  crashEverettSourceCardId?: CardInstanceId;
  crashEverettChoiceOpened?: boolean;
};
export type RunnerEventResolver = {
  name: string;
  requiresServer?: boolean;
  canPlay?: (state: GameState) => boolean;
  canPlayForServer?: (state: GameState, serverId: ServerId) => boolean;
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
  forfeitedAgendaIds: CardInstanceId[];
  forfeitedAgendaDefinitionIds: CardDefinitionId[];
};
export type RunnerTraceCounterEffectRuntime = {
  counterType: CounterType;
  sourceDefinitionId: CardDefinitionId;
  amount?: number;
  runStart?: {
    amountPerCounter: number;
    damageType: "brain" | "net";
  };
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
      index: number;
    }
  | {
      kind: "pox";
      serverId: Exclude<ServerId, "new_remote">;
      index: number;
    };
export type AutomaticEffectCollector = ResolvedGameEffect[];
