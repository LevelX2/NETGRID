import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { RunnerProgramInstallTrashAssessment } from "../../runtime/runner-program-install-trash-policy";
export type RunnerDevelopmentInstallServices = Readonly<{
  assessCard: (
    input: AiDecisionInput,
    card: VisibleCard,
  ) => RunnerProgramInstallTrashAssessment;
  assessAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerProgramInstallTrashAssessment | undefined;
}>;
