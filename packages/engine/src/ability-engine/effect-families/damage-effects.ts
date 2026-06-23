import type { CardEffectFamilyInput } from "./family-runtime";

export function executeDamageEffect(input: CardEffectFamilyInput): boolean {
  const {
    context,
    effect,
    index,
    publicPayload,
    resolvedEffects,
    runtime,
  } = input;

  if (effect.kind !== "damage") return false;

  runtime.assertPositiveIntegerAmount("damage", effect.amount);
  runtime.assertPublicVisibility("damage", effect.visibility);
  if ((effect as { recipient?: string }).recipient !== "runner")
    throw new Error("damage effect recipient must be runner.");
  if (
    !["meat", "net", "core"].includes(
      (effect as { damageType?: string }).damageType ?? "",
    )
  )
    throw new Error("damage effect damageType must be meat, net, or core.");
  const preventable = (effect as { preventable?: boolean }).preventable;
  if (preventable !== true && preventable !== false)
    throw new Error("damage effect preventable must be true or false.");
  const damageRunner =
    preventable === true
      ? context.damageRunner
      : context.unpreventableDamageRunner;
  if (!damageRunner)
    throw new Error(
      preventable === true
        ? "damage effect requires a damageRunner execution context."
        : "unpreventable damage effect requires an unpreventableDamageRunner execution context.",
    );
  const damageResult = damageRunner(effect.damageType, effect.amount);
  runtime.mergePublicPayload(publicPayload, damageResult.publicPayload);
  if (!damageResult.resolved) return true;
  resolvedEffects.push({
    effectId: runtime.publicEffectId(context, index, "damage"),
    kind: "damage",
    visibility: effect.visibility,
    side: "runner",
    amount: damageResult.amount,
    damageType: damageResult.damageType,
    cardsTrashed: damageResult.cardsTrashed,
    preventable,
    reason: runtime.effectReason(context),
    ...(context.sourceDefinitionId
      ? { sourceDefinitionId: context.sourceDefinitionId }
      : {}),
    ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
  });
  return true;
}
