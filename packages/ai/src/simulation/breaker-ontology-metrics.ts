import { BREAKER_ONTOLOGY_COVERAGE_METRIC_KEYS } from "./ontology-metric-key-types";
import { progressionEntriesWithRunTargets } from "./progression-action-sequence";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import {
  evidenceNumber,
  evidenceValue,
  hasEvidenceFlag,
  hasEvidencePrefix,
} from "../runtime/evidence-value";

export function summarizeBreakerOntologyMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "runnerBreakerOntologyProfilesSeen"
  | "runnerBreakerOntologyCoverageUsed"
  | "runnerBreakerOntologyFallbackUsed"
  | "runnerBreakerOntologyConflict"
  | "runnerInstallableBreakerRankedByOntology"
  | "runnerSearchTargetRankedByOntology"
  | "runnerMissingCoverageResolvedByOntology"
  | "runnerBreakerOntologySetupSuppressedBecausePressureReady"
  | "corpVisibleRunnerBreakerOntologyProfilesSeen"
  | "corpRemoteSafetyUsedRunnerBreakerOntology"
  | "corpCheapContestDetectedByBreakerOntology"
  | "corpRemoteSafetyOntologyConflictWithEffectiveQuote"
  | "corpAgendaInstallBlockedByOntologyCheapContest"
  | "corpAdvanceBlockedByOntologyCheapContest"
  | "breakerOntologyCoverageByType"
  | "breakerOntologyCoverageWall"
  | "breakerOntologyCoverageSentry"
  | "breakerOntologyCoverageCodeGate"
  | "breakerOntologyCoverageAp"
  | "breakerOntologyCoverageTrace"
  | "breakerOntologyCoverageWatchdog"
  | "breakerOntologyCoverageBlackIce"
  | "breakerOntologyCoverageUniversal"
  | "breakerOntologyCoverageUnknownSpecial"
  | "breakerOntologySideEffectsSeen"
  | "breakerOntologyCostProfileSeen"
  | "breakerOntologyFallbackEvidenceCount"
  | "breakerOntologyEffectiveQuoteOverrideCount"
