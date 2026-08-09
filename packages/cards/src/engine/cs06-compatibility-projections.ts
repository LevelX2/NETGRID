import type {
  CardDefinitionId,
  ResolvedCardDefinition,
  SubroutineDefinition,
} from "@netgrid/shared";
import type {
  CardMechanicalDefinition,
  CardMechanicalSpec,
} from "./card-mechanical-contracts";
import type { CardSpec } from "../contracts";
import type { EngineCardView } from "../projections";
import { deepFreezeSerializable, type DeepReadonly } from "../serializable";

export type Cs06CardImplementation = {
  cardDefinitionId: CardDefinitionId;
} & Pick<
  CardMechanicalDefinition,
  | "abilities"
  | "accessEffects"
  | "advanceable"
  | "fortRunWindows"
  | "icebreakerAbilities"
  | "icebreakerEncounterStrengthBonus"
  | "icebreakerSubtypeChange"
  | "installCapabilities"
  | "installTargetBinding"
  | "lifecycle"
  | "modifiers"
  | "scoredAgenda"
  | "variableRez"
>;
type Cs06CardImplementationFamilies = Omit<
  Cs06CardImplementation,
  "cardDefinitionId"
>;

/**
 * CS06 bridge for consumers that still require the pre-CardSpec definition
 * shape. Every field is derived from one registry projection pair; this is
 * not an authoring surface. Remove with the legacy CardDefinition consumers
 * in CS11.
 */
export function projectCs06CardDefinition(
  engineView: DeepReadonly<EngineCardView>,
  spec: DeepReadonly<CardSpec>,
): ResolvedCardDefinition {
  if (engineView.cardDefinitionId !== spec.identity.cardDefinitionId)
    throw new Error("cs06_projection_definition_mismatch");
  const characteristics = engineView.engine.characteristics;
  const numeric = characteristics.numeric;
  const strength = characteristics.strength;
  const subroutines = projectPrintedSubroutines(engineView.engine);
  return deepFreezeSerializable({
    id: spec.identity.cardDefinitionId,
    title: spec.identity.title,
    side: spec.identity.side,
    type: spec.identity.cardType,
    subtypes: [...characteristics.subtypes],
    implementationStatus: "playable_mvp",
    ...(spec.identity.cardType === "event" ||
    spec.identity.cardType === "operation"
      ? {
          playCost: characteristics.playCost,
          ...(characteristics.playCost?.kind === "fixed"
            ? { cost: characteristics.playCost.credits }
            : {}),
        }
      : { playCost: null }),
    ...(numeric.installCost !== null
      ? { installCost: numeric.installCost }
      : {}),
    ...(numeric.memoryCost !== null ? { memoryCost: numeric.memoryCost } : {}),
    ...(numeric.rezCost !== null ? { rezCost: numeric.rezCost } : {}),
    ...(numeric.trashCost !== null ? { trashCost: numeric.trashCost } : {}),
    ...(numeric.advancementRequirement !== null
      ? { advancementRequirement: numeric.advancementRequirement }
      : {}),
    ...(numeric.agendaPoints !== null
      ? { agendaPoints: numeric.agendaPoints }
      : {}),
    ...(strength.kind === "fixed"
      ? { strength: strength.value }
      : strength.kind === "not_applicable"
        ? {}
        : { variableStrength: { ...strength } }),
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
    numeric: {
      cost:
        characteristics.playCost?.kind === "fixed"
          ? characteristics.playCost.credits
          : null,
      installCost: numeric.installCost,
      memoryCost: numeric.memoryCost,
      strength: strength.kind === "fixed" ? strength.value : null,
      rezCost: numeric.rezCost,
      trashCost: numeric.trashCost,
      advancementRequirement: numeric.advancementRequirement,
      agendaPoints: numeric.agendaPoints,
    },
    strengthModel: { ...strength },
    rulesText: spec.text.rulesText,
    ...(subroutines.length > 0 ? { subroutines } : {}),
    mechanics: deriveMechanicTokens(spec.identity.cardType, engineView.engine),
    ...(spec.text.markCounterDisplay !== undefined
      ? { markCounterDisplay: { ...spec.text.markCounterDisplay } }
      : {}),
  }) as ResolvedCardDefinition;
}

