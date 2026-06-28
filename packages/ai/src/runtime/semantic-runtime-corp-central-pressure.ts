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
  eventMultiaccess: boolean;
  runnerRunCredits: number;
  hqAgendaExposure: boolean;
  evidence: string[];
};

type AiCardHintWithSignals = AiCardHint & {
  tacticSignals?: readonly string[];
  effects?: ReadonlyArray<{
    kind?: string;
    scope?: string;
    target?: string;
  }>;
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
      (eventMultiaccess ? 0.2 : 0) +
      (runnerRunCredits >= 6 ? 0.1 : 0),
  );
  const active =
    hqAgendaExposure ||
    pressure >= (serverId === "rd" ? 0.45 : 0.55) ||
    (visibleMultiaccess && runnerRunCredits >= (serverId === "rd" ? 2 : 1));

  return {
    serverId,
    active,
    pressure,
    runOrAccessEvents,
    successfulAccessEvents,
    visibleMultiaccess,
    eventMultiaccess,
    runnerRunCredits,
    hqAgendaExposure,
    evidence: [
      `corp_central_pressure_server:${serverId}`,
      `corp_central_pressure_events:${runOrAccessEvents}`,
      `corp_central_successful_access_events:${successfulAccessEvents}`,
      `corp_central_visible_multiaccess:${visibleMultiaccess}`,
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
    hint?.effects?.some(
      (effect) =>
        effect.kind === "multiaccess" &&
        (effect.scope === serverId || effect.target === serverId),
    ) === true
  ) {
    return true;
  }

  const text = `${card.title ?? ""} ${card.rulesText ?? ""} ${
    card.definitionId ?? ""
  }`.toLocaleLowerCase("en-US");
  if (
    !(
      text.includes("multiaccess") ||
      text.includes("additional card") ||
      text.includes("access 1 additional")
    )
  ) {
    return false;
  }
  if (serverId === "hq") return visibleTextHasToken(text, "hq");
  return (
    text.includes("r&d") ||
    visibleTextHasToken(text, "rd") ||
    visibleTextHasToken(text, "rnd")
  );
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

function visibleTextHasToken(text: string, token: string): boolean {
  return text.split(/[^a-z0-9]+/).includes(token);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
