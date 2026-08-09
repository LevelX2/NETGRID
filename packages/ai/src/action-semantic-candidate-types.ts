import type {
  CardDefinitionId,
  CardInstanceId,
  LegalAction,
} from "@netgrid/shared";
import type {
  AiHintActionCapacityProfile,
  AiHintStrategicExchangeKind,
  AiHintStructuredEffect,
} from "./hint-ontology";

export type ActionSemanticVisibilityScope =
  | "actor_private"
  | "public"
  | "corp_private"
  | "runner_private"
  | "developer_only";

export type ActionSemanticSourceKind =
  | "card"
  | "basic_action"
  | "game_rule"
  | "choice"
  | "unknown";

export type ActionAbilityBindingMethod =
  | "canonical_capability_id"
  | "explicit_ability_id"
  | "engine_payload"
  | "single_legal_ability_inferred"
  | "unresolved";

export type ActionSemanticConfidence = "none" | "low" | "medium" | "high";

export type ActionPrimaryProjectionStatus =
  | "projected"
  | "neutral_projected"
  | "partial_projected"
  | "blocked"
  | "schema_gap"
  | "hidden_info_blocked";

export type ActionProjectionIssue =
  | "source_unresolved"
  | "ability_unresolved"
  | "target_context_unavailable"
  | "hidden_info_blocked"
  | "cost_unknown"
  | "timing_unknown"
  | "card_semantics_unavailable";

export type ActionGateId =
  | "engine_legal_action"
  | "side_visibility"
  | "hidden_info"
  | "source_resolution"
  | "ability_resolution"
  | "target_context"
  | "cost_known"
  | "timing_known"
  | "runtime_no_effect";

export type ActionGateResult = {
  gateId: ActionGateId;
  status: "pass" | "block" | "unknown" | "not_applicable";
  severity: "info" | "warning" | "error";
  reason?: string;
  evidence?: string[];
};

export type StrategySupportPair = {
  strategyId: string;
  role: string;
  confidence: "low" | "medium" | "high";
  evidence: string;
};

export type SemanticCondition = {
  conditionId?: string;
  kind: string;
  status: "present" | "absent" | "unknown" | "not_evaluated";
  evidence?: string[];
};

export type SemanticRisk = {
  riskId?: string;
  kind: string;
  severity: "low" | "medium" | "high" | "unknown";
  evidence?: string[];
};

export type SemanticConstraint = {
  constraintId?: string;
  kind: string;
  status: "satisfied" | "unsatisfied" | "unknown" | "not_evaluated";
  evidence?: string[];
};

export type DamageAmount = {
  type: "net" | "meat" | "brain" | "core" | "unknown";
  amount: number | "unknown";
};

export type ActionCostProfile = {
  clickCost?: number;
  creditCost?: number;
  trashCost?: number;
  agendaPointCost?: number;
  temporaryCredits?: {
    budget?: number;
    provided?: number;
    spent?: number;
    remaining?: number;
    returned?: number;
  };
  tapCost?: boolean;
  revealCost?: boolean;
  forfeitAgenda?: boolean;
  selfDamage?: DamageAmount[];
  selfTag?: number;
  discardCost?: number;
  xValue?: number | "choice" | "unknown";
  paidBy?: "runner" | "corp" | "unknown";
  beneficiary?: "runner" | "corp" | "none" | "unknown";
  costKnownStatus: "known" | "partial" | "unknown" | "not_applicable";
  variableCost?: {
    kind:
      | "x"
      | "trace_boost"
      | "trash_cost"
      | "rez_cost"
      | "choice"
      | "unknown";
    min?: number;
    max?: number;
    chosen?: number;
    postActionReserve?: number;
    source?: "legal_action_payload";
  };
  additionalCosts: string[];
};

export type ActionEconomyKind =
  | "immediate_liquid"
  | "stored_credit_build"
  | "restricted_credit"
  | "automatic_credit"
  | "non_economy";

export type ActionEconomyProjectionSource =
  | "legal_action_payload"
  | "basic_action_contract"
  | "visible_source_state"
  | "unknown";

