import type {
  ActionType,
  EncounterActionTargets,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";
import { buildPublicAbilitySchemaContext } from "../../mechanics/public-payload-schema";
import { ACTION_ID_ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS } from "../../compatibility/payload-compatibility";
import { abilityPayloadDiscriminatorEntries } from "../../mechanics/public-payload-schema";

export type LegalActionMetadata = EncounterActionTargets &
  Partial<
    Pick<
      LegalAction,
      "abilityRef" | "effectRef" | "choiceRequirements" | "targetRequirements"
    >
  >;

// Fixed codes, ordered by the existing action-family ordering. Append new
// codes explicitly so future declarations cannot reassign an action family's identity.
const actionTypeCode = {
  access_card: "0",
  activated_card_ability: "1",
  advance_card: "2",
  break_subroutine: "3",
  change_card_control: "4",
  continue_run: "5",
  decline_rez: "6",
  decline_trash: "7",
  draw_card: "8",
  end_turn: "9",
  forgo_action: "a",
  gain_credit: "b",
  install_card: "c",
  jack_out: "d",
  mandatory_draw: "e",
  move_to_removed_from_game: "f",
  move_to_set_aside: "g",
  play_event: "h",
  play_operation: "i",
  pump_breaker: "j",
  purge_runner_virus_counters: "k",
  purge_virus_counters: "l",
  remove_tag: "m",
  resolve_choice: "n",
  return_from_set_aside: "o",
  rez_card: "p",
  rez_ice: "q",
  score_agenda: "r",
  start_run: "s",
  steal_agenda: "t",
  stop_restricted_action_sequence: "u",
  trash_accessed_card: "v",
  trash_resource: "w",
  trigger_ability: "x",
} as const satisfies Record<ActionType, string>;

export function buildLegalAction(
  state: GameState,
  side: Side,
  type: ActionType,
  label: string,
  source: LegalAction["source"],
  costs: LegalAction["costs"] = [],
  payload?: LegalAction["payload"],
  metadata: LegalActionMetadata = {},
): LegalAction {
  const visibility =
    type.startsWith("rez") ||
    type === "score_agenda" ||
    type === "trash_resource" ||
    payload?.corpAbility ||
    payload?.v1917AssetAbility ||
    payload?.cardImplementationAbility ||
    payload?.resourceAbility ||
    payload?.runnerAbility ||
    payload?.delayedInstallAbility ||
    payload?.obligationDebtAbility ||
    (side === "runner" && type === "install_card")
      ? "public"
      : "private_to_actor";
  const payloadFields: Pick<LegalAction, "payload"> | Record<string, never> =
    payload
      ? { payload: stableLegalActionPayload(type, payload, visibility) }
      : {};
  return {
    actionId: makeActionId(type, side, payload, source, metadata),
    side,
    type,
    label,
    source,
    timingPoint: state.timingPoint,
    costs,
    targetRequirements: metadata.targetRequirements ?? [],
    visibility,
    expiresAtStateVersion: state.stateVersion,
    ...(metadata.encounterSubroutineIds
      ? { encounterSubroutineIds: metadata.encounterSubroutineIds }
      : {}),
    ...(metadata.encounterRemainingSubroutineIds
      ? {
          encounterRemainingSubroutineIds:
            metadata.encounterRemainingSubroutineIds,
        }
      : {}),
    ...(metadata.subroutineIndexes
      ? { subroutineIndexes: metadata.subroutineIndexes }
      : {}),
    ...(metadata.payOrEndRunSubroutineIndexes
      ? { payOrEndRunSubroutineIndexes: metadata.payOrEndRunSubroutineIndexes }
      : {}),
    ...(metadata.payOrTrashProgramSubroutineIndexes
      ? {
          payOrTrashProgramSubroutineIndexes:
            metadata.payOrTrashProgramSubroutineIndexes,
        }
      : {}),
    ...(metadata.choiceRequirements
      ? { choiceRequirements: metadata.choiceRequirements }
      : {}),
    ...(metadata.abilityRef ? { abilityRef: metadata.abilityRef } : {}),
    ...(metadata.effectRef ? { effectRef: metadata.effectRef } : {}),
    ...payloadFields,
  };
}

export function stableLegalActionPayload(
  actionType: ActionType,
  payload: NonNullable<LegalAction["payload"]>,
  visibility: LegalAction["visibility"],
): NonNullable<LegalAction["payload"]> {
  const schema = buildPublicAbilitySchemaContext(
    actionType,
    payload,
    {},
    visibility === "public" ? "public" : "private_to_side",
  );
  const stableFields: Record<string, string | number | boolean> = {};
  if (schema.abilityFamily) stableFields.abilityFamily = schema.abilityFamily;
  if (schema.abilityId) stableFields.abilityId = schema.abilityId;
  if (schema.effectKind) stableFields.effectKind = schema.effectKind;
  return Object.keys(stableFields).length > 0
    ? { ...payload, ...stableFields }
    : payload;
}

export function makeActionId(
  type: ActionType,
  side: Side,
  payload: LegalAction["payload"] | undefined,
  source: LegalAction["source"],
  targets: EncounterActionTargets = {},
): string {
  const parts = [
    `${side === "corp" ? "c" : "r"}${actionTypeCode[type]}`,
    source === "basic_action" || source === "game_rule" ? "" : source,
  ];
  if (payload?.serverId) parts.push(String(payload.serverId));
  if (payload?.bonusRunSource)
    parts.push("bonus_run", String(payload.bonusRunSource));
  if (payload?.selectedServerId) parts.push(String(payload.selectedServerId));
  if (payload?.targetServerId) parts.push(String(payload.targetServerId));
  if (payload?.selectedCardId) parts.push(String(payload.selectedCardId));
  if (payload?.selectedSubtype) parts.push(String(payload.selectedSubtype));
  if (payload?.cardId) parts.push(String(payload.cardId));
  if (payload?.counterType) parts.push(String(payload.counterType));
  if (payload?.hostOnCardId) parts.push(String(payload.hostOnCardId));
  if (payload?.targetCardId) parts.push(String(payload.targetCardId));
  if (payload?.runnerProgramTrashBeforeInstall)
    parts.push("runner_program_trash_before_install");
  if (payload?.runnerInstallPaymentSourceIds !== undefined)
    parts.push(String(payload.runnerInstallPaymentSourceIds));
  if (payload?.runnerInstallPaymentSourceAmounts !== undefined)
    parts.push(String(payload.runnerInstallPaymentSourceAmounts));
  if (payload?.runnerInstallPaymentHostedCredits !== undefined)
    parts.push(String(payload.runnerInstallPaymentHostedCredits));
  if (payload?.breakerId) parts.push(String(payload.breakerId));
  if (payload?.iceId) parts.push(String(payload.iceId));
  if (payload?.subroutineIndex !== undefined)
    parts.push(String(payload.subroutineIndex));
  if (payload?.subroutineId !== undefined)
    parts.push(String(payload.subroutineId));
  if (targets.subroutineIndexes !== undefined)
    parts.push(targets.subroutineIndexes.join(","));
  if (payload?.sourceIceIndex !== undefined)
    parts.push(String(payload.sourceIceIndex));
  if (payload?.targetIceIndex !== undefined)
    parts.push(String(payload.targetIceIndex));
  if (payload?.pumpAmount !== undefined) parts.push(String(payload.pumpAmount));
  if (payload?.variableRezKind !== undefined)
    parts.push(String(payload.variableRezKind));
  if (payload?.variableRezAdditionalCost !== undefined)
    parts.push(String(payload.variableRezAdditionalCost));
  if (payload?.variableRezValue !== undefined)
    parts.push(String(payload.variableRezValue));
  if (payload?.removeTagAmount !== undefined)
    parts.push(String(payload.removeTagAmount));
  if (payload?.cardImplementationAbility)
    parts.push(String(payload.cardImplementationAbility));
  if (
    payload?.cardImplementationCapabilityBindingKind ===
      "card_spec_capability_key" &&
    payload.cardImplementationAbilityId !== undefined
  )
    parts.push(String(payload.cardImplementationAbilityId));
  if (payload?.cardImplementationLifecycleAction)
    parts.push(String(payload.cardImplementationLifecycleAction));
  if (payload?.actionEconomyAbility)
    parts.push(String(payload.actionEconomyAbility));
  if (payload?.iceInstallTotalCost !== undefined)
    parts.push(String(payload.iceInstallTotalCost));
  if (payload?.xValue !== undefined) parts.push(String(payload.xValue));
  if (payload?.iceInstallReductionSourceDefinitionIds)
    parts.push(String(payload.iceInstallReductionSourceDefinitionIds));
  if (payload?.accessTrashTotalCost !== undefined)
    parts.push(String(payload.accessTrashTotalCost));
  if (payload?.accessTrashCostSourceDefinitionIds)
    parts.push(String(payload.accessTrashCostSourceDefinitionIds));
  if (targets.encounterSubroutineIds !== undefined)
    parts.push(targets.encounterSubroutineIds.join(","));
  if (targets.payOrEndRunSubroutineIndexes !== undefined)
    parts.push(targets.payOrEndRunSubroutineIndexes.join(","));
  if (payload?.payOrEndRunSubroutinePayment !== undefined)
    parts.push(String(payload.payOrEndRunSubroutinePayment));
  if (payload?.decision) parts.push(String(payload.decision));
  for (const entry of abilityPayloadDiscriminatorEntries(
    payload,
    ACTION_ID_ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS,
  )) {
    parts.push(entry.abilityId);
  }
  if (payload?.stealCost !== undefined) parts.push(String(payload.stealCost));
  if (payload?.stealCostSourceDefinitionIds)
    parts.push(String(payload.stealCostSourceDefinitionIds));
  if (payload?.stealCostPersistedForCurrentAccess !== undefined)
    parts.push(String(payload.stealCostPersistedForCurrentAccess));
  if (payload?.discountedRezSourceCardId)
    parts.push(String(payload.discountedRezSourceCardId));
  if (payload?.targetCardId) parts.push(String(payload.targetCardId));
  if (payload?.secondTargetCardId)
    parts.push(String(payload.secondTargetCardId));
  if (payload?.hardwareTrashByCounterTrashCount)
    parts.push(String(payload.hardwareTrashByCounterTrashCount));
  if (payload?.drawTaxDecision) parts.push(String(payload.drawTaxDecision));
  if (payload?.approachIceExposeDecision)
    parts.push(String(payload.approachIceExposeDecision));
  if (payload?.approachIceExposeViewDecision)
    parts.push(String(payload.approachIceExposeViewDecision));
  if (payload?.approachIceExposeJackOut)
    parts.push(String(payload.approachIceExposeJackOut));
  return parts.filter(Boolean).join(".");
}
