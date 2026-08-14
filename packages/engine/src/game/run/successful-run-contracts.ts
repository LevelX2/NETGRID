import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import type {
  CardSuccessfulRunFollowupImplementation,
  CardRunnerUtilityLongtailImplementation,
  CardUniqueDirectLongtailImplementation,
} from "../../ability-engine/definition-types";
import {
  cardImplementationPrimitivePayload,
  type SuccessfulRunBeforeAccessEffect,
} from "../../ability-engine/card-implementation-primitives";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { hiddenRunnerResourceRevealPayload } from "../damage/damage-core";
import type { SuccessfulRunInterventionKind } from "./run-access-transition";

export type ActiveRun = NonNullable<GameState["run"]>;

export type SuccessfulRunInterventionHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
  };
  servers: {
    mustServer: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => GameState["corp"]["servers"][number];
    publicServerLabel: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => string | undefined;
  };
  actions: {
    createRunnerTriggerAction: (
      label: string,
      sourceCardId: CardInstanceId,
      costs: LegalAction["costs"],
      payload: NonNullable<LegalAction["payload"]>,
    ) => LegalAction;
  };
  choices: {
    selectedChoiceIds: (
      selectedChoices: PlayerAction["selectedChoices"],
    ) => string[];
  };
  costs: {
    creditCostForAction: (legalAction: LegalAction) => number;
    printedRezCostForCard: (cardId: CardInstanceId) => number;
    corpIceInstallTotalCost: (
      cardId: CardInstanceId,
      server: GameState["corp"]["servers"][number],
    ) => { totalCost: number };
  };
  install: {
    finalizeCorpIceInstallInnermost: (
      cardId: CardInstanceId,
      server: GameState["corp"]["servers"][number],
      legalAction: LegalAction,
    ) => void;
  };
  credits: {
    spend: (side: "corp" | "runner", amount: number) => void;
    gainRunner: (amount: number) => void;
  };
  rez: {
    canonicalPaidActionsForIce: (cardId: CardInstanceId) => LegalAction[];
    executeCanonicalPaidRezWithoutRunContinuation: (
      cardId: CardInstanceId,
      legalAction: LegalAction,
    ) => void;
  };
  counters: {
    cardCounter: (cardId: CardInstanceId, type: string) => number;
    addCardCounter: (
      cardId: CardInstanceId,
      type: string,
      amount: number,
    ) => void;
  };
  runnerCards: {
    shuffleGripIntoStack: (purpose: string) => number;
    drawCards: (amount: number) => {
      drawnCount: number;
      drawTaxSourceCount: number;
      drawTaxCreditsPaid: number;
      drawTaxTagsAdded: number;
    };
  };
  runner: {
    ensureTurnFlags: () => NonNullable<GameState["runnerTurnFlags"]>;
  };
  zones: {
    removeFromAllZones: (cardId: CardInstanceId) => void;
    trashCorpInstalledCardToArchives: (
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
    trashRunnerInstalledCardToHeap: (
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
  };
  encounter: {
    beginEncounter: (iceId: CardInstanceId, legalAction?: LegalAction) => void;
    approachOrEncounterIce: (
      iceId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
  };
  access: {
    startAccessFromSuccessfulRun: (legalAction?: LegalAction) => void;
    finishSuccessfulRun: (legalAction?: LegalAction) => void;
  };
};

export type SuccessfulRunInterventionExecutionResult = {
  handled: boolean;
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  serverId?: Exclude<ServerId, "new_remote">;
  selectedHqCardId?: CardInstanceId;
  temporaryEncounterIceId?: CardInstanceId;
  installedIceId?: CardInstanceId;
  installCost?: number;
  rezCostPaid?: number;
  approachStarted?: boolean;
  encounterStarted?: boolean;
  successFinalizationDelayed?: boolean;
  successFinalized?: boolean;
  accessShouldStart?: boolean;
  stateChanged?: boolean;
  resolvedPayload?: NonNullable<LegalAction["payload"]>;
};

export type SuccessfulRunFollowupExecutionResult = {
  handled: boolean;
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  serverId?: Exclude<ServerId, "new_remote">;
  creditsGained?: number;
  counterPlaced?: boolean;
  stateChanged?: boolean;
  resolvedPayload?: NonNullable<LegalAction["payload"]>;
};
