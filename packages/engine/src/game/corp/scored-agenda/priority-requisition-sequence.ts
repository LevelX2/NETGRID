import type {
  CardInstanceId,
  ChoiceRequest,
  PlayerAction,
} from "@netgrid/shared";
import { selectedChoiceIds } from "../../choices/choice-validation";
import {
  hiddenCardChoiceOption,
  hiddenZoneChoicePayload,
  selectedHiddenCardChoiceIds,
} from "../../choices/hidden-zone-choice";
import type {
  CorpInstallRezSequenceHandlerHost,
  CorpInstallRezSequenceHandlerResult,
} from "../install-rez-sequence-handlers";

export function isPriorityRequisitionChoiceSource(source: string): boolean {
  return source.startsWith("v162.priority_requisition");
}

export function startPriorityRequisitionChoice(
  host: CorpInstallRezSequenceHandlerHost,
  agendaId: CardInstanceId,
): CorpInstallRezSequenceHandlerResult {
  const candidates = priorityRequisitionCandidates(host);
  if (candidates.length === 0) {
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      priorityRequisitionChoiceOpened: false,
      priorityRequisitionCandidateCount: 0,
    };
    return { handled: true, resolvedPayload: host.legalAction.payload ?? {} };
  }
  host.state.pendingChoice = {
    choiceId: `v162_priority_requisition_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `v162.priority_requisition:${agendaId}:${host.state.stateVersion + 1}`,
    prompt: "Priority Requisition: ICE kostenlos rezzen",
    kind: "select_cards",
    options: [
      ...candidates.map((cardId) =>
        hiddenCardChoiceOption({
          cardId,
          label: host.cards.definitionFor(cardId).title,
          publicLabel: "Installiertes ICE",
        }),
      ),
      {
        id: "skip",
        label: "Überspringen",
        publicLabel: "Überspringen",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    priorityRequisitionChoiceOpened: true,
    priorityRequisitionCandidateCount: candidates.length,
  };
  return { handled: true, stateChanged: true };
}

export function resolvePriorityRequisitionChoice(
  host: CorpInstallRezSequenceHandlerHost,
): CorpInstallRezSequenceHandlerResult {
  const choice = requireChoice(
    host,
    "Es ist keine Priority-Requisition-Choice offen.",
  );
  if (host.legalAction.side !== "corp")
    throw new Error("Nur die Korp darf Priority Requisition resolven.");
  const [, agendaId] = choice.source.split(":");
  if (
    !agendaId ||
    !host.state.corp.scoreArea.includes(agendaId as CardInstanceId) ||
    host.cards.scoredAgendaKind(agendaId as CardInstanceId) !==
      "score_rez_installed_ice_at_no_cost"
  ) {
    throw new Error(
      "Priority Requisition ist nicht mehr in der Korp-ScoreArea.",
    );
  }
  const selectedOptionIds = selectedChoiceIds(
    requirePlayerAction(host).selectedChoices,
  );
  if (selectedOptionIds.length === 1 && selectedOptionIds[0] === "skip") {
    delete host.state.pendingChoice;
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      priorityRequisitionFreeRez: false,
      priorityRequisitionDeclined: true,
    };
    return {
      handled: true,
      stateChanged: true,
      deletePendingChoice: true,
      resolvedPayload: host.legalAction.payload ?? {},
    };
  }
  const selectedIds = selectedChoiceCardIds(host, choice);
  if (selectedIds.length > 1)
    throw new Error("Priority Requisition darf hoechstens ein ICE rezzen.");
  const targetId = selectedIds[0];
  if (!targetId) {
    delete host.state.pendingChoice;
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      priorityRequisitionFreeRez: false,
      priorityRequisitionDeclined: true,
    };
    return {
      handled: true,
      stateChanged: true,
      deletePendingChoice: true,
      resolvedPayload: host.legalAction.payload ?? {},
    };
  }
  const optionValues = new Set(
    choice.options
      .map((option) => option.value)
      .filter((value): value is string => typeof value === "string"),
  );
  if (
    !optionValues.has(targetId) ||
    !host.cards.isPriorityRequisitionCandidate(targetId)
  )
    throw new Error("Das Priority-Requisition-Ziel ist nicht mehr gueltig.");
  const instance = host.cards.mustInstance(targetId);
  host.state.cardInstances[targetId] = {
    ...instance,
    faceup: true,
    rezzed: true,
  };
  delete host.state.pendingChoice;
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...hiddenZoneChoicePayload("v162_priority_requisition_free_rez"),
    priorityRequisitionFreeRez: true,
    priorityRequisitionTarget: targetId,
    priorityRequisitionTargetDefinitionId:
      host.cards.definitionFor(targetId).id,
    rezCostPaid: 0,
  };
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    rezzedCardIds: [targetId],
    resolvedPayload: host.legalAction.payload ?? {},
  };
}

function priorityRequisitionCandidates(
  host: CorpInstallRezSequenceHandlerHost,
): CardInstanceId[] {
  return Object.keys(host.state.cardInstances)
    .filter((cardId): cardId is CardInstanceId =>
      host.cards.isPriorityRequisitionCandidate(cardId as CardInstanceId),
    )
    .sort((left, right) => {
      const leftCost = host.cards.definitionFor(left).rezCost ?? 0;
      const rightCost = host.cards.definitionFor(right).rezCost ?? 0;
      return rightCost - leftCost || left.localeCompare(right);
    });
}

function requireChoice(
  host: CorpInstallRezSequenceHandlerHost,
  message: string,
): ChoiceRequest {
  const choice = host.state.pendingChoice;
  if (!choice) throw new Error(message);
  return choice;
}

function requirePlayerAction(
  host: CorpInstallRezSequenceHandlerHost,
): PlayerAction {
  if (!host.playerAction) throw new Error("Diese Choice hat keine Auswahl.");
  return host.playerAction;
}

function selectedChoiceCardIds(
  host: CorpInstallRezSequenceHandlerHost,
  choice: ChoiceRequest,
): CardInstanceId[] {
  return selectedHiddenCardChoiceIds(
    requirePlayerAction(host).selectedChoices,
    choice,
  );
}
