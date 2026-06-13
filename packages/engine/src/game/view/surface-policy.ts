import type { PlayerView } from "@netgrid/shared";

export type SurfaceKind =
  | "actor_private"
  | "opponent_view"
  | "public_event"
  | "replay_public"
  | "developer_trace";

export type PublicSurfacePayloadValue = string | number | boolean;
export type PublicSurfacePayload = Record<string, PublicSurfacePayloadValue>;

const HIDDEN_CARD_LIST_FIELD_PATTERNS = [
  /(?:hidden|private|unselected).*cardIds$/i,
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
export function sanitizeForSurface(
  payload: PublicSurfacePayload,
  surfaceKind: SurfaceKind,
): PublicSurfacePayload {
  assertPrimitivePayload(payload, surfaceKind);
  if (surfaceKind !== "actor_private" && surfaceKind !== "developer_trace") {
    assertNoHiddenCardLists(payload, surfaceKind);
    assertNoActorPrivateLabels(payload, surfaceKind);
  }
  return { ...payload };
}

export function sanitizeCardImplementationSurfacePayload(
  payload: PublicSurfacePayload,
): PublicSurfacePayload {
  return sanitizeForSurface(payload, "public_event");
}

export function sanitizeEventPayloadForSurface(
  payload: Record<string, unknown>,
  surfaceKind: SurfaceKind,
): Record<string, unknown> {
  if (surfaceKind !== "actor_private" && surfaceKind !== "developer_trace") {
    assertNoHiddenCardLists(payload, surfaceKind);
    assertNoActorPrivateLabels(payload, surfaceKind, {
      rejectGenericLabel: false,
    });
  }
  return { ...payload };
}

export function sanitizeChoiceViewForSurface<
  TChoice extends NonNullable<PlayerView["pendingChoice"]>,
>(choice: TChoice, surfaceKind: SurfaceKind): TChoice {
  if (surfaceKind !== "actor_private" && surfaceKind !== "developer_trace") {
    assertNoHiddenCardLists(
      choice as unknown as Record<string, unknown>,
      surfaceKind,
    );
    assertNoActorPrivateLabels(
      choice as unknown as Record<string, unknown>,
      surfaceKind,
    );
    for (const option of choice.options) {
      assertNoHiddenCardLists(
        option as unknown as Record<string, unknown>,
        surfaceKind,
      );
      assertNoActorPrivateLabels(
        option as unknown as Record<string, unknown>,
        surfaceKind,
      );
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

function assertPrimitivePayload(
  payload: PublicSurfacePayload,
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
