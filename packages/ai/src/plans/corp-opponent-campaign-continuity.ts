import type { AiDecisionInput, PublicGameEvent } from "@netgrid/shared";

import type { CorpPlanDomain } from "./corp-tactical-plan-modules";
import {
  RESIDENT_CORP_CAMPAIGN_SCHEMA_VERSION,
  type ResidentCorpCampaign,
  type ResidentCorpCampaignPublicOutcome,
  type ResidentPlanPortfolio,
} from "./resident-plan-portfolio";

export const CORP_OPPONENT_CAMPAIGN_CONTINUITY_VERSION =
  "corp-opponent-campaign-continuity-v1" as const;

export type CorpCampaignDescriptor = {
  campaignId: string;
  kind: ResidentCorpCampaign["kind"];
  moduleId: ResidentCorpCampaign["origin"]["moduleId"];
  rootPlanInstanceId: string;
  originStateVersion: number;
  milestoneId: string;
  targetServerId?: string;
  targetCardInstanceId?: string;
  openingRushOpportunityKey?: string;
  currentlyAdmitted: boolean;
  evidenceCode: string;
};

export function corpCampaignDescriptors(params: {
  domain: CorpPlanDomain;
  portfolio: ResidentPlanPortfolio;
}): CorpCampaignDescriptor[] {
  const descriptors: CorpCampaignDescriptor[] = [];
  for (const project of params.domain.scoreProjects) {
    const openingRush =
      project.openingRush?.status === "qualified"
        ? project.openingRush
        : undefined;
    if (
      !openingRush &&
      (project.terminalScore ||
        project.sameTurnCloseout ||
        !project.agendaInstanceId)
    ) {
      continue;
    }
    const root = rootInstance(
      params.portfolio,
      "corp.score_agenda",
      project.projectId,
    );
    if (!root) continue;
    descriptors.push({
      campaignId: `campaign:${project.projectId}`,
      kind: openingRush ? "opening_rush" : "agenda",
      moduleId: "corp.score_agenda",
      rootPlanInstanceId: root.instanceId,
      originStateVersion: root.createdAtStateVersion,
      milestoneId: project.phase,
      ...(project.serverId && project.serverId !== "new_remote"
        ? { targetServerId: project.serverId }
        : {}),
      ...(project.agendaInstanceId
        ? { targetCardInstanceId: project.agendaInstanceId }
        : {}),
      ...(openingRush
        ? {
            openingRushOpportunityKey: openingRush.quote.opportunityKey,
          }
        : {}),
      currentlyAdmitted: project.feasible || openingRush !== undefined,
      evidenceCode: project.evidenceCode,
    });
  }
  for (const need of params.domain.defenseNeeds) {
    if (
      need.kind !== "generic" ||
      need.serverId === "unknown" ||
      ![
        "install_ice",
        "install_defense_support",
        "rez_response",
        "activate_run_defense",
      ].includes(need.phase)
    ) {
      continue;
    }
    const root = rootInstance(params.portfolio, "corp.defend_servers");
    if (!root) continue;
    descriptors.push({
      campaignId: `campaign:corp.defend_servers:${need.defenseId}`,
      kind: "defense",
      moduleId: "corp.defend_servers",
      rootPlanInstanceId: root.instanceId,
      originStateVersion: root.createdAtStateVersion,
      milestoneId: need.phase,
      targetServerId: need.serverId,
      ...(need.targetIceInstanceId
        ? { targetCardInstanceId: need.targetIceInstanceId }
        : {}),
      currentlyAdmitted:
        need.urgent ||
        need.installRoute !== undefined ||
        need.rezRoute !== undefined ||
        need.rezWindowVerdict === "productive",
      evidenceCode: need.evidenceCode,
    });
  }
  return uniqueDescriptors(descriptors);
}

export function reconcileCorpCampaignContinuity(params: {
  input: AiDecisionInput;
  previous: readonly ResidentCorpCampaign[];
  descriptors: readonly CorpCampaignDescriptor[];
}): ResidentCorpCampaign[] {
  if (params.input.side !== "corp") return [];
  const descriptorById = new Map(
    params.descriptors.map((descriptor) => [descriptor.campaignId, descriptor]),
  );
  const previousById = new Map(
    params.previous.map((campaign) => [campaign.campaignId, campaign]),
  );
  const campaignIds = [
    ...new Set([...descriptorById.keys(), ...previousById.keys()]),
  ].sort();
  return campaignIds
    .map((campaignId) => {
      const descriptor = descriptorById.get(campaignId);
      const previous = previousById.get(campaignId);
      return reconcileCampaign(params.input, descriptor, previous);
    })
    .filter((campaign): campaign is ResidentCorpCampaign => campaign !== null)
    .sort((left, right) => left.campaignId.localeCompare(right.campaignId));
}

