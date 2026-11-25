import type { ApiPlayerClockUpdate } from "@netgrid/shared";

export function createPlayerClockUpdates() {
  let latest: (ApiPlayerClockUpdate & { receivedAtMs: number }) | null = null;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => latest,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    publish(update: ApiPlayerClockUpdate | null) {
      if (
        update &&
        latest &&
        update.matchId === latest.matchId &&
        update.side === latest.side &&
        update.matchVersion < latest.matchVersion
      )
        return;
      latest = update && { ...update, receivedAtMs: performance.now() };
      for (const listener of listeners) listener();
    },
  };
}

export type PlayerClockUpdates = ReturnType<typeof createPlayerClockUpdates>;
