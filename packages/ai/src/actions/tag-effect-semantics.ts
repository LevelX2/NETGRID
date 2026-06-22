import type { CardDefinitionId, LegalAction } from "@netgrid/shared";
import type {
  ActionTagEffectProfile,
  ActionSemanticCandidate,
} from "../action-semantic-candidate";

type TagEffectDescriptor = Omit<
  ActionTagEffectProfile,
  "recipient" | "source" | "evidence"
> & {
  actionTypes: readonly LegalAction["type"][];
  evidence: readonly string[];
};

const TAG_EFFECT_DESCRIPTORS_BY_DEFINITION_ID: Readonly<
  Record<CardDefinitionId, TagEffectDescriptor>
> = {
  "onr_v1_158_danshis-second-id": {
    kind: "remove_tags",
    mode: "up_to_amount",
    amount: 3,
    acuteTagRemoval: true,
    actionTypes: ["activated_card_ability"],
    evidence: ["CardImplementation ability effect remove_tags up_to_amount 3"],
  },
  "onr_v1_170_nomad-allies": {
    kind: "remove_tags",
    mode: "amount",
    amount: 1,
    acuteTagRemoval: true,
    actionTypes: ["activated_card_ability"],
    evidence: ["CardImplementation ability effect remove_tags amount 1"],
  },
  "onr_v1_102_open-ended-mileage-program": {
    kind: "remove_tags",
    mode: "amount",
    amount: 1,
    acuteTagRemoval: true,
    actionTypes: ["play_event"],
    evidence: ["CardImplementation on-play effect remove_tags amount 1"],
  },
  "onr_v1_116_total-genetic-retrofit": {
    kind: "remove_tags",
    mode: "all",
    amount: "all",
    acuteTagRemoval: true,
    actionTypes: ["play_event"],
    evidence: ["CardImplementation on-play effect remove_tags all"],
  },
  "onr_v1_120_armadillo-armored-road-home": {
    kind: "tag_clear_support",
    mode: "support_only",
    amount: "unknown",
    acuteTagRemoval: false,
    actionTypes: ["install_card", "trigger_ability", "activated_card_ability"],
    evidence: ['Restricted hosted credits usableFor ["remove_tags"]'],
  },
  "onr_v1_126_drifter-mobile-environment": {
    kind: "tag_clear_support",
    mode: "support_only",
    amount: "unknown",
    acuteTagRemoval: false,
    actionTypes: ["install_card", "trigger_ability", "activated_card_ability"],
    evidence: ['Restricted hosted credits usableFor ["remove_tags"]'],
  },
  "onr_v1_161_fall-guy": {
    kind: "avoid_tag",
    mode: "support_only",
    amount: 1,
    acuteTagRemoval: false,
    actionTypes: ["trigger_ability", "activated_card_ability"],
    evidence: ["CardImplementation tagPreventionSources avoid_tag"],
  },
  "onr_v1_135_nasuko-cycle": {
    kind: "avoid_tag",
    mode: "support_only",
    amount: 1,
    acuteTagRemoval: false,
    actionTypes: ["trigger_ability", "activated_card_ability"],
    evidence: ["CardImplementation tagPreventionSources avoid_tag"],
  },
  "onr_v1_167_leland-corporate-bodyguard": {
    kind: "avoid_tag",
    mode: "support_only",
    amount: 1,
    acuteTagRemoval: false,
    actionTypes: ["trigger_ability", "activated_card_ability"],
    evidence: ["CardImplementation tagPreventionSources avoid_tag"],
  },
  "onr_v1_187_wilson-weeflerunner-apprentice": {
    kind: "avoid_tag",
    mode: "support_only",
    amount: 1,
    acuteTagRemoval: false,
    actionTypes: ["trigger_ability", "activated_card_ability"],
    evidence: ["CardImplementation tagPreventionSources avoid_tag"],
  },
};

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

  const descriptor =
    candidate.sourceDefinitionId !== undefined
      ? TAG_EFFECT_DESCRIPTORS_BY_DEFINITION_ID[candidate.sourceDefinitionId]
      : undefined;
  if (!descriptor || !descriptor.actionTypes.includes(action.type)) {
    return candidate;
  }

  return withTagEffectProfile(candidate, {
    kind: descriptor.kind,
    recipient: "runner",
    ...(descriptor.mode !== undefined ? { mode: descriptor.mode } : {}),
    ...(descriptor.amount !== undefined ? { amount: descriptor.amount } : {}),
    ...(descriptor.acuteTagRemoval
      ? { currentTagReduction: descriptor.amount ?? "unknown" }
      : {}),
    acuteTagRemoval: descriptor.acuteTagRemoval,
    source: "card_implementation",
    evidence: [...descriptor.evidence],
  });
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
