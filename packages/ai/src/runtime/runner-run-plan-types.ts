import type {
  CardDefinitionId,
  CardInstanceId,
  LegalAction,
  ServerId,
  Side,
} from "@netgrid/shared";

export type RunnerRunPlanServerId = Exclude<ServerId, "new_remote">;

export type RunnerRunPlanLifecycle =
  | "created"
  | "active"
  | "adjusted"
  | "abort_recommended"
  | "invalid"
  | "completed"
  | "discarded";

export type RunnerRunPlanOrigin =
  | "basic_start_run"
  | "card_initiated_run"
  | "forced_run"
  | "followup_run"
  | "redirected_run";

export type RunnerRunRiskBudget = {
  maxCreditLoss: number;
  maxDamage: number;
  allowEndTheRun: boolean;
  evidence: string[];
};

export type RunnerRunObjective =
  | { kind: "access_hq_card"; expectedValue: number }
  | { kind: "access_rnd_top"; expectedValue: number }
  | {
      kind: "access_rnd_multi";
      expectedValue: number;
      expectedAccessCount: number;
    }
  | {
      kind: "access_hq_multi";
      expectedValue: number;
      expectedAccessCount: number;
    }
  | { kind: "contest_remote_agenda"; urgency: number }
  | {
      kind: "trash_asset_or_upgrade";
      maxTrashCost: number;
      expectedValue: number;
    }
  | { kind: "probe_unknown_ice"; riskBudget: RunnerRunRiskBudget }
  | { kind: "force_rez"; expectedCorpCreditImpact: number }
  | { kind: "run_card_effect"; effectId: string; replacesAccess: boolean }
  | { kind: "survival_or_win_pressure"; reason: string };

export type RunnerRunAccessIntent = {
  server: RunnerRunPlanServerId;
  expectedAccessCount: number;
  stealAgendaPolicy: "steal_if_affordable" | "must_steal" | "avoid_if_costly";
  trashPolicy:
    | "trash_if_value_positive"
    | "must_trash_target"
    | "decline_low_value";
  replacementAccessEffect?: string;
  multiaccessSource?: string;
  reserveForStealOrTrash: number;
};

export type RunnerRunDamageSafetyReserve = {
  minimumGripAfterRun: number;
  preventionCreditsReserved: number;
  evidence: string[];
};

export type RunnerRunTagSafetyReserve = {
  minimumCreditsAfterTags: number;
  expectedTagCount: number;
  evidence: string[];
};

export type RunnerRunBudget = {
  availableCredits: number;
  runOnlyCredits: number;
  recurringBreakerCredits: number;
  recurringKillerCredits: number;
  recurringLinkCredits: number;
  stealthCredits: number;
  nonNoisyBreakerCredits: number;
  maxSpendThisRun?: number;
  reservedCreditsAfterRun: number;
  reservedCreditsForSteal: number;
  reservedCreditsForTrash: number;
  damageSafetyReserve: RunnerRunDamageSafetyReserve;
  tagSafetyReserve: RunnerRunTagSafetyReserve;
};

export type RunnerRunReserve = {
  minimumCreditsAfterRun: number;
  minimumGripAfterRun: number;
  preserveStealOrTrashCredits: number;
  evidence: string[];
};

export type RunnerRunLegalActionRef = {
  actionId: string;
  actionType: LegalAction["type"];
  source?: string;
  cost?: number;
};

export type RunnerRunEncounterActionSequence = {
  steps: RunnerRunLegalActionRef[];
  totalCost: number;
  usesPump: boolean;
  usesBreak: boolean;
  usesBypass: boolean;
  usesPrevention: boolean;
  preservesAccessObjective: boolean;
  violatesReserve: boolean;
  riskTags: string[];
};

export type RunnerRunSubroutineThreatClass =
  | "must_break_for_access"
  | "must_break_for_survival"
  | "must_break_for_plan_budget"
  | "may_allow"
  | "pay_to_allow"
  | "prevented_or_neutralized"
  | "future_path_modifier"
  | "irrelevant_to_current_plan"
  | "too_expensive_abort_recommended";

export type RunnerRunSubroutineQuote = {
  index: number;
  threatClass: RunnerRunSubroutineThreatClass;
  broken: boolean;
  evidence: string[];
};

