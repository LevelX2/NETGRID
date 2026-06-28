import type { ActionSemanticCandidate } from "./action-semantic-candidate";

export type SemanticActionSignature = {
  schemaVersion: "semantic-action-signature-v1";
  actionType: string;
  semanticActionType: string;
  sourceKind: string;
  sourceDefinitionId?: string;
  abilityId?: string;
  targetIdentity: string;
  costClass: string;
  timingClass: string;
  serverId?: string;
  choiceOptionId?: string;
  signatureKey: string;
};

export type SemanticActionSignatureInput = {
  actionType: string;
  semanticActionType?: string;
  sourceKind?: string;
  sourceDefinitionId?: string;
  abilityId?: string;
  targetIdentity?: string;
  costClass?: string;
  timingClass?: string;
  serverId?: string;
  choiceOptionId?: string;
};

const HIDDEN_INFO_MARKERS = [
  "cardinstances",
  "privatepayload",
  "sessiontoken",
  "reconnecttoken",
  "jointoken",
  "fullgamestate",
  "aiinput",
  "decisiondebug",
  "decktop",
  "decklist",
  "deckorder",
] as const;

export function semanticActionSignatureFromCandidate(
  candidate: ActionSemanticCandidate,
): SemanticActionSignature {
  const serverId = candidate.runProjectionSummary?.serverId;
  const choiceOptionId = candidate.targetContext?.selectedTargets.find(
    (target) => target.targetKind === "choice",
  )?.targetId;
  return buildSemanticActionSignature({
    actionType: candidate.actionType,
    semanticActionType: candidate.semanticActionType,
    sourceKind: candidate.sourceKind,
    ...(candidate.sourceDefinitionId ? { sourceDefinitionId: candidate.sourceDefinitionId } : {}),
    ...(candidate.abilityId ? { abilityId: candidate.abilityId } : {}),
    targetIdentity:
      candidate.targetContext === undefined
        ? "none"
        : candidate.targetContext.hiddenInfoPolicy === "hidden_info_blocked"
          ? "unknown_hidden_blocked"
          : candidate.targetContext.selectedTargets[0]?.targetId ?? "target_context_unresolved",
    costClass: costClassFromCandidate(candidate),
    timingClass: timingClassFromCandidate(candidate),
    ...(serverId ? { serverId } : {}),
    ...(choiceOptionId ? { choiceOptionId } : {}),
  });
}

export function buildSemanticActionSignature(
  input: SemanticActionSignatureInput,
): SemanticActionSignature {
  const sanitized = sanitizeSignatureInput(input);
  const parts = [
    `action:${sanitized.actionType}`,
    `semantic:${sanitized.semanticActionType}`,
    `source:${sanitized.sourceKind}`,
    `definition:${sanitized.sourceDefinitionId ?? "none"}`,
    `ability:${sanitized.abilityId ?? "none"}`,
    `target:${sanitized.targetIdentity}`,
    `cost:${sanitized.costClass}`,
    `timing:${sanitized.timingClass}`,
    `server:${sanitized.serverId ?? "none"}`,
    `choice:${sanitized.choiceOptionId ?? "none"}`,
  ];
  return {
    schemaVersion: "semantic-action-signature-v1",
    ...sanitized,
    signatureKey: parts.join("|"),
  };
}

export function signatureInputIsRedactionSafe(
  input: SemanticActionSignatureInput,
): boolean {
  return !signatureInputContainsHiddenInfoMarker(JSON.stringify(input));
}

function sanitizeSignatureInput(
  input: SemanticActionSignatureInput,
): Required<Pick<SemanticActionSignatureInput, "actionType" | "semanticActionType" | "sourceKind" | "targetIdentity" | "costClass" | "timingClass">> &
  Omit<
    SemanticActionSignatureInput,
    "actionType" | "semanticActionType" | "sourceKind" | "targetIdentity" | "costClass" | "timingClass"
  > {
  if (!signatureInputIsRedactionSafe(input)) {
    return {
      actionType: input.actionType,
      semanticActionType: input.semanticActionType ?? "unknown",
      sourceKind: input.sourceKind ?? "unknown",
      targetIdentity: "unknown_hidden_blocked",
      costClass: "hidden_blocked",
      timingClass: "hidden_blocked",
    };
  }
  return {
    actionType: input.actionType,
    semanticActionType: input.semanticActionType ?? "unknown",
    sourceKind: input.sourceKind ?? "unknown",
    ...(input.sourceDefinitionId ? { sourceDefinitionId: input.sourceDefinitionId } : {}),
    ...(input.abilityId ? { abilityId: input.abilityId } : {}),
    targetIdentity: input.targetIdentity ?? "unknown_target",
    costClass: input.costClass ?? "unknown_cost",
    timingClass: input.timingClass ?? "unknown_timing",
    ...(input.serverId ? { serverId: input.serverId } : {}),
    ...(input.choiceOptionId ? { choiceOptionId: input.choiceOptionId } : {}),
  };
}

function costClassFromCandidate(candidate: ActionSemanticCandidate): string {
  const profile = candidate.costProfile;
  const parts = [
    `known:${profile.costKnownStatus}`,
    `click:${profile.clickCost ?? "n/a"}`,
    `credit:${profile.creditCost ?? "n/a"}`,
    `trash:${profile.trashCost ?? "n/a"}`,
    `agenda:${profile.agendaPointCost ?? "n/a"}`,
    `additional:${profile.additionalCosts.slice().sort().join("+") || "none"}`,
  ];
  return parts.join(",");
}

function timingClassFromCandidate(candidate: ActionSemanticCandidate): string {
  const profile = candidate.timingProfile;
  return [
    `phase:${profile.phase ?? "unknown"}`,
    `turn:${profile.turnSide ?? "unknown"}`,
    `window:${profile.window ?? "unknown"}`,
    `run:${profile.runPhase ?? "unknown"}`,
    `encounter:${profile.encounterPhase ?? "unknown"}`,
    `access:${profile.accessPhase === true ? "yes" : "no"}`,
  ].join(",");
}

function signatureInputContainsHiddenInfoMarker(value: string): boolean {
  const tokenSet = new Set(signatureInputHiddenInfoTokens(value));
  return HIDDEN_INFO_MARKERS.some((marker) => tokenSet.has(marker));
}

function signatureInputHiddenInfoTokens(value: string): string[] {
  const tokens: string[] = [];
  let current = "";
  for (const character of value) {
    if (isAsciiLetterOrDigit(character)) {
      current += character.toLocaleLowerCase("en-US");
    } else {
      if (current.length > 0) tokens.push(current);
      current = "";
    }
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

function isAsciiLetterOrDigit(character: string): boolean {
  return (
    (character >= "a" && character <= "z") ||
    (character >= "A" && character <= "Z") ||
    (character >= "0" && character <= "9")
  );
}
