import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import type { AiCardHint } from "../ai-hints";

export type RunnerLoanSourceDependencies = {
  highRiskLoanDefinitionId: string;
  hintForDefinitionId: (definitionId: string) => AiCardHint | undefined;
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
};

export function runnerLoanDefinitionIdForAction(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerLoanSourceDependencies,
): string | undefined {
  if (action.type !== "install_card") return undefined;
  const definitionId = dependencies.sourceDefinitionIdForAction(input, action);
  return runnerDefinitionIsHighRiskLoan(definitionId, dependencies)
    ? definitionId
    : undefined;
}

export function runnerDefinitionIsHighRiskLoan(
  definitionId: string | undefined,
  dependencies: Pick<
    RunnerLoanSourceDependencies,
    "highRiskLoanDefinitionId" | "hintForDefinitionId"
  >,
): boolean {
  if (!definitionId) return false;
  if (definitionId === dependencies.highRiskLoanDefinitionId) return true;
  const hint = dependencies.hintForDefinitionId(definitionId);
  const targets = new Set(
    (hint?.effects ?? [])
      .map((effect) =>
        stringRecordValue(effect as Record<string, unknown>, "target"),
      )
      .filter((target): target is string => target !== undefined),
  );
  return (
    targets.has("economy.high_risk_burst_credit") &&
    targets.has("risk.debt_loss_condition") &&
    targets.has("risk.lose_game_debt") &&
    runnerLoanHintRiskTags(hint).includes("leave_play_penalty")
  );
}

export function runnerInstalledLoanCards(
  input: AiDecisionInput,
  dependencies: Pick<
    RunnerLoanSourceDependencies,
    "highRiskLoanDefinitionId" | "hintForDefinitionId"
  >,
): VisibleCard[] {
  return (input.playerView.own.rig ?? []).filter((card) =>
    runnerDefinitionIsHighRiskLoan(card.definitionId, dependencies),
  );
}

export function runnerLoanSemanticEvidence(
  definitionId: string | undefined,
  dependencies: Pick<RunnerLoanSourceDependencies, "hintForDefinitionId">,
): string[] | undefined {
  if (!definitionId) return undefined;
  const hint = dependencies.hintForDefinitionId(definitionId);
  if (!hint) return [`loanSource:${definitionId}`];
  const targets = sortedUnique(
    (hint.effects ?? [])
      .map((effect) =>
        stringRecordValue(effect as Record<string, unknown>, "target"),
      )
      .filter((target): target is string => target !== undefined)
      .filter(
        (target) =>
          target === "economy.high_risk_burst_credit" ||
          target === "risk.debt_loss_condition" ||
          target === "risk.lose_game_debt",
      ),
  );
  return [
    `loanSource:${definitionId}`,
    ...runnerLoanHintRiskTags(hint).map((tag) => `loanRiskTag:${tag}`),
    ...targets.map((target) => `loanSemantic:${target}`),
  ];
}

export function runnerLoanValueHint(
  hint: AiCardHint | undefined,
  key: "installCreditGain" | "startOfTurnCreditLoss" | "leavePlayPayCost",
  fallback: number,
): number {
  const value = hint?.valueHints?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function runnerLoanHintRiskTags(hint: AiCardHint | undefined): string[] {
  const riskTags = (hint as (AiCardHint & { riskTags?: unknown }) | undefined)
    ?.riskTags;
  return Array.isArray(riskTags)
    ? riskTags.filter((tag): tag is string => typeof tag === "string")
    : [];
}

function stringRecordValue(value: unknown, key: string): string | undefined {
  return value && typeof value === "object" && key in value
    ? typeof (value as Record<string, unknown>)[key] === "string"
      ? ((value as Record<string, unknown>)[key] as string)
      : undefined
    : undefined;
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right),
  );
}
