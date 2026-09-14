import { RUNNER_BREAKER_COVERAGE_ROLES } from "../../plans/runner-coverage-contracts";
import {
  runnerCandidateSourceDefinitionId,
  runnerInstallSourceInstanceId,
} from "../../runtime/runner-action-source-facts";
import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { rolesForDeckDoctrineCard } from "../../deck-doctrine-card-roles";
import type {
  BreakerCapability,
  DeckCapabilityProfile,
} from "../../deck-capabilities";
import type { RunnerRunTargetEvaluation } from "../../runner-run-target-evaluation";
import { runnerInstallDefinitionCoversCoverageGap } from "./coverage-plan-module";
import {
  runnerRolesCoverCoverageGap,
  type RunnerCoverageGapSignal,
} from "../../plans/runner-coverage-contracts";
import { visibleCardCoversRequiredCoverage } from "./runner-search-coverage-need";
import {
  assessKnownRezzedIcePath,
  runnerKnownPathAssessmentIsCostNoAccess,
} from "../../visible-run-analysis";
import { runnerVisibleDeckBreaker } from "./coverage-card-facts";
import { runnerBreakerCapabilityCoversRole } from "./coverage-card-facts";
export type RunnerCostEffectiveCoverageRecovery = Readonly<{
  requiredRole: RunnerCoverageGapSignal["requiredRole"];
  totalRecoveryCost: number;
  remotePreparation?: true;
  visibleAnswer?: VisibleCard;
  deckHasAlternative: boolean;
  targetDefinitionId?: string;
  recoveryMode:
    | "install_visible_answer"
    | "search_known_alternative"
    | "draw_for_known_role";
  evidenceCodes: string[];
}>;

export function runnerCostEffectiveCoverageRecovery(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerRunTargetEvaluation,
  deckCapabilities: DeckCapabilityProfile,
): RunnerCostEffectiveCoverageRecovery | undefined {
  // Missing coverage identifies one blocking role. Cost recovery instead
  // compares every role against the entire known path: a cheaper answer to
  // another ICE can make that same path payable. Preserve the existing
  // visible-answer/search/draw order, then compare the complete cost.
  const modeOrder = {
    install_visible_answer: 0,
    search_known_alternative: 1,
    draw_for_known_role: 2,
  };
  return RUNNER_BREAKER_COVERAGE_ROLES.flatMap((role) => {
    const recovery = runnerCostEffectiveCoverageRecoveryForRole(
      input,
      candidates,
      evaluation,
      role,
      deckCapabilities,
    );
    return recovery ? [recovery] : [];
  }).sort(
    (left, right) =>
      modeOrder[left.recoveryMode] - modeOrder[right.recoveryMode] ||
      left.totalRecoveryCost - right.totalRecoveryCost ||
      RUNNER_BREAKER_COVERAGE_ROLES.findIndex(
        (role) => role === left.requiredRole,
      ) -
        RUNNER_BREAKER_COVERAGE_ROLES.findIndex(
          (role) => role === right.requiredRole,
        ),
  )[0];
}

