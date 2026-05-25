import type {
  ActionType,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";
import { buildPublicAbilitySchemaContext } from "../../mechanics/public-payload-schema";
import { ACTION_ID_LEGACY_ABILITY_PAYLOAD_FIELDS } from "../../compatibility/payload-compatibility";
import { legacyAbilityPayloadEntries } from "../../mechanics/public-payload-schema";

export type LegalActionMetadata = Partial<
  Pick<
    LegalAction,
    "abilityRef" | "effectRef" | "choiceRequirements" | "targetRequirements"
  >
>;

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
    payload?.shellTradersAbility ||
    payload?.acmeSavingsAndLoanAbility ||
    (side === "runner" && type === "install_card")
      ? "public"
      : "private_to_actor";
  const payloadFields: Pick<LegalAction, "payload"> | Record<string, never> =
    payload
      ? { payload: stableLegalActionPayload(type, payload, visibility) }
      : {};
  return {
    actionId: makeActionId(type, side, payload, source),
    side,
    type,
    label,
    source,
    timingPoint: state.timingPoint,
    costs,
    targetRequirements: metadata.targetRequirements ?? [],
    visibility,
    expiresAtStateVersion: state.stateVersion,
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
): string {
  const parts = [
    side,
    type,
    source === "basic_action" || source === "game_rule" ? "" : source,
  ];
  if (payload?.serverId) parts.push(String(payload.serverId));
  if (payload?.selectedServerId) parts.push(String(payload.selectedServerId));
  if (payload?.cardId) parts.push(String(payload.cardId));
  if (payload?.hostOnCardId) parts.push(String(payload.hostOnCardId));
  if (payload?.runnerProgramTrashBeforeInstall)
    parts.push("runner_program_trash_before_install");
  if (payload?.breakerId) parts.push(String(payload.breakerId));
  if (payload?.iceId) parts.push(String(payload.iceId));
  if (payload?.subroutineIndex !== undefined)
    parts.push(String(payload.subroutineIndex));
  if (payload?.subroutineId !== undefined)
    parts.push(String(payload.subroutineId));
  if (payload?.subroutineIndexes !== undefined)
    parts.push(String(payload.subroutineIndexes));
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
  if (payload?.cardImplementationAbilityIndex !== undefined)
    parts.push(String(payload.cardImplementationAbilityIndex));
  if (payload?.cardImplementationLifecycleAction)
    parts.push(String(payload.cardImplementationLifecycleAction));
  if (payload?.cardImplementationLifecycleAbilityIndex !== undefined)
    parts.push(String(payload.cardImplementationLifecycleAbilityIndex));
  if (payload?.iceInstallTotalCost !== undefined)
    parts.push(String(payload.iceInstallTotalCost));
  if (payload?.iceInstallReductionSourceDefinitionIds)
    parts.push(String(payload.iceInstallReductionSourceDefinitionIds));
  if (payload?.accessTrashTotalCost !== undefined)
    parts.push(String(payload.accessTrashTotalCost));
  if (payload?.accessTrashCostSourceDefinitionIds)
    parts.push(String(payload.accessTrashCostSourceDefinitionIds));
  if (payload?.encounterSubroutineIds !== undefined)
    parts.push(String(payload.encounterSubroutineIds));
  if (payload?.payOrEndRunSubroutineIndexes !== undefined)
    parts.push(String(payload.payOrEndRunSubroutineIndexes));
  if (payload?.payOrEndRunSubroutinePayment !== undefined)
    parts.push(String(payload.payOrEndRunSubroutinePayment));
  for (const entry of legacyAbilityPayloadEntries(
    payload,
    ACTION_ID_LEGACY_ABILITY_PAYLOAD_FIELDS,
  )) {
    parts.push(entry.abilityId);
  }
  if (payload?.stealCost !== undefined) parts.push(String(payload.stealCost));
  if (payload?.stealCostSourceDefinitionIds)
    parts.push(String(payload.stealCostSourceDefinitionIds));
  if (payload?.stealCostPersistedForCurrentAccess !== undefined)
    parts.push(String(payload.stealCostPersistedForCurrentAccess));
  if (payload?.oliviaSalazarRezSourceCardId)
    parts.push(String(payload.oliviaSalazarRezSourceCardId));
  if (payload?.targetCardId) parts.push(String(payload.targetCardId));
  if (payload?.secondTargetCardId)
    parts.push(String(payload.secondTargetCardId));
  if (payload?.powerGridOverloadTrashCount)
    parts.push(String(payload.powerGridOverloadTrashCount));
  if (payload?.citySurveillanceDrawDecision)
    parts.push(String(payload.citySurveillanceDrawDecision));
  if (payload?.approachIceExposeDecision)
    parts.push(String(payload.approachIceExposeDecision));
  if (payload?.approachIceExposeViewDecision)
    parts.push(String(payload.approachIceExposeViewDecision));
  if (payload?.approachIceExposeJackOut)
    parts.push(String(payload.approachIceExposeJackOut));
  return parts.filter(Boolean).join(".");
}
