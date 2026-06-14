import type { LegalAction, Side } from "@netgrid/shared";
import {
  buildTargetRef,
  type TargetRef,
  type TargetRefRedactionPolicy,
} from "./target-ref";

export type LegalActionWitnessRedactionPolicy =
  TargetRefRedactionPolicy;

export type LegalActionWitnessSourceRef =
  | { kind: "basic_action"; ref: "basic_action"; redactionPolicy: "public" }
  | { kind: "game_rule"; ref: "game_rule"; redactionPolicy: "public" }
  | {
      kind: "actor_known_card";
      ref: string;
      redactionPolicy: "actor_private";
    }
  | { kind: "hidden_blocked"; ref: "hidden_blocked"; redactionPolicy: "hidden_blocked" };

export type LegalActionWitnessAbilityRef = {
  kind: "ability";
  abilityId: string;
  sourceRef: LegalActionWitnessSourceRef;
  redactionPolicy: LegalActionWitnessRedactionPolicy;
};

export type LegalActionWitnessTargetRef = TargetRef;

export type LegalActionWitnessChoiceRef = {
  kind: "choice";
  choiceId: string;
  optionIds: string[];
  redactionPolicy: LegalActionWitnessRedactionPolicy;
};

export type LegalActionWitnessCostProfile = {
  clickCost: number;
  creditCost: number;
  additionalCosts: string[];
};

export type LegalActionWitnessTimingProfile = {
  timingPoint: string;
  expiresAtStateVersion: number;
};

export type LegalActionWitness = {
  schemaVersion: "legalaction-witness-v1";
  witnessKey: string;
  actionId: string;
  stateVersion: number;
  side: Side;
  actionType: string;
  sourceRef: LegalActionWitnessSourceRef;
  abilityRef?: LegalActionWitnessAbilityRef;
  targetRef: LegalActionWitnessTargetRef;
  choiceRef?: LegalActionWitnessChoiceRef;
  costProfile: LegalActionWitnessCostProfile;
  timingProfile: LegalActionWitnessTimingProfile;
  redactionPolicy: LegalActionWitnessRedactionPolicy;
  blockers: string[];
  evidence: string[];
};

export type BuildLegalActionWitnessInput = {
  legalAction: LegalAction;
  stateVersion: number;
  selectedTargets?: Readonly<Record<string, string>>;
  selectedChoices?: Readonly<Record<string, unknown>>;
};

const HIDDEN_INFO_PATTERNS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug|deckTop|decklist|deckOrder/i;

export function buildLegalActionWitness(
  input: BuildLegalActionWitnessInput,
): LegalActionWitness {
  const sourceRef = sourceRefForAction(input.legalAction);
  const targetRef = targetRefForAction(
    input.legalAction,
    input.selectedTargets,
    input.selectedChoices,
  );
  const choiceRef = choiceRefForAction(input.legalAction);
  const abilityRef = abilityRefForAction(input.legalAction, sourceRef);
  const redactionPolicy = combineRedactionPolicies([
    sourceRef.redactionPolicy,
    targetRef.redactionPolicy,
    choiceRef?.redactionPolicy,
    abilityRef?.redactionPolicy,
  ]);
  const blockers = [
    ...(targetRef.kind === "hidden_blocked" ? ["target_ref_hidden_blocked"] : []),
    ...(targetRef.kind === "unknown_unprojected" && targetRef.playerActionTargetRequired
      ? ["target_ref_unknown_unprojected"]
      : []),
    ...(sourceRef.kind === "hidden_blocked" ? ["source_ref_hidden_blocked"] : []),
  ];
  const witness: LegalActionWitness = {
    schemaVersion: "legalaction-witness-v1",
    witnessKey: [
      input.legalAction.actionId,
      input.stateVersion,
      input.legalAction.side,
      input.legalAction.type,
      targetRef.ref,
      choiceRef?.choiceId ?? "no-choice",
    ].join("|"),
    actionId: input.legalAction.actionId,
    stateVersion: input.stateVersion,
    side: input.legalAction.side,
    actionType: input.legalAction.type,
    sourceRef,
    ...(abilityRef ? { abilityRef } : {}),
    targetRef,
    ...(choiceRef ? { choiceRef } : {}),
    costProfile: costProfileForAction(input.legalAction),
    timingProfile: {
      timingPoint: input.legalAction.timingPoint,
      expiresAtStateVersion: input.legalAction.expiresAtStateVersion,
    },
    redactionPolicy,
    blockers,
    evidence: [
      "legalaction_witness_from_existing_legalaction",
      `visibility:${input.legalAction.visibility}`,
      input.legalAction.payload?.serverId ? "server_from_legalaction_payload" : "server_not_present",
      choiceRef ? "choice_requirements_present" : "choice_requirements_absent",
    ],
  };

  if (legalActionWitnessIsRedactionSafe(witness)) return witness;
  const { abilityRef: _abilityRef, choiceRef: _choiceRef, ...redactedBase } = witness;
  return {
    ...redactedBase,
    sourceRef: { kind: "hidden_blocked", ref: "hidden_blocked", redactionPolicy: "hidden_blocked" },
    targetRef: {
      ...buildTargetRef({ kind: "hidden_blocked", blocker: "hidden_info_marker_detected" }),
    },
    redactionPolicy: "hidden_blocked",
    blockers: [...new Set([...witness.blockers, "hidden_info_marker_detected"])].sort(),
    evidence: [...witness.evidence, "witness_redacted_after_hidden_marker_scan"],
  };
}