function reconcileCampaign(
  input: AiDecisionInput,
  descriptor: CorpCampaignDescriptor | undefined,
  previous: ResidentCorpCampaign | undefined,
): ResidentCorpCampaign | null {
  if (!descriptor && !previous) return null;
  const stateVersion = input.playerView.stateVersion;
  const origin = descriptor
    ? {
        rootPlanInstanceId: descriptor.rootPlanInstanceId,
        moduleId: descriptor.moduleId,
        ...(descriptor.targetServerId
          ? { targetServerId: descriptor.targetServerId }
          : {}),
        ...(descriptor.targetCardInstanceId
          ? { targetCardInstanceId: descriptor.targetCardInstanceId }
          : {}),
        ...(descriptor.openingRushOpportunityKey
          ? {
              openingRushOpportunityKey: descriptor.openingRushOpportunityKey,
            }
          : {}),
      }
    : structuredClone(previous!.origin);
  const base: ResidentCorpCampaign = previous
    ? structuredClone(previous)
    : {
        schemaVersion: RESIDENT_CORP_CAMPAIGN_SCHEMA_VERSION,
        campaignId: descriptor!.campaignId,
        kind: descriptor!.kind,
        status:
          input.playerView.activeSide === "runner"
            ? "awaiting_opponent_outcome"
            : descriptor!.currentlyAdmitted
              ? "continuable"
              : "blocked",
        origin,
        milestoneId: descriptor!.milestoneId,
        createdAtStateVersion: descriptor!.originStateVersion,
        updatedAtStateVersion: stateVersion,
        observedThroughStateVersion: descriptor!.originStateVersion,
        requote: {
          status:
            input.playerView.activeSide === "runner"
              ? "awaiting_next_own_turn"
              : descriptor!.currentlyAdmitted
                ? "current"
                : "required_now",
          reasonCode:
            input.playerView.activeSide === "runner"
              ? "campaign_waits_for_public_opponent_outcomes"
              : descriptor!.currentlyAdmitted
                ? "campaign_current_quote_available"
                : "campaign_current_quote_blocked",
          ...(input.playerView.activeSide === "corp"
            ? { lastQuotedAtStateVersion: stateVersion }
            : {}),
        },
        publicOutcomes: [],
        evidenceCodes: [
          CORP_OPPONENT_CAMPAIGN_CONTINUITY_VERSION,
          descriptor!.evidenceCode,
        ],
      };
  base.origin = origin;
  base.kind = descriptor?.kind ?? base.kind;
  base.milestoneId = descriptor?.milestoneId ?? base.milestoneId;
  base.updatedAtStateVersion = stateVersion;

  const newOutcomes = publicOutcomesForCampaign(
    input,
    base,
    base.observedThroughStateVersion,
  );
  base.publicOutcomes = uniqueOutcomes([
    ...base.publicOutcomes,
    ...newOutcomes,
  ]).slice(-32);
  base.observedThroughStateVersion = stateVersion;

  const terminal = visibleTerminalStatus(input, base);
  const compromised = base.publicOutcomes.some(
    (outcome) =>
      outcome.kind === "remote_compromised" &&
      outcome.stateVersionAfter > (previous?.observedThroughStateVersion ?? -1),
  );
  if (terminal) {
    base.status = terminal.status;
    base.requote = {
      status: "not_applicable",
      reasonCode: terminal.reasonCode,
    };
    base.evidenceCodes = sortedUnique([
      ...base.evidenceCodes,
      terminal.reasonCode,
    ]);
    return base;
  }

  if (input.playerView.activeSide === "runner") {
    base.status = compromised ? "blocked" : "awaiting_opponent_outcome";
    base.requote = {
      status: "awaiting_next_own_turn",
      reasonCode: compromised
        ? "campaign_remote_compromised_awaiting_own_turn_requote"
        : "campaign_waits_for_public_opponent_outcomes",
    };
  } else if (descriptor?.currentlyAdmitted) {
    base.status = "continuable";
    base.requote = {
      status: "current",
      reasonCode:
        base.publicOutcomes.length > 0
          ? "campaign_requoted_after_public_opponent_outcomes"
          : "campaign_current_quote_available",
      lastQuotedAtStateVersion: stateVersion,
    };
  } else {
    base.status = "blocked";
    base.requote = {
      status: "required_now",
      reasonCode: descriptor
        ? "campaign_current_quote_blocked"
        : "campaign_descriptor_missing_after_opponent_turn",
    };
  }
  base.evidenceCodes = sortedUnique([
    ...base.evidenceCodes,
    descriptor?.evidenceCode ?? "campaign_retained_without_current_descriptor",
    ...newOutcomes.map((outcome) => outcome.evidenceCode),
    `campaign_status:${base.status}`,
    `campaign_requote:${base.requote.status}`,
  ]);
  return base;
}

