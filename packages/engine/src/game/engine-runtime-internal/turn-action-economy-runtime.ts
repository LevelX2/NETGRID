import {
  DEMO_CARDS_BY_ID,
  type CardDefinitionId,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type ServerId,
  type Side,
} from "@netgrid/shared";
import { buildLegalAction as action } from "../turn/action-builders";
import { definitionFor } from "../state/card-server-lookup";
import { ensureRunnerTurnFlags } from "../state/turn-flags-counters";
import type {
  AutomaticEffectCollector,
  RestrictedActionFamily,
} from "./runtime-shared";

type ActionEconomyGrant = NonNullable<
  NonNullable<GameState["actionEconomy"]>["grants"]
>[number];

export function applyRunnerForgoNextAction(state: GameState): void {
  if (state.runner.clicks > 0) {
    state.runner.clicks = Math.max(0, state.runner.clicks - 1);
    return;
  }
  addRunnerFutureActionDebt(state, 1);
}

export function addRunnerFutureActionDebt(
  state: GameState,
  amount: number,
): void {
  if (!Number.isInteger(amount) || amount <= 0) return;
  const flags = ensureRunnerTurnFlags(state);
  flags.forgoNextActionsPending =
    Math.max(0, Math.floor(flags.forgoNextActionsPending ?? 0)) + amount;
}

export function consumeRunnerFutureActionDebt(state: GameState): number {
  const flags = ensureRunnerTurnFlags(state);
  let pending = Math.max(0, Math.floor(flags.forgoNextActionsPending ?? 0));
  if (flags.forgoNextActionPending === true) pending += 1;
  flags.forgoNextActionPending = false;
  if (pending <= 0 || state.runner.clicks <= 0) {
    flags.forgoNextActionsPending = pending;
    return 0;
  }
  const consumed = Math.min(state.runner.clicks, pending);
  state.runner.clicks -= consumed;
  flags.forgoNextActionsPending = pending - consumed;
  return consumed;
}

export function ensureActionEconomy(
  state: GameState,
): NonNullable<GameState["actionEconomy"]> {
  return (state.actionEconomy ??= {});
}

export function compactActionEconomy(state: GameState): void {
  const economy = state.actionEconomy;
  if (!economy) return;
  if (economy.grants)
    economy.grants = economy.grants.filter(
      (grant) =>
        grant.remaining > 0 && isTurnBoundExtraActionGrantCurrent(state, grant),
    );
  if (economy.futureGrants)
    economy.futureGrants = economy.futureGrants.filter(
      (grant) => grant.remainingTurns > 0,
    );
  if (
    economy.corpCreditForfeitDebt &&
    economy.corpCreditForfeitDebt.remaining <= 0
  )
    delete economy.corpCreditForfeitDebt;
  if (
    !economy.pendingOffer &&
    (!economy.grants || economy.grants.length === 0) &&
    (!economy.futureGrants || economy.futureGrants.length === 0) &&
    !economy.corpCreditForfeitDebt
  )
    delete state.actionEconomy;
}

export function currentTurnSerial(state: GameState): number {
  return Math.max(0, Math.floor(state.turnSerial ?? 0));
}

export function expireTurnBoundExtraActionGrants(state: GameState): void {
  const economy = state.actionEconomy;
  if (!economy?.grants) return;
  economy.grants = economy.grants.filter(
    (grant) =>
      grant.remaining > 0 && isTurnBoundExtraActionGrantCurrent(state, grant),
  );
  compactActionEconomy(state);
}

function isTurnBoundExtraActionGrantCurrent(
  state: GameState,
  grant: ActionEconomyGrant,
): boolean {
  if (grant.side !== state.activeSide) return false;
  if (grant.side === "corp" && state.phase !== "corp_action_phase")
    return false;
  if (grant.side === "runner" && state.phase !== "runner_action_phase")
    return false;
  if (grant.createdDuringTurnSerial === undefined) return true;
  return grant.createdDuringTurnSerial === currentTurnSerial(state);
}

