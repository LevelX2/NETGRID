import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { DEMO_CARDS_BY_ID } from "@netgrid/shared";
import { createAiHintsByCard, RUNTIME_CARDS } from "../ai-hints";
import {
  getStructuredRemoteRoleForCard,
  remoteRoleIsNonScoringProtectionKind,
  remoteRoleIsScoringProtectionKind,
} from "../remote-role-ontology-consumer";
import { cardRolesForId } from "../runtime/card-role-lookup";

export type RemoteTrashRole =
  | "economy"
  | "scoring_protection"
  | "run_tax"
  | "remote_capacity"
  | "tag_punish"
  | "ambush"
  | "low_value"
  | "unknown";

const REMOTE_TRASH_ROLE_AI_HINTS = createAiHintsByCard();
const BBS_WHISPERING_CAMPAIGN_DEFINITION_ID =
  "onr_v1_309_bbs-whispering-campaign";

export function remoteTrashRoleForVisibleCard(
  card: VisibleCard,
): RemoteTrashRole {
  if (card.definitionId === "simple_upgrade") return "low_value";
  const structuredRole = getStructuredRemoteRoleForCard(card.definitionId);
  if (structuredRole) {
    if (structuredRole.kind === "remote_capacity") return "remote_capacity";
    if (structuredRole.kind === "asset_economy") return "economy";
    if (structuredRole.kind === "bait" || structuredRole.kind === "ambush")
      return "ambush";
    if (
      structuredRole.kind === "run_tax" ||
      structuredRole.kind === "tax_fort" ||
      structuredRole.kind === "ice_modifier"
    )
      return "run_tax";
    if (
      remoteRoleIsScoringProtectionKind(structuredRole.kind) &&
      !remoteRoleIsNonScoringProtectionKind(structuredRole.kind)
    )
      return "scoring_protection";
  }
  const roles = cardRolesForId(card.definitionId, REMOTE_TRASH_ROLE_AI_HINTS);
  const runtimeDefinition = card.definitionId
    ? RUNTIME_CARDS[card.definitionId]
    : undefined;
  const demoDefinition = card.definitionId
    ? DEMO_CARDS_BY_ID[card.definitionId]
    : undefined;
  const mechanics = [
    ...("mechanics" in (runtimeDefinition ?? {})
      ? ((runtimeDefinition as { mechanics?: string[] } | undefined)
          ?.mechanics ?? [])
      : []),
    ...(demoDefinition?.mechanics ?? []),
  ];
  const subtypes = [
    ...(runtimeDefinition?.subtypes ?? []),
    ...(demoDefinition?.subtypes ?? []),
  ];
  if (
    roles.some(
      (role) =>
        role.includes("agenda_steal_tax") ||
        role.includes("access_tax") ||
        role.includes("remote_agenda_protection") ||
        role.includes("scoring") ||
        role.includes("protect_remote") ||
        role.includes("remote_upgrade_tax"),
    )
  )
    return "scoring_protection";
  if (
    roles.some(
      (role) =>
        role.includes("run_tax") ||
        role.includes("ice_tax") ||
        role.includes("access_tax") ||
        role.includes("server_tax"),
    ) ||
    mechanics.some(
      (mechanic: string) =>
        mechanic.includes("break_subroutine_cost") ||
        mechanic.includes("trash_cost_modifier") ||
        mechanic.includes("trace_bid_credit_source") ||
        mechanic.includes("run_flow"),
    ) ||
    subtypes.some((subtype) => subtype.toLowerCase() === "region")
  )
    return "run_tax";
  if (
    roles.some((role) => role.includes("remote_capacity")) ||
    mechanics.some((mechanic: string) => mechanic.includes("remote_capacity"))
  )
    return "remote_capacity";
  if (roles.some((role) => role.includes("economy"))) return "economy";
  if (
    roles.some(
      (role) =>
        role.includes("tag") ||
        role.includes("trace") ||
        role.includes("punish") ||
        role.includes("damage"),
    )
  )
    return "tag_punish";
  if (roles.some((role) => role.includes("ambush") || role.includes("trap")))
    return "ambush";
  if (roles.some((role) => role.includes("low_value"))) return "low_value";
  if (card.type === "asset" || card.type === "upgrade") return "unknown";
  return "unknown";
}

export function remoteTrashRoleForAccessedVisibleCard(
  input: AiDecisionInput,
  card: VisibleCard,
): RemoteTrashRole {
  const role = remoteTrashRoleForVisibleCard(card);
  if (role !== "unknown") return role;
  if (accessedCardContributesToVisibleRunTaxForMetrics(input, card))
    return "run_tax";
  return role;
}

function accessedCardContributesToVisibleRunTaxForMetrics(
  input: AiDecisionInput,
  accessed: VisibleCard,
): boolean {
  const definitionId = accessed.definitionId;
  if (!definitionId) return false;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === input.playerView.run?.attackedServerId,
  );
  return (
    server?.ice.some((ice) =>
      ice.effectiveRunQuote?.subroutines.some(
        (subroutine) => subroutine.sourceDefinitionId === definitionId,
      ),
    ) === true ||
    server?.ice.some((ice) =>
      ice.effectiveRunQuote?.breakSubroutineCostSourceDefinitionIds?.includes(
        definitionId,
      ),
    ) === true
  );
}

export function remoteTrashCardIsBbsWhisperingCampaign(
  card: VisibleCard,
): boolean {
  return card.definitionId === BBS_WHISPERING_CAMPAIGN_DEFINITION_ID;
}

export function remoteTrashVisibleCorpValueRemaining(
  card: VisibleCard,
): number {
  return Math.max(
    0,
    card.counters?.bit ?? 0,
    card.counters?.recurring_credit ?? 0,
  );
}

export function remoteTrashCardLooksLikeFinitePoolForMetrics(
  card: VisibleCard,
): boolean {
  if (remoteTrashCardIsBbsWhisperingCampaign(card)) return true;
  const runtimeDefinition = card.definitionId
    ? RUNTIME_CARDS[card.definitionId]
    : undefined;
  const demoDefinition = card.definitionId
    ? DEMO_CARDS_BY_ID[card.definitionId]
    : undefined;
  const mechanics = [
    ...("mechanics" in (runtimeDefinition ?? {})
      ? ((runtimeDefinition as { mechanics?: string[] } | undefined)
          ?.mechanics ?? [])
      : []),
    ...(demoDefinition?.mechanics ?? []),
  ];
  const runtimeText =
    (runtimeDefinition as { text?: string } | undefined)?.text ?? "";
  const demoText =
    (demoDefinition as { text?: string } | undefined)?.text ?? "";
  const rulesText = `${runtimeText} ${demoText} ${
    card.rulesText ?? ""
  }`.toLowerCase();
  return (
    mechanics.some(
      (mechanic: string) =>
        mechanic.includes("finite_economy_pool") ||
        mechanic.includes("hosted_credits") ||
        mechanic.includes("bit_counter"),
    ) ||
    (rulesText.includes("put") &&
      rulesText.includes("from the bank") &&
      rulesText.includes("take") &&
      rulesText.includes("bits"))
  );
}
