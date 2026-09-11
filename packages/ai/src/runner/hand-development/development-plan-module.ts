import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import { runnerDevelopmentCardAdmission } from "../../plans/runner-development-contracts";
import {
  runnerTacticalAssessment as assessment,
  domain,
  exactRunnerParentSupportResourceGaps,
  runnerTacticalProposal as proposal,
  state,
} from "../../plans/runner-tactical-module-support";
import { DevelopmentState, RunnerDevelopmentSignal } from "./development-types";

export function developmentModule(): PlanModule {
  return {
    moduleId: "runner.develop_board_and_hand",
    side: "runner",
    discover: (context) =>
      domain(context).developments.flatMap((signal) => {
        const admission = runnerDevelopmentCardAdmission({
          definitionId: signal.definitionId,
          assignedDomainPlanIds: signal.assignedDomainPlanIds,
          ...(signal.purposeCode
            ? { concretePurposeCode: signal.purposeCode }
            : {}),
          duplicateAlreadyInstalled: signal.duplicateAlreadyInstalled,
          affordableOrSupportable: signal.affordableOrSupportable,
        });
        if (!admission.admitted) return [];
        const candidates = developmentCandidates(context, signal);
        return [
          proposal(
            "runner.develop_board_and_hand",
            signal.developmentId,
            { kind: "development", signal } satisfies DevelopmentState,
            signal.priorityClass,
            signal.assignedDomainPlanIds,
            {
              kind: signal.targetKind ?? "card",
              id: signal.definitionId,
            },
            signal.supportNeedId !== undefined || candidates.length > 0,
            `${signal.evidenceCode}:${admission.reasonCode}`,
            undefined,
            {
              phase: signal.phase,
              blockerCode:
                signal.phase === "fund"
                  ? "development_funding_route_unavailable_this_turn"
                  : signal.phase === "prepare_restricted_sequence"
                    ? "productive_program_bundle_not_ready"
                    : "development_action_route_unavailable",
              ...(signal.evidenceCodes
                ? { evidenceCodes: signal.evidenceCodes }
                : {}),
            },
          ),
        ];
      }),
    assess: (instance, context, portfolio) => {
      const current = state<DevelopmentState>(instance);
      const routeExists =
        developmentCandidates(context, current.signal).length > 0;
      const resourceGaps = exactRunnerParentSupportResourceGaps(
        context,
        instance,
        current.signal.supportNeedId,
        routeExists,
      );
      const result = assessment(
        instance,
        current.signal.priorityClass,
        routeExists,
        current.signal.value,
        portfolio.executorInstanceId,
        undefined,
        "visible_state_forced",
        resourceGaps,
      );
      if (!routeExists && current.signal.supportNeedId) {
        result.blockers = [
          {
            code: "waiting_for_bound_funding_support",
            owner: "plan_module",
            removable: true,
            resumeCondition: { code: current.signal.supportNeedId },
          },
        ];
      }
      return result;
    },
    materialize: (instance, _assessment, context) => {
      const current = state<DevelopmentState>(instance);
      const funding = current.signal.phase === "fund";
      const preparingRestrictedSequence =
        current.signal.phase === "prepare_restricted_sequence";
      const openingRestrictedSequence =
        current.signal.phase === "open_restricted_sequence";
      const executingRestrictedSequence =
        current.signal.phase === "execute_restricted_sequence";
      const completingRestrictedSequence =
        current.signal.phase === "complete_restricted_sequence";
      const resolvingEventInstallChoice =
        current.signal.phase === "resolve_event_install_choice";
      return {
        step: {
          stepId: `${instance.instanceId}:${current.signal.phase}`,
          capability: {
            capabilityId: preparingRestrictedSequence
              ? "prepare_productive_program_install_sequence"
              : openingRestrictedSequence
                ? "open_committed_program_install_sequence"
                : executingRestrictedSequence
                  ? "execute_next_committed_program_install"
                  : completingRestrictedSequence
                    ? "complete_committed_program_install_sequence"
                    : resolvingEventInstallChoice
                      ? "resolve_bound_event_install_choice"
                      : funding
                        ? `fund_${current.signal.definitionId}`
                        : `develop_${current.signal.definitionId}`,
            semanticActionTypes: current.signal.semanticActionTypes,
            ...(funding ||
            openingRestrictedSequence ||
            executingRestrictedSequence ||
            completingRestrictedSequence ||
            resolvingEventInstallChoice ||
            current.signal.targetKind === "capability"
              ? {}
              : {
                  requiredSourceDefinitionIds: [current.signal.definitionId],
                }),
          },
          ...(funding ||
          openingRestrictedSequence ||
          executingRestrictedSequence ||
          completingRestrictedSequence ||
          resolvingEventInstallChoice ||
          current.signal.targetKind === "capability"
            ? {}
            : {
                target: {
                  kind: "card" as const,
                  id: current.signal.definitionId,
                },
              }),
          purpose: openingRestrictedSequence
            ? "Open a Valu-Pak sequence only for a concrete, resource-feasible ordered program-install commitment."
            : preparingRestrictedSequence
              ? "Keep Valu-Pak resident while waiting for a concrete bundle of currently meaningful, jointly feasible programs."
              : executingRestrictedSequence
                ? "Execute the next program in the committed Valu-Pak installation order."
                : completingRestrictedSequence
                  ? "Close the completed Valu-Pak installation sequence without ending the Runner turn."
                  : resolvingEventInstallChoice
                    ? "Resolve the Engine-opened event install choice from the exact resident development-plan target binding."
                    : funding
                      ? `Fund the resident ${current.signal.definitionId} development plan.`
                      : `Develop ${current.signal.definitionId} for ${current.signal.purposeCode ?? "assigned domain plan"}.`,
        },
        candidates: developmentCandidates(context, current.signal),
      };
    },
  };
}

