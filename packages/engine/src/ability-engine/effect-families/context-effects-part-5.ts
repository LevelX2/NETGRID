import type { MultiServerSuccessSequenceState } from "@netgrid/shared";
import type { CardEffectFamilyInput } from "./family-runtime";

export function executeContextEffectPart5(
  input: CardEffectFamilyInput,
): boolean {
  const {
    state,
    context,
    effect,
    index,
    publicPayload,
    resolvedEffects,
    runtime,
  } = input;
  const {
    recipientSide,
    publicEffectId,
    effectReason,
    assertPositiveIntegerAmount,
    assertPublicVisibility,
    assertHiddenInfoBarrierVisibility,
    mergePublicPayload,
    dataFortServerIds,
  } = runtime;

  switch (effect.kind) {
    case "remove_same_fort_advancement_counters_for_run_credits": {
      assertPublicVisibility(
        "remove_same_fort_advancement_counters_for_run_credits",
        effect.visibility,
      );
      assertPositiveIntegerAmount(
        "remove_same_fort_advancement_counters_for_run_credits",
        effect.creditsPerCounter,
      );
      if (!state.run)
        throw new Error("Run-Credits brauchen einen laufenden Run.");
      const source = state.cardInstances[context.sourceCardId];
      const serverId =
        source?.zone.side === "corp" && source.zone.zone === "serverRoot"
          ? source.zone.serverId
          : undefined;
      if (!serverId)
        throw new Error("Die Quelle ist nicht in einem Fort installiert.");
      const server = state.corp.servers.find(
        (candidate) => candidate.id === serverId,
      );
      if (!server) throw new Error("Das Quellen-Fort existiert nicht mehr.");
      let removed = 0;
      for (const cardId of [...server.root, ...server.ice].sort()) {
        const instance = state.cardInstances[cardId];
        if (!instance) continue;
        const amount = Math.max(
          0,
          Math.floor(instance.advancementCounters ?? 0),
        );
        if (amount <= 0) continue;
        instance.advancementCounters = 0;
        removed += amount;
      }
      if (removed <= 0)
        throw new Error("In diesem Fort liegen keine Advancement-Counter.");
      const gained = removed * effect.creditsPerCounter;
      if (!context.sourceDefinitionId)
        throw new Error("Run-Credits brauchen eine Quellenkarte.");
      state.corp.credits += gained;
      state.run.corpRunTemporaryCredits = {
        sourceCardInstanceId: context.sourceCardId,
        sourceDefinitionId: context.sourceDefinitionId,
        remaining:
          Math.max(
            0,
            Math.floor(state.run.corpRunTemporaryCredits?.remaining ?? 0),
          ) + gained,
        usableFor: "corp_costs_during_this_run",
        returnUnusedAtRunEnd: true,
      };
      mergePublicPayload(publicPayload, {
        advancementCounterCount: removed,
        temporaryRunCredits: gained,
        temporaryRunCreditsRemaining:
          state.run.corpRunTemporaryCredits.remaining,
        corpCreditsAfter: state.corp.credits,
        serverId,
      });
      return true;
    }
    case "trash_own_rezzed_ice_for_credits": {
      assertPublicVisibility(
        "trash_own_rezzed_ice_for_credits",
        effect.visibility,
      );
      assertPositiveIntegerAmount(
        "trash_own_rezzed_ice_for_credits",
        effect.gainCredits,
      );
      const targetCardId = context.targetCardId;
      const instance = targetCardId
        ? state.cardInstances[targetCardId]
        : undefined;
      if (
        !targetCardId ||
        !instance ||
        instance.controller !== "corp" ||
        instance.zone.side !== "corp" ||
        instance.zone.zone !== "serverIce" ||
        instance.rezzed !== true
      )
        throw new Error("Das Ziel ist kein eigenes gerezztes ICE.");
      const serverId = instance.zone.serverId;
      const server = state.corp.servers.find(
        (candidate) => candidate.id === serverId,
      );
      if (!server) throw new Error("Das Ziel-Fort existiert nicht mehr.");
      server.ice = server.ice.filter((id) => id !== targetCardId);
      state.corp.archives.push(targetCardId);
      state.cardInstances[targetCardId] = {
        ...instance,
        zone: { side: "corp", zone: "archives" },
        faceup: true,
        rezzed: true,
      };
      state.corp.credits += effect.gainCredits;
      mergePublicPayload(publicPayload, {
        targetCardDefinitionId: instance.definitionId,
        trashedIceCount: 1,
        gainedCredits: effect.gainCredits,
        corpCreditsAfter: state.corp.credits,
        serverId,
      });
      return true;
    }
    case "gain_actions": {
      assertPositiveIntegerAmount("gain_actions", effect.amount);
      assertPublicVisibility("gain_actions", effect.visibility);
      const side = recipientSide(context, effect.recipient);
      if (side === "corp") state.corp.clicks += effect.amount;
      else state.runner.clicks += effect.amount;
      publicPayload.gainedActions =
        Number(publicPayload.gainedActions ?? 0) + effect.amount;
      publicPayload[side === "corp" ? "corpClicksAfter" : "runnerClicksAfter"] =
        side === "corp" ? state.corp.clicks : state.runner.clicks;
      resolvedEffects.push({
        effectId: publicEffectId(context, index, "gain_actions"),
        kind: "gain_actions",
        visibility: effect.visibility,
        side,
        amount: effect.amount,
        reason: effectReason(context),
        ...(context.sourceDefinitionId
          ? { sourceDefinitionId: context.sourceDefinitionId }
          : {}),
        ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
      });
      return true;
    }
    case "trash_source": {
      assertPublicVisibility("trash_source", effect.visibility);
      if (!context.trashSource)
        throw new Error(
          "trash_source effect requires a trashSource execution context.",
        );
      const trashResult = context.trashSource(context.sourceCardId);
      mergePublicPayload(publicPayload, trashResult.publicPayload);
      if (!trashResult.sourceTrashed) return true;
      resolvedEffects.push({
        effectId: publicEffectId(context, index, "trash_source"),
        kind: "trash_source",
        visibility: effect.visibility,
        side: context.controller,
        amount: 1,
        reason: effectReason(context),
        ...(context.sourceDefinitionId
          ? { sourceDefinitionId: context.sourceDefinitionId }
          : {}),
        ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
      });
      return true;
    }
    case "use_base_link":
    case "increase_trace_link": {
      throw new Error(
        `${effect.kind} effects are resolved by the trace window host.`,
      );
    }
    default:
      return false;
  }
}
