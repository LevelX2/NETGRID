import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../ai-hints";
import type { CorpStrategicIntentProfile } from "../corp-strategic-intent";
import type { CorpAmbushSignal } from "../plans/corp-tactical-plan-modules";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import type { ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";

export const CORP_AMBUSH_COMMITMENT_VERSION =
  "corp_ambush_commitment_v1" as const;

export function buildCorpAmbushPlanSignals(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  previous: ResidentPlanPortfolio | undefined;
}): CorpAmbushSignal[] {
  const continued = continuedAmbushSignals(params);
  const continuedSourceIds = new Set(
    continued.map((signal) => signal.sourceInstanceId),
  );
  const installCandidates = params.candidates.filter(
    (candidate) =>
      corpCandidateIsAmbushInstall(candidate) &&
      candidate.sourceCardInstanceId !== undefined &&
      !continuedSourceIds.has(candidate.sourceCardInstanceId),
  );
  if (installCandidates.length === 0) return continued;

  const strategicIntent = (
    params.input as AiDecisionInputWithDeckCapabilities
  ).ownCorpStrategicIntent;
  if (!strategicIntent || !corpIntentSupportsAmbush(strategicIntent)) {
    return continued;
  }

  const grouped = new Map<string, ActionSemanticCandidate[]>();
  for (const candidate of installCandidates) {
    const sourceId = candidate.sourceCardInstanceId!;
    const current = grouped.get(sourceId) ?? [];
    current.push(candidate);
    grouped.set(sourceId, current);
  }

  const planned = [...grouped.entries()].flatMap(
    ([sourceInstanceId, sourceCandidates]): CorpAmbushSignal[] => {
      const source = visibleGripCard(params.input, sourceInstanceId);
      if (!source?.definitionId || source.known !== true) return [];
      if (
        params.input.playerView.servers.some(
          (server) =>
            server.id.startsWith("remote_") &&
            server.root.some(
              (card) => card.definitionId === source.definitionId,
            ),
        )
      ) {
        return [];
      }
      if (!ambushVisibleConditionsSatisfied(params.input, source.definitionId))
        return [];

      const ranked = sourceCandidates
        .flatMap((candidate) => {
          const serverId = candidateTargetIds(candidate).find(
            isAmbushRemoteInstallServer,
          );
          if (!serverId) return [];
          const legalAction = params.input.legalActions.find(
            (action) => action.actionId === candidate.actionId,
          );
          if (!legalAction) {
            throw ambushContractFailure(
              params.input,
              [candidate.actionId],
              "Every planned ambush install must bind its current exact LegalAction.",
            );
          }
          const creditCost = candidate.costProfile.creditCost ?? 0;
          if (!Number.isFinite(creditCost)) {
            throw ambushContractFailure(
              params.input,
              [candidate.actionId],
              "Every planned ambush install must project a finite credit cost.",
            );
          }
          if (
            creditCost > params.input.playerView.own.credits ||
            ambushInstallBlockedByFundingIntent(params.input, creditCost)
          ) {
            return [];
          }
          const server = params.input.playerView.servers.find(
            (entry) => entry.id === serverId,
          );
          if (serverId !== "new_remote" && (!server || server.root.length > 0))
            return [];
          return [
            {
              candidate,
              serverId,
              serverValue:
                serverId === "new_remote"
                  ? 80
                  : 100 + Math.min(4, server?.ice.length ?? 0) * 25,
            },
          ];
        })
        .sort(
          (left, right) =>
            right.serverValue - left.serverValue ||
            left.serverId.localeCompare(right.serverId) ||
            left.candidate.actionId.localeCompare(right.candidate.actionId),
        );
      const selected = ranked[0];
      if (!selected) return [];
      const advancementTarget = ambushAdvancementTarget(
        source.definitionId,
      );
      return [
        {
          commitmentVersion: CORP_AMBUSH_COMMITMENT_VERSION,
          ambushId: `ambush:${sourceInstanceId}`,
          sourceDefinitionId: source.definitionId,
          sourceInstanceId,
          actionIds: [selected.candidate.actionId],
          serverId: selected.serverId,
          phase: "install",
          purposeCode: `establish_ambush:${source.definitionId}:${selected.serverId}`,
          assignedDomainPlanIds: ["corp.ambush_bluff"],
          duplicateAlreadyInstalled: false,
          affordableOrSupportable: true,
          plannedAtStateVersion: params.input.playerView.stateVersion,
          plannedAdvancementTarget: advancementTarget,
          value: 100 + selected.serverValue,
          evidenceCode: `corp_ambush_preplanned_exact_install:${source.definitionId}:${selected.serverId}`,
        },
      ];
    },
  );

  return [...continued, ...planned];
}