export function restrictedActionFamilyForRandomActionRoll(
  dieRoll: number,
): RestrictedActionFamily {
  if (dieRoll === 1) return "corp_install";
  if (dieRoll === 2 || dieRoll === 3) return "gain_credit";
  return "draw_card";
}

export function addTurnBoundExtraActionGrant(
  state: GameState,
  input: {
    side: Side;
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    restriction: RestrictedActionFamily;
    forced?: boolean;
    targetServerId?: Exclude<ServerId, "new_remote">;
    targetCardInstanceId?: CardInstanceId;
    revealToCorpOnly?: boolean;
    dieRoll?: number;
    randomPurpose?: string;
  },
): void {
  const economy = ensureActionEconomy(state);
  economy.grants = [
    ...(economy.grants ?? []),
    {
      side: input.side,
      sourceCardInstanceId: input.sourceCardInstanceId,
      sourceDefinitionId: input.sourceDefinitionId,
      restriction: input.restriction,
      optional: !input.forced,
      remaining: 1,
      createdAtStateVersion: state.stateVersion,
      createdDuringTurnSerial: currentTurnSerial(state),
      ...(input.forced ? { forced: true } : {}),
      ...(input.targetServerId ? { targetServerId: input.targetServerId } : {}),
      ...(input.targetCardInstanceId
        ? { targetCardInstanceId: input.targetCardInstanceId }
        : {}),
      ...(input.revealToCorpOnly ? { revealToCorpOnly: true } : {}),
      ...(input.dieRoll ? { dieRoll: input.dieRoll } : {}),
      ...(input.randomPurpose ? { randomPurpose: input.randomPurpose } : {}),
    },
  ];
  if (input.side === "corp") state.corp.clicks += 1;
  else state.runner.clicks += 1;
}

export function consumeRestrictedExtraActionForAction(
  state: GameState,
  legalAction: LegalAction,
): void {
  const grants = state.actionEconomy?.grants;
  if (!grants || grants.length === 0) return;
  const index = grants.findIndex(
    (grant) =>
      grant.side === legalAction.side &&
      grant.remaining > 0 &&
      actionMatchesRestrictedGrant(state, legalAction, grant),
  );
  if (index < 0) return;
  const grant = grants[index]!;
  grant.remaining = Math.max(0, grant.remaining - 1);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    restrictedExtraActionConsumed: true,
    restrictedExtraActionSourceDefinitionId: grant.sourceDefinitionId,
    restrictedActionFamily: grant.restriction,
  };
  compactActionEconomy(state);
}

function actionMatchesRestrictedGrant(
  state: GameState,
  legalAction: LegalAction,
  grant: ActionEconomyGrant,
): boolean {
  if (grant.restriction === "corp_install")
    return legalAction.type === "install_card";
  if (grant.restriction === "gain_credit")
    return legalAction.type === "gain_credit";
  if (grant.restriction === "draw_card") return legalAction.type === "draw_card";
  if (grant.restriction === "start_run") {
    if (legalAction.type !== "start_run") return false;
    return (
      !grant.targetServerId || legalAction.payload?.serverId === grant.targetServerId
    );
  }
  if (grant.restriction === "play_or_install_card") {
    const target = grant.targetCardInstanceId;
    if (!target || legalAction.payload?.cardId !== target) return false;
    const definition = definitionFor(state, target);
    return definition.type === "event"
      ? legalAction.type === "play_event"
      : legalAction.type === "install_card";
  }
  return false;
}

function activeRestrictedGrantsForSide(
  state: GameState,
  side: Side,
): ActionEconomyGrant[] {
  return (state.actionEconomy?.grants ?? []).filter(
    (grant) =>
      grant.side === side &&
      grant.remaining > 0 &&
      isTurnBoundExtraActionGrantCurrent(state, grant),
  );
}

