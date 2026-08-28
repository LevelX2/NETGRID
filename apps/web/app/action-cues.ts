import type {
  PlayerView,
  PublicGameEvent,
  Side,
  VisibleCard,
} from "@netgrid/shared";
import {
  formatChronicleEffectItems,
  formatChronicleEvent,
  isSocialEngineeringHiddenAmountSelectionEvent,
  tagGainAmountFromPublicPayload,
  type ChronicleContext,
  type ChronicleImportance,
  type ChronicleItem,
  type ChronicleTranslate,
  type ChronicleVisibility,
} from "./chronicle";
import { serverDisplayLabel } from "./action-board-ui";
import { publicAccessOwnsOutcomeEvent } from "./access-presentation";
import { coalesceAiPumpPresentationEvents } from "./ai-pump-presentation";
import { payloadHasAbility } from "./action-payload";

export type OpponentActionCue = {
  cueId: string;
  eventId: string;
  viewerSide: Side;
  actor?: Side;
  actorLabel: string;
  actionUse?: CueActionUse;
  opponent: boolean;
  source: "human" | "ai" | "system";
  actionType: string;
  title: string;
  description?: string;
  cardDefinitionId?: string;
  cardTitle?: string;
  visibility: ChronicleVisibility;
  importance: ChronicleImportance;
  highlight?: BoardHighlight;
  relatedCard?: VisibleCard;
  relatedCardPositionBadge?: string;
  sound?: ActionSoundKind;
  soundCount?: number;
  aiExplanation?: string;
  iconBadge?: string;
  presentationKind?: "trace_bid" | "trace_result";
  presentationLabel?: string;
};

export type DamageImpactCue = {
  cueId: string;
  eventId: string;
  viewerSide: Side;
  damageType: "net" | "meat" | "core";
  amount: number;
  cardsTrashed?: number;
  runnerGripBefore?: number;
  runnerGripAfter?: number;
  flatline: boolean;
  coreDamageAfter?: number;
  runnerMaxHandSizeAfter?: number;
  sourceLabel: string;
};

export type DamageImpactAudioCue = {
  sound: "damage_net" | "damage_meat" | "damage_core" | "flatline";
  soundCount: number;
};

export type CueActionUse = {
  label: string;
  title: string;
  clicks: number;
  start: number;
  end: number;
};

export type BoardHighlight =
  | {
      kind: "server";
      serverId?: string;
      serverLabel?: string;
      lane?: "ice" | "root" | "central";
    }
  | {
      kind: "card";
      cardInstanceId?: string;
      cardDefinitionId?: string;
      title?: string;
    }
  | {
      kind: "zone";
      side: Side;
      zone:
        | "hq"
        | "rd"
        | "archives"
        | "grip"
        | "stack"
        | "heap"
        | "rig"
        | "scoreArea";
    }
  | { kind: "run"; serverId?: string; serverLabel?: string; phase?: string }
  | { kind: "economy"; side: Side }
  | { kind: "decision"; side: Side };

export type ActionSoundKind =
  | "turn"
  | "runner_turn"
  | "corp_turn"
  | "draw"
  | "credit"
  | "install_hidden"
  | "install_known"
  | "play"
  | "rez"
  | "ice_rez"
  | "run"
  | "run_start"
  | "access"
  | "agenda"
  | "agenda_runner"
  | "agenda_corp"
  | "trash"
  | "gain_tag"
  | "damage"
  | "damage_net"
  | "damage_meat"
  | "damage_core"
  | "flatline"
  | "tag_or_damage"
  | "choice"
  | "game_end";

export type TurnStartAudioState = {
  matchId: string;
  stateVersion: number;
  activeSide: Side;
  phase: PlayerView["phase"];
};

export type TurnStartAudioCue = {
  key: string;
  side: Side;
  sound: ActionSoundKind;
};