export function projectCs06CardImplementation(
  engineView: DeepReadonly<EngineCardView>,
  spec: DeepReadonly<CardSpec>,
): Cs06CardImplementation {
  if (engineView.cardDefinitionId !== spec.identity.cardDefinitionId)
    throw new Error("cs06_projection_definition_mismatch");
  const {
    schemaVersion: _schemaVersion,
    characteristics: _characteristics,
    printedSubroutines: _printedSubroutines,
    ...families
  } = engineView.engine;
  assertCs06ImplementationFamilies(families);
  const labels = new Map(
    (spec.text.capabilityText ?? []).map((entry) => [
      entry.capabilityKey,
      entry.actionLabel,
    ]),
  );
  return deepFreezeSerializable({
    cardDefinitionId: engineView.cardDefinitionId,
    ...(cloneWithCapabilityLabels(
      families,
      labels,
    ) as Cs06CardImplementationFamilies),
  }) as Cs06CardImplementation;
}

const CS06_IMPLEMENTATION_FAMILIES = new Set([
  "abilities",
  "accessEffects",
  "advanceable",
  "fortRunWindows",
  "icebreakerAbilities",
  "icebreakerEncounterStrengthBonus",
  "icebreakerSubtypeChange",
  "installCapabilities",
  "installTargetBinding",
  "lifecycle",
  "modifiers",
  "scoredAgenda",
  "variableRez",
]);

function assertCs06ImplementationFamilies(
  families: Record<string, unknown>,
): void {
  for (const family of Object.keys(families))
    if (!CS06_IMPLEMENTATION_FAMILIES.has(family))
      throw new Error(`cs06_unhandled_implementation_family:${family}`);
}

function projectPrintedSubroutines(
  engine: DeepReadonly<CardMechanicalSpec>,
): SubroutineDefinition[] {
  return (engine.printedSubroutines ?? []).map((subroutine) => {
    if (subroutine.kind === "damage")
      return {
        id: subroutine.capabilityKey,
        type: "do_damage",
        damageType:
          subroutine.damageType === "brain" ? "core" : subroutine.damageType,
        amount: subroutine.amount,
      } satisfies SubroutineDefinition;
    if (subroutine.kind === "end_the_run")
      return {
        id: subroutine.capabilityKey,
        type: "end_the_run",
      } satisfies SubroutineDefinition;
    throw new Error(`cs06_unsupported_printed_subroutine:${subroutine.kind}`);
  });
}

function deriveMechanicTokens(
  cardType: CardSpec["identity"]["cardType"],
  engine: DeepReadonly<CardMechanicalSpec>,
): string[] {
  const tokens = new Set<string>();
  for (const token of BASE_MECHANICS[cardType]) tokens.add(token);
  for (const [family, declaration] of Object.entries(engine)) {
    if (family === "schemaVersion" || family === "characteristics") continue;
    tokens.add(family);
    for (const kind of nestedKinds(declaration)) tokens.add(kind);
  }
  return [...tokens].sort();
}

const BASE_MECHANICS: Record<
  CardSpec["identity"]["cardType"],
  readonly string[]
> = {
  identity: [],
  event: ["play_event"],
  operation: ["play_operation"],
  program: ["install_program"],
  hardware: ["install_hardware"],
  resource: ["install_resource"],
  agenda: ["install_remote", "advance", "score_agenda"],
  asset: ["install_remote", "rez_card", "trash_on_access"],
  upgrade: ["install_remote", "rez_card", "trash_on_access"],
  ice: ["install_ice", "rez_ice", "encounter_ice"],
};

function nestedKinds(value: unknown): string[] {
  const found = new Set<string>();
  const visit = (candidate: unknown): void => {
    if (Array.isArray(candidate)) {
      for (const entry of candidate) visit(entry);
      return;
    }
    if (candidate === null || typeof candidate !== "object") return;
    const record = candidate as Record<string, unknown>;
    if (typeof record.kind === "string") found.add(record.kind);
    for (const nested of Object.values(record)) visit(nested);
  };
  visit(value);
  return [...found];
}

function cloneWithCapabilityLabels(
  value: unknown,
  labels: ReadonlyMap<string, string>,
): unknown {
  if (Array.isArray(value))
    return value.map((entry) => cloneWithCapabilityLabels(entry, labels));
  if (value === null || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const cloned = Object.fromEntries(
    Object.entries(record).map(([key, nested]) => [
      key,
      cloneWithCapabilityLabels(nested, labels),
    ]),
  );
  const key =
    typeof record.capabilityKey === "string" ? record.capabilityKey : undefined;
  const label = key === undefined ? undefined : labels.get(key);
  return label === undefined ? cloned : { ...cloned, label };
}
