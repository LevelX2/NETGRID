import {
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  type AiDecision,
  type AiDecisionInput,
  type Side,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import {
  deckDoctrineRoleIsAgenda,
  rolesForDeckDoctrineCard,
} from "../deck-doctrine-card-roles";
import type { DeckCapabilityProfile } from "../deck-capabilities";
import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../runner-run-target-evaluation";
import type { RunnerStrategicIntentProfile } from "../runner-strategic-intent";
import {
  CORP_PLAN_PRIORITY_POLICY,
  RUNNER_PLAN_PRIORITY_POLICY,
} from "../plans/plan-assessment";
import {
  createCorpCorePlanModules,
  type CorpCorePlanDomain,
  type CorpDefenseSignal,
  type CorpScoreProjectSignal,
} from "../plans/corp-core-plan-modules";
import {
  createCorpTacticalPlanModules,
  type CorpPlanDomain,
  type CorpPunishCampaignSignal,
} from "../plans/corp-tactical-plan-modules";
import {
  createRunnerCorePlanModules,
  type RunnerCorePlanDomain,
} from "../plans/runner-core-plan-modules";
import {
  createRunnerTacticalPlanModules,
  type RunnerPlanDomain,
} from "../plans/runner-tactical-plan-modules";
import {
  createSidePlanRegistry,
  runPlanScheduler,
  type EngineWindowResolution,
  type PlanSchedulerContext,
  type PlanSchedulerResult,
} from "../plans/plan-scheduler";
import {
  rememberResidentPlanPortfolio,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import type { SemanticRuntimeDependencies } from "./semantic-runtime";
import { visibleSourceDefinitionsByInstanceId } from "./visible-source-definitions";
import type { AiDecisionRuntimeOptions } from "./choose-ai-action";

export type PlanFirstLiveDependencies = Pick<
  SemanticRuntimeDependencies,
  | "buildActionSemanticCandidates"
  | "deckCapabilitiesForInput"
  | "runnerStrategicIntentForInput"
  | "evaluateRunnerHandDevelopment"
  | "buildRunnerEconomyPosture"
  | "evaluateRunnerRunTargets"
  | "selectedChoicesForDecision"
>;

export function choosePlanFirstLiveAction(
  input: AiDecisionInput,
  options: AiDecisionRuntimeOptions,
  dependencies: PlanFirstLiveDependencies,
): AiDecision {
  const candidates = dependencies.buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const context =
    input.side === "runner"
      ? runnerContext(input, candidates, dependencies)
      : corpContext(input, candidates);
  const previous = residentPlanPortfolioSnapshot(input);
  const result = runPlanScheduler({
    context,
    registry:
      input.side === "runner"
        ? createSidePlanRegistry({
            side: "runner",
            priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
            modules: [
              ...createRunnerCorePlanModules(),
              ...createRunnerTacticalPlanModules(),
            ],
          })
        : createSidePlanRegistry({
            side: "corp",
            priorityPolicy: CORP_PLAN_PRIORITY_POLICY,
            modules: [
              ...createCorpCorePlanModules(),
              ...createCorpTacticalPlanModules(),
            ],
          }),
    ...(previous ? { previousPortfolio: previous } : {}),
    resolveEngineWindow: resolveEngineWindow,
    maxReplans: 2,
  });
  if (
    options.persistTacticalPlanMemory !== false &&
    result.portfolio &&
    result.portfolio.stateVersion === input.playerView.stateVersion
  ) {
    rememberResidentPlanPortfolio(input, result.portfolio);
  }
  return decisionFromScheduler(input, candidates, result, dependencies);
}

function runnerContext(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  dependencies: PlanFirstLiveDependencies,
): PlanSchedulerContext {
  const deckCapabilities = dependencies.deckCapabilitiesForInput(input);
  const strategicIntent = dependencies.runnerStrategicIntentForInput(
    input,
    deckCapabilities,
  );
  const handDevelopment = dependencies.evaluateRunnerHandDevelopment({
    input,
    strategicIntent,
    deckCapabilities,
    actionCandidates: candidates,
  });
  const economy = dependencies.buildRunnerEconomyPosture({
    input,
    strategicIntent,
    deckCapabilities,
    handDevelopmentEvaluations: handDevelopment,
  });
  const runTargets = dependencies.evaluateRunnerRunTargets({
    input,
    strategicIntent,
    deckCapabilities,
    actionCandidates: candidates,
    handDevelopmentEvaluations: handDevelopment,
  });
  return {
    input,
    actionCandidates: candidates,
    turnKey: turnKey(input),
    domain: buildRunnerDomain(
      input,
      candidates,
      deckCapabilities,
      strategicIntent,
      economy,
      handDevelopment,
      runTargets,
    ),
  };
}

function buildRunnerDomain(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  _deckCapabilities: DeckCapabilityProfile,
  strategicIntent: RunnerStrategicIntentProfile,
  economy: RunnerEconomyPosture,
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  runTargets: readonly RunnerRunTargetEvaluation[],
): RunnerPlanDomain {
  const currentCredits = input.playerView.own.credits;
  const fundingNeeds: RunnerCorePlanDomain["fundingNeeds"] =
    economy.fundingNeed && economy.desiredCreditReserve > currentCredits
      ? [
          {
            needId: "runner-credit-reserve",
            gap: economy.desiredCreditReserve - currentCredits,
            priorityClass: "P5",
            evidenceCode:
              economy.evidence[0] ?? "runner_economy_posture_funding_need",
          },
        ]
      : [];
  const installedRoles = new Set(
    (input.playerView.own.rig ?? []).flatMap((card) =>
      rolesForDeckDoctrineCard(card.definitionId ?? ""),
    ),
  );
  const coverageGaps = uniqueCoverageGaps(runTargets, installedRoles);
  const defense: RunnerCorePlanDomain["defense"] = {
    activeTags: input.playerView.own.tags,
    visibleTagPunish: input.playerView.own.tags > 0,
    pendingDamage: visiblePendingDamage(candidates),
    damagePreventionNeeded: candidates.some(
      (candidate) =>
        candidate.semanticActionType.startsWith("damage.prevent") ||
        candidate.actionTacticSignals.includes("damage_prevention"),
    ),
    handSize: input.playerView.own.gripOrHq.length,
    minimumHandBuffer: 3,
    drawAllowed:
      input.playerView.own.stackOrRdCount > 0 &&
      candidates.some(
        (candidate) => candidate.semanticActionType === "draw.card",
      ),
    evidenceCodes: ["runner_visible_defense_state"],
  };
  const centralPressure = bestRunTargetsByServer(runTargets)
    .filter(
      (evaluation) =>
        evaluation.targetKind !== "remote" &&
        evaluation.pathPassability === "reachable" &&
        (evaluation.recommendation === "run_now" ||
          evaluation.recommendation === "run_if_free") &&
        evaluation.score > 0,
    )
    .map((evaluation) => ({
      pressureId: `central:${evaluation.targetServerId}`,
      serverId: evaluation.targetServerId as "hq" | "rd" | "archives",
      purpose:
        evaluation.multiaccessAvailable
          ? ("multiaccess" as const)
          : evaluation.knownAccessState === "unknown" ||
              evaluation.knownAccessState === "fresh"
            ? ("information" as const)
            : ("access" as const),
      strategyLineIds: [strategicIntent.primaryWinIntent],
      priorityClass: "P4" as const,
      reachable: true,
      marginalValue: evaluation.score,
      evidenceCode: evaluation.evidence[0] ?? "runner_run_target",
      ...(sourceDefinitionForEvaluation(evaluation, candidates)
        ? {
            sourceDefinitionIds: [
              sourceDefinitionForEvaluation(evaluation, candidates)!,
            ],
          }
        : {}),
    }));
  const remoteContests = bestRunTargetsByServer(runTargets)
    .filter(
      (evaluation) =>
        evaluation.targetKind === "remote" &&
        evaluation.pathPassability === "reachable" &&
        (evaluation.recommendation === "run_now" ||
          evaluation.recommendation === "run_if_free") &&
        evaluation.score > 0,
    )
    .map((evaluation) => ({
      contestId: `remote:${evaluation.targetServerId}`,
      serverId: evaluation.targetServerId,
      knownAgendaThreat: evaluation.scoreThreat,
      reachable: true,
      marginalValue: evaluation.score,
      evidenceCode: evaluation.evidence[0] ?? "runner_remote_target",
    }));
  const developments = handDevelopment.flatMap((evaluation) => {
    if (
      evaluation.availability !== "legal_now" ||
      evaluation.deferReason !== "none" ||
      !evaluation.definitionId ||
      evaluation.priority <= 0
    )
      return [];
    const candidate = candidates.find(
      (entry) =>
        entry.sourceDefinitionId === evaluation.definitionId &&
        entry.actionId === evaluation.legalActionId,
    );
    if (!candidate) return [];
    const duplicate =
      evaluation.persistentInstallEvaluation?.duplicateRole ===
      "redundant_duplicate";
    return [
      {
        developmentId: `card:${evaluation.cardInstanceId}`,
        definitionId: evaluation.definitionId,
        ...(evaluation.currentNeed !== "none"
          ? {
              purposeCode: `${evaluation.developmentRole}:${evaluation.currentNeed}`,
            }
          : {}),
        assignedDomainPlanIds:
          evaluation.strategicFit === "strong"
            ? [strategicIntent.primaryWinIntent]
            : [],
        duplicateAlreadyInstalled: duplicate,
        affordableOrSupportable: evaluation.fundingNeed === undefined,
        semanticActionTypes: [candidate.semanticActionType],
        value: evaluation.priority,
        evidenceCode: evaluation.evidence[0] ?? "runner_hand_development",
      },
    ];
  });
  const runWindows =
    input.playerView.run &&
    candidates.some((candidate) => isRunWindowSemantic(candidate))
      ? [
          {
            windowId: `run:${input.playerView.run.runId ?? input.playerView.stateVersion}`,
            serverId: input.playerView.run.attackedServerId,
            rootPlanInstanceId: `plan:runner.pressure_central:central%3A${input.playerView.run.attackedServerId}`,
            leafPlanInstanceId: `plan:runner.convert_run_window:run%3A${input.playerView.run.runId ?? input.playerView.stateVersion}`,
            semanticActionTypes: [
              ...new Set(
                candidates
                  .filter(isRunWindowSemantic)
                  .map((candidate) => candidate.semanticActionType),
              ),
            ],
            purposeCode: "convert_active_run_window",
            evidenceCode: "visible_active_run",
          },
        ]
      : [];
  return {
    fundingNeeds,
    coverageGaps,
    defense,
    centralPressure,
    remoteContests,
    developments,
    runWindows,
  };
}

function corpContext(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): PlanSchedulerContext {
  return {
    input,
    actionCandidates: candidates,
    turnKey: turnKey(input),
    domain: buildCorpDomain(input, candidates),
  };
}

function buildCorpDomain(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpPlanDomain {
  const scoreProjects: CorpScoreProjectSignal[] = candidates.flatMap(
    (candidate) => scoreProjectForCandidate(input, candidate),
  );
  const defenseNeeds: CorpCorePlanDomain["defenseNeeds"] = candidates.flatMap(
    (candidate): CorpDefenseSignal[] => {
      const roles = candidate.sourceDefinitionId
        ? rolesForDeckDoctrineCard(candidate.sourceDefinitionId)
        : [];
      if (
        candidate.semanticActionType === "install.card" &&
        roles.some((role) => role === "corp_install_ice")
      ) {
        const serverId = candidateTargetIds(candidate).find((id) =>
          isServerId(id),
        );
        if (!serverId || !candidate.sourceDefinitionId) return [];
        return [
          {
            defenseId: `install:${candidate.sourceDefinitionId}:${serverId}`,
            serverId,
            phase: "install_ice" as const,
            sourceDefinitionIds: [candidate.sourceDefinitionId],
            urgent: false,
            value: 10,
            evidenceCode: "visible_legal_ice_install",
          },
        ];
      }
      if (
        candidate.semanticActionType === "corp_window.rez" &&
        candidate.sourceDefinitionId &&
        candidate.sourceCardInstanceId
      ) {
        const targetId = candidate.sourceCardInstanceId;
        return [
          {
            defenseId: `rez:${targetId}`,
            serverId: serverForInstalledCard(input, targetId) ?? "unknown",
            phase: "rez_response" as const,
            sourceDefinitionIds: [candidate.sourceDefinitionId],
            targetIceInstanceId: targetId,
            urgent: input.playerView.run !== undefined,
            value: input.playerView.run ? 50 : 10,
            evidenceCode: "visible_rez_window",
          },
        ];
      }
      return [];
    },
  );
  const remoteProjects: CorpCorePlanDomain["remoteProjects"] = [];
  const economyNeeds: CorpCorePlanDomain["economyNeeds"] =
    input.playerView.own.credits < 5 &&
    candidates.some(
      (candidate) => candidate.semanticActionType === "economy.gain_credit",
    )
      ? [
          {
            needId: "corp-minimum-reserve",
            gap: 5 - input.playerView.own.credits,
            urgentForScore: scoreProjects.length > 0,
            evidenceCode: "corp_visible_minimum_reserve_gap",
          },
        ]
      : [];
  const virusPressure: CorpPlanDomain["virusPressure"] =
    candidates.some(
      (candidate) =>
        candidate.semanticActionType === "counter.purge_virus" ||
        candidate.semanticActionType === "counter.purge_runner_virus",
    )
      ? [
          {
            pressureId: "visible-virus-pressure",
            virusCounters: visibleRunnerVirusCounters(input),
            strategicDamage: visibleRunnerVirusCounters(input),
            critical: visibleRunnerVirusCounters(input) >= 3,
            purgeUseful: visibleRunnerVirusCounters(input) > 0,
            evidenceCode: "visible_runner_virus_counters",
          },
        ]
      : [];
  const punishCampaigns = punishSignals(candidates);
  const ambushes: CorpPlanDomain["ambushes"] = candidates.flatMap(
    (candidate) => {
      if (!candidate.sourceDefinitionId) return [];
      const roles = rolesForDeckDoctrineCard(candidate.sourceDefinitionId);
      if (!roles.some((role) => role.includes("ambush"))) return [];
      const serverId = candidateTargetIds(candidate).find(isServerId);
      if (!serverId) return [];
      return [
        {
          ambushId: `ambush:${candidate.sourceDefinitionId}:${serverId}`,
          sourceDefinitionId: candidate.sourceDefinitionId,
          serverId,
          phase: "install" as const,
          purposeCode: "install_visible_ambush_candidate",
          assignedDomainPlanIds: ["ambush"],
          duplicateAlreadyInstalled: false,
          affordableOrSupportable: true,
          value: 10,
          evidenceCode: "own_visible_ambush",
        },
      ];
    },
  );
  const ownAgendas = input.playerView.own.gripOrHq.filter((card) =>
    rolesForDeckDoctrineCard(card.definitionId ?? "").some(
      deckDoctrineRoleIsAgenda,
    ),
  ).length;
  const handManagement: CorpPlanDomain["handManagement"] =
    ownAgendas >= 3
      ? [
          {
            handPlanId: "agenda-flood",
            phase: "agenda_flood_relief",
            agendaCount: ownAgendas,
            handSize: input.playerView.own.gripOrHq.length,
            maximumHandSize: input.playerView.own.maxHandSize,
            concretePurposeCode: "relieve_visible_own_agenda_flood",
            value: ownAgendas * 10,
            evidenceCode: "own_visible_agenda_flood",
          },
        ]
      : [];
  return {
    scoreProjects,
    remoteProjects,
    defenseNeeds,
    economyNeeds,
    virusPressure,
    punishCampaigns,
    ambushes,
    handManagement,
  };
}

function scoreProjectForCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): CorpScoreProjectSignal[] {
  if (
    candidate.semanticActionType === "install.card" &&
    candidate.sourceDefinitionId &&
    rolesForDeckDoctrineCard(candidate.sourceDefinitionId).some(
      deckDoctrineRoleIsAgenda,
    )
  ) {
    return [
      {
        projectId: `agenda:${candidate.sourceDefinitionId}`,
        agendaDefinitionId: candidate.sourceDefinitionId,
        ...(candidateTargetIds(candidate).find(isServerId)
          ? {
              serverId: candidateTargetIds(candidate).find(isServerId)!,
            }
          : {}),
        phase: "install_agenda",
        sameTurnCloseout: false,
        terminalScore: false,
        feasible: true,
        evidenceCode: "own_visible_legal_agenda_install",
      },
    ];
  }
  if (
    candidate.semanticActionType === "score.advance_card" ||
    candidate.semanticActionType === "score.agenda"
  ) {
    const target = candidateTargetIds(candidate)[0];
    if (!target) return [];
    return [
      {
        projectId: `agenda:${target}`,
        agendaDefinitionId: target,
        agendaInstanceId: target,
        phase:
          candidate.semanticActionType === "score.agenda"
            ? "score_agenda"
            : "advance_agenda",
        sameTurnCloseout: true,
        terminalScore:
          candidate.semanticActionType === "score.agenda" &&
          input.playerView.own.agendaPoints + 1 >=
            input.playerView.agendaPointsToWin,
        feasible: true,
        evidenceCode: "visible_legal_score_conversion",
      },
    ];
  }
  return [];
}

function punishSignals(
  candidates: readonly ActionSemanticCandidate[],
): CorpPunishCampaignSignal[] {
  return candidates.flatMap((candidate) => {
    const phase = candidate.semanticActionType.startsWith("trace.")
      ? "trace"
      : candidate.semanticActionType.startsWith("tag.")
        ? "tag"
        : candidate.semanticActionType.startsWith("damage.")
          ? "damage"
          : undefined;
    if (!phase) return [];
    return [
      {
        campaignId: `punish:${candidate.sourceDefinitionId ?? phase}`,
        phase,
        sourceDefinitionIds: candidate.sourceDefinitionId
          ? [candidate.sourceDefinitionId]
          : [],
        feasible: true,
        guarantee: "robust_but_reactive",
        visibleTerminalProjection: false,
        value: phase === "damage" ? 30 : 15,
        evidenceCode: `visible_${phase}_action`,
      },
    ];
  });
}

function resolveEngineWindow(
  context: PlanSchedulerContext,
): EngineWindowResolution | undefined {
  const candidates = context.actionCandidates;
  if (candidates.length !== 1) return undefined;
  const [candidate] = candidates;
  if (!candidate) return undefined;
  const semantic = candidate.semanticActionType;
  const automaticOrMandatory =
    semantic === "choice.resolve" ||
    semantic === "run.continue" ||
    semantic === "breaker.boost_strength" ||
    semantic === "breaker.break_subroutine" ||
    semantic.startsWith("access.") ||
    semantic === "turn_flow.forgo_action" ||
    (semantic === "turn_flow.end_turn" &&
      context.input.playerView.own.clicks === 0);
  if (!automaticOrMandatory) return undefined;
  return {
    actionId: candidate.actionId,
    reasonCode: "engine_window_single_legal_resolution",
    origin: {
      rootPlanInstanceId: context.input.playerView.run
        ? `run:${context.input.playerView.run.runId ?? "active"}`
        : "rules",
      leafPlanInstanceId: "rules.window_resolution",
      side: context.input.side,
      windowKind: windowKindForSemantic(semantic),
      windowId: `${context.input.playerView.timingPoint}:${context.input.playerView.stateVersion}`,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}

function decisionFromScheduler(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  result: PlanSchedulerResult,
  dependencies: PlanFirstLiveDependencies,
): AiDecision {
  const actionId =
    result.lane === "plan" ? result.route.head.actionId : result.actionId;
  const action = input.legalActions.find(
    (candidate) => candidate.actionId === actionId,
  );
  if (!action) throw new Error("plan_first_selected_action_not_legal");
  const selectedChoices = dependencies.selectedChoicesForDecision(input, action);
  const planId =
    result.lane === "plan"
      ? result.selectedAssessment.instanceId
      : result.origin.leafPlanInstanceId;
  const planKind =
    result.lane === "plan"
      ? result.portfolio.instances.find(
          (instance) => instance.instanceId === planId,
        )?.moduleId
      : "engine_window";
  const evidence = [
    "plan_first_runtime:true",
    `plan_first_lane:${result.lane}`,
    `plan_first_executor:${planId}`,
    ...result.diagnostics.map(
      (event) =>
        `plan_scheduler:${event.stage}:${event.code}:${event.instanceId ?? "none"}`,
    ),
  ];
  return {
    actionId,
    ...(selectedChoices ? { selectedChoices } : {}),
    reasonCode:
      result.lane === "plan"
        ? `plan_first.${planKind ?? "unknown"}`
        : "plan_first.engine_window",
    explanation:
      result.lane === "plan"
        ? `Plan ${planKind ?? planId} materialized the current ${result.route.head.semanticActionType} route.`
        : "The engine/window lane resolved the sole current mandatory action.",
    consideredActionIds: [],
    fallbackUsed: false,
    confidence: 1,
    evidence,
    decisionDebug: {
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: difficultyLevel(input),
      summary: "Authoritative plan-first runtime selection",
      planId,
      ...(planKind ? { planKind } : {}),
      selectedActionType: action.type,
      confidence: 1,
      visibleReasons: evidence,
      fallbackUsed: false,
      timeoutUsed: false,
      profileId: input.profileId,
      memoryVersion: "resident-plan-portfolio-v2",
      evidence,
    },
    timeoutUsed: false,
    profileId: input.profileId,
    difficulty: input.difficulty,
    reason:
      result.lane === "plan"
        ? `plan_first.${planKind ?? "unknown"}`
        : "plan_first.engine_window",
  };
}

function uniqueCoverageGaps(
  runTargets: readonly RunnerRunTargetEvaluation[],
  installedRoles: ReadonlySet<string>,
): RunnerCorePlanDomain["coverageGaps"] {
  const result = new Map<
    string,
    RunnerCorePlanDomain["coverageGaps"][number]
  >();
  for (const evaluation of runTargets) {
    if (evaluation.recommendation !== "find_breaker_first") continue;
    const role = requiredBreakerRole(evaluation.evidence);
    if (installedRoles.has(role)) continue;
    result.set(role, {
      gapId: `coverage:${role}`,
      requiredRole: role,
      targetServerId: evaluation.targetServerId,
      priorityClass: evaluation.scoreThreat ? "P2" : "P5",
      evidenceCode: evaluation.evidence[0] ?? `missing_${role}`,
      deckHasAnswer: true,
    });
  }
  return [...result.values()];
}

function requiredBreakerRole(
  evidence: readonly string[],
): RunnerCorePlanDomain["coverageGaps"][number]["requiredRole"] {
  const joined = evidence.join(" ").toLowerCase();
  if (joined.includes("code_gate") || joined.includes("code-gate"))
    return "breaker_code_gate";
  if (joined.includes("sentry")) return "breaker_sentry";
  if (joined.includes("wall") || joined.includes("barrier"))
    return "breaker_wall";
  return "breaker_universal";
}

function bestRunTargetsByServer(
  evaluations: readonly RunnerRunTargetEvaluation[],
): RunnerRunTargetEvaluation[] {
  const byServer = new Map<string, RunnerRunTargetEvaluation>();
  for (const evaluation of evaluations) {
    const previous = byServer.get(evaluation.targetServerId);
    if (!previous || evaluation.score > previous.score)
      byServer.set(evaluation.targetServerId, evaluation);
  }
  return [...byServer.values()];
}

function sourceDefinitionForEvaluation(
  evaluation: RunnerRunTargetEvaluation,
  candidates: readonly ActionSemanticCandidate[],
): string | undefined {
  return candidates.find(
    (candidate) => candidate.actionId === evaluation.actionId,
  )?.sourceDefinitionId;
}

function visiblePendingDamage(
  candidates: readonly ActionSemanticCandidate[],
): number {
  return candidates.some(
    (candidate) =>
      candidate.semanticActionType.startsWith("damage.prevent") ||
      candidate.actionTacticSignals.includes("damage_prevention"),
  )
    ? 1
    : 0;
}

function isRunWindowSemantic(candidate: ActionSemanticCandidate): boolean {
  return (
    candidate.semanticActionType === "run.continue" ||
    candidate.semanticActionType === "run.jack_out" ||
    candidate.semanticActionType.startsWith("access.") ||
    candidate.semanticActionType === "breaker.boost_strength" ||
    candidate.semanticActionType === "breaker.break_subroutine"
  );
}

function candidateTargetIds(candidate: ActionSemanticCandidate): string[] {
  return [
    ...(candidate.targetContext?.selectedTargets.map(
      (target) => target.targetId,
    ) ?? []),
    ...(candidate.targetContext?.availableTargets?.map(
      (target) => target.targetId,
    ) ?? []),
    ...(candidate.runProjectionSummary?.serverId
      ? [candidate.runProjectionSummary.serverId]
      : []),
  ];
}

function serverForInstalledCard(
  input: AiDecisionInput,
  cardId: string,
): string | undefined {
  return input.playerView.servers.find((server) =>
    [...server.ice, ...server.root].some((card) => card.instanceId === cardId),
  )?.id;
}

function visibleRunnerVirusCounters(input: AiDecisionInput): number {
  return (input.playerView.opponent.rig ?? []).reduce(
    (sum, card) =>
      sum + (card.counters?.virus ?? 0),
    0,
  );
}

function isServerId(value: string): boolean {
  return (
    value === "hq" ||
    value === "rd" ||
    value === "archives" ||
    value.startsWith("remote_")
  );
}

function windowKindForSemantic(
  semantic: string,
):
  | "automatic_resolution"
  | "mandatory_choice"
  | "run"
  | "access"
  | "pass_decline" {
  if (semantic === "choice.resolve") return "mandatory_choice";
  if (semantic.startsWith("access.")) return "access";
  if (semantic.startsWith("run.") || semantic.startsWith("breaker."))
    return "run";
  if (semantic.startsWith("turn_flow.")) return "pass_decline";
  return "automatic_resolution";
}

function turnKey(input: AiDecisionInput): string {
  return `${input.side}:${input.playerView.turnSerial ?? input.actionNumber}`;
}

function difficultyLevel(input: AiDecisionInput): number {
  if (input.difficulty === "easy") return 1;
  if (input.difficulty === "hard") return 3;
  return 2;
}
