import type { LegalAction } from "@netgrid/shared";
import type { AccessOutcomeMemoryStatus } from "../access/access-outcome-memory";
import { remoteAccessFingerprint } from "../access/remote-access-fingerprint";
import {
  rankKnownRemoteAccessTargets,
  type RankedKnownRemoteAccessCandidate,
} from "../access/access-target-ranking";
import {
  projectAccessDecision,
  type AccessDecisionProjection,
} from "../decision/access-decision-projection";

export const REAL_ENGINE_ACCESS_CORPUS_SCENARIO_IDS = [
  "access_remote_known_agenda_steal",
  "access_remote_trash_affordable",
  "access_remote_trash_insufficient_credits",
  "access_remote_trash_reserve_would_break",
  "access_remote_finite_pool_depleted",
  "access_remote_unknown_root_deferred",
  "access_remote_changed_reassess",
  "access_declined_trash_memory_active",
  "access_memory_remote_fingerprint_changed",
  "access_memory_economy_improved",
  "access_target_choice_trash_dry_run",
  "access_target_choice_decline_dry_run",
  "access_rank_agenda_before_asset",
  "access_rank_asset_before_low_value_upgrade",
  "access_side_safe_payload_contract",
] as const;

export type RealEngineAccessCorpusScenarioId =
  (typeof REAL_ENGINE_ACCESS_CORPUS_SCENARIO_IDS)[number];

export type RealEngineAccessCorpusScenario = {
  scenarioId: RealEngineAccessCorpusScenarioId;
  reportOnly: true;
  productiveUseAllowed: false;
  runtimeConsumerStatus: "none";
  legalAction: LegalAction;
  serverId: string;
  remoteFingerprint: string;
  projection: AccessDecisionProjection;
  rankedTargets: RankedKnownRemoteAccessCandidate[];
  accessOutcomeMemory?: AccessOutcomeMemoryStatus;
  expectedRecommendation:
    | "run_now"
    | "gain_credits_first"
    | "known_no_current_payoff"
    | "remote_changed_reassess"
    | "declined_trash_memory_active";
  evidence: string[];
};