function publicOutcomesForCampaign(
  input: AiDecisionInput,
  campaign: ResidentCorpCampaign,
  afterStateVersion: number,
): ResidentCorpCampaignPublicOutcome[] {
  const events = uniquePublicEvents(input)
    .filter(
      (event) =>
        event.stateVersionAfter > afterStateVersion &&
        event.stateVersionAfter <= input.playerView.stateVersion,
    )
    .sort(comparePublicEvents);
  return events.flatMap((event) => outcomesForEvent(event, campaign));
}

function outcomesForEvent(
  event: PublicGameEvent,
  campaign: ResidentCorpCampaign,
): ResidentCorpCampaignPublicOutcome[] {
  const payload = event.publicPayload;
  const actionType =
    typeof payload.actionType === "string" ? payload.actionType : event.type;
  const actor =
    payload.actor === "corp" || payload.actor === "runner"
      ? payload.actor
      : undefined;
  const targetServerId = firstString(
    payload.serverId,
    payload.targetServerId,
    payload.attackedServerId,
    payload.accessServerId,
    isRecord(payload.targets) ? payload.targets.serverId : undefined,
  );
  const targetCardInstanceId = firstString(
    payload.cardId,
    payload.targetCardId,
    payload.accessedCardId,
    payload.trashedCardId,
    payload.sourceCardInstanceId,
  );
  const sameServer =
    targetServerId === undefined ||
    campaign.origin.targetServerId === undefined ||
    targetServerId === campaign.origin.targetServerId;
  const sameCard =
    targetCardInstanceId === undefined ||
    campaign.origin.targetCardInstanceId === undefined ||
    targetCardInstanceId === campaign.origin.targetCardInstanceId;
  const outcomes: ResidentCorpCampaignPublicOutcome[] = [];
  const add = (
    kind: ResidentCorpCampaignPublicOutcome["kind"],
    milestoneId: string,
    evidenceCode: string,
    origin: ResidentCorpCampaignPublicOutcome["origin"] = "public_event",
  ) => {
    outcomes.push({
      outcomeId: `${event.eventId}:${kind}:${campaign.campaignId}`,
      eventId: event.eventId,
      eventType: event.type,
      stateVersionAfter: event.stateVersionAfter,
      kind,
      ...(actor ? { actor } : {}),
      ...(targetServerId ? { targetServerId } : {}),
      ...(targetCardInstanceId ? { targetCardInstanceId } : {}),
      milestoneId,
      origin,
      evidenceCode,
    });
  };

  const runEvent =
    ["start_run", "run", "continue_run"].includes(actionType) ||
    payload.runStarted === true;
  if (runEvent && sameServer) {
    add("run_declared", "opponent_run_observed", "campaign_public_run");
  }
  if (
    sameServer &&
    (payload.runEnded === true ||
      payload.runSuccessful === true ||
      ["end_run", "jack_out"].includes(actionType))
  ) {
    add(
      "run_completed",
      "opponent_run_resolved",
      "campaign_public_run_outcome",
    );
  }
  if (
    sameServer &&
    (["rez_ice", "rez_card"].includes(actionType) ||
      payload.rezzed === true ||
      typeof payload.rezCostPaid === "number")
  ) {
    add("corp_rez", "campaign_defense_rezzed", "campaign_public_rez");
  }
  if (
    actionType.includes("trace") ||
    payload.traceStarted === true ||
    typeof payload.traceSuccessful === "boolean"
  ) {
    add(
      "trace_resolved",
      "campaign_trace_outcome_observed",
      "campaign_public_trace",
    );
  }
  const accessEvent =
    ["access_card", "steal_agenda"].includes(actionType) ||
    payload.accessed === true ||
    (targetCardInstanceId !== undefined &&
      typeof payload.accessedFromZone === "string");
  if (accessEvent && sameServer) {
    add(
      "access_resolved",
      "campaign_target_accessed",
      "campaign_public_access",
    );
    if (campaign.origin.targetServerId?.startsWith("remote_")) {
      add(
        "remote_compromised",
        "campaign_remote_compromised",
        "campaign_remote_compromised_by_access",
        "visible_state_derivation",
      );
    }
  }
  const trashEvent =
    actionType.includes("trash") ||
    typeof payload.trashedCount === "number" ||
    typeof payload.trashedCardDefinitionId === "string";
  if (trashEvent && sameServer && sameCard) {
    add("card_trashed", "campaign_material_trashed", "campaign_public_trash");
    if (campaign.origin.targetServerId?.startsWith("remote_")) {
      add(
        "remote_compromised",
        "campaign_remote_compromised",
        "campaign_remote_compromised_by_trash",
        "visible_state_derivation",
      );
    }
  }
  return outcomes;
}

