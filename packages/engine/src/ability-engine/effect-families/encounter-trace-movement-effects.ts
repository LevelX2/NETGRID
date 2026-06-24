import type { MultiServerSuccessSequenceState } from "@netgrid/shared";
import type { CardEffectFamilyInput } from "./family-runtime";

export function executeEncounterTraceMovementEffect(
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
    case "add_current_encounter_additional_subroutine": {
      assertPublicVisibility(
        "add_current_encounter_additional_subroutine",
        effect.visibility,
      );
      if (effect.target !== "encountered_ice_self")
        throw new Error(
          "add_current_encounter_additional_subroutine supports only encountered_ice_self.",
        );
      if (effect.append !== "after_existing")
        throw new Error(
          "add_current_encounter_additional_subroutine supports only after_existing append.",
        );
      if (effect.subroutine.visibility !== "public")
        throw new Error(
          "add_current_encounter_additional_subroutine requires a public subroutine.",
        );
      if (!context.addCurrentEncounterAdditionalSubroutine)
        throw new Error(
          "add_current_encounter_additional_subroutine requires an encounter execution context.",
        );
      const result = context.addCurrentEncounterAdditionalSubroutine({
        subroutineKind: effect.subroutine.kind,
        ...(effect.subroutine.kind === "end_the_run_unless_runner_pays"
          ? { amount: effect.subroutine.amount }
          : {}),
      });
      mergePublicPayload(publicPayload, result.publicPayload);
      return true;
    }
    case "copy_same_fort_ice_subroutine_for_run": {
      assertPublicVisibility(
        "copy_same_fort_ice_subroutine_for_run",
        effect.visibility,
      );
      if (
        effect.target !== "chosen_same_fort_ice_subroutine" ||
        effect.append !== "immediately_after_original" ||
        effect.cleanup !== "run_end"
      )
        throw new Error(
          "copy_same_fort_ice_subroutine_for_run profile is invalid.",
        );
      if (!context.copySameFortIceSubroutineForRun)
        throw new Error(
          "copy_same_fort_ice_subroutine_for_run requires a target context.",
        );
      mergePublicPayload(
        publicPayload,
        context.copySameFortIceSubroutineForRun().publicPayload,
      );
      return true;
    }
    case "free_rez_installed_ice_with_counters": {
      assertPublicVisibility(
        "free_rez_installed_ice_with_counters",
        effect.visibility,
      );
      if (effect.target !== "chosen_installed_ice")
        throw new Error(
          "free_rez_installed_ice_with_counters target is invalid.",
        );
      if (!context.rezInstalledIceWithLifecycleCounters)
        throw new Error(
          "free_rez_installed_ice_with_counters requires a target context.",
        );
      const amount =
        effect.amount.kind === "bounded_x_by_rez_cost_min_one"
          ? Math.max(0, Math.floor(Number(context.xValue ?? 0)))
          : Math.max(0, Math.floor(Number(context.targetRezCost ?? 0)));
      mergePublicPayload(
        publicPayload,
        context.rezInstalledIceWithLifecycleCounters({
          counterType: effect.counterType,
          amount,
          lifecycle: effect.lifecycle,
        }).publicPayload,
      );
      return true;
    }
    case "replace_source_fort_cards_from_hq": {
      if (effect.visibility !== "hidden_info_barrier")
        throw new Error(
          "replace_source_fort_cards_from_hq visibility is invalid.",
        );
      if (effect.include !== "root_and_ice" || effect.installCost !== "free")
        throw new Error(
          "replace_source_fort_cards_from_hq profile is invalid.",
        );
      if (!context.replaceFortCardsFromHq)
        throw new Error(
          "replace_source_fort_cards_from_hq requires a source-fort context.",
        );
      mergePublicPayload(
        publicPayload,
        context.replaceFortCardsFromHq().publicPayload,
      );
      return true;
    }
    case "return_source_to_grip_if_paid": {
      assertPublicVisibility(
        "return_source_to_grip_if_paid",
        effect.visibility,
      );
      assertPositiveIntegerAmount(
        "return_source_to_grip_if_paid",
        effect.amount,
      );
      if (!context.returnSourceToGripIfPaid)
        throw new Error(
          "return_source_to_grip_if_paid requires a returnSourceToGripIfPaid execution context.",
        );
      const returnResult = context.returnSourceToGripIfPaid(
        context.sourceCardId,
        effect.amount,
      );
      mergePublicPayload(publicPayload, returnResult.publicPayload);
      return true;
    }
    case "trace": {
      assertPositiveIntegerAmount("trace", effect.baseTraceStrength);
      assertPublicVisibility("trace", effect.visibility);
      if (effect.onFailure && effect.onFailure.length > 0)
        throw new Error("Trace onFailure effects are not supported yet.");
      if (!context.startTrace)
        throw new Error(
          "trace effect requires a startTrace execution context.",
        );
      const traceResult = context.startTrace(
        context.sourceCardId,
        effect.baseTraceStrength,
        effect.onSuccess,
      );
      mergePublicPayload(publicPayload, traceResult.publicPayload);
      return true;
    }
    case "shuffle_source_into_corp_rd": {
      assertHiddenInfoBarrierVisibility(
        "shuffle_source_into_corp_rd",
        effect.visibility,
      );
      if (!context.shuffleSourceIntoCorpRd)
        throw new Error(
          "shuffle_source_into_corp_rd requires a movement execution context.",
        );
      const moveResult = context.shuffleSourceIntoCorpRd(context.sourceCardId);
      mergePublicPayload(publicPayload, moveResult.publicPayload);
      return true;
    }
    case "trash_corp_installed_cards_in_source_server": {
      assertHiddenInfoBarrierVisibility(
        "trash_corp_installed_cards_in_source_server",
        effect.visibility,
      );
      if (effect.include !== "root_and_ice")
        throw new Error(
          "trash_corp_installed_cards_in_source_server supports only root_and_ice.",
        );
      if (!context.trashCorpInstalledCardsInSourceServer)
        throw new Error(
          "trash_corp_installed_cards_in_source_server requires a server trash context.",
        );
      const trashResult = context.trashCorpInstalledCardsInSourceServer(
        context.sourceCardId,
      );
      mergePublicPayload(publicPayload, trashResult.publicPayload);
      return true;
    }
    default:
      return false;
  }
}
