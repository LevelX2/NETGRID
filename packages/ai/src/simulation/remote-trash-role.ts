import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { DEMO_CARDS_BY_ID } from "@netgrid/shared";
import { createAiHintsByCard, RUNTIME_CARDS } from "../ai-hints";
import {
  getStructuredRemoteRoleForCard,
  remoteRoleIsNonScoringProtectionKind,
  remoteRoleIsScoringProtectionKind,
} from "../remote-role-ontology-consumer";
import { cardRolesForId } from "../runtime/card-role-lookup";
import { rolesMatch } from "../runtime/role-match";

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
    rolesMatch(roles, [
      "agenda_steal_tax",
      "access_tax",
      "remote_agenda_protection",
      "scoring",
      "protect_remote",
      "remote_upgrade_tax",
    ])
  )
    return "scoring_protection";
  if (
    rolesMatch(roles, ["run_tax", "ice_tax", "access_tax", "server_tax"]) ||
    rolesMatch(mechanics, [
      "break_subroutine_cost",
      "trash_cost_modifier",
      "trace_bid_credit_source",
      "run_flow",
    ]) ||
    subtypes.some((subtype) => subtype.toLowerCase() === "region")
  )
    return "run_tax";
  if (
    rolesMatch(roles, ["remote_capacity"]) ||
    rolesMatch(mechanics, ["remote_capacity"])
  )
    return "remote_capacity";
  if (rolesMatch(roles, ["economy"])) return "economy";
  if (rolesMatch(roles, ["tag", "trace", "punish", "damage"]))
    return "tag_punish";
  if (rolesMatch(roles, ["ambush", "trap"])) return "ambush";
  if (rolesMatch(roles, ["low_value"])) return "low_value";
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
    rolesMatch(mechanics, [
      "finite_economy_pool",
      "hosted_credits",
      "bit_counter",
    ]) ||
    finitePoolRulesTextMatches(rulesText)
  );
}

function finitePoolRulesTextMatches(rulesText: string): boolean {
  return (
    /\bput\b/.test(rulesText) &&
    /\bfrom the bank\b/.test(rulesText) &&
    /\btake\b/.test(rulesText) &&
    /\bbits\b/.test(rulesText)
  );
}
