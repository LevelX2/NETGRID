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

  it("accepts only closed capability-bound plan owners and routes", () => {
    expect(() =>
      assertPlanningAnnotations({
        schemaVersion: "card-planning-annotations-v1",
        capabilities: [
          {
            capabilityKey: "bank-build",
            annotations: [
              {
                kind: "plan_owner",
                owner: "runner.credit_bank",
                route: "build",
              },
            ],
          },
          {
            capabilityKey: "loan-leave-play",
            annotations: [
              { kind: "plan_owner", owner: "runner.resource_lifecycle" },
            ],
          },
        ],
      }),
    ).not.toThrow();
  });

  it.each([
    {
      schemaVersion: "card-planning-annotations-v1",
      card: [{ kind: "plan_owner", owner: "corp.score_agenda" }],
    },
    {
      schemaVersion: "card-planning-annotations-v1",
      capabilities: [
        {
          capabilityKey: "forged-owner",
          annotations: [{ kind: "plan_owner", owner: "runner.unknown" }],
        },
      ],
    },
    {
      schemaVersion: "card-planning-annotations-v1",
      capabilities: [
        {
          capabilityKey: "missing-route",
          annotations: [{ kind: "plan_owner", owner: "runner.credit_bank" }],
        },
      ],
    },
    {
      schemaVersion: "card-planning-annotations-v1",
      capabilities: [
        {
          capabilityKey: "duplicate-owner",
          annotations: [
            { kind: "plan_owner", owner: "runner.resource_lifecycle" },
            { kind: "plan_owner", owner: "runner.resource_lifecycle" },
          ],
        },
      ],
    },
  ])(
    "rejects unbound, forged, incomplete or duplicate plan owners",
    (value) => {
      expect(() => assertPlanningAnnotations(value)).toThrow(
        PlanningAnnotationError,
      );
    },
  );

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

  it.each([
    {
      kind: "strategy_support",
      strategyKey: "corp.ice_tax_glacier",
      role: "tax_tool",
      roleDetail: "rez_paid_scaling_ice",
      confidence: "high",
      rationale: "Visible mechanical support.",
    },
    {
      kind: "strategic_exchange",
      exchange: "credits_for_access_pressure",
    },
  ])("accepts the closed $kind planning shape", (annotation) => {
    expect(() =>
      assertPlanningAnnotations({
        schemaVersion: "card-planning-annotations-v1",
        card: [annotation],
      }),
    ).not.toThrow();
  });

  it.each([
    [
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "rez_paid_scaling_ice",
        confidence: "certain",
      },
      "planning_invalid_shape",
    ],
    [
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        confidence: "high",
      },
      "planning_invalid_shape",
    ],
    [
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "rez_paid_scaling_ice",
        confidence: "high",
        evidence: ["mechanical"],
      },
      "planning_unknown_field",
    ],
    [
      {
        kind: "strategic_exchange",
        exchange: "credits_for_access_pressure",
        effects: [{ kind: "gain_credits", amount: 2 }],
      },
      "planning_mechanical_field",
    ],
    [{ kind: "strategic_exchange" }, "planning_invalid_shape"],
  ] as const)(
    "rejects malformed strategy support/exchange annotation %#",
    (annotation, code) => {
      try {
        assertPlanningAnnotations({
          schemaVersion: "card-planning-annotations-v1",
          card: [annotation],
        });
        throw new Error("expected validation failure");
      } catch (error) {
        expect(error).toBeInstanceOf(PlanningAnnotationError);
        expect((error as PlanningAnnotationError).code).toBe(code);
      }
    },
  );
});