export function buildRealEngineAccessCorpus(): RealEngineAccessCorpusScenario[] {
  return [
    scenario({
      scenarioId: "access_remote_known_agenda_steal",
      targetKind: "agenda",
      intendedAccessAction: "steal",
      reason: "agenda_payoff",
      valueScore: 7,
      expectedRecommendation: "run_now",
    }),
    scenario({
      scenarioId: "access_remote_trash_affordable",
      targetKind: "asset",
      intendedAccessAction: "trash",
      reason: "trash_affordable",
      valueScore: 3,
      expectedRecommendation: "run_now",
    }),
    scenario({
      scenarioId: "access_remote_trash_insufficient_credits",
      targetKind: "asset",
      intendedAccessAction: "decline",
      reason: "insufficient_credits",
      valueScore: 3,
      expectedRecommendation: "gain_credits_first",
    }),
    scenario({
      scenarioId: "access_remote_trash_reserve_would_break",
      targetKind: "asset",
      intendedAccessAction: "decline",
      reason: "reserve_would_break",
      valueScore: 3,
      expectedRecommendation: "gain_credits_first",
    }),
    scenario({
      scenarioId: "access_remote_finite_pool_depleted",
      targetKind: "asset",
      intendedAccessAction: "decline",
      reason: "finite_pool_depleted",
      valueScore: 0,
      expectedRecommendation: "known_no_current_payoff",
    }),
    scenario({
      scenarioId: "access_remote_unknown_root_deferred",
      targetKind: "unknown",
      intendedAccessAction: "access_only",
      reason: "unknown",
      valueScore: 0,
      expectedRecommendation: "known_no_current_payoff",
    }),
    scenario({
      scenarioId: "access_remote_changed_reassess",
      targetKind: "unknown",
      intendedAccessAction: "access_only",
      reason: "unknown",
      valueScore: 0,
      expectedRecommendation: "remote_changed_reassess",
      accessOutcomeMemory: {
        applies: false,
        invalidationReason: "remote_fingerprint_changed",
        suppressesPlanBonus: false,
        evidence: ["access_corpus_memory_invalidated:remote_fingerprint_changed"],
      },
    }),
    scenario({
      scenarioId: "access_declined_trash_memory_active",
      targetKind: "asset",
      intendedAccessAction: "decline",
      reason: "reserve_would_break",
      valueScore: 2,
      expectedRecommendation: "declined_trash_memory_active",
      accessOutcomeMemory: {
        applies: true,
        suppressesPlanBonus: true,
        evidence: ["access_corpus_memory_applies:declined_trash"],
      },
    }),
    scenario({
      scenarioId: "access_memory_remote_fingerprint_changed",
      targetKind: "asset",
      intendedAccessAction: "decline",
      reason: "low_value_target",
      valueScore: 1,
      expectedRecommendation: "remote_changed_reassess",
      accessOutcomeMemory: {
        applies: false,
        invalidationReason: "remote_fingerprint_changed",
        suppressesPlanBonus: false,
        evidence: ["access_corpus_remote_fingerprint_changed:true"],
      },
    }),
    scenario({
      scenarioId: "access_memory_economy_improved",
      targetKind: "asset",
      intendedAccessAction: "decline",
      reason: "reserve_would_break",
      valueScore: 2,
      expectedRecommendation: "gain_credits_first",
      accessOutcomeMemory: {
        applies: false,
        invalidationReason: "credits_or_reserve_improved",
        suppressesPlanBonus: false,
        evidence: ["access_corpus_memory_invalidated:credits_or_reserve_improved"],
      },
    }),
    scenario({
      scenarioId: "access_target_choice_trash_dry_run",
      targetKind: "asset",
      intendedAccessAction: "trash",
      reason: "trash_affordable",
      valueScore: 3,
      expectedRecommendation: "run_now",
      targetChoiceOptionId: "trash",
    }),
    scenario({
      scenarioId: "access_target_choice_decline_dry_run",
      targetKind: "asset",
      intendedAccessAction: "decline",
      reason: "low_value_target",
      valueScore: 0,
      expectedRecommendation: "known_no_current_payoff",
      targetChoiceOptionId: "decline",
    }),
    scenario({
      scenarioId: "access_rank_agenda_before_asset",
      targetKind: "agenda",
      intendedAccessAction: "steal",
      reason: "agenda_payoff",
      valueScore: 4,
      expectedRecommendation: "run_now",
      includeSecondaryAssetTarget: true,
    }),
    scenario({
      scenarioId: "access_rank_asset_before_low_value_upgrade",
      targetKind: "asset",
      intendedAccessAction: "trash",
      reason: "trash_affordable",
      valueScore: 3,
      expectedRecommendation: "run_now",
      includeSecondaryLowValueUpgrade: true,
    }),
    scenario({
      scenarioId: "access_side_safe_payload_contract",
      targetKind: "unknown",
      intendedAccessAction: "access_only",
      reason: "unknown",
      valueScore: 0,
      expectedRecommendation: "known_no_current_payoff",
      legalActionPayload: { serverId: "remote_1" },
    }),
  ];
}

