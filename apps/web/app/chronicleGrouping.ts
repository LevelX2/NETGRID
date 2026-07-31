export type ChronicleGroupableEntry = {
  groupLabel: string;
  groupKind: string;
  turnGroupLabel: string | null;
  groupInstanceKey?: string | null;
  actionType?: string;
  actionDebtAdded?: number | null;
  item?: {
    id?: string;
    actor?: string;
    actionUse?: {
      start: number;
      end: number;
    };
  };
};

export type ChronicleRenderGroup<T extends ChronicleGroupableEntry> = {
  label: string;
  kind: T["groupKind"];
  turnGroupLabel: string | null;
  groupInstanceKey: string;
  firstItemId: string;
  entries: T[];
};

export function groupChronicleEntriesForRender<
  T extends ChronicleGroupableEntry,
>(entries: T[]): Array<ChronicleRenderGroup<T>> {
  const groupedEntries: Array<ChronicleRenderGroup<T>> = [];
  for (const entry of entries) {
    const label = entry.groupLabel;
    const entryInstanceKey = chronicleEntryGroupInstanceKey(entry);
    const currentGroup = groupedEntries[groupedEntries.length - 1];
    if (
      currentGroup?.label === label &&
      currentGroup.turnGroupLabel === entry.turnGroupLabel &&
      chronicleEntriesShareRenderGroup(currentGroup, entry, entryInstanceKey)
    ) {
      currentGroup.entries.push(entry);
    } else {
      groupedEntries.push({
        label,
        kind: entry.groupKind,
        turnGroupLabel: entry.turnGroupLabel,
        groupInstanceKey: entryInstanceKey,
        firstItemId: entry.item?.id ?? "empty",
        entries: [entry],
      });
    }
  }
  return groupedEntries;
}

export function orderChronicleEntriesForDisplay<
  T extends ChronicleGroupableEntry,
>(entries: T[]): T[] {
  const consumed = new Set<number>();
  const blocks = new Map<number, T[]>();

  entries.forEach((entry, index) => {
    if (
      entry.actionType !== "purge_runner_virus_counters" ||
      consumed.has(index)
    )
      return;
    const debt = positiveInteger(entry.actionDebtAdded);
    if (!debt) return;
    const relatedIndexes = entries
      .map((candidate, candidateIndex) => ({ candidate, candidateIndex }))
      .filter(
        ({ candidate, candidateIndex }) =>
          candidateIndex !== index &&
          candidate.actionType === "forgo_action" &&
          candidate.turnGroupLabel === entry.turnGroupLabel &&
          candidate.groupKind === entry.groupKind &&
          candidate.item?.actor === entry.item?.actor &&
          Boolean(candidate.item?.actionUse?.start) &&
          candidate.item!.actionUse!.start >= 1 &&
          candidate.item!.actionUse!.start <= debt,
      )
      .sort(
        (left, right) =>
          (left.candidate.item?.actionUse?.start ?? 0) -
          (right.candidate.item?.actionUse?.start ?? 0),
      );
    if (relatedIndexes.length === 0) return;

    const blockIndexes = [
      index,
      ...relatedIndexes.map((item) => item.candidateIndex),
    ];
    const insertionIndex = Math.min(...blockIndexes);
    blocks.set(insertionIndex, [
      ...relatedIndexes.map((item) => item.candidate).reverse(),
      entry,
    ]);
    consumed.add(index);
    for (const item of relatedIndexes) consumed.add(item.candidateIndex);
  });

  if (blocks.size === 0) return entries;

  const ordered: T[] = [];
  entries.forEach((entry, index) => {
    const block = blocks.get(index);
    if (block) ordered.push(...block);
    if (!consumed.has(index)) ordered.push(entry);
  });
  return ordered;
}

