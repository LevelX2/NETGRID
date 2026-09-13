import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { ActiveRunnerRunRoot } from "../../plans/runner-run-origin-contract";
import {
  type RunnerPlanDomain,
  type RunnerRunRiskReassessmentSignal,
} from "../../plans/runner-tactical-plan-contracts";
import { accessCommitmentForEvaluation } from "../../run-analysis/runner-plan-run-route-facts";
import {
  runnerFutureEncounterDamageJackOutAssessment,
  runnerKnownAccessDamageJackOutAssessment,
  runnerVisibleLethalIceDamageJackOutAssessment,
} from "../../runner-damage-threat-assessment";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import { currentRunRemainingIce } from "../../runtime/current-encounter";
import { currentAccessWindowCommitment } from "./run-window-access";
import {
  isRunnerRunWindowCandidate,
  runnerRestrictedRunSequenceAction,
} from "./run-window-action-facts";
import {
  currentEncounterHasUnbrokenResolvableDeflector,
  currentRunAbortAssessment,
  runnerBindExactRunWindowPhaseRoute,
  runnerCurrentEncounterRequiresDamagePreservingBreak,
  runnerCurrentEncounterRequiresProgramPreservingBreak,
  runnerExactRunWindowPhaseActionIds,
  runnerFullPathCommitmentRequiresEncounterBreak,
  runnerInformationProbeRequiresEncounterBreak,
  runnerTerminalContestPreservesNonlethalDamageContinuation,
  visibleEncounterMitigation,
} from "./run-window-assessment";

