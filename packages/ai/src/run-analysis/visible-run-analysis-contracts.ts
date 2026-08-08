import type {
  TraceSuccessEffect,
  VisibleEffectiveIceRunQuote,
  VisibleEffectiveSubroutine,
  VisibleRunnerTraceSupportQuote,
} from "@netgrid/shared";

export type IceCardLike = {
  instanceId?: string;
  definitionId?: string;
  rezzed?: boolean;
  known: boolean;
  subtypes?: string[];
  strength?: number;
  effectiveRunQuote?: VisibleEffectiveIceRunQuote;
};

export type RootCardLike = {
  definitionId?: string;
  rezzed?: boolean;
  known: boolean;
};

export type RunPathProjectionEffect = NonNullable<
  VisibleEffectiveSubroutine["unbrokenRunEffect"]
>;

export type RunPathProjection = {
  effect: RunPathProjectionEffect;
  sourceSubroutine: VisibleEffectiveSubroutine;
};

export type VisibleDeflectorContext = {
  visibleRemoteServerCount?: number;
  visibleCorpCredits?: number;
  targetServerId?: string;
  /** Remaining free Net/Core damage prevention for this turn. */
  netOrCoreDamagePreventionRemaining?: number;
  /** Remaining run-scoped prevention that applies to all damage types. */
  runDamagePreventionRemaining?: number;
  /** Actions available before the proposed run begins. */
  availableRunnerClicks?: number;
  /** Structured run restriction; noisy breakers cannot be used. */
  prohibitNoisyIcebreakers?: boolean;
  /** Runner-private Engine quote for trace base-link and credit support. */
  runnerTraceSupportQuote?: VisibleRunnerTraceSupportQuote;
  /** Structured server restriction for trace-credit sources with Stealth. */
  excludeStealthTraceCredits?: boolean;
  /** Explicit current or projected run-duration Link bonus. */
  runTraceLinkBonus?: number;
};

export type HardUnbrokenRunEffectKind =
  | "damage_or_program_trash"
  | "run_lock_or_action_tax"
  | "jack_out_lock";

export type BreakAssessment = {
  cost: number;
  breakerInstanceId: string;
  breakerDefinitionId: string;
  breakerSubtypes: string[];
  endingStrength: number;
  carriesStrengthAcrossIce: boolean;
  runStrengthGain?: number;
  postBreakStealthLosses?: Array<{
    amount: number;
    occurrences: number;
    trigger: "per_subroutine" | "per_ability_use";
    sourceMode: "single_stealth_card" | "any_stealth_cards";
    optionalIfUnavailable: boolean;
  }>;
  futureClicksLost?: number;
  conditionalAccessReason?: "visible_random_breaker_strength";
  conditionalRiskReason?: "visible_breaker_may_trash_after_pass";
  /** A run-scoped free-break grant was consumed for this assessment. */
  consumedPendingFreeBreak?: boolean;
  /** Exact breaker that granted the consumed run-scoped free break. */
  consumedPendingFreeBreakSourceBreakerInstanceId?: string;
  /** Structured state changes caused by the successful break. */
  stateChangesAfterUse?: Array<
    | { kind: "add_run_strength"; amount: number }
    | { kind: "increment_broken_subroutine_count"; amount: number }
    | {
        kind: "set_pending_free_break";
        iceSubtype: "sentry";
        remainingUses: 1;
        mustBeNextEncounteredIce: true;
      }
  >;
};

export type VisibleRunBreakerState = {
  strengthByBreakerInstanceId: Map<string, number>;
  pendingFreeBreaks: Array<{
    sourceBreakerInstanceId: string;
    iceSubtype: "sentry";
    remainingUses: number;
    mustBeNextEncounteredIce: true;
  }>;
};

export type RunnerRunPathCreditBudget = {
  credits: number;
  icebreakerCredits?: number;
  nonNoisyIcebreakerCredits?: number;
  /** Non-stealth portion of the non-noisy breaker-credit pool. */
  nonStealthNonNoisyIcebreakerCredits?: number;
  killerCredits?: number;
  stealthNonNoisyIcebreakerCredits?: number;
  stealthCreditsBySourceId?: Readonly<Record<string, number>>;
  hostedIcebreakerCreditsByBreakerInstanceId?: Readonly<Record<string, number>>;
};

export type RunnerRunPathCreditBudgetInput = number | RunnerRunPathCreditBudget;

export type MutableRunnerRunPathCreditBudget = Omit<
  Required<RunnerRunPathCreditBudget>,
  "hostedIcebreakerCreditsByBreakerInstanceId"
> & {
  hostedIcebreakerCreditsByBreakerInstanceId: Record<string, number>;
  stealthCreditsBySourceId: Record<string, number>;
};

export type CreditPaymentProjection = {
  affordable: boolean;
  cost: number;
  cashSpent: number;
  creditsAfterPath: number;
  futureClicksLost?: number;
};

export type BreakSubroutineAbilityLike = {
  cost: { credits?: number };
  count?: number;
  iceSubtype?: string;
  postBreakStealthLoss?: number;
  subroutineBreakTags?: readonly string[];
};

