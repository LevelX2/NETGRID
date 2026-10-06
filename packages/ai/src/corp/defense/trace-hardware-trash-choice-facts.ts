import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import {
  unresolvedChoiceFailure,
  type PendingChoice,
  type PendingChoiceOptions,
} from "../../runtime/plan-bound-choice-contract";

export const TRACE_HARDWARE_TRASH_SOURCE = "trace_success.hardware_wrecker:";

/** Current Engine bindings only. Target valuation belongs to the Defense owner. */
export function corpTraceHardwareTrashChoiceFacts(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  options: PendingChoiceOptions,
) {
  const fail = (reason: string): never => {
    throw unresolvedChoiceFailure(
      input,
      action,
      `corp.defend_servers: ${reason}`,
    );
  };
  const version = input.playerView.stateVersion;
  const requirement = action.choiceRequirements?.[0];
  if (
    input.side !== "corp" ||
    input.playerView.activeSide !== "corp" ||
    choice.side !== "corp" ||
    choice.kind !== "select_cards" ||
    choice.visibility !== "hidden_info_barrier" ||
    !choice.source.startsWith(TRACE_HARDWARE_TRASH_SOURCE) ||
    choice.stateVersion !== version ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    action.side !== "corp" ||
    action.type !== "resolve_choice" ||
    action.source !== "game_rule" ||
    action.timingPoint !== input.playerView.timingPoint ||
    action.expiresAtStateVersion !== version ||
    action.choiceRequirements?.length !== 1 ||
    requirement?.choiceId !== choice.choiceId ||
    requirement.minSelections !== 1 ||
    requirement.maxSelections !== 1
  )
    fail(
      "Preserve the current Engine hardware Choice, LegalAction, cardinality and state version.",
    );

  const traceId = choice.source.slice(TRACE_HARDWARE_TRASH_SOURCE.length);
  // This is the Engine trace-id protocol from encounter-printed-effects.ts,
  // not a card-name inference or a reconstruction from private GameState.
  const parts = /^(run_[0-9]+)\.(.+)\.([0-9]+)\.trace$/.exec(traceId);
  const subroutineIndex = parts ? Number(parts[3]) : NaN;
  if (
    !parts ||
    !Number.isSafeInteger(subroutineIndex) ||
    subroutineIndex < 0 ||
    String(subroutineIndex) !== parts[3] ||
    input.playerView.run !== undefined ||
    choice.choiceId !== `trace_hardware_wrecker_${traceId}_${version}`
  )
    fail(
      "Bind the completed ICE Trace to its exact native run, source, subroutine and Choice id.",
    );
  const runId = parts![1]!;
  const sourceIceInstanceId = parts![2]!;
  const locations = input.playerView.servers.flatMap((server) =>
    server.ice
      .filter((ice) => ice.instanceId === sourceIceInstanceId)
      .map((ice) => ({ serverId: server.id, ice })),
  );
  if (locations.length !== 1)
    fail(
      "Expose exactly one current own ICE source for the hardware Trace continuation.",
    );
  const { serverId, ice } = locations[0]!;
  const quote = ice.effectivePostRezRunQuote;
  // The current rez state selects its Engine authority. A still-rezzed
  // source has a current run quote; an Olivia-derezzed source requires the
  // fully bound current post-rez projection. Neither replaces a missing one.
  const runQuote =
    ice.rezzed === true
      ? ice.effectiveRunQuote
      : ice.rezzed === false && quote?.complete === true
        ? quote.effectiveRunQuote
        : undefined;
  const subroutine = runQuote?.subroutines[subroutineIndex];
  if (
    ice.known !== true ||
    ice.type !== "ice" ||
    ice.controller !== "corp" ||
    !ice.definitionId ||
    (ice.rezzed !== true && ice.rezzed !== false) ||
    (ice.rezzed === false &&
      (quote?.context !== "installed_post_rez" ||
        quote.complete !== true ||
        quote.expiresAtStateVersion !== version ||
        quote.cardId !== sourceIceInstanceId ||
        quote.iceDefinitionId !== ice.definitionId ||
        quote.targetServerId !== serverId ||
        quote.projectedServerId !== serverId)) ||
    runQuote?.iceInstanceId !== sourceIceInstanceId ||
    runQuote.iceDefinitionId !== ice.definitionId ||
    subroutine?.type !== "initiate_trace" ||
    subroutine.traceSuccessEffect?.type !==
      "end_run_trash_hardware_and_unpreventable_meat_damage" ||
    !knownNonNegativeInteger(subroutine.traceSuccessEffect.amount) ||
    subroutine.traceSuccessEffect.amount === 0
  )
    fail(
      "Supply the exact current Engine quote for the explicit source rez state and its hardware-trash Trace effect.",
    );
  const event = input.eventTail.at(-1);
  if (
    event?.stateVersionAfter !== version ||
    event.publicPayload.actor !== "runner" ||
    event.publicPayload.traceStep !== "runner_bid" ||
    event.publicPayload.sourceDefinitionId !== ice.definitionId
  )
    fail(
      "Preserve the public Runner-bid event that opened this exact hardware Choice.",
    );

  const hardware = (input.playerView.opponent.rig ?? []).filter(
    (card) => card.type === "hardware",
  );
  if (
    options.length === 0 ||
    hardware.length !== options.length ||
    requirement!.optionIds.length !== options.length ||
    new Set(requirement!.optionIds).size !== options.length ||
    new Set(options.map((option) => option.id)).size !== options.length ||
    new Set(hardware.map((card) => card.instanceId)).size !== hardware.length ||
    options.length !==
      choice.options.filter((option) => option.selectable !== false).length
  )
    fail(
      "Expose the complete unique public hardware target set and exact Engine option set.",
    );
  const targets = options.map((option) => {
    const card = hardware.find(
      (candidate) => candidate.instanceId === option.value,
    );
    if (
      option.selectable === false ||
      typeof option.value !== "string" ||
      option.id !== `hardware_${option.value}` ||
      !requirement!.optionIds.includes(option.id) ||
      !choice.options.some(
        (current) =>
          current.id === option.id &&
          current.value === option.value &&
          current.selectable !== false,
      ) ||
      !card ||
      card.known !== true ||
      card.controller !== "runner" ||
      !card.definitionId ||
      !knownNonNegativeInteger(card.installCost) ||
      !Object.values(card.counters ?? {}).every(knownNonNegativeInteger)
    )
      fail(
        "Bind every hardware option to known installed Runner hardware with complete public cost and counters.",
      );
    return { optionId: option.id, card: card as VisibleCard };
  });
  if (
    new Set(targets.map((target) => target.card.instanceId)).size !==
    targets.length
  )
    fail("Hardware options must name distinct installed Runner cards.");
  return {
    traceId,
    runId,
    sourceIceInstanceId,
    sourceDefinitionId: ice.definitionId!,
    subroutineIndex,
    serverId,
    targets,
  };
}

function knownNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