export type CueDerivationInput = {
  viewerSide: Side;
  playerView: PlayerView;
  events: PublicGameEvent[];
  lastPresentedEventId?: string | null;
  includeOwnActions?: boolean;
  includeAutomaticEffectCues?: boolean;
  translate?: ChronicleTranslate;
  contextByEventId?: Record<string, Omit<ChronicleContext, "side">>;
};

export function deriveOpponentActionCues(
  input: CueDerivationInput,
): OpponentActionCue[] {
  const actionUsesByEventId = deriveTurnActionUses(
    input.events,
    input.translate,
  );
  const relevantEvents = eventsAfter(input.events, input.lastPresentedEventId);
  const presentationEvents = coalesceAiPumpPresentationEvents(relevantEvents);
  const localAttention = hasLocalAttention(input.playerView, input.viewerSide);
  const visibleCards = visibleCardsByDefinition(input.playerView);

  const cues = presentationEvents.flatMap((event) => {
    const payload = event.publicPayload ?? {};
    const actionType = stringValue(payload.actionType) ?? event.type;
    if (
      actionType === "access_card" &&
      stringValue(payload.cardDefinitionId) &&
      stringValue(payload.title)
    )
      return [];
    if (publicAccessOwnsOutcomeEvent(input.events, event)) return [];
    const actor = sideValue(payload.actor);
    const opponent = Boolean(actor && actor !== input.viewerSide);
    const tracePresentation = traceCuePresentation(payload, input.translate);
    const forcedPublicEffectCue = isForcedPublicEffectCue(actionType, payload);
    const forcedEffectCueEntries = localizedForcedEffectCueItems(
      event,
      input.viewerSide,
      input.contextByEventId?.[event.eventId]?.cardPresentationsById,
      input.translate,
    );
    const forcedEffectCueItems = forcedEffectCueEntries.map(
      (entry) => entry.item,
    );
    const systemCue =
      !actor &&
      actionType !== "game_created" &&
      (input.includeAutomaticEffectCues || actionType === "game_end");
    if (
      actionType === "resolve_choice" &&
      stringValue(payload.hiddenZoneAction) === "p3_33_private_look"
    )
      return [];
    if (isSocialEngineeringHiddenAmountSelectionEvent(event)) return [];
    if (
      !input.includeOwnActions &&
      !opponent &&
      !systemCue &&
      !forcedPublicEffectCue &&
      tracePresentation?.kind !== "trace_result" &&
      forcedEffectCueItems.length === 0
    )
      return [];
    if (
      actionType === "end_turn" &&
      opponent &&
      localAttention &&
      !input.playerView.pendingChoice
    )
      return [];

    const item = formatChronicleEvent(event, input.viewerSide, {
      ...(input.contextByEventId?.[event.eventId] ?? {}),
      ...(input.translate ? { translate: input.translate } : {}),
    });
    const aiExplanation = stringValue(payload.aiExplanation);
    const source =
      aiExplanation || stringValue(payload.aiReasonCode)
        ? "ai"
        : forcedPublicEffectCue || !actor
          ? "system"
          : "human";
    const visibility = item.visibility;
    const highlight = deriveHighlight(
      actionType,
      payload,
      actor,
      visibility,
      visibleCards,
    );
    const relatedCard = deriveRelatedCard(payload, visibility, visibleCards);
    const relatedCardPositionBadge = relatedCard
      ? relatedIcePositionBadge(input.playerView, relatedCard)
      : undefined;
    const hasDedicatedImpactEffect = forcedEffectCueEntries.some(
      (entry) => entry.tagGain || entry.damage,
    );
    const sound = hasDedicatedImpactEffect
      ? undefined
      : actionSoundForActionType(actionType, visibility);
    const soundCount = sound
      ? actionSoundCountForAction(actionType, payload)
      : 1;

    const cue: OpponentActionCue = {
      cueId: `${input.viewerSide}:${event.eventId}`,
      eventId: event.eventId,
      viewerSide: input.viewerSide,
      ...(actor ? { actor } : {}),
      actorLabel: actorLabel(actor, source, input.translate),
      ...(actionUsesByEventId[event.eventId]
        ? { actionUse: actionUsesByEventId[event.eventId] }
        : {}),
      opponent,
      source,
      actionType,
      title: item.title,
      ...(item.description ? { description: item.description } : {}),
      ...(item.cardDefinitionId
        ? { cardDefinitionId: item.cardDefinitionId }
        : {}),
      ...(item.cardTitle ? { cardTitle: item.cardTitle } : {}),
      visibility,
      importance: item.importance,
      ...(highlight ? { highlight } : {}),
      ...(relatedCard ? { relatedCard } : {}),
      ...(relatedCardPositionBadge ? { relatedCardPositionBadge } : {}),
      ...(sound ? { sound } : {}),
      ...(sound && soundCount > 1 ? { soundCount } : {}),
      ...(aiExplanation ? { aiExplanation } : {}),
      ...(tracePresentation
        ? {
            presentationKind: tracePresentation.kind,
            presentationLabel: tracePresentation.label,
          }
        : {}),
      ...(tracePresentation?.badge
        ? { iconBadge: tracePresentation.badge }
        : {}),
    };
    const effectCues = forcedEffectCueEntries.map(
      ({ item: effectItem, tagGain, damage }, index): OpponentActionCue => {
        const tagGainAmount = tagGain
          ? tagGainAmountFromPublicPayload(payload)
          : 0;
        const relatedCard = effectItem.cardDefinitionId
          ? visibleCards.get(effectItem.cardDefinitionId)
          : undefined;
        const relatedCardPositionBadge = relatedCard
          ? relatedIcePositionBadge(input.playerView, relatedCard)
          : undefined;
        const effectSound = tagGain
          ? "gain_tag"
          : damage
            ? undefined
            : "tag_or_damage";
        return {
          cueId: `${input.viewerSide}:${event.eventId}:effect:${index}`,
          eventId: event.eventId,
          viewerSide: input.viewerSide,
          ...(effectItem.actor
            ? { actor: effectItem.actor }
            : actor
              ? { actor }
              : {}),
          actorLabel: actorLabel(
            effectItem.actor ?? actor,
            "system",
            input.translate,
          ),
          ...(actionUsesByEventId[event.eventId]
            ? { actionUse: actionUsesByEventId[event.eventId] }
            : {}),
          opponent: Boolean(
            (effectItem.actor ?? actor) &&
            (effectItem.actor ?? actor) !== input.viewerSide,
          ),
          source: "system",
          actionType,
          title: effectItem.title,
          ...(effectItem.description
            ? { description: effectItem.description }
            : {}),
          ...(effectItem.cardDefinitionId
            ? { cardDefinitionId: effectItem.cardDefinitionId }
            : {}),
          ...(effectItem.cardTitle ? { cardTitle: effectItem.cardTitle } : {}),
          visibility: effectItem.visibility,
          importance: effectItem.importance,
          ...(relatedCard ? { relatedCard } : {}),
          ...(relatedCardPositionBadge ? { relatedCardPositionBadge } : {}),
          ...(tagGainAmount > 0 ? { iconBadge: `+${tagGainAmount}` } : {}),
          ...(effectSound ? { sound: effectSound } : {}),
        };
      },
    );
    return technicalRezPassEvent(actionType, payload)
      ? effectCues
      : [cue, ...effectCues];
  });

  return cues;
}

