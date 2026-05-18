import type {
  CardDefinition,
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
): SubroutineDefinition {
  if (subroutine.visibility !== "public")
    throw new Error("Unsupported additional subroutine visibility.");
  if (subroutine.kind === "end_the_run") {
    return {
      id: `card_implementation.${match.sourceDefinitionId}.${match.sourceCardInstanceId}.additional_subroutine.${index + 1}.end_the_run`,
      type: "end_the_run",
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
