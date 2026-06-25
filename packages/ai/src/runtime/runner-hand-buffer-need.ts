import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

export function runnerHandBufferNeedScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  if (action.type !== "draw_card") return undefined;
  const handCount = input.playerView.own.gripOrHq.length;
  if (handCount >= 5) return undefined;
  const damagePressure = runnerVisibleDamagePressure(input);
  const baseValue =
    handCount <= 0
      ? 750
      : handCount === 1
        ? 600
        : handCount === 2
          ? 350
          : handCount === 3
            ? 350
            : 150;
  const damageBoost =
    damagePressure && handCount <= 0
      ? 1750
      : damagePressure && handCount === 1
        ? 900
        : damagePressure && handCount === 2
          ? 350
          : 0;
  return {
    key: "runner_hand_buffer_need",
    label: "Handpuffer-Bedarf",
    value: baseValue + damageBoost,
    reason: [
      `hand:${handCount}`,
      `damage_pressure:${damagePressure}`,
      `base:${baseValue}`,
      `damage_boost:${damageBoost}`,
    ].join("|"),
  };
}

function runnerVisibleDamagePressure(input: AiDecisionInput): boolean {
  if (input.playerView.own.tags > 0) return true;
  const visibleCards = [
    ...input.playerView.own.heapOrArchives,
    ...(input.playerView.own.rig ?? []),
    ...input.playerView.own.scoreArea,
    ...input.playerView.servers.flatMap((server) => [
      ...server.ice,
      ...server.root,
    ]),
  ];
  if (
    visibleCards.some((card) =>
      card.known !== false &&
      /damage|flatline|net damage|meat damage|brain damage|tag/i.test(
        [card.title, card.rulesText, card.definitionId]
          .filter(Boolean)
          .join(" "),
      ),
    )
  ) {
    return true;
  }
  return [...input.playerView.publicEvents, ...input.eventTail].some((event) =>
    /damage|flatline|tag|trace/i.test(
      [
        event.type,
        String(event.publicPayload.actionType ?? ""),
        String(event.publicPayload.damageType ?? ""),
        String(event.publicPayload.sourceTitle ?? ""),
        String(event.publicPayload.sourceDefinitionId ?? ""),
      ].join(" "),
    ),
  );
}
