import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CounterType,
  DamageType,
  GameState,
  LegalAction,
  ResolvedGameEffect,
} from "@netgrid/shared";
import type {
  CardAccessEffectImplementation,
  CardAccessZone,
  CardHiddenReplacementLongtailImplementation,
  CardTraceSuccessEffectImplementation,
} from "../../ability-engine/definition-types";

export type DamageSummary = {
  damageType: DamageType;
  amount: number;
  cardsTrashed: number;
  flatline: boolean;
  coreDamageAfter?: number;
  runnerMaxHandSizeAfter?: number;
};

export type AccessPayload = Record<string, string | number | boolean>;

export type AccessEffectDefinitionIds = {
  setup: CardDefinitionId;
  trap: CardDefinitionId;
  crybaby: CardDefinitionId;
  taggedRunnerMeatDamageUpgrade: CardDefinitionId;
  accessNetDamageUpgrade: CardDefinitionId;
  oncePerRunAccessTraceUpgrade: CardDefinitionId;
  hardwareTrashByAdvancementAsset: CardDefinitionId;
  programTrashByAdvancementAsset: CardDefinitionId;
  advancementCoreDamageAsset: CardDefinitionId;
};

export type AccessEffectHandlerHost = {
  state: GameState;
  legalAction?: LegalAction;
  definitions: AccessEffectDefinitionIds;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    mustInstance: (cardId: CardInstanceId) => CardInstance;
    cardHasSubtype: (definition: CardDefinition, subtype: string) => boolean;
    accessEffectsForDefinition: (
      definitionId: CardDefinitionId,
    ) => readonly CardAccessEffectImplementation[];
    hiddenReplacementLongtailKindForDefinition: (
      definitionId: CardDefinitionId,
    ) => CardHiddenReplacementLongtailImplementation["kind"] | undefined;
  };
  damage: {
    resolveDamageOperation: (
      damageType: DamageType,
      amount: number,
      sourceDefinitionId: CardDefinitionId,
    ) => void;
    doDamage: (
      damageId: string,
      damageType: DamageType,
      amount: number,
      sourceDefinitionId: CardDefinitionId,
    ) => DamageSummary;
    setDamagePayload: (summary: DamageSummary) => void;
  };
  tags: {
    addRunnerTagsWithPrevention: (
      amount: number,
      sourceDefinitionId: CardDefinitionId,
    ) => boolean;
  };
  trace: {
    startTraceFromOperation: (
      sourceDefinitionId: CardDefinitionId,
      traceLimit: number,
      successEffect?: unknown,
    ) => void;
    traceSuccessEffectForCardImplementation: (
      effects: readonly CardTraceSuccessEffectImplementation[],
    ) => unknown;
  };
  counters: {
    cardCounter: (cardId: CardInstanceId, counterType: string) => number;
    addCardCounter: (
      cardId: CardInstanceId,
      counterType: string,
      amount: number,
    ) => void;
    addCounterToAllInstalledRunnerIcebreakers: (
      counterType: CounterType,
      amount: number,
    ) => {
      amount: number;
      counterType: CounterType;
      countersAfter: number;
      publicPayload: Record<string, string | number | boolean>;
    };
  };
  corpCards: {
    shuffleCorpCardIntoRd: (
      cardId: CardInstanceId,
      sourceDefinitionId: CardDefinitionId,
    ) => { publicPayload: Record<string, string | number | boolean> };
  };
  runnerCards: {
    returnInstalledProgramsToGrip: (cardIds: readonly CardInstanceId[]) => {
      publicPayload: Record<string, string | number | boolean>;
    };
  };
  payment: {
    spendCorpCredits: (amount: number) => void;
  };
  trash: {
    trashRunnerInstalledCardToHeap: (cardId: CardInstanceId) => void;
    trashCorpInstalledCardToArchives: (cardId: CardInstanceId) => void;
    openRunnerInstalledTrashPreventionWindow: (
      targetIds: CardInstanceId[],
      sourceDefinitionId: CardDefinitionId,
    ) => boolean;
    startRunnerInstalledMultiTrashChoice: (
      sourceCardId: CardInstanceId,
      input: {
        effectKind:
          | "access_hardware_trash_by_advancement"
          | "access_program_trash_by_advancement";
        targetCardType: "hardware" | "program";
        minimumTargets: number;
        maximumTargets: number;
        selectionOrdering: "ordered";
      },
      eligibleCardIds: CardInstanceId[],
    ) => void;
  };
};

export type AccessEffectHandlerResult = {
  handled: boolean;
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  accessedCardId?: CardInstanceId;
  accessZone?: CardAccessZone;
  deletePendingChoice?: boolean;
  damageType?: DamageType;
  damageAmount?: number;
  traceStarted?: boolean;
  paidCredits?: number;
  resolvedPayload?: AccessPayload;
  resolvedEffects?: ResolvedGameEffect[];
  stateChanged?: boolean;
};

export type AccessPaymentChoiceResult = AccessEffectHandlerResult & {
  deletePendingChoice?: boolean;
};

export function requireLegalAction(host: AccessEffectHandlerHost): LegalAction {
  if (!host.legalAction) throw new Error("LegalAction fehlt.");
  return host.legalAction;
}

export function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}
