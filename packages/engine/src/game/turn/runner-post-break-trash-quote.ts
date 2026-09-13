import type { GameState, LegalAction } from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { rezCostForCard } from "../payment/corp-rez-cost";

/** Current public targets and controller-owned sources, never future actions. */
export function withRunnerPostBreakTrashQuote(
  state: GameState,
  action: LegalAction,
): LegalAction {
  if (state.run || action.side !== "runner" || action.type !== "start_run")
    return action;
  const server = state.corp.servers.find(
    (entry) => entry.id === action.payload?.serverId,
  );
  if (!server) return action;
  const sources = [...state.runner.grip, ...state.runner.rig.programs].flatMap(
    (id) => {
      const card = state.cardInstances[id];
      if (!card) throw new Error("post_break_trash_quote_missing_source");
      const ability = cardImplementationForDefinitionId(
        card.definitionId,
      )?.runnerUtilityLongtail;
      return ability?.kind === "trash_fully_broken_passed_ice"
        ? [
            {
              sourceCardInstanceId: id,
              sourceDefinitionId: card.definitionId,
              installed: state.runner.rig.programs.includes(id),
            },
          ]
        : [];
    },
  );
  if (sources.length === 0) return action;
  const targets = server.ice.flatMap((id) => {
    const card = state.cardInstances[id];
    if (!card) throw new Error("post_break_trash_quote_missing_ice");
    return card.rezzed === true
      ? [
          {
            targetIceInstanceId: id,
            targetDefinitionId: card.definitionId,
            trashCredits: rezCostForCard(state, id),
          },
        ]
      : [];
  });
  if (targets.length === 0) return action;
  return {
    ...action,
    payload: {
      ...action.payload,
      runnerPostBreakTrashQuoteJson: JSON.stringify({
        schemaVersion: "runner-post-break-trash-quote-v1",
        stateVersion: state.stateVersion,
        actionId: action.actionId,
        serverId: server.id,
        sources,
        targets,
      }),
    },
  };
}
