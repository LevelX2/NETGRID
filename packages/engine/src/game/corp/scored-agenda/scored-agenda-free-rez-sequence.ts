import type {
  CardInstanceId,
  ChoiceRequest,
  PlayerAction,
} from "@netgrid/shared";
import { selectedChoiceIds } from "../../choices/choice-validation";
import { hiddenZoneChoicePayload } from "../../choices/hidden-zone-choice";
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
    kind: "select_option",
    options: [
      ...candidates.flatMap((cardId) =>
        host.callbacks.effectDrivenRezVariants(cardId).map((variant) => ({
          id: `rez_${cardId}_${variant.variantId}`,
          label: variant.label,
          publicLabel: "Installiertes ICE",
          value: `${cardId}|${variant.variantId}`,
        })),
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
  if (selectedOptionIds.length !== 1)
    throw new Error("Priority Requisition braucht genau eine Auswahl.");
  const selectedOption = choice.options.find(
    (option) => option.id === selectedOptionIds[0],
  );
  if (typeof selectedOption?.value !== "string")
    throw new Error("Die Priority-Requisition-Auswahl ist ungueltig.");
  const [targetText, variantId] = selectedOption.value.split("|");
  const targetId = targetText as CardInstanceId | undefined;
  if (
    !targetId ||
    !variantId ||
    !host.cards.isScoredAgendaFreeRezCandidate(targetId) ||
    !host.callbacks
      .effectDrivenRezVariants(targetId)
      .some((variant) => variant.variantId === variantId)
  )
    throw new Error("Das Priority-Requisition-Ziel ist nicht mehr gueltig.");
  const receipt = host.callbacks.rezInstalledIceWaivingBaseCost(
    targetId,
    variantId,
  );
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
      rezBaseCreditCostWaived: host.cards.definitionFor(targetId).rezCost ?? 0,
      rezAdditionalCreditsPaid: receipt.rezAdditionalCreditsPaid,
      rezAgendaPointsPaid: receipt.rezAgendaPointsPaid,
    },
  });
}

function scoredAgendaFreeRezCandidates(
  host: CorpInstallRezSequenceHandlerHost,
): CardInstanceId[] {
  return Object.keys(host.state.cardInstances)
    .filter(
      (cardId): cardId is CardInstanceId =>
        host.cards.isScoredAgendaFreeRezCandidate(cardId as CardInstanceId) &&
        host.callbacks.effectDrivenRezVariants(cardId as CardInstanceId)
          .length > 0,
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
