import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  GameState,
  SubroutineDefinition,
} from "@netgrid/shared";
import {
  activeCardImplementationModifiersForCorpRoot,
  cardDefinitionForInstance,
  cardInstanceFor,
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
  if (!isPublicRezzedCorpRootModifier(modifier)) return false;
  if (modifier.appliesTo.side !== "corp") return false;
  if (!cardMatchesModifierAppliesTo(iceDefinition, modifier.appliesTo))
    return false;
  return sameServerAsSourceApplies(
    state,
    sourceCardInstanceId,
    iceId,
    modifier.appliesTo.sameServerAsSource,
  );
}

function subroutineDefinitionForImplementation(
  match: ActiveCardImplementationModifier<CardAdditionalSubroutineModifierImplementation>,
  subroutine: CardSubroutineImplementation,
  index: number,
): DynamicSubroutineDefinition {
  if (subroutine.visibility !== "public")
    throw new Error("Unsupported additional subroutine visibility.");
  const publicId = `card_implementation.${match.sourceDefinitionId}.additional_subroutine.${index + 1}.${subroutine.kind}`;
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
  throw new Error(`Unsupported additional subroutine: ${JSON.stringify(subroutine)}`);
}

export function additionalSubroutinesForIce(
  state: GameState,
  iceId: CardInstanceId,
): SubroutineDefinition[] {
  const iceInstance = cardInstanceFor(state, iceId);
  if (!iceInstance.rezzed) return [];
  const iceDefinition = cardDefinitionForInstance(state, iceId);
  if (iceDefinition.type !== "ice") return [];
  const subroutines: SubroutineDefinition[] = [];
  for (const match of activeCardImplementationModifiersForCorpRoot(
    state,
    "additional_subroutine",
  )) {
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
    subroutines.push(
      subroutineDefinitionForImplementation(match, modifier.subroutine, subroutines.length),
    );
  }
  return subroutines;
}

export function dynamicSubroutineAttributionFor(
  subroutine: SubroutineDefinition | undefined,
): DynamicSubroutineAttribution | undefined {
  return (subroutine as DynamicSubroutineDefinition | undefined)
    ?.dynamicSubroutine;
}
