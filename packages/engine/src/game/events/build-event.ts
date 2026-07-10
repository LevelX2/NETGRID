import {
  CARD_DEFINITIONS_BY_ID,
  type CardDefinition,
  type CardInstanceId,
  type EventVisibilityClass,
  type GameEvent,
  type GameState,
  type LegalAction,
  type LegacyAbilityPayloadField,
  type PlayerAction,
  type Side,
  type StateHash,
} from "@netgrid/shared";
import type { PublicContextForActionDependencies } from "../../public-context";
import {
  buildPublicAbilitySchemaContext,
  legacyAbilityPayloadEntries,
} from "../../mechanics/public-payload-schema";

export type BuildEventHost = {
  publicContext: {
    publicContextForAction: (
      state: GameState,
      legalAction: LegalAction,
      deps: PublicContextForActionDependencies,
    ) => Record<string, unknown>;
    deps: PublicContextForActionDependencies;
  };
  constants: {
    badPublicityLossThreshold: number;
  };
};

let defaultBuildEventHost: BuildEventHost | undefined;

export function configureBuildEventHost(
  host: BuildEventHost | undefined,
): BuildEventHost | undefined {
  const previous = defaultBuildEventHost;
  defaultBuildEventHost = host;
  return previous;
}

export function buildEvent(
  before: number,
  after: number,
  stateHashAfter: StateHash,
  previousState: GameState,
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): GameEvent {
  if (!defaultBuildEventHost)
    throw new Error("BuildEvent-Host ist nicht initialisiert.");
  return buildEventWithHost(
    defaultBuildEventHost,
    before,
    after,
    stateHashAfter,
    previousState,
    state,
    legalAction,
    playerAction,
  );
}

export function buildEventWithHost(
  host: BuildEventHost,
  before: number,
  after: number,
  stateHashAfter: StateHash,
  previousState: GameState,
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): GameEvent {
  const actor = legalAction.side;
  const reveal = revealForPublicEvent(state, legalAction);
  const visibilityClass = eventVisibilityForAction(legalAction);
  const actionUseContext = publicActionUseContext(previousState, legalAction);
  // Public context is constructed after action resolution from already-public
  // payload data. Event building owns final PublicPayload assembly, while
  // public-context.ts remains read-only and free of state mutation.
  const actionContext = host.publicContext.publicContextForAction(
    state,
    legalAction,
    host.publicContext.deps,
  );
  const publicPayload: Record<string, unknown> = {
    actor,
    actionType: legalAction.type,
    label: publicLabel(legalAction),
    ...actionUseContext,
    ...actionContext,
    ...buildPublicAbilitySchemaContext(
      legalAction.type,
      legalAction.payload,
      actionContext,
      visibilityClass,
    ),
    ...reveal,
  };
  if (state.gameEndReason === "bad_publicity_7") {
    publicPayload.badPublicityThreshold =
      host.constants.badPublicityLossThreshold;
    publicPayload.corpBadPublicityBefore = previousState.corp.badPublicity;
    publicPayload.corpBadPublicityAfter = state.corp.badPublicity;
    publicPayload.sourceVisibility =
      publicPayload.sourceVisibility === "redacted" ? "redacted" : "public";
    if (publicPayload.sourceVisibility === "redacted") {
      delete publicPayload.sourceCardDefinitionId;
      delete publicPayload.sourceDefinitionId;
      delete publicPayload.sourceTitle;
      publicPayload.redactedKind = "hidden_resource_source";
    }
  }
  return {
    eventId: `evt_${after}`,
    type: legalAction.type,
    stateVersionBefore: before,
    stateVersionAfter: after,
    stateHashAfter,
    visibilityClass,
    publicPayload,
    privatePayload: {
      [actor]: {
        action: playerAction,
        legalAction,
      },
    },
  };
}