export function runnerCostEffectiveCoverageRecoveryForRole(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerRunTargetEvaluation,
  role: RunnerCoverageGapSignal["requiredRole"],
  deckCapabilities: DeckCapabilityProfile,
): RunnerCostEffectiveCoverageRecovery | undefined {
  if (
    evaluation.pathPassability !== "blocked_unpayable" ||
    evaluation.pathCost <= 0 ||
    !Number.isSafeInteger(evaluation.pathCost) ||
    evaluation.knownAccessState === "known_no_current_payoff" ||
    evaluation.accessPayoff === "known_low_value" ||
    evaluation.accessPayoffContestable === false
  ) {
    return undefined;
  }
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === evaluation.targetServerId,
  );
  if (
    !server ||
    server.ice.length === 0 ||
    server.ice.some((ice) => !ice.known || ice.rezzed !== true)
  ) {
    return undefined;
  }
  const installedDefinitionIds = new Set(
    (input.playerView.own.rig ?? [])
      .filter((card) =>
        runnerRolesCoverCoverageGap(
          rolesForDeckDoctrineCard(card.definitionId ?? ""),
          role,
        ),
      )
      .flatMap((card) => (card.definitionId ? [card.definitionId] : [])),
  );
  if (installedDefinitionIds.size === 0) return undefined;

  const visibleOptions = input.playerView.own.gripOrHq
    .filter(
      (card) =>
        card.known &&
        // An unaffordable visible answer may still create its existing
        // fund-install need. Once affordable, bind only a legal installation.
        ((card.installCost ?? 0) > input.playerView.own.credits ||
          candidates.some(
            (candidate) =>
              candidate.semanticActionType === "install.card" &&
              candidate.costProfile.costKnownStatus === "known" &&
              input.legalActions.some(
                (action) =>
                  action.actionId === candidate.actionId &&
                  runnerInstallSourceInstanceId(candidate, action) ===
                    card.instanceId,
              ),
          )) &&
        Number.isSafeInteger(card.installCost) &&
        (card.installCost ?? -1) >= 0 &&
        visibleCardCoversRequiredCoverage(card, role, (definitionId) =>
          rolesForDeckDoctrineCard(definitionId ?? ""),
        ),
    )
    .flatMap((card) => {
      const installCost = card.installCost;
      if (installCost === undefined) return [];
      const path = assessKnownRezzedIcePath(
        server.ice,
        [...(input.playerView.own.rig ?? []), card],
        evaluation.pathCost,
        server.root,
        input.playerView.opponent.credits,
      );
      const breakCost = path.visibleBreakCost;
      if (
        breakCost === undefined ||
        (!path.canReachAccess && !runnerKnownPathAssessmentIsCostNoAccess(path))
      ) {
        return [];
      }
      const totalRecoveryCost = installCost + breakCost;
      return totalRecoveryCost < evaluation.pathCost
        ? [{ card, totalRecoveryCost, breakCost }]
        : [];
    })
    .sort(
      (left, right) =>
        left.totalRecoveryCost - right.totalRecoveryCost ||
        left.card.instanceId.localeCompare(right.card.instanceId),
    );
  const visibleAnswer = visibleOptions[0];
  const deckAlternative = runnerCostEffectiveDeckCoverageAlternative(
    input,
    server,
    deckCapabilities,
    role,
    installedDefinitionIds,
    evaluation.pathCost,
  );
  if (!visibleAnswer && !deckAlternative) return undefined;

  const searchToolIds = new Set(
    (deckCapabilities.runner?.searchAccess.tools ?? [])
      .filter(
        (tool) =>
          tool.canSearchBreakers && tool.legalNow && tool.status !== "in_deck",
      )
      .map((tool) => tool.cardId),
  );
  const searchRouteAvailable =
    deckAlternative !== undefined &&
    candidates.some((candidate) => {
      const sourceDefinitionId = runnerCandidateSourceDefinitionId(
        input,
        candidate,
      );
      return (
        sourceDefinitionId !== undefined &&
        searchToolIds.has(sourceDefinitionId) &&
        candidate.semanticActionType !== "install.card"
      );
    });
  const recoveryMode = visibleAnswer
    ? "install_visible_answer"
    : searchRouteAvailable
      ? "search_known_alternative"
      : "draw_for_known_role";
  const deckAlternativeOperatingCost = deckAlternative?.breakCost;
  return {
    requiredRole: role,
    totalRecoveryCost:
      visibleAnswer?.totalRecoveryCost ?? deckAlternative!.totalCost,
    ...(visibleAnswer ? { visibleAnswer: visibleAnswer.card } : {}),
    deckHasAlternative: deckAlternative !== undefined,
    ...(deckAlternative
      ? { targetDefinitionId: deckAlternative.breaker.cardId }
      : {}),
    recoveryMode,
    evidenceCodes: [
      `coverage_efficiency_target:${evaluation.targetServerId}`,
      `coverage_efficiency_current_known_path_cost:${evaluation.pathCost}`,
      `coverage_efficiency_current_funding_gap:${Math.max(0, evaluation.routeQuote?.fundingGap ?? 0)}`,
      `coverage_efficiency_installed_definition_count:${installedDefinitionIds.size}`,
      ...(visibleAnswer
        ? [
            `coverage_efficiency_visible_answer:${visibleAnswer.card.instanceId}`,
            `coverage_efficiency_visible_answer_install_cost:${visibleAnswer.card.installCost}`,
            `coverage_efficiency_visible_answer_break_cost:${visibleAnswer.breakCost}`,
            `coverage_efficiency_visible_answer_total_cost:${visibleAnswer.totalRecoveryCost}`,
          ]
        : []),
      ...(deckAlternative && deckAlternativeOperatingCost !== undefined
        ? [
            `coverage_efficiency_deck_alternative:${deckAlternative.breaker.cardId}`,
            `coverage_efficiency_deck_alternative_operating_cost:${deckAlternativeOperatingCost}`,
            `coverage_efficiency_deck_alternative_total_known_cost:${deckAlternative.totalCost}`,
          ]
        : []),
      `coverage_efficiency_recovery_mode:${recoveryMode}`,
    ],
  };
}

