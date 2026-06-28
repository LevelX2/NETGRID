import type { Side } from "@netgrid/shared";
import { CARD_ROLES_BY_CARD, RUNTIME_CARDS, createAiHintsByCard } from "./ai-hints";
import { rolesMatch } from "./runtime/role-match";

const AI_HINTS = createAiHintsByCard();

export function deckDoctrineCardIsAiSupported(cardId: string): boolean {
  return RUNTIME_CARDS[cardId]?.statuses.ai_supported === true;
}

export function rolesForDeckDoctrineCard(cardId: string): string[] {
  if (!cardId) return [];
  const runtimeCard = RUNTIME_CARDS[cardId];
  const roleRecord = CARD_ROLES_BY_CARD.get(cardId);
  const hint = AI_HINTS.get(cardId);
  const inferred = inferredRoles(runtimeCard);
  return sortedUnique([
    ...(roleRecord?.roles ?? []),
    ...(hint?.roles ?? []),
    ...(hint?.planRoles ?? []),
    ...inferred,
  ]);
}

export function deckDoctrineRoleIsAgenda(role: string): boolean {
  return (
    role === "agenda" ||
    role === "corp_score_agenda" ||
    role === "score_agenda" ||
    rolesMatch([role], ["agenda_"])
  );
}

export function deckDoctrineRoleIsBreaker(role: string): boolean {
  return rolesMatch([role], ["breaker_"]);
}

export function deckDoctrineRoleIsIce(role: string): boolean {
  return rolesMatch([role], ["ice", "etr_ice", "taxing_ice"]);
}

function inferredRoles(
  card:
    | {
        side?: Side;
        type?: string;
        subtypes?: string[];
        subroutines?: Array<{ type?: string }>;
      }
    | undefined,
): string[] {
  if (!card) return [];
  const roles: string[] = [];
  if (card.side === "corp") {
    if (card.type === "agenda") roles.push("agenda", "corp_score_agenda");
    if (card.type === "ice") roles.push("corp_install_ice", "corp_rez_ice");
    if (card.type === "asset") roles.push("economy_asset", "asset_trash_target");
    if (card.type === "upgrade") roles.push("upgrade", "remote_support");
    if (card.type === "operation") roles.push("economy_operation");
    for (const subtype of card.subtypes ?? []) {
      if (subtype === "barrier") roles.push("barrier_ice");
      if (subtype === "code gate") roles.push("code_gate_ice");
      if (subtype === "sentry") roles.push("sentry_ice");
      if (subtype === "ambush") roles.push("ambush");
    }
    if (card.subroutines?.some((subroutine) => subroutine.type === "end_the_run")) {
      roles.push("etr_ice");
    }
  } else if (card.side === "runner") {
    if (card.type === "program") roles.push("runner_program", "setup_runner");
    if (card.type === "hardware") roles.push("setup_hardware");
    if (card.type === "resource") roles.push("runner_resource");
    if (card.type === "event") roles.push("run_pressure");
  }
  return roles;
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}
