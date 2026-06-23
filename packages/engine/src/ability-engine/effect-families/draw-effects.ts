import type { CardEffectFamilyInput } from "./family-runtime";

export function executeDrawEffect(input: CardEffectFamilyInput): boolean {
  const {
    context,
    effect,
    index,
    publicPayload,
    resolvedEffects,
    runtime,
  } = input;

  if (effect.kind !== "draw_cards") return false;

  runtime.assertPositiveIntegerAmount("draw_cards", effect.amount);
  runtime.assertPublicVisibility("draw_cards", effect.visibility);
  if (!context.drawCards)
    throw new Error("draw_cards effect requires a drawCards execution context.");
  const side = runtime.recipientSide(context, effect.recipient);
  const drawResult = context.drawCards(side, effect.amount);
  runtime.mergePublicPayload(publicPayload, drawResult.publicPayload);
  resolvedEffects.push({
    effectId: runtime.publicEffectId(context, index, "draw_cards"),
    kind: "draw_cards",
    visibility: effect.visibility,
    side,
    amount: drawResult.drawnCount,
    reason: runtime.effectReason(context),
    ...(context.sourceDefinitionId
      ? { sourceDefinitionId: context.sourceDefinitionId }
      : {}),
    ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
  });
  return true;
}
