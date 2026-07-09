import type { LegalAction } from "@netgrid/shared";
import type {
  ActionRunAccessDecisionModel,
  ActionSemanticCandidate,
  RunAccessModifierKind,
  RunAccessPayoffKind,
  RunAccessRiskKind,
} from "../action-semantic-candidate";

const RUN_ACCESS_ACTION_TYPES = new Set<LegalAction["type"]>([
  "start_run",
  "continue_run",
  "jack_out",
  "access_card",
  "steal_agenda",
  "trash_accessed_card",
  "decline_trash",
]);

export function applyRunAccessDecisionModel(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionSemanticCandidate {
  const model = projectRunAccessDecisionModel(candidate, action);
  return model ? { ...candidate, runAccessDecisionModel: model } : candidate;
}

export function projectRunAccessDecisionModel(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionRunAccessDecisionModel | undefined {
  const signals = semanticSignals(candidate);
  const modifiers = runModifiers(action, signals);
  const accessRisks = accessRiskKinds(signals);
  const payoffs = accessPayoffKinds(signals);
  const relevant =
    RUN_ACCESS_ACTION_TYPES.has(action.type) ||
    modifiers.length > 0 ||
    accessRisks.length > 0 ||
    payoffs.length > 0;
  if (!relevant) return undefined;

  const serverId =
    candidate.runProjectionSummary?.serverId ??
    stringPayload(action, "serverId") ??
    stringPayload(action, "targetServerId");
  const hiddenInfoBlocked =
    candidate.targetContext?.hiddenInfoPolicy === "hidden_info_blocked" ||
    candidate.hardGates.some(
      (gate) => gate.gateId === "hidden_info" && gate.status === "block",
    );
  const missingRunTarget = action.type === "start_run" && !serverId;
  const coverageStatus = hiddenInfoBlocked
    ? "blocked"
    : missingRunTarget
      ? "partial"
      : "covered";
  const whyNot = [
    ...(hiddenInfoBlocked ? ["hidden_info_blocked"] : []),
    ...(missingRunTarget ? ["run_target_unavailable"] : []),
  ];

  return {
    schemaVersion: "run-access-decision-model-v1",
    coverageStatus,
    ...(serverId ? { serverId } : {}),
    modifiers,
    accessRisks,
    payoffs,
    unknownRemoteIdentityPreserved: true,
    hiddenInfoPolicy: "side_safe_visible_only",
    whyNot,
    evidence: [
      `run_access_model_action_type:${action.type}`,
      `run_access_model_coverage:${coverageStatus}`,
      ...(serverId ? [`run_access_model_server:${serverId}`] : []),
      ...modifiers.map((kind) => `run_access_modifier:${kind}`),
      ...accessRisks.map((kind) => `run_access_risk:${kind}`),
      ...payoffs.map((kind) => `run_access_payoff:${kind}`),
      "run_access_unknown_remote_identity_preserved:true",
    ],
  };
}

function runModifiers(
  action: LegalAction,
  signals: ReadonlySet<string>,
): RunAccessModifierKind[] {
  const modifiers: RunAccessModifierKind[] = [];
  if (action.payload?.bypassFirstIce === true || hasTerm(signals, "bypass")) {
    modifiers.push("bypass_ice");
  }
  if (hasTerms(signals, "additional", "subroutine")) {
    modifiers.push("additional_subroutines");
  }
  if (hasTerm(signals, "redirect")) modifiers.push("redirect_run");
  if (
    hasTerm(signals, "replacement") ||
    hasTerms(signals, "access", "override")
  ) {
    modifiers.push("access_replacement");
  }
  if (hasTerm(signals, "post_run") || hasTerm(signals, "successful_run")) {
    modifiers.push("post_run_followup");
  }
  if (hasTerm(signals, "run_end") || hasTerm(signals, "end_run")) {
    modifiers.push("forced_run_end");
  }
  return unique(modifiers);
}

function accessRiskKinds(signals: ReadonlySet<string>): RunAccessRiskKind[] {
  const risks: RunAccessRiskKind[] = [];
  if (hasTerm(signals, "ambush")) risks.push("ambush");
  if (
    hasTerm(signals, "access") &&
    (["damage", "net_damage", "meat_damage", "brain_damage"] as const).some(
      (term) => hasTerm(signals, term),
    )
  ) {
    risks.push("damage");
  }
  if (hasTerm(signals, "access") && hasTerm(signals, "tag")) {
    risks.push("tag");
  }
  if (
    hasTerm(signals, "access") &&
    hasTerm(signals, "program") &&
    (["trash", "disruption", "bounce"] as const).some((term) =>
      hasTerm(signals, term),
    )
  ) {
    risks.push("program_disruption");
  }
  if (hasTerms(signals, "steal", "tax")) risks.push("steal_tax");
  if (hasTerms(signals, "access", "reduction")) risks.push("access_reduction");
  return unique(risks);
}

function accessPayoffKinds(
  signals: ReadonlySet<string>,
): RunAccessPayoffKind[] {
  const payoffs: RunAccessPayoffKind[] = [];
  if (
    hasTerm(signals, "multiaccess") ||
    hasTerms(signals, "additional", "access")
  ) {
    payoffs.push("additional_access");
  }
  if (hasTerms(signals, "free", "trash")) payoffs.push("free_trash");
  if (hasTerms(signals, "ice", "trash")) payoffs.push("ice_trash");
  if (hasTerm(signals, "expose") || hasTerm(signals, "reveal")) {
    payoffs.push("information");
  }
  return unique(payoffs);
}

function semanticSignals(
  candidate: ActionSemanticCandidate,
): ReadonlySet<string> {
  return new Set(
    [
      ...candidate.cardContextSignals,
      ...candidate.actionTacticSignals,
      ...candidate.conditions.map((condition) => condition.kind),
      ...candidate.risks.map((risk) => risk.kind),
      ...candidate.constraints.map((constraint) => constraint.kind),
    ].map((signal) => signal.toLowerCase()),
  );
}

function hasTerm(signals: ReadonlySet<string>, term: string): boolean {
  return [...signals].some((signal) => semanticTerms(signal).has(term));
}

function hasTerms(signals: ReadonlySet<string>, ...terms: string[]): boolean {
  return [...signals].some((signal) => {
    const tokens = semanticTerms(signal);
    return terms.every((term) => tokens.has(term));
  });
}

function semanticTerms(value: string): Set<string> {
  const segments = value
    .toLowerCase()
    .split(/[.:-]+/)
    .filter(Boolean);
  const terms = segments.flatMap((segment) =>
    segment.split("_").filter(Boolean),
  );
  return new Set([
    ...segments,
    ...terms,
    ...terms.flatMap((term, index) =>
      index + 1 < terms.length ? [`${term}_${terms[index + 1]}`] : [],
    ),
  ]);
}

function stringPayload(action: LegalAction, key: string): string | undefined {
  const value = action.payload?.[key];
  return typeof value === "string" ? value : undefined;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