export type ActionEconomyProjection = {
  schemaVersion: "action-economy-projection-v1";
  kind: ActionEconomyKind;
  timing: "immediate" | "setup" | "automatic" | "unknown";
  creditRestriction: "general" | "restricted" | "unknown";
  clickCost: number;
  creditCost: number;
  grossLiquidCreditGain?: number;
  netLiquidCreditGain?: number;
  storedCreditsAdded?: number;
  storedCreditsTaken?: number;
  cardsDrawn: number;
  cardsConsumed: number;
  netHandDelta: number;
  payoutMode?: "fixed" | "all_available";
  sourcePool?: "finite" | "renewable" | "unknown";
  repeatable: boolean | "unknown";
  reliability: "guaranteed" | "conditional" | "unknown";
  source: ActionEconomyProjectionSource;
  confidence: ActionSemanticConfidence;
  evidence: string[];
};

export type ActionCapacityKind =
  | "immediate_unrestricted_gain"
  | "immediate_restricted_gain"
  | "future_recurring_gain"
  | "action_debt"
  | "non_action_capacity";

export type ActionCapacityRestriction =
  | "unrestricted"
  | "install_only"
  | "program_install_only"
  | "run_only"
  | "unknown";

export type ActionCapacityProjectionSource =
  | "legal_action_payload"
  | "action_debt_contract"
  | "unknown";

/**
 * Side-safe projection of the action capacity created or consumed by one
 * existing LegalAction. `preExistingActionCost` is intentionally separate
 * from `listedActionCost`: a self-financing action such as Wilson's run pays
 * its listed click from the restricted action it creates during resolution.
 */
export type ActionCapacityProjection = {
  schemaVersion: "action-capacity-projection-v1";
  kind: ActionCapacityKind;
  timing: "immediate" | "future_turn_start" | "debt" | "unknown";
  restriction: ActionCapacityRestriction;
  allowedActionTypes: string[];
  allowedCardTypes?: string[];
  temporaryCredits?: number;
  listedActionCost: number;
  preExistingActionCost: number;
  grossActionsGained: number;
  generatedActionsConsumedByCurrentAction: number;
  followupActionCapacity: number;
  netCurrentTurnActionDelta: number;
  actionDebt: number;
  gainAmountPerTurn?: number;
  durationTurns?: number;
  expiresAt?: "side_turn_end" | "duration_end" | "unknown";
  selfFinancing: boolean;
  repeatable: boolean | "unknown";
  bankable?: boolean | "unknown";
  reliability: "guaranteed" | "conditional" | "random" | "unknown";
  sourceCounterType?: string;
  sourceCounterCost?: number;
  source: ActionCapacityProjectionSource;
  confidence: ActionSemanticConfidence;
  evidence: string[];
};

export type ActionTimingProfile = {
  phase?: string;
  turnSide?: "runner" | "corp";
  window?: string;
  runPhase?: string;
  encounterPhase?: string;
  accessPhase?: boolean;
  scoreWindow?: boolean;
  rezWindow?: boolean;
  responseWindow?: boolean;
  duration?: {
    kind:
      | "current_action"
      | "current_encounter"
      | "current_run"
      | "current_turn"
      | "next_action"
      | "action_debt"
      | "persistent"
      | "unknown";
    source: "legal_action_payload" | "action_type" | "timing_point";
    actions?: number;
    expiresAt?: string | number;
  };
};

export type LegalTarget = {
  targetId: string;
  targetKind:
    | "card"
    | "server"
    | "ice"
    | "program"
    | "resource"
    | "hardware"
    | "agenda"
    | "choice"
    | "subroutine"
    | "unknown";
  targetSide: "runner" | "corp" | "both" | "unknown";
  targetZone?: string;
  targetDefinitionId?: string;
  targetTitle?: string;
  targetSubtypes?: string[];
  targetConstraints?: string[];
  visibilityScope: ActionSemanticVisibilityScope;
  evidence: string[];
};

