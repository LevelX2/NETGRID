import type { PlayerView } from "@netgrid/shared";

export type SurfaceKind =
  | "actor_private"
  | "opponent_view"
  | "public_event"
  | "replay_public"
  | "developer_trace";

export type PayloadFamily =
  | "scored_agenda_sequence"
  | "hidden_zone_choice"
  | "run_window_sequence"
  | "access_event"
  | "public_reveal"
  | "ai_debug"
  | "replay_public"
  | "developer_trace";

export type PublicSurfacePayloadValue = string | number | boolean;
export type PublicSurfacePayload = Record<string, PublicSurfacePayloadValue>;

const HIDDEN_CARD_LIST_FIELD_PATTERNS = [
  /(?:hidden|private|unselected).*cardIds$/i,
  /(?:replacement|selected).*cardIds$/i,
  /(?:hq|rd|hand|stack|grip).*cardIds$/i,
];

const ACTOR_PRIVATE_LABEL_FIELD_PATTERNS = [
  /actorPrivate.*label/i,
  /private.*label/i,
  /^label$/i,
];
const EVENT_ACTOR_PRIVATE_LABEL_FIELD_PATTERNS = [
  /actorPrivate.*label/i,
  /private.*label/i,
];

/**
 * @contract Surface policy distinguishes actor-private engine surfaces from
 * public, opponent and replay surfaces. Public-like surfaces may expose counts,
 * public definition IDs and explicit public facts, but not hidden-zone card
 * lists, rich objects or actor-private labels.
 */
export function sanitizePayloadForSurface<
  TPayload extends Record<string, unknown>,
>(
  payload: TPayload,
  policy: { surface: SurfaceKind; family: PayloadFamily },
): TPayload {
  if (primitiveOnlyPayloadFamily(policy.family)) {
    assertPrimitivePayload(payload, policy.surface);
  }
  if (
    policy.surface !== "actor_private" &&
    policy.surface !== "developer_trace"
  ) {
    assertNoHiddenCardLists(payload, policy.surface);
    assertNoActorPrivateLabels(payload, policy.surface, {
      rejectGenericLabel: policy.family !== "access_event",
    });
  }
  return { ...payload };
}

export function sanitizeForSurface(
  payload: PublicSurfacePayload,
  surfaceKind: SurfaceKind,
): PublicSurfacePayload {
  return sanitizePayloadForSurface(payload, {
    surface: surfaceKind,
    family: "public_reveal",
  });
}

export function sanitizeCardImplementationSurfacePayload(
  payload: PublicSurfacePayload,
): PublicSurfacePayload {
  return sanitizePayloadForSurface(payload, {
    surface: "public_event",
    family: "scored_agenda_sequence",
  });
}

export function sanitizeEventPayloadForSurface(
  payload: Record<string, unknown>,
  surfaceKind: SurfaceKind,
): Record<string, unknown> {
  return sanitizePayloadForSurface(payload, {
    surface: surfaceKind,
    family: "access_event",
  });
}

export function sanitizeChoiceViewForSurface<
  TChoice extends NonNullable<PlayerView["pendingChoice"]>,
>(choice: TChoice, surfaceKind: SurfaceKind): TChoice {
  if (surfaceKind !== "actor_private" && surfaceKind !== "developer_trace") {
    sanitizePayloadForSurface(choice as unknown as Record<string, unknown>, {
      surface: surfaceKind,
      family: "hidden_zone_choice",
    });
    for (const option of choice.options) {
      sanitizePayloadForSurface(option as unknown as Record<string, unknown>, {
        surface: surfaceKind,
        family: "hidden_zone_choice",
      });
    }
  }
  return {
    ...choice,
    options: choice.options.map((option) => ({ ...option })),
  };
}

export function assertNoHiddenCardLists(
  payload: Record<string, unknown>,
  surfaceKind: SurfaceKind,
): void {
  for (const key of Object.keys(payload)) {
    if (HIDDEN_CARD_LIST_FIELD_PATTERNS.some((pattern) => pattern.test(key)))
      throw new Error(
        `Surface ${surfaceKind} payload field ${key} may leak hidden card data.`,
      );
  }
}

export function assertNoActorPrivateLabels(
  payload: Record<string, unknown>,
  surfaceKind: SurfaceKind,
  options: { rejectGenericLabel?: boolean } = {},
): void {
  const patterns =
    options.rejectGenericLabel === false
      ? EVENT_ACTOR_PRIVATE_LABEL_FIELD_PATTERNS
      : ACTOR_PRIVATE_LABEL_FIELD_PATTERNS;
  for (const key of Object.keys(payload)) {
    if (patterns.some((pattern) => pattern.test(key)))
      throw new Error(
        `Surface ${surfaceKind} payload field ${key} may leak actor-private labels.`,
      );
  }
}

function primitiveOnlyPayloadFamily(family: PayloadFamily): boolean {
  return (
    family === "scored_agenda_sequence" ||
    family === "run_window_sequence" ||
    family === "public_reveal" ||
    family === "replay_public"
  );
}

function assertPrimitivePayload(
  payload: Record<string, unknown>,
  surfaceKind: SurfaceKind,
): void {
  for (const [key, value] of Object.entries(payload)) {
    if (
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    )
      throw new Error(
        `Surface ${surfaceKind} payload field ${key} has an unsupported value.`,
      );
  }
}
