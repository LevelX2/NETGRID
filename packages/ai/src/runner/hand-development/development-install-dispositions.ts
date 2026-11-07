import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { PlanActionDisposition } from "../../plans/plan-scheduler";
import type { RunnerHandDevelopmentEvaluation } from "./runner-hand-development-types";
import type { RunnerProgramInstallTrashAssessment } from "../../runtime/runner-program-install-trash-policy";
import {
  runnerCandidateIsOptionalProgramTrashInstall,
  runnerOptionalProgramTrashInstallDuplicatesInstalledDefinition,
} from "../../runtime/runner-development-action-facts";
import {
  runnerCandidateSourceDefinitionId,
  runnerInstallSourceInstanceId,
} from "../../runtime/runner-action-source-facts";

export function runnerDevelopmentProgramTrashInstallDispositions(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[];
  independentlyOwnedActionIds: ReadonlySet<string>;
  existingDispositions: readonly PlanActionDisposition[];
  assessAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerProgramInstallTrashAssessment | undefined;
}): PlanActionDisposition[] {
  const {
    input,
    candidates,
    handDevelopment,
    independentlyOwnedActionIds: specializedEconomyActionIds,
    existingDispositions: dispositions,
    assessAction: runnerProgramInstallTrashAssessmentForAction,
  } = params;
  const result: PlanActionDisposition[] = [];
  const add = (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) => {
    result.push({
      actionId,
      ownerModuleId,
      evidenceCode,
      disposition: "explicitly_nonproductive",
    });
  };
  for (const candidate of candidates) {
    if (candidate.semanticActionType !== "install.card") {
      continue;
    }
    const legalAction = input.legalActions.find(
      (action) => action.actionId === candidate.actionId,
    );
    const optionalProgramTrashInstall =
      runnerCandidateIsOptionalProgramTrashInstall(input, candidate);
    if (
      optionalProgramTrashInstall &&
      dispositions.some((entry) => entry.actionId === candidate.actionId)
    ) {
      continue;
    }
    const sacrificeAssessment =
      optionalProgramTrashInstall && legalAction
        ? runnerProgramInstallTrashAssessmentForAction(input, legalAction)
        : undefined;
    if (
      sacrificeAssessment?.memoryRequired === true &&
      !sacrificeAssessment.canFreeRequiredMemory
    ) {
      add(
        candidate.actionId,
        "runner.develop_board_and_hand",
        "runner_program_trash_install_has_no_acceptable_sacrifice",
      );
      continue;
    }
    if (specializedEconomyActionIds.has(candidate.actionId)) {
      continue;
    }
    const sourceCardInstanceId = runnerInstallSourceInstanceId(
      candidate,
      legalAction,
    );
    if (!sourceCardInstanceId) continue;
    if (!optionalProgramTrashInstall) continue;
    const sourceDefinitionId = runnerCandidateSourceDefinitionId(
      input,
      candidate,
    );
    const duplicateDefinitionAlreadyInstalled =
      runnerOptionalProgramTrashInstallDuplicatesInstalledDefinition(
        input,
        candidate,
      );
    if (duplicateDefinitionAlreadyInstalled) {
      add(
        candidate.actionId,
        "runner.develop_board_and_hand",
        `runner_program_trash_install_rejected_duplicate_definition:${sourceDefinitionId}`,
      );
      continue;
    }
    const directInstallAvailable =
      candidates.some((alternative) => {
        const nativeAction = input.legalActions.find(
          (action) => action.actionId === alternative.actionId,
        );
        return (
          alternative.actionId !== candidate.actionId &&
          alternative.semanticActionType === "install.card" &&
          nativeAction?.type === "install_card" &&
          nativeAction.payload?.runnerProgramTrashBeforeInstall !== true &&
          runnerInstallSourceInstanceId(alternative, nativeAction) ===
            sourceCardInstanceId
        );
      }) ||
      handDevelopment.some((evaluation) => {
        const nativeAction = input.legalActions.find(
          (action) => action.actionId === evaluation.legalActionId,
        );
        return (
          evaluation.cardInstanceId === sourceCardInstanceId &&
          nativeAction?.type === "install_card" &&
          nativeAction.payload?.runnerProgramTrashBeforeInstall !== true
        );
      });
    if (!directInstallAvailable) continue;
    add(
      candidate.actionId,
      "runner.develop_board_and_hand",
      "runner_program_trash_install_unneeded_direct_install_available",
    );
  }
  return result;
}
