export const ACCESS_INTENTS = [
  "steal",
  "trash",
  "access_only",
  "decline",
] as const;

export const ACCESS_DECISION_REASONS = [
  "agenda_payoff",
  "trash_affordable",
  "insufficient_credits",
  "reserve_would_break",
  "low_value_target",
  "finite_pool_depleted",
  "target_unavailable",
  "unknown",
] as const;

export const ACCESS_TARGET_KINDS = [
  "agenda",
  "asset",
  "node",
  "upgrade",
  "unknown",
] as const;

export type AccessIntent = (typeof ACCESS_INTENTS)[number];
export type AccessDecisionReason = (typeof ACCESS_DECISION_REASONS)[number];
export type AccessTargetKind = (typeof ACCESS_TARGET_KINDS)[number];
