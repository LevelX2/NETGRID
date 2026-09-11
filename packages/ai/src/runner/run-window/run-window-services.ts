import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { DiscardChoiceKeepScore } from "../../runtime/discard-choice-selection";
import type {
  PendingChoice,
  PendingChoiceOptions,
} from "../../runtime/plan-bound-choice-contract";
import type { SemanticRuntimeExclusion } from "../../runtime/semantic-runtime-types";

/** Decision-local services supplied by the shared runtime composition. */
export type RunWindowAssessmentServices = {
  runnerEncounterActionExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
};

export type RunWindowDiscardKeepScore = (
  input: AiDecisionInput,
  card: VisibleCard,
) => DiscardChoiceKeepScore;

export type RunWindowProgramInstallTrashSelection = (
  input: AiDecisionInput,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
) => string[];
