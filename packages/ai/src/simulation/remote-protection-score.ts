import type { AiDecisionInput, GameState } from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";
import { isProtectionDefinitionId } from "../runtime/protection-definition";
import { rezCostForDefinitionId } from "../runtime/simulation-card-target";

export function remoteProtectionScoreForSimulation(
  state: GameState,
  input: AiDecisionInput,
  serverId: string,
  actionCreditCostValue: number,
): number {
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return 0;
  const visibleServer = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const rezzedIce = server.ice.filter(
    (cardId) => state.cardInstances[cardId]?.rezzed === true,
  ).length;
  const unrezzedIce = server.ice.length - rezzedIce;
  const cheapestRez = Math.min(
    ...server.ice
      .filter((cardId) => state.cardInstances[cardId]?.rezzed !== true)
      .map((cardId) =>
        rezCostForDefinitionId(state.cardInstances[cardId]?.definitionId),
      )
      .filter((cost) => cost > 0),
  );
  const hasAffordableUnrezzed =
    Number.isFinite(cheapestRez) &&
    state.corp.credits - actionCreditCostValue >= cheapestRez;
  const rootProtection = server.root.filter((cardId) =>
    isProtectionDefinitionId(state.cardInstances[cardId]?.definitionId),
  ).length;
  const risk = runnerContestRiskForSimulation(state, input, serverId);
  return (
    Math.min(server.ice.length, 3) * 22 +
    rezzedIce * 32 +
    (unrezzedIce > 0 && hasAffordableUnrezzed ? 28 : 0) +
    rootProtection * 35 +
    (visibleServer?.ice.some((ice) => ice.rezzed === true) ? 8 : 0) +
    (risk === "low" ? 35 : risk === "medium" ? 5 : -45)
  );
}

export function runnerContestRiskForSimulation(
  state: GameState,
  input: AiDecisionInput,
  serverId: string,
): "low" | "medium" | "high" | "unknown" {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return "unknown";
  if (server.ice.length <= 0) return "high";
  const runnerCredits = input.playerView.opponent.credits;
  const breakers =
    input.playerView.opponent.rig?.filter((card) =>
      card.definitionId
        ? runtimeCardHasSubtype(card.definitionId, "icebreaker")
        : false,
    ).length ?? 0;
  const rezzedIce =
    state.corp.servers
      .find((candidate) => candidate.id === serverId)
      ?.ice.filter((cardId) => state.cardInstances[cardId]?.rezzed === true)
      .length ?? 0;
  if (runnerCredits >= 6 && breakers > 0) return "high";
  if (rezzedIce > 0 || runnerCredits <= 3 || breakers === 0) return "low";
  return "medium";
}

function runtimeCardHasSubtype(definitionId: string, subtype: string): boolean {
  return (
    RUNTIME_CARDS[definitionId]?.subtypes.some(
      (entry) => entry.toLocaleLowerCase("en-US") === subtype,
    ) ?? false
  );
}
