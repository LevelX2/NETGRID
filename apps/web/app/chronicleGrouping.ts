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
      entry,
      ...relatedIndexes.map((item) => item.candidate),
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
