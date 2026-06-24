import type { CardEffectFamilyInput } from "./family-runtime";

export function executeSearchRunEffect(
  input: CardEffectFamilyInput,
): boolean {
  const { context, effect, publicPayload, runtime } = input;
  const { mergePublicPayload } = runtime;

  switch (effect.kind) {
    case "search_stack_to_grip": {
      if (effect.visibility !== "hidden_info_barrier")
        throw new Error(
          "search_stack_to_grip visibility must be hidden_info_barrier.",
        );
      if (effect.filter !== "program" && effect.filter !== "any_card")
        throw new Error("search_stack_to_grip filter is invalid.");
      if (effect.shuffleAfterwards !== true)
        throw new Error("search_stack_to_grip must shuffle afterwards.");
      if (!context.startSearchStackToGrip)
        throw new Error(
          "search_stack_to_grip requires a startSearchStackToGrip execution context.",
        );
      const searchResult = context.startSearchStackToGrip(
        effect.filter,
        effect.revealToCorp,
        effect.shuffleAfterwards,
      );
      mergePublicPayload(publicPayload, searchResult.publicPayload);
      return true;
    }
    case "move_top_trash_to_grip": {
      if (effect.visibility !== "hidden_info_barrier")
        throw new Error(
          "move_top_trash_to_grip visibility must be hidden_info_barrier.",
        );
      if (effect.recipient !== "runner")
        throw new Error("move_top_trash_to_grip recipient must be runner.");
      if (!context.moveTopTrashToGrip)
        throw new Error(
          "move_top_trash_to_grip requires a moveTopTrashToGrip execution context.",
        );
      const moveResult = context.moveTopTrashToGrip();
      mergePublicPayload(publicPayload, moveResult.publicPayload);
      return true;
    }
    case "search_stack_install": {
      if (effect.visibility !== "hidden_info_barrier")
        throw new Error(
          "search_stack_install visibility must be hidden_info_barrier.",
        );
      if (effect.filter !== "program")
        throw new Error("search_stack_install supports only program filter.");
      if (effect.installCost !== "normal" && effect.installCost !== "free")
        throw new Error("search_stack_install installCost is invalid.");
      if (effect.shuffleAfterwards !== true)
        throw new Error("search_stack_install must shuffle afterwards.");
      if (!context.startSearchStackInstall)
        throw new Error(
          "search_stack_install requires a startSearchStackInstall execution context.",
        );
      const searchResult = context.startSearchStackInstall(
        effect.filter,
        effect.installCost,
        effect.shuffleAfterwards,
      );
      mergePublicPayload(publicPayload, searchResult.publicPayload);
      return true;
    }
    case "add_current_run_access_count": {
      if (effect.visibility !== "hidden_info_barrier")
        throw new Error(
          "add_current_run_access_count visibility must be hidden_info_barrier.",
        );
      if (effect.server !== "hq" && effect.server !== "rd")
        throw new Error("add_current_run_access_count server is invalid.");
      if (!Number.isInteger(effect.amount) || effect.amount <= 0)
        throw new Error("add_current_run_access_count amount is invalid.");
      if (!context.addCurrentRunAccessCount)
        throw new Error(
          "add_current_run_access_count requires a run access execution context.",
        );
      const accessResult = context.addCurrentRunAccessCount(
        effect.server,
        effect.amount,
      );
      mergePublicPayload(publicPayload, accessResult.publicPayload);
      return true;
    }
    case "pass_current_encountered_ice": {
      if (effect.visibility !== "public")
        throw new Error(
          "pass_current_encountered_ice visibility must be public.",
        );
      if (
        effect.subtypeRequired !== undefined &&
        effect.subtypeRequired !== "ap"
      )
        throw new Error("pass_current_encountered_ice subtype is invalid.");
      if (!context.passCurrentEncounteredIce)
        throw new Error(
          "pass_current_encountered_ice requires an encounter execution context.",
        );
      const passResult = context.passCurrentEncounteredIce(
        effect.subtypeRequired,
      );
      mergePublicPayload(publicPayload, passResult.publicPayload);
      return true;
    }
    case "choose_stack_or_trash_program_install": {
      if (effect.visibility !== "hidden_info_barrier")
        throw new Error(
          "choose_stack_or_trash_program_install visibility must be hidden_info_barrier.",
        );
      if (
        effect.installCost !== "free" ||
        effect.shuffleStackIfSearched !== true ||
        effect.returnInstalledCardToGripAtEndOfTurn !== true
      )
        throw new Error(
          "choose_stack_or_trash_program_install supports only free temporary program installs.",
        );
      if (!context.startChooseStackOrTrashProgramInstall)
        throw new Error(
          "choose_stack_or_trash_program_install requires a host choice context.",
        );
      const choiceResult = context.startChooseStackOrTrashProgramInstall(
        effect.installCost,
        effect.shuffleStackIfSearched,
        effect.returnInstalledCardToGripAtEndOfTurn,
      );
      mergePublicPayload(publicPayload, choiceResult.publicPayload);
      return true;
    }
    default:
      return false;
  }
}
