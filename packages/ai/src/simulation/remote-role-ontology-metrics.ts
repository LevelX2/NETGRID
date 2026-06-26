import {
  REMOTE_ROLE_KIND_METRIC_KEYS,
  REMOTE_ROLE_SERVER_SCOPE_METRIC_KEYS,
} from "./ontology-metric-key-types";
import { progressionEntriesWithRunTargets } from "./progression-action-sequence";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { hasEvidenceFlag } from "../runtime/evidence-value";

export function summarizeRemoteRoleOntologyMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "corpRemoteRoleProfilesSeen"
  | "corpRemoteRoleUsedForSafety"
  | "corpRemoteRoleUsedForScoringRemote"
  | "corpRemoteRoleUsedForPortfolio"
  | "corpRemoteRoleConflictWithLegacy"
  | "corpRemoteRoleConflictWithBoardState"
  | "corpScoringProtectionRemoteRoleSeen"
  | "corpAgendaStealTaxRemoteRoleSeen"
  | "corpRunTaxRemoteRoleSeen"
  | "corpRemoteCapacityRoleSeen"
  | "corpAssetEconomyRemoteRoleSeen"
  | "corpBaitRemoteRoleSeen"
  | "corpAmbushRemoteRoleSeen"
  | "corpIceModifierRemoteRoleSeen"
  | "corpRemoteRoleRaisedSafetyScore"
  | "corpRemoteRoleDidNotRaiseSafetyBecauseInactive"
  | "corpRemoteRoleDidNotRaiseSafetyBecauseCheapContest"
  | "corpRemoteRolePreventedBaitAsScoringProtection"
  | "corpRemoteRolePreventedAssetAsScoringProtection"
  | "corpRemoteRoleHelpedChooseExistingRemote"
  | "corpRemoteRoleHelpedAvoidNewEmptyRemote"
  | "runnerRemoteRoleProfilesSeen"
  | "runnerRemoteRoleUsedForTrashValue"
  | "runnerRemoteRoleUsedForContestValue"
  | "runnerRemoteRoleTrashBudgetPreserved"
  | "runnerRemoteRoleConflictWithHiddenStateGuard"
  | "runnerRunTaxRemoteRoleAccessed"
  | "runnerAgendaStealTaxRemoteRoleAccessed"
  | "runnerAssetEconomyRemoteRoleAccessed"
  | "remoteRoleByKind"
  | "remoteRoleKindScoringProtection"
  | "remoteRoleKindAgendaStealTax"
  | "remoteRoleKindRunTax"
  | "remoteRoleKindRemoteCapacity"
  | "remoteRoleKindAssetEconomy"
  | "remoteRoleKindBait"
  | "remoteRoleKindAmbush"
  | "remoteRoleKindIceModifier"
  | "remoteRoleKindTaxFort"
  | "remoteRoleByServerScope"
  | "remoteRoleServerScopeFort"
  | "remoteRoleServerScopeRemote"
  | "remoteRoleServerScopeCentral"
  | "remoteRoleServerScopeServer"
  | "remoteRoleSafetyDedupeCount"
