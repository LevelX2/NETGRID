import {
  LEGACY_ABILITY_PAYLOAD_FIELDS,
  type LegalAction,
  type PublicGameEvent,
} from "@netgrid/shared";

type PayloadLike = Record<string, unknown> | undefined;

export function payloadAbilityId(payload: PayloadLike): string | null {
  const stable = stringValue(payload?.abilityId);
  if (stable) return stable;
  for (const field of LEGACY_ABILITY_PAYLOAD_FIELDS) {
    const legacy = stringValue(payload?.[field]);
    if (legacy) return legacy;
  }
  return (
    stringValue(payload?.hiddenZoneAction) ??
    stringValue(payload?.agendaAbility)
  );
}

export function payloadHasAbility(
  payload: PayloadLike,
  abilityId: string,
): boolean {
  return payloadAbilityId(payload) === abilityId;
}

export function payloadRandomRoll(payload: PayloadLike): number | undefined {
  const amounts = payload?.amounts;
  return (
    numberValue(payload?.randomRoll) ??
    numberValue(payload?.dieRoll) ??
    (amounts && typeof amounts === "object" && !Array.isArray(amounts)
      ? numberValue((amounts as Record<string, unknown>).randomRoll)
      : undefined) ??
    numberValue(payload?.v1921DieRoll)
  );
}

export function isDataFortReclamationInstallPayload(
  payload: PayloadLike,
): boolean {
  return payloadHasAbility(
    payload,
    "v1922_data_fort_reclamation_install_sequence",
  );
}

export function isDataFortReclamationRezPayload(payload: PayloadLike): boolean {
  return payloadHasAbility(payload, "v1922_data_fort_reclamation_rez_sequence");
}

export function isExposeServerCardPayload(payload: PayloadLike): boolean {
  return payloadHasAbility(payload, "v1911_expose_server_card");
}

export function isExposeOutermostIceEachDataFortPayload(
  payload: PayloadLike,
): boolean {
  return payloadHasAbility(
    payload,
    "v1911_expose_outermost_ice_each_data_fort",
  );
}

export function isSecurityPurgePayload(payload: PayloadLike): boolean {
  return (
    payloadHasAbility(payload, "v1922_security_purge") ||
    payloadHasAbility(payload, "agenda_purge")
  );
}

export function actionNeedsRegionReplacementConfirmation(
  action: Partial<Pick<LegalAction, "payload" | "side" | "type">>,
): boolean {
  return (
    action.side === "corp" &&
    action.type === "install_card" &&
    action.payload?.regionReplacementWarning === true
  );
}

export function actionHasAbility(
  action: Partial<Pick<LegalAction, "payload">>,
  abilityId: string,
): boolean {
  return payloadHasAbility(action.payload, abilityId);
}

export function publicEventHasAbility(
  event: PublicGameEvent,
  abilityId: string,
): boolean {
  return payloadHasAbility(event.publicPayload, abilityId);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}
