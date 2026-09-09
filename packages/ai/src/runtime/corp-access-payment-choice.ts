import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { CorpAmbushSignal } from "../plans/corp-tactical-plan-modules";

const ACCESS_PAYMENT_SOURCE = "p3_35.access_payment";
const ACCESS_ZONES = new Set(["installed", "hq", "rd", "archives"]);

export function corpAccessPaymentChoiceSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpAmbushSignal | undefined {
  const choice = input.playerView.pendingChoice;
  if (!choice || !choice.source.startsWith(ACCESS_PAYMENT_SOURCE + ":"))
    return undefined;
  const selectableOptions = choice.options.filter(
    (option) => option.selectable !== false,
  );
  if (
    input.side !== "corp" ||
    input.playerView.timingPoint !== "access.resolve_card" ||
    choice.side !== "corp" ||
    choice.kind !== "select_option" ||
    choice.visibility !== "hidden_info_barrier" ||
    choice.choiceId !==
      `p3_35_access_payment_${input.playerView.stateVersion}` ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    choice.stateVersion !== input.playerView.stateVersion
  ) {
    return undefined;
  }

  const sourceParts = choice.source.split(":");
  if (
    sourceParts.length !== 5 ||
    sourceParts[0] !== ACCESS_PAYMENT_SOURCE ||
    sourceParts[1] === "" ||
    !nonNegativeInteger(sourceParts[2]) ||
    !ACCESS_ZONES.has(sourceParts[3] ?? "") ||
    !nonNegativeInteger(sourceParts[4]) ||
    Number(sourceParts[4]) !== input.playerView.stateVersion
  ) {
    return undefined;
  }

  const pay = selectableOptions.find(
    (option) => option.id === "pay" && option.value === "pay",
  );
  const decline = selectableOptions.find(
    (option) => option.id === "decline" && option.value === "decline",
  );
  const creditCost = pay?.metadata?.creditCost;
  const noOpCertified = pay?.metadata?.accessPaymentNoOpCertified;
  if (
    selectableOptions.length !== 2 ||
    !pay ||
    !decline ||
    !Number.isInteger(creditCost) ||
    creditCost === undefined ||
    creditCost <= 0 ||
    creditCost > input.playerView.own.credits ||
    typeof noOpCertified !== "boolean"
  ) {
    return undefined;
  }
  const originEvent = input.eventTail.at(-1);
  if (
    !originEvent ||
    originEvent.stateVersionAfter !== input.playerView.stateVersion ||
    originEvent.publicPayload.actionType !== "access_card" ||
    originEvent.publicPayload.ambushPaymentChoiceOpened !== true ||
    originEvent.publicPayload.ambushPaymentAmount !== creditCost
  ) {
    return undefined;
  }
  const source = input.playerView.run?.accessedCard;
  const run = input.playerView.run;
  const resolveCandidates = candidates.filter(
    (candidate) =>
      candidate.semanticActionType === "choice.resolve" &&
      candidate.actionType === "resolve_choice",
  );
  if (resolveCandidates.length !== 1) return undefined;
  const action = input.legalActions.find(
    (action) => action.actionId === resolveCandidates[0]!.actionId,
  );
  const requirement = action?.choiceRequirements?.[0];
  if (
    !run ||
    !source ||
    source.known !== true ||
    !source.definitionId ||
    source.instanceId !== sourceParts[1] ||
    source.owner !== "corp" ||
    action?.side !== "corp" ||
    action.type !== "resolve_choice" ||
    action.source !== "game_rule" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.timingPoint !== input.playerView.timingPoint ||
    action.choiceRequirements?.length !== 1 ||
    requirement?.choiceId !== choice.choiceId ||
    requirement.minSelections !== 1 ||
    requirement.maxSelections !== 1 ||
    requirement.optionIds.length !== 2 ||
    !selectableOptions.every((option) =>
      requirement.optionIds.includes(option.id),
    )
  )
    return undefined;
  return {
    commitmentVersion: "corp_ambush_commitment_v1",
    ambushId: `access-payment:${choice.choiceId}`,
    sourceDefinitionId: source.definitionId,
    sourceInstanceId: source.instanceId,
    actionIds: [action.actionId],
    serverId: run.attackedServerId,
    phase: "trigger",
    purposeCode: noOpCertified
      ? "decline_engine_certified_empty_access_effect"
      : "activate_current_paid_access_effect",
    assignedDomainPlanIds: ["corp.ambush_bluff"],
    duplicateAlreadyInstalled: false,
    affordableOrSupportable: true,
    plannedAtStateVersion: input.playerView.stateVersion,
    plannedAdvancementTarget: 0,
    value: 1_000,
    evidenceCode: noOpCertified
      ? "corp_access_payment_declines_certified_no_op"
      : "corp_access_payment_current_activation",
    accessPaymentChoiceBinding: {
      actionId: action.actionId,
      choiceId: choice.choiceId,
      choiceSource: choice.source,
      observedAtStateVersion: input.playerView.stateVersion,
      selectedOptionIds: [noOpCertified ? decline.id : pay.id],
      creditCost,
      noOpCertified,
    },
  };
}

function nonNegativeInteger(value: string | undefined): boolean {
  if (value === undefined || value === "") return false;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0;
}
