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

const SERVER_PATTERN = /^server:(hq|rd|archives|remote_\d+)$/;
const ICE_PATTERN = /^ice:(hq|rd|archives|remote_\d+):\d+(?::[a-z0-9_.-]+)?$/i;
const OWN_CARD_PATTERN = /^ownCard:[a-zA-Z0-9_-]+:[a-zA-Z0-9_.:-]+$/;
const CHOICE_PATTERN = /^choice:[a-zA-Z0-9_.:-]+:[a-zA-Z0-9_.:-]+$/;
const ACCESS_PATTERN = /^access:(hq|rd|archives|remote_\d+):[a-zA-Z0-9_.:-]+$/;

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