export type RunnerRunBreakerCoverageQuote = {
  breakerInstanceId: CardInstanceId;
  breakerDefinitionId?: CardDefinitionId;
  canBreak: boolean;
  requiresPump: boolean;
  estimatedCost?: number;
  evidence: string[];
};

export type RunnerRunBypassQuote = {
  sourceActionId: string;
  sourceDefinitionId?: CardDefinitionId;
  estimatedCost: number;
  preservesAccessObjective: boolean;
  evidence: string[];
};

export type RunnerRunModifierQuote = {
  kind:
    | "future_ice_strength"
    | "future_break_cost"
    | "jack_out_limit"
    | "damage_or_trash"
    | "access_modifier";
  value?: number;
  evidence: string[];
};

export type RunnerRunIceEncounterQuote = {
  iceRef: {
    instanceId: CardInstanceId;
    definitionId?: CardDefinitionId;
  };
  known: boolean;
  rezzed: boolean;
  visibleName?: string;
  visibleSubtypes: string[];
  effectiveStrength?: number;
  subroutineQuotes: RunnerRunSubroutineQuote[];
  breakerCoverage: RunnerRunBreakerCoverageQuote[];
  cheapestAccessPreservingSequence?: RunnerRunEncounterActionSequence;
  cheapestSafeSequence?: RunnerRunEncounterActionSequence;
  bypassOptions: RunnerRunBypassQuote[];
  postEncounterModifiers: RunnerRunModifierQuote[];
};

export type RunnerRunPathQuote = {
  server: RunnerRunPlanServerId;
  quoteStatus: "known_complete" | "partially_known" | "unknown";
  iceQuotes: RunnerRunIceEncounterQuote[];
  totalKnownCost: number;
  expectedUnknownCost: number;
  expectedRemainingCredits: number;
  reserveViolation: boolean;
  canReachAccess: boolean;
  cannotReachReason?: string;
  requiredSequences: RunnerRunEncounterActionSequence[];
};

export type RunnerRunEncounterStateRef = {
  server: RunnerRunPlanServerId;
  iceInstanceId?: CardInstanceId;
  iceIndex?: number;
  phase: "approach_ice" | "encounter_ice" | "movement" | "access";
};

export type RunnerRunEncounterObligation = {
  kind:
    | "pump_for_required_break"
    | "break_required_subroutine"
    | "continue_after_obligations"
    | "allow_plan_compatible_subroutines"
    | "jack_out"
    | "access";
  reason: string;
  requiredSequence?: RunnerRunEncounterActionSequence;
};

export type RunnerRunPlanRevalidationStatus =
  | "valid"
  | "adjusted"
  | "abort_recommended"
  | "invalid"
  | "objective_satisfied";

export type RunnerRunPlanRevalidationState = {
  status: RunnerRunPlanRevalidationStatus;
  reasons: string[];
  checkedAtStateVersion: number;
};

export type RunnerRunAbortPolicy = {
  allowJackOutWhenLegal: boolean;
  abortBelowCredits: number;
  abortReasons: string[];
};

export type RunnerRunVisibleEvidenceRef = {
  kind:
    | "player_view"
    | "legal_action"
    | "visible_card"
    | "public_event"
    | "action_semantic_candidate"
    | "deck_strategy"
    | "deck_capability";
  ref: string;
};

export type RunnerRunPlanDebugInfo = {
  summary: string;
  items: string[];
};

export type RunnerRunPlan = {
  id: string;
  side: Extract<Side, "runner">;
  lifecycle: RunnerRunPlanLifecycle;
  origin: RunnerRunPlanOrigin;
  objective: RunnerRunObjective;
  targetServer: { id: RunnerRunPlanServerId };
  accessIntent?: RunnerRunAccessIntent;
  runStartActionId: string;
  sourceTacticalGoalIds: string[];
  sourceStrategyEvidence: string[];
  budget: RunnerRunBudget;
  reserve: RunnerRunReserve;
  pathQuote: RunnerRunPathQuote;
  currentEncounter?: RunnerRunEncounterStateRef;
  currentObligation?: RunnerRunEncounterObligation;
  revalidation: RunnerRunPlanRevalidationState;
  abortPolicy: RunnerRunAbortPolicy;
  visibilityEvidence: RunnerRunVisibleEvidenceRef[];
  debug: RunnerRunPlanDebugInfo;
  createdAtStateVersion: number;
  updatedAtStateVersion: number;
};
