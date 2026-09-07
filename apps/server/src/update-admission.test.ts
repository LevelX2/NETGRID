import { describe, expect, it } from "vitest";
import { UpdateAdmission } from "./update-admission";

const owner = "1".repeat(32);
const other = "2".repeat(32);
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

describe("server update admission ownership", () => {
  it("drains an admitted child even if its caller did not await it", async () => {
    const gate = new UpdateAdmission();
    const finishChild = deferred<void>();
    let child!: Promise<void>;
    await gate.run(async () => {
      child = gate.run(() => finishChild.promise);
    });
    let queried = false;
    const preparing = gate.prepare(owner, async () => {
      queried = true;
      return 0;
    });
    await Promise.resolve();
    expect(queried).toBe(false);
    finishChild.resolve();
    await child;
    await expect(preparing).resolves.toMatchObject({ updateAllowed: true });
    gate.cancel(owner);
  });
  it("closes admission synchronously and drains an already admitted create", async () => {
    const gate = new UpdateAdmission();
    const saving = deferred<void>();
    let count = 0;
    const create = gate.run(async () => {
      await saving.promise;
      count += 1;
    });
    let reads = 0;
    const preparing = gate.prepare(owner, async () => {
      reads += 1;
      return count;
    });
    await expect(
      gate.run(async () => {
        count += 1;
      }),
    ).rejects.toThrow("update_preparing");
    expect(reads).toBe(0);
    saving.resolve();
    await create;
    await expect(preparing).resolves.toEqual({
      updateAllowed: false,
      activeMatchCount: 1,
    });
    expect(reads).toBe(1);
    await expect(gate.run(async () => "resumed")).resolves.toBe("resumed");
  });

  it("keeps an empty server reserved until its exact owner cancels", async () => {
    const gate = new UpdateAdmission();
    await expect(gate.prepare(owner, async () => 0)).resolves.toEqual({
      updateAllowed: true,
      activeMatchCount: 0,
    });
    await expect(gate.run(async () => true)).rejects.toThrow(
      "update_preparing",
    );
    await expect(gate.prepare(other, async () => 0)).rejects.toThrow(
      "update_owner_conflict",
    );
    expect(() => gate.cancel(other)).toThrow("update_owner_conflict");
    await expect(gate.run(async () => true)).rejects.toThrow(
      "update_preparing",
    );
    gate.cancel(owner);
    gate.cancel(owner);
    await expect(gate.run(async () => true)).resolves.toBe(true);
  });

  it("finishes nested work of an admitted operation without deadlocking or rejecting it", async () => {
    const gate = new UpdateAdmission();
    const continueWork = deferred<void>();
    let nestedFinished = false;
    const work = gate.run(async () => {
      await continueWork.promise;
      await gate.run(async () => {
        nestedFinished = true;
      });
    });
    const preparing = gate.prepare(owner, async () => {
      expect(nestedFinished).toBe(true);
      return 0;
    });
    continueWork.resolve();
    await work;
    await expect(preparing).resolves.toMatchObject({ updateAllowed: true });
    gate.cancel(owner);
  });

  it("does not let a detached continuation reuse an already finished operation", async () => {
    const gate = new UpdateAdmission();
    const continueWork = deferred<void>();
    let detached!: Promise<unknown>;
    await gate.run(async () => {
      detached = continueWork.promise.then(() =>
        gate.run(async () => "should not run"),
      );
    });
    await gate.prepare(owner, async () => 0);
    const rejected = expect(detached).rejects.toThrow("update_preparing");
    continueWork.resolve();
    await rejected;
    gate.cancel(owner);
  });

  it("cancels a pending drain and never acquires from that stale request later", async () => {
    const gate = new UpdateAdmission();
    const saving = deferred<void>();
    const work = gate.run(() => saving.promise);
    const preparing = gate.prepare(owner, async () => 0);
    const rejected = expect(preparing).rejects.toThrow(
      "update_preparation_cancelled",
    );
    gate.cancel(owner);
    await rejected;
    saving.resolve();
    await work;
    await gate.prepare(other, async () => 0);
    gate.cancel(owner); // Delayed duplicate cancellation cannot clear other.
    await expect(gate.run(async () => true)).rejects.toThrow(
      "update_preparing",
    );
    gate.cancel(other);
  });

  it("remembers cancellation even if it arrives before the prepare request", async () => {
    const gate = new UpdateAdmission();
    gate.cancel(owner);
    await expect(gate.prepare(owner, async () => 0)).rejects.toThrow(
      "update_owner_retired",
    );
    await expect(gate.run(async () => true)).resolves.toBe(true);
  });

  it("defers timer-owned work until release without dropping or duplicating it", async () => {
    const gate = new UpdateAdmission();
    await gate.prepare(owner, async () => 0);
    let calls = 0;
    const continuation = gate.runWhenOpen(async () => {
      calls += 1;
      return "resumed";
    });
    await Promise.resolve();
    expect(calls).toBe(0);
    gate.cancel(owner);
    await expect(continuation).resolves.toBe("resumed");
    expect(calls).toBe(1);
  });

  it.each([undefined, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects an unavailable or invalid persisted count: %s",
    async (count) => {
      const gate = new UpdateAdmission();
      await expect(gate.prepare(owner, async () => count)).rejects.toThrow(
        "update_count_unavailable",
      );
      await expect(gate.run(async () => true)).resolves.toBe(true);
    },
  );

  it("releases failed acquisition but does not swallow a storage error", async () => {
    const gate = new UpdateAdmission();
    const error = new Error("fixture storage failure");
    await expect(
      gate.prepare(owner, async () => {
        throw error;
      }),
    ).rejects.toBe(error);
    await expect(gate.run(async () => true)).resolves.toBe(true);
  });

  it("times out a stuck read and cannot let its late result clear a newer reservation", async () => {
    const gate = new UpdateAdmission();
    const read = deferred<number>();
    await expect(gate.prepare(owner, () => read.promise, 10)).rejects.toThrow(
      "update_preparation_timeout",
    );
    await gate.prepare(other, async () => 0);
    read.resolve(0);
    await Promise.resolve();
    await expect(gate.run(async () => true)).rejects.toThrow(
      "update_preparing",
    );
    gate.cancel(other);
  });

  it("rejects invalid owners and preparation from inside an admitted operation", async () => {
    const gate = new UpdateAdmission();
    await expect(gate.prepare("invalid", async () => 0)).rejects.toThrow(
      "update_owner_invalid",
    );
    expect(() => gate.cancel("invalid")).toThrow("update_owner_invalid");
    await expect(
      gate.run(() => gate.prepare(owner, async () => 0)),
    ).rejects.toThrow("update_preparation_reentrant");
    await expect(gate.run(async () => true)).resolves.toBe(true);
  });
});
