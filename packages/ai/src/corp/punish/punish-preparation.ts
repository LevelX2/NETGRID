import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { corpDefinitionHasTraceSource } from "../../runtime/corp-canonical-card-facts";
import {
  candidateTargetIds,
  isCorpInstallServerId,
  isServerId,
  minimumVisiblePlayCost,
  serverForInstalledCard,
  visibleCardIsAgenda,
} from "../../runtime/visible-action-facts";
import { getStructuredTagPunishProfileForCard } from "../../tag-punish-ontology-consumer";

export function corpInstallTargetProfileHasPurpose(
  candidate: ActionSemanticCandidate,
  purpose: string,
): boolean {
  if (!candidate.sourceDefinitionId) return false;
  return (
    AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId)?.targetProfiles?.some(
      (profile) =>
        "schemaVersion" in profile &&
        profile.schemaVersion === "target-profile-v1" &&
        profile.kind === "install_target" &&
        profile.targetType === "server" &&
        profile.timing === "on_install" &&
        profile.purpose === purpose,
    ) === true
  );
}

export function corpFortTraceSupportPlacementIsPreferred(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  const targetServerId = candidateTargetIds(candidate).find(isServerId);
  if (!targetServerId) return false;
  const installableAgendaVisible = input.playerView.own.gripOrHq.some(
    (card) => card.known && visibleCardIsAgenda(input, card),
  );
  if (installableAgendaVisible) return true;
  const protectedEmptyTraceRemote = input.playerView.servers
    .filter(
      (server) =>
        server.id.startsWith("remote_") &&
        server.root.length === 0 &&
        server.ice.some(
          (ice) =>
            corpDefinitionIsTraceSource(ice.definitionId) ||
            ice.effectiveRunQuote?.subroutines.some(
              (subroutine) => subroutine.type === "initiate_trace",
            ) === true,
        ),
    )
    .sort(
      (left, right) =>
        right.ice.length - left.ice.length || left.id.localeCompare(right.id),
    )[0];
  return targetServerId === (protectedEmptyTraceRemote?.id ?? targetServerId);
}

export function corpProtectedEmptyRemoteTagSourcePlacementIsPreferred(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  const targetServerId = candidateTargetIds(candidate).find(
    isCorpInstallServerId,
  );
  if (!targetServerId) return false;
  const protectedEmptyRemote = input.playerView.servers
    .filter(
      (server) =>
        server.id.startsWith("remote_") &&
        server.root.length === 0 &&
        server.ice.length > 0,
    )
    .sort(
      (left, right) =>
        right.ice.length - left.ice.length || left.id.localeCompare(right.id),
    )[0];
  return targetServerId === (protectedEmptyRemote?.id ?? "new_remote");
}

export function corpStrategicFundingPhaseBlocksPreparation(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  legalAction: AiDecisionInput["legalActions"][number],
): boolean {
  const intent = (input as AiDecisionInputWithDeckCapabilities)
    .ownStrategicIntentState;
  if (
    intent?.side !== "corp" ||
    intent.phase !== "fund" ||
    intent.reserve.kind !== "credits" ||
    intent.reserve.satisfied
  ) {
    return false;
  }
  const exactFundedPunishEngineActivation =
    intent.primaryStrategy.strategyId === "corp.tag_trace_punish" &&
    intent.targetVector.kind === "tag" &&
    candidate.semanticActionType === "corp_window.rez" &&
    candidate.cardContextFunctionalEffects?.some(
      (effect) =>
        effect.kind === "tag_source" &&
        effect.scope === "runner" &&
        effect.timing === "runner_turn",
    ) === true &&
    candidate.cardContextFunctionalEffects.some(
      (effect) =>
        effect.kind === "remote_tax" &&
        effect.scope === "runner" &&
        effect.resource === "credits" &&
        effect.timing === "runner_turn",
    ) &&
    candidate.sourceCardInstanceId !== undefined &&
    serverForInstalledCard(input, candidate.sourceCardInstanceId) !== undefined;
  if (exactFundedPunishEngineActivation) return false;
  return legalAction.costs.some((cost) => (cost.credits ?? 0) > 0);
}

export function corpDefinitionIsTraceSupport(
  definitionId: string | undefined,
): boolean {
  if (!definitionId) return false;
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  return (
    hint?.actionTacticSignals?.includes("trace.credit_support") === true ||
    hint?.functionSignals?.includes("economy.trace_credit") === true
  );
}

export function corpDefinitionIsTraceSource(
  definitionId: string | undefined,
): boolean {
  return corpDefinitionHasTraceSource(definitionId);
}

export function corpTraceSupportTargetHasVisibleTraceSource(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  const sourceServerId = candidate.sourceCardInstanceId
    ? serverForInstalledCard(input, candidate.sourceCardInstanceId)
    : undefined;
  const serverId =
    candidateTargetIds(candidate).find(isServerId) ?? sourceServerId;
  if (!serverId || serverId === "new_remote") return false;
  const server = input.playerView.servers.find(
    (candidateServer) => candidateServer.id === serverId,
  );
  if (!server) return false;
  return server.ice.some(
    (ice) =>
      corpDefinitionIsTraceSource(ice.definitionId) ||
      ice.effectiveRunQuote?.subroutines.some(
        (subroutine) => subroutine.type === "initiate_trace",
      ) === true,
  );
}

export function visibleTagPayoffConversionIsAffordable(
  input: AiDecisionInput,
  tagSourceAction: AiDecisionInput["legalActions"][number],
): boolean {
  const sourceCost = tagSourceAction.costs.reduce<{
    credits: number;
    clicks: number;
  }>(
    (total, entry) => ({
      credits: total.credits + (entry.credits ?? 0),
      clicks: total.clicks + (entry.clicks ?? 0),
    }),
    { credits: 0, clicks: 0 },
  );
  const remainingCredits = input.playerView.own.credits - sourceCost.credits;
  const remainingClicks = input.playerView.own.clicks - sourceCost.clicks;
  if (remainingClicks < 1 || remainingCredits < 0) return false;
  return input.playerView.own.gripOrHq.some((card) => {
    const profile = getStructuredTagPunishProfileForCard(card.definitionId);
    if (!profile?.payoff || !profile.requiresRunnerTagged || !card.known)
      return false;
    const minimumPlayCost = minimumVisiblePlayCost(card);
    return minimumPlayCost !== undefined && minimumPlayCost <= remainingCredits;
  });
}
