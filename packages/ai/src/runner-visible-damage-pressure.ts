import type { AiDecisionInput, PublicGameEvent, VisibleCard } from "@netgrid/shared";

const DAMAGE_PRESSURE_TOKENS = new Set([
  "damage",
  "flatline",
  "tag",
  "trace",
]);

export function runnerVisibleDamagePressure(input: AiDecisionInput): boolean {
  if (input.playerView.own.tags > 0) return true;
  return (
    runnerVisibleCards(input).some(visibleCardShowsDamagePressure) ||
    [...input.playerView.publicEvents, ...input.eventTail].some(
      publicEventShowsDamagePressure,
    )
  );
}

function runnerVisibleCards(input: AiDecisionInput): VisibleCard[] {
  return [
    ...input.playerView.own.heapOrArchives,
    ...(input.playerView.own.rig ?? []),
    ...input.playerView.own.scoreArea,
    ...input.playerView.servers.flatMap((server) => [
      ...server.ice,
      ...server.root,
    ]),
  ];
}

function visibleCardShowsDamagePressure(card: VisibleCard): boolean {
  if (card.known === false) return false;
  return damagePressureTokensIncludeAny(
    damagePressureTokens([card.title, card.rulesText, card.definitionId]),
  );
}

function publicEventShowsDamagePressure(event: PublicGameEvent): boolean {
  return damagePressureTokensIncludeAny(
    damagePressureTokens([
      event.type,
      event.publicPayload.actionType,
      event.publicPayload.damageType,
      event.publicPayload.sourceTitle,
      event.publicPayload.sourceDefinitionId,
    ]),
  );
}

function damagePressureTokens(values: readonly unknown[]): string[] {
  return values
    .filter((value): value is string => typeof value === "string")
    .flatMap((value) =>
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean),
    );
}

function damagePressureTokensIncludeAny(tokens: readonly string[]): boolean {
  return tokens.some((token) => DAMAGE_PRESSURE_TOKENS.has(token));
}
