declare const stateSnapshotIdBrand: unique symbol;

export type StateSnapshotId = number & {
  readonly [stateSnapshotIdBrand]: true;
};

export const INITIAL_STATE_SNAPSHOT_ID = 1 as StateSnapshotId;

export function isStateSnapshotId(value: unknown): value is StateSnapshotId {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function preActionStateSnapshotId(stateVersionAfter: number): StateSnapshotId {
  return snapshotId(stateVersionAfter, 0);
}

export function aiAttemptStateSnapshotId(decisionIndex: number): StateSnapshotId {
  return snapshotId(decisionIndex, 1);
}

function snapshotId(index: number, offset: 0 | 1): StateSnapshotId {
  const id = 2 * index + offset;
  if (!Number.isSafeInteger(index) || index < 1 || !isStateSnapshotId(id))
    throw new Error("invalid_state_snapshot_id");
  return id;
}
