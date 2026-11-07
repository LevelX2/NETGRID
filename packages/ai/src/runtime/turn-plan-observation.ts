import type {
  EngineRandomizedIceInstallSelectionCommand,
  EngineRandomizedIceInstallSelectionReceipt,
  EngineRandomizedTraceBidSelectionCommand,
  EngineRandomizedTraceBidSelectionReceipt,
  EngineRandomizedTurnPlanSelectionCommand,
  EngineRandomizedTurnPlanSelectionReceipt,
  GameEvent,
  LegalAction,
  PlayerAction,
  Side,
} from "@netgrid/shared";
import {
  bindTurnPlanChoices,
  canonicalTurnPlanningSerialize,
  type ObservedTurnPlanAction,
} from "../plans/turn-planning-contracts";

type RandomizedCommand =
  | EngineRandomizedTurnPlanSelectionCommand
  | EngineRandomizedIceInstallSelectionCommand
  | EngineRandomizedTraceBidSelectionCommand;

type RandomizedReceipt =
  | EngineRandomizedTurnPlanSelectionReceipt
  | EngineRandomizedIceInstallSelectionReceipt
  | EngineRandomizedTraceBidSelectionReceipt;

/** Reads the latest successful transition at the Engine-to-AI input boundary. */
export function observeTurnPlanAction(params: {
  matchId: string;
  side: Side;
  stateVersion: number;
  event: GameEvent | undefined;
}): ObservedTurnPlanAction | undefined {
  const { event, matchId, side, stateVersion } = params;
  if (
    !event ||
    event.stateVersionAfter !== stateVersion ||
    event.stateVersionBefore + 1 !== stateVersion ||
    event.publicPayload.actor !== side
  )
    return undefined;
  const privatePayload = event.privatePayload?.[side];
  const legalAction = privatePayload?.legalAction as LegalAction | undefined;
  const command = privatePayload?.action as
    | PlayerAction
    | RandomizedCommand
    | undefined;
  if (
    !legalAction ||
    !command ||
    typeof command !== "object" ||
    legalAction.side !== side ||
    legalAction.expiresAtStateVersion !== event.stateVersionBefore
  )
    return undefined;

  const binding = {
    matchId,
    side,
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: stateVersion,
  };
  const applied =
    "kind" in command
      ? randomizedAppliedAction(command, privatePayload!, binding, legalAction)
      : command;
  if (
    !applied ||
    applied.matchId !== matchId ||
    applied.side !== side ||
    applied.clientKnownStateVersion !== binding.stateVersionBefore ||
    applied.actionId !== legalAction.actionId
  )
    return undefined;
  const boundChoices = bindTurnPlanChoices(
    legalAction,
    applied.selectedChoices,
  );
  if (!boundChoices) return undefined;
  return {
    ...binding,
    actionId: legalAction.actionId,
    actionType: legalAction.type,
    source: legalAction.source,
    boundChoices,
    ...(applied.selectedTargets
      ? { selectedTargets: { ...applied.selectedTargets } }
      : {}),
  };
}

function randomizedAppliedAction(
  command: RandomizedCommand,
  privatePayload: Readonly<Record<string, unknown>>,
  binding: Pick<
    ObservedTurnPlanAction,
    "matchId" | "side" | "stateVersionBefore" | "stateVersionAfter"
  >,
  legalAction: LegalAction,
): PlayerAction | undefined {
  const receipt = randomizedReceipt(command, privatePayload);
  const quote = command.quote;
  if (
    !receipt ||
    !quote ||
    receipt.visibility !== "private_to_actor" ||
    receipt.schemaVersion !== quote.schemaVersion ||
    receipt.matchId !== binding.matchId ||
    receipt.side !== binding.side ||
    receipt.stateVersionBefore !== binding.stateVersionBefore ||
    receipt.stateVersionAfter !== binding.stateVersionAfter ||
    quote.matchId !== binding.matchId ||
    quote.side !== binding.side ||
    quote.stateVersion !== binding.stateVersionBefore ||
    quote.timingPoint !== legalAction.timingPoint ||
    receipt.timingPoint !== legalAction.timingPoint ||
    receipt.candidateFingerprint !== quote.candidateFingerprint ||
    receipt.selectedLegalAction?.actionId !== legalAction.actionId ||
    receipt.selectedLegalAction.type !== legalAction.type ||
    !receipt.selectedCandidate ||
    !Array.isArray(quote.candidates) ||
    !quote.candidates.some(
      (candidate) =>
        canonicalTurnPlanningSerialize(candidate) ===
        canonicalTurnPlanningSerialize(receipt.selectedCandidate),
    )
  )
    return undefined;

  const action: PlayerAction = {
    matchId: binding.matchId,
    side: binding.side,
    actionId: legalAction.actionId,
    clientKnownStateVersion: binding.stateVersionBefore,
  };
  if ("choiceId" in receipt) {
    if (
      command.kind !== "engine_randomized_trace_bid_selection" ||
      command.quote.choiceId !== receipt.choiceId ||
      command.quote.planStepId !== receipt.planStepId ||
      receipt.actionId !== legalAction.actionId
    )
      return undefined;
    action.selectedChoices = {
      choiceId: receipt.choiceId,
      selectedOptionIds: [receipt.selectedCandidate.optionId],
    };
  } else if (
    receipt.selectedCandidate.actionId !== legalAction.actionId ||
    ("opportunityKey" in receipt
      ? command.kind !== "engine_randomized_turn_plan_selection" ||
        command.quote.opportunityKey !== receipt.opportunityKey
      : command.kind !== "engine_randomized_ice_install_selection" ||
        command.quote.planStepId !== receipt.planStepId ||
        legalAction.payload?.serverId !==
          receipt.selectedCandidate.targetServerId)
  )
    return undefined;
  return action;
}

function randomizedReceipt(
  command: RandomizedCommand,
  privatePayload: Readonly<Record<string, unknown>>,
): RandomizedReceipt | undefined {
  switch (command.kind) {
    case "engine_randomized_turn_plan_selection":
      return privatePayload.randomizedTurnPlanSelectionReceipt as
        | EngineRandomizedTurnPlanSelectionReceipt
        | undefined;
    case "engine_randomized_ice_install_selection":
      return privatePayload.randomizedIceInstallSelectionReceipt as
        | EngineRandomizedIceInstallSelectionReceipt
        | undefined;
    case "engine_randomized_trace_bid_selection":
      return privatePayload.randomizedTraceBidSelectionReceipt as
        | EngineRandomizedTraceBidSelectionReceipt
        | undefined;
  }
}
