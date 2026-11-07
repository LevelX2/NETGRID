import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { PlanActionDisposition } from "../../plans/plan-scheduler";
import type { RunnerRunTargetEvaluation } from "../../runner-run-target-evaluation";
import type { RunnerRemoteContestSignal } from "../../plans/runner-tactical-plan-contracts";
import { runnerKnownAgendaRunEvaluationIsCertified } from "../../run-analysis/runner-plan-run-route-facts";
import { visibleKnownAgendaOnServer } from "../../runtime/visible-server-agenda-facts";
import { runnerRemoteHasKnownIceScheduledForRunnerTurnEndTrash } from "./remote-contest-signals";
import { runnerTerminalNonlethalDamageContestAlreadyFailedThisTurn } from "./remote-contest-admission";

export function runnerRemoteRunDispositions(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  runTargets: readonly RunnerRunTargetEvaluation[];
  signals: readonly RunnerRemoteContestSignal[];
  forgoUnsafeRunCapacity: boolean;
  independentlyOwnedActionIds: ReadonlySet<string>;
  existingDispositions: readonly PlanActionDisposition[];
}): PlanActionDisposition[] {
  const {
    input,
    candidates,
    runTargets,
    signals,
    forgoUnsafeRunCapacity,
    independentlyOwnedActionIds,
  } = params;
  const dispositions = [...params.existingDispositions];
  const result: PlanActionDisposition[] = [];
  const add = (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) => {
    const disposition: PlanActionDisposition = {
      actionId,
      ownerModuleId,
      evidenceCode,
      disposition: "explicitly_nonproductive",
    };
    result.push(disposition);
    dispositions.push(disposition);
  };
  for (const evaluation of runTargets) {
    if (
      evaluation.targetKind !== "remote" ||
      forgoUnsafeRunCapacity ||
      dispositions.some((entry) => entry.actionId === evaluation.actionId) ||
      independentlyOwnedActionIds.has(evaluation.actionId)
    ) {
      continue;
    }
    if (
      runnerRemoteHasKnownIceScheduledForRunnerTurnEndTrash(
        input,
        evaluation.targetServerId,
      )
    ) {
      add(
        evaluation.actionId,
        "runner.contest_remote",
        `runner_remote_direct_run_waits_for_scheduled_ice_trash:${evaluation.targetServerId}`,
      );
      continue;
    }
    if (
      visibleKnownAgendaOnServer(input, evaluation.targetServerId) &&
      !runnerKnownAgendaRunEvaluationIsCertified(
        input,
        candidates,
        evaluation,
        evaluation.targetServerId,
      )
    ) {
      add(
        evaluation.actionId,
        "runner.contest_remote",
        `runner_remote_known_agenda_route_not_certified:${evaluation.targetServerId}:${evaluation.routeQuote?.reachability ?? "unknown"}:funding_gap_${evaluation.routeQuote?.fundingGap ?? "unknown"}:unknown_ice_${evaluation.routeQuote?.unknownIceCount ?? "unknown"}`,
      );
      continue;
    }
    const exactAssessment = signals
      .filter((signal) => signal.serverId === evaluation.targetServerId)
      .map((signal) => signal.runActionAssessments[evaluation.actionId])
      .find((assessment) => assessment !== undefined);
    if (exactAssessment?.verdict === "executable") continue;
    if (exactAssessment?.verdict === "explicitly_nonproductive") {
      add(
        evaluation.actionId,
        "runner.contest_remote",
        exactAssessment.evidenceCodes[0] ??
          "runner_remote_run_explicitly_nonproductive",
      );
      continue;
    }
    const repeatedTerminalDamageContest =
      runnerTerminalNonlethalDamageContestAlreadyFailedThisTurn(
        input,
        evaluation,
      );
    const evidenceCode =
      evaluation.prerunReserveQuote?.status === "blocked"
        ? `runner_remote_run_prerun_reserve_blocked:${evaluation.targetServerId}`
        : evaluation.knownAccessState === "known_no_current_payoff"
          ? `runner_remote_run_known_no_current_payoff:${evaluation.targetServerId}:${evaluation.recommendation}`
          : repeatedTerminalDamageContest
            ? `runner_terminal_remote_contest_repeat_blocked_after_failed_path:${evaluation.targetServerId}`
            : evaluation.pathPassability !== "reachable"
              ? `runner_remote_run_route_blocked:${evaluation.targetServerId}:${evaluation.pathPassability}`
              : evaluation.score <= 0
                ? `runner_remote_run_below_material_value:${evaluation.targetServerId}:${evaluation.score}:${evaluation.recommendation}`
                : undefined;
    if (!evidenceCode) continue;
    add(evaluation.actionId, "runner.contest_remote", evidenceCode);
  }
  return result;
}
