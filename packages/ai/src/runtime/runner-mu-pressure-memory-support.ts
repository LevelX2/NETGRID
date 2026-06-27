import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import { rolesMatch } from "./role-match";

export function isRunnerProgramInstallActionForMuPressure(
  action: LegalAction,
  source: VisibleCard | undefined,
  visibleMemoryCost: (card: VisibleCard | undefined) => number,
): boolean {
  if (action.side !== "runner" || action.type !== "install_card") return false;
  return source?.type === "program" || visibleMemoryCost(source) > 0;
}

export function isRunnerMemorySupportAction(
  action: LegalAction,
  source: VisibleCard | undefined,
  isMemorySupportCard: (card: VisibleCard | undefined) => boolean,
): boolean {
  if (action.side !== "runner" || action.type !== "install_card") return false;
  return isMemorySupportCard(source);
}

export function isRunnerMemorySupportCard(
  card: VisibleCard | undefined,
  roles: readonly string[],
  safeNonNegativeInteger: (value: number | undefined) => number,
): boolean {
  if (!card || card.known === false) return false;
  const text = [
    card.title,
    card.definitionId,
    card.type,
    ...(card.subtypes ?? []),
    card.rulesText,
    ...roles,
  ]
    .filter((entry): entry is string => typeof entry === "string")
    .join(" ")
    .toLowerCase();
  return (
    safeNonNegativeInteger(card.memoryLimitBonus) > 0 ||
    roles.some((role) => role === "memory" || role === "memory_support") ||
    /\b(memory|mu)\b|mem chip/.test(text)
  );
}

export function isUsefulRunnerProgramInHandForMuPressure(
  input: AiDecisionInput,
  card: VisibleCard,
  dependencies: {
    visibleMemoryCost: (card: VisibleCard | undefined) => number;
    rolesForCardId: (definitionId: string | undefined) => readonly string[];
    isRunnerPressureRole: (role: string) => boolean;
    isRunnerEconomyRole: (role: string) => boolean;
  },
): boolean {
  if (card.known === false || card.type !== "program") return false;
  if (dependencies.visibleMemoryCost(card) <= 0) return false;
  if (
    card.definitionId &&
    (input.playerView.own.rig ?? []).some(
      (installed) => installed.definitionId === card.definitionId,
    )
  ) {
    return false;
  }
  const roles = dependencies.rolesForCardId(card.definitionId);
  const subtypes = (card.subtypes ?? []).map((subtype) =>
    subtype.toLowerCase(),
  );
  return (
    roles.length === 0 ||
    rolesMatch(roles, [
      "breaker_",
      "setup",
      "build_rig",
      "memory",
      "memory_support",
      "draw",
      "search",
      "defense",
      "protection",
      "hosting",
      "recovery",
    ]) ||
    roles.some(
      (role) =>
        dependencies.isRunnerPressureRole(role) ||
        dependencies.isRunnerEconomyRole(role),
    ) ||
    subtypes.some((subtype) =>
      ["icebreaker", "breaker", "decoder", "fracter", "killer"].includes(
        subtype,
      ),
    )
  );
}

export function runnerMissingCreditsForCheapestMemorySupport(
  credits: number,
  memorySupportCards: readonly VisibleCard[],
  visibleInstallCost: (card: VisibleCard | undefined) => number,
): number | undefined {
  const missingCredits = memorySupportCards
    .map((card) => Math.max(0, visibleInstallCost(card) - credits))
    .filter((missing) => missing > 0)
    .sort((left, right) => left - right);
  return missingCredits[0];
}

export function runnerMemorySupportSearchAction(
  action: LegalAction,
  roles: readonly string[],
): boolean {
  if (action.side !== "runner") return false;
  if (
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability" &&
    action.type !== "play_event"
  ) {
    return false;
  }
  return rolesMatch(roles, ["search", "memory"]);
}
