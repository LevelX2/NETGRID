import type { CardEffectFamilyInput } from "./family-runtime";

export function executeHostedCreditEffect(input: CardEffectFamilyInput): boolean {
  const {
    context,
    effect,
    index,
    publicPayload,
    resolvedEffects,
    runtime,
  } = input;

  switch (effect.kind) {
    case "add_hosted_credits": {
      runtime.assertPositiveIntegerAmount("add_hosted_credits", effect.amount);
      runtime.assertPublicVisibility("add_hosted_credits", effect.visibility);
      if ((effect as { target?: string }).target !== "source")
        throw new Error("add_hosted_credits effect target must be source.");
      if (!context.addHostedCredits)
        throw new Error(
          "add_hosted_credits effect requires an addHostedCredits execution context.",
        );
      const addResult = context.addHostedCredits(
        context.sourceCardId,
        effect.amount,
      );
      runtime.mergePublicPayload(publicPayload, addResult.publicPayload);
      resolvedEffects.push({
        effectId: runtime.publicEffectId(context, index, "add_hosted_credits"),
        kind: "add_hosted_credits",
        visibility: effect.visibility,
        side: context.controller,
        amount: addResult.amount,
        counterType: "bit",
        addedCounterAmount: addResult.amount,
        remainingCounters: addResult.hostedCreditsAfter,
        reason: runtime.effectReason(context),
        ...(context.sourceDefinitionId
          ? { sourceDefinitionId: context.sourceDefinitionId }
          : {}),
        ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
      });
      return true;
    }
    case "take_hosted_credits": {
      runtime.assertPublicVisibility("take_hosted_credits", effect.visibility);
      if ((effect as { source?: string }).source !== "source")
        throw new Error("take_hosted_credits effect source must be source.");
      if ((effect as { recipient?: string }).recipient !== "controller")
        throw new Error(
          "take_hosted_credits effect recipient must be controller.",
        );
      const mode = effect.mode ?? "up_to_amount_if_available";
      if (mode !== "up_to_amount_if_available" && mode !== "all")
        throw new Error(
          "take_hosted_credits effect mode must be up_to_amount_if_available or all.",
        );
      if (mode === "up_to_amount_if_available") {
        if (effect.amount === undefined)
          throw new Error("take_hosted_credits amount mode requires an amount.");
        runtime.assertPositiveIntegerAmount("take_hosted_credits", effect.amount);
      }
      if (!context.takeHostedCredits)
        throw new Error(
          "take_hosted_credits effect requires a takeHostedCredits execution context.",
        );
      const side = runtime.recipientSide(context, effect.recipient);
      const takeResult = context.takeHostedCredits(
        context.sourceCardId,
        side,
        mode === "all" ? "all" : effect.amount!,
      );
      runtime.mergePublicPayload(publicPayload, takeResult.publicPayload);
      resolvedEffects.push({
        effectId: runtime.publicEffectId(context, index, "take_hosted_credits"),
        kind: "take_hosted_credits",
        visibility: effect.visibility,
        side,
        amount: takeResult.amount,
        counterType: "bit",
        removedCounterAmount: takeResult.amount,
        remainingCounters: takeResult.hostedCreditsAfter,
        reason: runtime.effectReason(context),
        ...(context.sourceDefinitionId
          ? { sourceDefinitionId: context.sourceDefinitionId }
          : {}),
        ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
      });
      return true;
    }
    case "trash_source_when_empty": {
      runtime.assertPublicVisibility("trash_source_when_empty", effect.visibility);
      if ((effect as { source?: string }).source !== "source")
        throw new Error("trash_source_when_empty effect source must be source.");
      if (!context.trashSourceWhenEmpty)
        throw new Error(
          "trash_source_when_empty effect requires a trashSourceWhenEmpty execution context.",
        );
      const trashResult = context.trashSourceWhenEmpty(context.sourceCardId);
      runtime.mergePublicPayload(publicPayload, trashResult.publicPayload);
      if (!trashResult.sourceTrashed) return true;
      resolvedEffects.push({
        effectId: runtime.publicEffectId(context, index, "trash_source_when_empty"),
        kind: "trash_source_when_empty",
        visibility: effect.visibility,
        side: context.controller,
        amount: 1,
        reason: runtime.effectReason(context),
        ...(context.sourceDefinitionId
          ? { sourceDefinitionId: context.sourceDefinitionId }
          : {}),
        ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
      });
      return true;
    }
    default:
      return false;
  }
}
