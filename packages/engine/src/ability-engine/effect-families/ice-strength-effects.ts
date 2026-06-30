import type { CardInstanceId } from "@netgrid/shared";
import type { CardEffectFamilyInput } from "./family-runtime";

export function executeIceStrengthEffect(input: CardEffectFamilyInput): boolean {
  const { context, effect, publicPayload, runtime } = input;
  const { assertPositiveIntegerAmount, assertPublicVisibility, mergePublicPayload } =
    runtime;

  if (effect.kind !== "double_chosen_ice_strength_until_end_of_turn")
    return false;

  assertPublicVisibility(
    "double_chosen_ice_strength_until_end_of_turn",
    effect.visibility,
  );
  assertPositiveIntegerAmount(
    "double_chosen_ice_strength_until_end_of_turn maxStrength",
    effect.maxStrength,
  );
  if (effect.target !== "chosen_installed_ice")
    throw new Error("Sterdroid target must be chosen_installed_ice.");
  if (!context.targetCardId)
    throw new Error("Sterdroid needs a selected ICE target.");
  if (!context.doubleChosenIceStrengthUntilEndOfTurn)
    throw new Error("Sterdroid needs an ICE-strength execution context.");

  const result = context.doubleChosenIceStrengthUntilEndOfTurn(
    context.targetCardId as CardInstanceId,
    effect.maxStrength,
  );
  mergePublicPayload(publicPayload, result.publicPayload);
  return true;
}