export function eventVisibilityForAction(
  legalAction: LegalAction,
): EventVisibilityClass {
  if (
    legalAction.type === "move_to_set_aside" ||
    legalAction.type === "move_to_removed_from_game" ||
    legalAction.type === "return_from_set_aside"
  ) {
    return legalAction.payload?.specialZoneVisibility === "public"
      ? "public"
      : "hidden_info_barrier";
  }
  if (legalAction.type === "change_card_control") {
    const visibility = legalAction.payload?.controlChangeVisibility;
    return visibility === "hidden_info_barrier" ||
      visibility === "private_to_side" ||
      visibility === "replay_only" ||
      visibility === "public"
      ? visibility
      : "public";
  }
  if (legalAction.type === "resolve_choice") {
    const choiceVisibility = legalAction.payload?.choiceVisibility;
    return choiceVisibility === "hidden_info_barrier" ||
      choiceVisibility === "private_to_side" ||
      choiceVisibility === "replay_only" ||
      choiceVisibility === "public"
      ? choiceVisibility
      : "private_to_side";
  }
  if (legalAction.payload?.traceStarted === true) return "public";
  if (legalAction.payload?.damageResolved === true)
    return "hidden_info_barrier";
  if (legalAction.payload?.hiddenZoneBarrier === true)
    return "hidden_info_barrier";
  if (
    [
      "access_card",
      "rez_ice",
      "score_agenda",
      "steal_agenda",
      "trash_accessed_card",
      "play_operation",
    ].includes(legalAction.type)
  )
    return "hidden_info_barrier";
  if (["mandatory_draw", "draw_card"].includes(legalAction.type))
    return "private_to_side";
  if (legalAction.type === "purge_virus_counters") return "public";
  if (legalAction.type === "purge_runner_virus_counters") return "public";
  if (legalAction.type === "forgo_action") return "public";
  if (legalAction.type === "decline_rez") return "public";
  if (legalAction.type === "jack_out") return "public";
  if (legalAction.visibility === "public") return "public";
  if (legalAction.type === "play_event") return "public";
  return "private_to_side";
}

export function isHiddenInfoBarrierEvent(event: GameEvent): boolean {
  if (event.visibilityClass === "hidden_info_barrier") return true;
  if (event.publicPayload.damageResolved === true) return true;
  if (event.publicPayload.hiddenZoneBarrier === true) return true;
  if (
    event.publicPayload.specialZoneVisibility &&
    event.publicPayload.specialZoneVisibility !== "public"
  )
    return true;
  return [
    "access_card",
    "rez_ice",
    "score_agenda",
    "steal_agenda",
    "trash_accessed_card",
    "play_operation",
  ].includes(event.type);
}

function publicActionUseContext(
  state: GameState,
  legalAction: LegalAction,
): Record<string, unknown> {
  const actionCostClicks = clickCostForAction(legalAction);
  if (actionCostClicks <= 0) return {};
  const clicksBefore = clicksForSide(state, legalAction.side);
  const turnCapacity = Math.max(
    baseClicksForSide(state, legalAction.side),
    clicksBefore,
  );
  const usedBefore = Math.max(0, turnCapacity - clicksBefore);
  return {
    actionCostClicks,
    turnActionOrdinalStart: usedBefore + 1,
    turnActionOrdinalEnd: usedBefore + actionCostClicks,
  };
}

function clickCostForAction(legalAction: LegalAction): number {
  return legalAction.costs.reduce(
    (sum, cost) =>
      sum + (Number.isInteger(cost.clicks) && cost.clicks ? cost.clicks : 0),
    0,
  );
}

function clicksForSide(state: GameState, side: Side): number {
  return side === "corp" ? state.corp.clicks : state.runner.clicks;
}

function baseClicksForSide(state: GameState, side: Side): number {
  return side === "corp" ? 3 : runnerActionsPerTurn(state);
}

function runnerActionsPerTurn(state: GameState): number {
  const override = Math.floor(state.runnerActionsPerTurnOverride ?? 4);
  return Math.max(0, override);
}

function publicLabel(legalAction: LegalAction): string {
  if (
    legalAction.type === "install_card" &&
    legalAction.payload?.hiddenRunnerResourceInstall === true
  )
    return "Runner installiert eine verdeckte Resource.";
  if (
    legalAction.type === "resolve_choice" &&
    legalAction.payload?.setupStep === "mulligan"
  )
    return "Setup-Entscheidung wurde beantwortet.";
  if (
    legalAction.type === "resolve_choice" &&
    legalAction.payload?.discardResolved === true
  )
    return "Discard wurde abgeschlossen.";
  if (
    legalAction.type === "resolve_choice" &&
    legalAction.payload?.replacementDecision
  )
    return "Replacement-Entscheidung wurde beantwortet.";
  if (
    legalAction.type === "resolve_choice" &&
    legalAction.payload?.eventModificationDecision
  )
    return "Event-Modification-Entscheidung wurde beantwortet.";
  if (legalAction.type === "resolve_choice") return "Choice wurde beantwortet.";
  if (legalAction.type === "move_to_set_aside")
    return "Eine Karte wurde in Set Aside bewegt.";
  if (legalAction.type === "move_to_removed_from_game")
    return "Eine Karte wurde aus dem Spiel entfernt.";
  if (legalAction.type === "return_from_set_aside")
    return "Eine Karte ist aus Set Aside zurückgekehrt.";
  if (legalAction.type === "change_card_control")
    return "Die Kontrolle einer Karte wurde geändert.";
  if (legalAction.side === "corp" && legalAction.type === "install_card")
    return "Korp installiert eine Karte.";
  if (legalAction.side === "corp" && legalAction.type === "advance_card")
    return "Korp advanced eine Karte.";
  return legalAction.label;
}