function forcedRestrictedGrantsForSide(
  state: GameState,
  side: Side,
): ActionEconomyGrant[] {
  return activeRestrictedGrantsForSide(state, side).filter(
    (grant) => grant.forced === true,
  );
}

export function filterActionsForRestrictedExtraActions(
  state: GameState,
  side: Side,
  actions: LegalAction[],
): LegalAction[] {
  const grants = activeRestrictedGrantsForSide(state, side);
  if (grants.length === 0) return actions;
  const clicks = side === "corp" ? state.corp.clicks : state.runner.clicks;
  const forced = forcedRestrictedGrantsForSide(state, side);
  const relevant = forced.length > 0 ? forced : clicks <= grants.length ? grants : [];
  if (relevant.length === 0) return actions;
  const matching = actions.filter((candidate) =>
    relevant.some((grant) => actionMatchesRestrictedGrant(state, candidate, grant)),
  );
  if (forced.length > 0) {
    if (matching.length > 0) return matching;
    return forced.map((grant) =>
      action(
        state,
        side,
        "trigger_ability",
        "Erzwungene Aktion ist nicht möglich",
        "card",
        [],
        {
          actionEconomyAbility: "forced_action_not_possible",
          cardId: grant.sourceCardInstanceId,
          sourceDefinitionId: grant.sourceDefinitionId,
          restrictedActionFamily: grant.restriction,
          ...(grant.revealToCorpOnly !== true && grant.targetCardInstanceId
            ? { targetCardInstanceId: grant.targetCardInstanceId }
            : {}),
          ...(grant.targetServerId ? { targetServerId: grant.targetServerId } : {}),
          ...(grant.dieRoll !== undefined ? { dieRoll: grant.dieRoll } : {}),
          createdAtStateVersion: grant.createdAtStateVersion,
          ...(grant.createdDuringTurnSerial !== undefined
            ? { createdDuringTurnSerial: grant.createdDuringTurnSerial }
            : {}),
          hiddenZoneBarrier: grant.revealToCorpOnly === true,
        },
      ),
    );
  }
  return [
    ...matching,
    ...actions.filter((candidate) => candidate.type === "end_turn"),
  ];
}

export function addFutureExtraActionGrant(
  state: GameState,
  input: {
    side: Side;
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    remainingTurns: number;
    amountPerTurn: number;
    restriction?: RestrictedActionFamily;
  },
): void {
  const economy = ensureActionEconomy(state);
  economy.futureGrants = [
    ...(economy.futureGrants ?? []),
    {
      side: input.side,
      sourceCardInstanceId: input.sourceCardInstanceId,
      sourceDefinitionId: input.sourceDefinitionId,
      remainingTurns: input.remainingTurns,
      amountPerTurn: input.amountPerTurn,
      ...(input.restriction ? { restriction: input.restriction } : {}),
    },
  ];
}

export function applyFutureExtraActionGrantsAtTurnStart(
  state: GameState,
  side: Side,
  effects?: AutomaticEffectCollector,
): void {
  const future = state.actionEconomy?.futureGrants ?? [];
  for (const grant of future) {
    if (grant.side !== side || grant.remainingTurns <= 0) continue;
    const amount = Math.max(0, Math.floor(grant.amountPerTurn));
    if (amount <= 0) continue;
    if (side === "corp") state.corp.clicks += amount;
    else state.runner.clicks += amount;
    grant.remainingTurns -= 1;
    for (let i = 0; i < amount; i += 1) {
      if (grant.restriction) {
        addTurnBoundExtraActionGrant(state, {
          side,
          sourceCardInstanceId: grant.sourceCardInstanceId,
          sourceDefinitionId: grant.sourceDefinitionId,
          restriction: grant.restriction,
        });
        if (side === "corp") state.corp.clicks -= 1;
        else state.runner.clicks -= 1;
      }
    }
    effects?.push({
      effectId: `${side}.start.future_extra_action.${grant.sourceCardInstanceId}.${grant.remainingTurns}`,
      kind: "gain_actions",
      visibility: "public",
      side,
      amount,
      reason: "start_of_turn",
      sourceDefinitionId: grant.sourceDefinitionId,
      sourceTitle: publicCardTitle(grant.sourceDefinitionId),
    });
  }
  compactActionEconomy(state);
}