export function corpCandidateIsAmbushInstall(
  candidate: ActionSemanticCandidate,
): boolean {
  if (
    candidate.semanticActionType !== "install.card" ||
    !candidate.sourceDefinitionId ||
    !candidate.sourceCardInstanceId
  ) {
    return false;
  }
  const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
  const strategyBound =
    hint?.strategyAnchors?.includes("corp.ambush_bluff") === true ||
    hint?.lineSupport?.includes("corp.ambush_bluff") === true ||
    candidate.strategySupport.some(
      (support) => support.strategyId === "corp.ambush_bluff",
    );
  const accessEffect =
    hint?.conditions?.some(
      (condition) => condition.kind === "requires_accessed_card",
    ) === true &&
    hint?.effects?.some(
      (effect) =>
        effect.timing === "on_access" &&
        [
          "ambush",
          "access_punish",
          "damage",
          "hardware_trash",
          "program_trash",
        ].includes(effect.kind),
    ) === true;
  return strategyBound && accessEffect;
}

export function corpAmbushAdvanceDispositionEvidence(
  candidate: ActionSemanticCandidate,
  signals: readonly CorpAmbushSignal[],
): string | undefined {
  if (candidate.semanticActionType !== "score.advance_card") return undefined;
  const signal = signals.find(
    (current) =>
      current.sourceInstanceId === candidate.sourceCardInstanceId ||
      candidateTargetIds(candidate).includes(current.sourceInstanceId),
  );
  if (!signal || signal.actionIds.includes(candidate.actionId)) return undefined;
  if (signal.phase !== "trigger") return undefined;
  return [
    "corp_ambush_advance_target_already_reached",
    signal.sourceInstanceId,
    Math.max(0, Math.floor(signal.plannedAdvancementTarget)),
  ].join(":");
}

function continuedAmbushSignals(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  previous: ResidentPlanPortfolio | undefined;
}): CorpAmbushSignal[] {
  if (!params.previous) return [];
  return params.previous.instances.flatMap((instance): CorpAmbushSignal[] => {
    if (instance.moduleId !== "corp.ambush_and_bluff") return [];
    const signal = (
      instance.moduleState as {
        kind?: string;
        signal?: Partial<CorpAmbushSignal>;
      }
    ).signal;
    if (!signal || signal.commitmentVersion !== CORP_AMBUSH_COMMITMENT_VERSION)
      return [];
    if (
      !signal.sourceInstanceId ||
      !signal.sourceDefinitionId ||
      !Number.isFinite(signal.plannedAdvancementTarget) ||
      !Number.isFinite(signal.plannedAtStateVersion)
    ) {
      throw ambushContractFailure(
        params.input,
        [],
        `Resident ambush plan ${instance.instanceId} has an incomplete sequence commitment.`,
      );
    }
    const sourceInstanceId = signal.sourceInstanceId;
    const plannedAdvancementTarget = signal.plannedAdvancementTarget!;
    const location = installedCardLocation(
      params.input,
      sourceInstanceId,
    );
    if (!location) return [];
    if (location.serverId === "archives") return [];
    if (
      signal.serverId !== "new_remote" &&
      signal.serverId !== location.serverId
    ) {
      throw ambushContractFailure(
        params.input,
        [],
        `Resident ambush ${signal.sourceInstanceId} moved away from its committed server ${signal.serverId}.`,
      );
    }

    const triggerCandidates = params.candidates.filter(
      (candidate) =>
        candidate.sourceCardInstanceId === sourceInstanceId &&
        candidate.semanticActionType === "card_ability.trigger",
    );
    if (triggerCandidates.length > 1) {
      throw ambushContractFailure(
        params.input,
        triggerCandidates.map((candidate) => candidate.actionId),
        `Resident ambush ${sourceInstanceId} has ambiguous trigger actions; bind the exact on-access ability semantics.`,
      );
    }
    const currentCounters = Math.max(
      0,
      location.card.advancementCounters ?? 0,
    );
    const advancementTarget = Math.max(
      0,
      Math.floor(plannedAdvancementTarget),
    );
    const advanceCandidates = params.candidates.filter(
      (candidate) =>
        candidate.semanticActionType === "score.advance_card" &&
        (candidate.sourceCardInstanceId === sourceInstanceId ||
          candidateTargetIds(candidate).includes(sourceInstanceId)),
    );
    if (advanceCandidates.length > 1) {
      throw ambushContractFailure(
        params.input,
        advanceCandidates.map((candidate) => candidate.actionId),
        `Resident ambush ${sourceInstanceId} has ambiguous advancement actions.`,
      );
    }
    const selected =
      triggerCandidates[0] ??
      (currentCounters < advancementTarget ? advanceCandidates[0] : undefined);
    const phase =
      triggerCandidates.length > 0
        ? ("trigger" as const)
        : currentCounters < advancementTarget
          ? ("advance" as const)
          : ("trigger" as const);
    return [
      {
        ...(signal as CorpAmbushSignal),
        serverId: location.serverId,
        phase,
        actionIds: selected ? [selected.actionId] : [],
        purposeCode:
          phase === "advance"
            ? `advance_committed_ambush_to:${advancementTarget}`
            : "wait_for_or_convert_committed_ambush_access",
        duplicateAlreadyInstalled: false,
        affordableOrSupportable: selected !== undefined || phase === "trigger",
        value:
          phase === "trigger" && selected
            ? 800
            : phase === "advance"
              ? 300
              : 0,
        evidenceCode: selected
          ? `corp_ambush_sequence_exact_${phase}:${signal.sourceInstanceId}`
          : `corp_ambush_sequence_waiting_for_access:${signal.sourceInstanceId}`,
      },
    ];
  });
}

