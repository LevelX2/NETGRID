import type { CardEffectFamilyInput } from "./family-runtime";

export function executeCreditEffect(input: CardEffectFamilyInput): boolean {
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
    case "gain_credits": {
      runtime.assertPositiveIntegerAmount("gain_credits", effect.amount);
      const side = runtime.recipientSide(context, effect.recipient);
      runtime.gainCredits(state, side, effect.amount);
      publicPayload.gainedCredits =
        Number(publicPayload.gainedCredits ?? 0) + effect.amount;
      publicPayload[
        side === "corp" ? "corpCreditsAfter" : "runnerCreditsAfter"
      ] = side === "corp" ? state.corp.credits : state.runner.credits;
      resolvedEffects.push({
        effectId: runtime.publicEffectId(context, index, "gain_credits"),
        kind: "gain_credits",
        visibility: effect.visibility,
        side,
        amount: effect.amount,
        reason: runtime.effectReason(context),
        ...(context.sourceDefinitionId
          ? { sourceDefinitionId: context.sourceDefinitionId }
          : {}),
        ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
      });
      return true;
    }
    case "gain_credits_for_runner_trash_history": {
      runtime.assertPublicVisibility(
        "gain_credits_for_runner_trash_history",
        effect.visibility,
      );
      const amount =
        state.runnerTurnFlags?.trashedAdvertisementThisTurn === true
          ? effect.advertisementAmount
          : state.runnerTurnFlags?.trashedTransactionsThisTurn === true
            ? effect.transactionsAmount
            : 0;
      runtime.assertPositiveIntegerAmount(
        "gain_credits_for_runner_trash_history",
        amount,
      );
      runtime.gainCredits(state, context.controller, amount);
      publicPayload.gainedCredits =
        Number(publicPayload.gainedCredits ?? 0) + amount;
      publicPayload.runnerCreditsAfter = state.runner.credits;
      resolvedEffects.push({
        effectId: runtime.publicEffectId(context, index, "gain_credits"),
        kind: "gain_credits",
        visibility: effect.visibility,
        side: context.controller,
        amount,
        reason: runtime.effectReason(context),
        ...(context.sourceDefinitionId
          ? { sourceDefinitionId: context.sourceDefinitionId }
          : {}),
        ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
      });
      return true;
    }
    case "gain_credits_per_advancement_counter_on_source": {
      runtime.assertPositiveIntegerAmount(
        "gain_credits_per_advancement_counter_on_source",
        effect.amountPerCounter,
      );
      runtime.assertPublicVisibility(
        "gain_credits_per_advancement_counter_on_source",
        effect.visibility,
      );
      const source = state.cardInstances[context.sourceCardId];
      if (!source)
        throw new Error(
          "gain_credits_per_advancement_counter_on_source source is missing.",
        );
      const advancementCounterCount = Math.max(
        0,
        Math.floor(source.advancementCounters),
      );
      const amount = advancementCounterCount * effect.amountPerCounter;
      const side = runtime.recipientSide(context, effect.recipient);
      runtime.gainCredits(state, side, amount);
      publicPayload.advancementCounterCount = advancementCounterCount;
      publicPayload.gainedCredits =
        Number(publicPayload.gainedCredits ?? 0) + amount;
      publicPayload[
        side === "corp" ? "corpCreditsAfter" : "runnerCreditsAfter"
      ] = side === "corp" ? state.corp.credits : state.runner.credits;
      resolvedEffects.push({
        effectId: runtime.publicEffectId(
          context,
          index,
          "gain_credits_per_advancement_counter_on_source",
        ),
        kind: "gain_credits",
        visibility: effect.visibility,
        side,
        amount,
        reason: runtime.effectReason(context),
        ...(context.sourceDefinitionId
          ? { sourceDefinitionId: context.sourceDefinitionId }
          : {}),
        ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
      });
      return true;
    }
    case "lose_credits": {
      runtime.assertPublicVisibility("lose_credits", effect.visibility);
      const mode = effect.mode ?? "amount";
      if (mode !== "amount" && mode !== "all")
        throw new Error("lose_credits effect mode must be amount or all.");
      if (mode === "amount") {
        if (effect.amount === undefined)
          throw new Error("lose_credits amount mode requires an amount.");
        runtime.assertPositiveIntegerAmount("lose_credits", effect.amount);
      }
      const side = runtime.recipientSide(context, effect.recipient);
      const amountToLose =
        mode === "all"
          ? runtime.creditsForSide(state, side)
          : Math.min(runtime.creditsForSide(state, side), effect.amount ?? 0);
      runtime.loseCredits(state, side, amountToLose);
      publicPayload.creditsLost =
        Number(publicPayload.creditsLost ?? 0) + amountToLose;
      publicPayload[
        side === "corp" ? "corpCreditsAfter" : "runnerCreditsAfter"
      ] = runtime.creditsForSide(state, side);
      resolvedEffects.push({
        effectId: runtime.publicEffectId(context, index, "lose_credits"),
        kind: "lose_credits",
        visibility: effect.visibility,
        side,
        amount: amountToLose,
        reason: runtime.effectReason(context),
        ...(context.sourceDefinitionId
          ? { sourceDefinitionId: context.sourceDefinitionId }
          : {}),
        ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
      });
      return true;
    }
    case "pay_credits_or_lose_game": {
      runtime.assertPositiveIntegerAmount(
        "pay_credits_or_lose_game",
        effect.amount,
      );
      runtime.assertPublicVisibility(
        "pay_credits_or_lose_game",
        effect.visibility,
      );
      if (effect.reason !== "source_left_play")
        throw new Error(
          "pay_credits_or_lose_game reason must be source_left_play.",
        );
      const payer = runtime.recipientSide(context, effect.payer);
      const loseSide = runtime.recipientSide(context, effect.loseSide);
      const paid = runtime.spendCreditsIfAvailable(
        state,
        payer,
        effect.amount,
      );
      const winner = paid ? undefined : runtime.loseGame(state, loseSide);
      publicPayload.creditsPaid =
        Number(publicPayload.creditsPaid ?? 0) + (paid ? effect.amount : 0);
      publicPayload.payCreditsOrLoseGameAmount = effect.amount;
      publicPayload.payCreditsOrLoseGamePaid = paid;
      publicPayload[payer === "corp" ? "corpCreditsAfter" : "runnerCreditsAfter"] =
        runtime.creditsForSide(state, payer);
      if (!paid) {
        publicPayload.gameLost = true;
        publicPayload.winner = winner ?? "";
      }
      resolvedEffects.push({
        effectId: runtime.publicEffectId(
          context,
          index,
          "pay_credits_or_lose_game",
        ),
        kind: "pay_credits_or_lose_game",
        visibility: effect.visibility,
        side: payer,
        amount: effect.amount,
        paidCredits: paid ? effect.amount : 0,
        gameLost: !paid,
        ...(winner ? { winner } : {}),
        reason: effect.reason,
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
