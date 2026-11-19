import { describe, expect, it } from "vitest";
import {
  cardSpecForDefinitionId,
  engineCardViewForDefinitionId,
  engineCardViews,
} from "../registry";
import { CARD_REGISTRY } from "../registry-runtime";
import {
  projectEngineCardDefinition,
  projectCardSpecImplementation,
  projectTraceSuccessEffect,
} from "./card-spec-engine-projections";
import type { CardLifecycleTriggeredAbilityImplementation } from "./definition-ability-contracts";

describe("CardSpec engine projection", () => {
  it("projects one margin-based tag effect and rejects an unrepresented combined effect", () => {
    const margin = {
      kind: "add_tags_by_trace_margin_over_runner_link" as const,
      recipient: "runner" as const,
      visibility: "public" as const,
    };
    expect(projectTraceSuccessEffect([margin])).toEqual({
      type: "add_tags_by_trace_margin_over_runner_link",
    });
    expect(() =>
      projectTraceSuccessEffect([
        margin,
        { kind: "end_run", visibility: "public" },
      ]),
    ).toThrow("card_spec_unsupported_trace_success_effect");
  });
  it("preserves the explicit copy-order-neutral lifecycle contract", () => {
    const definitionId = 208;
    const engine = engineCardViewForDefinitionId(CARD_REGISTRY, definitionId);
    const spec = cardSpecForDefinitionId(CARD_REGISTRY, definitionId);
    expect(engine).toBeDefined();
    expect(spec).toBeDefined();
    const ability = {
      condition: { kind: "source_has_hosted_credits" },
      simultaneousResolution: {
        kind: "order_independent_between_copies",
      },
      effects: [
        {
          kind: "take_hosted_credits",
          source: "source",
          recipient: "controller",
          amount: 1,
          mode: "up_to_amount_if_available",
          visibility: "public",
        },
      ],
    } satisfies CardLifecycleTriggeredAbilityImplementation;

    const projected = projectCardSpecImplementation(
      {
        ...engine!,
        engine: {
          ...engine!.engine,
          lifecycle: {
            ...engine!.engine.lifecycle,
            start_of_runner_turn: [ability],
          },
        },
      },
      spec!,
    );

    expect(
      projected.lifecycle?.start_of_runner_turn?.[0]?.simultaneousResolution,
    ).toEqual({ kind: "order_independent_between_copies" });
    expect(
      Object.isFrozen(
        projected.lifecycle?.start_of_runner_turn?.[0]?.simultaneousResolution,
      ),
    ).toBe(true);
  });

  it("binds Proteus relative ICE damage through canonical capability identities", () => {
    for (const definitionId of [
      70,
      79,
      88,
    ]) {
      const engine = engineCardViewForDefinitionId(CARD_REGISTRY, definitionId);
      const spec = cardSpecForDefinitionId(CARD_REGISTRY, definitionId);
      expect(engine, String(definitionId)).toBeDefined();
      expect(spec, String(definitionId)).toBeDefined();
      const relativeIce = engine!.engine.relativeIce!;
      const binding = relativeIce.dynamicDamageSubroutine!;
      const printed = engine!.engine.printedSubroutines!.find(
        (subroutine) =>
          String(subroutine.capabilityKey) ===
          String(binding.subroutineCapabilityKey),
      );
      expect(printed, String(definitionId)).toMatchObject({
        kind: "damage",
        amount: {
          kind: "derived",
          source: "relative_ice_dynamic_damage",
          ownerCapabilityKey: relativeIce.capabilityKey,
        },
      });
      const projected = projectEngineCardDefinition(engine!, spec!);
      expect(
        projected.subroutines?.find(
          (subroutine) =>
            subroutine.id === String(binding.subroutineCapabilityKey),
        ),
        String(definitionId),
      ).toMatchObject({
        id: binding.subroutineCapabilityKey,
        type: "do_damage",
        derivedAmount: {
          kind: "relative_ice_dynamic_damage",
          ownerCapabilityKey: relativeIce.capabilityKey,
        },
      });
    }
  });

  it("fails closed for missing, forged, mismatched, and duplicate dynamic-damage bindings", () => {
    const definitionId = 70;
    const engine = engineCardViewForDefinitionId(CARD_REGISTRY, definitionId)!;
    const spec = cardSpecForDefinitionId(CARD_REGISTRY, definitionId)!;
    const relativeIce = engine.engine.relativeIce!;
    const binding = relativeIce.dynamicDamageSubroutine!;
    const printed = engine.engine.printedSubroutines!;
    const target = printed.find(
      (subroutine) =>
        String(subroutine.capabilityKey) ===
        String(binding.subroutineCapabilityKey),
    )!;
    const project = (enginePatch: Record<string, unknown>) =>
      projectEngineCardDefinition(
        {
          ...engine,
          engine: { ...engine.engine, ...enginePatch },
        } as never,
        spec,
      );
    expect(() =>
      project({
        relativeIce: {
          ...relativeIce,
          dynamicDamageSubroutine: {
            ...binding,
            subroutineCapabilityKey: "forged_dynamic_damage_target",
          },
        },
      }),
    ).toThrow("card_spec_dynamic_damage_target_missing");
    expect(() =>
      project({
        printedSubroutines: printed.map((subroutine) =>
          subroutine === target
            ? {
                ...subroutine,
                amount: {
                  ...(target as { amount: Record<string, unknown> }).amount,
                  ownerCapabilityKey: "forged_dynamic_damage_owner",
                },
              }
            : subroutine,
        ),
      }),
    ).toThrow("card_spec_dynamic_damage_target_mismatch");
    expect(() =>
      project({ printedSubroutines: [...printed, { ...target }] }),
    ).toThrow("card_spec_dynamic_damage_target_duplicate");
    expect(() =>
      project({
        printedSubroutines: printed.filter(
          (subroutine) => subroutine !== target,
        ),
      }),
    ).toThrow("card_spec_dynamic_damage_target_missing");
  });

  it("fails closed when a mechanical family is missing from the projector contract", () => {
    const definitionId = 170;
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

  it("projects the closed Originalset runtime families and keeps region baseline authoring-only", () => {
    const definitionId = 170;
    const engine = engineCardViewForDefinitionId(CARD_REGISTRY, definitionId);
    const spec = cardSpecForDefinitionId(CARD_REGISTRY, definitionId);
    expect(engine).toBeDefined();
    expect(spec).toBeDefined();

    const projected = projectCardSpecImplementation(
      {
        ...engine!,
        engine: {
          ...engine!.engine,
          accessHooks: [{ kind: "access_hook" }],
          corpTrashInstalledRunnerSource: {
            kind: "trash_installed_runner_source",
          },
          fortCapacityModifiers: [{ kind: "fort_capacity_modifier" }],
          leavePlayCleanup: [{ kind: "leave_play_cleanup" }],
          hiddenReplacementLongtail: {
            kind: "hidden_replacement_longtail",
          },
          remainingReplacementLongtail: {
            kind: "remaining_replacement_longtail",
          },
          installAdditionalCosts: [{ kind: "install_additional_cost" }],
          runEncounterInterventions: [{ kind: "run_encounter_intervention" }],
          regionBaseline: {
            kind: "region_baseline",
            rezOnInstall: true,
            installOnlyIfRezAffordable: true,
            oneRegionPerFort: true,
            trashOlderRegions: true,
          },
        },
      } as never,
      spec!,
    );

    expect(projected).toMatchObject({
      accessHooks: [{ kind: "access_hook" }],
      corpTrashInstalledRunnerSource: {
        kind: "trash_installed_runner_source",
      },
      fortCapacityModifiers: [{ kind: "fort_capacity_modifier" }],
      leavePlayCleanup: [{ kind: "leave_play_cleanup" }],
      hiddenReplacementLongtail: { kind: "hidden_replacement_longtail" },
      remainingReplacementLongtail: {
        kind: "remaining_replacement_longtail",
      },
      installAdditionalCosts: [{ kind: "install_additional_cost" }],
      runEncounterInterventions: [{ kind: "run_encounter_intervention" }],
    });
    expect(projected).not.toHaveProperty("regionBaseline");
    expect(Object.isFrozen(projected)).toBe(true);
    expect(Object.isFrozen(projected.accessHooks)).toBe(true);
    expect(Object.isFrozen(projected.accessHooks?.[0])).toBe(true);
  });

  it("passes complete flatline replacement resolutions through frozen", () => {
    const definitionId = 170;
    const engine = engineCardViewForDefinitionId(CARD_REGISTRY, definitionId);
    const spec = cardSpecForDefinitionId(CARD_REGISTRY, definitionId);
    expect(engine).toBeDefined();
    expect(spec).toBeDefined();

    const projected = projectCardSpecImplementation(
      {
        ...engine!,
        engine: {
          ...engine!.engine,
          flatlineReplacementSources: [
            {
              capabilityKey: "flatline_tag_replacement",
              addressability: ["action"],
              kind: "flatline_replacement_from_grip",
              replacement: "flatline_tag_replacement",
              resolution: {
                trashSource: true,
                removeAllCoreDamage: true,
                refreshGripToMax: true,
                gainCredits: 10,
                removeAllTags: true,
                futureActionDebt: 4,
                futureAgendaPointForfeit: 3,
              },
              visibility: "public",
            },
            {
              capabilityKey: "installed_flatline_prevention",
              addressability: ["action"],
              kind: "flatline_replacement_installed",
              replacement: "installed_flatline_prevention",
              resolution: {
                trashAllGrip: true,
                removeAllCoreDamage: true,
                maxHandSizeModifier: -1,
                runnerActionsPerTurnOverride: 3,
                permanentMeatDamagePrevention: true,
              },
              cost: { kind: "trash_source" },
              visibility: "public",
            },
          ],
        },
      } as never,
      spec!,
    );

    expect(projected.flatlineReplacementSources).toMatchObject([
      { resolution: { gainCredits: 10, futureActionDebt: 4 } },
      {
        resolution: {
          runnerActionsPerTurnOverride: 3,
          permanentMeatDamagePrevention: true,
        },
        cost: { kind: "trash_source" },
      },
    ]);
    const gripReplacement = projected.flatlineReplacementSources?.[0];
    const installedReplacement = projected.flatlineReplacementSources?.[1];
    if (gripReplacement?.kind !== "flatline_replacement_from_grip")
      throw new Error("expected grip flatline replacement");
    if (installedReplacement?.kind !== "flatline_replacement_installed")
      throw new Error("expected installed flatline replacement");
    expect(Object.isFrozen(gripReplacement.resolution)).toBe(true);
    expect(Object.isFrozen(installedReplacement.resolution)).toBe(true);
  });

  it("projects every Originalset printed-subroutine kind without a card-specific branch", () => {
    const expectedKinds = [
      "damage",
      "end_the_run",
      "end_the_run_and_runner_forgoes_next_action",
      "next_encounter_unless_fully_break_damage",
      "prohibit_break_and_jack_out_next_ice",
      "prohibit_break_next_ice",
      "random_resume_from_rezzed_ice_back_or_jack_out",
      "run_duration_additional_subroutine",
      "run_duration_break_subroutine_cost",
      "run_duration_cannot_jack_out",
      "run_duration_encounter_cost_or_end_run",
      "run_duration_ice_strength",
      "run_duration_jack_out_cost",
      "run_duration_trash_program_after_passing_rezzed_ice_unless_jack_out",
      "runner_run_lock_actions",
      "secret_spend_compare_end_run_unless_corp_spent_at_least_runner",
      "trace",
      "trash_program",
    ];
    const originalsetIce = engineCardViews(CARD_REGISTRY).filter(
      (engine) =>
        cardSpecForDefinitionId(CARD_REGISTRY, engine.cardDefinitionId)?.printings.some(
          (printing) => printing.setId === "originalset-v1",
        ) &&
        engine.engine.printedSubroutines !== undefined,
    );
    const subroutines = originalsetIce.flatMap(
      (engine) => engine.engine.printedSubroutines ?? [],
    );
    expect(subroutines).toHaveLength(98);
    expect(
      [...new Set(subroutines.map((subroutine) => subroutine.kind))].sort(),
    ).toEqual(expectedKinds);
    for (const engine of originalsetIce) {
      const spec = cardSpecForDefinitionId(
        CARD_REGISTRY,
        engine.cardDefinitionId,
      );
      expect(spec, String(engine.cardDefinitionId)).toBeDefined();
      const projected = projectEngineCardDefinition(engine, spec!);
      expect(projected.subroutines).toHaveLength(
        engine.engine.printedSubroutines?.length ?? 0,
      );
      expect(projected.subroutines?.map((subroutine) => subroutine.id)).toEqual(
        engine.engine.printedSubroutines?.map(
          (subroutine) => subroutine.capabilityKey,
        ),
      );
    }
  });

  it("fails closed for invalid generic run-duration printed subroutine payloads", () => {
    const definitionId = 434;
    const engine = engineCardViewForDefinitionId(CARD_REGISTRY, definitionId);
    const spec = cardSpecForDefinitionId(CARD_REGISTRY, definitionId);
    expect(engine).toBeDefined();
    expect(spec).toBeDefined();
    const subroutine = engine!.engine.printedSubroutines?.[0];
    expect(subroutine?.kind).toBe("run_duration_encounter_cost_or_end_run");
    expect(() =>
      projectEngineCardDefinition(
        {
          ...engine!,
          engine: {
            ...engine!.engine,
            printedSubroutines: [{ ...subroutine!, amount: 0 }],
          },
        } as never,
        spec!,
      ),
    ).toThrow(
      "card_spec_invalid_printed_subroutine_amount:run_duration_encounter_cost_or_end_run",
    );
  });

  it("projects optional run-strength cancellation exactly when the CardSpec supplies it", () => {
    const unconditional = engineCardViewForDefinitionId(
      CARD_REGISTRY,
      437,
    );
    const conditional = engineCardViewForDefinitionId(
      CARD_REGISTRY,
      74,
    );
    const unconditionalSpec = cardSpecForDefinitionId(
      CARD_REGISTRY,
      437,
    );
    const conditionalSpec = cardSpecForDefinitionId(
      CARD_REGISTRY,
      74,
    );
    expect(unconditional).toBeDefined();
    expect(conditional).toBeDefined();
    expect(unconditionalSpec).toBeDefined();
    expect(conditionalSpec).toBeDefined();

    const unconditionalProjection = projectEngineCardDefinition(
      unconditional!,
      unconditionalSpec!,
    );
    const conditionalProjection = projectEngineCardDefinition(
      conditional!,
      conditionalSpec!,
    );
    expect(
      unconditionalProjection.subroutines?.[0]
        ?.runFutureStrengthCancelPaymentAmount,
    ).toBeUndefined();
    expect(
      conditionalProjection.subroutines?.[0]
        ?.runFutureStrengthCancelPaymentAmount,
    ).toBeGreaterThan(0);

    const strengthSubroutine = conditional!.engine.printedSubroutines?.[0];
    expect(strengthSubroutine?.kind).toBe("run_duration_ice_strength");
    expect(() =>
      projectEngineCardDefinition(
        {
          ...conditional!,
          engine: {
            ...conditional!.engine,
            printedSubroutines: [
              {
                ...strengthSubroutine!,
                runnerMayCancelOnPassingSource: { amount: 0 },
              },
            ],
          },
        } as never,
        conditionalSpec!,
      ),
    ).toThrow("card_spec_invalid_run_strength_cancel_payment");
  });

  it("fails closed on malformed trace damage instead of guessing a legacy effect", () => {
    const definitionId = 72;
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
    expect(() => projectEngineCardDefinition(malformed as never, spec!)).toThrow(
      "card_spec_invalid_trace_damage_effect",
    );
  });

  it("projects a typed trace run lock and rejects incomplete combined effects", () => {
    const definitionId = 83;
    const engine = engineCardViewForDefinitionId(CARD_REGISTRY, definitionId);
    const spec = cardSpecForDefinitionId(CARD_REGISTRY, definitionId);
    expect(engine).toBeDefined();
    expect(spec).toBeDefined();
    expect(projectEngineCardDefinition(engine!, spec!).subroutines).toEqual([
      {
        id: "subroutine_trace_x_end_run_and_run_lock",
        type: "initiate_trace",
        traceLimit: 0,
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
    expect(() => projectEngineCardDefinition(malformed as never, spec!)).toThrow(
      "card_spec_unsupported_trace_success_effect",
    );
  });
});
