import type { CardEffectFamilyInput } from "./family-runtime";

export function executeBadPublicityEffect(input: CardEffectFamilyInput): boolean {
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
    case "add_bad_publicity": {
      runtime.assertPositiveIntegerAmount("add_bad_publicity", effect.amount);
      runtime.assertPublicVisibility("add_bad_publicity", effect.visibility);
      const sourceVisibility = effect.sourceVisibility ?? "public";
      if (sourceVisibility !== "public" && sourceVisibility !== "redacted")
        throw new Error(
          "add_bad_publicity sourceVisibility must be public or redacted.",
        );
      const before = state.corp.badPublicity;
      state.corp.badPublicity += effect.amount;
      publicPayload.badPublicityAdded =
        Number(publicPayload.badPublicityAdded ?? 0) + effect.amount;
      if (typeof publicPayload.corpBadPublicityBefore !== "number")
        publicPayload.corpBadPublicityBefore = before;
      publicPayload.corpBadPublicityAfter = state.corp.badPublicity;
      publicPayload.sourceVisibility = sourceVisibility;
      if (sourceVisibility === "redacted") {
        publicPayload.redactedKind = "hidden_resource_source";
      }
      resolvedEffects.push({
        effectId: runtime.publicEffectId(context, index, "add_bad_publicity"),
        kind: "add_bad_publicity",
        visibility: effect.visibility,
        side: "corp",
        amount: effect.amount,
        reason: runtime.effectReason(context),
        ...(sourceVisibility === "redacted"
          ? { redactedKind: "hidden_resource_source" }
          : {}),
        ...(sourceVisibility === "public" && context.sourceDefinitionId
          ? { sourceDefinitionId: context.sourceDefinitionId }
          : {}),
        ...(sourceVisibility === "public" && context.sourceTitle
          ? { sourceTitle: context.sourceTitle }
          : {}),
      });
      return true;
    }
    case "add_bad_publicity_from_frame_up_history": {
      runtime.assertPositiveIntegerAmount(
        "add_bad_publicity_from_frame_up_history",
        effect.baseAmount,
      );
      runtime.assertPositiveIntegerAmount(
        "add_bad_publicity_from_frame_up_history",
        effect.additionalAmount,
      );
      runtime.assertPublicVisibility(
        "add_bad_publicity_from_frame_up_history",
        effect.visibility,
      );
      const additional =
        state.runnerTurnFlags
          ?.blackOpsLiberatedOrTrashedDuringSuccessfulHqOrRdRunThisTurn === true
          ? effect.additionalAmount
          : 0;
      const amount = effect.baseAmount + additional;
      const before = state.corp.badPublicity;
      state.corp.badPublicity += amount;
      publicPayload.badPublicityAdded =
        Number(publicPayload.badPublicityAdded ?? 0) + amount;
      publicPayload.frameUpBaseBadPublicity = effect.baseAmount;
      publicPayload.frameUpAdditionalBadPublicity = additional;
      if (typeof publicPayload.corpBadPublicityBefore !== "number")
        publicPayload.corpBadPublicityBefore = before;
      publicPayload.corpBadPublicityAfter = state.corp.badPublicity;
      resolvedEffects.push({
        effectId: runtime.publicEffectId(context, index, "add_bad_publicity"),
        kind: "add_bad_publicity",
        visibility: effect.visibility,
        side: "corp",
        amount,
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
