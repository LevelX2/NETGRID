import type {
  AiDecisionInput,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";

import { createAiHintsByCard, type AiCardHint } from "../ai-hints";
import { rolesMatch } from "./role-match";

export type CorpCentralServerId = "hq" | "rd";

export type CorpCentralPressureAssessment = {
  serverId: CorpCentralServerId;
  active: boolean;
  pressure: number;
  runOrAccessEvents: number;
  successfulAccessEvents: number;
  visibleMultiaccess: boolean;
  visibleVirusPressure: boolean;
  eventMultiaccess: boolean;
  runnerRunCredits: number;
  hqAgendaExposure: boolean;
  evidence: string[];
};

type AiCardHintWithSignals = AiCardHint & {
  tacticSignals?: readonly string[];
};

type HintEffectWithTarget = {
  kind?: string;
  scope?: string;
  target?: string;
};

const AI_HINTS_BY_CARD = createAiHintsByCard();

export function semanticRuntimeCorpCentralPressureAssessment(
  input: AiDecisionInput,
  serverId: CorpCentralServerId,
): CorpCentralPressureAssessment {
  const events = semanticRuntimeCorpCentralEvents(input, serverId);
  const runOrAccessEvents = events.filter((event) =>
    centralRunOrAccessActionType(event),
  ).length;
  const successfulAccessEvents = events.filter((event) =>
    centralSuccessfulAccessActionType(event),
  ).length;
  const eventMultiaccess = events.some((event) =>
    centralEventHasMultiaccess(event),
  );
  const visibleMultiaccess = visibleRunnerCentralMultiaccess(input, serverId);
  const visibleVirusPressure = visibleRunnerCentralVirusPressure(
    input,
    serverId,
  );
  const runnerRunCredits =
    input.playerView.opponent.credits +
    visibleRunnerRunCreditPool(input.playerView.opponent.rig ?? []);
  const hqAgendaExposure =
    serverId === "hq" &&
    input.playerView.own.gripOrHq.some(
      (card) => card.known && card.type === "agenda",
    );
  const pressure = clamp01(
    runOrAccessEvents / 4 +
      successfulAccessEvents / 5 +
      (visibleMultiaccess ? 0.35 : 0) +
      (visibleVirusPressure ? 0.25 : 0) +
      (eventMultiaccess ? 0.2 : 0) +
      (runnerRunCredits >= 6 ? 0.1 : 0),
  );
  const active =
    hqAgendaExposure ||
    pressure >= (serverId === "rd" ? 0.45 : 0.55) ||
    (visibleMultiaccess && runnerRunCredits >= (serverId === "rd" ? 2 : 1)) ||
    (serverId === "rd" &&
      visibleVirusPressure &&
      (runnerRunCredits >= 1 || runOrAccessEvents > 0));

  return {
    serverId,
    active,
    pressure,
    runOrAccessEvents,
    successfulAccessEvents,
    visibleMultiaccess,
    visibleVirusPressure,
    eventMultiaccess,
    runnerRunCredits,
    hqAgendaExposure,
    evidence: [
      `corp_central_pressure_server:${serverId}`,
      `corp_central_pressure_events:${runOrAccessEvents}`,
      `corp_central_successful_access_events:${successfulAccessEvents}`,
      `corp_central_visible_multiaccess:${visibleMultiaccess}`,
      `corp_central_visible_virus_pressure:${visibleVirusPressure}`,
      `corp_central_event_multiaccess:${eventMultiaccess}`,
      `corp_central_runner_run_credits:${runnerRunCredits}`,
      `corp_central_pressure:${pressure.toFixed(2)}`,
      `corp_central_pressure_active:${active}`,
      ...(hqAgendaExposure ? ["corp_hq_agenda_exposure:true"] : []),
    ],
  };
}

export function semanticRuntimeCorpCentralRunOrAccessEventCount(
  input: AiDecisionInput,
  serverId: CorpCentralServerId,
): number {
  return semanticRuntimeCorpCentralEvents(input, serverId).filter((event) =>
    centralRunOrAccessActionType(event),
  ).length;
}

export function semanticRuntimeCorpNormalizeCentralServerId(
  value: string | undefined,
): CorpCentralServerId | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLocaleLowerCase("en-US");
  if (normalized === "hq") return "hq";
  if (
    normalized === "rd" ||
    normalized === "r&d" ||
    normalized === "research and development" ||
    normalized === "research & development"
  ) {
    return "rd";
  }
  return undefined;
}