function traceCuePresentation(
  payload: Record<string, unknown>,
  translate?: ChronicleTranslate,
):
  | {
      kind: "trace_bid" | "trace_result";
      label: string;
      badge?: string;
    }
  | undefined {
  const traceStep = stringValue(payload.traceStep);
  const resolved =
    (traceStep === "runner_bid" || traceStep === "post_bid_link") &&
    typeof payload.traceSuccessful === "boolean";
  if (resolved) {
    const traceValue = nonNegativeIntegerValue(payload.traceValue);
    const runnerStrength = nonNegativeIntegerValue(payload.runnerStrength);
    return {
      kind: "trace_result",
      label: translate?.("trace.resultWindowLabel") ?? "Trace-Ergebnis",
      ...(traceValue !== undefined && runnerStrength !== undefined
        ? { badge: `${traceValue}:${runnerStrength}` }
        : {}),
    };
  }
  if (traceStep !== "corp_bid") return undefined;
  return {
    kind: "trace_bid",
    label: translate?.("trace.bidWindowLabel") ?? "Trace-Gebot",
  };
}

function technicalRezPassEvent(
  actionType: string,
  payload: Record<string, unknown>,
): boolean {
  return (
    actionType === "decline_rez" &&
    (payload.runRootRezPass === true ||
      payload.runFortPassPass === true ||
      payload.runApproachRootRezPass === true)
  );
}

