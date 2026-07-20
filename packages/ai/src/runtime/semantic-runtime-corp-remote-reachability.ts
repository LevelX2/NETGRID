import type {
  AiDecisionInput,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";

import { createAiHintsByCard } from "../ai-hints";
import type { AiHintStructuredEffect } from "../hint-ontology";
import { mergedPublicHistory } from "./public-event-history";
import { rolesMatch } from "./role-match";

type CorpRemoteLike = {
  id: string;
  ice: readonly VisibleCard[];
  root: readonly VisibleCard[];
};

export type CorpRemoteProtectionActivationContext = {
  zone: "root" | "score_area";
  state: "current" | "after_install" | "after_rez";
  server?: CorpRemoteLike;
  serverId?: string;
  runnerTags?: number;
};

export type CorpObservedRemoteReachability = {
  applies: boolean;
  successfulAccessEvents: number;
  latestSuccessfulStateVersion?: number;
  evidence: string[];
};

const AI_HINTS_BY_CARD = createAiHintsByCard();

export function semanticRuntimeCorpObservedRemoteReachability(
  input: AiDecisionInput,
  serverId: string,
  server: CorpRemoteLike | undefined,
): CorpObservedRemoteReachability {
  const successfulEvents = mergedPublicHistory(input).filter(
    (event) =>
      publicActor(event) === "runner" &&
      successfulRemoteActionTypes.has(publicActionType(event)) &&
      eventServerId(event) === serverId,
  );
  const latest = successfulEvents.at(-1);
  const baseEvidence = [
    `corp_remote_observed_success_count:${successfulEvents.length}`,
    ...(latest
      ? [
          `corp_remote_observed_success_event:${latest.eventId}`,
          `corp_remote_observed_success_state_version:${latest.stateVersionAfter}`,
        ]
      : []),
  ];
  if (!latest) {
    return {
      applies: false,
      successfulAccessEvents: 0,
      evidence: [...baseEvidence, "corp_remote_observed_reachability:false"],
    };
  }
  if (!server || server.ice.some((ice) => ice.rezzed !== true)) {
    return {
      applies: false,
      successfulAccessEvents: successfulEvents.length,
      latestSuccessfulStateVersion: latest.stateVersionAfter,
      evidence: [
        ...baseEvidence,
        "corp_remote_observed_reachability:false",
        "corp_remote_observed_reachability_blocker:unrezzed_ice",
      ],
    };
  }
  const pathChange = mergedPublicHistory(input).find(
    (event) =>
      event.stateVersionAfter > latest.stateVersionAfter &&
      eventServerId(event) === serverId &&
      remotePathChangeEvent(event),
  );
  if (pathChange) {
    return {
      applies: false,
      successfulAccessEvents: successfulEvents.length,
      latestSuccessfulStateVersion: latest.stateVersionAfter,
      evidence: [
        ...baseEvidence,
        "corp_remote_observed_reachability:false",
        `corp_remote_observed_reachability_invalidated:${publicActionType(pathChange)}`,
        `corp_remote_observed_reachability_invalidation_event:${pathChange.eventId}`,
      ],
    };
  }
  if (
    server.root.some((card) =>
      visibleCorpRootProvidesRemoteProtection(card, {
        zone: "root",
        state: "current",
        server,
        serverId,
        runnerTags: input.playerView.opponent.tags,
      }),
    )
  ) {
    return {
      applies: false,
      successfulAccessEvents: successfulEvents.length,
      latestSuccessfulStateVersion: latest.stateVersionAfter,
      evidence: [
        ...baseEvidence,
        "corp_remote_observed_reachability:false",
        "corp_remote_observed_reachability_blocker:visible_root_protection",
      ],
    };
  }
  return {
    applies: true,
    successfulAccessEvents: successfulEvents.length,
    latestSuccessfulStateVersion: latest.stateVersionAfter,
    evidence: [
      ...baseEvidence,
      "corp_remote_observed_reachability:true",
      "corp_remote_observed_reachability_basis:unchanged_rezzed_path",
    ],
  };
}

export function visibleCorpRootProvidesRemoteProtection(
  card: VisibleCard,
  context: CorpRemoteProtectionActivationContext = {
    zone: "root",
    state: "current",
  },
): boolean {
  if (card.known === false || !card.definitionId) return false;
  const hint = AI_HINTS_BY_CARD.get(card.definitionId);
  if (!hint) return false;
  if (!protectionConditionsCanBeMet(card, hint.conditions ?? [], context)) {
    return false;
  }
  if (context.zone === "score_area") {
    return (
      card.type === "agenda" &&
      (hint.effects ?? []).some(
        (effect) =>
          effect.kind === "remote_protection" && effect.timing === "persistent",
      )
    );
  }
  if (card.type === "agenda") return false;

  const effects = hint.effects ?? [];
  if (
    effects.some((effect) => activeRootProtectionEffect(card, effect, context))
  ) {
    return true;
  }
  const roles = [...(hint?.roles ?? []), ...(hint?.planRoles ?? [])];
  return (
    rootCardIsRezzedAfterTransition(card, context) &&
    rolesMatch(roles, [
      "agenda_steal_tax",
      "remote_agenda_protection",
      "remote_upgrade_tax",
      "protect_remote",
    ])
  );
}

function activeRootProtectionEffect(
  card: VisibleCard,
  effect: AiHintStructuredEffect,
  context: CorpRemoteProtectionActivationContext,
): boolean {
  if (effect.timing === "on_access") {
    return accessProtectionEffectKinds.has(effect.kind);
  }
  if (effect.kind !== "remote_protection") return false;
  return rootCardIsRezzedAfterTransition(card, context);
}

function rootCardIsRezzedAfterTransition(
  card: VisibleCard,
  context: CorpRemoteProtectionActivationContext,
): boolean {
  return card.rezzed === true || context.state === "after_rez";
}

function protectionConditionsCanBeMet(
  card: VisibleCard,
  conditions: readonly { kind: string }[],
  context: CorpRemoteProtectionActivationContext,
): boolean {
  for (const condition of conditions) {
    switch (condition.kind) {
      case "requires_scored_agenda":
        if (context.zone !== "score_area" || card.type !== "agenda") {
          return false;
        }
        break;
      case "requires_advancement_counter":
        if ((card.advancementCounters ?? 0) <= 0) return false;
        break;
      case "requires_installed_ice":
        if (!context.server?.ice.length) return false;
        break;
      case "requires_rezzed_ice":
        if (!context.server?.ice.some((ice) => ice.rezzed === true)) {
          return false;
        }
        break;
      case "requires_remote_server":
        if (!context.serverId?.startsWith("remote_")) return false;
        break;
      case "requires_runner_tagged":
        if ((context.runnerTags ?? 0) <= 0) return false;
        break;
    }
  }
  return true;
}

const accessProtectionEffectKinds = new Set<AiHintStructuredEffect["kind"]>([
  "access_punish",
  "access_replacement",
  "ambush",
  "damage",
  "hardware_trash",
  "program_trash",
  "remote_protection",
  "run_tax",
  "tag_punish_payoff",
  "tag_source",
]);

function remotePathChangeEvent(event: PublicGameEvent): boolean {
  const actionType = publicActionType(event);
  if (actionType === "rez_ice") return true;
  if (actionType === "install_card") {
    return stringPayload(event.publicPayload, "installPlacement") === "ice";
  }
  return remotePathChangeActionTypes.has(actionType);
}

const successfulRemoteActionTypes = new Set([
  "access_card",
  "steal_agenda",
  "trash_accessed_card",
]);

const remotePathChangeActionTypes = new Set([
  "install_ice",
  "move_ice",
  "swap_ice",
  "trash_ice",
  "derez_ice",
]);

function publicActionType(event: PublicGameEvent): string {
  return stringPayload(event.publicPayload, "actionType") ?? event.type;
}

function publicActor(event: PublicGameEvent): string | undefined {
  return stringPayload(event.publicPayload, "actor");
}

function eventServerId(event: PublicGameEvent): string | undefined {
  const payload = event.publicPayload;
  const raw =
    stringPayload(payload, "serverId") ??
    stringPayload(payload, "targetServerId") ??
    stringPayload(payload, "attackedServerId") ??
    stringPayload(payload, "serverLabel") ??
    stringPayload(recordPayload(payload, "targets"), "serverId") ??
    stringPayload(recordPayload(payload, "targets"), "serverLabel");
  return normalizeServerId(raw);
}

function normalizeServerId(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLocaleLowerCase("en-US");
  const remoteMatch = normalized.match(/^remote[ _-]?(\d+)$/);
  if (remoteMatch) return `remote_${remoteMatch[1]}`;
  return normalized;
}

function recordPayload(
  payload: Record<string, unknown> | undefined,
  key: string,
): Record<string, unknown> | undefined {
  const value = payload?.[key];
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringPayload(
  payload: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = payload?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