export type LegalTargetSummary = {
  targetId: string;
  targetKind: LegalTarget["targetKind"];
  targetSide: LegalTarget["targetSide"];
  targetZone?: string;
  targetDefinitionId?: string;
  targetTitle?: string;
  targetSubtypes?: string[];
  targetConstraints?: string[];
  evidence: string[];
};

export type TargetProfileMatch = {
  targetProfileId?: string;
  status: "matched" | "not_matched" | "unknown" | "not_available";
  issues: ActionProjectionIssue[];
  evidence: string[];
};

export type ConstraintResult = {
  constraintId?: string;
  status: "pass" | "block" | "unknown" | "not_applicable";
  reason?: string;
  evidence: string[];
};

export type ActionTargetContext = {
  selectedTargets: LegalTarget[];
  availableTargets?: LegalTargetSummary[];
  targetKind:
    | "card"
    | "server"
    | "ice"
    | "program"
    | "resource"
    | "hardware"
    | "agenda"
    | "choice"
    | "subroutine"
    | "unknown";
  targetZones: string[];
  targetSide: "runner" | "corp" | "both" | "unknown";
  hiddenInfoPolicy: string;
  availableTargetsStatus:
    | "engine_provided"
    | "not_available"
    | "target_context_unavailable";
  targetProfileMatches: TargetProfileMatch[];
  targetConstraintResults: ConstraintResult[];
};

export type ActionRunProjectionSummary = {
  serverId?: string;
  serverKind?: "hq" | "rd" | "archives" | "remote";
  source: "legal_action_payload" | "target_context" | "run_action_projection";
  evidence: string[];
};

export type RunAccessModifierKind =
  | "bypass_ice"
  | "additional_subroutines"
  | "redirect_run"
  | "access_replacement"
  | "post_run_followup"
  | "forced_run_end";

export type RunAccessRiskKind =
  | "ambush"
  | "damage"
  | "tag"
  | "program_disruption"
  | "steal_tax"
  | "access_reduction";

export type RunAccessPayoffKind =
  | "additional_access"
  | "free_trash"
  | "ice_trash"
  | "information";

export type ActionRunAccessDecisionModel = {
  schemaVersion: "run-access-decision-model-v1";
  coverageStatus: "covered" | "partial" | "blocked";
  serverId?: string;
  modifiers: RunAccessModifierKind[];
  accessRisks: RunAccessRiskKind[];
  payoffs: RunAccessPayoffKind[];
  unknownRemoteIdentityPreserved: true;
  hiddenInfoPolicy: "side_safe_visible_only";
  whyNot: string[];
  evidence: string[];
};

export type ActionRandomOutcomeModel = {
  schemaVersion: "random-outcome-model-v1";
  outcomeStatus: "not_drawn";
  purpose?: string;
  randomCounterAfter?: number;
  source: "engine_random_draw_records_only";
  futureOutcomeAccess: "forbidden";
  deterministicProjection: true;
  evidence: string[];
};

export type ActionBadPublicityDecisionModel = {
  schemaVersion: "bad-publicity-decision-model-v1";
  delta?: number;
  current?: number;
  after?: number;
  lossThreshold: 7;
  thresholdStatus: "reached" | "not_reached" | "unknown";
  actorRelevance: "payoff" | "risk" | "support";
  source: "legal_action_payload" | "side_safe_semantics";
  hiddenInfoPolicy: "side_safe_visible_only";
  evidence: string[];
};

export type ActionRandomBadPublicityModel = {
  randomOutcome?: ActionRandomOutcomeModel;
  badPublicity?: ActionBadPublicityDecisionModel;
};

export type ActionHiddenResourceModel = {
  schemaVersion: "hidden-resource-model-v1";
  perspective:
    | "own_private_constraint"
    | "opponent_abstract_risk"
    | "hidden_info_blocked";
  available?: number;
  required?: number;
  sufficiency: "sufficient" | "insufficient" | "unknown";
  opponentIdentityPreserved: true;
  hiddenInfoPolicy: "actor_private_or_abstract_only";
  evidence: string[];
};

