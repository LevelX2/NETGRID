import type { Side } from "@netgrid/shared";

import type { AiHintOntologyExtension } from "./hint-ontology";

export {
  AI_ACTION_PLAN_OWNERS,
  AI_ACTION_PLAN_OWNER_ROUTES,
  validateAiHintActionPlanOwnerBindings,
} from "./action-plan-owner-contracts";
export type {
  AiActionPlanOwner,
  AiActionPlanOwnerRoute,
  AiHintActionPlanOwnerBinding,
  AiHintActionPlanOwnerBindingIssue,
} from "./action-plan-owner-contracts";

export type AiCardHint = AiHintOntologyExtension & {
  cardId: string;
  side: Side;
  cardType?: string;
  roles: string[];
  planRoles: string[];
  strategicRole?: string[];
  riskTags?: string[];
  requiredMechanics?: string[];
  aiSupportStatus: "none" | "hinted_only" | "scenario_ready" | "ai_supported";
  valueHints?: AiRuntimeValueHints;
  manualNotes?: string[];
  strategicNotes?: string[];
  descriptorGaps?: string[];
  opponentSignals?: Array<
    Record<string, unknown> & { visibleEvidenceOnly: true }
  >;
  scenarioRefs?: string[];
};

export type AiRuntimeValueHintKey =
  | "damage"
  | "economy"
  | "installCreditGain"
  | "leavePlayPayCost"
  | "remoteRootValue"
  | "startOfTurnCreditLoss";

export type AiRuntimeValueHints = Partial<
  Record<AiRuntimeValueHintKey, number>
>;

export const CARD_SPEC_AI_HINT_COMPILER_VERSION =
  "card-spec-ai-hint-compiler-v2" as const;
export const CARD_SPEC_AI_HINT_ARTIFACT_SCHEMA_VERSION =
  "card-spec-ai-hint-artifact-v2" as const;

export type CardSpecAiHintArtifact = {
  schemaVersion: typeof CARD_SPEC_AI_HINT_ARTIFACT_SCHEMA_VERSION;
  compilerVersion: typeof CARD_SPEC_AI_HINT_COMPILER_VERSION;
  evidence: {
    scenarioPackId: string;
    scenarioId: string;
    status: "ai_supported";
    fingerprint: string;
  };
  cardIds: string[];
  cards: Array<{
    cardId: string;
    cardRulesFingerprint: string;
    planningAnnotationsFingerprint: string;
    hint: AiCardHint;
  }>;
};

export type AiHintActionCapabilitySemanticsContractIssue = {
  severity: "error";
  kind: "invalid_shape";
  path: string;
  message: string;
};

export function validateAiHintActionCapabilitySemanticsContract(
  semantics: unknown,
): {
  valid: boolean;
  issues: AiHintActionCapabilitySemanticsContractIssue[];
  errors: AiHintActionCapabilitySemanticsContractIssue[];
  warnings: never[];
} {
  const errors: AiHintActionCapabilitySemanticsContractIssue[] = [];
  const addError = (path: string, message: string): void => {
    errors.push({ severity: "error", kind: "invalid_shape", path, message });
  };
  const path = "$.actionCapabilitySemantics";
  if (semantics === undefined)
    return { valid: true, issues: errors, errors, warnings: [] };
  if (!Array.isArray(semantics)) {
    addError(path, "Expected array.");
    return { valid: false, issues: errors, errors, warnings: [] };
  }

  const seen = new Set<string>();
  let previousCapabilityKey: string | undefined;
  semantics.forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;
    if (!isRecord(entry)) {
      addError(entryPath, "Expected object.");
      return;
    }
    const unknownKeys = Object.keys(entry).filter(
      (key) =>
        ![
          "capabilityKey",
          "costProfile",
          "effects",
          "functionSignals",
          "conditions",
          "targetProfiles",
          "strategySupportPairs",
        ].includes(key),
    );
    if (unknownKeys.length > 0)
      addError(entryPath, `Unknown fields: ${unknownKeys.join(",")}.`);
    if (
      typeof entry.capabilityKey !== "string" ||
      entry.capabilityKey.length === 0
    )
      addError(`${entryPath}.capabilityKey`, "Expected non-empty string.");
    else {
      if (seen.has(entry.capabilityKey))
        addError(
          `${entryPath}.capabilityKey`,
          "Capability semantics must be unique.",
        );
      if (
        previousCapabilityKey !== undefined &&
        previousCapabilityKey.localeCompare(entry.capabilityKey) >= 0
      )
        addError(
          `${entryPath}.capabilityKey`,
          "Capability semantics must be strictly sorted by capabilityKey.",
        );
      seen.add(entry.capabilityKey);
      previousCapabilityKey = entry.capabilityKey;
    }
    for (const field of [
      "effects",
      "conditions",
      "targetProfiles",
      "strategySupportPairs",
    ] as const)
      if (
        entry[field] !== undefined &&
        (!Array.isArray(entry[field]) ||
          entry[field].some((value) => !isRecord(value)))
      )
        addError(`${entryPath}.${field}`, "Expected an array of objects.");
    if (
      entry.functionSignals !== undefined &&
      (!Array.isArray(entry.functionSignals) ||
        entry.functionSignals.some(
          (signal) => typeof signal !== "string" || signal.length === 0,
        ))
    )
      addError(`${entryPath}.functionSignals`, "Expected non-empty strings.");
    if (entry.costProfile !== undefined) {
      if (!isRecord(entry.costProfile)) {
        addError(`${entryPath}.costProfile`, "Expected object.");
      } else {
        for (const key of ["clicks", "credits"] as const) {
          const value = entry.costProfile[key];
          if (
            value !== undefined &&
            (typeof value !== "number" || !Number.isFinite(value) || value < 0)
          )
            addError(
              `${entryPath}.costProfile.${key}`,
              "Expected a finite non-negative number.",
            );
        }
      }
    }
  });

  return {
    valid: errors.length === 0,
    issues: errors,
    errors,
    warnings: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
