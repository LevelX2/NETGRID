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
import { reconstructBeliefState } from "../belief-state";
import { projectKnownCorpCardAccessEffect } from "./known-corp-card-access-effect-projection";

export const CORP_AMBUSH_COMMITMENT_VERSION =
  "corp_ambush_commitment_v1" as const;

const MATERIAL_KNOWN_ACCESS_THREAT_MINIMUM = 60;
const COMPROMISED_AMBUSH_REUSE_VALUE = 120;
const PREPARED_REMOTE_FOLLOWUP_VALUE = 40;
const ADVANCEMENT_INVESTMENT_VALUE_PER_COUNTER = 20;
const RECYCLING_CLICK_COST_VALUE = 40;
const RECYCLING_CREDIT_COST_VALUE = 10;

export function buildCorpAmbushPlanSignals(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  previous: ResidentPlanPortfolio | undefined;
}): CorpAmbushSignal[] {
  const accessProgramBounce = accessProgramBounceChoiceSignal(
    params.input,
    params.candidates,
  );
  const continued = continuedAmbushSignals(params).filter(
    (signal) =>
      signal.sourceInstanceId !== accessProgramBounce?.sourceInstanceId,
  );
  const continuedSourceIds = new Set(
    continued.map((signal) => signal.sourceInstanceId),
  );
  const strategicIntent = (params.input as AiDecisionInputWithDeckCapabilities)
    .ownCorpStrategicIntent;
  if (!strategicIntent || !corpIntentSupportsAmbush(strategicIntent)) {
    return [
      ...(accessProgramBounce ? [accessProgramBounce] : []),
      ...continued,
    ];
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

  return [
    ...(accessProgramBounce ? [accessProgramBounce] : []),
    ...continued,
    ...plannedDecoys,
    ...planned,
  ];
}

function accessProgramBounceChoiceSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpAmbushSignal | undefined {
  const choice = input.playerView.pendingChoice;
  if (
    input.side !== "corp" ||
    choice?.kind !== "select_cards" ||
    !choice.source.startsWith("proteus.return_runner_programs:") ||
    choice.side !== "corp" ||
    choice.stateVersion !== input.playerView.stateVersion ||
    choice.visibility !== "hidden_info_barrier" ||
    choice.minSelections !== 0 ||
    choice.maxSelections <= 0
  ) {
    return undefined;
  }
  const sourceParts = choice.source.split(":");
  const sourceInstanceId = sourceParts[1];
  const effectIndex = Number(sourceParts[2]);
  const accessZone = sourceParts[3];
  const sourceStateVersion = Number(sourceParts[4]);
  if (
    sourceParts.length !== 5 ||
    !sourceInstanceId ||
    !Number.isSafeInteger(effectIndex) ||
    effectIndex < 0 ||
    !accessZone ||
    sourceStateVersion !== input.playerView.stateVersion
  ) {
    return undefined;
  }
  const location = installedCardLocation(input, sourceInstanceId);
  const sourceDefinitionId = location?.card.definitionId;
  if (
    !sourceDefinitionId ||
    location.card.known !== true ||
    location.card.owner !== "corp" ||
    !definitionSupportsProgramBounceAmbush(sourceDefinitionId)
  ) {
    return undefined;
  }
  const resolveCandidates = candidates.filter(
    (candidate) =>
      candidate.semanticActionType === "choice.resolve" &&
      candidate.actionType === "resolve_choice",
  );
  if (resolveCandidates.length !== 1) return undefined;
  const resolveCandidate = resolveCandidates[0]!;
  const resolveAction = input.legalActions.find(
    (action) => action.actionId === resolveCandidate.actionId,
  );
  const requirement = resolveAction?.choiceRequirements?.[0];
  const selectableOptions = choice.options.filter(
    (option) => option.selectable !== false,
  );
  const optionIds = selectableOptions.map((option) => option.id);
  if (
    !resolveAction ||
    resolveAction.side !== "corp" ||
    resolveAction.type !== "resolve_choice" ||
    resolveAction.source !== "game_rule" ||
    resolveAction.timingPoint !== input.playerView.timingPoint ||
    resolveAction.expiresAtStateVersion !== input.playerView.stateVersion ||
    resolveAction.choiceRequirements?.length !== 1 ||
    requirement?.choiceId !== choice.choiceId ||
    requirement.minSelections !== choice.minSelections ||
    requirement.maxSelections !== choice.maxSelections ||
    requirement.optionIds.length !== optionIds.length ||
    !optionIds.every((optionId) => requirement.optionIds.includes(optionId))
  ) {
    return undefined;
  }
  const visiblePrograms = new Map(
    (input.playerView.opponent.rig ?? [])
      .filter(
        (card) =>
          card.known === true &&
          card.owner === "runner" &&
          card.controller === "runner" &&
          card.type === "program",
      )
      .map((card) => [card.instanceId, card] as const),
  );
  const optionBindings = selectableOptions.map((option) => ({
    optionId: option.id,
    cardId: typeof option.value === "string" ? option.value : undefined,
  }));
  if (
    optionBindings.length !== visiblePrograms.size ||
    optionBindings.some(
      (binding) =>
        !binding.cardId ||
        binding.optionId !== `card_${binding.cardId}` ||
        !visiblePrograms.has(binding.cardId),
    )
  ) {
    return undefined;
  }
  const selected = optionBindings
    .map((binding) => ({
      ...binding,
      card: visiblePrograms.get(binding.cardId!)!,
    }))
    .sort(
      (left, right) =>
        programBounceTargetScore(right.card) -
          programBounceTargetScore(left.card) ||
        left.optionId.localeCompare(right.optionId),
    )
    .slice(0, choice.maxSelections);
  return {
    commitmentVersion: CORP_AMBUSH_COMMITMENT_VERSION,
    ambushId: `access-program-bounce:${choice.choiceId}`,
    sourceDefinitionId,
    sourceInstanceId,
    actionIds: [resolveAction.actionId],
    serverId: location.serverId,
    phase: "trigger",
    purposeCode: `resolve_access_program_bounce:${sourceInstanceId}`,
    assignedDomainPlanIds: ["corp.ambush_bluff"],
    duplicateAlreadyInstalled: false,
    affordableOrSupportable: true,
    plannedAtStateVersion: input.playerView.stateVersion,
    plannedAdvancementTarget: Math.max(
      0,
      location.card.advancementCounters ?? 0,
    ),
    value: 1_000,
    evidenceCode: `corp_ambush_access_program_bounce_owned:${sourceInstanceId}`,
    accessProgramBounceChoiceBinding: {
      actionId: resolveAction.actionId,
      choiceId: choice.choiceId,
      choiceSource: choice.source,
      observedAtStateVersion: input.playerView.stateVersion,
      selectedOptionIds: selected.map((entry) => entry.optionId),
      targetProgramInstanceIds: selected.map((entry) => entry.cardId!),
      evidenceCodes: [
        "corp_ambush_program_bounce_choice_owned_by_ambush_plan",
        "corp_ambush_program_bounce_bound_to_current_engine_choice",
        "corp_ambush_program_bounce_targets_ranked_by_visible_board_value",
      ],
    },
  };
}

function definitionSupportsProgramBounceAmbush(definitionId: string): boolean {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  return (
    (hint?.strategyAnchors?.includes("corp.ambush_bluff") === true ||
      hint?.lineSupport?.includes("corp.ambush_bluff") === true) &&
    hint.targetProfiles?.some(
      (profile) =>
        "purpose" in profile &&
        profile.purpose === "bounce_high_value_runner_program",
    ) === true
  );
}

function programBounceTargetScore(card: VisibleCard): number {
  const counters = Object.values(card.counters ?? {}).reduce(
    (sum, value) => sum + (typeof value === "number" ? value : 0),
    0,
  );
  const isIcebreaker = card.subtypes?.some(
    (subtype) => subtype.toLocaleLowerCase() === "icebreaker",
  );
  return (
    (isIcebreaker ? 100_000 : 0) +
    counters * 1_000 +
    Math.max(0, card.installCost ?? 0) * 10 +
    Math.max(0, card.memoryCost ?? 0)
  );
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
            availableCorpAgendaPoints: params.input.playerView.own.agendaPoints,
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
  const plannedAdvancementTarget = Math.max(
    previous?.plannedAdvancementTarget ?? 0,
    ambushAdvancementTarget(input, source.definitionId!),
  );
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
  if (
    signal.advancementSupportRoute &&
    (signal.phase === "install_support" ||
      signal.phase === "rez_support" ||
      signal.phase === "trigger_support")
  ) {
    return [
      "corp_ambush_advance_deferred_for_exact_support_route",
      signal.sourceInstanceId,
      signal.phase,
      signal.advancementSupportRoute.actionId,
    ].join(":");
  }
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
      // Another exact owner may legally install the same visible card on a
      // different server. The old ambush commitment no longer owns that
      // location and must retire; a fresh proposal may assess the new board.
      return [];
    }
    if (
      residentScorePlanOwnsInstalledAgenda(
        params.previous!,
        sourceInstanceId,
        location.serverId,
      )
    ) {
      // An installed agenda can have incidental on-access punishment while an
      // exact score project owns its advancement route. Once that project is
      // resident, the older ambush sequence must retire instead of publishing
      // a second disposition for the same advance_card LegalAction.
      return [];
    }
    // Rezzing a score decoy publicly ends its bluff purpose. In particular,
    // the score plan may have rezzed a counter bank for a one-time emergency
    // liquidation. Keeping the old decoy resident after that handoff lets the
    // ambush owner buy the same counter back forever. Retire only this exact
    // cross-owner commitment; ordinary rezzed ambushes still keep their
    // trigger route below.
    if (signal.patternKind === "score_decoy" && location.card.rezzed === true) {
      return [];
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
    const accessWindowRezCandidates = params.candidates.filter((candidate) => {
      if (
        candidate.sourceCardInstanceId !== sourceInstanceId ||
        candidate.actionType !== "rez_card" ||
        candidate.semanticActionType !== "corp_window.rez" ||
        location.card.rezzed === true ||
        Math.max(0, location.card.advancementCounters ?? 0) === 0
      ) {
        return false;
      }
      const run = params.input.playerView.run;
      if (
        params.input.playerView.timingPoint !== "run.movement_rez_window" ||
        run?.phase !== "movement" ||
        run.position?.kind !== "server" ||
        run.position.serverId !== location.serverId ||
        run.attackedServerId !== location.serverId
      ) {
        return false;
      }
      const action = params.input.legalActions.find(
        (legalAction) => legalAction.actionId === candidate.actionId,
      );
      return action !== undefined && exactLegalActionCreditCost(action) === 0;
    });
    if (accessWindowRezCandidates.length > 1) {
      throw ambushContractFailure(
        params.input,
        accessWindowRezCandidates.map((candidate) => candidate.actionId),
        `Resident ambush ${sourceInstanceId} has ambiguous zero-cost access-window rez actions.`,
      );
    }
    const exactTriggerCandidate =
      triggerCandidates[0] ?? accessWindowRezCandidates[0];
    const runnerKnowledge = reconstructBeliefState(
      params.input,
    ).corpOpponentModel?.runnerKnownCorpCardMemory.find(
      (entry) => entry.cardInstanceId === sourceInstanceId,
    );
    const accessThreatProjection = runnerKnowledge
      ? projectKnownCorpCardAccessEffect({
          input: params.input,
          sourceDefinitionId: signal.sourceDefinitionId,
          sourceCard: location.card,
        })
      : undefined;
    const recycleCandidates = params.candidates
      .filter(
        (candidate) =>
          candidate.semanticActionType ===
            "corp_board.return_installed_card_to_hq" &&
          candidateTargetIds(candidate).includes(sourceInstanceId) &&
          candidate.sourceCardInstanceId !== undefined &&
          candidate.sourceDefinitionId !== undefined,
      )
      .sort(
        (left, right) =>
          recyclingActionCostValue(left) - recyclingActionCostValue(right) ||
          left.actionId.localeCompare(right.actionId),
      );
    const recycleCandidate = recycleCandidates[0];
    const recycleCostKnown =
      recycleCandidate?.costProfile.costKnownStatus !== "unknown";
    const knownThreatMaterial =
      accessThreatProjection?.status === "complete" &&
      accessThreatProjection.corpCanPayActivation !== false &&
      accessThreatProjection.threatValue >=
        MATERIAL_KNOWN_ACCESS_THREAT_MINIMUM;
    const knownThreatWeak =
      accessThreatProjection?.status === "not_applicable" ||
      (accessThreatProjection?.status === "complete" && !knownThreatMaterial);
    const currentCounters = Math.max(0, location.card.advancementCounters ?? 0);
    const accessPunishValue = accessThreatProjection?.threatValue ?? 0;
    const advancementInvestmentValue =
      currentCounters * ADVANCEMENT_INVESTMENT_VALUE_PER_COUNTER;
    const preparedRemoteFollowupValue =
      signal.patternKind === "score_decoy" ? PREPARED_REMOTE_FOLLOWUP_VALUE : 0;
    const recyclingCostValue = recycleCandidate
      ? recyclingActionCostValue(recycleCandidate)
      : 0;
    const holdValue = accessPunishValue + advancementInvestmentValue;
    const recycleValue =
      COMPROMISED_AMBUSH_REUSE_VALUE +
      preparedRemoteFollowupValue -
      recyclingCostValue;
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
    const supportRoute = ambushAdvancementSupportRoute({
      input: params.input,
      candidates: params.candidates,
      sourceInstanceId,
      serverId: location.serverId,
      currentCounters,
      advancementTarget,
    });
    const selectRecycle =
      supportRoute === undefined &&
      exactTriggerCandidate === undefined &&
      runnerKnowledge !== undefined &&
      recycleCandidate !== undefined &&
      recycleCostKnown &&
      knownThreatWeak &&
      recycleValue > holdValue;
    const selected =
      supportRoute?.candidate ??
      exactTriggerCandidate ??
      (selectRecycle
        ? recycleCandidate
        : currentCounters < advancementTarget
          ? advanceCandidates[0]
          : undefined);
    const phase =
      supportRoute?.phase === "install"
        ? ("install_support" as const)
        : supportRoute?.phase === "rez"
          ? ("rez_support" as const)
          : supportRoute?.phase === "trigger"
            ? ("trigger_support" as const)
            : exactTriggerCandidate !== undefined
              ? ("trigger" as const)
              : selectRecycle
                ? ("recycle" as const)
                : currentCounters < advancementTarget
                  ? ("advance" as const)
                  : ("trigger" as const);
    const {
      advancementSupportRoute: _previousAdvancementSupportRoute,
      ...retainedSignal
    } = signal as CorpAmbushSignal;
    return [
      {
        ...retainedSignal,
        serverId: location.serverId,
        phase,
        actionIds: selected ? [selected.actionId] : [],
        purposeCode:
          phase === "install_support"
            ? `install_ambush_advancement_support:${sourceInstanceId}:${location.serverId}`
            : phase === "rez_support"
              ? `rez_ambush_advancement_support:${sourceInstanceId}:${location.serverId}`
              : phase === "trigger_support"
                ? `convert_ambush_advancement_support:${sourceInstanceId}:${location.serverId}`
                : phase === "recycle"
                  ? "recycle_compromised_ambush_to_hq"
                  : phase === "advance"
                    ? `advance_committed_ambush_to:${advancementTarget}`
                    : "wait_for_or_convert_committed_ambush_access",
        duplicateAlreadyInstalled: false,
        affordableOrSupportable: selected !== undefined || phase === "trigger",
        value:
          phase === "trigger_support"
            ? 900
            : phase === "rez_support"
              ? 850
              : phase === "install_support"
                ? 340
                : phase === "trigger" && selected
                  ? 800
                  : phase === "recycle"
                    ? 360
                    : phase === "advance"
                      ? runnerKnowledge
                        ? 220
                        : 300
                      : knownThreatMaterial
                        ? (accessThreatProjection?.threatValue ?? 0)
                        : 0,
        evidenceCode:
          phase === "install_support"
            ? `corp_ambush_advancement_support_exact_install:${supportRoute?.supportSourceInstanceId}:${sourceInstanceId}:${location.serverId}`
            : phase === "rez_support"
              ? `corp_ambush_advancement_support_exact_rez:${supportRoute?.supportSourceInstanceId}:${sourceInstanceId}:${location.serverId}`
              : phase === "trigger_support"
                ? `corp_ambush_advancement_support_exact_trigger:${supportRoute?.supportSourceInstanceId}:${sourceInstanceId}:${location.serverId}`
                : phase === "recycle"
                  ? `corp_ambush_recycle_selected:${signal.sourceInstanceId}`
                  : runnerKnowledge && knownThreatMaterial
                    ? `corp_ambush_hold_selected_for_material_known_threat:${signal.sourceInstanceId}`
                    : selected
                      ? `corp_ambush_sequence_exact_${phase}:${signal.sourceInstanceId}`
                      : `corp_ambush_sequence_waiting_for_access:${signal.sourceInstanceId}`,
        runnerKnowledgeState: runnerKnowledge ? "known_exact" : "unknown",
        bluffCompromised: runnerKnowledge !== undefined,
        ...(runnerKnowledge
          ? {
              compromisedDisposition:
                phase === "recycle"
                  ? ("recycle_to_hq" as const)
                  : phase === "trigger" && exactTriggerCandidate !== undefined
                    ? ("trigger_on_access" as const)
                    : ("hold_known_threat" as const),
            }
          : {}),
        ...(accessThreatProjection ? { accessThreatProjection } : {}),
        decisionEvidenceCodes: [
          ...(runnerKnowledge
            ? [
                "runner_knows_installed_corp_card_exact",
                "corp_ambush_bluff_compromised",
              ]
            : []),
          ...(runnerKnowledge && recycleCandidate
            ? ["corp_ambush_recycle_route_available"]
            : []),
          ...(runnerKnowledge && recycleCandidate && !recycleCostKnown
            ? ["corp_ambush_recycling_cost_unknown"]
            : []),
          ...(runnerKnowledge
            ? [
                `corp_ambush_access_punish_value:${accessPunishValue}`,
                `corp_ambush_advancement_investment_value:${advancementInvestmentValue}`,
                `corp_ambush_reuse_value:${COMPROMISED_AMBUSH_REUSE_VALUE}`,
                `corp_ambush_prepared_remote_followup_value:${preparedRemoteFollowupValue}`,
                `corp_ambush_recycling_cost_value:${recyclingCostValue}`,
              ]
            : []),
          ...(phase === "recycle"
            ? ["corp_ambush_recycle_selected"]
            : runnerKnowledge && knownThreatMaterial
              ? [
                  "corp_ambush_known_access_threat_material",
                  "corp_ambush_hold_selected_for_material_known_threat",
                ]
              : runnerKnowledge && knownThreatWeak
                ? ["corp_ambush_known_access_threat_not_applicable"]
                : []),
        ],
        ...(phase === "recycle" && recycleCandidate
          ? {
              recycleRoute: {
                actionId: recycleCandidate.actionId,
                recyclerSourceInstanceId:
                  recycleCandidate.sourceCardInstanceId!,
                recyclerSourceDefinitionId:
                  recycleCandidate.sourceDefinitionId!,
                targetCardInstanceId: sourceInstanceId,
              },
            }
          : {}),
        ...(supportRoute
          ? {
              advancementSupportRoute: {
                phase: supportRoute.phase,
                actionId: supportRoute.candidate.actionId,
                supportSourceInstanceId: supportRoute.supportSourceInstanceId,
                supportSourceDefinitionId:
                  supportRoute.supportSourceDefinitionId,
                targetCardInstanceId: sourceInstanceId,
                serverId: location.serverId,
                creditCost: supportRoute.creditCost,
              },
            }
          : {}),
      },
    ];
  });
}

