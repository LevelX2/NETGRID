export type TargetIdentityKind =
  | "server"
  | "ice"
  | "ownCard"
  | "choice"
  | "access"
  | "none"
  | "unknown_hidden_blocked"
  | "unknown_unresolved";

export type TargetIdentityResolutionStatus =
  | "complete"
  | "irrelevant"
  | "blocked_hidden_info"
  | "blocked_unresolved";

export type TargetIdentityResolution = {
  schemaVersion: "target-identity-resolution-v1";
  status: TargetIdentityResolutionStatus;
  kind: TargetIdentityKind;
  identity: string;
  blocker?: string;
  evidence: string[];
};

export type TargetIdentityResolverInput = {
  actionType: string;
  targetIdentity?: string;
  targetContextStatus?: string;
  sourceDefinitionId?: string;
  actorSide?: "runner" | "corp";
};

export type CandidateTargetIdentityKind =
  | "server"
  | "ice"
  | "installedOwnCard"
  | "choice"
  | "access"
  | "ability"
  | "none"
  | "hidden_blocked"
  | "unknown_unresolved";

export type CandidateTargetIdentityResolutionStatus =
  | "complete"
  | "irrelevant"
  | "blocked_hidden_info"
  | "blocked_unresolved";

export type CandidateTargetIdentityResolution = {
  schemaVersion: "target-identity-resolution-v2";
  status: CandidateTargetIdentityResolutionStatus;
  kind: CandidateTargetIdentityKind;
  identity: string;
  playerActionTargetRequired: boolean;
  sideSafe: boolean;
  snapshotStable: boolean;
  blocker?: string;
  evidence: string[];
};

export type CandidateTargetIdentityResolverInput = TargetIdentityResolverInput & {
  abilityId?: string;
  hardGateSummary?: string;
};

const SERVER_PATTERN = /^server:(hq|rd|archives|remote_\d+)$/;
const ICE_PATTERN = /^ice:(hq|rd|archives|remote_\d+):\d+(?::[a-z0-9_.-]+)?$/i;
const OWN_CARD_PATTERN = /^ownCard:[a-zA-Z0-9_-]+:[a-zA-Z0-9_.:-]+$/;
const CHOICE_PATTERN = /^choice:[a-zA-Z0-9_.:-]+:[a-zA-Z0-9_.:-]+$/;
const ACCESS_PATTERN = /^access:(hq|rd|archives|remote_\d+):[a-zA-Z0-9_.:-]+$/;
const INSTALLED_OWN_CARD_PATTERN =
  /^installedOwnCard:[a-zA-Z0-9_.:-]+:[a-zA-Z0-9_.:-]+$/;
const ABILITY_PATTERN = /^ability:[a-zA-Z0-9_.:-]+:[a-zA-Z0-9_.:-]+$/;

export function resolveTargetIdentity(
  input: TargetIdentityResolverInput,
): TargetIdentityResolution {
  const targetIdentity = input.targetIdentity ?? "unknown_target";
  if (targetIdentity === "none") {
    return {
      schemaVersion: "target-identity-resolution-v1",
      status: "irrelevant",
      kind: "none",
      identity: "none",
      evidence: ["target identity irrelevant for this action family"],
    };
  }
  if (targetIdentity === "unknown_hidden_blocked") {
    return blocked("unknown_hidden_blocked", "hidden_target_identity_blocked", [
      "target context explicitly blocked by hidden-info policy",
    ]);
  }
  if (targetIdentity === "blocked_by_hard_gate") {
    return blocked("unknown_unresolved", "target_blocked_by_hard_gate", [
      "target context was blocked by a hard gate before identity proof",
    ]);
  }
  if (SERVER_PATTERN.test(targetIdentity)) {
    return complete("server", targetIdentity, ["side-safe server identity"]);
  }
  if (ICE_PATTERN.test(targetIdentity)) {
    return complete("ice", targetIdentity, ["side-safe ICE position identity"]);
  }
  if (OWN_CARD_PATTERN.test(targetIdentity)) {
    return complete("ownCard", targetIdentity, ["actor-owned card identity"]);
  }
  if (CHOICE_PATTERN.test(targetIdentity)) {
    return complete("choice", targetIdentity, ["side-safe choice option identity"]);
  }
  if (ACCESS_PATTERN.test(targetIdentity)) {
    return complete("access", targetIdentity, ["side-safe access context identity"]);
  }
  if (targetIdentity === "server:unknown") {
    return blocked("server", "server_target_missing", [
      "run-like action lacks a concrete side-safe server id",
    ]);
  }
  if (targetIdentity === "choice:unknown") {
    return blocked("choice", "choice_option_missing", [
      "choice action lacks a concrete side-safe option id",
    ]);
  }
  return blocked("unknown_unresolved", "target_identity_unresolved_from_snapshot", [
    `no stable target identity for ${input.actionType}`,
    ...(input.targetContextStatus ? [`targetContextStatus:${input.targetContextStatus}`] : []),
  ]);
}

