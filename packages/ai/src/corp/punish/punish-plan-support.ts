import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import {
  candidateTargets,
  state,
} from "../../plans/corp-tactical-module-support";
import type { PlanInstance } from "../../plans/plan-kernel-types";
import type {
  PlanMaterialization,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import { CorpPunishCampaignSignal, PunishState } from "./punish-types";

export function corpPunishCampaignOwnsCandidate(
  signal: CorpPunishCampaignSignal,
  candidate: ActionSemanticCandidate,
): boolean {
  if (signal.routeContract) {
    return (
      signal.routeContract.quoteStatus === "complete" &&
      signal.routeContract.horizon === "execute" &&
      signal.routeContract.currentHeadActionId === candidate.actionId &&
      signal.feasible &&
      punishCapability(signal).semanticActionTypes.includes(
        candidate.semanticActionType,
      ) &&
      (signal.sourceDefinitionIds.length === 0 ||
        signal.sourceDefinitionIds.includes(candidate.sourceDefinitionId ?? ""))
    );
  }
  if (
    !signal.feasible ||
    (signal.actionIds !== undefined &&
      !signal.actionIds.includes(candidate.actionId)) ||
    !punishCapability(signal).semanticActionTypes.includes(
      candidate.semanticActionType,
    )
  ) {
    return false;
  }
  return (
    signal.sourceDefinitionIds.length === 0 ||
    candidate.semanticActionType === "choice.resolve" ||
    signal.sourceDefinitionIds.includes(candidate.sourceDefinitionId ?? "")
  );
}

export function punishMaterialization(
  instance: PlanInstance,
  context: PlanSchedulerContext,
): PlanMaterialization {
  const current = state<PunishState>(instance);
  const next = current.signal.routeContract
    ? undefined
    : punishNextCapability(current.signal.phase);
  return {
    step: {
      stepId: `${instance.instanceId}:${current.signal.phase}`,
      capability: punishCapability(current.signal),
      purpose: `Execute punish phase ${current.signal.phase}.`,
    },
    candidates: punishCandidates(context, current.signal),
    ...(next
      ? {
          continuation: {
            continuationId: `${instance.instanceId}:branch`,
            trigger: "outcome_observed" as const,
            nextCapability: next,
            target: { kind: "player" as const, id: "runner" },
            purpose:
              "Continue only after observing tag, prevention or damage outcome.",
          },
        }
      : {}),
  };
}

function punishCapability(signal: CorpPunishCampaignSignal) {
  if (signal.routeContract?.currentHeadActionId) {
    return {
      capabilityId: `execute_punish_route:${signal.routeContract.routeId}:${signal.routeContract.currentHeadStepId ?? "head"}`,
      semanticActionTypes: signal.initiatingSemanticActionType
        ? [signal.initiatingSemanticActionType]
        : [],
      ...(signal.sourceDefinitionIds.length > 0
        ? { requiredSourceDefinitionIds: signal.sourceDefinitionIds }
        : {}),
    };
  }
  const phaseSemantic = {
    prepare: ["install.card", "corp_window.rez", "play.corp_operation"],
    watch_window: [],
    assemble_components: [],
    fund: ["economy.gain_credit"],
    trace: ["trace.initiate", "choice.resolve"],
    tag: ["tag.apply", "choice.resolve"],
    damage: ["damage.net", "damage.meat", "choice.resolve"],
    kill: ["damage.net", "damage.meat"],
  }[signal.phase];
  const semantic = [
    ...new Set([
      ...phaseSemantic,
      ...(signal.initiatingSemanticActionType
        ? [signal.initiatingSemanticActionType]
        : []),
    ]),
  ];
  return {
    capabilityId: `punish_${signal.phase}`,
    semanticActionTypes: semantic,
    ...(signal.sourceDefinitionIds.length > 0
      ? { requiredSourceDefinitionIds: signal.sourceDefinitionIds }
      : {}),
  };
}

function punishNextCapability(phase: CorpPunishCampaignSignal["phase"]) {
  if (phase === "trace")
    return {
      capabilityId: "resolve_trace_tag",
      semanticActionTypes: ["tag.apply", "choice.resolve"],
    };
  if (phase === "tag")
    return {
      capabilityId: "convert_tag_damage",
      semanticActionTypes: ["damage.net", "damage.meat"],
    };
  if (phase === "damage")
    return {
      capabilityId: "resolve_damage_outcome",
      semanticActionTypes: ["choice.resolve"],
    };
  return undefined;
}

export function punishCandidates(
  context: PlanSchedulerContext,
  signal: CorpPunishCampaignSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter((candidate) => corpPunishCampaignOwnsCandidate(signal, candidate))
    .map((candidate) => ({
      candidate,
      stepValue:
        signal.value +
        (signal.phase === "prepare"
          ? corpPrepareTargetValue(context, candidate)
          : 0),
    }));
}

function corpPrepareTargetValue(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
): number {
  if (candidate.semanticActionType !== "install.card") return 0;
  const target = candidateTargets(candidate).find(
    (targetId) => targetId === "new_remote" || targetId.startsWith("remote_"),
  );
  if (!target || target === "new_remote") return 0;
  const server = context.input.playerView.servers.find(
    (current) => current.id === target,
  );
  return (server?.ice.length ?? 0) > 0 ? 50 : 10;
}
