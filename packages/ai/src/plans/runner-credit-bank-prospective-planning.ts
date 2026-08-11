import { planningCardByDefinitionId } from "@netgrid/cards/planning";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  buildCanonicalLegalActionInvocation,
  type CanonicalLegalActionInvocation,
  type PlanningStateIdentity,
} from "./turn-planning-contracts";

export type ProspectivePlanningStatus =
  | "available_by_spec"
  | "feasible_in_projection"
  | "blocked"
  | "requires_engine_quote"
  | "unknown";

export type RunnerCreditBankProspectivePlan = {
  sourceDefinitionId: string;
  sourceCardInstanceId: string;
  owner: "runner.credit_bank";
  install: {
    availability: ProspectivePlanningStatus;
    projection: ProspectivePlanningStatus;
    creditCost: number;
    actionCost: number;
    remainingActions: number;
    installChoices: ProspectivePlanningStatus;
  };
  build: {
    availability: ProspectivePlanningStatus;
    projection: ProspectivePlanningStatus;
    resolution: ProspectivePlanningStatus;
    capabilityKey: string;
    canonicalCapabilityId: string;
    actionCost: number;
    hostedCreditsAdded: number;
    sharedLimit: {
      kind: "once_per_turn_per_source";
      scope: "any_ability_on_source";
    };
    futureInvocation: CanonicalLegalActionInvocation;
  };
  cashOut: {
    availability: ProspectivePlanningStatus;
    projection: ProspectivePlanningStatus;
    resolution: ProspectivePlanningStatus;
    capabilityKey: string;
    canonicalCapabilityId: string;
  };
  evidenceCodes: string[];
};

/**
 * Compiles the visible, static portion of an in-hand credit-bank line. It does
 * not make a future action legal: the build step remains quote-bound until the
 * Engine rematerializes the exact current LegalAction after installation.
 */
export function runnerCreditBankProspectivePlan(params: {
  sourceDefinitionId: string;
  sourceCardInstanceId: string;
  currentCredits: number;
  currentActions: number;
  stateIdentity: PlanningStateIdentity;
}): RunnerCreditBankProspectivePlan | undefined {
  const card = planningCardByDefinitionId(params.sourceDefinitionId);
  if (card?.side !== "runner") return undefined;

  const build = card.prospectiveCapabilities.capabilities.find(
    (capability) =>
      capability.identity.kind === "keyed" &&
      capability.planningAnnotations?.some(
        (annotation) =>
          annotation.kind === "plan_owner" &&
          annotation.owner === "runner.credit_bank" &&
          annotation.route === "build",
      ),
  );
  if (build?.identity.kind !== "keyed") return undefined;
  const cashOut = card.prospectiveCapabilities.capabilities.find(
    (capability) =>
      capability.identity.kind === "keyed" &&
      capability.planningAnnotations?.some(
        (annotation) =>
          annotation.kind === "plan_owner" &&
          annotation.owner === "runner.credit_bank" &&
          annotation.route === "cash_out",
      ),
  );
  if (cashOut?.identity.kind !== "keyed") return undefined;

  const costs = descriptorArray(build, ".costs");
  const effects = descriptorArray(build, ".effects");
  const limit = descriptorObject(build, ".limit");
  const actionCost = numberField(
    costs.find((cost) => stringField(cost, "kind") === "action"),
    "amount",
  );
  const hostedCreditsAdded = numberField(
    effects.find(
      (effect) => stringField(effect, "kind") === "add_hosted_credits",
    ),
    "amount",
  );
  if (
    actionCost === undefined ||
    hostedCreditsAdded === undefined ||
    stringField(limit, "kind") !== "once_per_turn_per_source" ||
    stringField(limit, "scope") !== "any_ability_on_source"
  )
    return undefined;

  const installCost = card.engine.characteristics.numeric.installCost;
  if (installCost === null || installCost < 0) return undefined;
  const installActionCost = 1;
  const remainingActions = Math.max(
    0,
    params.currentActions - installActionCost,
  );
  const installProjection =
    params.currentActions >= installActionCost &&
    params.currentCredits >= installCost
      ? "feasible_in_projection"
      : "blocked";
  const buildProjection =
    installProjection === "feasible_in_projection" &&
    remainingActions >= actionCost
      ? "feasible_in_projection"
      : "blocked";
  const installChoices = card.prospectiveCapabilities.capabilities.some(
    (capability) => capability.installChoices.length > 0,
  )
    ? "requires_engine_quote"
    : "feasible_in_projection";
  const futureInvocation = buildCanonicalLegalActionInvocation({
    stateIdentity: params.stateIdentity,
    semanticActionType: "card_ability.trigger",
    sourceCardInstanceId: params.sourceCardInstanceId,
    sourceAbilityBinding: {
      kind: "card_spec_capability_key",
      sourceAbilityId: build.identity.canonicalCapabilityId,
    },
  });

  return {
    sourceDefinitionId: params.sourceDefinitionId,
    sourceCardInstanceId: params.sourceCardInstanceId,
    owner: "runner.credit_bank",
    install: {
      availability: "available_by_spec",
      projection: installProjection,
      creditCost: installCost,
      actionCost: installActionCost,
      remainingActions,
      installChoices,
    },
    build: {
      availability: "available_by_spec",
      projection: buildProjection,
      resolution: "requires_engine_quote",
      capabilityKey: build.identity.capabilityKey,
      canonicalCapabilityId: build.identity.canonicalCapabilityId,
      actionCost,
      hostedCreditsAdded,
      sharedLimit: {
        kind: "once_per_turn_per_source",
        scope: "any_ability_on_source",
      },
      futureInvocation,
    },
    cashOut: {
      availability: "available_by_spec",
      projection:
        cashOut.initialConditionEvaluation.state === "condition_unsatisfied"
          ? "blocked"
          : "unknown",
      resolution: "requires_engine_quote",
      capabilityKey: cashOut.identity.capabilityKey,
      canonicalCapabilityId: cashOut.identity.canonicalCapabilityId,
    },
    evidenceCodes: [
      "runner_credit_bank_prospective_card_spec",
      `runner_credit_bank_prospective_build:${build.identity.capabilityKey}`,
      buildProjection === "feasible_in_projection"
        ? "runner_credit_bank_same_turn_build_feasible"
        : "runner_credit_bank_build_requires_later_rematerialization",
    ],
  };
}

