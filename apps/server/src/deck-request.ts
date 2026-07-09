import type {
  AiDeckPolicy,
  MatchDeckSelectionInput,
  ParticipantDeckPairInput,
} from "./deck-setup";

export function deckSelectionFromBody(
  body: Record<string, unknown>,
): MatchDeckSelectionInput {
  const selection: MatchDeckSelectionInput = {};
  const aiDeckPolicy = aiDeckPolicyFromValue(body.aiDeckPolicy);
  if (aiDeckPolicy) selection.aiDeckPolicy = aiDeckPolicy;
  const participantADecks = deckPairFromBody(body.participantADecks);
  const participantBDecks = deckPairFromBody(body.participantBDecks);
  if (participantADecks) selection.participantADecks = participantADecks;
  if (participantBDecks) selection.participantBDecks = participantBDecks;
  return selection;
}

export function deckPairFromBody(
  value: unknown,
): ParticipantDeckPairInput | undefined {
  if (!value || typeof value !== "object") return undefined;
  const body = value as Record<string, unknown>;
  const selection: ParticipantDeckPairInput = {};
  if (typeof body.runnerDeckSnapshotId === "string")
    selection.runnerDeckSnapshotId = body.runnerDeckSnapshotId;
  if (typeof body.corpDeckSnapshotId === "string")
    selection.corpDeckSnapshotId = body.corpDeckSnapshotId;
  if (body.runnerDeckSnapshot && typeof body.runnerDeckSnapshot === "object")
    selection.runnerDeckSnapshot = body.runnerDeckSnapshot as NonNullable<
      ParticipantDeckPairInput["runnerDeckSnapshot"]
    >;
  if (body.corpDeckSnapshot && typeof body.corpDeckSnapshot === "object")
    selection.corpDeckSnapshot = body.corpDeckSnapshot as NonNullable<
      ParticipantDeckPairInput["corpDeckSnapshot"]
    >;
  return Object.keys(selection).length > 0 ? selection : undefined;
}

export function aiDeckPolicyFromValue(
  value: unknown,
): AiDeckPolicy | undefined {
  return value === "fixed" ||
    value === "selected" ||
    value === "seeded_random" ||
    value === "same_as_participant_a"
    ? value
    : undefined;
}
