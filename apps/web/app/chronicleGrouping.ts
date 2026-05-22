export type ChronicleGroupableEntry = {
  groupLabel: string;
  groupKind: string;
  turnGroupLabel: string | null;
  groupInstanceKey?: string | null;
  item?: {
    id?: string;
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

export function groupChronicleEntriesForRender<T extends ChronicleGroupableEntry>(
  entries: T[],
): Array<ChronicleRenderGroup<T>> {
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

function chronicleEntriesShareRenderGroup<T extends ChronicleGroupableEntry>(
  currentGroup: ChronicleRenderGroup<T>,
  entry: T,
  entryInstanceKey: string,
): boolean {
  if (entry.groupKind !== "run") return true;
  return currentGroup.groupInstanceKey === entryInstanceKey;
}

function chronicleEntryGroupInstanceKey(entry: ChronicleGroupableEntry): string {
  return entry.groupInstanceKey ?? entry.item?.id ?? `${entry.groupKind}:${entry.turnGroupLabel ?? "none"}:${entry.groupLabel}`;
}
