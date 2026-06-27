import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import {
  cardCoverageSearchText,
  cardProvidesBreakerCoverage,
} from "./tactical-plan-breaker-cards";
import { visibleCardByInstanceId } from "./tactical-plan-visible-cards";
import type { RequiredCapabilityKind } from "./tactical-plan-types";

export function recoveryTargetDefinitionId(
  input: AiDecisionInput,
  action: LegalAction,
): string | undefined {
  const payload = action.payload ?? {};
  const direct =
    payload.targetCardDefinitionId ??
    payload.returnedCardDefinitionId ??
    payload.cardDefinitionId ??
    payload.targetDefinitionId;
  if (typeof direct === "string") return direct;
  const targetCard = recoveryTargetVisibleCard(input, action);
  return targetCard?.definitionId;
}

export function recoveryTargetVisibleCard(
  input: AiDecisionInput,
  action: LegalAction,
): VisibleCard | undefined {
  const payload = action.payload ?? {};
  const targetId =
    payload.targetCardId ??
    payload.cardImplementationTopTrashTargetId ??
    payload.returnedCardId;
  return typeof targetId === "string"
    ? visibleCardByInstanceId(input.playerView, targetId)
    : undefined;
}

export function cardPlanRoleForCoverageSearch(card: VisibleCard): string {
  if (cardProvidesBreakerCoverage(card, "breaker_coverage")) return "breaker";
  const text = cardCoverageSearchText(card);
  if (/search|tutor/.test(text)) return "search";
  if (/draw/.test(text)) return "draw";
  if (/credit|economy|gain\s+\d+/.test(text)) return "economy";
  return card.type ?? "unknown";
}

export function cardDefinitionPlanRoleForCoverageSearch(definitionId: string): string {
  if (cardDefinitionProvidesBreakerCoverage(definitionId, "breaker_coverage"))
    return "breaker";
  const definition = DEMO_CARDS_BY_ID[definitionId];
  const text = [
    definition?.title,
    definition?.type,
    ...(definition?.subtypes ?? []),
    definition?.rulesText,
    ...(definition?.mechanics ?? []),
  ].filter(Boolean).join(" ").toLowerCase();
  if (/search|tutor/.test(text)) return "search";
  if (/draw/.test(text)) return "draw";
  if (/credit|economy|gain_credits|gain\s+\d+/.test(text)) return "economy";
  return definition?.type ?? "unknown";
}

export function cardDefinitionProvidesBreakerCoverage(
  definitionId: string,
  requiredCoverage: RequiredCapabilityKind,
): boolean {
  const definition = DEMO_CARDS_BY_ID[definitionId];
  if (!definition) return false;
  return cardProvidesBreakerCoverage(
    {
      instanceId: definitionId,
      definitionId,
      title: definition.title,
      owner: "runner",
      controller: "runner",
      type: definition.type,
      known: true,
      subtypes: definition.subtypes,
      rulesText: definition.rulesText,
    },
    requiredCoverage,
  );
}
