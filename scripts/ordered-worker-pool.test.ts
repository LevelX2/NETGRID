import { describe, expect, it } from "vitest";
import { mapWithConcurrencyInOrder } from "./ordered-worker-pool";

describe("mapWithConcurrencyInOrder", () => {
  it("keeps input order while work finishes out of order", async () => {
    const result = await mapWithConcurrencyInOrder({
      values: [30, 5, 15],
      concurrency: 3,
      run: async (delay, index) => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return `result-${index}`;
      },
    });

    expect(result).toEqual(["result-0", "result-1", "result-2"]);
  });

  it("honors the concurrency limit", async () => {
    let active = 0;
    let maximumActive = 0;
    await mapWithConcurrencyInOrder({
      values: [0, 1, 2, 3, 4],
      concurrency: 2,
      run: async () => {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return true;
      },
    });

    expect(maximumActive).toBe(2);
  });

  it("waits for active work and stops scheduling after an error", async () => {
    const started: number[] = [];
    const settled: number[] = [];
    await expect(
      mapWithConcurrencyInOrder({
        values: [0, 1, 2, 3],
        concurrency: 2,
        run: async (value) => {
          started.push(value);
          if (value === 0) throw new Error("worker failed");
          await new Promise((resolve) => setTimeout(resolve, 10));
          settled.push(value);
          return value;
        },
      }),
    ).rejects.toThrow("worker failed");

    expect(started).toEqual([0, 1]);
    expect(settled).toEqual([1]);
  });
});