export function buildRunnerRunWindowSignals({
  candidates,
  input,
  economy,
  activeRunRoot,
  runRiskReassessment,
  runWindowActionAssessments,
  runTargets,
}: {
  candidates: readonly ActionSemanticCandidate[];
  input: AiDecisionInput;
  economy: RunnerEconomyPosture;
  activeRunRoot: ActiveRunnerRunRoot | undefined;
  runRiskReassessment: RunnerRunRiskReassessmentSignal | undefined;
  runWindowActionAssessments: NonNullable<
    RunnerPlanDomain["runWindows"][number]["actionAssessments"]
  >;
  runTargets: readonly RunnerRunTargetEvaluation[];
}) {
  const hasRunWindowCandidate = candidates.some((candidate) =>
    isRunnerRunWindowCandidate(input, candidate),
  );
  const accessWindowCommitment = currentAccessWindowCommitment(
    input,
    economy,
    activeRunRoot?.accessCommitment,
  );
  const runWindows = hasRunWindowCandidate
    ? (() => {
        const futureEncounterSafetyAssessment =
          runnerFutureEncounterDamageJackOutAssessment(input);
        const visibleIceDamageSafetyAssessment =
          runnerVisibleLethalIceDamageJackOutAssessment(
            input,
            currentRunRemainingIce(input),
          );
        const preservesTerminalNonlethalDamageContest =
          runnerTerminalContestPreservesNonlethalDamageContinuation(
            activeRunRoot,
            visibleIceDamageSafetyAssessment,
          );
        const safetyAssessment =
          futureEncounterSafetyAssessment ??
          (preservesTerminalNonlethalDamageContest
            ? undefined
            : visibleIceDamageSafetyAssessment) ??
          runnerKnownAccessDamageJackOutAssessment(input) ??
          (preservesTerminalNonlethalDamageContest
            ? undefined
            : currentRunAbortAssessment(
                input,
                activeRunRoot,
                runRiskReassessment,
              ));
        const encounterMitigation = visibleEncounterMitigation(input);
        const currentEncounterRequiresDamageBreak =
          runnerCurrentEncounterRequiresDamagePreservingBreak(
            input,
            activeRunRoot,
          );
        const informationProbeRequiresEncounterBreak =
          runnerInformationProbeRequiresEncounterBreak(input, activeRunRoot);
        const fullPathEncounterRequiresBreak =
          runnerFullPathCommitmentRequiresEncounterBreak(
            input,
            runWindowActionAssessments,
            activeRunRoot,
            runRiskReassessment,
          );
        const informationConversionRequiresEncounterBreak =
          (activeRunRoot?.informationBoundaryReassessment?.decision ===
            "convert_to_access" ||
            activeRunRoot?.informationBoundaryReassessment?.decision ===
              "convert_to_contest") &&
          input.legalActions.some(
            (action) =>
              action.type === "continue_run" &&
              action.payload?.encounterContinue === true &&
              action.payload?.encounterWillEndRun === true,
          );
        const exactPhaseActionIds = runnerExactRunWindowPhaseActionIds(
          input,
          candidates,
          runWindowActionAssessments,
          safetyAssessment !== undefined,
          currentEncounterRequiresDamageBreak ||
            runnerCurrentEncounterRequiresProgramPreservingBreak(input) ||
            informationProbeRequiresEncounterBreak ||
            currentEncounterHasUnbrokenResolvableDeflector(input) ||
            fullPathEncounterRequiresBreak ||
            informationConversionRequiresEncounterBreak,
        );
        const exactPhaseActionAssessments = runnerBindExactRunWindowPhaseRoute(
          runWindowActionAssessments,
          exactPhaseActionIds,
        );
        const restrictedRunSequenceActions = candidates.flatMap((candidate) => {
          const action = runnerRestrictedRunSequenceAction(input, candidate);
          return action ? [action] : [];
        });
        const restrictedRunSequenceServerIds = [
          ...new Set(
            restrictedRunSequenceActions.flatMap((action) =>
              typeof action.payload?.serverId === "string"
                ? [action.payload.serverId]
                : [],
            ),
          ),
        ];
        const restrictedRunSequence =
          !input.playerView.run && restrictedRunSequenceActions.length > 0;
        const windowServerId =
          input.playerView.run?.attackedServerId ??
          (restrictedRunSequenceServerIds.length === 1
            ? restrictedRunSequenceServerIds[0]
            : undefined);
        const signal = {
          windowId: `run:${input.playerView.run?.runId ?? input.playerView.stateVersion}`,
          ...(windowServerId ? { serverId: windowServerId } : {}),
          rootPlanInstanceId:
            activeRunRoot?.instanceId ??
            (restrictedRunSequence
              ? "rules.restricted_action_sequence"
              : "rules.access_window"),
          leafPlanInstanceId: `plan:runner.convert_run_window:run%3A${input.playerView.run?.runId ?? input.playerView.stateVersion}`,
          semanticActionTypes: [
            ...new Set(
              candidates
                .filter((candidate) =>
                  isRunnerRunWindowCandidate(input, candidate),
                )
                .map((candidate) => candidate.semanticActionType),
            ),
          ],
          purposeCode: restrictedRunSequence
            ? "continue_engine_restricted_run_sequence"
            : "convert_active_run_window",
          evidenceCode: restrictedRunSequence
            ? "runner_engine_restricted_run_sequence_continuation"
            : (safetyAssessment?.evidenceCode ??
              encounterMitigation ??
              (input.playerView.run
                ? "visible_active_run"
                : "legal_access_window_without_run_snapshot")),
          ...(accessWindowCommitment
            ? { accessCommitment: accessWindowCommitment }
            : {}),
          ...(activeRunRoot?.postBreakTrashCommitment
            ? {
                postBreakTrashCommitment: structuredClone(
                  activeRunRoot.postBreakTrashCommitment,
                ),
              }
            : {}),
          ...(runRiskReassessment ? { runRiskReassessment } : {}),
          ...(safetyAssessment
            ? {
                safetyIntent: "jack_out" as const,
                safetyEvidenceCode: safetyAssessment.evidenceCode,
              }
            : {}),
          ...(encounterMitigation
            ? {
                encounterIntent: "mitigate_threat" as const,
                encounterEvidenceCode: encounterMitigation,
              }
            : {}),
          ...(Object.keys(exactPhaseActionAssessments).length > 0
            ? { actionAssessments: exactPhaseActionAssessments }
            : {}),
        };
        if (!restrictedRunSequence) {
          return [
            ...(activeRunRoot?.restrictedRunBinding
              ? [
                  {
                    ...activeRunRoot.restrictedRunBinding,
                    semanticActionTypes: [],
                    actionAssessments: {},
                  },
                ]
              : []),
            signal,
          ];
        }
        const boundSignals = restrictedRunSequenceActions.map((action) => {
          const evaluation = runTargets.find(
            (entry) => entry.actionId === action.actionId,
          );
          const assessment = exactPhaseActionAssessments[action.actionId];
          if (
            !evaluation ||
            !assessment ||
            evaluation.targetServerId !== action.payload?.serverId
          ) {
            throw new PlanResolutionFailure("invalid_plan_identity", {
              side: input.side,
              stateVersion: input.playerView.stateVersion,
              timingPoint: input.playerView.timingPoint,
              legalActionTypes: [action.type],
              unresolvedActionIds: [action.actionId],
              owner: "plan_registry",
              removalCondition:
                "Bind each restricted run action to its exact current target evaluation and run-window assessment before plan selection.",
            });
          }
          const windowId = `${signal.windowId}:${action.actionId}`;
          return {
            ...signal,
            windowId,
            serverId: evaluation.targetServerId,
            leafPlanInstanceId: planInstanceIdForProposal({
              moduleId: "runner.convert_run_window",
              dedupeKey: windowId,
            }),
            semanticActionTypes: ["run.start"],
            accessCommitment: accessCommitmentForEvaluation(input, evaluation),
            actionAssessments: { [action.actionId]: assessment },
          };
        });
        const restrictedActionIds = new Set(
          restrictedRunSequenceActions.map((action) => action.actionId),
        );
        const remainingAssessments = Object.fromEntries(
          Object.entries(exactPhaseActionAssessments).filter(
            ([id]) => !restrictedActionIds.has(id),
          ),
        );
        return [
          ...boundSignals,
          ...(Object.keys(remainingAssessments).length > 0
            ? [{ ...signal, actionAssessments: remainingAssessments }]
            : []),
        ];
      })()
    : [];
  return { runWindows };
}
