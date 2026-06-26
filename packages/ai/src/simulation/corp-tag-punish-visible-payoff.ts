import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

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
  return ownVisibleCards.some((card) =>
    [
      "onr_v1_302_scorched-earth",
      "onr_v1_339_schlaghund",
      "onr_v1_307_urban-renewal",
    ].includes(card.definitionId ?? ""),
  );
}

export function corpVisibleRunnerDamagePreventionEvidence(
  input: AiDecisionInput,
): string[] {
  const rig = input.playerView.opponent.rig ?? [];
  const fullBodyConversion = rig.some(
    (card) => card.definitionId === "onr_v1_127_full-body-conversion",
  );
  const dermatech = rig.some(
    (card) => card.definitionId === "onr_v1_125_dermatech-bodyplating",
  );
  return [
    ...(fullBodyConversion
      ? ["runner_full_body_conversion_visible:true"]
      : []),
    ...(dermatech ? ["runner_dermatech_bodyplating_visible:true"] : []),
    ...(fullBodyConversion || dermatech ? ["prevention_pressure:true"] : []),
  ];
}

export function corpVisibleRunnerResourceTrashEvidence(
  input: AiDecisionInput,
  target: VisibleCard,
): { valueBonus: number; evidence: string[] } {
  if (target.definitionId === "onr_v1_160_diplomatic-immunity") {
    return {
      valueBonus: 700,
      evidence: [
        "corp_tagged_damage_prevention_resource_trash",
        "runner_resource_diplomatic_immunity:true",
        "cancel_blocked:true",
        ...(corpVisibleMeatDamagePayoff(input)
          ? ["corp_visible_meat_damage_payoff:true"]
          : []),
      ],
    };
  }
  if (target.definitionId === "onr_v1_182_submarine-uplink") {
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