function revealForPublicEvent(
  state: GameState,
  legalAction: LegalAction,
): Record<string, unknown> {
  if (
    legalAction.type === "install_card" &&
    legalAction.payload?.hiddenRunnerResourceInstall === true
  )
    return {};
  if (typeof legalAction.payload?.publicRevealDefinitionId === "string") {
    const definition =
      CARD_DEFINITIONS_BY_ID[legalAction.payload.publicRevealDefinitionId];
    if (definition)
      return { cardDefinitionId: definition.id, title: definition.title };
  }
  if (
    (legalAction.type === "move_to_set_aside" ||
      legalAction.type === "move_to_removed_from_game" ||
      legalAction.type === "return_from_set_aside" ||
      legalAction.type === "change_card_control") &&
    (legalAction.payload?.specialZoneVisibility === "public" ||
      legalAction.payload?.controlChangeVisibility === "public")
  ) {
    const cardId =
      typeof legalAction.payload?.cardId === "string"
        ? legalAction.payload.cardId
        : undefined;
    if (cardId && state.cardInstances[cardId]) {
      const definition = definitionForEvent(state, cardId);
      return { cardDefinitionId: definition.id, title: definition.title };
    }
  }
  const revealsCard =
    [
      "access_card",
      "rez_ice",
      "score_agenda",
      "steal_agenda",
      "trash_accessed_card",
      "trash_resource",
      "play_event",
      "play_operation",
      "pump_breaker",
      "break_subroutine",
    ].includes(legalAction.type) ||
    (legalAction.type === "gain_credit" &&
      hasLegacyAbilityPayload(legalAction.payload, "v1917AssetAbility", [
        "gain_credits",
      ])) ||
    (legalAction.type === "gain_credit" &&
      hasLegacyAbilityPayload(legalAction.payload, "v1920AssetAbility")) ||
    (legalAction.type === "gain_credit" &&
      legalAction.payload?.traceStarted === true) ||
    legalAction.type === "activated_card_ability" ||
    (legalAction.type === "gain_credit" &&
      hasLegacyAbilityPayload(legalAction.payload, "agendaAbility", [
        "scored_agenda_credit_until_install_or_rez",
      ])) ||
    (legalAction.side === "runner" &&
      (legalAction.type === "gain_credit" ||
        legalAction.type === "trigger_ability" ||
        legalAction.type === "remove_tag") &&
      hasLegacyAbilityPayload(legalAction.payload, "resourceAbility")) ||
    (legalAction.side === "runner" && legalAction.type === "install_card");
  if (revealsCard && typeof legalAction.source === "string") {
    const cardId =
      legalAction.type === "access_card"
        ? typeof legalAction.payload?.accessedCardId === "string"
          ? legalAction.payload.accessedCardId
          : state.run?.accessedCardId
        : (legalAction.payload?.cardId ?? legalAction.source);
    if (typeof cardId === "string" && state.cardInstances[cardId]) {
      const definition = definitionForEvent(state, cardId);
      return { cardDefinitionId: definition.id, title: definition.title };
    }
    if (typeof cardId === "string" && CARD_DEFINITIONS_BY_ID[cardId])
      return {
        cardDefinitionId: cardId,
        title: CARD_DEFINITIONS_BY_ID[cardId]?.title,
      };
  }
  return {};
}

function hasLegacyAbilityPayload(
  payload: LegalAction["payload"] | undefined,
  field: LegacyAbilityPayloadField,
  abilityIds?: readonly string[],
): boolean {
  return legacyAbilityPayloadEntries(payload, [field]).some(
    (entry) => !abilityIds || abilityIds.includes(entry.abilityId),
  );
}

function definitionForEvent(
  state: GameState,
  id: CardInstanceId,
): CardDefinition {
  const instance = state.cardInstances[id];
  if (!instance) throw new Error(`CardInstance fehlt: ${id}`);
  const definition = CARD_DEFINITIONS_BY_ID[instance.definitionId];
  if (!definition)
    throw new Error(`Unbekannte Karte: ${instance.definitionId}`);
  return definition;
}