export function deriveDamageImpactCues(
  input: Pick<
    CueDerivationInput,
    "viewerSide" | "playerView" | "events" | "lastPresentedEventId"
  > & { translate?: ChronicleTranslate },
): DamageImpactCue[] {
  const visibleCards = visibleCardsByDefinition(input.playerView);
  return eventsAfter(input.events, input.lastPresentedEventId)
    .map((event): DamageImpactCue | null => {
      const payload = event.publicPayload ?? {};
      if (payload.damageResolved !== true) return null;
      const damageType = damageTypeValue(payload.damageType);
      if (!damageType) return null;
      const amount =
        nonNegativeIntegerValue(payload.damageAmount) ??
        positiveIntegerValue(payload.cardsTrashed) ??
        0;
      const preventedAmount = positiveIntegerValue(payload.preventedAmount);
      if (
        amount <= 0 &&
        payload.flatline !== true &&
        preventedAmount === undefined
      )
        return null;
      const cardsTrashed = nonNegativeIntegerValue(payload.cardsTrashed);
      const runnerGripBefore = nonNegativeIntegerValue(
        payload.runnerGripBefore,
      );
      const runnerGripAfter = nonNegativeIntegerValue(payload.runnerGripAfter);
      const coreDamageAfter = nonNegativeIntegerValue(payload.coreDamageAfter);
      const runnerMaxHandSizeAfter =
        nonNegativeIntegerValue(payload.runnerMaxHandSizeAfter) ??
        currentRunnerMaxHandSize(input.playerView, input.viewerSide);
      const resolvedDamageEffect = Array.isArray(payload.resolvedEffects)
        ? (payload.resolvedEffects.find(
            (effect) =>
              effect !== null &&
              typeof effect === "object" &&
              (effect as Record<string, unknown>).kind === "damage",
          ) as Record<string, unknown> | undefined)
        : undefined;
      const sourceDefinitionId =
        stringValue(payload.sourceDefinitionId) ??
        stringValue(payload.cardDefinitionId) ??
        stringValue(payload.publicRevealDefinitionId) ??
        stringValue(resolvedDamageEffect?.sourceDefinitionId);
      const visibleSource = sourceDefinitionId
        ? visibleCards.get(sourceDefinitionId)
        : undefined;
      const sourceLabel =
        visibleSource?.title ??
        stringValue(payload.title) ??
        stringValue(resolvedDamageEffect?.sourceTitle) ??
        input.translate?.("effect.corpEffect") ??
        "Korp-Effekt";
      return {
        cueId: `${input.viewerSide}:${event.eventId}:damage-impact`,
        eventId: event.eventId,
        viewerSide: input.viewerSide,
        damageType,
        amount,
        ...(cardsTrashed !== undefined ? { cardsTrashed } : {}),
        ...(runnerGripBefore !== undefined ? { runnerGripBefore } : {}),
        ...(runnerGripAfter !== undefined ? { runnerGripAfter } : {}),
        flatline: payload.flatline === true,
        ...(coreDamageAfter !== undefined ? { coreDamageAfter } : {}),
        ...(runnerMaxHandSizeAfter !== undefined
          ? { runnerMaxHandSizeAfter }
          : {}),
        sourceLabel,
      };
    })
    .filter((cue): cue is DamageImpactCue => Boolean(cue));
}

