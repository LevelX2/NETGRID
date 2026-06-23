import type { CardEffectFamilyInput } from "./family-runtime";

export function executeTagEffect(input: CardEffectFamilyInput): boolean {
  const {
    state,
    context,
    effect,
    index,
    publicPayload,
    resolvedEffects,
    runtime,
  } = input;

  switch (effect.kind) {
    case "add_tags": {
      runtime.assertPositiveIntegerAmount("add_tags", effect.amount);
      runtime.assertPublicVisibility("add_tags", effect.visibility);
      if ((effect as { recipient?: string }).recipient !== "runner")
        throw new Error("add_tags effect recipient must be runner.");
      runtime.addRunnerTags(state, effect.amount);
      publicPayload.tagsAdded =
        Number(publicPayload.tagsAdded ?? 0) + effect.amount;
      publicPayload.runnerTagsAfter = state.runner.tags;
      resolvedEffects.push({
        effectId: runtime.publicEffectId(context, index, "add_tags"),
        kind: "add_tags",
        visibility: effect.visibility,
        side: "runner",
        amount: effect.amount,
        reason: runtime.effectReason(context),
        runnerTagsAfter: state.runner.tags,
        ...(context.sourceDefinitionId
          ? { sourceDefinitionId: context.sourceDefinitionId }
          : {}),
        ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
      });
      return true;
    }
    case "remove_tags": {
      runtime.assertPublicVisibility("remove_tags", effect.visibility);
      if (effect.recipient !== "runner")
        throw new Error("remove_tags effect recipient must be runner.");
      if (
        effect.mode !== "amount" &&
        effect.mode !== "up_to_amount" &&
        effect.mode !== "all"
      )
        throw new Error("remove_tags effect mode is invalid.");
      if (effect.mode !== "all") {
        if (effect.amount === undefined)
          throw new Error("remove_tags amount modes require an amount.");
        runtime.assertPositiveIntegerAmount("remove_tags", effect.amount);
      }
      if (!context.removeRunnerTags)
        throw new Error(
          "remove_tags effect requires a removeRunnerTags execution context.",
        );
      const removeResult = context.removeRunnerTags(
        effect.mode,
        effect.amount,
      );
      publicPayload.removedTags =
        Number(publicPayload.removedTags ?? 0) + removeResult.removedTags;
      publicPayload.runnerTagsAfter = removeResult.runnerTagsAfter;
      resolvedEffects.push({
        effectId: runtime.publicEffectId(context, index, "remove_tags"),
        kind: "remove_tags",
        visibility: effect.visibility,
        side: "runner",
        amount: removeResult.removedTags,
        reason: runtime.effectReason(context),
        runnerTagsAfter: removeResult.runnerTagsAfter,
        ...(context.sourceDefinitionId
          ? { sourceDefinitionId: context.sourceDefinitionId }
          : {}),
        ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
      });
      return true;
    }
    case "avoid_next_tag": {
      runtime.assertPublicVisibility("avoid_next_tag", effect.visibility);
      if (effect.recipient !== "runner")
        throw new Error("avoid_next_tag effect recipient must be runner.");
      if (effect.amount !== 1)
        throw new Error("avoid_next_tag supports only amount 1.");
      if (!context.avoidNextTag)
        throw new Error(
          "avoid_next_tag effect requires an avoidNextTag execution context.",
        );
      const avoidResult = context.avoidNextTag(effect.amount);
      runtime.mergePublicPayload(publicPayload, avoidResult.publicPayload);
      publicPayload.preventedTagsNext =
        Number(publicPayload.preventedTagsNext ?? 0) + avoidResult.amount;
      return true;
    }
    default:
      return false;
  }
}
