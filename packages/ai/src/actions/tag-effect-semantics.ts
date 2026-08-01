import type { LegalAction } from "@netgrid/shared";
import type {
  ActionTagEffectProfile,
  ActionSemanticCandidate,
} from "../action-semantic-candidate-types";

export function applyTagEffectSemantics(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionSemanticCandidate {
  if (action.type === "remove_tag" && action.side === "runner") {
    return withTagEffectProfile(candidate, {
      kind: "remove_tags",
      recipient: "runner",
      mode: "amount",
      amount: 1,
      currentTagReduction: 1,
      acuteTagRemoval: true,
      source: "legal_action_type",
      evidence: ["BasicAction remove_tag removes one runner tag"],
    });
  }

  const payloadProfile = tagEffectProfileFromPayload(action);
  if (payloadProfile) return withTagEffectProfile(candidate, payloadProfile);

  return candidate;
}

function tagEffectProfileFromPayload(
  action: LegalAction,
): ActionTagEffectProfile | undefined {
  const effectKind = stringPayload(action, "cardImplementationEffectKind");
  if (effectKind !== "remove_tags") return undefined;
  const mode = modePayload(action);
  const amount = amountPayload(action) ?? "unknown";
  return {
    kind: "remove_tags",
    recipient: "runner",
    ...(mode !== undefined ? { mode } : {}),
    amount,
    currentTagReduction: amount,
    acuteTagRemoval: true,
    source: "legal_action_payload",
    evidence: ["LegalAction payload cardImplementationEffectKind remove_tags"],
  };
}

function withTagEffectProfile(
  candidate: ActionSemanticCandidate,
  tagEffectProfile: ActionTagEffectProfile,
): ActionSemanticCandidate {
  if (!tagEffectProfile.acuteTagRemoval) {
    return {
      ...candidate,
      tagEffectProfile,
      actionTacticSignals: uniqueStrings([
        ...candidate.actionTacticSignals,
        `tag.${tagEffectProfile.kind}`,
      ]),
      evidence: [
        ...candidate.evidence,
        ...tagEffectProfile.evidence.map((entry) => `AI-TAG-SEM:${entry}`),
      ],
    };
  }

  return {
    ...candidate,
    tagEffectProfile,
    semanticActionType: "tag.remove",
    confidence: "high",
    primaryProjectionStatus: "projected",
    actionTacticSignals: uniqueStrings([
      ...candidate.actionTacticSignals,
      "tag.remove",
    ]),
    strategySupport: [
      ...candidate.strategySupport,
      {
        strategyId: "runner_remove_tags",
        role: "primary",
        confidence: "high",
        evidence: "AI-TAG-SEM tag cleanup profile",
      },
    ],
    projectionIssues: candidate.projectionIssues.filter(
      (issue) => issue !== "ability_unresolved",
    ),
    evidence: [
      ...candidate.evidence,
      ...tagEffectProfile.evidence.map((entry) => `AI-TAG-SEM:${entry}`),
    ],
  };
}

function stringPayload(action: LegalAction, key: string): string | undefined {
  const value = action.payload?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function amountPayload(action: LegalAction): number | "all" | undefined {
  const value = action.payload?.cardImplementationTagAmount;
  if (typeof value === "number") return value;
  if (value === "all") return "all";
  return undefined;
}

function modePayload(
  action: LegalAction,
): ActionTagEffectProfile["mode"] | undefined {
  const value = action.payload?.cardImplementationTagMode;
  if (value === "amount" || value === "up_to_amount" || value === "all") {
    return value;
  }
  return undefined;
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