function developmentCandidates(
  context: PlanSchedulerContext,
  signal: RunnerDevelopmentSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        signal.actionIds.includes(candidate.actionId) &&
        !context.actionDispositions?.some(
          (disposition) => disposition.actionId === candidate.actionId,
        ) &&
        (signal.phase === "fund" ||
          signal.phase === "open_restricted_sequence" ||
          signal.phase === "execute_restricted_sequence" ||
          signal.phase === "complete_restricted_sequence" ||
          signal.phase === "resolve_event_install_choice" ||
          signal.targetKind === "capability" ||
          candidate.sourceDefinitionId === signal.definitionId) &&
        signal.semanticActionTypes.includes(candidate.semanticActionType) &&
        !runnerOptionalProgramTrashInstallHasDirectSibling(context, candidate),
    )
    .map((candidate) => ({
      candidate,
      stepValue:
        signal.phase === "fund"
          ? signal.value +
            Math.min(
              signal.fundingGap ?? 0,
              Math.max(
                0,
                candidate.economyProjection?.netLiquidCreditGain ?? 0,
              ),
            ) *
              20
          : signal.value,
    }));
}

function runnerOptionalProgramTrashInstallHasDirectSibling(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
): boolean {
  if (candidate.semanticActionType !== "install.card") return false;
  const action = context.input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  const optionalProgramTrashInstall =
    action?.payload?.runnerProgramTrashBeforeInstall === true ||
    candidate.actionId.endsWith(".runner_program_trash_before_install");
  if (!optionalProgramTrashInstall) return false;
  const sourceCardInstanceId = runnerInstallSourceCardInstanceId(
    context,
    candidate,
  );
  if (!sourceCardInstanceId) return false;
  return context.actionCandidates.some((alternative) => {
    if (
      alternative.actionId === candidate.actionId ||
      alternative.semanticActionType !== "install.card" ||
      runnerInstallSourceCardInstanceId(context, alternative) !==
        sourceCardInstanceId
    ) {
      return false;
    }
    const alternativeAction = context.input.legalActions.find(
      (entry) => entry.actionId === alternative.actionId,
    );
    return (
      alternativeAction?.payload?.runnerProgramTrashBeforeInstall !== true &&
      !alternative.actionId.endsWith(".runner_program_trash_before_install")
    );
  });
}

function runnerInstallSourceCardInstanceId(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
): string | undefined {
  if (candidate.sourceCardInstanceId) return candidate.sourceCardInstanceId;
  const action = context.input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  const cardId = action?.payload?.cardId;
  if (typeof cardId === "string" && cardId.length > 0) return cardId;
  return typeof action?.source === "string" &&
    action.source.length > 0 &&
    action.source !== "basic_action"
    ? action.source
    : undefined;
}