function recyclingActionCostValue(candidate: ActionSemanticCandidate): number {
  return (
    Math.max(0, candidate.costProfile.clickCost ?? 0) *
      RECYCLING_CLICK_COST_VALUE +
    Math.max(0, candidate.costProfile.creditCost ?? 0) *
      RECYCLING_CREDIT_COST_VALUE
  );
}

function residentScorePlanOwnsInstalledAgenda(
  previous: ResidentPlanPortfolio,
  agendaInstanceId: string,
  serverId: string,
): boolean {
  return previous.instances.some((instance) => {
    if (
      instance.moduleId !== "corp.score_agenda" ||
      instance.viability === "completed" ||
      instance.viability === "abandoned"
    ) {
      return false;
    }
    const moduleState = instance.moduleState as {
      kind?: string;
      signal?: {
        agendaInstanceId?: string;
        serverId?: string;
      };
    };
    return (
      moduleState.kind === "score" &&
      moduleState.signal?.agendaInstanceId === agendaInstanceId &&
      moduleState.signal.serverId === serverId
    );
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
  const strategyBound =
    hint?.strategyAnchors?.includes("corp.ambush_bluff") === true ||
    hint?.lineSupport?.includes("corp.ambush_bluff") === true;
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
        effect.scope === "installed_program" &&
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

function ambushAdvancementTarget(
  input: AiDecisionInput,
  definitionId: string,
): number {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  const requiresCounters = hint?.conditions?.some(
    (condition) => condition.kind === "requires_advancement_counter",
  );
  if (!requiresCounters) return 0;
  const scalablePayoff = hint?.requiredMechanics?.some((mechanic) =>
    [
      "source_advancement_counter_count",
      "damage_from_source_advancement_counters",
    ].includes(mechanic),
  );
  return scalablePayoff && corpHasAmbushAdvancementSupport(input) ? 2 : 1;
}

function corpHasAmbushAdvancementSupport(input: AiDecisionInput): boolean {
  return [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.servers.flatMap((server) => server.root),
  ].some(
    (card) =>
      card.known === true &&
      card.definitionId !== undefined &&
      AI_HINTS_BY_CARD.get(card.definitionId)?.planRoles.includes(
        "ambush_advancement_support",
      ) === true,
  );
}

function ambushAdvancementSupportRoute(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  sourceInstanceId: string;
  serverId: string;
  currentCounters: number;
  advancementTarget: number;
}):
  | {
      phase: "install" | "rez" | "trigger";
      candidate: ActionSemanticCandidate;
      supportSourceInstanceId: string;
      supportSourceDefinitionId: string;
      creditCost: number;
    }
  | undefined {
  if (params.advancementTarget - params.currentCounters < 2) return undefined;
  const server = params.input.playerView.servers.find(
    (entry) => entry.id === params.serverId,
  );
  if (!server) return undefined;
  const supports = server.root.filter(
    (card) =>
      card.instanceId !== params.sourceInstanceId &&
      card.known === true &&
      card.definitionId !== undefined &&
      AI_HINTS_BY_CARD.get(card.definitionId)?.planRoles.includes(
        "ambush_advancement_support",
      ) === true,
  );
  const installedSupportIds = new Set(supports.map((card) => card.instanceId));
  const rankedTrigger = params.candidates
    .filter((candidate) => {
      if (
        candidate.semanticActionType !== "card_ability.trigger" ||
        !candidate.sourceCardInstanceId ||
        !installedSupportIds.has(candidate.sourceCardInstanceId)
      ) {
        return false;
      }
      const action = params.input.legalActions.find(
        (legalAction) => legalAction.actionId === candidate.actionId,
      );
      return (
        action?.payload?.fortRunWindowAbility ===
          "add_advancement_counters_after_passing_last_ice_on_this_fort" &&
        action.payload.targetCardId === params.sourceInstanceId &&
        action.payload.serverId === params.serverId
      );
    })
    .sort((left, right) => left.actionId.localeCompare(right.actionId));
  const trigger = rankedTrigger[0];
  if (trigger?.sourceCardInstanceId && trigger.sourceDefinitionId) {
    return {
      phase: "trigger",
      candidate: trigger,
      supportSourceInstanceId: trigger.sourceCardInstanceId,
      supportSourceDefinitionId: trigger.sourceDefinitionId,
      creditCost: trigger.costProfile.creditCost ?? 0,
    };
  }
  const unrezzedSupports = new Set(
    supports
      .filter((card) => card.rezzed !== true)
      .map((card) => card.instanceId),
  );
  const rez = params.candidates
    .filter(
      (candidate) =>
        candidate.semanticActionType === "corp_window.rez" &&
        candidate.sourceCardInstanceId !== undefined &&
        unrezzedSupports.has(candidate.sourceCardInstanceId),
    )
    .sort((left, right) => left.actionId.localeCompare(right.actionId))[0];
  if (rez?.sourceCardInstanceId && rez.sourceDefinitionId) {
    return {
      phase: "rez",
      candidate: rez,
      supportSourceInstanceId: rez.sourceCardInstanceId,
      supportSourceDefinitionId: rez.sourceDefinitionId,
      creditCost: rez.costProfile.creditCost ?? 0,
    };
  }
  if (supports.length > 0) return undefined;
  const gripSupportIds = new Set(
    params.input.playerView.own.gripOrHq
      .filter(
        (card) =>
          card.known === true &&
          card.definitionId !== undefined &&
          AI_HINTS_BY_CARD.get(card.definitionId)?.planRoles.includes(
            "ambush_advancement_support",
          ) === true,
      )
      .map((card) => card.instanceId),
  );
  const installs = params.candidates
    .filter(
      (candidate) =>
        candidate.semanticActionType === "install.card" &&
        candidate.sourceCardInstanceId !== undefined &&
        gripSupportIds.has(candidate.sourceCardInstanceId) &&
        candidateTargetIds(candidate).includes(params.serverId),
    )
    .flatMap((candidate) => {
      const action = params.input.legalActions.find(
        (legalAction) => legalAction.actionId === candidate.actionId,
      );
      const creditCost = action
        ? exactLegalActionCreditCost(action)
        : undefined;
      if (
        creditCost === undefined ||
        params.input.playerView.own.credits - creditCost < 5
      ) {
        return [];
      }
      return [{ candidate, creditCost }];
    })
    .sort((left, right) =>
      left.candidate.actionId.localeCompare(right.candidate.actionId),
    );
  const install = installs[0];
  if (
    !install?.candidate.sourceCardInstanceId ||
    !install.candidate.sourceDefinitionId
  )
    return undefined;
  return {
    phase: "install",
    candidate: install.candidate,
    supportSourceInstanceId: install.candidate.sourceCardInstanceId,
    supportSourceDefinitionId: install.candidate.sourceDefinitionId,
    creditCost: install.creditCost,
  };
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
