import type { LegalAction } from "@netgrid/shared";

export function actionProvidesCredits(action: LegalAction): boolean {
  if (action.type !== "gain_credit") return false;
  return !isKnownNonCreditGainAction(action);
}

export function isBasicCreditAction(action: LegalAction): boolean {
  return (
    action.type === "gain_credit" &&
    (action.source === "basic_action" || action.source === "game_rule") &&
    actionProvidesCredits(action)
  );
}

export function actionHasImmediateCreditGain(action: LegalAction): boolean {
  if (actionProvidesCredits(action)) return true;
  const amount = exactImmediateCreditGainAmount(action);
  return (
    typeof amount === "number" &&
    amount > 0 &&
    action.payload?.cardImplementationAddsHostedCredits !== true
  );
}

export function exactImmediateCreditGainAmount(
  action: LegalAction,
): number | undefined {
  const quoted = action.payload?.gainCreditsAmount;
  const resolved = action.payload?.gainedCredits;
  if (
    quoted !== undefined &&
    (typeof quoted !== "number" ||
      !Number.isFinite(quoted) ||
      quoted < 0 ||
      !Number.isSafeInteger(quoted))
  ) {
    return undefined;
  }
  if (
    resolved !== undefined &&
    (typeof resolved !== "number" ||
      !Number.isFinite(resolved) ||
      resolved < 0 ||
      !Number.isSafeInteger(resolved))
  ) {
    return undefined;
  }
  if (
    typeof quoted === "number" &&
    typeof resolved === "number" &&
    quoted !== resolved
  ) {
    return undefined;
  }
  return typeof quoted === "number"
    ? quoted
    : typeof resolved === "number"
      ? resolved
      : undefined;
}

export function knownNonCreditGainActionSemantics(action: LegalAction):
  | {
      semanticActionType: string;
      tacticSignals: readonly string[];
    }
  | undefined {
  if (action.type !== "gain_credit") return undefined;
  if (action.payload?.v1951CorpUtilityAbility === "corp_installed_card_to_hq") {
    return {
      semanticActionType: "corp_board.return_installed_card_to_hq",
      tacticSignals: ["board.recycling", "hq.corp_installed_card_bounce"],
    };
  }
  if (action.payload?.agendaAbility === "hq_archives_shuffle_draw") {
    return {
      semanticActionType: "draw.card",
      tacticSignals: ["draw.card", "setup.draw", "zone.shuffle_draw"],
    };
  }
  if (gainCreditActionHasHiddenZonePayload(action)) {
    return {
      semanticActionType: "card_ability.trigger",
      tacticSignals: ["card_ability.trigger", "zone.reveal"],
    };
  }
  if (gainCreditActionHasExplicitNoCreditPayload(action)) {
    return {
      semanticActionType: "card_ability.trigger",
      tacticSignals: ["card_ability.trigger", "economy.no_immediate_credit"],
    };
  }
  return undefined;
}

export function knownCreditGainAbilitySemantics(action: LegalAction):
  | {
      semanticActionType: string;
      tacticSignals: readonly string[];
    }
  | undefined {
  if (
    action.type !== "activated_card_ability" &&
    action.type !== "trigger_ability"
  ) {
    return undefined;
  }
  const amount = exactImmediateCreditGainAmount(action);
  if (amount === undefined || amount <= 0) {
    return undefined;
  }
  return {
    semanticActionType: "economy.gain_credit",
    tacticSignals: ["economy.action", "economy.recover"],
  };
}

export function knownImmediateCreditGainActionSemantics(action: LegalAction):
  | {
      semanticActionType: string;
      tacticSignals: readonly string[];
    }
  | undefined {
  if (
    ![
      "play_event",
      "play_operation",
      "activated_card_ability",
      "trigger_ability",
    ].includes(action.type) ||
    !actionHasImmediateCreditGain(action)
  ) {
    return undefined;
  }
  return {
    semanticActionType: "economy.gain_credit",
    tacticSignals: ["economy.action", "economy.recover"],
  };
}

function isKnownNonCreditGainAction(action: LegalAction): boolean {
  return knownNonCreditGainActionSemantics(action) !== undefined;
}

function gainCreditActionHasHiddenZonePayload(action: LegalAction): boolean {
  const payload = action.payload;
  if (!payload) return false;
  return (
    payload.effectKind === "hidden_zone" ||
    payload.abilityFamily === "hidden-zone" ||
    typeof payload.hiddenZoneAction === "string"
  );
}

function gainCreditActionHasExplicitNoCreditPayload(
  action: LegalAction,
): boolean {
  const amount = action.payload?.gainCreditsAmount;
  if (typeof amount === "number" && Number.isFinite(amount) && amount <= 0) {
    return true;
  }
  // A scored-agenda ability can share the Engine's gain_credit action family
  // while performing a non-credit effect. Without an exact positive amount it
  // is not a certified liquid-credit route.
  return (
    action.source !== "basic_action" &&
    typeof action.payload?.agendaAbility === "string" &&
    !(typeof amount === "number" && Number.isFinite(amount) && amount > 0)
  );
}
