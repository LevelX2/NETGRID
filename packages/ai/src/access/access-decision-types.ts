export type AccessIntent =
  | "steal"
  | "trash"
  | "access_only"
  | "decline";

export type AccessDecisionReason =
  | "agenda_payoff"
  | "trash_affordable"
  | "insufficient_credits"
  | "reserve_would_break"
  | "low_value_target"
  | "finite_pool_depleted"
  | "target_unavailable"
  | "unknown";

export type AccessTargetKind =
  | "agenda"
  | "asset"
  | "node"
  | "upgrade"
  | "unknown";

export const ACCESS_INTENTS: readonly AccessIntent[] = [
  "steal",
  "trash",
  "access_only",
  "decline",
];

export const ACCESS_DECISION_REASONS: readonly AccessDecisionReason[] = [
  "agenda_payoff",
  "trash_affordable",
  "insufficient_credits",
  "reserve_would_break",
  "low_value_target",
  "finite_pool_depleted",
  "target_unavailable",
  "unknown",
];

export const ACCESS_TARGET_KINDS: readonly AccessTargetKind[] = [
  "agenda",
  "asset",
  "node",
  "upgrade",
  "unknown",
];