export function chronicleResolveChoiceBelongsToRunPayload(
  payload: Record<string, unknown>,
): boolean {
  if (
    payload.socialEngineeringRun === true ||
    chroniclePayloadTargetBoolean(payload, "autoPassChosenIce") === true ||
    typeof payload.traceStep === "string" ||
    (typeof payload.eventModificationKind === "string" &&
      typeof payload.eventModificationDecision === "string") ||
    payload.ambushDefinitionId ||
    payload.accessEffectSourceDefinitionId ||
    payload.ambushPaidCost !== undefined ||
    payload.ambushPaymentDeclined === true ||
    payload.runnerMemoryCheckpointResolved === true ||
    payload.hiddenZoneAction ===
      "proteus_breaker_strength_penalty_access_counters" ||
    payload.hiddenZoneAction ===
      "schematics_search_engine_expose_installed_cards_finish" ||
    payload.hiddenZoneAction === "successful_run_temporary_encounter" ||
    payload.hiddenZoneAction === "successful_run_intervention_declined" ||
    payload.counterType === "breaker_strength_penalty"
  )
    return true;
  const effects = Array.isArray(payload.resolvedEffects)
    ? payload.resolvedEffects
    : [];
  return effects.some(
    (effect) =>
      effect &&
      typeof effect === "object" &&
      ((effect as Record<string, unknown>).reason === "access_effect" ||
        (effect as Record<string, unknown>).counterType ===
          "breaker_strength_penalty"),
  );
}

const CHRONICLE_RUN_CONTEXT_ACTION_TYPES = new Set([
  "start_run",
  "rez_ice",
  "rez_card",
  "decline_rez",
  "pump_breaker",
  "break_subroutine",
  "continue_run",
  "jack_out",
  "access_card",
  "trash_accessed_card",
  "steal_agenda",
  "decline_trash",
]);

export function chronicleActionTypeBelongsToRunContext(
  actionType: string,
): boolean {
  return CHRONICLE_RUN_CONTEXT_ACTION_TYPES.has(actionType);
}

export function chroniclePaymentSupportBelongsToRunPayload(
  payload: Record<string, unknown>,
): boolean {
  return (
    payload.cardImplementationAbility === "activated" &&
    payload.cardImplementationAbilityTiming === "runner_cost_penalty_support"
  );
}

export function chroniclePaymentSupportFollowingRunGroupLabel(
  payload: Record<string, unknown>,
  followingRunGroupLabel: string | null,
): string | null {
  return followingRunGroupLabel &&
    chroniclePaymentSupportBelongsToRunPayload(payload)
    ? followingRunGroupLabel
    : null;
}

/**
 * An access event ends its run only after the final card of a multi-access
 * sequence. Older or single-access events without progress fields remain
 * completion events for backwards-compatible grouping.
 */
export function chronicleAccessCompletesRun(
  payload: Record<string, unknown>,
): boolean {
  const accessIndex = nonNegativeInteger(payload.accessIndex);
  const effectiveAccessCount = positiveInteger(payload.effectiveAccessCount);
  if (accessIndex === null || effectiveAccessCount === null) return true;
  return accessIndex >= effectiveAccessCount - 1;
}

function chronicleEntriesShareRenderGroup<T extends ChronicleGroupableEntry>(
  currentGroup: ChronicleRenderGroup<T>,
  entry: T,
  entryInstanceKey: string,
): boolean {
  if (entry.groupKind !== "run") return true;
  return currentGroup.groupInstanceKey === entryInstanceKey;
}

function chronicleEntryGroupInstanceKey(
  entry: ChronicleGroupableEntry,
): string {
  return (
    entry.groupInstanceKey ??
    entry.item?.id ??
    `${entry.groupKind}:${entry.turnGroupLabel ?? "none"}:${entry.groupLabel}`
  );
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

function nonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

function chroniclePayloadTargetBoolean(
  payload: Record<string, unknown>,
  key: string,
): boolean | null {
  const direct = payload[key];
  if (typeof direct === "boolean") return direct;
  const targets = payload.targets;
  if (!targets || typeof targets !== "object") return null;
  const nested = (targets as Record<string, unknown>)[key];
  return typeof nested === "boolean" ? nested : null;
}
