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
} from "./scored-agenda-sequence-host";
import { applySequenceResolution } from "./scored-agenda-sequence-types";

/**
 * @contract Priority Requisition owns the scored-agenda free-rez choice for a
 * single installed ICE candidate.
 * @authority The resolver revalidates score area, selected option membership
 * and current no-cost rez eligibility before mutating ICE faceup/rezzed state.
 * @visibility Candidate labels are actor-private; public payloads expose the
 * resolved target and free-rez outcome only after resolution.
 */

export function isScoredAgendaFreeRezChoiceSource(source: string): boolean {
  return source.startsWith("card_implementation.scored_agenda_free_rez");
}

export function startScoredAgendaFreeRezChoice(
  host: CorpInstallRezSequenceHandlerHost,
  agendaId: CardInstanceId,
): CorpInstallRezSequenceHandlerResult {
  const candidates = scoredAgendaFreeRezCandidates(host);
  if (candidates.length === 0) {
    return applySequenceResolution(host.legalAction, {
      result: { handled: true },
      payloadPatch: {
        scoredAgendaFreeRezChoiceOpened: false,
        scoredAgendaFreeRezCandidateCount: 0,
      },
    });
  }
  host.state.pendingChoice = {
    choiceId: `v162_scored_agenda_free_rez_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `card_implementation.scored_agenda_free_rez:${agendaId}:${host.state.stateVersion + 1}`,
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
  return applySequenceResolution(host.legalAction, {
    result: { handled: true },
    stateChanged: true,
    payloadPatch: {
      scoredAgendaFreeRezChoiceOpened: true,
      scoredAgendaFreeRezCandidateCount: candidates.length,
    },
  });
}

export function resolveScoredAgendaFreeRezChoice(
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
    return applySequenceResolution(host.legalAction, {
      result: { handled: true, deletePendingChoice: true },
      stateChanged: true,
      payloadPatch: {
        scoredAgendaFreeRezFreeRez: false,
        scoredAgendaFreeRezDeclined: true,
      },
    });
  }
  const selectedIds = selectedChoiceCardIds(host, choice);
  if (selectedIds.length > 1)
    throw new Error("Priority Requisition darf hoechstens ein ICE rezzen.");
  const targetId = selectedIds[0];
  if (!targetId) {
    delete host.state.pendingChoice;
    return applySequenceResolution(host.legalAction, {
      result: { handled: true, deletePendingChoice: true },
      stateChanged: true,
      payloadPatch: {
        scoredAgendaFreeRezFreeRez: false,
        scoredAgendaFreeRezDeclined: true,
      },
    });
  }
  const optionValues = new Set(
    choice.options
      .map((option) => option.value)
      .filter((value): value is string => typeof value === "string"),
  );
  if (
    !optionValues.has(targetId) ||
    !host.cards.isScoredAgendaFreeRezCandidate(targetId)
  )
    throw new Error("Das Priority-Requisition-Ziel ist nicht mehr gueltig.");
  const instance = host.cards.mustInstance(targetId);
  host.state.cardInstances[targetId] = {
    ...instance,
    faceup: true,
    rezzed: true,
  };
  delete host.state.pendingChoice;
  return applySequenceResolution(host.legalAction, {
    result: {
      handled: true,
      deletePendingChoice: true,
      rezzedCardIds: [targetId],
    },
    stateChanged: true,
    payloadPatch: {
      ...hiddenZoneChoicePayload("scored_agenda_free_rez"),
      scoredAgendaFreeRezFreeRez: true,
      scoredAgendaFreeRezTarget: targetId,
      scoredAgendaFreeRezTargetDefinitionId:
        host.cards.definitionFor(targetId).id,
      rezCostPaid: 0,
    },
  });
}

function scoredAgendaFreeRezCandidates(
  host: CorpInstallRezSequenceHandlerHost,
): CardInstanceId[] {
  return Object.keys(host.state.cardInstances)
    .filter((cardId): cardId is CardInstanceId =>
      host.cards.isScoredAgendaFreeRezCandidate(cardId as CardInstanceId),
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