function visibleTerminalStatus(
  input: AiDecisionInput,
  campaign: ResidentCorpCampaign,
):
  | {
      status: "completed" | "abandoned";
      reasonCode: string;
    }
  | undefined {
  const targetCardInstanceId = campaign.origin.targetCardInstanceId;
  if (
    targetCardInstanceId &&
    input.playerView.own.scoreArea.some(
      (card) => card.instanceId === targetCardInstanceId,
    )
  ) {
    return {
      status: "completed",
      reasonCode: "campaign_target_agenda_scored",
    };
  }
  const targetServerId = campaign.origin.targetServerId;
  if (
    targetServerId?.startsWith("remote_") &&
    !input.playerView.servers.some((server) => server.id === targetServerId)
  ) {
    return {
      status: "abandoned",
      reasonCode: "campaign_target_remote_missing",
    };
  }
  if (
    targetCardInstanceId &&
    !visibleOwnCards(input).some(
      (card) => card.instanceId === targetCardInstanceId,
    )
  ) {
    return {
      status: "abandoned",
      reasonCode: "campaign_target_card_missing",
    };
  }
  if (
    campaign.publicOutcomes.some(
      (outcome) =>
        outcome.kind === "card_trashed" &&
        outcome.targetCardInstanceId === targetCardInstanceId,
    )
  ) {
    return {
      status: "abandoned",
      reasonCode: "campaign_target_card_publicly_trashed",
    };
  }
  return undefined;
}

function visibleOwnCards(input: AiDecisionInput) {
  return [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.own.heapOrArchives,
    ...input.playerView.own.scoreArea,
    ...(input.playerView.own.rig ?? []),
    ...input.playerView.servers.flatMap((server) => [
      ...server.root,
      ...server.ice,
    ]),
  ];
}

function rootInstance(
  portfolio: ResidentPlanPortfolio,
  moduleId: CorpCampaignDescriptor["moduleId"],
  dedupeKey?: string,
) {
  return (
    portfolio.instances.find(
      (instance) =>
        instance.moduleId === moduleId &&
        (dedupeKey === undefined || instance.dedupeKey === dedupeKey),
    ) ?? portfolio.instances.find((instance) => instance.moduleId === moduleId)
  );
}

function uniqueDescriptors(
  descriptors: readonly CorpCampaignDescriptor[],
): CorpCampaignDescriptor[] {
  const byId = new Map<string, CorpCampaignDescriptor>();
  for (const descriptor of [...descriptors].sort(
    (left, right) =>
      left.campaignId.localeCompare(right.campaignId) ||
      Number(right.currentlyAdmitted) - Number(left.currentlyAdmitted) ||
      left.milestoneId.localeCompare(right.milestoneId) ||
      left.evidenceCode.localeCompare(right.evidenceCode),
  )) {
    if (!byId.has(descriptor.campaignId)) {
      byId.set(descriptor.campaignId, structuredClone(descriptor));
    }
  }
  return [...byId.values()];
}

function uniqueOutcomes(
  outcomes: readonly ResidentCorpCampaignPublicOutcome[],
): ResidentCorpCampaignPublicOutcome[] {
  const byId = new Map<string, ResidentCorpCampaignPublicOutcome>();
  for (const outcome of outcomes) {
    byId.set(outcome.outcomeId, structuredClone(outcome));
  }
  return [...byId.values()].sort(
    (left, right) =>
      left.stateVersionAfter - right.stateVersionAfter ||
      left.outcomeId.localeCompare(right.outcomeId),
  );
}

function uniquePublicEvents(input: AiDecisionInput): PublicGameEvent[] {
  const byId = new Map<string, PublicGameEvent>();
  for (const event of [...input.playerView.publicEvents, ...input.eventTail]) {
    byId.set(event.eventId, event);
  }
  return [...byId.values()];
}

function comparePublicEvents(
  left: PublicGameEvent,
  right: PublicGameEvent,
): number {
  return (
    left.stateVersionAfter - right.stateVersionAfter ||
    left.eventId.localeCompare(right.eventId)
  );
}

function firstString(...values: unknown[]): string | undefined {
  return values.find(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}