function scenario(params: {
  scenarioId: RealEngineAccessCorpusScenarioId;
  targetKind: "agenda" | "asset" | "upgrade" | "unknown";
  intendedAccessAction: "steal" | "trash" | "access_only" | "decline";
  reason:
    | "agenda_payoff"
    | "trash_affordable"
    | "insufficient_credits"
    | "reserve_would_break"
    | "low_value_target"
    | "finite_pool_depleted"
    | "unknown";
  valueScore: number;
  expectedRecommendation: RealEngineAccessCorpusScenario["expectedRecommendation"];
  accessOutcomeMemory?: AccessOutcomeMemoryStatus;
  targetChoiceOptionId?: string;
  includeSecondaryAssetTarget?: boolean;
  includeSecondaryLowValueUpgrade?: boolean;
  legalActionPayload?: LegalAction["payload"];
}): RealEngineAccessCorpusScenario {
  const serverId = "remote_1";
  const definitionId = definitionIdFor(params.targetKind);
  const projection = projectAccessDecision({
    source: "access_window",
    serverId,
    knownRootDefinitionId: definitionId,
    target: params.targetKind,
    intendedAccessAction: params.intendedAccessAction,
    ...(params.reason === "reserve_would_break"
      ? { reserveWouldBreak: true }
      : {}),
    ...(params.targetChoiceOptionId
      ? {
          targetChoiceWouldSelect: {
            requirementId: "access-choice",
            optionId: params.targetChoiceOptionId,
            confidence: "high",
            selectedChoicesCreated: false,
            selectedTargetsCreated: false,
            evidence: ["real_engine_access_corpus_target_choice:dry_run"],
          },
        }
      : {}),
  });
  const rankedTargets = rankKnownRemoteAccessTargets([
    {
      positionKey: "root:0",
      instanceId: `${definitionId}-instance`,
      definitionId,
      targetKind: params.targetKind,
      commitment: {
        serverId,
        knownAccessState:
          params.intendedAccessAction === "decline" ||
          params.intendedAccessAction === "access_only"
            ? "known_no_current_payoff"
            : "known_payoff",
        intendedAccessAction: params.intendedAccessAction,
        reason: params.reason,
        evidence: [`real_engine_access_corpus_commitment:${params.reason}`],
      },
      projection,
      valueScore: params.valueScore,
    },
    ...(params.includeSecondaryAssetTarget
      ? [
          {
            positionKey: "root:1",
            instanceId: "secondary-asset",
            definitionId: "onr_v1_322_euromarket-consortium",
            targetKind: "asset" as const,
            commitment: {
              serverId,
              knownAccessState: "known_payoff" as const,
              intendedAccessAction: "trash" as const,
              reason: "trash_affordable" as const,
              evidence: ["real_engine_access_corpus_secondary_asset"],
            },
            projection: projectAccessDecision({
              source: "access_window",
              serverId,
              knownRootDefinitionId: "onr_v1_322_euromarket-consortium",
              target: "asset",
              intendedAccessAction: "trash",
            }),
            valueScore: 3,
          },
        ]
      : []),
    ...(params.includeSecondaryLowValueUpgrade
      ? [
          {
            positionKey: "root:1",
            instanceId: "secondary-upgrade",
            definitionId: "low-value-upgrade",
            targetKind: "upgrade" as const,
            commitment: {
              serverId,
              knownAccessState: "known_no_current_payoff" as const,
              intendedAccessAction: "decline" as const,
              reason: "low_value_target" as const,
              evidence: ["real_engine_access_corpus_secondary_low_value"],
            },
            projection: projectAccessDecision({
              source: "access_window",
              serverId,
              knownRootDefinitionId: "low-value-upgrade",
              target: "upgrade",
              intendedAccessAction: "decline",
            }),
            valueScore: 0,
          },
        ]
      : []),
  ]);
  const legalAction = runLegalAction(
    params.scenarioId,
    params.legalActionPayload ?? { serverId },
  );
  const remoteFingerprint = remoteAccessFingerprint({
    serverId,
    root: [
      {
        instanceId: `${definitionId}-instance`,
        definitionId,
        known: true,
      },
    ],
  });
  return {
    scenarioId: params.scenarioId,
    reportOnly: true,
    productiveUseAllowed: false,
    runtimeConsumerStatus: "none",
    legalAction,
    serverId,
    remoteFingerprint,
    projection,
    rankedTargets,
    ...(params.accessOutcomeMemory
      ? { accessOutcomeMemory: params.accessOutcomeMemory }
      : {}),
    expectedRecommendation: params.expectedRecommendation,
    evidence: [
      `real_engine_access_corpus:${params.scenarioId}`,
      `legal_action:${legalAction.actionId}`,
      `server:${serverId}`,
      `remote_fingerprint:${remoteFingerprint}`,
      `expected_recommendation:${params.expectedRecommendation}`,
      ...projection.evidence,
      ...rankedTargets.flatMap((target) => target.rankEvidence),
      ...(params.accessOutcomeMemory?.evidence ?? []),
    ],
  };
}

function definitionIdFor(
  targetKind: "agenda" | "asset" | "upgrade" | "unknown",
): string {
  switch (targetKind) {
    case "agenda":
      return "simple_agenda";
    case "asset":
      return "onr_v1_322_euromarket-consortium";
    case "upgrade":
      return "low-value-upgrade";
    case "unknown":
      return "unknown-root";
  }
}

function runLegalAction(
  scenarioId: string,
  payload: LegalAction["payload"],
): LegalAction {
  return {
    actionId: `${scenarioId}:run_remote_1`,
    side: "runner",
    type: "start_run",
    label: "Run remote_1",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    ...(payload ? { payload } : {}),
  };
}
