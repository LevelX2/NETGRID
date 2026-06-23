import type { CardEffectFamilyInput } from "./family-runtime";

export function executeAdvancementEffect(input: CardEffectFamilyInput): boolean {
  const { context, effect, publicPayload, runtime } = input;

  switch (effect.kind) {
    case "distribute_advancement_counters": {
      runtime.assertPositiveIntegerAmount(
        "distribute_advancement_counters",
        effect.amount,
      );
      runtime.assertPublicVisibility(
        "distribute_advancement_counters",
        effect.visibility,
      );
      if (effect.target !== "installed_advanceable_cards")
        throw new Error(
          "distribute_advancement_counters target must be installed_advanceable_cards.",
        );
      if (!context.startDistributeAdvancementCounters)
        throw new Error(
          "distribute_advancement_counters requires a host choice context.",
        );
      const choiceResult = context.startDistributeAdvancementCounters(
        effect.amount,
        effect.distribution,
      );
      runtime.mergePublicPayload(publicPayload, choiceResult.publicPayload);
      return true;
    }
    case "move_advancement_counters": {
      runtime.assertPublicVisibility("move_advancement_counters", effect.visibility);
      if (effect.target !== "chosen_installed_advanceable_card")
        throw new Error(
          "move_advancement_counters target must be chosen_installed_advanceable_card.",
        );
      if (
        effect.maxAmount !== "all" &&
        (!Number.isInteger(effect.maxAmount) || effect.maxAmount <= 0)
      )
        throw new Error(
          "move_advancement_counters maxAmount must be all or a positive integer.",
        );
      if (!context.startMoveAdvancementCounters)
        throw new Error(
          "move_advancement_counters requires a host choice context.",
        );
      const choiceResult = context.startMoveAdvancementCounters(
        effect.source,
        effect.maxAmount,
      );
      runtime.mergePublicPayload(publicPayload, choiceResult.publicPayload);
      return true;
    }
    default:
      return false;
  }
}