export function rematerializedRunnerCreditBankBuildCandidate(
  plan: RunnerCreditBankProspectivePlan,
  candidates: readonly ActionSemanticCandidate[],
): ActionSemanticCandidate | undefined {
  const matches = candidates.filter(
    (candidate) =>
      candidate.sourceDefinitionId === plan.sourceDefinitionId &&
      candidate.sourceCardInstanceId === plan.sourceCardInstanceId &&
      candidate.abilityId === plan.build.canonicalCapabilityId &&
      candidate.abilityBindingMethod === "canonical_capability_id" &&
      candidate.planOwnerBinding?.owner === plan.owner &&
      candidate.planOwnerBinding.route === "build",
  );
  return matches.length === 1 ? matches[0] : undefined;
}

type PlanningCard = NonNullable<ReturnType<typeof planningCardByDefinitionId>>;
type ProspectiveCapability =
  PlanningCard["prospectiveCapabilities"]["capabilities"][number];

function descriptorArray(
  capability: ProspectiveCapability,
  suffix: string,
): Record<string, unknown>[] {
  const value = capability.descriptors.find((descriptor) =>
    descriptor.path.endsWith(suffix),
  )?.value;
  if (!Array.isArray(value)) return [];
  return value.filter(isObject);
}

function descriptorObject(
  capability: ProspectiveCapability,
  suffix: string,
): Record<string, unknown> | undefined {
  const value = capability.descriptors.find((descriptor) =>
    descriptor.path.endsWith(suffix),
  )?.value;
  return isObject(value) ? value : undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringField(
  value: Record<string, unknown> | undefined,
  field: string,
): string | undefined {
  const candidate = value?.[field];
  return typeof candidate === "string" ? candidate : undefined;
}

function numberField(
  value: Record<string, unknown> | undefined,
  field: string,
): number | undefined {
  const candidate = value?.[field];
  return typeof candidate === "number" && Number.isFinite(candidate)
    ? candidate
    : undefined;
}