export function semanticRuntimeCorpCentralServerIdFromPayload(
  payload: Record<string, unknown>,
): CorpCentralServerId | undefined {
  const direct =
    stringPayload(payload, "serverId") ??
    stringPayload(payload, "attackedServerId") ??
    stringPayload(payload, "targetServerId") ??
    stringPayload(payload, "server") ??
    stringPayload(payload, "serverLabel") ??
    stringPayload(payload, "serverName");
  const directServerId = semanticRuntimeCorpNormalizeCentralServerId(direct);
  if (directServerId) return directServerId;

  const nestedTargets = [
    recordPayload(payload, "target"),
    recordPayload(payload, "targets"),
  ];
  for (const nested of nestedTargets) {
    if (!nested) continue;
    const nestedServerId = semanticRuntimeCorpCentralServerIdFromPayload(nested);
    if (nestedServerId) return nestedServerId;
  }
  return undefined;
}

function semanticRuntimeCorpCentralEvents(
  input: AiDecisionInput,
  serverId: CorpCentralServerId,
): PublicGameEvent[] {
  const eventsById = new Map(
    [...(input.playerView.publicEvents ?? []), ...(input.eventTail ?? [])].map(
      (event) => [event.eventId, event],
    ),
  );
  return [...eventsById.values()].filter((event) => {
    const payload = event.publicPayload;
    return (
      stringPayload(payload, "actor") === "runner" &&
      semanticRuntimeCorpCentralServerIdFromPayload(payload) === serverId &&
      (centralRunOrAccessActionType(event) ||
        centralSuccessfulAccessActionType(event))
    );
  });
}

function centralRunOrAccessActionType(event: PublicGameEvent): boolean {
  const actionType = eventActionType(event);
  return actionType === "start_run" || actionType === "access_card";
}

function centralSuccessfulAccessActionType(event: PublicGameEvent): boolean {
  const actionType = eventActionType(event);
  return (
    actionType === "access_card" ||
    actionType === "steal_agenda" ||
    actionType === "trash_accessed_card"
  );
}

function centralEventHasMultiaccess(event: PublicGameEvent): boolean {
  const payload = event.publicPayload;
  const effectiveAccessCount = numberPayload(payload, "effectiveAccessCount");
  if (effectiveAccessCount !== undefined && effectiveAccessCount > 1) {
    return true;
  }
  const accessCount = numberPayload(payload, "accessCount");
  return accessCount !== undefined && accessCount > 1;
}

function visibleRunnerCentralMultiaccess(
  input: AiDecisionInput,
  serverId: CorpCentralServerId,
): boolean {
  return (input.playerView.opponent.rig ?? []).some((card) =>
    visibleCardProvidesCentralMultiaccess(card, serverId),
  );
}

function visibleRunnerCentralVirusPressure(
  input: AiDecisionInput,
  serverId: CorpCentralServerId,
): boolean {
  return (input.playerView.opponent.rig ?? []).some((card) =>
    visibleCardCreatesCentralVirusPressure(card, serverId),
  );
}

function visibleCardProvidesCentralMultiaccess(
  card: VisibleCard,
  serverId: CorpCentralServerId,
): boolean {
  if (card.known === false) return false;
  const hint = card.definitionId
    ? (AI_HINTS_BY_CARD.get(card.definitionId) as
        | AiCardHintWithSignals
        | undefined)
    : undefined;
  const serverNeedle =
    serverId === "rd" ? "access.rnd_multiaccess" : "access.hq_multiaccess";
  if (hint?.tacticSignals?.includes(serverNeedle)) return true;
  if (
    rolesMatch([...(hint?.roles ?? []), ...(hint?.planRoles ?? [])], [
      serverId === "rd" ? "rd_multiaccess" : "hq_multiaccess",
    ])
  ) {
    return true;
  }
  if (
    hintEffectsWithTarget(hint).some(
      (effect) =>
        effect.kind === "multiaccess" &&
        (effect.scope === serverId || effect.target === serverId),
    )
  ) {
    return true;
  }

  const text = `${card.title ?? ""} ${card.rulesText ?? ""} ${
    card.definitionId ?? ""
  }`.toLocaleLowerCase("en-US");
  const tokens = visibleTextTokens(text);
  const tokenSet = new Set(tokens);
  if (!visibleTextHasCentralMultiaccess(tokens, tokenSet)) {
    return false;
  }
  if (serverId === "hq") return tokenSet.has("hq");
  return (
    visibleTextHasPhrase(tokens, ["r", "d"]) ||
    tokenSet.has("rd") ||
    tokenSet.has("rnd")
  );
}

