import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { RunnerRemoteContestSignal } from "../../plans/runner-tactical-plan-contracts";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";

export type RemoteExposeChoiceBinding = NonNullable<
  RunnerRemoteContestSignal["remoteExposePreparation"]
> & { family: "runner_remote_expose"; serverId: string };

export function selectedRunnerRemoteExposeChoiceOptionIds(
  input: AiDecisionInput,
  action: LegalAction,
  choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>,
  options: NonNullable<
    AiDecisionInput["playerView"]["pendingChoice"]
  >["options"],
): string[] | undefined {
  const prefix = "p3_36.expose_installed_card:";
  if (!choice.source.startsWith(prefix)) return undefined;
  const source = choice.source.slice(prefix.length).split(":");
  const portfolio = residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.executionState === "executor" &&
      instance.moduleId === "runner.contest_remote",
  );
  const state = executor?.moduleState as
    | {
        kind?: string;
        remoteExposeChoice?: RemoteExposeChoiceBinding;
      }
    | undefined;
  const bound = state?.remoteExposeChoice;
  // Played information events retain their own existing choice contract.
  // A resident Remote binding must still reject a contradictory source.
  if (
    !bound &&
    !(input.playerView.own.rig ?? []).some((c) => c.instanceId === source[0])
  )
    return undefined;
  const target = input.playerView.servers.find((s) => s.id === bound?.serverId)
    ?.root[bound?.targetRootIndex ?? -1];
  const requirement = action.choiceRequirements?.find(
    (r) => r.choiceId === choice.choiceId,
  );
  const exact =
    input.side === "runner" &&
    action.side === "runner" &&
    action.type === "resolve_choice" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    choice.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    requirement?.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    state?.kind === "remote_contest" &&
    bound?.family === "runner_remote_expose" &&
    bound.observedAtStateVersion === portfolio?.stateVersion &&
    bound.observedAtStateVersion + 1 === input.playerView.stateVersion &&
    source[0] === bound.sourceCardInstanceId &&
    source[1] === bound.sourceDefinitionId &&
    Number(source.at(-1)) === input.playerView.stateVersion &&
    target?.instanceId === bound.targetCardInstanceId &&
    target.known === false;
  if (!exact || !bound || !requirement)
    throw failure(input, action, executor?.instanceId);
  const selected = options.filter(
    (option) =>
      requirement.optionIds.includes(option.id) &&
      (option.id === `card_${bound.targetCardInstanceId}` ||
        option.value === bound.targetCardInstanceId),
  );
  if (selected.length !== 1) throw failure(input, action, executor?.instanceId);
  return [selected[0]!.id];
}

function failure(
  input: AiDecisionInput,
  action: LegalAction,
  planInstanceId?: string,
) {
  return new PlanResolutionFailure("window_origin_missing", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((a) => a.type),
    unresolvedActionIds: [action.actionId],
    owner: "continuation",
    ...(planInstanceId ? { planInstanceId } : {}),
    removalCondition:
      "Bind the single-card expose choice to the selected Remote executor, exact source action, side-safe root position and current native option; do not choose another target in the resolver.",
  });
}