export function runnerCostEffectiveDeckCoverageAlternative(
  input: AiDecisionInput,
  server: AiDecisionInput["playerView"]["servers"][number],
  deckCapabilities: DeckCapabilityProfile,
  role: RunnerCoverageGapSignal["requiredRole"],
  installedDefinitionIds: ReadonlySet<string>,
  currentKnownPathCost: number,
):
  | { breaker: BreakerCapability; breakCost: number; totalCost: number }
  | undefined {
  const inventory = deckCapabilities.runner?.breakerInventory ?? [];
  return inventory
    .flatMap((breaker) => {
      const projectedBreaker = runnerVisibleDeckBreaker(breaker);
      if (!projectedBreaker) return [];
      const path = assessKnownRezzedIcePath(
        server.ice,
        [...(input.playerView.own.rig ?? []), projectedBreaker],
        Math.max(currentKnownPathCost, input.playerView.own.credits),
        server.root,
        input.playerView.opponent.credits,
      );
      const breakCost = path.visibleBreakCost;
      const eligible =
        breaker.confidence === "high" &&
        breaker.quantityKnownInDeck > 0 &&
        breaker.locations.includes("in_deck") &&
        !installedDefinitionIds.has(breaker.cardId) &&
        runnerBreakerCapabilityCoversRole(breaker, role) &&
        Number.isSafeInteger(breaker.installCost) &&
        (breaker.installCost ?? -1) >= 0 &&
        breakCost !== undefined &&
        path.canReachAccess &&
        (breaker.installCost ?? 0) + breakCost < currentKnownPathCost;
      return eligible
        ? [
            {
              breaker,
              breakCost,
              totalCost: (breaker.installCost ?? 0) + breakCost,
            },
          ]
        : [];
    })
    .sort(
      (left, right) =>
        left.totalCost - right.totalCost ||
        left.breaker.cardId.localeCompare(right.breaker.cardId),
    )[0];
}

export function runnerCoverageInstallActionValues(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  serverId: string | undefined,
  role: RunnerCoverageGapSignal["requiredRole"],
): Record<string, number> {
  const values: Record<string, number> = {};
  for (const candidate of candidates) {
    if (candidate.semanticActionType !== "install.card") continue;
    const action = input.legalActions.find(
      (entry) => entry.actionId === candidate.actionId,
    );
    if (!action) continue;
    const definitionId = runnerCandidateSourceDefinitionId(input, candidate);
    if (
      !definitionId ||
      !runnerInstallDefinitionCoversCoverageGap(
        definitionId,
        rolesForDeckDoctrineCard(definitionId),
        role,
        action.payload?.selectedSubtype,
      )
    )
      continue;
    const sourceInstanceId = candidate.sourceCardInstanceId;
    const card = input.playerView.own.gripOrHq.find(
      (entry) => entry.instanceId === sourceInstanceId,
    );
    const cost =
      candidate.costProfile.costKnownStatus === "known"
        ? (candidate.costProfile.creditCost ?? 0)
        : 0;
    if (!card || cost > input.playerView.own.credits) {
      values[candidate.actionId] = 100 - cost;
      continue;
    }
    const targetId = candidate.targetContext?.selectedTargets?.[0]?.targetId;
    const projectedCard = {
      ...card,
      ...(typeof action.payload?.selectedSubtype === "string"
        ? { selectedSubtype: action.payload.selectedSubtype }
        : {}),
      ...(typeof targetId === "string"
        ? { selectedTargetCardId: targetId }
        : {}),
    };
    const eligibleServers = input.playerView.servers.filter(
      (server) =>
        (serverId === undefined || server.id === serverId) &&
        server.ice.every((ice) => ice.known && ice.rezzed) &&
        (targetId === undefined ||
          server.ice.some((ice) => ice.instanceId === targetId)),
    );
    if (eligibleServers.length === 0) {
      values[candidate.actionId] = 100 - cost;
      continue;
    }
    values[candidate.actionId] = Math.max(
      ...eligibleServers.map((server) => {
        const path = assessKnownRezzedIcePath(
          server.ice,
          [...(input.playerView.own.rig ?? []), projectedCard],
          input.playerView.own.credits - cost,
          server.root,
          input.playerView.opponent.credits,
        );
        if (path.canReachAccess) {
          return 300 - cost - (path.visibleBreakCost ?? 0);
        }
        if (runnerKnownPathAssessmentIsCostNoAccess(path)) {
          return 200 - cost - (path.visibleBreakCost ?? 0);
        }
        return 10 - cost;
      }),
    );
  }
  return values;
}
