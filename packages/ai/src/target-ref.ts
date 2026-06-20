export type TargetRefRedactionPolicy = "public" | "actor_private" | "hidden_blocked";

export type TargetRefKind =
  | "none"
  | "server"
  | "ice"
  | "ownInstalled"
  | "choice"
  | "access"
  | "abilitySource"
  | "hidden_blocked"
  | "unknown_unprojected";

export type TargetRef = {
  schemaVersion: "target-ref-v1";
  kind: TargetRefKind;
  ref: string;
  identity: string;
  playerActionTargetRequired: boolean;
  sideSafe: boolean;
  snapshotStable: boolean;
  redactionPolicy: TargetRefRedactionPolicy;
  blocker?: string;
  evidence: string[];
};

export type TargetRefInput =
  | { kind: "none"; evidence?: readonly string[] }
  | { kind: "server"; serverId: string; evidence?: readonly string[] }
  | { kind: "ice"; serverId: string; position: number; evidence?: readonly string[] }
  | { kind: "ownInstalled"; actorSafeRef: string; evidence?: readonly string[] }
  | { kind: "choice"; choiceId: string; optionId: string; evidence?: readonly string[] }
  | { kind: "access"; serverId: string; accessContext: string; evidence?: readonly string[] }
  | {
      kind: "abilitySource";
      sourceDefinitionId: string;
      abilityId: string;
      evidence?: readonly string[];
    }
  | { kind: "hidden_blocked"; blocker?: string; evidence?: readonly string[] }
  | { kind: "unknown_unprojected"; blocker?: string; evidence?: readonly string[] };

const HIDDEN_INFO_PATTERNS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug|deckTop|decklist|deckOrder/i;
const SERVER_PATTERN = /^(hq|rd|archives|remote_\d+|new_remote)$/;
const ID_PATTERN = /^[a-zA-Z0-9_.:-]+$/;

export function buildTargetRef(input: TargetRefInput): TargetRef {
  if (targetRefInputHasHiddenInfo(input)) {
    return hiddenBlockedTargetRef("hidden_info_marker_detected", [
      ...evidenceFor(input),
      "target_ref_redacted_after_hidden_marker_scan",
    ]);
  }
  if (input.kind === "none") {
    return {
      schemaVersion: "target-ref-v1",
      kind: "none",
      ref: "none",
      identity: "none",
      playerActionTargetRequired: false,
      sideSafe: true,
      snapshotStable: true,
      redactionPolicy: "public",
      evidence: [...evidenceFor(input), "target_ref_none"],
    };
  }
  if (input.kind === "server") {
    const serverId = sanitizeId(input.serverId);
    if (!SERVER_PATTERN.test(serverId)) {
      return unknownTargetRef("server_target_missing", [
        ...evidenceFor(input),
        `invalid_server:${serverId || "empty"}`,
      ]);
    }
    return completeTargetRef("server", `server:${serverId}`, "public", [
      ...evidenceFor(input),
      "side_safe_server_target",
    ]);
  }
  if (input.kind === "ice") {
    const serverId = sanitizeId(input.serverId);
    if (!SERVER_PATTERN.test(serverId) || input.position < 0) {
      return unknownTargetRef("ice_target_missing", evidenceFor(input));
    }
    return completeTargetRef("ice", `ice:${serverId}:${input.position}`, "public", [
      ...evidenceFor(input),
      "side_safe_ice_position_target",
    ]);
  }
  if (input.kind === "ownInstalled") {
    const actorSafeRef = sanitizeId(input.actorSafeRef);
    if (!actorSafeRef) return unknownTargetRef("own_installed_target_missing", evidenceFor(input));
    return completeTargetRef(
      "ownInstalled",
      `ownInstalled:${actorSafeRef}`,
      "actor_private",
      [...evidenceFor(input), "actor_known_installed_target"],
    );
  }
  if (input.kind === "choice") {
    const choiceId = sanitizeId(input.choiceId);
    const optionId = sanitizeId(input.optionId);
    if (!choiceId || !optionId || optionId === "unknown") {
      return unknownTargetRef("choice_option_missing", evidenceFor(input), "choice");
    }
    return completeTargetRef("choice", `choice:${choiceId}:${optionId}`, "actor_private", [
      ...evidenceFor(input),
      "side_safe_choice_option_target",
    ]);
  }
  if (input.kind === "access") {
    const serverId = sanitizeId(input.serverId);
    const accessContext = sanitizeId(input.accessContext);
    if (!SERVER_PATTERN.test(serverId) || !accessContext) {
      return unknownTargetRef("access_target_missing", evidenceFor(input), "access");
    }
    return completeTargetRef("access", `access:${serverId}:${accessContext}`, "actor_private", [
      ...evidenceFor(input),
      "side_safe_access_context_target",
    ]);
  }
  if (input.kind === "abilitySource") {
    const sourceDefinitionId = sanitizeId(input.sourceDefinitionId);
    const abilityId = sanitizeId(input.abilityId);
    if (!sourceDefinitionId || !abilityId) {
      return unknownTargetRef("ability_source_missing", evidenceFor(input), "abilitySource");
    }
    return completeTargetRef(
      "abilitySource",
      `abilitySource:${sourceDefinitionId}:${abilityId}`,
      "actor_private",
      [...evidenceFor(input), "side_safe_ability_source_target"],
    );
  }
  if (input.kind === "hidden_blocked") {
    return hiddenBlockedTargetRef(input.blocker ?? "hidden_target_blocked", evidenceFor(input));
  }
  return unknownTargetRef(input.blocker ?? "target_ref_unknown_unprojected", evidenceFor(input));
}

