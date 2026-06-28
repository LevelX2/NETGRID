import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import { createAiHintsByCard, type AiCardHint } from "../ai-hints";
import { rolesMatch } from "../runtime/role-match";
import { classifyTagPunishPayoffFromOntology } from "../tag-punish-ontology-consumer";

type AiCardHintWithSignals = AiCardHint & { tacticSignals?: string[] };

const AI_HINTS = createAiHintsByCard();

export function corpVisibleMeatDamagePayoff(
  input: AiDecisionInput,
): boolean {
  const ownVisibleCards = [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.own.scoreArea,
    ...input.playerView.servers.flatMap((server) => [
      ...server.ice,
      ...server.root,
    ]),
  ];
  return ownVisibleCards.some(visibleCardHasMeatDamagePayoff);
}

export function corpVisibleRunnerDamagePreventionEvidence(
  input: AiDecisionInput,
): string[] {
  const rig = input.playerView.opponent.rig ?? [];
  const prevention = rig.some(visibleCardPreventsDamage);
  const meatPrevention = rig.some(visibleCardPreventsMeatDamage);
  return [
    ...(prevention ? ["runner_damage_prevention_visible:true"] : []),
    ...(meatPrevention ? ["runner_meat_damage_prevention_visible:true"] : []),
    ...(prevention ? ["prevention_pressure:true"] : []),
  ];
}

export function corpVisibleRunnerResourceTrashEvidence(
  input: AiDecisionInput,
  target: VisibleCard,
): { valueBonus: number; evidence: string[] } {
  if (visibleCardPreventsMeatDamage(target)) {
    return {
      valueBonus: 700,
      evidence: [
        "corp_tagged_damage_prevention_resource_trash",
        "runner_resource_damage_prevention_visible:true",
        "cancel_blocked:true",
        ...(corpVisibleMeatDamagePayoff(input)
          ? ["corp_visible_meat_damage_payoff:true"]
          : []),
      ],
    };
  }
  if (visibleCardProvidesTraceDefense(target)) {
    return {
      valueBonus: input.playerView.opponent.tags >= 7 ? 850 : 250,
      evidence: [
        "corp_tag_punish_endgame_resource_trash",
        "runner_resource_trace_defense_visible:true",
        ...(input.playerView.opponent.tags >= 7
          ? ["tag_punish_endgame_active:true"]
          : []),
      ],
    };
  }
  return { valueBonus: 0, evidence: [] };
}

function visibleCardHasMeatDamagePayoff(card: VisibleCard): boolean {
  const payoff = classifyTagPunishPayoffFromOntology(card.definitionId);
  return (
    payoff?.payoffKinds.some(
      (kind) => kind === "damage" || kind === "scored_agenda_damage_like",
    ) === true
  );
}

function visibleCardPreventsDamage(card: VisibleCard): boolean {
  const hint = hintForVisibleCard(card);
  return (
    hintHasRole(hint, "damage_prevention") ||
    hintHasSignal(hint, "defense.damage_prevention") ||
    hintHasEffectKind(hint, [
      "damage_prevention",
      "meat_damage_prevention",
      "net_damage_prevention",
      "brain_damage_prevention",
      "flatline_prevention",
    ])
  );
}

function visibleCardPreventsMeatDamage(card: VisibleCard): boolean {
  const hint = hintForVisibleCard(card);
  return (
    hintHasRole(hint, "meat_damage") ||
    hintHasSignal(hint, "defense.meat_damage_prevention") ||
    hintHasSignal(hint, "defense.all_meat_damage_prevention") ||
    hintHasEffectKind(hint, ["meat_damage_prevention"]) ||
    hint?.effects?.some(
      (effect) =>
        effect.kind === "prevention_replacement" &&
        effectTargetMatchesTerm(effect, "meat_damage"),
    ) === true
  );
}

function visibleCardProvidesTraceDefense(card: VisibleCard): boolean {
  const hint = hintForVisibleCard(card);
  return (
    hintHasRole(hint, "trace_defense") ||
    hintHasSignal(hint, "defense.trace_defense") ||
    hintHasEffectKind(hint, ["trace_defense", "link"])
  );
}

function hintForVisibleCard(card: VisibleCard): AiCardHint | undefined {
  return card.definitionId ? AI_HINTS.get(card.definitionId) : undefined;
}

function hintHasRole(hint: AiCardHint | undefined, role: string): boolean {
  return rolesMatch([...(hint?.roles ?? []), ...(hint?.planRoles ?? [])], [role]);
}

function effectTargetMatchesTerm(effect: unknown, term: string): boolean {
  const target = String((effect as Record<string, unknown>).target ?? "");
  return rolesMatch([target], [term]);
}

function hintHasSignal(hint: AiCardHint | undefined, signal: string): boolean {
  return (
    (hint as AiCardHintWithSignals | undefined)?.tacticSignals?.includes(
      signal,
    ) === true
  );
}

function hintHasEffectKind(
  hint: AiCardHint | undefined,
  kinds: string[],
): boolean {
  return (
    hint?.effects?.some((effect) => kinds.includes(effect.kind)) === true
  );
}
