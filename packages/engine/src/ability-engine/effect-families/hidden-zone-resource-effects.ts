import type { MultiServerSuccessSequenceState } from "@netgrid/shared";
import type { CardEffectFamilyInput } from "./family-runtime";

export function executeHiddenZoneResourceEffect(
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
    case "look_top_stack_show_to_corp_then_install_matching": {
      if (effect.visibility !== "hidden_info_barrier")
        throw new Error(
          "look_top_stack_show_to_corp_then_install_matching visibility must be hidden_info_barrier.",
        );
      if (
        effect.count !== 5 ||
        effect.installCost !== "free" ||
        effect.trashSourceIfInstalled !== true ||
        effect.shuffleAfterwards !== true ||
        effect.allowedTypes.some((type) => type !== "program")
      )
        throw new Error(
          "look_top_stack_show_to_corp_then_install_matching supports only top-five free program installs.",
        );
      if (!context.startLookTopStackShowToCorpThenInstallMatching)
        throw new Error(
          "look_top_stack_show_to_corp_then_install_matching requires a host choice context.",
        );
      const lookResult = context.startLookTopStackShowToCorpThenInstallMatching(
        effect.count,
        effect.allowedTypes,
        effect.installCost,
        effect.trashSourceIfInstalled,
        effect.shuffleAfterwards,
      );
      mergePublicPayload(publicPayload, lookResult.publicPayload);
      return true;
    }
    case "look_top_stack_take_matching": {
      if (effect.visibility !== "hidden_info_barrier")
        throw new Error(
          "look_top_stack_take_matching visibility must be hidden_info_barrier.",
        );
      assertPositiveIntegerAmount("look_top_stack_take_matching", effect.count);
      if (!Number.isInteger(effect.costPerTaken) || effect.costPerTaken < 0)
        throw new Error(
          "look_top_stack_take_matching costPerTaken must be a non-negative integer.",
        );
      if (effect.revealTakenToCorp !== true || effect.shuffleRemainder !== true)
        throw new Error(
          "look_top_stack_take_matching must reveal taken cards and shuffle remainder.",
        );
      if (!context.startLookTopStackTakeMatching)
        throw new Error(
          "look_top_stack_take_matching requires a startLookTopStackTakeMatching execution context.",
        );
      const lookResult = context.startLookTopStackTakeMatching(
        effect.count,
        effect.allowedTypes,
        effect.costPerTaken,
        effect.revealTakenToCorp,
        effect.shuffleRemainder,
      );
      mergePublicPayload(publicPayload, lookResult.publicPayload);
      return true;
    }
    case "look_top_stack_take_one_arrange_rest": {
      if (effect.visibility !== "hidden_info_barrier")
        throw new Error(
          "look_top_stack_take_one_arrange_rest visibility must be hidden_info_barrier.",
        );
      if (effect.count !== 5)
        throw new Error(
          "look_top_stack_take_one_arrange_rest supports only count 5.",
        );
      if (!context.startLookTopStackTakeOneArrangeRest)
        throw new Error(
          "look_top_stack_take_one_arrange_rest requires a startLookTopStackTakeOneArrangeRest execution context.",
        );
      const lookResult = context.startLookTopStackTakeOneArrangeRest(
        effect.count,
      );
      mergePublicPayload(publicPayload, lookResult.publicPayload);
      return true;
    }
    case "trash_own_installed_cards_for_credits": {
      assertPublicVisibility(
        "trash_own_installed_cards_for_credits",
        effect.visibility,
      );
      if (effect.target !== "chosen_installed_runner_cards")
        throw new Error(
          "trash_own_installed_cards_for_credits target must be chosen_installed_runner_cards.",
        );
      if (effect.min !== 0 && effect.min !== 1)
        throw new Error(
          "trash_own_installed_cards_for_credits min must be 0 or 1.",
        );
      if (effect.max !== "any")
        throw new Error(
          "trash_own_installed_cards_for_credits max must be any.",
        );
      assertPositiveIntegerAmount(
        "trash_own_installed_cards_for_credits",
        effect.gainPerTrashed,
      );
      if (!context.startTrashOwnInstalledCardsForCredits)
        throw new Error(
          "trash_own_installed_cards_for_credits requires a host choice context.",
        );
      const choiceResult = context.startTrashOwnInstalledCardsForCredits(
        effect.min,
        effect.max,
        effect.gainPerTrashed,
      );
      mergePublicPayload(publicPayload, choiceResult.publicPayload);
      return true;
    }
    case "trash_cards_from_grip_for_credits": {
      if (effect.visibility !== "hidden_info_barrier")
        throw new Error(
          "trash_cards_from_grip_for_credits visibility must be hidden_info_barrier.",
        );
      if (effect.target !== "chosen_runner_grip_cards")
        throw new Error(
          "trash_cards_from_grip_for_credits target must be chosen_runner_grip_cards.",
        );
      assertPositiveIntegerAmount(
        "trash_cards_from_grip_for_credits",
        effect.max,
      );
      assertPositiveIntegerAmount(
        "trash_cards_from_grip_for_credits",
        effect.gainPerTrashed,
      );
      if (!context.startTrashCardsFromGripForCredits)
        throw new Error(
          "trash_cards_from_grip_for_credits requires a host choice context.",
        );
      const choiceResult = context.startTrashCardsFromGripForCredits(
        effect.max,
        effect.gainPerTrashed,
      );
      mergePublicPayload(publicPayload, choiceResult.publicPayload);
      return true;
    }
    case "shuffle_grip_trash_and_stack_then_draw": {
      if (effect.visibility !== "hidden_info_barrier")
        throw new Error(
          "shuffle_grip_trash_and_stack_then_draw visibility must be hidden_info_barrier.",
        );
      assertPositiveIntegerAmount(
        "shuffle_grip_trash_and_stack_then_draw",
        effect.drawCount,
      );
      if (effect.removePlayedCardFromGame !== true)
        throw new Error(
          "shuffle_grip_trash_and_stack_then_draw must remove the played card from the game.",
        );
      if (!context.shuffleGripTrashAndStackThenDraw)
        throw new Error(
          "shuffle_grip_trash_and_stack_then_draw requires a host zone context.",
        );
      const shuffleResult = context.shuffleGripTrashAndStackThenDraw(
        effect.drawCount,
        effect.removePlayedCardFromGame,
      );
      mergePublicPayload(publicPayload, shuffleResult.publicPayload);
      return true;
    }
    case "gain_temporary_corp_credits": {
      assertPositiveIntegerAmount("gain_temporary_corp_credits", effect.amount);
      assertPublicVisibility("gain_temporary_corp_credits", effect.visibility);
      if (effect.recipient !== "corp" || effect.usableFor !== "install_or_rez")
        throw new Error("gain_temporary_corp_credits profile is invalid.");
      if (!context.sourceDefinitionId)
        throw new Error("Temporary Corp Credits brauchen eine Quellenkarte.");
      state.corp.credits += effect.amount;
      state.corpTemporaryInstallRezCredits = {
        sourceCardInstanceId: context.sourceCardId,
        sourceDefinitionId: context.sourceDefinitionId,
        remaining:
          Math.max(
            0,
            Math.floor(state.corpTemporaryInstallRezCredits?.remaining ?? 0),
          ) + effect.amount,
        usableFor: "corp_install_or_rez",
        returnUnusedAtTurnEnd: true,
      };
      mergePublicPayload(publicPayload, {
        temporaryCreditsProvided: effect.amount,
        temporaryCreditsRemaining:
          state.corpTemporaryInstallRezCredits.remaining,
        corpCreditsAfter: state.corp.credits,
      });
      return true;
    }
    case "gain_temporary_corp_run_credits": {
      assertPositiveIntegerAmount(
        "gain_temporary_corp_run_credits",
        effect.amount,
      );
      assertPublicVisibility(
        "gain_temporary_corp_run_credits",
        effect.visibility,
      );
      if (
        effect.recipient !== "corp" ||
        effect.usableFor !== "corp_costs_during_this_run" ||
        effect.cleanup !== "run_end"
      )
        throw new Error("gain_temporary_corp_run_credits profile is invalid.");
      if (!state.run)
        throw new Error("Run-Credits brauchen einen laufenden Run.");
      if (!context.sourceDefinitionId)
        throw new Error("Run-Credits brauchen eine Quellenkarte.");
      state.corp.credits += effect.amount;
      state.run.corpRunTemporaryCredits = {
        sourceCardInstanceId: context.sourceCardId,
        sourceDefinitionId: context.sourceDefinitionId,
        remaining:
          Math.max(
            0,
            Math.floor(state.run.corpRunTemporaryCredits?.remaining ?? 0),
          ) + effect.amount,
        usableFor: "corp_costs_during_this_run",
        returnUnusedAtRunEnd: true,
      };
      mergePublicPayload(publicPayload, {
        temporaryRunCredits: effect.amount,
        temporaryRunCreditsRemaining:
          state.run.corpRunTemporaryCredits.remaining,
        corpCreditsAfter: state.corp.credits,
      });
      return true;
    }
    case "gain_temporary_trace_credits": {
      assertPositiveIntegerAmount(
        "gain_temporary_trace_credits",
        effect.amount,
      );
      assertPublicVisibility("gain_temporary_trace_credits", effect.visibility);
      if (!state.trace)
        throw new Error(
          "Temporary Trace Credits brauchen einen laufenden Trace.",
        );
      if (effect.recipient !== "corp" || effect.usableFor !== "current_trace")
        throw new Error("gain_temporary_trace_credits profile is invalid.");
      if (!context.sourceDefinitionId)
        throw new Error("Temporary Trace Credits brauchen eine Quellenkarte.");
      state.trace.corpTemporaryTraceCredits = {
        sourceCardInstanceId: context.sourceCardId,
        sourceDefinitionId: context.sourceDefinitionId,
        remaining:
          Math.max(
            0,
            Math.floor(state.trace.corpTemporaryTraceCredits?.remaining ?? 0),
          ) + effect.amount,
        returnUnusedAtTraceEnd: true,
      };
      if (state.pendingChoice?.source === `trace:${state.trace.traceId}`)
        state.pendingChoice = {
          ...state.pendingChoice,
          stateVersion: state.stateVersion + 1,
        };
      mergePublicPayload(publicPayload, {
        temporaryTraceCredits: effect.amount,
        temporaryTraceCreditsAvailable:
          state.trace.corpTemporaryTraceCredits.remaining,
        temporaryTraceCreditsSourceDefinitionId:
          state.trace.corpTemporaryTraceCredits.sourceDefinitionId,
      });
      return true;
    }
    default:
      return false;
  }
}
