import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it, vi } from "vitest";

import {
  decisionDerivedValue,
  withDecisionDerivedCache,
} from "./decision-derived-cache";

describe("decision-derived cache", () => {
  it("reuses a derived value only inside the active decision generation", () => {
    const input = {} as AiDecisionInput;
    const key = Symbol("derived");
    const create = vi.fn(() => ({ value: create.mock.calls.length }));

    const firstScope = withDecisionDerivedCache(() => [
      decisionDerivedValue(input, key, create),
      decisionDerivedValue(input, key, create),
    ]);
    const secondScope = withDecisionDerivedCache(() =>
      decisionDerivedValue(input, key, create),
    );

    expect(firstScope[1]).toBe(firstScope[0]);
    expect(secondScope).not.toBe(firstScope[0]);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("does not retain a failed decision generation", () => {
    const input = {} as AiDecisionInput;
    const key = Symbol("derived");
    const create = vi.fn(() => ({}));

    expect(() =>
      withDecisionDerivedCache(() => {
        decisionDerivedValue(input, key, create);
        throw new Error("expected");
      }),
    ).toThrow("expected");
    decisionDerivedValue(input, key, create);

    expect(create).toHaveBeenCalledTimes(2);
  });

  it("shares the generation with nested synchronous decision work", () => {
    const input = {} as AiDecisionInput;
    const key = Symbol("derived");
    const value = {};
    const create = vi.fn(() => value);

    const nested = withDecisionDerivedCache(() =>
      withDecisionDerivedCache(() => decisionDerivedValue(input, key, create)),
    );

    expect(nested).toBe(value);
    expect(create).toHaveBeenCalledTimes(1);
  });
});
