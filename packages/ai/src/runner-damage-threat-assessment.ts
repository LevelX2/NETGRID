import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";

export type RunnerDamageThreatLevel =
  | "none"
  | "suspected"
  | "confirmed"
  | "critical";

export type RunnerDamageThreatAssessment = {
  level: RunnerDamageThreatLevel;
  handCount: number;
  recentDamageEvents: number;
  historicalDamageEvents: number;
  recentDamageAmount: number;
  recentDamageStateDistance?: number;
  knownDamageSourceCount: number;
  riskyRunServerIds: string[];
  recommendedHandFloor: number;
  criticalRunSuppression: boolean;
  evidence: string[];
};

const DAMAGE_TOKENS = new Set([
  "brain",
  "core",
  "damage",
  "flatline",
  "meat",
  "net",
]);

const RECENT_DAMAGE_STATE_DISTANCE = 8;
const STALE_DAMAGE_STATE_DISTANCE = 24;

export function runnerDamageThreatAssessment(
  input: AiDecisionInput,
): RunnerDamageThreatAssessment {
  const handCount = input.playerView.own.gripOrHq.length;
  const history = mergedHistory(input);
  const damageEvents = history.filter(publicEventShowsDamage);
  const recentTailDamageEvents = (input.eventTail ?? []).filter(
    publicEventShowsDamage,
  );
  const latestDamage = damageEvents[damageEvents.length - 1];
  const latestDamageVersion = latestDamage
    ? eventVersion(latestDamage)
    : undefined;
  const stateVersion = input.playerView.stateVersion;
  const recentDamageStateDistance =
    latestDamageVersion !== undefined
      ? Math.max(0, stateVersion - latestDamageVersion)
      : undefined;
  const recentDamageEvents =
    recentTailDamageEvents.length +
    damageEvents.filter((event) => {
      const distance = stateVersion - eventVersion(event);
      return distance >= 0 && distance <= RECENT_DAMAGE_STATE_DISTANCE;
    }).length;
  const historicalDamageEvents = damageEvents.length;
  const recentDamageAmount = damageEvents
    .filter((event) => {
      if (latestDamageVersion === undefined) return false;
      return stateVersion - eventVersion(event) <= RECENT_DAMAGE_STATE_DISTANCE;
    })
    .reduce((sum, event) => sum + publicEventDamageAmount(event), 0);
  const knownDamageSourceCount = visibleCards(input).filter(
    visibleCardShowsDamageSource,
  ).length;
  const riskyRunServerIds = input.playerView.servers
    .filter((server) => serverHasRunnerExposureRisk(server))
    .map((server) => server.id)
    .sort();
  const staleDamage =
    recentDamageStateDistance !== undefined &&
    recentDamageStateDistance > STALE_DAMAGE_STATE_DISTANCE &&
    knownDamageSourceCount === 0;
  const hasDamageEvidence =
    historicalDamageEvents > 0 || knownDamageSourceCount > 0;
  const hasRecentDamageEvidence = recentDamageEvents > 0 && !staleDamage;
  const level = runnerDamageThreatLevel({
    handCount,
    hasDamageEvidence,
    hasRecentDamageEvidence,
    historicalDamageEvents,
    knownDamageSourceCount,
    staleDamage,
  });
  const recommendedHandFloor = runnerDamageThreatHandFloor(level);
  const criticalRunSuppression =
    level === "critical" || (level === "confirmed" && handCount <= 1);
  return {
    level,
    handCount,
    recentDamageEvents,
    historicalDamageEvents,
    recentDamageAmount,
    ...(recentDamageStateDistance !== undefined
      ? { recentDamageStateDistance }
      : {}),
    knownDamageSourceCount,
    riskyRunServerIds,
    recommendedHandFloor,
    criticalRunSuppression,
    evidence: [
      `runner_damage_threat_level:${level}`,
      `runner_damage_threat_hand:${handCount}`,
      `runner_damage_threat_floor:${recommendedHandFloor}`,
      `runner_damage_recent_events:${recentDamageEvents}`,
      `runner_damage_historical_events:${historicalDamageEvents}`,
      `runner_damage_recent_amount:${recentDamageAmount}`,
      `runner_damage_visible_sources:${knownDamageSourceCount}`,
      `runner_damage_stale:${staleDamage}`,
      `runner_damage_risky_servers:${riskyRunServerIds.join("|") || "none"}`,
      `runner_damage_critical_run_suppression:${criticalRunSuppression}`,
      ...(recentDamageStateDistance !== undefined
        ? [`runner_damage_recent_state_distance:${recentDamageStateDistance}`]
        : []),
    ],
  };
}

