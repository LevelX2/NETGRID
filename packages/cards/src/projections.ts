import type { CardDefinitionId, CardType, Side } from "@netgrid/shared";
import type { CardSpec, PrintingId, SetId, SetSpec } from "./contracts";
import type {
  CanonicalCapabilityId,
  CapabilityKey,
} from "./capability-identity";
import type { CardMechanicalSpec } from "./engine/card-mechanical-contracts";
import type {
  CardRegistryFingerprints,
  CardSectionFingerprints,
} from "./fingerprints";
import type { CardPlanningAnnotations } from "./planning-annotations";
import { deepFreezeSerializable, type DeepReadonly } from "./serializable";

export type PublicCardView = {
  schemaVersion: "public-card-view-v1";
  cardDefinitionId: CardDefinitionId;
  title: string;
  side: Side;
  cardType: CardType;
  faction: string;
  subtypes: readonly string[];
  numeric: CardMechanicalSpec["characteristics"]["numeric"];
  playCost: CardMechanicalSpec["characteristics"]["playCost"];
  strength: CardMechanicalSpec["characteristics"]["strength"];
  baseLink?: number;
  memoryLimitBonus?: number;
  maxHandSizeBonus?: number;
  recurringCredits?: number;
  rulesText: string;
  flavorText?: string;
  reminderText?: string;
  markCounterDisplay?: {
    id: string;
    label: string;
    ariaLabelName: string;
  };
  capabilityText?: readonly {
    capabilityKey: CapabilityKey;
    actionLabel: string;
  }[];
  printings: readonly PublicPrintingView[];
  textFingerprint: string;
  printingFingerprint: string;
};

export type PublicPrintingView = {
  printingId: PrintingId;
  setId: SetId;
  collectorNumber?: string;
  rarity?: string;
  variant?: string;
  faceTextOverride?: string;
};

export type PublicSetView = {
  schemaVersion: "public-set-view-v1";
  setId: SetId;
  name: string;
  code?: string;
  sortOrder: number;
};

export type EngineCardView = {
  schemaVersion: "engine-card-view-v1";
  cardDefinitionId: CardDefinitionId;
  side: Side;
  cardType: CardType;
  engine: DeepReadonly<CardMechanicalSpec>;
  cardRulesFingerprint: string;
};

export type PlanningCardView = {
  schemaVersion: "planning-card-view-v1";
  cardDefinitionId: CardDefinitionId;
  side: Side;
  cardType: CardType;
  engine: DeepReadonly<CardMechanicalSpec>;
  planningAnnotations?: DeepReadonly<CardPlanningAnnotations>;
  cardRulesFingerprint: string;
  planningAnnotationsFingerprint: string;
};

export type EditorCardView = {
  schemaVersion: "editor-card-view-v1";
  validationStatus: "valid";
  spec: DeepReadonly<CardSpec>;
  fingerprints: DeepReadonly<CardSectionFingerprints>;
};

export type EngineCapabilityView = {
  schemaVersion: "engine-capability-view-v1";
  canonicalCapabilityId: CanonicalCapabilityId;
  cardDefinitionId: CardDefinitionId;
  capabilityKey: CapabilityKey;
  capability: DeepReadonly<Record<string, unknown>>;
};

export type RegistryEditorSummary = {
  schemaVersion: "registry-editor-summary-v1";
  definitionCount: number;
  printingCount: number;
  setCount: number;
  capabilityCount: number;
  fingerprints: DeepReadonly<CardRegistryFingerprints>;
};

