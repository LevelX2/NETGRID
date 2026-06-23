import type { CardEffectFamilyInput } from "./family-runtime";

export function executeCounterEffect(input: CardEffectFamilyInput): boolean {
  const {
    context,
    effect,
    index,
    publicPayload,
    resolvedEffects,
    runtime,
  } = input;

  switch (effect.kind) {
    case "add_counters_to_source": {
      runtime.assertPositiveIntegerAmount("add_counters_to_source", effect.amount);
      runtime.assertPublicVisibility("add_counters_to_source", effect.visibility);
      if (
        effect.counterType !== "ablative" &&
        effect.counterType !== "trauma" &&
        effect.counterType !== "boon"
      )
        throw new Error(
          "add_counters_to_source supports only explicit source counters.",
        );
      if (!context.addCountersToSource)
        throw new Error(
          "add_counters_to_source effect requires an addCountersToSource execution context.",
        );
      const addResult = context.addCountersToSource(
        context.sourceCardId,
        effect.counterType,
        effect.amount,
      );
      runtime.mergePublicPayload(publicPayload, addResult.publicPayload);
      resolvedEffects.push({
        effectId: runtime.publicEffectId(context, index, "add_counters_to_source"),
        kind: "counter_change",
        visibility: effect.visibility,
        side: context.controller,
        amount: addResult.amount,
        counterType: addResult.counterType,
        addedCounterAmount: addResult.amount,
        remainingCounters: addResult.countersAfter,
        reason: runtime.effectReason(context),
        ...(context.sourceDefinitionId
          ? { sourceDefinitionId: context.sourceDefinitionId }
          : {}),
        ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
      });
      return true;
    }
    case "add_counter_to_all_installed_runner_icebreakers": {
      runtime.assertPositiveIntegerAmount(
        "add_counter_to_all_installed_runner_icebreakers",
        effect.amount,
      );
      runtime.assertPublicVisibility(
        "add_counter_to_all_installed_runner_icebreakers",
        effect.visibility,
      );
      if (
        effect.counterType !== "militech" &&
        effect.counterType !== "breaker_strength_penalty"
      )
        throw new Error(
          "add_counter_to_all_installed_runner_icebreakers supports only configured public icebreaker counters.",
        );
      if (!context.addCounterToAllInstalledRunnerIcebreakers)
        throw new Error(
          "add_counter_to_all_installed_runner_icebreakers requires a counter execution context.",
        );
      const addResult = context.addCounterToAllInstalledRunnerIcebreakers(
        effect.counterType,
        effect.amount,
      );
      runtime.mergePublicPayload(publicPayload, addResult.publicPayload);
      resolvedEffects.push({
        effectId: runtime.publicEffectId(
          context,
          index,
          "add_counter_to_all_installed_runner_icebreakers",
        ),
        kind: "counter_change",
        visibility: effect.visibility,
        side: "runner",
        amount: addResult.amount,
        counterType: addResult.counterType,
        addedCounterAmount: addResult.amount,
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
