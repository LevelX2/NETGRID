import {
  DEFAULT_TRACE_RULES_PROFILE,
  type GameState,
  type TraceRulesProfile,
  type TraceState,
} from "@netgrid/shared";

export type TraceRulesDefinition = {
  profile: TraceRulesProfile;
  resolutionMode: "open_sequential" | "hidden_commit_reveal";
  corpBaseStrengthMode: "printed_trace" | "none";
  corpBidLimitMode: "payment_capacity" | "effective_trace_limit";
  corpBidVisibility: "immediate" | "after_both_commit";
  runnerBidVisibility: "after_both_commit";
  runnerLinkSpendMode: "generic_credit_per_link" | "printed_card_modifiers";
  tieWinner: "runner" | "corp";
};

const TRACE_RULES_DEFINITIONS: Record<TraceRulesProfile, TraceRulesDefinition> =
  {
    modern_open: {
      profile: "modern_open",
      resolutionMode: "open_sequential",
      corpBaseStrengthMode: "printed_trace",
      corpBidLimitMode: "payment_capacity",
      corpBidVisibility: "immediate",
      runnerBidVisibility: "after_both_commit",
      runnerLinkSpendMode: "generic_credit_per_link",
      tieWinner: "runner",
    },
    classic_blind: {
      profile: "classic_blind",
      resolutionMode: "hidden_commit_reveal",
      corpBaseStrengthMode: "none",
      corpBidLimitMode: "effective_trace_limit",
      corpBidVisibility: "after_both_commit",
      runnerBidVisibility: "after_both_commit",
      runnerLinkSpendMode: "printed_card_modifiers",
      tieWinner: "runner",
    },
    classic_blind_corp_ties: {
      profile: "classic_blind_corp_ties",
      resolutionMode: "hidden_commit_reveal",
      corpBaseStrengthMode: "none",
      corpBidLimitMode: "effective_trace_limit",
      corpBidVisibility: "after_both_commit",
      runnerBidVisibility: "after_both_commit",
      runnerLinkSpendMode: "printed_card_modifiers",
      tieWinner: "corp",
    },
  };

export function isTraceRulesProfile(
  value: unknown,
): value is TraceRulesProfile {
  return (
    value === "modern_open" ||
    value === "classic_blind" ||
    value === "classic_blind_corp_ties"
  );
}

export function normalizeTraceRulesProfile(value: unknown): TraceRulesProfile {
  return isTraceRulesProfile(value) ? value : DEFAULT_TRACE_RULES_PROFILE;
}

export function traceRulesDefinition(
  profile: TraceRulesProfile | undefined,
): TraceRulesDefinition {
  return TRACE_RULES_DEFINITIONS[normalizeTraceRulesProfile(profile)];
}

export function traceRulesDefinitionForState(
  state: Pick<GameState, "traceRulesProfile">,
): TraceRulesDefinition {
  return traceRulesDefinition(state.traceRulesProfile);
}

export function traceRulesDefinitionForTrace(
  trace: Pick<TraceState, "traceRulesProfile">,
): TraceRulesDefinition {
  return traceRulesDefinition(trace.traceRulesProfile);
}

export function isBlindTraceProfile(
  profile: TraceRulesProfile | undefined,
): boolean {
  return (
    traceRulesDefinition(profile).resolutionMode === "hidden_commit_reveal"
  );
}

export function traceCorpBaseStrength(
  trace: Pick<TraceState, "traceLimit" | "traceRulesProfile">,
): number {
  return traceRulesDefinitionForTrace(trace).corpBaseStrengthMode ===
    "printed_trace"
    ? Math.max(0, Math.floor(trace.traceLimit))
    : 0;
}

export function traceComparisonIsSuccessful(
  profile: TraceRulesProfile | undefined,
  corpStrength: number,
  runnerStrength: number,
): boolean {
  return traceRulesDefinition(profile).tieWinner === "corp"
    ? corpStrength >= runnerStrength
    : corpStrength > runnerStrength;
}
