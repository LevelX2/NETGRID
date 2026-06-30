import type { MultiServerSuccessSequenceState } from "@netgrid/shared";
import type { CardEffectFamilyInput } from "./family-runtime";

export function executeRunSequenceEffect(
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
    case "start_runner_program_install_action_bundle": {
      assertPublicVisibility(
        "start_runner_program_install_action_bundle",
        effect.visibility,
      );
      if (
        effect.actionCount !== 5 ||
        effect.temporaryCredit !== 1 ||
        effect.allowedActionKind !== "install_program" ||
        effect.mayStopEarly !== true
      )
        throw new Error(
          "start_runner_program_install_action_bundle supports only the Valu-Pak profile.",
        );
      if (!context.startRunnerProgramInstallActionBundle)
        throw new Error(
          "start_runner_program_install_action_bundle requires a restricted-action context.",
        );
      const result = context.startRunnerProgramInstallActionBundle(
        effect.actionCount,
        effect.temporaryCredit,
      );
      mergePublicPayload(publicPayload, result.publicPayload);
      return true;
    }
    case "make_run": {
      assertPublicVisibility("make_run", effect.visibility);
      if (!context.startRun)
        throw new Error(
          "make_run effect requires a startRun execution context.",
        );
      const serverId =
        effect.target.kind === "central_server"
          ? effect.target.server
          : context.chosenRunServerId?.();
      if (!serverId)
        throw new Error("make_run effect requires a chosen run server.");
      const runResult = context.startRun(serverId, {
        ...(effect.accessCount !== undefined
          ? { accessCount: effect.accessCount }
          : {}),
        ...(effect.freeTrashAccessZones
          ? { freeTrashAccessZones: effect.freeTrashAccessZones }
          : {}),
        ...(effect.accessServerOverride
          ? { accessServerOverride: effect.accessServerOverride }
          : {}),
        ...(effect.successfulRunAccessReplacement
          ? {
              successfulRunAccessReplacement:
                effect.successfulRunAccessReplacement,
            }
          : {}),
        ...(effect.conditionalAccessBonus !== undefined
          ? { conditionalAccessBonus: effect.conditionalAccessBonus }
          : {}),
        ...(effect.corpRezCostSurcharge !== undefined
          ? { corpRezCostSurcharge: effect.corpRezCostSurcharge }
          : {}),
        ...(effect.successfulRunCreditLoss !== undefined
          ? { successfulRunCreditLoss: effect.successfulRunCreditLoss }
          : {}),
        ...(effect.successfulRunRunnerTagGain !== undefined
          ? { successfulRunRunnerTagGain: effect.successfulRunRunnerTagGain }
          : {}),
        ...(effect.successfulRunRunnerCreditGain !== undefined
          ? {
              successfulRunRunnerCreditGain:
                effect.successfulRunRunnerCreditGain,
            }
          : {}),
        ...(effect.successfulRunRequiresCorpCredits !== undefined
          ? {
              successfulRunRequiresCorpCredits:
                effect.successfulRunRequiresCorpCredits,
            }
          : {}),
        ...(effect.successfulRunPrivateLookCount !== undefined
          ? {
              successfulRunPrivateLookCount:
                effect.successfulRunPrivateLookCount,
            }
          : {}),
        ...(effect.successfulRunArchivesMoveCount !== undefined
          ? {
              successfulRunArchivesMoveCount:
                effect.successfulRunArchivesMoveCount,
            }
          : {}),
        ...(effect.followupRunOnEnd
          ? { followupRunOnEnd: effect.followupRunOnEnd }
          : {}),
        ...(effect.bypassFirstIce !== undefined
          ? { bypassFirstIce: effect.bypassFirstIce }
          : {}),
        ...(effect.runTraceLinkBonus !== undefined
          ? { runTraceLinkBonus: effect.runTraceLinkBonus }
          : {}),
        ...(effect.runTemporaryCredits !== undefined
          ? { runTemporaryCredits: effect.runTemporaryCredits }
          : {}),
        ...(effect.afterRunCompletedUnpreventableCoreDamage !== undefined
          ? {
              afterRunCompletedUnpreventableCoreDamage:
                effect.afterRunCompletedUnpreventableCoreDamage,
            }
          : {}),
        ...(effect.prohibitNoisyIcebreakers !== undefined
          ? { prohibitNoisyIcebreakers: effect.prohibitNoisyIcebreakers }
          : {}),
        ...(effect.eventApproachIceExposeBeforeRez !== undefined
          ? {
              eventApproachIceExposeBeforeRez:
                effect.eventApproachIceExposeBeforeRez,
            }
          : {}),
        ...(effect.runnerCreditGainOnCorpRez !== undefined
          ? { runnerCreditGainOnCorpRez: effect.runnerCreditGainOnCorpRez }
          : {}),
        ...(effect.damagePreventionPool !== undefined
          ? { damagePreventionPool: effect.damagePreventionPool }
          : {}),
        ...(effect.badPublicityRunAftermath !== undefined
          ? { badPublicityRunAftermath: effect.badPublicityRunAftermath }
          : {}),
      });
      mergePublicPayload(publicPayload, runResult.publicPayload);
      return true;
    }
    case "end_run": {
      assertPublicVisibility("end_run", effect.visibility);
      if (!context.endRun)
        throw new Error("end_run effect requires an endRun execution context.");
      const result = context.endRun(effect.successful);
      mergePublicPayload(publicPayload, result.publicPayload);
      return true;
    }
    case "mark_next_agenda_access_credit_gain": {
      assertPublicVisibility(
        "mark_next_agenda_access_credit_gain",
        effect.visibility,
      );
      state.runnerTurnFlags ??= {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      };
      state.runnerTurnFlags.nextAgendaAccessCreditGainPending = true;
      mergePublicPayload(publicPayload, {
        nextAgendaAccessCreditGainPending: true,
        nextAgendaAccessCreditGainAmount: effect.amount,
      });
      return true;
    }
    case "mark_next_agenda_access_agenda_point": {
      assertPublicVisibility(
        "mark_next_agenda_access_agenda_point",
        effect.visibility,
      );
      state.runnerTurnFlags ??= {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      };
      state.runnerTurnFlags.nextAgendaAccessAgendaPointPending = true;
      if (context.sourceDefinitionId)
        state.runnerTurnFlags.nextAgendaAccessAgendaPointSourceDefinitionId =
          context.sourceDefinitionId;
      if (context.sourceTitle)
        state.runnerTurnFlags.nextAgendaAccessAgendaPointSourceTitle = context.sourceTitle;
      mergePublicPayload(publicPayload, {
        nextAgendaAccessAgendaPointPending: true,
        agendaPointBonus: effect.amount,
      });
      return true;
    }
    case "make_run_each_data_fort_sequence": {
      assertPublicVisibility(
        "make_run_each_data_fort_sequence",
        effect.visibility,
      );
      if (!context.startRun)
        throw new Error(
          "make_run_each_data_fort_sequence requires a startRun context.",
        );
      const serverIds = dataFortServerIds(state);
      if (serverIds.length === 0) {
        mergePublicPayload(publicPayload, {
          multiServerSuccessSequenceNoDataForts: true,
        });
        return true;
      }
      const [firstServerId, ...pendingServerIds] = serverIds;
      const flags = (state.runnerTurnFlags ??= {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      });
      const sequence: MultiServerSuccessSequenceState = {
        kind: "multi_server_success_sequence",
        sequence: "run_each_data_fort",
        sourceCardId: context.sourceCardId,
        sourceDefinitionId: context.sourceDefinitionId ?? "card_implementation",
        sourceTitle: context.sourceTitle ?? "Sequenzquelle",
        pendingServerIds,
        successfulServerIds: [],
        onAllSuccessful: effect.onAllSuccessful,
        onAnyUnsuccessful: effect.onAnyUnsuccessful,
        advanceOnSuccessfulRun: true,
        failOnUnsuccessfulRun: true,
      };
      flags.pendingSequences = [
        ...(flags.pendingSequences ?? []).filter(
          (pending) => pending.kind !== sequence.kind,
        ),
        sequence,
      ];
      const runResult = context.startRun(firstServerId!, {
        activeSequence: sequence,
      });
      mergePublicPayload(publicPayload, runResult.publicPayload);
      mergePublicPayload(publicPayload, {
        multiServerSuccessSequenceStarted: true,
        multiServerSuccessSequenceServerCount: serverIds.length,
      });
      return true;
    }
    case "trash_rezzed_ice_on_last_successful_run_fort_and_add_tags": {
      assertPublicVisibility(
        "trash_rezzed_ice_on_last_successful_run_fort_and_add_tags",
        effect.visibility,
      );
      mergePublicPayload(publicPayload, {
        remoteServerTrashTagSequenceRequested: true,
        tagsAdded: effect.tagAmount,
      });
      return true;
    }
    case "pay_rez_cost_to_trash_rezzed_ice": {
      assertPublicVisibility(
        "pay_rez_cost_to_trash_rezzed_ice",
        effect.visibility,
      );
      if (effect.target !== "chosen_rezzed_ice")
        throw new Error("pay_rez_cost_to_trash_rezzed_ice target is invalid.");
      if (!context.startPayRezCostToTrashRezzedIceChoice)
        throw new Error(
          "pay_rez_cost_to_trash_rezzed_ice requires a choice context.",
        );
      const result = context.startPayRezCostToTrashRezzedIceChoice();
      mergePublicPayload(publicPayload, result.publicPayload);
      return true;
    }
    case "trash_unrezzed_ice": {
      assertPublicVisibility("trash_unrezzed_ice", effect.visibility);
      if (effect.target !== "chosen_unrezzed_ice")
        throw new Error("trash_unrezzed_ice target is invalid.");
      if (!context.startTrashUnrezzedIceChoice)
        throw new Error("trash_unrezzed_ice requires a choice context.");
      const result = context.startTrashUnrezzedIceChoice();
      mergePublicPayload(publicPayload, result.publicPayload);
      return true;
    }
    case "corp_choice_rez_or_trash_ice": {
      assertPublicVisibility("corp_choice_rez_or_trash_ice", effect.visibility);
      if (effect.target !== "chosen_installed_ice")
        throw new Error("corp_choice_rez_or_trash_ice target is invalid.");
      if (!context.startCorpChoiceRezOrTrashIceChoice)
        throw new Error(
          "corp_choice_rez_or_trash_ice requires a choice context.",
        );
      const result = context.startCorpChoiceRezOrTrashIceChoice();
      mergePublicPayload(publicPayload, result.publicPayload);
      return true;
    }
    default:
      return false;
  }
}