export function damageAudioCueFromPublicPayload(
  payload: Record<string, unknown>,
): DamageImpactAudioCue | null {
  if (payload.flatline === true)
    return {
      sound: "flatline",
      soundCount: 1,
    };
  const rootDamageType = damageTypeValue(payload.damageType);
  const resolvedAmount =
    payload.damageResolved === true
      ? (nonNegativeIntegerValue(payload.damageAmount) ?? 0)
      : undefined;
  const damageEffects = Array.isArray(payload.resolvedEffects)
    ? payload.resolvedEffects.filter(
        (effect): effect is Record<string, unknown> =>
          Boolean(
            effect &&
            typeof effect === "object" &&
            (effect as Record<string, unknown>).kind === "damage",
          ),
      )
    : [];
  const effectTypes = new Set(
    damageEffects
      .map((effect) => damageTypeValue(effect.damageType))
      .filter(Boolean),
  );
  const damageType =
    rootDamageType ??
    (effectTypes.size === 1 ? [...effectTypes][0] : undefined);
  if (!damageType) return null;
  const effectAmount = damageEffects.reduce(
    (total, effect) => total + (nonNegativeIntegerValue(effect.amount) ?? 0),
    0,
  );
  const amount = resolvedAmount ?? effectAmount;
  if (amount <= 0) return null;
  return {
    sound: `damage_${damageType}`,
    soundCount: Math.min(3, amount),
  };
}

export function cueHasHiddenLeak(cue: OpponentActionCue): boolean {
  const serialized = JSON.stringify(cue);
  if (cue.visibility !== "redacted")
    return /cardInstances|sessionToken|joinToken|privatePayload/i.test(
      serialized,
    );
  return /cardInstances|sessionToken|joinToken|privatePayload|imageUrl|Simple Agenda|simple_agenda/i.test(
    serialized,
  );
}

export function eventsAfter(
  events: PublicGameEvent[],
  lastPresentedEventId?: string | null,
): PublicGameEvent[] {
  if (!lastPresentedEventId) return events;
  const index = events.findIndex(
    (event) => event.eventId === lastPresentedEventId,
  );
  return index >= 0 ? events.slice(index + 1) : [];
}

function deriveTurnActionUses(
  events: PublicGameEvent[],
  translate?: ChronicleTranslate,
): Record<string, CueActionUse> {
  const spentBySide: Partial<Record<Side, number>> = {};
  const result: Record<string, CueActionUse> = {};
  for (const event of events) {
    const payload = event.publicPayload ?? {};
    const actionType = stringValue(payload.actionType) ?? event.type;
    const actor = sideValue(payload.actor);
    if (!actor) continue;

    const clicks = positiveIntegerValue(payload.actionCostClicks);
    if (clicks !== undefined) {
      const runningStart = (spentBySide[actor] ?? 0) + 1;
      const payloadStart = positiveIntegerValue(payload.turnActionOrdinalStart);
      const start = Math.max(runningStart, payloadStart ?? 0);
      const payloadEnd = positiveIntegerValue(payload.turnActionOrdinalEnd);
      const end = Math.max(start + clicks - 1, payloadEnd ?? 0);
      result[event.eventId] = {
        label: start === end ? String(start) : `${start}-${end}`,
        title:
          start === end
            ? (translate?.("actionUse.single", { start }) ??
              `${start}. Aktion in diesem Zug`)
            : (translate?.("actionUse.range", { start, end }) ??
              `Aktionen ${start} bis ${end} in diesem Zug`),
        clicks,
        start,
        end,
      };
      spentBySide[actor] = end;
    }

    if (actionType === "end_turn") spentBySide[actor] = 0;
  }
  return result;
}

