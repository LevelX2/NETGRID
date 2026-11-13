import { visibleRunnerNextTurnPreparationCreditGain } from "@netgrid/engine";
import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { corpRemoteHasEngineQuotedFundableScoreFriction } from "../score/corp-score-defense-continuity";
import { type CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import {
  assessEngineCertifiedPostRezIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../../visible-run-analysis";
import { runnerRunPathCreditBudgetAfterEncounter } from "../../run-analysis/visible-run-credit-budget";
import { corpEffectiveDefenseActivationCredits } from "../../runtime/corp-exact-ice-rez-route";
import { assessCorpScoreRushRisk } from "../../runtime/corp-score-rush-risk";
import { isFiniteNonNegativeInteger } from "../../runtime/exact-action-cost-facts";
import {
  visiblePreparedRunnerBreakerCandidates,
  visibleRunnerInRunStackInstallPotential,
} from "../../runtime/corp-score-protection-assessment";
import { visibleRunnerHeapBreakerPreparations } from "../../runtime/corp-public-heap-breaker-preparation";
type CorpCertifiedDefenseLayer = Readonly<{
  iceInstanceId: string;
  credits: number;
  agendaPoints: number;
}>;

export function corpMatureRemoteAffordableDefenseLayerCertification(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  serverId: string,
): CorpScoreProjectSignal["scoreHorizonCertification"] | undefined {
  const server = input.playerView.servers.find(
    (candidateServer) => candidateServer.id === serverId,
  );
  const installCredits = candidate.costProfile.creditCost;
  if (
    !server ||
    !isFiniteNonNegativeInteger(installCredits) ||
    installCredits > input.playerView.own.credits
  ) {
    return undefined;
  }
  const layers = server.ice.flatMap((ice) => {
    const layer = corpCertifiedDefenseLayer(input, serverId, ice);
    return layer ? [layer] : [];
  });
  const availableCredits = input.playerView.own.credits - installCredits;
  const availableAgendaPoints = input.playerView.own.agendaPoints;
  for (let left = 0; left < layers.length; left += 1) {
    for (let right = left + 1; right < layers.length; right += 1) {
      if (
        layers[left]!.credits + layers[right]!.credits <= availableCredits &&
        layers[left]!.agendaPoints + layers[right]!.agendaPoints <=
          availableAgendaPoints &&
        corpCertifiedDefenseLayerPairProvidesMatureRunnerPath(
          input,
          server,
          [layers[left]!.iceInstanceId, layers[right]!.iceInstanceId],
          availableCredits,
        )
      ) {
        return {
          kind: "affordable_engine_quoted_defense_layers",
          observedAtStateVersion: input.playerView.stateVersion,
          serverId,
          layerInstanceIds: [
            layers[left]!.iceInstanceId,
            layers[right]!.iceInstanceId,
          ],
          requiredCredits: layers[left]!.credits + layers[right]!.credits,
          requiredAgendaPoints:
            layers[left]!.agendaPoints + layers[right]!.agendaPoints,
        };
      }
    }
  }
  return undefined;
}

function corpCertifiedDefenseLayerPairProvidesMatureRunnerPath(
  input: AiDecisionInput,
  server: AiDecisionInput["playerView"]["servers"][number],
  financedLayerInstanceIds: readonly [string, string],
  visibleCorpCredits: number,
): boolean {
  const runnerRig = input.playerView.opponent.rig ?? [];
  if (
    visibleRunnerInRunStackInstallPotential(
      runnerRig,
      input.playerView.opponent.deckCount,
    )
  ) {
    return false;
  }
  if (
    input.playerView.activeSide === "corp" &&
    input.playerView.runnerNextTurnCreditClicks === undefined
  )
    return false;
  const runnerCredits =
    input.playerView.opponent.credits +
    (input.playerView.activeSide === "corp"
      ? visibleRunnerNextTurnPreparationCreditGain(
          runnerRig,
          input.playerView.runnerNextTurnCreditClicks!,
        )
      : 0);
  const prepared = visiblePreparedRunnerBreakerCandidates({
    serverIce: [],
    runnerRig,
    runnerCredits,
    runnerSetAside: input.playerView.specialZones?.setAside ?? [],
    ...(input.playerView.opponent.memoryUsed !== undefined
      ? { runnerMemoryUsed: input.playerView.opponent.memoryUsed }
      : {}),
    ...(input.playerView.opponent.memoryLimit !== undefined
      ? { runnerMemoryLimit: input.playerView.opponent.memoryLimit }
      : {}),
    maximumRunnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
  });
  if (prepared.status === "unknown") return false;
  return [
    { rig: runnerRig, credits: runnerCredits },
    ...prepared.candidates.map((candidate) => ({
      rig: [...runnerRig, candidate.card],
      credits: runnerCredits - candidate.installCreditCost,
    })),
    ...visibleRunnerHeapBreakerPreparations(input).map((candidate) => ({
      rig: [...runnerRig, candidate.card],
      credits: candidate.remainingGeneralCredits,
    })),
  ].every((runner) => {
    const assessment = assessEngineCertifiedPostRezIcePath(
      [...server.ice],
      server.id,
      input.playerView.stateVersion,
      new Set(financedLayerInstanceIds),
      runner.rig,
      runnerRunPathCreditBudgetAfterEncounter({
        ...runnerRunPathCreditBudgetWithVisiblePools(
          runner.credits,
          runner.rig,
          {
            creditPoolHorizon:
              input.playerView.activeSide === "corp"
                ? "next_runner_turn"
                : "current",
          },
        ),
        runOnlyCredits: input.playerView.runnerNextRunBadPublicityCredits ?? 0,
      }),
      [...server.root],
      visibleCorpCredits,
      {
        targetServerId: server.id,
        visibleCorpCredits,
        visibleRemoteServerCount: input.playerView.servers.filter(
          (candidate) =>
            candidate.id !== "hq" &&
            candidate.id !== "rd" &&
            candidate.id !== "archives",
        ).length,
      },
    );
    // A conservative Runner damage break requirement is not an access barrier.
    return (
      !assessment.canReachAccess &&
      assessment.knownPathBlockedOnlyByDamage !== true
    );
  });
}

function corpCertifiedDefenseLayer(
  input: AiDecisionInput,
  serverId: string,
  ice: VisibleCard,
): CorpCertifiedDefenseLayer | undefined {
  if (ice.known === false || ice.type !== "ice") return undefined;
  const quote =
    ice.rezzed === true
      ? ice.effectiveRunQuote
      : ice.effectivePostRezRunQuote?.complete === true &&
          ice.effectivePostRezRunQuote.cardId === ice.instanceId &&
          ice.effectivePostRezRunQuote.targetServerId === serverId &&
          ice.effectivePostRezRunQuote.projectedServerId === serverId &&
          ice.effectivePostRezRunQuote.expiresAtStateVersion ===
            input.playerView.stateVersion
        ? ice.effectivePostRezRunQuote.effectiveRunQuote
        : undefined;
  if (
    !quote ||
    quote.iceInstanceId !== ice.instanceId ||
    quote.iceDefinitionId !== ice.definitionId
  ) {
    return undefined;
  }
  const activationCredits = corpEffectiveDefenseActivationCredits(quote);
  if (activationCredits === undefined) return undefined;
  if (ice.rezzed === true) {
    return {
      iceInstanceId: ice.instanceId,
      credits: activationCredits,
      agendaPoints: 0,
    };
  }
  const rezQuote = ice.effectiveRezCostQuote;
  if (
    rezQuote?.context !== "installed" ||
    rezQuote.cardId !== ice.instanceId ||
    rezQuote.targetServerId !== serverId ||
    rezQuote.projectedServerId !== serverId ||
    rezQuote.expiresAtStateVersion !== input.playerView.stateVersion ||
    rezQuote.complete !== true ||
    !isFiniteNonNegativeInteger(rezQuote.finalCredits) ||
    !isFiniteNonNegativeInteger(rezQuote.mandatoryAdditionalCosts.agendaPoints)
  ) {
    return undefined;
  }
  return {
    iceInstanceId: ice.instanceId,
    credits: rezQuote.finalCredits + activationCredits,
    agendaPoints: rezQuote.mandatoryAdditionalCosts.agendaPoints,
  };
}

/** Certifies a direct next-turn Archives run against one funded, known layer.
 * The projected Archives root is its discard pile.
 * The hand plan owns how terminal agenda exposure changes its discard batch.
 */
export function corpArchivesHasCertifiedPaidAccess(
  input: AiDecisionInput,
  server: AiDecisionInput["playerView"]["servers"][number],
): boolean {
  const view = input.playerView;
  const runnerRig = view.opponent.rig;
  if (
    view.phase !== "corp_discard_phase" ||
    server.id !== "archives" ||
    server.ice.length !== 1 ||
    server.statuses?.some((status) => status.kind === "run_prohibited") ||
    (view.runnerNextTurnCreditClicks ?? 0) < 1 ||
    !runnerRig
  ) {
    return false;
  }
  const ice = server.ice[0]!;
  const rez = ice.effectiveRezCostQuote;
  if (
    ice.rezzed !== true &&
    (rez?.complete !== true || rez.costKind !== "fixed")
  ) {
    return false;
  }
  const layer = corpCertifiedDefenseLayer(input, server.id, ice);
  if (
    !layer ||
    layer.credits > view.own.credits ||
    layer.agendaPoints > view.own.agendaPoints
  ) {
    return false;
  }
  const assessment = assessEngineCertifiedPostRezIcePath(
    [ice],
    server.id,
    view.stateVersion,
    new Set([ice.instanceId]),
    runnerRig,
    runnerRunPathCreditBudgetWithVisiblePools(
      view.opponent.credits,
      runnerRig,
      {
        creditPoolHorizon: "next_runner_turn",
      },
    ),
    [],
    view.own.credits,
    {
      targetServerId: server.id,
      visibleCorpCredits: view.own.credits,
      visibleRemoteServerCount: view.servers.filter(
        (candidate) => !["hq", "rd", "archives"].includes(candidate.id),
      ).length,
    },
  );
  return (
    assessment.assessedKnownIceCount === 1 &&
    assessment.canReachAccess &&
    !assessment.conditionalAccessReasons?.length &&
    !assessment.conditionalRiskReasons?.length &&
    !assessment.preRunPreparation
  );
}

export function corpRemoteHasBoundedStagedIce(
  input: AiDecisionInput,
  serverId: string,
  exposedAgendaPoints: number,
  remainingAdvancementClicks: number | undefined,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) =>
      candidate.id === serverId &&
      !["hq", "rd", "archives"].includes(candidate.id),
  );
  if (!server || remainingAdvancementClicks === undefined) return false;
  const hasNearTermFundableStagedIce =
    corpRemoteHasEngineQuotedFundableScoreFriction(input, serverId, 3);
  if (!hasNearTermFundableStagedIce) return false;
  return (
    assessCorpScoreRushRisk({
      input,
      server,
      agendaPoints: exposedAgendaPoints,
      remainingAdvancementClicks,
    }).admission === "accepted"
  );
}
