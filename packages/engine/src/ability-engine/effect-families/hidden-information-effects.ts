import type { MultiServerSuccessSequenceState } from "@netgrid/shared";
import type { CardEffectFamilyInput } from "./family-runtime";

export function executeHiddenInformationEffect(
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
    case "corp_choice_derez_last_rezzed_black_ice_or_bad_publicity": {
      assertPublicVisibility(
        "corp_choice_derez_last_rezzed_black_ice_or_bad_publicity",
        effect.visibility,
      );
      if (effect.badPublicity !== 2)
        throw new Error(
          "Senatorial Field Trip Bad-Publicity amount is invalid.",
        );
      if (!context.startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice)
        throw new Error(
          "corp_choice_derez_last_rezzed_black_ice_or_bad_publicity requires a choice context.",
        );
      const result =
        context.startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice();
      mergePublicPayload(publicPayload, result.publicPayload);
      return true;
    }
    case "private_look": {
      if (effect.visibility !== "hidden_info_barrier")
        throw new Error("private_look visibility must be hidden_info_barrier.");
      if (!context.startPrivateLook)
        throw new Error(
          "private_look effect requires a startPrivateLook execution context.",
        );
      if (effect.zone !== "rd" && effect.zone !== "hq")
        throw new Error("private_look supports only R&D and HQ.");
      if (
        effect.count !== "all" &&
        (!Number.isInteger(effect.count) || effect.count <= 0)
      )
        throw new Error("private_look count must be positive or all.");
      const lookResult = context.startPrivateLook(effect.zone, effect.count);
      mergePublicPayload(publicPayload, lookResult.publicPayload);
      return true;
    }
    case "expose_installed_card": {
      assertPublicVisibility("expose_installed_card", effect.visibility);
      if (effect.target !== "chosen_installed_corp_card")
        throw new Error(
          "expose_installed_card target must be chosen_installed_corp_card.",
        );
      if (
        effect.scope !== "inside_data_fort" &&
        effect.scope !== "any_installed"
      )
        throw new Error(
          "expose_installed_card scope must be inside_data_fort or any_installed.",
        );
      if (!context.exposeInstalledCard)
        throw new Error(
          "expose_installed_card requires an exposeInstalledCard execution context.",
        );
      const exposeResult = context.exposeInstalledCard(effect.scope);
      mergePublicPayload(publicPayload, exposeResult.publicPayload);
      return true;
    }
    case "expose_installed_cards": {
      assertPublicVisibility("expose_installed_cards", effect.visibility);
      if (effect.targets !== "chosen_installed_corp_cards")
        throw new Error(
          "expose_installed_cards targets must be chosen_installed_corp_cards.",
        );
      if (
        !Number.isInteger(effect.min) ||
        !Number.isInteger(effect.max) ||
        effect.min < 0 ||
        effect.max < effect.min
      )
        throw new Error("expose_installed_cards min/max are invalid.");
      if (!context.startExposeInstalledCards)
        throw new Error(
          "expose_installed_cards requires a startExposeInstalledCards execution context.",
        );
      const exposeResult = context.startExposeInstalledCards(
        effect.min,
        effect.max,
        effect.scope,
      );
      mergePublicPayload(publicPayload, exposeResult.publicPayload);
      return true;
    }
    case "expose_outermost_ice_each_fort": {
      assertPublicVisibility(
        "expose_outermost_ice_each_fort",
        effect.visibility,
      );
      if (!context.exposeOutermostIceEachFort)
        throw new Error(
          "expose_outermost_ice_each_fort requires an exposeOutermostIceEachFort execution context.",
        );
      const exposeResult = context.exposeOutermostIceEachFort();
      mergePublicPayload(publicPayload, exposeResult.publicPayload);
      return true;
    }
    case "show_hq_agendas_for_credits": {
      if (effect.visibility !== "hidden_info_barrier")
        throw new Error(
          "show_hq_agendas_for_credits visibility must be hidden_info_barrier.",
        );
      assertPositiveIntegerAmount(
        "show_hq_agendas_for_credits",
        effect.creditPerAgenda,
      );
      if (!context.startShowHqAgendasForCredits)
        throw new Error(
          "show_hq_agendas_for_credits requires a startShowHqAgendasForCredits execution context.",
        );
      const revealResult = context.startShowHqAgendasForCredits(
        effect.creditPerAgenda,
      );
      mergePublicPayload(publicPayload, revealResult.publicPayload);
      return true;
    }
    case "search_trash_to_grip": {
      if (effect.visibility !== "hidden_info_barrier")
        throw new Error(
          "search_trash_to_grip visibility must be hidden_info_barrier.",
        );
      if (effect.filter !== "program" && effect.filter !== "any_card")
        throw new Error("search_trash_to_grip filter is invalid.");
      if (!context.startSearchTrashToGrip)
        throw new Error(
          "search_trash_to_grip requires a startSearchTrashToGrip execution context.",
        );
      const searchResult = context.startSearchTrashToGrip(effect.filter);
      mergePublicPayload(publicPayload, searchResult.publicPayload);
      return true;
    }
    default:
      return false;
  }
}
