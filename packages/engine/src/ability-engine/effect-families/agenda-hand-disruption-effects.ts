import type { CardEffectFamilyInput } from "./family-runtime";

export function executeAgendaHandDisruptionEffect(
  input: CardEffectFamilyInput,
): boolean {
  const { context, effect, publicPayload, runtime } = input;
  const {
    assertPositiveIntegerAmount,
    assertPublicVisibility,
    mergePublicPayload,
  } = runtime;

  switch (effect.kind) {
    case "gain_runner_event_agenda_point": {
      assertPublicVisibility(
        "gain_runner_event_agenda_point",
        effect.visibility,
      );
      if (effect.amount !== 1)
        throw new Error(
          "gain_runner_event_agenda_point supports only amount 1.",
        );
      if (!context.gainRunnerEventAgendaPoint)
        throw new Error(
          "gain_runner_event_agenda_point requires an agenda-point context.",
        );
      const result = context.gainRunnerEventAgendaPoint(effect.amount);
      mergePublicPayload(publicPayload, result.publicPayload);
      return true;
    }
    case "gain_runner_event_agenda_point_if_liberated_agenda_subtype": {
      assertPublicVisibility(
        "gain_runner_event_agenda_point_if_liberated_agenda_subtype",
        effect.visibility,
      );
      if (effect.amount !== 1 || effect.subtype !== "black_ops")
        throw new Error(
          "gain_runner_event_agenda_point_if_liberated_agenda_subtype supports only Black Ops amount 1.",
        );
      if (!context.runnerLiberatedAgendaSubtypeThisTurn)
        throw new Error(
          "gain_runner_event_agenda_point_if_liberated_agenda_subtype requires a history context.",
        );
      if (!context.runnerLiberatedAgendaSubtypeThisTurn(effect.subtype)) {
        publicPayload.agendaPointsGained = 0;
        return true;
      }
      if (!context.gainRunnerEventAgendaPoint)
        throw new Error(
          "gain_runner_event_agenda_point_if_liberated_agenda_subtype requires an agenda-point context.",
        );
      const result = context.gainRunnerEventAgendaPoint(effect.amount);
      mergePublicPayload(publicPayload, result.publicPayload);
      return true;
    }
    case "corp_random_discard_from_hq": {
      assertPositiveIntegerAmount("corp_random_discard_from_hq", effect.count);
      if (effect.visibility !== "hidden_info_barrier")
        throw new Error(
          "corp_random_discard_from_hq visibility must be hidden_info_barrier.",
        );
      if (!context.corpRandomDiscardFromHq)
        throw new Error(
          "corp_random_discard_from_hq requires a random-discard context.",
        );
      const result = context.corpRandomDiscardFromHq(effect.count);
      mergePublicPayload(publicPayload, result.publicPayload);
      return true;
    }
    case "corp_discard_hq_with_retain_payment": {
      assertPositiveIntegerAmount(
        "corp_discard_hq_with_retain_payment",
        effect.retainCostPerCard,
      );
      if (effect.visibility !== "hidden_info_barrier")
        throw new Error(
          "corp_discard_hq_with_retain_payment visibility must be hidden_info_barrier.",
        );
      if (!context.startCorpDiscardHqWithRetainPayment)
        throw new Error(
          "corp_discard_hq_with_retain_payment requires a hidden choice context.",
        );
      const result = context.startCorpDiscardHqWithRetainPayment(
        effect.retainCostPerCard,
      );
      mergePublicPayload(publicPayload, result.publicPayload);
      return true;
    }
    case "derez_rezzed_black_ice": {
      assertPublicVisibility("derez_rezzed_black_ice", effect.visibility);
      if (effect.target !== "chosen_rezzed_black_ice")
        throw new Error("derez_rezzed_black_ice target is invalid.");
      if (!context.startDerezRezzedBlackIceChoice)
        throw new Error(
          "derez_rezzed_black_ice requires a target choice context.",
        );
      const result = context.startDerezRezzedBlackIceChoice();
      mergePublicPayload(publicPayload, result.publicPayload);
      return true;
    }
    default:
      return false;
  }
}