function visibleCardCreatesCentralVirusPressure(
  card: VisibleCard,
  serverId: CorpCentralServerId,
): boolean {
  if (card.known === false) return false;
  const hint = card.definitionId
    ? (AI_HINTS_BY_CARD.get(card.definitionId) as
        | AiCardHintWithSignals
        | undefined)
    : undefined;
  const signals = [
    ...(hint?.roles ?? []),
    ...(hint?.planRoles ?? []),
    ...(hint?.tacticSignals ?? []),
  ].map((signal) => signal.toLocaleLowerCase("en-US"));
  const serverSignal =
    serverId === "rd"
      ? signals.some((signal) =>
          signalHasAnyToken(signal, ["rnd", "rd", "r_and_d"]),
        )
      : signals.some((signal) => signalHasAnyToken(signal, ["hq"]));
  const payoffSignal = signals.some((signal) =>
    signalHasAnyToken(signal, [
      "virus",
      "multiaccess",
      "free_trash",
      "access",
    ]),
  );
  if (serverSignal && payoffSignal) return true;

  const text = `${card.title ?? ""} ${card.rulesText ?? ""} ${
    card.definitionId ?? ""
  }`.toLocaleLowerCase("en-US");
  const tokens = visibleTextTokens(text.replace(/r&d/g, "rnd"));
  const tokenSet = new Set(tokens);
  const serverMention =
    serverId === "rd"
      ? tokenSet.has("rd") ||
        tokenSet.has("rnd") ||
        visibleTextHasPhrase(tokens, ["r", "d"])
      : tokenSet.has("hq");
  if (!serverMention) return false;
  const counterOrVirus =
    tokenSet.has("virus") ||
    tokenSet.has("counter") ||
    tokenSet.has("counters");
  const payoff =
    tokenSet.has("access") ||
    tokenSet.has("trash") ||
    tokenSet.has("additional") ||
    tokenSet.has("multiaccess");
  return counterOrVirus && payoff;
}

function signalHasAnyToken(signal: string, needles: readonly string[]): boolean {
  const needleSet = new Set(needles);
  const tokens = signal.split(/[._:-]+/).filter(Boolean);
  return tokens.some((token) => needleSet.has(token));
}

function hintEffectsWithTarget(
  hint: AiCardHintWithSignals | undefined,
): HintEffectWithTarget[] {
  const effects = (hint as { effects?: unknown } | undefined)?.effects;
  return Array.isArray(effects)
    ? effects.filter(
        (effect): effect is HintEffectWithTarget =>
          typeof effect === "object" && effect !== null,
      )
    : [];
}

function visibleRunnerRunCreditPool(rig: readonly VisibleCard[]): number {
  return rig.reduce((sum, card) => {
    if (card.known === false) return sum;
    return (
      sum +
      (card.counterDisplays ?? []).reduce((cardSum, display) => {
        const uses = display.creditPool?.uses ?? [];
        if (
          uses.includes("using_icebreaker_during_run") ||
          uses.includes("using_icebreaker_during_run_non_noisy") ||
          uses.includes("using_killer_during_run")
        ) {
          return cardSum + Math.max(0, Math.floor(display.amount));
        }
        return cardSum;
      }, 0)
    );
  }, 0);
}

function eventActionType(event: PublicGameEvent): string {
  return stringPayload(event.publicPayload, "actionType") ?? event.type;
}

function stringPayload(
  payload: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = payload[key];
  return typeof value === "string" ? value : undefined;
}

function numberPayload(
  payload: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function recordPayload(
  payload: Record<string, unknown>,
  key: string,
): Record<string, unknown> | undefined {
  const value = payload[key];
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function visibleTextHasCentralMultiaccess(
  tokens: readonly string[],
  tokenSet: ReadonlySet<string>,
): boolean {
  return (
    tokenSet.has("multiaccess") ||
    visibleTextHasPhrase(tokens, ["additional", "card"]) ||
    visibleTextHasPhrase(tokens, ["access", "1", "additional"])
  );
}

function visibleTextTokens(text: string): string[] {
  return text.split(/[^a-z0-9]+/).filter(Boolean);
}

function visibleTextHasPhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some(
    (token, index) =>
      token === phrase[0] &&
      phrase.every(
        (phraseToken, offset) => tokens[index + offset] === phraseToken,
      ),
  );
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