export function runnerDamageThreatRunScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  if (action.type !== "start_run") return undefined;
  const assessment = runnerDamageThreatAssessment(input);
  if (assessment.level === "none") return undefined;
  const serverId = actionServerId(action);
  const riskyServer =
    serverId !== undefined && assessment.riskyRunServerIds.includes(serverId);
  const fullExposure =
    assessment.criticalRunSuppression &&
    (riskyServer || assessment.handCount <= 0);
  if (
    !fullExposure &&
    !(riskyServer && assessment.handCount < assessment.recommendedHandFloor)
  ) {
    return undefined;
  }
  const value = fullExposure ? -2600 : -900;
  return {
    key: "runner_damage_survival_run_risk",
    label: "Runner-Damage-Survival-Run-Risiko",
    value,
    reason: [
      `level:${assessment.level}`,
      `hand:${assessment.handCount}`,
      `floor:${assessment.recommendedHandFloor}`,
      `server:${serverId ?? "unknown"}`,
      `risky_server:${riskyServer}`,
      `full_exposure:${fullExposure}`,
    ].join("|"),
  };
}

function runnerDamageThreatLevel(params: {
  handCount: number;
  hasDamageEvidence: boolean;
  hasRecentDamageEvidence: boolean;
  historicalDamageEvents: number;
  knownDamageSourceCount: number;
  staleDamage: boolean;
}): RunnerDamageThreatLevel {
  if (!params.hasDamageEvidence) return "none";
  if (
    params.handCount <= 0 ||
    (params.handCount <= 1 && params.hasRecentDamageEvidence)
  ) {
    return "critical";
  }
  if (
    params.hasRecentDamageEvidence ||
    (!params.staleDamage && params.historicalDamageEvents >= 2)
  ) {
    return "confirmed";
  }
  if (params.knownDamageSourceCount > 0 || params.historicalDamageEvents > 0) {
    return "suspected";
  }
  return "none";
}

function runnerDamageThreatHandFloor(level: RunnerDamageThreatLevel): number {
  switch (level) {
    case "critical":
    case "confirmed":
      return 3;
    case "suspected":
      return 2;
    case "none":
      return 1;
  }
}

function mergedHistory(input: AiDecisionInput): PublicGameEvent[] {
  const byId = new Map<string, PublicGameEvent>();
  for (const event of [
    ...(input.playerView.publicEvents ?? []),
    ...(input.eventTail ?? []),
  ]) {
    byId.set(event.eventId, event);
  }
  return [...byId.values()].sort(
    (left, right) => eventVersion(left) - eventVersion(right),
  );
}

function publicEventShowsDamage(event: PublicGameEvent): boolean {
  const payload = event.publicPayload ?? {};
  if (payload.flatline === true) return true;
  if (publicEventDamageAmount(event) > 0) return true;
  return damageTokensIncludeAny(
    damageTokens([
      event.type,
      payload.actionType,
      payload.damageType,
      payload.sourceTitle,
      payload.sourceDefinitionId,
    ]),
  );
}

function publicEventDamageAmount(event: PublicGameEvent): number {
  const amount = event.publicPayload?.damageAmount;
  return typeof amount === "number" && Number.isFinite(amount)
    ? Math.max(0, amount)
    : 0;
}

function visibleCards(input: AiDecisionInput): VisibleCard[] {
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

function visibleCardShowsDamageSource(card: VisibleCard): boolean {
  if (card.known === false) return false;
  return damageTokensIncludeAny(
    damageTokens([card.title, card.rulesText, card.definitionId]),
  );
}

function serverHasRunnerExposureRisk(
  server: AiDecisionInput["playerView"]["servers"][number],
): boolean {
  return (
    server.ice.some((ice) => ice.known === false || ice.rezzed !== true) ||
    (server.id.startsWith("remote_") &&
      server.root.some((card) => card.known === false))
  );
}

function actionServerId(action: LegalAction): string | undefined {
  const payload = action.payload ?? {};
  for (const key of ["serverId", "server", "targetServerId"]) {
    const value = payload[key];
    if (typeof value === "string") return value;
  }
  return undefined;
}

function eventVersion(event: PublicGameEvent): number {
  return typeof event.stateVersionAfter === "number"
    ? event.stateVersionAfter
    : typeof event.stateVersionBefore === "number"
      ? event.stateVersionBefore
      : 0;
}

function damageTokens(values: readonly unknown[]): string[] {
  return values
    .filter((value): value is string => typeof value === "string")
    .flatMap((value) =>
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean),
    );
}

function damageTokensIncludeAny(tokens: readonly string[]): boolean {
  return tokens.some((token) => DAMAGE_TOKENS.has(token));
}