function deriveHighlight(
  actionType: string,
  payload: Record<string, unknown>,
  actor: Side | undefined,
  visibility: ChronicleVisibility,
  visibleCards: Map<string, VisibleCard>,
): BoardHighlight | undefined {
  if (actionType === "game_created") return undefined;
  if (
    actionType === "start_run" ||
    actionType === "continue_run" ||
    actionType === "rez_ice" ||
    actionType === "decline_rez" ||
    actionType === "break_subroutine" ||
    actionType === "pump_breaker"
  ) {
    return {
      kind: "run",
      ...(stringValue(payload.serverId)
        ? { serverId: stringValue(payload.serverId)! }
        : {}),
      ...(stringValue(payload.serverLabel)
        ? { serverLabel: serverDisplayLabel(stringValue(payload.serverLabel)!) }
        : {}),
      ...(stringValue(payload.runPhase)
        ? { phase: stringValue(payload.runPhase)! }
        : {}),
    };
  }
  if (actionType === "mandatory_draw" || actionType === "draw_card") {
    return {
      kind: "zone",
      side: actor ?? "corp",
      zone: actor === "runner" ? "grip" : "hq",
    };
  }
  if (actionType === "gain_credit")
    return { kind: "economy", side: actor ?? "corp" };
  if (actionType === "score_agenda")
    return { kind: "zone", side: "corp", zone: "scoreArea" };
  if (actionType === "steal_agenda")
    return { kind: "zone", side: "runner", zone: "scoreArea" };
  if (actionType === "access_card") {
    return {
      kind: "server",
      ...(stringValue(payload.serverId)
        ? { serverId: stringValue(payload.serverId)! }
        : {}),
      ...(stringValue(payload.serverLabel)
        ? { serverLabel: serverDisplayLabel(stringValue(payload.serverLabel)!) }
        : {}),
      lane: "central",
    };
  }
  if (actionType === "trash_accessed_card")
    return {
      kind: "zone",
      side: actor === "runner" ? "corp" : "runner",
      zone: actor === "runner" ? "archives" : "heap",
    };
  if (actionType === "trash_resource" || actionType === "remove_tag")
    return { kind: "zone", side: "runner", zone: "rig" };
  if (visibility === "redacted") return serverHighlight(payload);

  const cardDefinitionId =
    stringValue(payload.cardDefinitionId) ??
    stringValue(payload.sourceDefinitionId);
  const visibleCard = cardDefinitionId
    ? visibleCards.get(cardDefinitionId)
    : undefined;
  if (visibleCard?.instanceId) {
    return {
      kind: "card",
      cardInstanceId: visibleCard.instanceId,
      ...(visibleCard.definitionId
        ? { cardDefinitionId: visibleCard.definitionId }
        : {}),
      ...(visibleCard.title ? { title: visibleCard.title } : {}),
    };
  }

  if (actionType === "install_card") {
    if (actor === "runner")
      return { kind: "zone", side: "runner", zone: "rig" };
    return serverHighlight(payload);
  }
  if (actionType === "play_event")
    return { kind: "zone", side: "runner", zone: "heap" };
  if (actionType === "play_operation")
    return { kind: "zone", side: "corp", zone: "archives" };
  if (actionType === "advance_card") return serverHighlight(payload);
  return undefined;
}

function deriveRelatedCard(
  payload: Record<string, unknown>,
  visibility: ChronicleVisibility,
  visibleCards: Map<string, VisibleCard>,
): VisibleCard | undefined {
  if (visibility === "redacted") return undefined;
  const cardDefinitionId =
    stringValue(payload.cardDefinitionId) ??
    stringValue(payload.sourceDefinitionId);
  const visibleCard = cardDefinitionId
    ? visibleCards.get(cardDefinitionId)
    : undefined;
  return visibleCard?.known ? visibleCard : undefined;
}

function relatedIcePositionBadge(
  view: PlayerView,
  card: VisibleCard,
): string | undefined {
  if (card.instanceId) {
    for (const server of view.servers) {
      const index = server.ice.findIndex(
        (ice) => ice.instanceId === card.instanceId,
      );
      if (index >= 0) return String(index + 1);
    }
  }
  if (!card.definitionId) return undefined;

  let uniqueIndex: number | undefined;
  let matches = 0;
  for (const server of view.servers) {
    server.ice.forEach((ice, index) => {
      if (ice.known && ice.definitionId === card.definitionId) {
        matches += 1;
        uniqueIndex = index;
      }
    });
  }
  return matches === 1 && uniqueIndex !== undefined
    ? String(uniqueIndex + 1)
    : undefined;
}

