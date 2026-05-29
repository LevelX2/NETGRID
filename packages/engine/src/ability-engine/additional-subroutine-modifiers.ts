/**
 * Builds dynamic subroutines from CardImplementation modifiers.
 *
 * This is a narrow public attribution layer for additional_subroutine effects.
 * It appends supported subroutines to current ICE definitions and leaves break,
 * resolve, and stale dynamic-subroutine revalidation to the run engine.
 */
import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  GameState,
  SubroutineDefinition,
} from "@netgrid/shared";
import {
  activeCardImplementationModifiersForCorpInstalled,
  activeCardImplementationModifiersForCorpRoot,
  cardDefinitionForInstance,
  cardInstanceFor,
  cardHasNormalizedSubtype,
  cardMatchesModifierAppliesTo,
  isPublicRezzedCorpRootModifier,
  sameServerAsSourceApplies,
  type ActiveCardImplementationModifier,
} from "./card-implementation-modifiers";
import type {
  CardAdditionalSubroutineModifierImplementation,
  CardSubroutineImplementation,
} from "./definition-types";

export type DynamicSubroutineAttribution = {
  internalId: string;
  publicId: string;
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  sourceTitle: string;
  modifierKind: "additional_subroutine";
  subroutineKind: CardSubroutineImplementation["kind"];
};

export type DynamicSubroutineDefinition = SubroutineDefinition & {
  dynamicSubroutine?: DynamicSubroutineAttribution;
};

function additionalSubroutineModifierAppliesToIce(
  state: GameState,
  modifier: CardAdditionalSubroutineModifierImplementation,
  sourceCardInstanceId: CardInstanceId,
  iceId: CardInstanceId,
  iceDefinition: CardDefinition,
): boolean {
  if (
    modifier.activeWhile !== "rezzed" ||
    modifier.visibility !== "public" ||
    (modifier.sourceZone !== "corp_root" &&
      modifier.sourceZone !== "corp_installed")
  )
    return false;
  if (modifier.sourceZone === "corp_root" && !isPublicRezzedCorpRootModifier(modifier))
    return false;
  if (modifier.appliesTo.side !== "corp") return false;
  if (modifier.appliesTo.sourceCardOnly && sourceCardInstanceId !== iceId)
    return false;
  if (!cardMatchesModifierAppliesTo(iceDefinition, modifier.appliesTo))
    return false;
  return sameServerAsSourceApplies(
    state,
    sourceCardInstanceId,
    iceId,
    modifier.appliesTo.sameServerAsSource,
  );
}

/**
 * Converts one declarative additional subroutine into a public dynamic
 * SubroutineDefinition. Public ids are stable and redacted; internal ids keep
 * source instance attribution for revalidation.
 */
function subroutineDefinitionForImplementation(
  match: ActiveCardImplementationModifier<CardAdditionalSubroutineModifierImplementation>,
  subroutine: CardSubroutineImplementation,
  index: number,
  repeatIndex?: number,
): DynamicSubroutineDefinition {
  if (subroutine.visibility !== "public")
    throw new Error("Unsupported additional subroutine visibility.");
  const repeatPart =
    repeatIndex === undefined ? "" : `.repeat.${repeatIndex + 1}`;
  const publicId = `card_implementation.${match.sourceDefinitionId}.additional_subroutine.${index + 1}${repeatPart}.${subroutine.kind}`;
  const dynamicSubroutine: DynamicSubroutineAttribution = {
    internalId: `${publicId}.${match.sourceCardInstanceId}`,
    publicId,
    sourceCardInstanceId: match.sourceCardInstanceId,
    sourceDefinitionId: match.sourceDefinitionId,
    sourceTitle: match.sourceDefinition.title,
    modifierKind: "additional_subroutine",
    subroutineKind: subroutine.kind,
  };
  if (subroutine.kind === "end_the_run") {
    return {
      id: publicId,
      type: "end_the_run",
      dynamicSubroutine,
    };
  }
  if (subroutine.kind === "end_the_run_unless_runner_pays") {
    return {
      id: publicId,
      type: "end_the_run_unless_runner_pays",
      amount: subroutine.amount,
      dynamicSubroutine,
    };
  }
  throw new Error(`Unsupported additional subroutine: ${JSON.stringify(subroutine)}`);
}

function rezzedInstalledIceRepeatCount(
  state: GameState,
  sourceCardInstanceId: CardInstanceId,
  modifier: CardAdditionalSubroutineModifierImplementation,
): number {
  const repeat = modifier.repeat;
  if (!repeat) return 1;
  if (repeat.kind !== "for_each_rezzed_installed_ice")
    throw new Error("Unsupported additional subroutine repeat kind.");
  return state.corp.servers.reduce((count, server) => {
    for (const cardId of server.ice) {
      if (repeat.excludeSource && cardId === sourceCardInstanceId)
        continue;
      const instance = state.cardInstances[cardId];
      if (!instance?.rezzed) continue;
      const definition = cardDefinitionForInstance(state, cardId);
      if (
        repeat.subtypeAnyOf.some((subtype) =>
          cardHasNormalizedSubtype(definition, subtype),
        )
      )
        count += 1;
    }
    return count;
  }, 0);
}

