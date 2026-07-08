import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import { actionProvidesCredits } from "../actions/action-effect-classification";

export type RunnerCreditYieldScoreHint = {
  effects?: readonly unknown[];
  valueHints?: Record<string, number | undefined>;
};

export type RunnerCreditYieldScoreDependencies = {
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  hintForDefinitionId: (
    definitionId: string,
  ) => RunnerCreditYieldScoreHint | undefined;
  actionCreditCost: (action: LegalAction) => number;
};

export function runnerCreditYieldScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerCreditYieldScoreDependencies,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  if (isBasicCreditAction(action)) return undefined;
  const grossGain = runnerKnownCreditGain(input, action, dependencies);
  if (grossGain <= 0) return undefined;
  const netGain = Math.max(0, grossGain - dependencies.actionCreditCost(action));
  if (netGain <= 0) return undefined;
  const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
    input,
    action,
  );
  return {
    key: "runner_credit_action_yield",
    label: "Credit-Ertrag",
    value: Math.round(netGain * 600),
    reason: [
      `net_gain:${netGain}`,
      `gross_gain:${grossGain}`,
      `action:${action.type}`,
      `source:${sourceDefinitionId || "unknown"}`,
    ].join("|"),
  };
}

function runnerKnownCreditGain(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerCreditYieldScoreDependencies,
): number {
  const explicitPayloadGain = Math.max(
    0,
    numericPayload(action, "gainCreditsAmount"),
    numericPayload(action, "gainedCredits"),
    runnerHintCreditGain(input, action, dependencies),
  );
  const gainCreditActionAmount =
    action.type === "gain_credit" && actionProvidesCredits(action)
      ? Math.max(1, numericPayload(action, "amount"))
      : 0;
  return Math.max(
    0,
    explicitPayloadGain,
    gainCreditActionAmount,
  );
}

function runnerHintCreditGain(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerCreditYieldScoreDependencies,
): number {
  const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
    input,
    action,
  );
  if (!sourceDefinitionId) return 0;
  const hint = dependencies.hintForDefinitionId(sourceDefinitionId);
  if (!hint) return 0;
  const directAmounts = (hint.effects ?? [])
    .filter(isRunnerActionCreditEffect)
    .map((effect) => numericRecordValue(effect, "amount"))
    .filter((amount) => amount > 0);
  if (directAmounts.length > 0) return Math.max(...directAmounts);
  return hintHasRunnerActionBurstCredit(hint)
    ? numericValue(hint.valueHints?.economy)
    : 0;
}

function isRunnerActionCreditEffect(effect: unknown): effect is Record<string, unknown> {
  if (!effect || typeof effect !== "object") return false;
  const record = effect as Record<string, unknown>;
  const kind = stringRecordValue(record, "kind");
  const scope = stringRecordValue(record, "scope");
  const timing = stringRecordValue(record, "timing");
  const resource = stringRecordValue(record, "resource");
  const target = stringRecordValue(record, "target");
  return (
    (kind === "economy" || kind === "action_economy") &&
    scope === "runner" &&
    timing === "action" &&
    (resource === "credits" || target === "burst_credit")
  );
}

function hintHasRunnerActionBurstCredit(
  hint: RunnerCreditYieldScoreHint,
): boolean {
  return (hint.effects ?? []).some(isRunnerActionCreditEffect);
}

function isBasicCreditAction(action: LegalAction): boolean {
  return action.type === "gain_credit" && action.source === "basic_action";
}

function numericPayload(action: LegalAction, key: string): number {
  return numericValue(action.payload?.[key]);
}

function numericRecordValue(record: Record<string, unknown>, key: string): number {
  return numericValue(record[key]);
}

function numericValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

function stringRecordValue(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}