function serverHighlight(payload: Record<string, unknown>): BoardHighlight {
  const zoneLabel = stringValue(payload.zoneLabel);
  return {
    kind: "server",
    ...(stringValue(payload.serverId)
      ? { serverId: stringValue(payload.serverId)! }
      : {}),
    ...(stringValue(payload.serverLabel)
      ? { serverLabel: serverDisplayLabel(stringValue(payload.serverLabel)!) }
      : {}),
    lane:
      zoneLabel === "ICE" ? "ice" : zoneLabel === "Root" ? "root" : "central",
  };
}

export function actionSoundForActionType(
  actionType: string,
  visibility: ChronicleVisibility,
  payload?: Record<string, unknown>,
): ActionSoundKind | undefined {
  if (payload && tagGainAmountFromPublicPayload(payload) > 0) return "gain_tag";
  switch (actionType) {
    case "mandatory_draw":
    case "draw_card":
      return "draw";
    case "gain_credit":
      return "credit";
    case "install_card":
    case "advance_card":
      return visibility === "redacted" ? "install_hidden" : "install_known";
    case "play_event":
    case "play_operation":
      return "play";
    case "rez_ice":
      return "ice_rez";
    case "start_run":
      return "run_start";
    case "continue_run":
    case "decline_rez":
    case "pump_breaker":
    case "break_subroutine":
      return "run";
    case "access_card":
      return "access";
    case "score_agenda":
      return "agenda_corp";
    case "steal_agenda":
      return "agenda_runner";
    case "trash_accessed_card":
    case "trash_resource":
    case "purge_virus_counters":
      return "trash";
    case "remove_tag":
      return "tag_or_damage";
    case "resolve_choice":
      return "choice";
    case "game_end":
      return "game_end";
    default:
      return undefined;
  }
}

export function turnStartAudioCue(
  current: TurnStartAudioState,
  previous?: TurnStartAudioState | null,
): TurnStartAudioCue | null {
  if (!previous || previous.matchId !== current.matchId) return null;
  const currentTurnSide = turnPhaseSide(current.phase);
  if (!currentTurnSide || currentTurnSide !== current.activeSide) return null;
  if (turnPhaseSide(previous.phase) === currentTurnSide) return null;
  return {
    key: `${current.matchId}:${current.stateVersion}:${currentTurnSide}`,
    side: currentTurnSide,
    sound: currentTurnSide === "runner" ? "runner_turn" : "corp_turn",
  };
}

export function actionSoundCountForAction(
  actionType: string,
  payload: Record<string, unknown> | undefined,
): number {
  if (actionType !== "mandatory_draw" && actionType !== "draw_card") return 1;
  const amount = typeof payload?.amount === "number" ? payload.amount : 1;
  return Math.min(5, Math.max(1, Math.floor(amount)));
}

function isForcedPublicEffectCue(
  actionType: string,
  payload: Record<string, unknown>,
): boolean {
  return (
    actionType === "continue_run" &&
    (payloadHasAbility(payload, "rio_de_janeiro_passed_ice") ||
      typeof payload.vacuumLinkDieRoll === "number" ||
      typeof payload.rezzedIceRewindDieRoll === "number")
  );
}

function isForcedEffectCueItem(item: {
  chips: string[];
  category: string;
  visibility: ChronicleVisibility;
}): boolean {
  return (
    item.visibility === "public" &&
    item.category === "danger" &&
    (item.chips.includes("Access-Effekt") ||
      item.chips.includes("Tag erhalten"))
  );
}

