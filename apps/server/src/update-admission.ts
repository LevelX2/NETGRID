import { AsyncLocalStorage } from "node:async_hooks";

export type UpdateAdmissionCode =
  | "update_preparing"
  | "update_owner_invalid"
  | "update_owner_conflict"
  | "update_owner_retired"
  | "update_preparation_cancelled"
  | "update_preparation_timeout"
  | "update_preparation_reentrant"
  | "update_count_unavailable";

export class UpdateAdmissionError extends Error {
  constructor(readonly code: UpdateAdmissionCode) {
    super(code);
    this.name = "UpdateAdmissionError";
  }
}

export type UpdateAdmissionResult = {
  updateAllowed: boolean;
  activeMatchCount: number;
};

type Reservation = {
  owner: string;
  drained: Promise<void>;
  wake: () => void;
  released: Promise<void>;
  finish: () => void;
};

/** Server-owned admission barrier, not a game-rule or persistence authority. */
export class UpdateAdmission {
  private readonly operation = new AsyncLocalStorage<{ active: boolean }>();
  private activeOperations = 0;
  private reservation: Reservation | undefined;
  // An acknowledged cancellation must also reject a delayed prepare request
  // with the same nonce. Entries live only for this server process.
  private readonly retiredOwners = new Set<string>();

  async run<T>(work: () => Promise<T>): Promise<T> {
    if (this.reservation && !this.operation.getStore()?.active)
      throw new UpdateAdmissionError("update_preparing");
    const scope = { active: true };
    this.activeOperations += 1;
    try {
      return await this.operation.run(scope, work);
    } finally {
      // Detached continuations cannot reuse an operation after it completed.
      scope.active = false;
      this.releaseOperation();
    }
  }

  // Timer-owned continuations are deferred, not discarded, if preparation
  // temporarily closes admission. They keep their existing controller.
  async runWhenOpen<T>(work: () => Promise<T>): Promise<T> {
    if (this.operation.getStore()?.active) return this.run(work);
    while (this.reservation) await this.reservation.released;
    return this.run(work);
  }

  async prepare(
    owner: string,
    readActiveMatchCount: () => Promise<number | undefined>,
    timeoutMs = 30_000,
  ): Promise<UpdateAdmissionResult> {
    this.validateOwner(owner);
    if (this.operation.getStore()?.active)
      throw new UpdateAdmissionError("update_preparation_reentrant");
    if (this.retiredOwners.has(owner))
      throw new UpdateAdmissionError("update_owner_retired");
    if (this.reservation)
      throw new UpdateAdmissionError("update_owner_conflict");
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
      throw new UpdateAdmissionError("update_preparation_timeout");

    let wake!: () => void;
    const drained = new Promise<void>((resolve) => {
      wake = resolve;
    });
    let finish!: () => void;
    const released = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const reservation = { owner, drained, wake, released, finish };
    // Publish before the first await, so a concurrent create/join cannot slip
    // between the persisted count and admission closure.
    this.reservation = reservation;
    if (this.activeOperations === 0) wake();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        (async () => {
          await drained;
          this.assertCurrent(reservation);
          const count = await readActiveMatchCount();
          this.assertCurrent(reservation);
          if (count === undefined || !Number.isSafeInteger(count) || count < 0)
            throw new UpdateAdmissionError("update_count_unavailable");
          if (count !== 0) this.cancel(owner);
          return { updateAllowed: count === 0, activeMatchCount: count };
        })(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(new UpdateAdmissionError("update_preparation_timeout")),
            timeoutMs,
          );
        }),
      ]);
    } catch (error) {
      // Failed acquisition never authorizes an update. Release only this
      // attempt, not a newer owner admitted after an explicit cancellation.
      if (this.reservation === reservation) this.cancel(owner);
      throw error;
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }

  cancel(owner: string): void {
    this.validateOwner(owner);
    if (this.retiredOwners.has(owner)) return;
    if (this.reservation && this.reservation.owner !== owner)
      throw new UpdateAdmissionError("update_owner_conflict");
    this.retiredOwners.add(owner);
    const reservation = this.reservation;
    this.reservation = undefined;
    reservation?.wake();
    reservation?.finish();
  }

  private assertCurrent(reservation: Reservation): void {
    if (this.reservation !== reservation)
      throw new UpdateAdmissionError("update_preparation_cancelled");
  }

  private releaseOperation(): void {
    this.activeOperations -= 1;
    // Read the current reservation after awaiting the operation; it may have
    // been acquired since run() checked admission before its first await.
    if (this.activeOperations === 0) this.reservation?.wake();
  }

  private validateOwner(owner: string): void {
    if (!/^[0-9a-f]{32}$/.test(owner))
      throw new UpdateAdmissionError("update_owner_invalid");
  }
}
