import { type CorpDefenseSignal } from "../../plans/corp-defense-contracts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  type EngineWindowResolution,
  type PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { corpIceEffectsOnlyReachFutureEncounters } from "../../runtime/semantic-runtime-corp-effective-defense";
import { turnKey } from "../../runtime/runtime-identifiers";
import {
  currentDelayedSuccessChoice,
  preferUnbreakableEquivalentTemporaryIce,
} from "./temporary-ice-choice";

export function resolvePlanBoundCorpDelayedSuccessChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  if (
    context.input.side !== "corp" ||
    !choice?.source.startsWith("p3_54.delayed_success:")
  ) {
    return undefined;
  }
  const choiceActions = context.input.legalActions.filter(
    (action) => action.type === "resolve_choice",
  );
  const action = choiceActions.length === 1 ? choiceActions[0] : undefined;
  const binding = action
    ? currentDelayedSuccessChoice(context.input, action, choice)
    : undefined;
  const { sourceCardId, serverId, options = [] } = binding ?? {};
  const executor = previous?.instances.find(
    (instance) =>
      instance.moduleId === "corp.defend_servers" &&
      instance.side === "corp" &&
      instance.instanceId ===
        "plan:corp.defend_servers:server-defense-portfolio",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signals?: CorpDefenseSignal[];
        hqHoldCadence?: { turnKey?: unknown };
        delayedSuccessChoiceBinding?: {
          choiceId: string;
          actionId: string;
          selectedOptionId: string;
          sourceCardInstanceId: string;
          serverId: string;
          observedAtStateVersion: number;
        };
      }
    | undefined;
  const sourceCard = sourceCardId
    ? context.input.playerView.servers
        .flatMap((server) => server.root)
        .find(
          (card) =>
            card.instanceId === sourceCardId &&
            card.known &&
            card.definitionId === "onr_v1_358_dr-dreff" &&
            card.rezzed === true,
        )
    : undefined;
  const sourceServer =
    sourceCard && serverId
      ? context.input.playerView.servers.find(
          (server) =>
            server.id === serverId && server.root.includes(sourceCard),
        )
      : undefined;
  const decline = options.find(
    (option) => option.id === "decline" && option.value === "decline",
  );
  const iceOptions = options.filter(
    (option) =>
      option.id.startsWith("ice_") &&
      typeof option.value === "string" &&
      option.id === `ice_${option.value}` &&
      context.input.playerView.own.gripOrHq.some(
        (card) =>
          card.instanceId === option.value && card.known && card.type === "ice",
      ),
  );
  const pricedIceOptions = iceOptions
    .map((option) => ({
      option,
      creditCost: delayedSuccessOptionCreditCost(option.metadata),
    }))
    .filter(
      (
        entry,
      ): entry is { option: (typeof iceOptions)[number]; creditCost: number } =>
        entry.creditCost !== undefined &&
        entry.creditCost <= context.input.playerView.own.credits,
    )
    .sort(
      (left, right) =>
        left.creditCost - right.creditCost ||
        left.option.id.localeCompare(right.option.id),
    );
  const exactEffectFacts = iceOptions.every(
    (option) =>
      delayedSuccessOptionHasCurrentEffect(option.metadata) !== undefined,
  );
  const productiveIceOptions = pricedIceOptions.filter(
    (entry) =>
      delayedSuccessOptionHasCurrentEffect(entry.option.metadata) === true,
  );
  const preference =
    productiveIceOptions.length > 0
      ? preferUnbreakableEquivalentTemporaryIce(
          context.input,
          productiveIceOptions.map((entry) => entry.option),
        )
      : null;
  const selectedOption = preference === null ? decline : preference;
  const currentEventTail = (context.input.eventTail ?? []).filter(
    (event) => event.stateVersionAfter <= context.input.playerView.stateVersion,
  );
  const activeRunId = context.input.playerView.run?.runId;
  const reactiveRunStartEvent = currentEventTail.find((event) => {
    if (event.publicPayload?.actor !== "runner") return false;
    if (
      typeof activeRunId !== "string" ||
      activeRunId !== `run_${event.stateVersionAfter}`
    ) {
      return false;
    }
    if (
      event.publicPayload?.actionType === "start_run" &&
      event.publicPayload?.serverId === serverId
    ) {
      return true;
    }
    return (
      event.publicPayload?.actionType === "play_event" ||
      event.publicPayload?.actionType === "activated_card_ability" ||
      event.publicPayload?.actionType === "trigger_ability"
    );
  });
  const reactiveRunStartIndex = reactiveRunStartEvent
    ? currentEventTail.indexOf(reactiveRunStartEvent)
    : -1;
  const reactiveTurnAnchor =
    reactiveRunStartIndex > 0
      ? currentEventTail
          .slice(0, reactiveRunStartIndex)
          .reverse()
          .find(
            (event) =>
              event.publicPayload?.actor === "corp" &&
              event.publicPayload?.actionType === "end_turn",
          )
      : undefined;
  const continuationEvents = previous
    ? currentEventTail.filter(
        (event) => event.stateVersionBefore >= previous.stateVersion,
      )
    : [];
  const firstContinuationEvent = continuationEvents[0];
  const matchingRunStartIndex = continuationEvents.findIndex(
    (event) =>
      event.publicPayload?.actor === "runner" &&
      event.publicPayload?.actionType === "start_run" &&
      event.publicPayload?.serverId === serverId,
  );
  const exactContinuationChain =
    previous !== undefined &&
    continuationEvents.length >= 2 &&
    firstContinuationEvent?.stateVersionBefore === previous.stateVersion &&
    continuationEvents.every(
      (event, index) =>
        event.stateVersionAfter === event.stateVersionBefore + 1 &&
        (index === 0 ||
          continuationEvents[index - 1]?.stateVersionAfter ===
            event.stateVersionBefore),
    ) &&
    continuationEvents.at(-1)?.stateVersionAfter ===
      context.input.playerView.stateVersion;
  const exactExplicitRunChain =
    exactContinuationChain &&
    firstContinuationEvent.publicPayload?.actor === "corp" &&
    firstContinuationEvent.publicPayload?.actionType === "end_turn" &&
    matchingRunStartIndex >= 1 &&
    continuationEvents.slice(matchingRunStartIndex).every((event) => {
      const actor = event.publicPayload?.actor;
      const actionType = event.publicPayload?.actionType;
      return actor === "runner"
        ? actionType === "start_run" || actionType === "continue_run"
        : actor === "corp" &&
            (actionType === "rez_ice" ||
              actionType === "rez_card" ||
              actionType === "decline_rez");
    });
  const exactReactiveRunChain =
    exactContinuationChain &&
    previous !== undefined &&
    reactiveTurnAnchor !== undefined &&
    reactiveRunStartEvent !== undefined &&
    previous.stateVersion >= reactiveTurnAnchor.stateVersionBefore &&
    previous.stateVersion < reactiveRunStartEvent.stateVersionAfter &&
    reactiveTurnAnchor.publicPayload?.actor === "corp" &&
    reactiveTurnAnchor.publicPayload?.actionType === "end_turn" &&
    context.input.playerView.run?.attackedServerId === serverId;
  const exactActiveDefenseOrigin =
    previous !== undefined &&
    executor !== undefined &&
    previous.rootForegroundInstanceId === executor.instanceId &&
    previous.executorInstanceId === executor.instanceId &&
    executor.executionState === "executor" &&
    moduleState?.kind === "defense" &&
    moduleState.hqHoldCadence?.turnKey === turnKey(context.input) &&
    moduleState.signals?.some((signal) => signal.serverId === serverId) ===
      true;
  const delayedSuccessFailedChecks = [
    ["choice_contract", binding !== undefined],
    ["source_card", sourceCard !== undefined],
    ["source_server", sourceServer !== undefined],
    ["decline", decline !== undefined],
    ["selected_option", selectedOption !== undefined],
    ["exact_effect_facts", exactEffectFacts],
    ["priced_options", pricedIceOptions.length === iceOptions.length],
    ["ice_options", iceOptions.length > 0],
    ["option_set", iceOptions.length === options.length - 1],
    ["previous", previous !== undefined && previous.side === "corp"],
    [
      "previous_state",
      previous !== undefined &&
        previous.stateVersion < context.input.playerView.stateVersion,
    ],
    [
      "plan_origin",
      exactExplicitRunChain ||
        exactReactiveRunChain ||
        exactActiveDefenseOrigin,
    ],
    ["defense_owner", executor !== undefined],
    ["defense_state", moduleState?.kind === "defense"],
  ]
    .filter(([, valid]) => !valid)
    .map(([name]) => name)
    .join(",");
  if (
    delayedSuccessFailedChecks.length > 0 ||
    !action ||
    !executor ||
    !moduleState ||
    !selectedOption ||
    !sourceCard ||
    !serverId
  ) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: choiceActions.map(
        (legalAction) => legalAction.actionId,
      ),
      owner: "continuation",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
      removalCondition: `Failed=${delayedSuccessFailedChecks || "unknown"}. Require the current Dr. Dreff choice, rezzed source on the attacked server, Defense plan origin and exact effect facts for all offered options.`,
    });
  }
  moduleState.delayedSuccessChoiceBinding = {
    choiceId: choice.choiceId,
    actionId: action.actionId,
    selectedOptionId: selectedOption.id,
    sourceCardInstanceId: sourceCard.instanceId,
    serverId,
    observedAtStateVersion: context.input.playerView.stateVersion,
  };
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_corp_delayed_success_choice",
    origin: {
      rootPlanInstanceId: executor.instanceId,
      leafPlanInstanceId: executor.instanceId,
      side: "corp",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}

function delayedSuccessOptionCreditCost(metadata: unknown): number | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const creditCost = (metadata as { creditCost?: unknown }).creditCost;
  return typeof creditCost === "number" &&
    Number.isSafeInteger(creditCost) &&
    creditCost >= 0
    ? creditCost
    : undefined;
}

function delayedSuccessOptionHasCurrentEffect(
  metadata: unknown,
): boolean | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const facts = metadata as Record<string, unknown>;
  const types = facts.temporaryEncounterSubroutineTypes;
  const additional = facts.temporaryEncounterHasAdditionalMechanics;
  if (
    !Array.isArray(types) ||
    !types.every((type) => typeof type === "string") ||
    typeof additional !== "boolean"
  )
    return undefined;
  return (
    additional ||
    (types.length > 0 && !corpIceEffectsOnlyReachFutureEncounters(types))
  );
}
