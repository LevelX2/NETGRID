import {
  CORP_FORT_RUN_REZ_SUPPORT_KIND,
  CORP_FORT_RUN_REZ_SUPPORT_QUOTE_SCHEMA_VERSION,
  CORP_FORT_RUN_TEMPORARY_ENCOUNTER_REZ_SUPPORT_KIND,
  type LegalAction,
} from "@netgrid/shared";

import type {
  ActionSemanticCandidate,
  ConditionalDefenseFollowupQuote,
} from "../action-semantic-candidate-types";

export const CONDITIONAL_DEFENSE_FOLLOWUP_QUOTE_PAYLOAD_FIELDS = [
  "cardImplementationFortRunRezSupportQuoteSchemaVersion",
  "cardImplementationFortRunRezSupportQuoteKind",
  "cardImplementationFortRunRezSupportQuoteComplete",
  "cardImplementationFortRunRezSupportQuoteSourceCardInstanceId",
  "cardImplementationFortRunRezSupportQuoteTargetServerId",
  "cardImplementationFortRunRezSupportQuoteStateVersion",
  "cardImplementationFortRunRezSupportQuoteActionId",
  "cardImplementationFortRunRezSupportQuoteRezCredits",
  "cardImplementationFortRunRezSupportQuoteFollowupCredits",
  "cardImplementationFortRunRezSupportQuoteInstallCredits",
  "cardImplementationFortRunRezSupportQuoteTotalCredits",
  "cardImplementationFortRunRezSupportQuoteTotalCreditsPayable",
  "cardImplementationFortRunRezSupportQuoteHasOwnHqIce",
] as const;

export function applyConditionalDefenseFollowupQuote(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionSemanticCandidate {
  const quote = conditionalDefenseFollowupQuote(candidate, action);
  return quote
    ? {
        ...candidate,
        conditionalDefenseFollowupQuote: quote,
        evidence: [
          ...candidate.evidence,
          "AI conditional defense follow-up quote: exact Engine LegalAction",
        ],
      }
    : candidate;
}

export function actionHasConditionalDefenseFollowupQuotePayload(
  candidate: ActionSemanticCandidate,
): boolean {
  return CONDITIONAL_DEFENSE_FOLLOWUP_QUOTE_PAYLOAD_FIELDS.some((field) =>
    candidate.legalActionRef.originalPayloadKeys.includes(field),
  );
}

function conditionalDefenseFollowupQuote(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ConditionalDefenseFollowupQuote | undefined {
  const payload = action.payload;
  const kind = payload?.cardImplementationFortRunRezSupportQuoteKind;
  const sourceCardInstanceId =
    payload?.cardImplementationFortRunRezSupportQuoteSourceCardInstanceId;
  const targetServerId =
    payload?.cardImplementationFortRunRezSupportQuoteTargetServerId;
  const stateVersion =
    payload?.cardImplementationFortRunRezSupportQuoteStateVersion;
  const actionId = payload?.cardImplementationFortRunRezSupportQuoteActionId;
  const rezCredits =
    payload?.cardImplementationFortRunRezSupportQuoteRezCredits;
  const followupCredits =
    payload?.cardImplementationFortRunRezSupportQuoteFollowupCredits;
  const installCredits =
    payload?.cardImplementationFortRunRezSupportQuoteInstallCredits;
  const totalCredits =
    payload?.cardImplementationFortRunRezSupportQuoteTotalCredits;
  const totalCreditsPayable =
    payload?.cardImplementationFortRunRezSupportQuoteTotalCreditsPayable;
  const hasOwnHqIce =
    payload?.cardImplementationFortRunRezSupportQuoteHasOwnHqIce;
  const listedRezCredits = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  if (
    candidate.actorSide !== "corp" ||
    action.side !== "corp" ||
    action.expiresAtStateVersion !== candidate.stateVersion ||
    payload?.cardImplementationFortRunRezSupportQuoteSchemaVersion !==
      CORP_FORT_RUN_REZ_SUPPORT_QUOTE_SCHEMA_VERSION ||
    (kind !== CORP_FORT_RUN_REZ_SUPPORT_KIND &&
      kind !== CORP_FORT_RUN_TEMPORARY_ENCOUNTER_REZ_SUPPORT_KIND) ||
    payload.cardImplementationFortRunRezSupportQuoteComplete !== true ||
    typeof sourceCardInstanceId !== "string" ||
    sourceCardInstanceId !== candidate.sourceCardInstanceId ||
    action.source !== sourceCardInstanceId ||
    typeof targetServerId !== "string" ||
    !isNonNegativeInteger(stateVersion) ||
    stateVersion !== candidate.stateVersion ||
    actionId !== candidate.actionId ||
    action.actionId !== candidate.actionId ||
    !isNonNegativeInteger(rezCredits) ||
    !isNonNegativeInteger(followupCredits) ||
    !isNonNegativeInteger(installCredits) ||
    !isNonNegativeInteger(totalCredits) ||
    !Number.isSafeInteger(listedRezCredits) ||
    listedRezCredits !== rezCredits ||
    (kind === CORP_FORT_RUN_REZ_SUPPORT_KIND &&
      followupCredits !== installCredits) ||
    (kind === CORP_FORT_RUN_TEMPORARY_ENCOUNTER_REZ_SUPPORT_KIND &&
      installCredits !== 0) ||
    totalCredits !== rezCredits + followupCredits ||
    typeof totalCreditsPayable !== "boolean" ||
    typeof hasOwnHqIce !== "boolean"
  ) {
    return undefined;
  }
  return {
    schemaVersion: "conditional-defense-followup-quote-v1",
    kind,
    sourceCardInstanceId,
    targetServerId,
    stateVersion,
    actionId,
    rezCredits,
    followupCredits,
    totalCredits,
    totalCreditsPayable,
    hasOwnHqIce,
    evidence: ["engine_quote:complete", "engine_quote:action_bound"],
  };
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
