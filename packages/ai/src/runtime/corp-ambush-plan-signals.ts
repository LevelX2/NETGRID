import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../ai-hints";
import type { CorpStrategicIntentProfile } from "../corp-strategic-intent";
import type { CorpAmbushSignal } from "../plans/corp-tactical-plan-modules";
import { readCorpCounterBankPreparationQuote } from "../plans/corp-counter-bank-score-plan";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import type { ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { assessBestFundedCorpScoreProtection } from "./corp-funded-score-protection";

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
  const strategicIntent = (params.input as AiDecisionInputWithDeckCapabilities)
    .ownCorpStrategicIntent;
  if (!strategicIntent || !corpIntentSupportsAmbush(strategicIntent)) {
    return continued;
  }
  const plannedDecoys = scoreDecoySignals({
    ...params,
    continuedSourceIds,
  });
  const planned = params.input.playerView.own.gripOrHq.flatMap(
    (source): CorpAmbushSignal[] => {
      if (
        continuedSourceIds.has(source.instanceId) ||
        source.known !== true ||
        !source.definitionId ||
        !definitionSupportsAmbushPlan(source.definitionId)
      ) {
        return [];
      }
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
      return [
        visibleGripAmbushSignal(
          params.input,
          params.candidates,
          source,
          undefined,
        ),
      ];
    },
  );

  return [...continued, ...plannedDecoys, ...planned];
}

function scoreDecoySignals(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  continuedSourceIds: ReadonlySet<string>;
}): CorpAmbushSignal[] {
  if (params.input.playerView.own.clicks < 2) return [];
  const followupAgenda = params.input.playerView.own.gripOrHq
    .filter(
      (card) =>
        card.known === true &&
        card.type === "agenda" &&
        card.definitionId !== undefined,
    )
    .sort(
      (left, right) =>
        (left.advancementRequirement ?? Number.MAX_SAFE_INTEGER) -
          (right.advancementRequirement ?? Number.MAX_SAFE_INTEGER) ||
        (right.agendaPoints ?? 0) - (left.agendaPoints ?? 0) ||
        left.instanceId.localeCompare(right.instanceId),
    )[0];
  if (!followupAgenda) return [];

  return params.input.playerView.own.gripOrHq.flatMap(
    (source): CorpAmbushSignal[] => {
      if (
        params.continuedSourceIds.has(source.instanceId) ||
        source.known !== true ||
        !source.definitionId ||
        !readCorpCounterBankPreparationQuote(params.input, source, "corp_hq")
      ) {
        return [];
      }
      const routes = params.candidates
        .filter(
          (candidate) =>
            candidate.semanticActionType === "install.card" &&
            candidate.sourceCardInstanceId === source.instanceId,
        )
        .flatMap((candidate) => {
          const serverId = candidateTargetIds(candidate).find((target) =>
            target.startsWith("remote_"),
          );
          const server = params.input.playerView.servers.find(
            (entry) => entry.id === serverId,
          );
          const action = params.input.legalActions.find(
            (legalAction) =>
              legalAction.actionId === candidate.actionId &&
              legalAction.side === "corp" &&
              legalAction.type === "install_card" &&
              legalAction.payload?.placement === "root" &&
              legalAction.payload.serverId === serverId,
          );
          const creditCost = action
            ? exactLegalActionCreditCost(action)
            : undefined;
          if (
            !serverId ||
            !server ||
            server.root.length > 0 ||
            server.ice.length === 0 ||
            creditCost === undefined ||
            creditCost > params.input.playerView.own.credits - 1
          ) {
            return [];
          }
          const protection = assessBestFundedCorpScoreProtection({
            serverIce: server.ice,
            runnerRig: params.input.playerView.opponent.rig ?? [],
            runnerSetAside:
              params.input.playerView.specialZones?.setAside ?? [],
            ...(params.input.playerView.opponent.memoryUsed !== undefined
              ? {
                  runnerMemoryUsed: params.input.playerView.opponent.memoryUsed,
                }
              : {}),
            ...(params.input.playerView.opponent.memoryLimit !== undefined
              ? {
                  runnerMemoryLimit:
                    params.input.playerView.opponent.memoryLimit,
                }
              : {}),
            runnerCredits: params.input.playerView.opponent.credits,
            targetServerId: server.id,
            observedAtStateVersion: params.input.playerView.stateVersion,
            availableCorpCredits: params.input.playerView.own.credits,
            availableCorpClicks: params.input.playerView.own.clicks,
            scoreReserve: { creditBreakdown: [], hardClickReserve: 0 },
            maximumRunnerAccessSuccessProbability: {
              numerator: 1,
              denominator: 2,
            },
          });
          if (
            protection.knowledge !== "known" ||
            protection.protection.runnerAccessSuccessProbability.numerator === 0
          ) {
            return [];
          }
          return [
            {
              candidate,
              serverId,
              creditCost,
              value:
                140 +
                Math.min(3, server.ice.length) * 10 +
                Math.min(
                  20,
                  protection.protection.runnerCreditsRemainingOnBestAccessPath,
                ),
            },
          ];
        })
        .sort(
          (left, right) =>
            right.value - left.value ||
            left.serverId.localeCompare(right.serverId) ||
            left.candidate.actionId.localeCompare(right.candidate.actionId),
        );
      const selected = routes[0];
      if (!selected) return [];
      return [
        {
          commitmentVersion: CORP_AMBUSH_COMMITMENT_VERSION,
          ambushId: `score-decoy:${source.instanceId}:${selected.serverId}:${followupAgenda.instanceId}`,
          sourceDefinitionId: source.definitionId,
          sourceInstanceId: source.instanceId,
          actionIds: [selected.candidate.actionId],
          serverId: selected.serverId,
          phase: "install",
          patternKind: "score_decoy",
          followupAgendaInstanceId: followupAgenda.instanceId,
          runnerCreditsAtPlanStart: params.input.playerView.opponent.credits,
          purposeCode: `establish_score_decoy_then_reassess_followup:${followupAgenda.instanceId}:${selected.serverId}`,
          assignedDomainPlanIds: ["corp.ambush_bluff"],
          duplicateAlreadyInstalled: false,
          affordableOrSupportable: true,
          plannedAtStateVersion: params.input.playerView.stateVersion,
          plannedAdvancementTarget: 1,
          value: selected.value,
          evidenceCode: `corp_score_decoy_preplanned_exact_install:${source.instanceId}:${selected.serverId}:${followupAgenda.instanceId}`,
          installRoute: {
            actionId: selected.candidate.actionId,
            creditCost: selected.creditCost,
            fundingGap: 0,
            costSource: "legal_action",
          },
        },
      ];
    },
  );
}

function visibleGripAmbushSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  source: VisibleCard,
  previous: CorpAmbushSignal | undefined,
): CorpAmbushSignal {
  const ranked = candidates
    .filter(
      (candidate) =>
        corpCandidateIsAmbushInstall(candidate) &&
        candidate.sourceCardInstanceId === source.instanceId,
    )
    .flatMap((candidate) => {
      const serverId = candidateTargetIds(candidate).find(
        isAmbushRemoteInstallServer,
      );
      if (!serverId) return [];
      const legalAction = input.legalActions.find(
        (action) =>
          action.actionId === candidate.actionId &&
          action.side === "corp" &&
          action.type === "install_card",
      );
      const creditCost = legalAction
        ? exactLegalActionCreditCost(legalAction)
        : undefined;
      if (creditCost === undefined) return [];
      const server = input.playerView.servers.find(
        (entry) => entry.id === serverId,
      );
      if (serverId !== "new_remote" && (!server || server.root.length > 0))
        return [];
      return [
        {
          candidate,
          creditCost,
          serverId,
          serverValue:
            (serverId === previous?.serverId ? 20 : 0) +
            (serverId === "new_remote"
              ? 80
              : 100 + Math.min(4, server?.ice.length ?? 0) * 25),
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
  const serverId = selected?.serverId ?? previous?.serverId ?? "new_remote";
  const plannedAtStateVersion =
    previous?.plannedAtStateVersion ?? input.playerView.stateVersion;
  const plannedAdvancementTarget =
    previous?.plannedAdvancementTarget ??
    ambushAdvancementTarget(source.definitionId!);
  const fundingGap = selected
    ? Math.max(0, selected.creditCost - input.playerView.own.credits)
    : undefined;
  return {
    commitmentVersion: CORP_AMBUSH_COMMITMENT_VERSION,
    ambushId: `ambush:${source.instanceId}`,
    sourceDefinitionId: source.definitionId!,
    sourceInstanceId: source.instanceId,
    actionIds: selected ? [selected.candidate.actionId] : [],
    serverId,
    phase: "install",
    purposeCode: `establish_ambush:${source.definitionId}:${serverId}`,
    assignedDomainPlanIds: ["corp.ambush_bluff"],
    duplicateAlreadyInstalled: false,
    affordableOrSupportable: true,
    plannedAtStateVersion,
    plannedAdvancementTarget,
    value: selected ? 100 + selected.serverValue : 100,
    evidenceCode: selected
      ? `corp_ambush_preplanned_exact_install:${source.definitionId}:${serverId}`
      : `corp_ambush_visible_root_route_unknown:${source.definitionId}:${serverId}`,
    ...(selected && fundingGap !== undefined
      ? {
          installRoute: {
            actionId: selected.candidate.actionId,
            creditCost: selected.creditCost,
            fundingGap,
            costSource: "legal_action" as const,
          },
        }
      : {}),
  };
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
  if (!signal || signal.actionIds.includes(candidate.actionId))
    return undefined;
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
    const moduleState = instance.moduleState as {
      kind?: string;
      signal?: Partial<CorpAmbushSignal>;
    };
    if (moduleState.kind !== "ambush") return [];
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
    const visibleGripSource = visibleGripCard(params.input, sourceInstanceId);
    if (visibleGripSource) {
      if (
        visibleGripSource.known !== true ||
        visibleGripSource.definitionId !== signal.sourceDefinitionId
      ) {
        return [];
      }
      return [
        visibleGripAmbushSignal(
          params.input,
          params.candidates,
          visibleGripSource,
          signal as CorpAmbushSignal,
        ),
      ];
    }
    const location = installedCardLocation(params.input, sourceInstanceId);
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
    const currentCounters = Math.max(0, location.card.advancementCounters ?? 0);
    const advancementTarget = Math.max(0, Math.floor(plannedAdvancementTarget));
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
          phase === "trigger" && selected ? 800 : phase === "advance" ? 300 : 0,
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

function definitionSupportsAmbushPlan(definitionId: string): boolean {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  return (
    hint?.strategyAnchors?.includes("corp.ambush_bluff") === true ||
    hint?.lineSupport?.includes("corp.ambush_bluff") === true
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

function visibleGripCard(
  input: AiDecisionInput,
  instanceId: string,
): VisibleCard | undefined {
  return input.playerView.own.gripOrHq.find(
    (card) => card.instanceId === instanceId,
  );
}

function exactLegalActionCreditCost(
  action: AiDecisionInput["legalActions"][number],
): number | undefined {
  let total = 0;
  for (const cost of action.costs) {
    if (cost.credits === undefined) continue;
    if (!Number.isSafeInteger(cost.credits) || cost.credits < 0) {
      return undefined;
    }
    total += cost.credits;
    if (!Number.isSafeInteger(total)) return undefined;
  }
  return total;
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
