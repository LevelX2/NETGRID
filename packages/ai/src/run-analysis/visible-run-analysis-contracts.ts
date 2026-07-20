import type {
  TraceSuccessEffect,
  VisibleEffectiveIceRunQuote,
  VisibleEffectiveSubroutine,
} from "@netgrid/shared";

export type IceCardLike = {
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
  postBreakStealthLoss?: number;
};

export type RunnerRunPathCreditBudget = {
  credits: number;
  icebreakerCredits?: number;
  nonNoisyIcebreakerCredits?: number;
  killerCredits?: number;
  stealthNonNoisyIcebreakerCredits?: number;
};

export type RunnerRunPathCreditBudgetInput = number | RunnerRunPathCreditBudget;

export type MutableRunnerRunPathCreditBudget =
  Required<RunnerRunPathCreditBudget>;

export type CreditPaymentProjection = {
  affordable: boolean;
  cost: number;
  cashSpent: number;
  creditsAfterPath: number;
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
  actionTax?: number;
  penalty: number;
  evidence: string[];
};

export type VisibleIceRunHazardProjection = {
  hazard: VisibleIceRunHazard;
  avoidancePayment?:
    | { kind: "general"; cost: number }
    | { kind: "breaker"; assessment: BreakAssessment };
};

export type KnownRezzedIcePathAssessment = {
  blocked: boolean;
  visibleBreakCost?: number;
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
