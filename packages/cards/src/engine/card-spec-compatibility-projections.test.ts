import { describe, expect, it } from "vitest";
import {
  cardSpecForDefinitionId,
  engineCardViewForDefinitionId,
} from "../registry";
import { CARD_REGISTRY } from "../registry-runtime";
import {
  projectCardSpecDefinition,
  projectCardSpecImplementation,
} from "./card-spec-compatibility-projections";

describe("CardSpec compatibility implementation projection", () => {
  it("fails closed when a mechanical family is missing from the projector contract", () => {
    const definitionId = "onr_proteus_112_identity-donor";
    const engine = engineCardViewForDefinitionId(CARD_REGISTRY, definitionId);
    const spec = cardSpecForDefinitionId(CARD_REGISTRY, definitionId);
    expect(engine).toBeDefined();
    expect(spec).toBeDefined();

    const malformed = {
      ...engine!,
      engine: {
        ...engine!.engine,
        unreviewedFutureFamily: { kind: "invented" },
      },
    };
    expect(() =>
      projectCardSpecImplementation(malformed as never, spec!),
    ).toThrow(
      "card_spec_unhandled_implementation_family:unreviewedFutureFamily",
    );
  });

  it("fails closed on malformed trace damage instead of guessing a legacy effect", () => {
    const definitionId = "onr_proteus_014_chihuahua";
    const engine = engineCardViewForDefinitionId(CARD_REGISTRY, definitionId);
    const spec = cardSpecForDefinitionId(CARD_REGISTRY, definitionId);
    expect(engine).toBeDefined();
    expect(spec).toBeDefined();
    const trace = engine!.engine.printedSubroutines?.[0];
    expect(trace?.kind).toBe("trace");
    const malformed = {
      ...engine!,
      engine: {
        ...engine!.engine,
        printedSubroutines: [
          {
            ...trace,
            onSuccess: [
              {
                kind: "preventable_damage",
                recipient: "runner",
                damageType: "brain",
                amount: 1,
                visibility: "public",
              },
            ],
          },
        ],
      },
    };
    expect(() => projectCardSpecDefinition(malformed as never, spec!)).toThrow(
      "card_spec_invalid_trace_damage_effect",
    );
  });

  it("projects a typed trace run lock and rejects incomplete combined effects", () => {
    const definitionId = "onr_proteus_025_homing-missile";
    const engine = engineCardViewForDefinitionId(CARD_REGISTRY, definitionId);
    const spec = cardSpecForDefinitionId(CARD_REGISTRY, definitionId);
    expect(engine).toBeDefined();
    expect(spec).toBeDefined();
    expect(projectCardSpecDefinition(engine!, spec!).subroutines).toEqual([
      {
        id: "subroutine_trace_x_end_run_and_run_lock",
        type: "initiate_trace",
        baseTraceStrength: 0,
        traceSuccessEffect: { type: "end_run_and_run_lock", amount: 2 },
      },
    ]);

    const trace = engine!.engine.printedSubroutines?.[0];
    expect(trace?.kind).toBe("trace");
    const malformed = {
      ...engine!,
      engine: {
        ...engine!.engine,
        printedSubroutines: [
          {
            ...trace,
            onSuccess: [
              {
                kind: "runner_run_lock_until_action_paid",
                amount: 2,
                visibility: "public",
              },
            ],
          },
        ],
      },
    };
    expect(() => projectCardSpecDefinition(malformed as never, spec!)).toThrow(
      "card_spec_unsupported_trace_success_effect",
    );
  });
});
