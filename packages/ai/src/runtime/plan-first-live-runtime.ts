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
import {
  corpScorelineActionCanCloseThisTurn,
  corpScorelineFeasibilityForDecisionInput,
  type CorpScorelineFeasibility,
} from "./corp-scoreline-feasibility";

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
  const candidates = attachActiveRunContext(
    input,
    dependencies.buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: input.side,
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    }),
  );
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
  const coverageGaps = uniqueCoverageGaps(
    runTargets,
    installedRoles,
    _deckCapabilities,
    strategicIntent,
  );
  const damageBufferForecast =
    runTargets.some(
      (evaluation) =>
        evaluation.recommendation === "draw_for_damage_buffer" ||
        evaluation.pathPassability === "blocked_by_blink_hand_buffer" ||
        (evaluation.riskyUniversalCoverage &&
          input.playerView.own.gripOrHq.length < 3) ||
        evaluation.blinkRiskAssessment?.blockedByHandBuffer === true ||
        evaluation.blinkRiskAssessment?.riskSeverity === "high" ||
        evaluation.blinkRiskAssessment?.riskSeverity === "lethal",
    ) ||
    (input.playerView.own.gripOrHq.length < 3 &&
      input.playerView.servers.some((server) =>
        server.ice.some(
          (ice) =>
            ice.rezzed === true &&
            ((strategicIntent.riskProfile ?? []).includes(
              "runner.risky_universal_breaker_pressure",
            ) ||
              rolesForDeckDoctrineCard(ice.definitionId ?? "").includes(
                "sentry_ice",
              )),
        ),
      ));
  const defense: RunnerCorePlanDomain["defense"] = {
    activeTags: input.playerView.own.tags,
    visibleTagPunish: input.playerView.own.tags > 0,
    pendingDamage:
      visiblePendingDamage(candidates) + (damageBufferForecast ? 1 : 0),
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
    evidenceCodes: [
      damageBufferForecast
        ? "runner_run_target_requires_damage_buffer"
        : "runner_visible_defense_state",
    ],
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
      purpose: evaluation.multiaccessAvailable
        ? ("multiaccess" as const)
        : evaluation.knownAccessState === "unknown" ||
            evaluation.knownAccessState === "fresh"
          ? ("information" as const)
          : ("access" as const),
      strategyLineIds: [strategicIntent.primaryWinIntent],
      priorityClass: "P4" as const,
      reachable: true,
      marginalValue:
        evaluation.recommendation === "run_now"
          ? evaluation.score
          : Math.min(evaluation.score, 60),
      evidenceCode: evaluation.evidence[0] ?? "runner_run_target",
      ...(sourceDefinitionForEvaluation(evaluation, candidates)
        ? {
            sourceDefinitionIds: [
              sourceDefinitionForEvaluation(evaluation, candidates)!,
            ],
          }
        : {}),
    }));
  const remoteContests = uniqueBy(
    [
      ...bestRunTargetsByServer(runTargets)
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
          marginalValue:
            evaluation.recommendation === "run_now"
              ? evaluation.score
              : Math.min(evaluation.score, 60),
          evidenceCode: evaluation.evidence[0] ?? "runner_remote_target",
        })),
      ...input.playerView.servers.flatMap((server) => {
        const knownAgenda = server.root.some(
          (card) => card.known !== false && card.type === "agenda",
        );
        const legalRun = candidates.some(
          (candidate) =>
            candidate.semanticActionType === "run.start" &&
            candidate.runProjectionSummary?.serverId === server.id,
        );
        if (!server.id.startsWith("remote_") || !knownAgenda || !legalRun) {
          return [];
        }
        return [
          {
            contestId: `remote:${server.id}`,
            serverId: server.id,
            knownAgendaThreat: true,
            reachable: true,
            marginalValue: 1_000,
            evidenceCode: "visible_known_agenda_remote",
          },
        ];
      }),
    ],
    (signal) => signal.contestId,
  );
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
  const hasRunWindowCandidate = candidates.some((candidate) =>
    isRunWindowSemantic(candidate),
  );
  const runWindows = hasRunWindowCandidate
    ? [
        {
          windowId: `run:${input.playerView.run?.runId ?? input.playerView.stateVersion}`,
          ...(input.playerView.run
            ? { serverId: input.playerView.run.attackedServerId }
            : {}),
          rootPlanInstanceId: input.playerView.run
            ? `plan:runner.pressure_central:central%3A${input.playerView.run.attackedServerId}`
            : "rules.access_window",
          leafPlanInstanceId: `plan:runner.convert_run_window:run%3A${input.playerView.run?.runId ?? input.playerView.stateVersion}`,
          semanticActionTypes: [
            ...new Set(
              candidates
                .filter(isRunWindowSemantic)
                .map((candidate) => candidate.semanticActionType),
            ),
          ],
          purposeCode: "convert_active_run_window",
          evidenceCode: input.playerView.run
            ? "visible_active_run"
            : "legal_access_window_without_run_snapshot",
        },
      ]
    : [];
  return {
    fundingNeeds,
    coverageGaps,
    defense,
    terminalWins:
      input.playerView.opponent.deckCount === 0 &&
      candidates.some((candidate) => candidate.actionType === "end_turn")
        ? [
            {
              terminalId: "force-corp-empty-rd-draw",
              semanticActionTypes: ["turn_flow.end_turn"],
              evidenceCode: "corp_visible_empty_rd_forced_mandatory_draw",
            },
          ]
        : [],
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
  const scorelineFeasibility = corpScorelineFeasibilityForDecisionInput(input);
  const scoreProjects: CorpScoreProjectSignal[] = uniqueScoreProjects(
    candidates.flatMap((candidate) =>
      scoreProjectForCandidate(input, candidate, scorelineFeasibility),
    ),
  );
  const defenseNeeds: CorpCorePlanDomain["defenseNeeds"] = uniqueBy(
    candidates.flatMap((candidate): CorpDefenseSignal[] => {
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
            defenseId: `install:${candidate.sourceCardInstanceId ?? candidate.sourceDefinitionId}:${serverId}`,
            serverId,
            phase: "install_ice" as const,
            sourceDefinitionIds: [candidate.sourceDefinitionId],
            urgent: false,
            value: 10,
            evidenceCode: "visible_legal_ice_install",
          },
        ];
      }
      if (candidate.semanticActionType === "corp_window.rez") {
        const targetId = candidate.sourceCardInstanceId;
        return [
          {
            defenseId: `rez:${targetId ?? candidate.actionId}`,
            serverId:
              (targetId
                ? serverForInstalledCard(input, targetId)
                : undefined) ??
              candidateTargetIds(candidate).find(isServerId) ??
              input.playerView.run?.attackedServerId ??
              "unknown",
            phase: "rez_response" as const,
            sourceDefinitionIds: candidate.sourceDefinitionId
              ? [candidate.sourceDefinitionId]
              : [],
            ...(targetId ? { targetIceInstanceId: targetId } : {}),
            urgent: input.playerView.run !== undefined,
            value: input.playerView.run ? 50 : 10,
            evidenceCode: "visible_rez_window",
          },
        ];
      }
      return [];
    }),
    (signal) => signal.defenseId,
  );
  const remoteProjects: CorpCorePlanDomain["remoteProjects"] = [];
  const economyNeeds: CorpCorePlanDomain["economyNeeds"] = candidates.some(
    (candidate) => candidate.semanticActionType === "economy.gain_credit",
  )
    ? [
        {
          needId:
            input.playerView.own.credits < 5
              ? "corp-minimum-reserve"
              : "corp-neutral-credit-progress",
          gap: Math.max(0, 5 - input.playerView.own.credits),
          ...(input.playerView.own.credits >= 5
            ? { neutralProgress: true }
            : {}),
          urgentForScore:
            input.playerView.own.credits < 5 && scoreProjects.length > 0,
          evidenceCode:
            input.playerView.own.credits < 5
              ? "corp_visible_minimum_reserve_gap"
              : "corp_neutral_credit_progress_available",
        },
      ]
    : [];
  const virusPressure: CorpPlanDomain["virusPressure"] = candidates.some(
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
  const punishCampaigns = uniqueBy(
    punishSignals(candidates),
    (signal) => signal.campaignId,
  );
  const ambushes: CorpPlanDomain["ambushes"] = uniqueBy(
    candidates.flatMap((candidate) => {
      if (!candidate.sourceDefinitionId) return [];
      const roles = rolesForDeckDoctrineCard(candidate.sourceDefinitionId);
      if (!roles.some((role) => role.includes("ambush"))) return [];
      const serverId = candidateTargetIds(candidate).find(isServerId);
      if (!serverId) return [];
      return [
        {
          ambushId: `ambush:${candidate.sourceCardInstanceId ?? candidate.sourceDefinitionId}:${serverId}`,
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
    }),
    (signal) => signal.ambushId,
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
      : [
          ...(input.playerView.own.gripOrHq.length < 3 &&
          input.playerView.own.stackOrRdCount > 0 &&
          candidates.some(
            (candidate) => candidate.semanticActionType === "draw.card",
          )
            ? [
                {
                  handPlanId: "draw-for-corp-plan",
                  phase: "draw_for_plan" as const,
                  agendaCount: ownAgendas,
                  handSize: input.playerView.own.gripOrHq.length,
                  maximumHandSize: input.playerView.own.maxHandSize,
                  concretePurposeCode:
                    "Find a concrete score, defense, or economy component.",
                  value: 30,
                  evidenceCode: "corp_low_hand_requires_plan_material",
                },
              ]
            : []),
          ...corpCardDevelopmentSignals(input, candidates, ownAgendas),
        ];
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
  scorelineFeasibility: CorpScorelineFeasibility | undefined,
): CorpScoreProjectSignal[] {
  if (
    candidate.semanticActionType === "install.card" &&
    candidate.sourceDefinitionId &&
    rolesForDeckDoctrineCard(candidate.sourceDefinitionId).some(
      deckDoctrineRoleIsAgenda,
    )
  ) {
    const serverId = candidateTargetIds(candidate).find(isServerId);
    const sameTurnCloseout = corpScorelineActionCanCloseThisTurn(
      scorelineFeasibility,
      candidate.actionId,
    );
    const protectedRemote =
      serverId !== undefined &&
      (input.playerView.servers.find((server) => server.id === serverId)?.ice
        .length ?? 0) > 0;
    return [
      {
        projectId: `agenda:${candidate.sourceCardInstanceId ?? candidate.sourceDefinitionId}:${serverId ?? "unbound"}`,
        agendaDefinitionId: candidate.sourceDefinitionId,
        ...(serverId ? { serverId } : {}),
        phase: "install_agenda",
        sameTurnCloseout,
        terminalScore: false,
        feasible:
          sameTurnCloseout ||
          (protectedRemote && input.playerView.own.credits >= 3),
        evidenceCode: "own_visible_legal_agenda_install",
      },
    ];
  }
  if (
    candidate.semanticActionType === "score.advance_card" ||
    candidate.semanticActionType === "score.agenda"
  ) {
    const target =
      candidate.sourceCardInstanceId ??
      candidateTargetIds(candidate).find(
        (targetId) => serverForInstalledCard(input, targetId) !== undefined,
      );
    if (!target) return [];
    const serverId = serverForInstalledCard(input, target);
    const sameTurnCloseout =
      candidate.semanticActionType === "score.agenda" ||
      corpScorelineActionCanCloseThisTurn(
        scorelineFeasibility,
        candidate.actionId,
      );
    return [
      {
        projectId: `agenda:${target}:${serverId ?? "unbound"}`,
        agendaDefinitionId: candidate.sourceDefinitionId ?? target,
        agendaInstanceId: target,
        ...(serverId ? { serverId } : {}),
        phase:
          candidate.semanticActionType === "score.agenda"
            ? "score_agenda"
            : "advance_agenda",
        sameTurnCloseout,
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
        campaignId: `punish:${candidate.sourceCardInstanceId ?? candidate.sourceDefinitionId ?? phase}:${phase}`,
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
    semantic === "draw.mandatory" ||
    semantic === "run.continue" ||
    semantic === "breaker.boost_strength" ||
    semantic === "breaker.break_subroutine" ||
    semantic.startsWith("access.") ||
    semantic === "corp_window.decline_rez" ||
    semantic === "run.jack_out" ||
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

function attachActiveRunContext(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): ActionSemanticCandidate[] {
  const serverId = input.playerView.run?.attackedServerId;
  if (!serverId) return [...candidates];
  return candidates.map((candidate) => {
    if (candidate.runProjectionSummary || !isRunWindowSemantic(candidate)) {
      return candidate;
    }
    return {
      ...candidate,
      runProjectionSummary: {
        serverId,
        serverKind:
          serverId === "hq" || serverId === "rd" || serverId === "archives"
            ? serverId
            : "remote",
        source: "target_context",
        evidence: ["active_run_server_from_player_view"],
      },
      evidence: [...candidate.evidence, "active_run_server_from_player_view"],
    };
  });
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
  const selectedChoices = dependencies.selectedChoicesForDecision(
    input,
    action,
  );
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
  deckCapabilities: DeckCapabilityProfile,
  strategicIntent: RunnerStrategicIntentProfile,
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
  if (
    (strategicIntent.setupEngine ?? []).includes("runner.rig_first") ||
    (strategicIntent.setupEngine ?? []).includes(
      "runner.search_breaker_setup",
    ) ||
    strategicIntent.executionStyle === "runner.setup_first"
  ) {
    const matrix = deckCapabilities.runner?.breakerCoverageMatrix;
    for (const [coverage, role] of [
      ["wall", "breaker_wall"],
      ["code_gate", "breaker_code_gate"],
      ["sentry", "breaker_sentry"],
    ] as const) {
      const state = matrix?.[coverage];
      if (
        !state ||
        state.installed ||
        installedRoles.has(role) ||
        (!state.inDeckKnown && !state.inHand)
      ) {
        continue;
      }
      const existing = result.get(role);
      if (existing) {
        if (
          existing.priorityClass !== "P2" &&
          state.inHand &&
          existing.priorityClass === "P5"
        ) {
          result.set(role, { ...existing, priorityClass: "P4" });
        }
        continue;
      }
      result.set(role, {
        gapId: `coverage:${role}`,
        requiredRole: role,
        priorityClass: state.inHand ? "P4" : "P5",
        evidenceCode: `deck_strategy_open_${coverage}_coverage`,
        deckHasAnswer: state.inDeckKnown || state.inHand,
      });
    }
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
  const installedCounters = (input.playerView.opponent.rig ?? []).reduce(
    (sum, card) => sum + (card.counters?.virus ?? 0),
    0,
  );
  const identityCounters =
    input.playerView.own.identity.counterDisplays?.reduce((sum, display) => {
      if (display.displayKind !== "virus") return sum;
      const amount = Math.max(0, Math.floor(display.amount ?? 0));
      const activeThreshold =
        display.counterType === "highlighter" ||
        display.counterType === "garbage" ||
        display.counterType === "cascade"
          ? 2
          : 1;
      return amount >= activeThreshold ? sum + amount : sum;
    }, 0) ?? 0;
  return installedCounters + identityCounters;
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

function uniqueBy<T>(
  values: readonly T[],
  keyForValue: (value: T) => string,
): T[] {
  return [
    ...new Map(values.map((value) => [keyForValue(value), value])).values(),
  ];
}

function uniqueScoreProjects(
  values: readonly CorpScoreProjectSignal[],
): CorpScoreProjectSignal[] {
  const phaseRank: Record<CorpScoreProjectSignal["phase"], number> = {
    install_agenda: 1,
    advance_agenda: 2,
    score_agenda: 3,
  };
  const byProject = new Map<string, CorpScoreProjectSignal>();
  for (const value of values) {
    const previous = byProject.get(value.projectId);
    if (!previous || phaseRank[value.phase] > phaseRank[previous.phase]) {
      byProject.set(value.projectId, value);
    }
  }
  return [...byProject.values()];
}

function corpCardDevelopmentSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  agendaCount: number,
): CorpPlanDomain["handManagement"] {
  return uniqueBy(
    candidates.flatMap((candidate) => {
      if (
        !candidate.sourceDefinitionId ||
        !candidate.sourceCardInstanceId ||
        ![
          "install.card",
          "play.corp_operation",
          "card_ability.trigger",
        ].includes(candidate.semanticActionType)
      ) {
        return [];
      }
      const roles = rolesForDeckDoctrineCard(candidate.sourceDefinitionId);
      if (
        roles.some(
          (role) =>
            deckDoctrineRoleIsAgenda(role) ||
            role === "corp_install_ice" ||
            role.includes("ambush"),
        )
      ) {
        return [];
      }
      const immediateEconomy =
        (candidate.economyProjection?.netLiquidCreditGain ?? 0) > 0;
      if (
        candidate.semanticActionType === "install.card" &&
        input.playerView.own.credits < 3 &&
        !immediateEconomy
      ) {
        return [];
      }
      return [
        {
          handPlanId: `develop:${candidate.sourceCardInstanceId}`,
          phase: "develop_card" as const,
          sourceDefinitionIds: [candidate.sourceDefinitionId],
          sourceInstanceId: candidate.sourceCardInstanceId,
          agendaCount,
          handSize: input.playerView.own.gripOrHq.length,
          maximumHandSize: input.playerView.own.maxHandSize,
          concretePurposeCode: `Develop ${candidate.sourceDefinitionId} for ${roles[0] ?? candidate.semanticActionType}.`,
          value: Math.max(
            10,
            (candidate.economyProjection?.netLiquidCreditGain ?? 0) * 10,
          ),
          evidenceCode: `corp_card_development:${roles[0] ?? candidate.semanticActionType}`,
        },
      ];
    }),
    (signal) => signal.handPlanId,
  );
}

function difficultyLevel(input: AiDecisionInput): number {
  if (input.difficulty === "easy") return 1;
  if (input.difficulty === "hard") return 3;
  return 2;
}