export function legalActionWitnessIsRedactionSafe(value: unknown): boolean {
  return !HIDDEN_INFO_PATTERNS.test(JSON.stringify(value));
}

function sourceRefForAction(action: LegalAction): LegalActionWitnessSourceRef {
  if (action.source === "basic_action") {
    return { kind: "basic_action", ref: "basic_action", redactionPolicy: "public" };
  }
  if (action.source === "game_rule") {
    return { kind: "game_rule", ref: "game_rule", redactionPolicy: "public" };
  }
  if (HIDDEN_INFO_PATTERNS.test(action.source)) {
    return { kind: "hidden_blocked", ref: "hidden_blocked", redactionPolicy: "hidden_blocked" };
  }
  return {
    kind: "actor_known_card",
    ref: `actorKnownRef:${stableHash(action.source)}`,
    redactionPolicy: "actor_private",
  };
}

function abilityRefForAction(
  action: LegalAction,
  sourceRef: LegalActionWitnessSourceRef,
): LegalActionWitnessAbilityRef | undefined {
  if (!action.abilityRef) return undefined;
  return {
    kind: "ability",
    abilityId: safeId(action.abilityRef.abilityId),
    sourceRef,
    redactionPolicy: sourceRef.redactionPolicy,
  };
}

function targetRefForAction(
  action: LegalAction,
  selectedTargets: Readonly<Record<string, string>> | undefined,
  selectedChoices: Readonly<Record<string, unknown>> | undefined,
): LegalActionWitnessTargetRef {
  const serverId = stringPayload(action, "serverId");
  if (serverId) {
    return {
      ...buildTargetRef({ kind: "server", serverId }),
    };
  }
  const selectedTarget = firstRecordValue(selectedTargets);
  if (selectedTarget) {
    if (HIDDEN_INFO_PATTERNS.test(selectedTarget)) {
      return {
        ...buildTargetRef({ kind: "hidden_blocked", blocker: "hidden_target_blocked" }),
      };
    }
    return {
      ...buildTargetRef({
        kind: "ownInstalled",
        actorSafeRef: `actorKnownRef:${stableHash(selectedTarget)}`,
      }),
    };
  }
  if (action.choiceRequirements && action.choiceRequirements.length > 0) {
    const selection = selectedChoiceForAction(action, selectedChoices);
    return {
      ...buildTargetRef({
        kind: "choice",
        choiceId: selection.choiceId,
        optionId: selection.optionId,
      }),
    };
  }
  if (action.targetRequirements.length === 0) {
    return {
      ...buildTargetRef({ kind: "none" }),
    };
  }
  return {
    ...buildTargetRef({
      kind: "unknown_unprojected",
      blocker: "target_ref_unknown_unprojected",
      evidence: [`visibility:${action.visibility}`],
    }),
  };
}

function choiceRefForAction(action: LegalAction): LegalActionWitnessChoiceRef | undefined {
  const choice = action.choiceRequirements?.[0];
  if (!choice) return undefined;
  return {
    kind: "choice",
    choiceId: safeId(choice.choiceId),
    optionIds: choice.optionIds.map(safeId).sort(),
    redactionPolicy: "actor_private",
  };
}

function selectedChoiceForAction(
  action: LegalAction,
  selectedChoices: Readonly<Record<string, unknown>> | undefined,
): { choiceId: string; optionId: string } {
  const requirement = action.choiceRequirements?.[0];
  const choiceId =
    stringRecordValue(selectedChoices, "choiceId") ?? requirement?.choiceId ?? "unknown";
  const selectedOptionIds = selectedChoices?.selectedOptionIds;
  const optionId =
    Array.isArray(selectedOptionIds) && typeof selectedOptionIds[0] === "string"
      ? selectedOptionIds[0]
      : "unknown";
  return { choiceId, optionId };
}

function costProfileForAction(action: LegalAction): LegalActionWitnessCostProfile {
  let clickCost = 0;
  let creditCost = 0;
  for (const cost of action.costs) {
    clickCost += cost.clicks ?? 0;
    creditCost += cost.credits ?? 0;
  }
  return { clickCost, creditCost, additionalCosts: [] };
}

function stringPayload(action: LegalAction, key: string): string | undefined {
  const value = action.payload?.[key];
  return typeof value === "string" ? value : undefined;
}

function firstRecordValue(record: Readonly<Record<string, string>> | undefined): string | undefined {
  if (!record) return undefined;
  return Object.values(record)[0];
}

function stringRecordValue(
  record: Readonly<Record<string, unknown>> | undefined,
  key: string,
): string | undefined {
  const value = record?.[key];
  return typeof value === "string" ? value : undefined;
}

function combineRedactionPolicies(
  policies: readonly (LegalActionWitnessRedactionPolicy | undefined)[],
): LegalActionWitnessRedactionPolicy {
  if (policies.includes("hidden_blocked")) return "hidden_blocked";
  if (policies.includes("actor_private")) return "actor_private";
  return "public";
}

function safeId(value: string): string {
  if (HIDDEN_INFO_PATTERNS.test(value)) return "hidden_blocked";
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_.:-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