function activeAdditionalSubroutineModifiers(
  state: GameState,
): ActiveCardImplementationModifier<CardAdditionalSubroutineModifierImplementation>[] {
  return [
    ...activeCardImplementationModifiersForCorpRoot(
      state,
      "additional_subroutine",
    ).filter((match) => match.modifier.sourceZone === "corp_root"),
    ...activeCardImplementationModifiersForCorpInstalled(
      state,
      "additional_subroutine",
    ).filter((match) => match.modifier.sourceZone === "corp_installed"),
  ];
}

/**
 * Returns active additional subroutines for a rezzed ICE in append order.
 *
 * This helper is not a general subroutine DSL; unsupported subroutine kinds fail
 * loudly until the engine has an explicit implementation.
 */
export function additionalSubroutinesForIce(
  state: GameState,
  iceId: CardInstanceId,
): SubroutineDefinition[] {
  const iceInstance = cardInstanceFor(state, iceId);
  if (!iceInstance.rezzed) return [];
  const iceDefinition = cardDefinitionForInstance(state, iceId);
  if (iceDefinition.type !== "ice") return [];
  const subroutines: SubroutineDefinition[] = [];
  for (const match of activeAdditionalSubroutineModifiers(state)) {
    const { modifier } = match;
    if (modifier.append !== "after_existing")
      throw new Error("Unsupported additional subroutine append position.");
    if (
      !additionalSubroutineModifierAppliesToIce(
        state,
        modifier,
        match.sourceCardInstanceId,
        iceId,
        iceDefinition,
      )
    )
      continue;
    const repeatCount = rezzedInstalledIceRepeatCount(
      state,
      match.sourceCardInstanceId,
      modifier,
    );
    for (let repeatIndex = 0; repeatIndex < repeatCount; repeatIndex += 1) {
      subroutines.push(
        subroutineDefinitionForImplementation(
          match,
          modifier.subroutine,
          subroutines.length,
          modifier.repeat ? repeatIndex : undefined,
        ),
      );
    }
  }
  return subroutines;
}

export function currentEncounterAdditionalSubroutinesForIce(
  state: GameState,
  iceId: CardInstanceId,
): SubroutineDefinition[] {
  const run = state.run;
  if (!run || run.encounteredIceId !== iceId) return [];
  const records = run.encounterAdditionalSubroutines ?? [];
  const subroutines: SubroutineDefinition[] = [];
  records.forEach((record, index) => {
    if (record.originalSubroutineId) return;
    if (record.sourceCardInstanceId !== iceId) return;
    const publicId = `card_implementation.${record.sourceDefinitionId}.current_encounter_additional_subroutine.${index + 1}.${record.subroutineKind}`;
    const dynamicSubroutine: DynamicSubroutineAttribution = {
      internalId: `${publicId}.${record.sourceCardInstanceId}`,
      publicId,
      sourceCardInstanceId: record.sourceCardInstanceId,
      sourceDefinitionId: record.sourceDefinitionId,
      sourceTitle: record.sourceTitle,
      modifierKind: "additional_subroutine",
      subroutineKind: record.subroutineKind,
    };
    if (record.subroutineKind === "end_the_run") {
      const subroutine: DynamicSubroutineDefinition = {
        id: publicId,
        type: "end_the_run",
        dynamicSubroutine,
      };
      subroutines.push(subroutine);
      return;
    }
    if (record.subroutineKind === "end_the_run_unless_runner_pays") {
      const amount = Math.max(0, Math.floor(record.amount ?? 0));
      if (amount <= 0) return;
      const subroutine: DynamicSubroutineDefinition = {
        id: publicId,
        type: "end_the_run_unless_runner_pays",
        amount,
        dynamicSubroutine,
      };
      subroutines.push(subroutine);
    }
  });
  return subroutines;
}

export function copiedRunSubroutinesForIceAfterOriginal(
  state: GameState,
  iceId: CardInstanceId,
  originalSubroutineId: string,
): SubroutineDefinition[] {
  const run = state.run;
  if (!run) return [];
  const records = run.encounterAdditionalSubroutines ?? [];
  return records
    .filter(
      (record) =>
        record.targetIceId === iceId &&
        record.originalSubroutineId === originalSubroutineId,
    )
    .map((record, index) => {
      const publicId = `card_implementation.${record.sourceDefinitionId}.copied_subroutine.${index + 1}.${record.subroutineKind}`;
      const dynamicSubroutine: DynamicSubroutineAttribution = {
        internalId: `${publicId}.${record.sourceCardInstanceId}.${record.targetIceId}.${record.originalSubroutineId}`,
        publicId,
        sourceCardInstanceId: record.sourceCardInstanceId,
        sourceDefinitionId: record.sourceDefinitionId,
        sourceTitle: record.sourceTitle,
        modifierKind: "additional_subroutine",
        subroutineKind: record.subroutineKind,
      };
      if (record.subroutineKind === "end_the_run") {
        return {
          id: publicId,
          type: "end_the_run",
          dynamicSubroutine,
        };
      }
      return {
        id: publicId,
        type: "end_the_run_unless_runner_pays",
        amount: Math.max(0, Math.floor(record.amount ?? 0)),
        dynamicSubroutine,
      };
    });
}

/**
 * Reads CardImplementation attribution from a dynamic subroutine definition.
 */
export function dynamicSubroutineAttributionFor(
  subroutine: SubroutineDefinition | undefined,
): DynamicSubroutineAttribution | undefined {
  return (subroutine as DynamicSubroutineDefinition | undefined)
    ?.dynamicSubroutine;
}