export function projectPublicCard(
  spec: DeepReadonly<CardSpec>,
  fingerprints: DeepReadonly<CardSectionFingerprints>,
  publicSetIds?: ReadonlySet<SetId>,
): DeepReadonly<PublicCardView> {
  const characteristics = spec.engine.characteristics;
  return deepFreezeSerializable({
    schemaVersion: "public-card-view-v1",
    cardDefinitionId: spec.identity.cardDefinitionId,
    title: spec.identity.title,
    side: spec.identity.side,
    cardType: spec.identity.cardType,
    faction: characteristics.faction,
    subtypes: [...characteristics.subtypes],
    numeric: { ...characteristics.numeric },
    playCost: cloneJson(characteristics.playCost),
    strength: cloneJson(characteristics.strength),
    ...(characteristics.baseLink !== undefined
      ? { baseLink: characteristics.baseLink }
      : {}),
    ...(characteristics.memoryLimitBonus !== undefined
      ? { memoryLimitBonus: characteristics.memoryLimitBonus }
      : {}),
    ...(characteristics.maxHandSizeBonus !== undefined
      ? { maxHandSizeBonus: characteristics.maxHandSizeBonus }
      : {}),
    ...(characteristics.recurringCredits !== undefined
      ? { recurringCredits: characteristics.recurringCredits }
      : {}),
    rulesText: spec.text.rulesText,
    ...(spec.text.flavorText !== undefined
      ? { flavorText: spec.text.flavorText }
      : {}),
    ...(spec.text.reminderText !== undefined
      ? { reminderText: spec.text.reminderText }
      : {}),
    ...(spec.text.markCounterDisplay !== undefined
      ? { markCounterDisplay: { ...spec.text.markCounterDisplay } }
      : {}),
    ...(spec.text.capabilityText !== undefined
      ? {
          capabilityText: spec.text.capabilityText.map((entry) => ({
            ...entry,
          })),
        }
      : {}),
    printings: [...spec.printings]
      .filter(
        (printing) =>
          publicSetIds === undefined || publicSetIds.has(printing.setId),
      )
      .sort((left, right) =>
        left.printingId < right.printingId
          ? -1
          : left.printingId > right.printingId
            ? 1
            : 0,
      )
      .map((printing) => ({
        printingId: printing.printingId,
        setId: printing.setId,
        ...(printing.collectorNumber !== undefined
          ? { collectorNumber: printing.collectorNumber }
          : {}),
        ...(printing.rarity !== undefined ? { rarity: printing.rarity } : {}),
        ...(printing.variant !== undefined
          ? { variant: printing.variant }
          : {}),
        ...(printing.faceTextOverride !== undefined
          ? { faceTextOverride: printing.faceTextOverride }
          : {}),
      })),
    textFingerprint: fingerprints.textFingerprint,
    printingFingerprint: fingerprints.printingFingerprint,
  });
}

export function projectPublicSet(
  set: DeepReadonly<SetSpec>,
): DeepReadonly<PublicSetView> {
  return deepFreezeSerializable({
    schemaVersion: "public-set-view-v1",
    setId: set.setId,
    name: set.name,
    ...(set.code !== undefined ? { code: set.code } : {}),
    sortOrder: set.sortOrder,
  });
}

export function projectEngineCard(
  spec: DeepReadonly<CardSpec>,
  fingerprints: DeepReadonly<CardSectionFingerprints>,
): DeepReadonly<EngineCardView> {
  return deepFreezeSerializable({
    schemaVersion: "engine-card-view-v1",
    cardDefinitionId: spec.identity.cardDefinitionId,
    side: spec.identity.side,
    cardType: spec.identity.cardType,
    engine: spec.engine,
    cardRulesFingerprint: fingerprints.cardRulesFingerprint,
  });
}

export function projectPlanningCard(
  spec: DeepReadonly<CardSpec>,
  fingerprints: DeepReadonly<CardSectionFingerprints>,
): DeepReadonly<PlanningCardView> {
  return deepFreezeSerializable({
    schemaVersion: "planning-card-view-v1",
    cardDefinitionId: spec.identity.cardDefinitionId,
    side: spec.identity.side,
    cardType: spec.identity.cardType,
    engine: spec.engine,
    ...(spec.planningAnnotations !== undefined
      ? { planningAnnotations: spec.planningAnnotations }
      : {}),
    cardRulesFingerprint: fingerprints.cardRulesFingerprint,
    planningAnnotationsFingerprint: fingerprints.planningAnnotationsFingerprint,
  });
}

export function projectEditorCard(
  spec: DeepReadonly<CardSpec>,
  fingerprints: DeepReadonly<CardSectionFingerprints>,
): DeepReadonly<EditorCardView> {
  return deepFreezeSerializable({
    schemaVersion: "editor-card-view-v1",
    validationStatus: "valid",
    spec,
    fingerprints,
  });
}

function cloneJson<Value>(value: Value): DeepReadonly<Value> {
  if (value === null || typeof value !== "object")
    return value as DeepReadonly<Value>;
  if (Array.isArray(value))
    return value.map((entry) => cloneJson(entry)) as DeepReadonly<Value>;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, cloneJson(entry)]),
  ) as DeepReadonly<Value>;
}