> {
  const metrics = {
    corpRemoteRoleProfilesSeen: 0,
    corpRemoteRoleUsedForSafety: 0,
    corpRemoteRoleUsedForScoringRemote: 0,
    corpRemoteRoleUsedForPortfolio: 0,
    corpRemoteRoleConflictWithLegacy: 0,
    corpRemoteRoleConflictWithBoardState: 0,
    corpScoringProtectionRemoteRoleSeen: 0,
    corpAgendaStealTaxRemoteRoleSeen: 0,
    corpRunTaxRemoteRoleSeen: 0,
    corpRemoteCapacityRoleSeen: 0,
    corpAssetEconomyRemoteRoleSeen: 0,
    corpBaitRemoteRoleSeen: 0,
    corpAmbushRemoteRoleSeen: 0,
    corpIceModifierRemoteRoleSeen: 0,
    corpRemoteRoleRaisedSafetyScore: 0,
    corpRemoteRoleDidNotRaiseSafetyBecauseInactive: 0,
    corpRemoteRoleDidNotRaiseSafetyBecauseCheapContest: 0,
    corpRemoteRolePreventedBaitAsScoringProtection: 0,
    corpRemoteRolePreventedAssetAsScoringProtection: 0,
    corpRemoteRoleHelpedChooseExistingRemote: 0,
    corpRemoteRoleHelpedAvoidNewEmptyRemote: 0,
    runnerRemoteRoleProfilesSeen: 0,
    runnerRemoteRoleUsedForTrashValue: 0,
    runnerRemoteRoleUsedForContestValue: 0,
    runnerRemoteRoleTrashBudgetPreserved: 0,
    runnerRemoteRoleConflictWithHiddenStateGuard: 0,
    runnerRunTaxRemoteRoleAccessed: 0,
    runnerAgendaStealTaxRemoteRoleAccessed: 0,
    runnerAssetEconomyRemoteRoleAccessed: 0,
    remoteRoleByKind: 0,
    remoteRoleKindScoringProtection: 0,
    remoteRoleKindAgendaStealTax: 0,
    remoteRoleKindRunTax: 0,
    remoteRoleKindRemoteCapacity: 0,
    remoteRoleKindAssetEconomy: 0,
    remoteRoleKindBait: 0,
    remoteRoleKindAmbush: 0,
    remoteRoleKindIceModifier: 0,
    remoteRoleKindTaxFort: 0,
    remoteRoleByServerScope: 0,
    remoteRoleServerScopeFort: 0,
    remoteRoleServerScopeRemote: 0,
    remoteRoleServerScopeCentral: 0,
    remoteRoleServerScopeServer: 0,
    remoteRoleSafetyDedupeCount: 0,
  };

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    for (const entry of sequence) {
      const roleKinds = new Set<string>();
      const serverScopes = new Set<string>();
      for (const evidence of entry.evidence) {
        if (evidence.startsWith("corp_remote_role_kind:"))
          roleKinds.add(evidence.slice("corp_remote_role_kind:".length));
        if (evidence.startsWith("runner_remote_role_kind:"))
          roleKinds.add(evidence.slice("runner_remote_role_kind:".length));
        if (evidence.startsWith("corp_remote_role_server_scope:"))
          serverScopes.add(
            evidence.slice("corp_remote_role_server_scope:".length),
          );
        if (evidence.startsWith("runner_remote_role_server_scope:"))
          serverScopes.add(
            evidence.slice("runner_remote_role_server_scope:".length),
          );
      }

      for (const roleKind of roleKinds) {
        const key = REMOTE_ROLE_KIND_METRIC_KEYS[roleKind];
        if (!key) continue;
        metrics.remoteRoleByKind += 1;
        metrics[key] += 1;
      }
      for (const serverScope of serverScopes) {
        const key = REMOTE_ROLE_SERVER_SCOPE_METRIC_KEYS[serverScope];
        if (!key) continue;
        metrics.remoteRoleByServerScope += 1;
        metrics[key] += 1;
      }

      if (entry.side === "corp") {
        if (hasEvidenceFlag(entry, "corp_remote_role_profile_seen:true"))
          metrics.corpRemoteRoleProfilesSeen += 1;
        if (hasEvidenceFlag(entry, "corp_remote_role_used_for_safety:true")) {
          metrics.corpRemoteRoleUsedForSafety += 1;
          metrics.remoteRoleSafetyDedupeCount += 1;
        }
        if (
          hasEvidenceFlag(
            entry,
            "corp_remote_role_used_for_scoring_remote:true",
          )
        )
          metrics.corpRemoteRoleUsedForScoringRemote += 1;
        if (hasEvidenceFlag(entry, "corp_remote_role_used_for_portfolio:true"))
          metrics.corpRemoteRoleUsedForPortfolio += 1;
        if (
          hasEvidenceFlag(entry, "corp_remote_role_conflict_with_legacy:true")
        )
          metrics.corpRemoteRoleConflictWithLegacy += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_remote_role_conflict_with_board_state:true",
          )
        )
          metrics.corpRemoteRoleConflictWithBoardState += 1;
        if (roleKinds.has("scoring_protection"))
          metrics.corpScoringProtectionRemoteRoleSeen += 1;
        if (roleKinds.has("agenda_steal_tax"))
          metrics.corpAgendaStealTaxRemoteRoleSeen += 1;
        if (roleKinds.has("run_tax")) metrics.corpRunTaxRemoteRoleSeen += 1;
        if (roleKinds.has("remote_capacity"))
          metrics.corpRemoteCapacityRoleSeen += 1;
        if (roleKinds.has("asset_economy"))
          metrics.corpAssetEconomyRemoteRoleSeen += 1;
        if (roleKinds.has("bait")) metrics.corpBaitRemoteRoleSeen += 1;
        if (roleKinds.has("ambush")) metrics.corpAmbushRemoteRoleSeen += 1;
        if (roleKinds.has("ice_modifier"))
          metrics.corpIceModifierRemoteRoleSeen += 1;
        if (hasEvidenceFlag(entry, "corp_remote_role_raised_safety_score:true"))
          metrics.corpRemoteRoleRaisedSafetyScore += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_remote_role_did_not_raise_safety_because_inactive:true",
          )
        )
          metrics.corpRemoteRoleDidNotRaiseSafetyBecauseInactive += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_remote_role_did_not_raise_safety_because_cheap_contest:true",
          )
        )
          metrics.corpRemoteRoleDidNotRaiseSafetyBecauseCheapContest += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_remote_role_prevented_bait_as_scoring_protection:true",
          )
        )
          metrics.corpRemoteRolePreventedBaitAsScoringProtection += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_remote_role_prevented_asset_as_scoring_protection:true",
          )
        )
          metrics.corpRemoteRolePreventedAssetAsScoringProtection += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_remote_role_helped_choose_existing_remote:true",
          )
        )
          metrics.corpRemoteRoleHelpedChooseExistingRemote += 1;
        if (
          hasEvidenceFlag(
            entry,
            "corp_remote_role_helped_avoid_new_empty_remote:true",
          )
        )
          metrics.corpRemoteRoleHelpedAvoidNewEmptyRemote += 1;
      }

      if (entry.side === "runner") {
        if (hasEvidenceFlag(entry, "runner_remote_role_profile_seen:true"))
          metrics.runnerRemoteRoleProfilesSeen += 1;
        if (
          hasEvidenceFlag(entry, "runner_remote_role_used_for_trash_value:true")
        )
          metrics.runnerRemoteRoleUsedForTrashValue += 1;
        if (
          hasEvidenceFlag(
            entry,
            "runner_remote_role_used_for_contest_value:true",
          )
        )
          metrics.runnerRemoteRoleUsedForContestValue += 1;
        if (
          hasEvidenceFlag(
            entry,
            "runner_remote_role_trash_budget_preserved:true",
          )
        )
          metrics.runnerRemoteRoleTrashBudgetPreserved += 1;
        if (
          hasEvidenceFlag(
            entry,
            "runner_remote_role_conflict_with_hidden_state_guard:true",
          )
        )
          metrics.runnerRemoteRoleConflictWithHiddenStateGuard += 1;
        if (roleKinds.has("run_tax"))
          metrics.runnerRunTaxRemoteRoleAccessed += 1;
        if (roleKinds.has("agenda_steal_tax"))
          metrics.runnerAgendaStealTaxRemoteRoleAccessed += 1;
        if (roleKinds.has("asset_economy"))
          metrics.runnerAssetEconomyRemoteRoleAccessed += 1;
      }
    }
  }

  return metrics;
}
