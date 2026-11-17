import type { CorpPunishRouteStepKind } from "@netgrid/shared";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import {
  corpDirectTagOperationProfile,
  corpInstalledHardwareTrashOperationProfile,
  corpTaggedCreditDenialOperationProfile,
  corpTraceTagSourceProfile,
  corpScoredTraceTagSourceProfile,
  corpTaggedMeatDamageOperationProfile,
  corpScoredTaggedMeatDamageProfile,
  corpInstalledTaggedMeatDamageProfile,
} from "../../runtime/corp-canonical-card-facts";

export type PunishComponentAdapter = {
  kind: Extract<
    CorpPunishRouteStepKind,
    "tag" | "trace_tag" | "meat_damage" | "hardware_trash" | "other_punish"
  >;
  routeOrder: number;
  sourceCapabilityBindingKind: "card_spec_capability_key";
  sourceCapabilityId: string;
  agendaPointCost?: number;
  damageAmount?: number;
};

export function structuredPunishComponentAdapter(
  definitionId: number,
): PunishComponentAdapter | undefined {
  return (
    structuredTraceTagAdapter(definitionId) ??
    structuredHardwareTrashAdapter(definitionId) ??
    structuredDirectTagAdapter(definitionId) ??
    structuredTaggedCreditDenialAdapter(definitionId) ??
    structuredTaggedDamageAdapter(definitionId)
  );
}

/**
 * Discovers reviewed finite Trace -> tag heads without assigning any trace
 * strength, bid or cost in the AI layer. The Engine remains responsible for
 * certifying the exact current action and the complete response window.
 */
function structuredTraceTagAdapter(
  definitionId: number,
): PunishComponentAdapter | undefined {
  const profile =
    corpTraceTagSourceProfile(definitionId) ??
    corpScoredTraceTagSourceProfile(definitionId);
  if (!profile) return undefined;
  return {
    kind: "trace_tag",
    routeOrder: 1,
    sourceCapabilityBindingKind: "card_spec_capability_key",
    sourceCapabilityId: profile.sourceCapabilityId,
  };
}

/**
 * Discovers the Power-Grid family from reviewed semantic hints. The visible
 * definition id only joins the visible card to its hint record; no concrete
 * card id, title, rules text or visible printed cost determines the role.
 * The Engine subsequently proves the exact corpUtility capability.
 */
function structuredHardwareTrashAdapter(
  definitionId: number,
): PunishComponentAdapter | undefined {
  const profile = corpInstalledHardwareTrashOperationProfile(definitionId);
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  if (
    !profile ||
    !hint ||
    hint.side !== "corp" ||
    hint.cardType !== "operation" ||
    hint.planRoles?.includes("tag_punish") !== true ||
    hint.conditions?.some(
      (condition) => condition.kind === "requires_runner_tagged",
    ) !== true ||
    hint.conditions.some(
      (condition) => condition.kind === "requires_installed_hardware",
    ) !== true ||
    hint.effects?.some(
      (effect) =>
        effect.kind === "hardware_trash" &&
        effect.scope === "runner" &&
        effect.timing === "action" &&
        effect.finite === true,
    ) !== true ||
    hint.effects.some(
      (effect) =>
        effect.kind === "tag_punish_payoff" &&
        effect.scope === "runner" &&
        effect.timing === "action" &&
        effect.finite === true,
    ) !== true
  ) {
    return undefined;
  }
  return {
    kind: "hardware_trash",
    routeOrder: 6,
    sourceCapabilityBindingKind: "card_spec_capability_key",
    sourceCapabilityId: profile.sourceCapabilityId,
  };
}

function structuredDirectTagAdapter(
  definitionId: number,
): PunishComponentAdapter | undefined {
  const profile = corpDirectTagOperationProfile(definitionId);
  return profile
    ? {
        kind: "tag",
        routeOrder: 0,
        sourceCapabilityBindingKind: "card_spec_capability_key",
        sourceCapabilityId: profile.sourceCapabilityId,
      }
    : undefined;
}

function structuredTaggedCreditDenialAdapter(
  definitionId: number,
): PunishComponentAdapter | undefined {
  const profile = corpTaggedCreditDenialOperationProfile(definitionId);
  return profile
    ? {
        kind: "other_punish",
        routeOrder: 5,
        sourceCapabilityBindingKind: "card_spec_capability_key",
        sourceCapabilityId: profile.sourceCapabilityId,
      }
    : undefined;
}

function structuredTaggedDamageAdapter(
  definitionId: number,
): PunishComponentAdapter | undefined {
  const profile =
    corpTaggedMeatDamageOperationProfile(definitionId) ??
    corpScoredTaggedMeatDamageProfile(definitionId) ??
    corpInstalledTaggedMeatDamageProfile(definitionId);
  return profile
    ? {
        kind: "meat_damage",
        routeOrder: 10,
        sourceCapabilityBindingKind: "card_spec_capability_key",
        sourceCapabilityId: profile.sourceCapabilityId,
        damageAmount: profile.damageAmount,
        ...(profile.agendaPointCost !== undefined
          ? { agendaPointCost: profile.agendaPointCost }
          : {}),
      }
    : undefined;
}
