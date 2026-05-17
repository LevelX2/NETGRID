import { findObservabilityRedactionViolations, type ObservabilityRedactionViolation } from "./internet-hardening";

export type ModerationRole = "system" | "admin" | "moderator" | "support_readonly" | "reporter_self";

export type ModerationDataClass =
  | "D0_public_lobby_metadata"
  | "D1_account_pii"
  | "D2_user_generated_content"
  | "D3_public_replay_projection"
  | "D4_side_private_projection"
  | "D5_hidden_match_data"
  | "D6_ai_debug_data"
  | "D7_ops_audit_data";

export type ModerationAccessLevel = "allow" | "redacted" | "own_only" | "break_glass" | "deny";

export const MODERATION_ROLES: ModerationRole[] = ["system", "admin", "moderator", "support_readonly", "reporter_self"];

export const MODERATION_DATA_CLASSES: ModerationDataClass[] = [
  "D0_public_lobby_metadata",
  "D1_account_pii",
  "D2_user_generated_content",
  "D3_public_replay_projection",
  "D4_side_private_projection",
  "D5_hidden_match_data",
  "D6_ai_debug_data",
  "D7_ops_audit_data"
];

export const MODERATION_RBAC_MATRIX: Record<ModerationDataClass, Record<ModerationRole, ModerationAccessLevel>> = {
  D0_public_lobby_metadata: {
    system: "allow",
    admin: "allow",
    moderator: "allow",
    support_readonly: "allow",
    reporter_self: "own_only"
  },
  D1_account_pii: {
    system: "redacted",
    admin: "allow",
    moderator: "redacted",
    support_readonly: "redacted",
    reporter_self: "own_only"
  },
  D2_user_generated_content: {
    system: "allow",
    admin: "allow",
    moderator: "allow",
    support_readonly: "redacted",
    reporter_self: "own_only"
  },
  D3_public_replay_projection: {
    system: "allow",
    admin: "allow",
    moderator: "allow",
    support_readonly: "allow",
    reporter_self: "own_only"
  },
  D4_side_private_projection: {
    system: "deny",
    admin: "break_glass",
    moderator: "break_glass",
    support_readonly: "deny",
    reporter_self: "own_only"
  },
  D5_hidden_match_data: {
    system: "deny",
    admin: "break_glass",
    moderator: "deny",
    support_readonly: "deny",
    reporter_self: "deny"
  },
  D6_ai_debug_data: {
    system: "deny",
    admin: "redacted",
    moderator: "deny",
    support_readonly: "deny",
    reporter_self: "deny"
  },
  D7_ops_audit_data: {
    system: "allow",
    admin: "allow",
    moderator: "redacted",
    support_readonly: "redacted",
    reporter_self: "deny"
  }
};

export type ModerationEvidenceViolation = ObservabilityRedactionViolation & {
  source: "observability_baseline";
};

export function moderationAccessFor(role: ModerationRole, dataClass: ModerationDataClass): ModerationAccessLevel {
  return MODERATION_RBAC_MATRIX[dataClass][role];
}

export function findModerationEvidenceRedactionViolations(value: unknown): ModerationEvidenceViolation[] {
  return findObservabilityRedactionViolations(value).map((violation) => ({ ...violation, source: "observability_baseline" }));
}

export function isStandardModeratorAccessAllowed(role: ModerationRole, dataClass: ModerationDataClass): boolean {
  const access = moderationAccessFor(role, dataClass);
  return access === "allow" || access === "redacted" || access === "own_only";
}