export function targetRefFromIdentity(
  identity: string | undefined,
  evidence: readonly string[] = [],
): TargetRef {
  if (!identity || identity === "unknown_target" || identity === "target_context_unresolved") {
    return buildTargetRef({ kind: "unknown_unprojected", blocker: "target_identity_unresolved", evidence });
  }
  if (identity === "none") return buildTargetRef({ kind: "none", evidence });
  if (identity === "unknown_hidden_blocked") {
    return buildTargetRef({ kind: "hidden_blocked", blocker: "hidden_target_identity_blocked", evidence });
  }
  if (identity === "blocked_by_hard_gate") {
    return buildTargetRef({ kind: "unknown_unprojected", blocker: "target_blocked_by_hard_gate", evidence });
  }
  const parts = identity.split(":");
  if (parts[0] === "server") {
    if (parts[1] === "unknown") {
      return buildTargetRef({ kind: "unknown_unprojected", blocker: "server_target_missing", evidence });
    }
    return buildTargetRef({ kind: "server", serverId: parts[1] ?? "", evidence });
  }
  if (parts[0] === "ice") {
    return buildTargetRef({
      kind: "ice",
      serverId: parts[1] ?? "",
      position: Number.parseInt(parts[2] ?? "-1", 10),
      evidence,
    });
  }
  if (parts[0] === "installedOwnCard" || parts[0] === "ownCard") {
    return buildTargetRef({
      kind: "ownInstalled",
      actorSafeRef: parts.slice(1).join(":"),
      evidence,
    });
  }
  if (parts[0] === "choice") {
    return buildTargetRef({
      kind: "choice",
      choiceId: parts[1] ?? "",
      optionId: parts[2] ?? "unknown",
      evidence,
    });
  }
  if (parts[0] === "access") {
    return buildTargetRef({
      kind: "access",
      serverId: parts[1] ?? "",
      accessContext: parts.slice(2).join(":"),
      evidence,
    });
  }
  if (parts[0] === "ability" || parts[0] === "abilitySource") {
    return buildTargetRef({
      kind: "abilitySource",
      sourceDefinitionId: parts[1] ?? "",
      abilityId: parts.slice(2).join(":"),
      evidence,
    });
  }
  return buildTargetRef({
    kind: "unknown_unprojected",
    blocker: "target_identity_unrecognized",
    evidence: [...evidence, `identity:${sanitizeEvidence(identity)}`],
  });
}

export function targetRefIsCompleteOrIrrelevant(targetRef: TargetRef): boolean {
  if (targetRef.kind === "none") return true;
  return targetRef.sideSafe && targetRef.snapshotStable && targetRef.blocker === undefined;
}

export function targetRefIsRedactionSafe(value: unknown): boolean {
  return !HIDDEN_INFO_PATTERNS.test(JSON.stringify(value));
}

function completeTargetRef(
  kind: Exclude<TargetRefKind, "none" | "hidden_blocked" | "unknown_unprojected">,
  identity: string,
  redactionPolicy: TargetRefRedactionPolicy,
  evidence: readonly string[],
): TargetRef {
  return {
    schemaVersion: "target-ref-v1",
    kind,
    ref: identity,
    identity,
    playerActionTargetRequired: true,
    sideSafe: true,
    snapshotStable: true,
    redactionPolicy,
    evidence: [...evidence],
  };
}

function hiddenBlockedTargetRef(blocker: string, evidence: readonly string[]): TargetRef {
  return {
    schemaVersion: "target-ref-v1",
    kind: "hidden_blocked",
    ref: "hidden_blocked",
    identity: "hidden_blocked",
    playerActionTargetRequired: true,
    sideSafe: false,
    snapshotStable: false,
    redactionPolicy: "hidden_blocked",
    blocker,
    evidence: [...evidence, "hidden_target_blocked"],
  };
}

function unknownTargetRef(
  blocker: string,
  evidence: readonly string[],
  kind: TargetRefKind = "unknown_unprojected",
): TargetRef {
  return {
    schemaVersion: "target-ref-v1",
    kind,
    ref: `${kind}:unknown`,
    identity: `${kind}:unknown`,
    playerActionTargetRequired: true,
    sideSafe: false,
    snapshotStable: false,
    redactionPolicy: "actor_private",
    blocker,
    evidence: [...evidence],
  };
}

function evidenceFor(input: TargetRefInput): string[] {
  return [...(input.evidence ?? [])];
}

function targetRefInputHasHiddenInfo(input: TargetRefInput): boolean {
  return HIDDEN_INFO_PATTERNS.test(JSON.stringify(input));
}

function sanitizeId(value: string): string {
  const trimmed = value.trim();
  if (!ID_PATTERN.test(trimmed)) {
    return trimmed.replace(/[^a-zA-Z0-9_.:-]+/g, "_").replace(/^_+|_+$/g, "");
  }
  return trimmed;
}

function sanitizeEvidence(value: string): string {
  if (HIDDEN_INFO_PATTERNS.test(value)) return "hidden_blocked";
  return sanitizeId(value).slice(0, 120);
}