export type PumpStrengthAbilityLike = {
  cost: { credits?: number };
  amount?: number;
};

export type VisibleTraceSupportSideEffect = "forces_jack_out_after_encounter";

export type VisibleIceRunHazardKind =
  | "trace_tag"
  | "trace_tag_counter"
  | "trace_counter"
  | "trace_damage"
  | "trace_trash"
  | "trace_run_lock";

export type VisibleIceRunHazardSeverity = "low" | "medium" | "high";

export type VisibleIceRunHazard = {
  kind: VisibleIceRunHazardKind;
  severity: VisibleIceRunHazardSeverity;
  effectType: TraceSuccessEffect["type"];
  effectTiming: "before_access";
  preventsAccess: boolean;
  canCauseFlatlineBeforeAccess: boolean;
  iceIndex: number;
  sourceDefinitionId?: string;
  sourceTitle?: string;
  subroutineId: string;
  traceBaseStrength?: number;
  runnerTraceCapacity: number;
  baseTraceCovered?: boolean;
  visibleCorpBidCapacity?: number;
  visibleCorpMaxTraceCovered?: boolean;
  traceAvoidanceCost?: number;
  visibleCorpMaxTraceAvoidanceCost?: number;
  traceSuccessCancelAvoidanceCost?: number;
  traceBidCost?: number;
  baseLinkValue?: number;
  baseLinkActivationCost?: number;
  baseLinkSourceDefinitionId?: string;
  baseLinkSourceTitle?: string;
  baseLinkSideEffect?: VisibleTraceSupportSideEffect;
  breakAvoidanceCost?: number;
  minimumAvoidanceCost?: number;
  unavoidable: boolean;
  expectedTags?: number;
  expectedCounters?: number;
  expectedDamage?: number;
  damagePreventionApplied?: number;
  freeDamagePreventionApplied?: number;
  runDamagePreventionApplied?: number;
  actionTax?: number;
  penalty: number;
  evidence: string[];
};

export type VisibleIceRunHazardProjection = {
  hazard: VisibleIceRunHazard;
  /** Exact restricted trace credits consumed while avoiding this hazard. */
  traceCreditPoolSpent?: number;
  /** Trace sources tapped or trashed while avoiding this hazard. */
  traceSupportSourceIdsConsumed?: string[];
  avoidancePayment?:
    | { kind: "general"; cost: number }
    | { kind: "breaker"; assessment: BreakAssessment };
};

export type KnownRezzedIcePathAssessment = {
  blocked: boolean;
  visibleBreakCost?: number;
  futureClicksLost?: number;
  visibleIceRunHazards?: VisibleIceRunHazard[];
  visibleIceHazardPenalty?: number;
  visibleIceHazardAvoidanceCost?: number;
  creditsAfterAvoidingVisibleIceHazards?: number;
  expectedTagsFromVisibleIce?: number;
  unavoidableVisibleIceHazardCount?: number;
  visibleTraceTagHazardUnavoidable?: boolean;
  canReachAccess: boolean;
  knownPathBlockedByUnbreakableIce: boolean;
  knownPathBlockedByMissingCoverage: boolean;
  knownPathBlockedByEtr: boolean;
  knownPathBlockedByHardUnbrokenEffect?: boolean;
  knownPathBlockedByUnavoidableTraceRunLock?: boolean;
  hardUnbrokenRunEffects?: HardUnbrokenRunEffectKind[];
  creditsAfterPath: number;
  canBreakNextIceButNotFullPath: boolean;
  unpayableIceIndex?: number;
  unbreakableIceIndex?: number;
  unbreakableIceTitle?: string;
  hardUnbrokenEffectIceIndex?: number;
  hardUnbrokenEffectIceTitle?: string;
  missingCoverage?: Array<
    "wall" | "code_gate" | "sentry" | "ap" | "trace" | "unknown_special"
  >;
  hasBypassOrSpecialAccessPlan: boolean;
  reachableAccessReason?: string;
  conditionalAccessReasons?: string[];
  conditionalRiskReasons?: string[];
  /** A required Runner-main setup action selected before the run. */
  preRunPreparation?: { credits: number; clicks: number };
  /**
   * Explicit continuations for a breaker whose post-encounter effect can
   * remove it from the rig.  The selected path remains the most favourable
   * legal continuation, while callers can inspect the failure branch.
   */
  postEncounterBreakerBranches?: Array<{
    outcome: "breaker_retained" | "breaker_trashed";
    blocked: boolean;
    canReachAccess: boolean;
  }>;
  noAccessReason?:
    | "known_path_unpayable"
    | "known_path_unbreakable"
    | "missing_breaker_coverage"
    | "known_etr_without_breaker"
    | "harmful_unbroken_run_effect";
  creditsSpentBeforeUnpayableIce: number;
  unpayableReason?:
    | "ice_unbreakable"
    | "ice_unaffordable"
    | "later_ice_unaffordable_after_prior_ice_cost";
  assessedKnownIceCount: number;
};