export type ActionVirusCounterModel = {
  schemaVersion: "virus-counter-model-v1";
  counterFamily: "runner_virus" | "corp_antibody";
  counterType?: string;
  amountAdded?: number;
  countersAfter?: number;
  purgePressure: "purge_action" | "purge_window" | "none";
  payoutWindow: "available" | "not_signaled";
  antibodySeparatedFromRunnerVirus: true;
  source: "legal_action_payload" | "side_safe_semantics" | "action_type";
  evidence: string[];
};

export type ActionHiddenResourceVirusModel = {
  hiddenResource?: ActionHiddenResourceModel;
  virusCounter?: ActionVirusCounterModel;
};

export type ActionTagEffectProfile = {
  kind: "remove_tags" | "avoid_tag" | "avoid_next_tag" | "tag_clear_support";
  recipient: "runner";
  mode?: "amount" | "up_to_amount" | "all" | "support_only";
  amount?: number | "all" | "unknown";
  currentTagReduction?: number | "all" | "unknown";
  acuteTagRemoval: boolean;
  source:
    | "legal_action_type"
    | "legal_action_payload"
    | "card_implementation"
    | "ai_hint";
  evidence: string[];
};

export type ConditionalDefenseFollowupQuote = {
  schemaVersion: "conditional-defense-followup-quote-v1";
  kind:
    | "install_hq_ice_innermost_after_successful_run"
    | "temporary_hq_ice_encounter_after_successful_run";
  sourceCardInstanceId: CardInstanceId;
  targetServerId: string;
  stateVersion: number;
  actionId: string;
  rezCredits: number;
  followupCredits: number;
  totalCredits: number;
  totalCreditsPayable: boolean;
  hasOwnHqIce: boolean;
  evidence: string[];
};

export type BoardContextSummary = {
  source: "ai_decision_input" | "player_view" | "not_projected";
  sideSafe: boolean;
  stateVersion?: number;
  timingPoint?: string;
  notes: string[];
};

/**
 * @aiProjection Read-only descriptor for an Engine-provided LegalAction.
 * @authority Candidates must not influence legality or create actions; they can
 * only explain or rank actions that already exist.
 * @visibility Fields must be built from the observer's side-safe projection and
 * hidden-info barriers must remain explicit.
 */
export type ActionSemanticCandidate = {
  actionId: string;
  actionType: string;
  actorSide: "runner" | "corp";
  actorId?: string;
  observerSide?: "runner" | "corp" | "system";
  visibilityScope: ActionSemanticVisibilityScope;
  legalActionRef: {
    actionId: string;
    actionType: string;
    originalPayloadKeys: string[];
    payloadHash?: string;
  };
  stateVersion?: number;
  sourceKind: ActionSemanticSourceKind;
  /**
   * Legacy-compatible alias for the action source card. New semantic joins must
   * use sourceDefinitionId for card profiles and sourceCardInstanceId for
   * instance identity.
   */
  sourceCardId?: CardInstanceId | CardDefinitionId;
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  abilityId?: string;
  abilityKey?: string;
  primitiveKind?: string;
  effectKind?: string;
  abilityBindingMethod: ActionAbilityBindingMethod;
  semanticActionType: string;
  /**
   * Typed strategic effects that are bound to this exact current action.
   * They never create legality or supply an unknown current amount; those
   * facts remain bound to the Engine LegalAction projection.
   */
  functionalEffects?: readonly AiHintStructuredEffect[];
  strategicExchangeKinds?: readonly AiHintStrategicExchangeKind[];
  /**
   * Card-wide strategic context from the active hint. This is intentionally
   * not action authority and must not satisfy a PlanStep capability by itself.
   */
  cardContextFunctionalEffects?: readonly AiHintStructuredEffect[];
  /**
   * Structured effect destinations retained from side-safe card hints. These
   * keep timing-relevant distinctions such as immediate, installment and
   * turn-start credits out of lossy free-text inference.
   */
  effectTargets?: string[];
  cardContextSignals: string[];
  actionTacticSignals: string[];
  compatibilitySignals?: string[];
  strategySupport: StrategySupportPair[];
  conditions: SemanticCondition[];
  risks: SemanticRisk[];
  constraints: SemanticConstraint[];
  costProfile: ActionCostProfile;
  economyProjection?: ActionEconomyProjection;
  actionCapacityProjection?: ActionCapacityProjection;
  timingProfile: ActionTimingProfile;
  targetContext?: ActionTargetContext;
  runProjectionSummary?: ActionRunProjectionSummary;
  runAccessDecisionModel?: ActionRunAccessDecisionModel;
  randomBadPublicityModel?: ActionRandomBadPublicityModel;
  hiddenResourceVirusModel?: ActionHiddenResourceVirusModel;
  tagEffectProfile?: ActionTagEffectProfile;
  conditionalDefenseFollowupQuote?: ConditionalDefenseFollowupQuote;
  boardContext: BoardContextSummary;
  confidence: ActionSemanticConfidence;
  primaryProjectionStatus: ActionPrimaryProjectionStatus;
  projectionIssues: ActionProjectionIssue[];
  hardGates: ActionGateResult[];
  evidence: string[];
};

