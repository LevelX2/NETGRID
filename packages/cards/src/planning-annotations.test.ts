import { describe, expect, it } from "vitest";
import {
  assertPlanningAnnotations,
  PlanningAnnotationError,
} from "./planning-annotations";

const valid = {
  schemaVersion: "card-planning-annotations-v1",
  card: [
    { kind: "strategy_anchor", strategyKey: "economy" },
    {
      kind: "target_preference",
      purpose: "pressure",
      preferences: ["remote"],
      avoid: ["protected"],
    },
  ],
  capabilities: [
    {
      capabilityKey: "gain-credit",
      annotations: [
        { kind: "line_support", lineKey: "setup", support: "supports" },
      ],
    },
  ],
};

describe("planning annotation boundary", () => {
  it("accepts a complete closed interpretation contract", () => {
    expect(() => assertPlanningAnnotations(valid)).not.toThrow();
  });

  it.each([
    [
      {
        schemaVersion: "card-planning-annotations-v1",
        card: [{ kind: "strategy_anchor" }],
      },
      "planning_invalid_shape",
    ],
    [
      {
        schemaVersion: "card-planning-annotations-v1",
        card: [{ kind: "line_support", lineKey: "x", support: 123 }],
      },
      "planning_invalid_shape",
    ],
    [
      {
        schemaVersion: "card-planning-annotations-v1",
        card: [{ kind: "target_preference", purpose: "x", preferences: [{}] }],
      },
      "planning_invalid_shape",
    ],
    [
      {
        schemaVersion: "card-planning-annotations-v1",
        card: [{ kind: "strategy_anchor", strategyKey: "x", cost: 2 }],
      },
      "planning_mechanical_field",
    ],
    [
      {
        schemaVersion: "card-planning-annotations-v1",
        card: [{ kind: "strategy_anchor", strategyKey: "x", metadata: "y" }],
      },
      "planning_unknown_field",
    ],
    [
      {
        schemaVersion: "card-planning-annotations-v1",
        capabilities: [{ capabilityKey: "Bad/Key", annotations: [] }],
      },
      "planning_invalid_shape",
    ],
    [
      {
        schemaVersion: "card-planning-annotations-v1",
        capabilities: [
          { capabilityKey: "same", annotations: [] },
          { capabilityKey: "same", annotations: [] },
        ],
      },
      "planning_duplicate_capability_key",
    ],
  ] as const)("rejects invalid untyped input", (value, code) => {
    try {
      assertPlanningAnnotations(value);
      throw new Error("expected validation failure");
    } catch (error) {
      expect(error).toBeInstanceOf(PlanningAnnotationError);
      expect((error as PlanningAnnotationError).code).toBe(code);
    }
  });

  it("does not execute getters while validating", () => {
    let calls = 0;
    const value = { schemaVersion: "card-planning-annotations-v1" };
    Object.defineProperty(value, "card", {
      enumerable: true,
      get() {
        calls += 1;
        return [];
      },
    });
    expect(() => assertPlanningAnnotations(value)).toThrow();
    expect(calls).toBe(0);
  });
});