function corpIntentSupportsAmbush(intent: CorpStrategicIntentProfile): boolean {
  return (
    intent.side === "corp" &&
    intent.punishPlan.includes("corp.ambush_bluff") &&
    !intent.rejectedIntents.includes("corp.ambush_bluff_blocked") &&
    intent.confidence !== "low"
  );
}

function ambushVisibleConditionsSatisfied(
  input: AiDecisionInput,
  definitionId: string,
): boolean {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  if (!hint) return false;
  if (
    hint.conditions?.some(
      (condition) => condition.kind === "requires_runner_tagged",
    ) &&
    input.playerView.opponent.tags <= 0
  ) {
    return false;
  }
  if (
    hint.effects?.some(
      (effect) =>
        effect.kind === "program_trash" &&
        effect.scope === "runner" &&
        effect.timing === "on_access",
    ) &&
    !(input.playerView.opponent.rig ?? []).some(
      (card) => card.known && card.type === "program",
    )
  ) {
    return false;
  }
  return true;
}

function ambushAdvancementTarget(definitionId: string): number {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  return hint?.conditions?.some(
    (condition) => condition.kind === "requires_advancement_counter",
  )
    ? 1
    : 0;
}

function ambushInstallBlockedByFundingIntent(
  input: AiDecisionInput,
  creditCost: number,
): boolean {
  const intent = (input as AiDecisionInputWithDeckCapabilities)
    .ownStrategicIntentState;
  return (
    creditCost > 0 &&
    intent?.side === "corp" &&
    intent.phase === "fund" &&
    intent.reserve.kind === "credits" &&
    intent.reserve.satisfied === false
  );
}

function visibleGripCard(
  input: AiDecisionInput,
  instanceId: string,
): VisibleCard | undefined {
  return input.playerView.own.gripOrHq.find(
    (card) => card.instanceId === instanceId,
  );
}

function installedCardLocation(
  input: AiDecisionInput,
  instanceId: string,
): { card: VisibleCard; serverId: string } | undefined {
  for (const server of input.playerView.servers) {
    const card = server.root.find((entry) => entry.instanceId === instanceId);
    if (card) return { card, serverId: server.id };
  }
  return undefined;
}

function candidateTargetIds(candidate: ActionSemanticCandidate): string[] {
  const selected =
    candidate.targetContext?.selectedTargets.map((target) => target.targetId) ??
    [];
  return [
    ...(selected.length > 0
      ? selected
      : (candidate.targetContext?.availableTargets?.map(
          (target) => target.targetId,
        ) ?? [])),
    ...(candidate.runProjectionSummary?.serverId
      ? [candidate.runProjectionSummary.serverId]
      : []),
  ];
}

function isAmbushRemoteInstallServer(value: string): boolean {
  return value === "new_remote" || value.startsWith("remote_");
}

function ambushContractFailure(
  input: AiDecisionInput,
  unresolvedActionIds: string[],
  removalCondition: string,
): PlanResolutionFailure {
  return new PlanResolutionFailure("missing_plan_module_coverage", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((action) => action.type),
    unresolvedActionIds,
    owner: "plan_module",
    removalCondition,
  });
}