function localizedForcedEffectCueItems(
  event: PublicGameEvent,
  side: Side,
  cardPresentationsById: ChronicleContext["cardPresentationsById"],
  translate?: ChronicleTranslate,
): Array<{ item: ChronicleItem; tagGain: boolean; damage: boolean }> {
  const legacyItems = formatChronicleEffectItems(
    event,
    side,
    cardPresentationsById,
  ).filter(isForcedEffectCueItem);
  if (!translate)
    return legacyItems.map((item) => ({
      item,
      tagGain: isTagGainEffectCueItem(item),
      damage: isDamageEffectCueItem(item),
    }));

  const localizedById = new Map(
    formatChronicleEffectItems(
      event,
      side,
      cardPresentationsById,
      translate,
    ).map((item) => [item.id, item]),
  );
  return legacyItems.map((legacyItem) => {
    const localizedItem = localizedById.get(legacyItem.id);
    if (!localizedItem)
      throw new Error(
        `Missing localized opponent effect cue for ${legacyItem.id}.`,
      );
    return {
      item: localizedItem,
      tagGain: isTagGainEffectCueItem(legacyItem),
      damage: isDamageEffectCueItem(legacyItem),
    };
  });
}

function isTagGainEffectCueItem(item: { chips: string[] }): boolean {
  return item.chips.includes("Tag erhalten");
}

function isDamageEffectCueItem(item: { chips: string[] }): boolean {
  return item.chips.some(
    (chip) =>
      chip === "Schaden" ||
      chip === "Net Damage" ||
      chip === "Meat Damage" ||
      chip === "Core Damage",
  );
}

function turnPhaseSide(phase: PlayerView["phase"]): Side | null {
  if (phase === "corp_draw_phase" || phase === "corp_action_phase")
    return "corp";
  if (phase === "runner_action_phase" || phase === "run") return "runner";
  return null;
}

function visibleCardsByDefinition(view: PlayerView): Map<string, VisibleCard> {
  const cards = [
    ...view.own.gripOrHq,
    ...view.own.heapOrArchives,
    ...view.own.scoreArea,
    ...(view.own.rig ?? []),
    ...(view.opponent.discardCards ?? []),
    ...view.opponent.scoreArea,
    ...(view.opponent.rig ?? []),
    ...view.servers.flatMap((server) => [...server.ice, ...server.root]),
    ...(view.run?.encounteredIce ? [view.run.encounteredIce] : []),
    ...(view.run?.accessedCard ? [view.run.accessedCard] : []),
  ];
  return new Map(
    cards
      .filter((card) => card.known && card.definitionId)
      .map((card) => [card.definitionId!, card]),
  );
}

function hasLocalAttention(view: PlayerView, viewerSide: Side): boolean {
  return Boolean(
    view.pendingChoice ||
    (view.activeSide === viewerSide && view.legalActions.length > 0),
  );
}

function actorLabel(
  actor: Side | undefined,
  source: OpponentActionCue["source"],
  translate?: ChronicleTranslate,
): string {
  if (source === "system" || !actor)
    return translate?.("actor.game") ?? "Spiel";
  if (actor === "corp")
    return (
      translate?.(source === "ai" ? "actor.corpAi" : "actor.corp") ??
      (source === "ai" ? "Korp-KI" : "Korp")
    );
  return (
    translate?.(source === "ai" ? "actor.runnerAi" : "actor.runner") ??
    (source === "ai" ? "Runner-KI" : "Runner")
  );
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function sideValue(value: unknown): Side | undefined {
  return value === "corp" || value === "runner" ? value : undefined;
}

function positiveIntegerValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : undefined;
}

function nonNegativeIntegerValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : undefined;
}

function damageTypeValue(
  value: unknown,
): DamageImpactCue["damageType"] | undefined {
  return value === "net" || value === "meat" || value === "core"
    ? value
    : undefined;
}

function currentRunnerMaxHandSize(
  playerView: PlayerView,
  viewerSide: Side,
): number | undefined {
  const value =
    viewerSide === "runner"
      ? playerView.own.maxHandSize
      : playerView.opponent.maxHandSize;
  return nonNegativeIntegerValue(value);
}