export type BuildActionSemanticCandidatesParams = {
  legalActions: readonly LegalAction[];
  observerSide?: "runner" | "corp" | "system";
  stateVersion?: number;
  projectionMode?: "neutral_only" | "basic_semantics";
  sideSafeAbilityBindings?: readonly SideSafeActionAbilityBinding[];
  visibleSourceDefinitionsByInstanceId?: Readonly<
    Record<CardInstanceId, CardDefinitionId>
  >;
  selectedTargetsByActionId?: Readonly<
    Record<string, Readonly<Record<string, string>>>
  >;
  availableTargetsByActionId?: Readonly<
    Record<string, readonly LegalTargetSummary[]>
  >;
  cardSemanticProfilesByDefinitionId?: Readonly<
    Record<CardDefinitionId, ActionCardSemanticProfile>
  >;
  /**
   * Deprecated compatibility alias for older callers. It is interpreted as a
   * definition-id keyed map and must not be populated from hidden instance ids.
   */
  cardSemanticProfilesByCardId?: Readonly<
    Record<CardDefinitionId, ActionCardSemanticProfile>
  >;
};

export type BuildNeutralActionSemanticCandidateOptions = {
  observerSide?: "runner" | "corp" | "system";
  stateVersion?: number;
};

export type SideSafeActionAbilityBinding = {
  actionId: string;
  sourceCardInstanceId?: CardInstanceId;
  /**
   * Legacy-compatible alias for sourceCardInstanceId.
   */
  sourceCardId: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  abilityId: string;
  method: "single_legal_ability_inferred";
  evidence: string[];
};

export type ActionCardAbilitySemanticProfile = {
  abilityId: string;
  tacticSignals: readonly string[];
  functionalEffects?: readonly AiHintStructuredEffect[];
  compatibilitySignals?: readonly string[];
  strategySupport?: readonly StrategySupportPair[];
  conditions?: readonly SemanticCondition[];
  risks?: readonly SemanticRisk[];
  constraints?: readonly SemanticConstraint[];
  additionalCosts?: readonly string[];
  targetProfileMatches?: readonly TargetProfileMatch[];
};

export type ActionCardSemanticProfile = {
  cardId: CardDefinitionId;
  tacticSignals: readonly string[];
  functionalEffects?: readonly AiHintStructuredEffect[];
  strategicExchangeKinds?: readonly AiHintStrategicExchangeKind[];
  effectTargets?: readonly string[];
  compatibilitySignals?: readonly string[];
  strategySupport?: readonly StrategySupportPair[];
  conditions?: readonly SemanticCondition[];
  risks?: readonly SemanticRisk[];
  constraints?: readonly SemanticConstraint[];
  targetProfileMatches?: readonly TargetProfileMatch[];
  abilitySemantics?: readonly ActionCardAbilitySemanticProfile[];
  actionCapacityProfiles?: readonly AiHintActionCapacityProfile[];
};
