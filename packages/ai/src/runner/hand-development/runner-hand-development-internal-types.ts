import type { LegalAction, VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import type { BreakerCoverageKind } from "../../deck-capabilities";
import type { AiHintStructuredEffect } from "../../hint-ontology";
import type {
  RunnerPersistentEngineCapability,
  RunnerPersistentEngineConsumptionBlocker,
  RunnerPersistentEngineKind,
} from "./runner-hand-development-types";

export type CardSignals = {
  text: string;
  roles: string[];
  planRoles: string[];
  functionSignals: string[];
  candidateSignals: string[];
  effectTargets: string[];
  structuredEffects: AiHintStructuredEffect[];
  requiresSameTurnAccess: boolean;
  requiresHostedIcebreaker: boolean;
};

export type CardContext = {
  card: VisibleCard;
  legalAction?: LegalAction;
  matchingCandidates: ActionSemanticCandidate[];
  signals: CardSignals;
  currentCredits: number;
  installOrPlayCost?: number;
  memoryCost?: number;
  memoryAvailable?: number;
  duplicateInstalled: boolean;
  sameTurnAccessFollowupAvailable?: boolean;
  hostableIcebreakerAvailable?: boolean;
};

export type PersistentFunctionalProfile = {
  persistentEngineKind: RunnerPersistentEngineKind;
  persistentEngineCapabilities: RunnerPersistentEngineCapability[];
  persistentEngineRepeatable: boolean;
  persistentEngineConsumptionBlockers: RunnerPersistentEngineConsumptionBlocker[];
  persistentEngineCoverage?: string;
  exclusiveHardwareDeck: boolean;
  functionalCoverage: string[];
  primaryGroups: string[];
  nonAdditiveUtilityFamilies: string[];
  breakerCoverage: BreakerCoverageKind[];
  riskyBreaker: boolean;
  randomBreakOrDamageProfileId?: string;
  randomBreakSuccessProbabilityPerAttempt?: number;
  randomBreakMaxSingleFailureDamage?: number;
  damagePrevention: boolean;
  handSizeSupport: boolean;
  memorySupport: boolean;
  breakerStrengthSupport: boolean;
  iceStrengthReduction: boolean;
  recurringBreakerEconomy: boolean;
  bankTool: boolean;
  accessSupport: boolean;
  searchSupport: boolean;
  actionGatedUtility: boolean;
  absoluteNonStackable: boolean;
};

export type BreakerVariantAssessment = {
  supported: boolean;
  advantages: string[];
  blockers: string[];
  evidence: string[];
};
