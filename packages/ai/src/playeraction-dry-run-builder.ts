import type { PlayerAction } from "@netgrid/shared";
import type { CandidatePathBinding } from "./candidate-path-binding";
import type { CandidateTargetIdentityResolution } from "./target-identity-resolver";

export type PlayerActionDryRunBuildStatus = "built" | "blocked";

export type PlayerActionDryRunBuildResult = {
  schemaVersion: "playeraction-dry-run-builder-v1";
  status: PlayerActionDryRunBuildStatus;
  playerAction?: PlayerAction;
  blockers: string[];
  evidence: string[];
};

export type PlayerActionDryRunBuildInput = {
  binding: CandidatePathBinding;
  targetIdentity: CandidateTargetIdentityResolution;
  matchId?: string;
  legalActionIds?: readonly string[];
};

export function buildPlayerActionFromCandidateBinding(
  input: PlayerActionDryRunBuildInput,
): PlayerActionDryRunBuildResult {
  const blockers = dryRunBlockers(input);
  if (blockers.length > 0) {
    return {
      schemaVersion: "playeraction-dry-run-builder-v1",
      status: "blocked",
      blockers,
      evidence: dryRunEvidence(input),
    };
  }

  const actionId = input.binding.actionId;
  if (!actionId) {
    throw new Error("dryRunBlockers must reject missing actionId before build");
  }
  const playerAction: PlayerAction = {
    matchId: input.matchId ?? "candidate-dry-run",
    side: input.binding.side,
    actionId,
    clientKnownStateVersion: input.binding.stateVersion,
    idempotencyKey: `candidate-dry-run:${input.binding.bindingKey}`,
    ...targetPayload(input.targetIdentity),
  };
  return {
    schemaVersion: "playeraction-dry-run-builder-v1",
    status: "built",
    playerAction,
    blockers: [],
    evidence: [...dryRunEvidence(input), "playeraction_structurally_built"],
  };
}

function dryRunBlockers(input: PlayerActionDryRunBuildInput): string[] {
  const blockers = new Set<string>();
  if (input.binding.proofStatus !== "bound") {
    for (const blocker of input.binding.blockers) blockers.add(`binding:${blocker}`);
  }
  if (!input.binding.actionId) blockers.add("action_id_redacted");
  if (
    input.binding.actionId &&
    input.legalActionIds !== undefined &&
    !input.legalActionIds.includes(input.binding.actionId)
  ) {
    blockers.add("action_not_in_legal_actions");
  }
  if (
    input.targetIdentity.status !== "complete" &&
    input.targetIdentity.status !== "irrelevant"
  ) {
    blockers.add(input.targetIdentity.blocker ?? "target_identity_not_complete");
  }
  if (!actionFamilySupported(input.binding.actionType, input.targetIdentity)) {
    blockers.add("unsupported_action_family_for_dry_run_builder");
  }
  return [...blockers].sort();
}

function actionFamilySupported(
  actionType: string,
  targetIdentity: CandidateTargetIdentityResolution,
): boolean {
  if (targetIdentity.kind === "none") return noTargetActions.has(actionType);
  if (targetIdentity.kind === "server") return actionType === "start_run";
  if (targetIdentity.kind === "choice") return actionType === "resolve_choice";
  if (targetIdentity.kind === "installedOwnCard") {
    return installedOwnCardActions.has(actionType);
  }
  return false;
}

function targetPayload(
  targetIdentity: CandidateTargetIdentityResolution,
): Pick<PlayerAction, "selectedTargets" | "selectedChoices"> {
  if (targetIdentity.kind === "server") {
    return { selectedTargets: { serverId: targetIdentity.identity.replace(/^server:/, "") } };
  }
  if (targetIdentity.kind === "choice") {
    const [, choiceId, optionId] = targetIdentity.identity.split(":");
    return { selectedChoices: { [choiceId ?? "choice"]: optionId ?? "option" } };
  }
  if (targetIdentity.kind === "installedOwnCard") {
    return { selectedTargets: { targetIdentity: targetIdentity.identity } };
  }
  return {};
}

function dryRunEvidence(input: PlayerActionDryRunBuildInput): string[] {
  return [
    `binding:${input.binding.bindingKey}`,
    `stateVersion:${input.binding.stateVersion}`,
    `side:${input.binding.side}`,
    `targetIdentity:${input.targetIdentity.identity}`,
    `costClass:${input.binding.costClass}`,
    `timingClass:${input.binding.timingClass}`,
  ];
}

const noTargetActions = new Set([
  "gain_credit",
  "draw_card",
  "end_turn",
  "continue_run",
  "jack_out",
  "steal_agenda",
  "trash_accessed_card",
  "finish_access",
]);

const installedOwnCardActions = new Set([
  "install_card",
  "advance_card",
  "rez_ice",
  "rez_card",
  "score_agenda",
]);