> {
  const metrics = {
    runnerBreakerOntologyProfilesSeen: 0,
    runnerBreakerOntologyCoverageUsed: 0,
    runnerBreakerOntologyFallbackUsed: 0,
    runnerBreakerOntologyConflict: 0,
    runnerInstallableBreakerRankedByOntology: 0,
    runnerSearchTargetRankedByOntology: 0,
    runnerMissingCoverageResolvedByOntology: 0,
    runnerBreakerOntologySetupSuppressedBecausePressureReady: 0,
    corpVisibleRunnerBreakerOntologyProfilesSeen: 0,
    corpRemoteSafetyUsedRunnerBreakerOntology: 0,
    corpCheapContestDetectedByBreakerOntology: 0,
    corpRemoteSafetyOntologyConflictWithEffectiveQuote: 0,
    corpAgendaInstallBlockedByOntologyCheapContest: 0,
    corpAdvanceBlockedByOntologyCheapContest: 0,
    breakerOntologyCoverageByType: 0,
    breakerOntologyCoverageWall: 0,
    breakerOntologyCoverageSentry: 0,
    breakerOntologyCoverageCodeGate: 0,
    breakerOntologyCoverageAp: 0,
    breakerOntologyCoverageTrace: 0,
    breakerOntologyCoverageWatchdog: 0,
    breakerOntologyCoverageBlackIce: 0,
    breakerOntologyCoverageUniversal: 0,
    breakerOntologyCoverageUnknownSpecial: 0,
    breakerOntologySideEffectsSeen: 0,
    breakerOntologyCostProfileSeen: 0,
    breakerOntologyFallbackEvidenceCount: 0,
    breakerOntologyEffectiveQuoteOverrideCount: 0,
  };

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    for (const entry of sequence) {
      const structuredGripBreakers = evidenceNumber(
        entry,
        "structured_matching_grip_breakers:",
      );
      const structuredHeapBreakers = evidenceNumber(
        entry,
        "structured_heap_matching_breakers:",
      );
      const matchingGripBreakers = evidenceNumber(
        entry,
        "matching_grip_breakers:",
      );
      const coverageSearchActions = evidenceNumber(
        entry,
        "coverage_search_actions:",
      );
      const coverageRecoveryActions = evidenceNumber(
        entry,
        "coverage_recovery_actions:",
      );
      const visibleRunnerProfiles = evidenceNumber(
        entry,
        "visible_runner_breaker_ontology_profiles:",
      );
      const structuredContestFallback =
        hasEvidenceFlag(
          entry,
          "structured_breaker_profile_contest_fallback:true",
        ) || hasEvidenceFlag(entry, "structured_breaker_ice_cost:true");
      const effectiveQuoteOverride =
        hasEvidenceFlag(
          entry,
          "structured_breaker_effective_quote_override:true",
        ) ||
        hasEvidenceFlag(
          entry,
          "structured_breaker_ontology_effective_quote_override:true",
        );
      const ontologyConflict =
        hasEvidenceFlag(entry, "runner_breaker_ontology_conflict:true") ||
        hasEvidenceFlag(entry, "structured_breaker_coverage_conflict:true") ||
        hasEvidenceFlag(
          entry,
          "corp_remote_safety_ontology_conflict_with_effective_quote:true",
        );

      if (entry.side === "runner") {
        const runnerProfileSeen =
          structuredGripBreakers > 0 ||
          structuredHeapBreakers > 0 ||
          hasEvidenceFlag(entry, "structured_breaker_cost_profile:true") ||
          hasEvidencePrefix(entry, "structured_breaker_coverage:") ||
          hasEvidenceFlag(entry, "runner_breaker_ontology_profile_seen:true");
        if (runnerProfileSeen) metrics.runnerBreakerOntologyProfilesSeen += 1;
        if (
          structuredGripBreakers > 0 ||
          structuredHeapBreakers > 0 ||
          hasEvidencePrefix(entry, "structured_breaker_coverage:") ||
          hasEvidenceFlag(entry, "runner_breaker_ontology_coverage_used:true")
        )
          metrics.runnerBreakerOntologyCoverageUsed += 1;
        if (
          (structuredGripBreakers > 0 && matchingGripBreakers <= 0) ||
          hasEvidenceFlag(entry, "runner_breaker_ontology_fallback_used:true")
        )
          metrics.runnerBreakerOntologyFallbackUsed += 1;
        if (ontologyConflict) metrics.runnerBreakerOntologyConflict += 1;
        if (
          entry.actionType === "install_card" &&
          (hasEvidenceFlag(entry, "structured_breaker_cost_profile:true") ||
            structuredGripBreakers > 0 ||
            hasEvidenceFlag(
              entry,
              "runner_installable_breaker_ranked_by_ontology:true",
            ))
        )
          metrics.runnerInstallableBreakerRankedByOntology += 1;
        if (
          (coverageSearchActions > 0 || coverageRecoveryActions > 0) &&
          (structuredGripBreakers > 0 ||
            structuredHeapBreakers > 0 ||
            hasEvidenceFlag(
              entry,
              "runner_search_target_ranked_by_ontology:true",
            ))
        )
          metrics.runnerSearchTargetRankedByOntology += 1;
        if (
          hasEvidenceFlag(
            entry,
            "runner_missing_coverage_resolved_by_ontology:true",
          ) ||
          (entry.runnerPathBlockedByMissingCoverage === true &&
            (structuredGripBreakers > 0 || structuredHeapBreakers > 0))
        )
          metrics.runnerMissingCoverageResolvedByOntology += 1;
        if (
          hasEvidenceFlag(
            entry,
            "runner_breaker_ontology_setup_suppressed_pressure_ready:true",
          )
        )
          metrics.runnerBreakerOntologySetupSuppressedBecausePressureReady += 1;
      }

      if (entry.side === "corp") {
        if (visibleRunnerProfiles > 0 || structuredContestFallback)
          metrics.corpVisibleRunnerBreakerOntologyProfilesSeen += 1;
        if (structuredContestFallback)
          metrics.corpRemoteSafetyUsedRunnerBreakerOntology += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_cheap_contest_detected_by_breaker_ontology:true",
          ) ||
          (structuredContestFallback &&
            evidenceValue(entry, "runner_contest_capacity:") === "high")
        )
          metrics.corpCheapContestDetectedByBreakerOntology += 1;
        if (
          effectiveQuoteOverride ||
          hasEvidenceFlag(
            entry,
            "corp_remote_safety_ontology_conflict_with_effective_quote:true",
          )
        )
          metrics.corpRemoteSafetyOntologyConflictWithEffectiveQuote += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_agenda_install_blocked_by_ontology_cheap_contest:true",
          ) ||
          (structuredContestFallback &&
            hasEvidenceFlag(
              entry,
              "corp_agenda_install_deferred_due_to_cheap_contest:true",
            ))
        )
          metrics.corpAgendaInstallBlockedByOntologyCheapContest += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_advance_blocked_by_ontology_cheap_contest:true",
          ) ||
          (structuredContestFallback &&
            hasEvidenceFlag(
              entry,
              "corp_advance_deferred_due_to_cheap_contest:true",
            ))
        )
          metrics.corpAdvanceBlockedByOntologyCheapContest += 1;
      }

      const coverageTypes = new Set<string>();
      for (const evidence of entry.evidence) {
        if (evidence.startsWith("structured_breaker_coverage:")) {
          coverageTypes.add(
            evidence.slice("structured_breaker_coverage:".length),
          );
        }
        if (evidence.startsWith("structured_breaker_visible_coverage:")) {
          coverageTypes.add(
            evidence.slice("structured_breaker_visible_coverage:".length),
          );
        }
      }
      for (const coverage of coverageTypes) {
        const metricKey = BREAKER_ONTOLOGY_COVERAGE_METRIC_KEYS[coverage];
        if (!metricKey) continue;
        metrics.breakerOntologyCoverageByType += 1;
        metrics[metricKey] += 1;
      }
      const sideEffectPenalty = evidenceNumber(
        entry,
        "structured_breaker_side_effect_penalty:",
      );
      if (sideEffectPenalty > 0) metrics.breakerOntologySideEffectsSeen += 1;
      if (
        hasEvidenceFlag(entry, "structured_breaker_cost_profile:true") ||
        hasEvidencePrefix(entry, "structured_breaker_install_credits:") ||
        hasEvidencePrefix(entry, "structured_breaker_memory:") ||
        hasEvidencePrefix(entry, "structured_breaker_cost:")
      )
        metrics.breakerOntologyCostProfileSeen += 1;
      if (structuredContestFallback)
        metrics.breakerOntologyFallbackEvidenceCount += 1;
      if (effectiveQuoteOverride)
        metrics.breakerOntologyEffectiveQuoteOverrideCount += 1;
    }
  }

  return metrics;
}