export function resolveCandidateTargetIdentity(
  input: CandidateTargetIdentityResolverInput,
): CandidateTargetIdentityResolution {
  const targetIdentity = normalizeCandidateTargetIdentity(input);
  if (targetIdentity === "none") {
    return candidateComplete("none", "none", false, [
      "target identity irrelevant for candidate action family",
    ]);
  }
  if (targetIdentity === "unknown_hidden_blocked") {
    return candidateBlocked(
      "hidden_blocked",
      "hidden_blocked",
      "hidden_target_identity_blocked",
      true,
      ["target context explicitly blocked by hidden-info policy"],
    );
  }
  if (targetIdentity === "blocked_by_hard_gate") {
    return candidateBlocked(
      "unknown_unresolved",
      "blocked_by_hard_gate",
      "target_blocked_by_hard_gate",
      true,
      ["target context was blocked by a hard gate before identity proof"],
    );
  }
  if (SERVER_PATTERN.test(targetIdentity)) {
    return candidateComplete("server", targetIdentity, true, [
      "side-safe server identity",
    ]);
  }
  if (ICE_PATTERN.test(targetIdentity)) {
    return candidateComplete("ice", targetIdentity, true, [
      "side-safe ICE position identity without private definition",
    ]);
  }
  if (INSTALLED_OWN_CARD_PATTERN.test(targetIdentity) || OWN_CARD_PATTERN.test(targetIdentity)) {
    return candidateComplete("installedOwnCard", targetIdentity, true, [
      "actor-known installed or installable card reference from snapshot",
    ]);
  }
  if (CHOICE_PATTERN.test(targetIdentity)) {
    return candidateComplete("choice", targetIdentity, true, [
      "side-safe choice option identity",
    ]);
  }
  if (ACCESS_PATTERN.test(targetIdentity)) {
    return candidateComplete("access", targetIdentity, true, [
      "side-safe access context identity",
    ]);
  }
  if (ABILITY_PATTERN.test(targetIdentity)) {
    return candidateComplete("ability", targetIdentity, true, [
      "side-safe ability source identity",
    ]);
  }
  if (targetIdentity === "server:unknown") {
    return candidateBlocked("server", "server:unknown", "server_target_missing", true, [
      "run-like action lacks a concrete side-safe server id",
    ]);
  }
  if (targetIdentity === "choice:unknown") {
    return candidateBlocked("choice", "choice:unknown", "choice_option_missing", true, [
      "choice action lacks a concrete side-safe option id",
    ]);
  }
  return candidateBlocked(
    "unknown_unresolved",
    targetIdentity,
    "target_identity_unresolved_from_snapshot",
    playerActionTargetRequired(input.actionType),
    [
      `no stable candidate target identity for ${input.actionType}`,
      ...(input.targetContextStatus ? [`targetContextStatus:${input.targetContextStatus}`] : []),
      ...(input.hardGateSummary ? [`hardGateSummary:${input.hardGateSummary}`] : []),
    ],
  );
}

function complete(
  kind: TargetIdentityKind,
  identity: string,
  evidence: string[],
): TargetIdentityResolution {
  return {
    schemaVersion: "target-identity-resolution-v1",
    status: "complete",
    kind,
    identity,
    evidence,
  };
}

function blocked(
  kind: TargetIdentityKind,
  blocker: string,
  evidence: string[],
): TargetIdentityResolution {
  return {
    schemaVersion: "target-identity-resolution-v1",
    status: kind === "unknown_hidden_blocked" ? "blocked_hidden_info" : "blocked_unresolved",
    kind,
    identity: kind,
    blocker,
    evidence,
  };
}

function normalizeCandidateTargetIdentity(
  input: CandidateTargetIdentityResolverInput,
): string {
  const targetIdentity = input.targetIdentity ?? "unknown_target";
  if (targetIdentity !== "unknown_target") return targetIdentity;
  if (!playerActionTargetRequired(input.actionType)) return "none";
  if (input.actionType === "trigger_ability" && input.sourceDefinitionId && input.abilityId) {
    return `ability:${slug(input.sourceDefinitionId)}:${slug(input.abilityId)}`;
  }
  if (input.sourceDefinitionId && actorKnownSourceActions.has(input.actionType)) {
    return `installedOwnCard:actorKnownRef:${slug(input.sourceDefinitionId)}`;
  }
  return targetIdentity;
}

function playerActionTargetRequired(actionType: string): boolean {
  return !noTargetActionTypes.has(actionType);
}

const noTargetActionTypes = new Set([
  "gain_credit",
  "draw_card",
  "end_turn",
  "continue_run",
  "jack_out",
  "decline_rez",
  "steal_agenda",
  "trash_accessed_card",
  "finish_access",
]);

const actorKnownSourceActions = new Set([
  "install_card",
  "play_event",
  "play_operation",
  "advance_card",
  "rez_ice",
  "rez_card",
  "score_agenda",
]);

function candidateComplete(
  kind: CandidateTargetIdentityKind,
  identity: string,
  playerActionTargetRequiredValue: boolean,
  evidence: string[],
): CandidateTargetIdentityResolution {
  return {
    schemaVersion: "target-identity-resolution-v2",
    status: kind === "none" ? "irrelevant" : "complete",
    kind,
    identity,
    playerActionTargetRequired: playerActionTargetRequiredValue,
    sideSafe: true,
    snapshotStable: true,
    evidence,
  };
}

function candidateBlocked(
  kind: CandidateTargetIdentityKind,
  identity: string,
  blocker: string,
  playerActionTargetRequiredValue: boolean,
  evidence: string[],
): CandidateTargetIdentityResolution {
  return {
    schemaVersion: "target-identity-resolution-v2",
    status: kind === "hidden_blocked" ? "blocked_hidden_info" : "blocked_unresolved",
    kind,
    identity,
    playerActionTargetRequired: playerActionTargetRequiredValue,
    sideSafe: false,
    snapshotStable: false,
    blocker,
    evidence,
  };
}

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}
