import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

type RunnerAccessTrashContext = {
  trashable: boolean;
  affordableRelevant: boolean;
  highImpact: boolean;
  trashCost: number;
  generalCreditCost: number;
  creditsAfterGeneralTrash: number;
  reserveTarget: number;
  deferredByBudget: boolean;
  centralAccess: boolean;
  accessServerId?: string;
  targetType?: string;
  role?: string;
};

export type RunnerAccessTrashScoreDependencies = {
  trashAccessContext: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerAccessTrashContext;
};

export function runnerAccessTrashScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerAccessTrashScoreDependencies,
): AiDecisionScoreComponent[] {
  const components: AiDecisionScoreComponent[] = [];
  const context = dependencies.trashAccessContext(input, action);
  if (!context.trashable) return components;
  const takingTrash = action.type === "trash_accessed_card";
  if (takingTrash) {
    components.push({
      key: "runner_trash_affordability",
      label: "Trash-Kosten zahlbar",
      value:
        input.playerView.own.credits >= context.generalCreditCost
          ? context.centralAccess
            ? 220
            : 600
          : -1200,
      reason: `credits:${input.playerView.own.credits};cost:${context.trashCost};general_cost:${context.generalCreditCost}`,
    });
    if (context.centralAccess) {
      components.push({
        key: "runner_central_access_trash_low_corp_investment",
        label: "Zentralzugriff ohne Korp-Install",
        value: -900,
        reason: context.accessServerId ?? "central",
      });
    }
    if (context.deferredByBudget) {
      components.push({
        key: "runner_access_trash_deferred_by_budget",
        label: "Budget nach Trash zu niedrig",
        value: -5600,
        reason: `credits_after:${context.creditsAfterGeneralTrash};reserve:${context.reserveTarget}`,
      });
    }
    if (context.role === "low_value") {
      components.push({
        key: "runner_access_trash_low_value",
        label: "Niedriger Trash-Wert",
        value: -5200,
        reason: context.targetType ?? "unknown",
      });
    }
  } else {
    if (context.deferredByBudget) {
      components.push({
        key: "runner_decline_trash_preserve_budget",
        label: "Budget erhalten",
        value: 3600,
        reason: `credits_after_trash:${context.creditsAfterGeneralTrash};reserve:${context.reserveTarget}`,
      });
    } else if (context.role === "low_value") {
      components.push({
        key: "runner_decline_low_value_trash",
        label: "Niedrigen Trash ablehnen",
        value: 2600,
        reason: context.targetType ?? "unknown",
      });
    } else if (context.affordableRelevant && context.highImpact) {
      components.push({
        key: "runner_decline_relevant_trash",
        label: "Relevanten Trash liegenlassen",
        value: -1800,
        reason: context.role ?? "relevant",
      });
    }
  }
  return components;
}