export function acceptExtraActionOffer(
  state: GameState,
  legalAction: LegalAction,
): void {
  const offer = state.actionEconomy?.pendingOffer;
  if (!offer) throw new Error("Es gibt kein Extra-Action-Angebot.");
  if (offer.side !== legalAction.side)
    throw new Error("Dieses Extra-Action-Angebot gehört der anderen Seite.");
  const sourceId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  if (sourceId !== offer.sourceCardInstanceId)
    throw new Error("Die Extra-Action-Quelle passt nicht mehr.");
  delete state.actionEconomy!.pendingOffer;
  addTurnBoundExtraActionGrant(state, {
    side: offer.side,
    sourceCardInstanceId: offer.sourceCardInstanceId,
    sourceDefinitionId: offer.sourceDefinitionId,
    restriction: offer.restriction,
    ...(offer.dieRoll !== undefined ? { dieRoll: offer.dieRoll } : {}),
    ...(offer.randomPurpose !== undefined
      ? { randomPurpose: offer.randomPurpose }
      : {}),
  });
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    extraActionAccepted: true,
    gainedActions: 1,
    restrictedActionFamily: offer.restriction,
    ...(offer.side === "corp"
      ? { corpClicksAfter: state.corp.clicks }
      : { runnerClicksAfter: state.runner.clicks }),
  };
}

export function declineExtraActionOffer(
  state: GameState,
  legalAction: LegalAction,
): void {
  const offer = state.actionEconomy?.pendingOffer;
  if (!offer) throw new Error("Es gibt kein Extra-Action-Angebot.");
  if (offer.side !== legalAction.side)
    throw new Error("Dieses Extra-Action-Angebot gehört der anderen Seite.");
  delete state.actionEconomy!.pendingOffer;
  compactActionEconomy(state);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    extraActionAccepted: false,
    restrictedActionFamily: offer.restriction,
  };
}

export function resolveForcedActionNotPossible(
  state: GameState,
  legalAction: LegalAction,
): void {
  const sourceId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  const restriction = String(legalAction.payload?.restrictedActionFamily ?? "");
  const targetCardId = legalAction.payload?.targetCardInstanceId
    ? (String(legalAction.payload.targetCardInstanceId) as CardInstanceId)
    : undefined;
  const grants = state.actionEconomy?.grants ?? [];
  const grant = grants.find(
    (candidate) =>
      candidate.side === legalAction.side &&
      candidate.forced === true &&
      candidate.remaining > 0 &&
      candidate.sourceCardInstanceId === sourceId &&
      candidate.restriction === restriction &&
      isTurnBoundExtraActionGrantCurrent(state, candidate) &&
      (targetCardId === undefined ||
        candidate.targetCardInstanceId === targetCardId),
  );
  if (!grant)
    throw new Error("Es gibt keine passende erzwungene Aktion zum Auflösen.");
  if (
    grant.restriction === "play_or_install_card" &&
    (!grant.targetCardInstanceId ||
      !state.runner.grip.includes(grant.targetCardInstanceId))
  )
    throw new Error("Die erzwungene Zielkarte liegt nicht mehr in der Grip.");
  grant.remaining = 0;
  compactActionEconomy(state);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    forcedActionResolvedAsNotPossible: true,
    restrictedActionFamily: grant.restriction,
    sourceDefinitionId: grant.sourceDefinitionId,
    targetCardKnownToRunnerOnly: grant.revealToCorpOnly === true,
  };
}

function publicCardTitle(definitionId: CardDefinitionId): string {
  return DEMO_CARDS_BY_ID[definitionId]?.title ?? definitionId;
}
