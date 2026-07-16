import type {
  CardDefinitionId,
  CardInstanceId,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";

export type EndTurnTagContinuationHost = {
  state: GameState;
  sources: {
    activeSourceIds: () => CardInstanceId[];
    definitionId: (cardId: CardInstanceId) => CardDefinitionId;
  };
  tags: {
    addRunnerTagsWithPrevention: (
      legalAction: LegalAction,
      amount: number,
      sourceDefinitionId: CardDefinitionId,
    ) => boolean;
  };
  finishEndTurn: (side: Side, legalAction: LegalAction) => void;
};

type SequenceContinuation = {
  side: Side;
  sourceCardIds: CardInstanceId[];
  startIndex: number;
};

export function resolveEndTurnTagSequence(
  host: EndTurnTagContinuationHost,
  legalAction: LegalAction,
  continuation?: SequenceContinuation,
): boolean {
  if (host.state.runnerTurnFlags?.runnerReceivedTagThisTurn !== true)
    return false;
  const sourceIds = continuation?.sourceCardIds ?? host.sources.activeSourceIds();
  if (sourceIds.length === 0) return false;
  let tagsAdded = Math.max(
    0,
    Math.floor(
      Number(legalAction.payload?.endTurnTagIfRunnerReceivedTagAdded ?? 0),
    ),
  );
  for (
    let sourceIndex = continuation?.startIndex ?? 0;
    sourceIndex < sourceIds.length;
    sourceIndex += 1
  ) {
    const sourceCardId = sourceIds[sourceIndex]!;
    if (!host.sources.activeSourceIds().includes(sourceCardId))
      throw new Error("Die End-turn-Tag-Quelle ist veraltet.");
    const runnerTagsBefore = host.state.runner.tags;
    host.state.pendingAddTagContinuation = {
      kind: "end_turn_tag",
      side: continuation?.side ?? legalAction.side,
      sourceCardIds: sourceIds,
      nextSourceIndex: sourceIndex + 1,
      runnerTagsBefore,
    };
    if (
      host.tags.addRunnerTagsWithPrevention(
        legalAction,
        1,
        host.sources.definitionId(sourceCardId),
      )
    ) {
      setEndTurnTagPayload(host.state, legalAction, tagsAdded, sourceIds.length);
      return true;
    }
    delete host.state.pendingAddTagContinuation;
    tagsAdded += Math.max(0, host.state.runner.tags - runnerTagsBefore);
  }
  setEndTurnTagPayload(host.state, legalAction, tagsAdded, sourceIds.length);
  return false;
}

export function resumeEndTurnTagSequence(
  host: EndTurnTagContinuationHost,
  legalAction: LegalAction,
): void {
  const continuation = host.state.pendingAddTagContinuation;
  if (!continuation || continuation.kind !== "end_turn_tag")
    throw new Error("Es ist keine End-turn-Tag-Fortsetzung offen.");
  if (host.state.pendingChoice || host.state.eventModificationWindow)
    throw new Error("Das Add-Tag-Fenster ist noch nicht abgeschlossen.");
  const resolvedSource = continuation.sourceCardIds[
    continuation.nextSourceIndex - 1
  ];
  if (
    !resolvedSource ||
    !host.sources.activeSourceIds().includes(resolvedSource)
  )
    throw new Error("Die End-turn-Tag-Fortsetzung ist veraltet.");
  const tagsAdded =
    Math.max(
      0,
      Math.floor(
        Number(legalAction.payload?.endTurnTagIfRunnerReceivedTagAdded ?? 0),
      ),
    ) + Math.max(0, host.state.runner.tags - continuation.runnerTagsBefore);
  setEndTurnTagPayload(
    host.state,
    legalAction,
    tagsAdded,
    continuation.sourceCardIds.length,
  );
  delete host.state.pendingAddTagContinuation;
  if (
    resolveEndTurnTagSequence(host, legalAction, {
      side: continuation.side,
      sourceCardIds: continuation.sourceCardIds,
      startIndex: continuation.nextSourceIndex,
    })
  )
    return;
  host.finishEndTurn(continuation.side, legalAction);
}

function setEndTurnTagPayload(
  state: GameState,
  legalAction: LegalAction,
  tagsAdded: number,
  sourceCount: number,
): void {
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1951CorpUtilityAbility: "end_turn_tag_if_runner_received_tag",
    endTurnTagIfRunnerReceivedTagAdded: tagsAdded,
    sourceCount,
    runnerTagsAfter: state.runner.tags,
  };
}
