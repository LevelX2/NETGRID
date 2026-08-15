import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";

import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

function syntheticHint(
  engine: Record<string, unknown>,
  options: { side?: "corp" | "runner"; type?: string } = {},
) {
  const entry = cardSpecPlanningCards().find(
    (candidate) =>
      candidate.definition.side === (options.side ?? "runner") &&
      candidate.planning.engine.abilities === undefined &&
      candidate.planning.engine.lifecycle === undefined &&
      candidate.planning.engine.printedSubroutines === undefined &&
      candidate.planning.engine.scoredAgenda === undefined &&
      candidate.planning.engine.virusCounter === undefined,
  )!;
  return deriveCardSpecAiHint({
    ...entry,
    definition: {
      ...entry.definition,
      ...(options.type === undefined ? {} : { type: options.type }),
    },
    planning: {
      ...entry.planning,
      engine: { ...entry.planning.engine, ...engine },
    },
  } as never);
}

function actualHint(cardId: string) {
  const entry = cardSpecPlanningCards().find(
    (candidate) => candidate.definition.id === cardId,
  );
  if (entry === undefined) throw new Error(`missing_test_card:${cardId}`);
  const mechanicalPlanning = { ...entry.planning };
  delete mechanicalPlanning.planningAnnotations;
  return deriveCardSpecAiHint({
    ...entry,
    // These are mechanical translator witnesses. Strategy-rationale evidence
    // is covered by its separate owner and must not mask them.
    planning: mechanicalPlanning,
  });
}

function targetAnnotatedEntry(cardId: string) {
  const entry = cardSpecPlanningCards().find(
    (candidate) => candidate.definition.id === cardId,
  );
  if (entry === undefined) throw new Error(`missing_test_card:${cardId}`);
  return {
    ...entry,
    planning: {
      ...entry.planning,
      planningAnnotations: {
        schemaVersion: "card-planning-annotations-v1" as const,
        card:
          entry.planning.planningAnnotations?.card?.filter(
            (annotation) => annotation.kind === "target_preference",
          ) ?? [],
        capabilities:
          entry.planning.planningAnnotations?.capabilities
            ?.map((capability) => ({
              ...capability,
              annotations: capability.annotations.filter(
                (annotation) => annotation.kind === "target_preference",
              ),
            }))
            .filter((capability) => capability.annotations.length > 0) ?? [],
      },
    },
  };
}

const activated = (effects: unknown[]) => ({
  kind: "activated",
  capabilityKey: "synthetic_typed_capability",
  timing: "runner_paid",
  costs: [],
  effects,
});

describe("generic typed CardSpec AI translators", () => {
  it("keeps multiple actor-private choices bound to their own capability", () => {
    const ronin = deriveCardSpecAiHint(
      targetAnnotatedEntry("onr_v1_175_ronin-around"),
    );

    expect(ronin.targetProfiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          purpose: "top_five_hardware_choice",
          targetType: "card",
          hiddenInfoPolicy: "public_or_controller_known_only",
        }),
        expect.objectContaining({
          purpose: "expose_relevant_installed_corp_card",
          targetType: "card",
          hiddenInfoPolicy: "legal_targets_only",
        }),
      ]),
    );
  });

  it("treats an own-stack program search as controller-known selection", () => {
    const shortCircuit = deriveCardSpecAiHint(
      targetAnnotatedEntry("onr_v1_177_the-short-circuit"),
    );

    expect(shortCircuit.targetProfiles).toContainEqual({
      schemaVersion: "target-profile-v1",
      kind: "use_target",
      timing: "activated_ability",
      targetType: "program",
      purpose: "program_search_to_hand",
      preferences: [
        "program_repairs_missing_coverage",
        "best_cards_for_current_plan",
        "best_cards_for_current_state",
      ],
      hiddenInfoPolicy: "public_or_controller_known_only",
    });
  });

  it("binds Reconnaissance rez-credit planning to the chosen run server", () => {
    const reconnaissance = deriveCardSpecAiHint(
      targetAnnotatedEntry("onr_proteus_120_reconnaissance"),
    );

    expect(reconnaissance.targetProfiles).toContainEqual({
      schemaVersion: "target-profile-v1",
      kind: "use_target",
      timing: "on_play",
      targetType: "server",
      purpose: "choose_server_for_corp_rez_credit_gain",
      preferences: ["high_expected_corp_rez_count"],
      avoid: ["hidden_info_dependent_choice"],
      hiddenInfoPolicy: "legal_targets_only",
    });
  });

  it("projects a runner turn-start credit engine that ends on the first run", () => {
    const conference = actualHint("onr_v1_184_top-runners-conference");

    expect(conference.effects).toEqual(
      expect.arrayContaining([
        {
          kind: "economy",
          scope: "runner",
          timing: "start_of_turn",
          resource: "credits",
          target: "economy.turn_start_credit",
          amount: 2,
          repeatable: true,
        },
        {
          kind: "delayed_penalty",
          scope: "runner",
          timing: "start_of_run",
          target: "risk.ends_on_run",
          finite: true,
        },
      ]),
    );
    expect(conference.functionSignals).toEqual(
      expect.arrayContaining(["economy.generic", "economy.turn_start_credit"]),
    );

    const entry = cardSpecPlanningCards().find(
      (candidate) =>
        candidate.definition.id === "onr_v1_184_top-runners-conference",
    );
    if (entry === undefined) throw new Error("missing_top_runners_conference");
    const withoutRunStartTrash = deriveCardSpecAiHint({
      ...entry,
      planning: {
        ...entry.planning,
        planningAnnotations: undefined,
        engine: {
          ...entry.planning.engine,
          lifecycle: {
            ...entry.planning.engine.lifecycle,
            on_runner_run_start: undefined,
          },
        },
      },
    } as never);
    expect(withoutRunStartTrash.effects ?? []).not.toContainEqual(
      expect.objectContaining({ target: "risk.ends_on_run" }),
    );
  });

  it("projects an exact installed-program access ambush without text inference", () => {
    const experimental = actualHint("onr_v1_323_experimental-ai");

    expect(experimental.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "ambush",
          scope: "accessed_card",
          timing: "on_access",
        }),
        expect.objectContaining({
          kind: "program_trash",
          scope: "installed_program",
          timing: "on_access",
          amountKind: "dynamic",
        }),
      ]),
    );

    const entry = cardSpecPlanningCards().find(
      (candidate) => candidate.definition.id === "onr_v1_323_experimental-ai",
    );
    if (entry === undefined) throw new Error("missing_experimental_ai");
    const withoutAccessEffect = deriveCardSpecAiHint({
      ...entry,
      planning: {
        ...entry.planning,
        planningAnnotations: undefined,
        engine: { ...entry.planning.engine, accessEffects: undefined },
      },
    } as never);
    expect(withoutAccessEffect.effects ?? []).not.toContainEqual(
      expect.objectContaining({ kind: "program_trash", timing: "on_access" }),
    );
  });

  it("binds Blood Cat trace and tag semantics to its exact capability", () => {
    const entry = cardSpecPlanningCards().find(
      (candidate) => candidate.definition.id === "onr_v1_310_blood-cat",
    );
    if (entry === undefined) throw new Error("missing_blood_cat_test_card");

    const hint = deriveCardSpecAiHint(entry);

    expect(hint.actionCapabilitySemantics).toEqual([
      expect.objectContaining({
        capabilityKey: "abilities_activated_corp_main_trace",
        effects: expect.arrayContaining([
          expect.objectContaining({
            kind: "trace",
            scope: "trace",
            timing: "action",
          }),
          expect.objectContaining({
            kind: "tag_source",
            scope: "runner",
            timing: "action",
            amount: 1,
          }),
        ]),
        functionSignals: expect.arrayContaining(["tag.source", "trace.source"]),
        strategySupportPairs: expect.arrayContaining([
          expect.objectContaining({
            strategyId: "corp.tag_trace_punish",
            evidence: ["tactic_signal_anchor:tag.source"],
          }),
          expect.objectContaining({
            strategyId: "corp.tag_trace_punish",
            evidence: ["tactic_signal_anchor:trace.source"],
          }),
        ]),
      }),
    ]);

    const traceWithoutOutcome = syntheticHint(
      {
        abilities: [
          activated([{ kind: "trace", traceLimit: 5, onSuccess: [] }]),
        ],
      },
      { side: "corp", type: "asset" },
    );
    expect(traceWithoutOutcome.actionCapabilitySemantics?.[0]?.effects).toEqual(
      [expect.objectContaining({ kind: "trace" })],
    );
    expect(
      traceWithoutOutcome.actionCapabilitySemantics?.[0]?.functionSignals,
    ).not.toContain("tag.source");
  });

  it("projects a typed delayed-install countdown without widening nearby cards", () => {
    const shell = actualHint("onr_v1_176_the-shell-traders");
    expect(shell.roles).toContain("delayed_install");
    expect(shell.effects).toContainEqual({
      kind: "install",
      scope: "runner",
      timing: "persistent",
      resource: "cards",
      target: "setup.install_countdown",
      repeatable: true,
    });
    expect(shell.functionSignals).toEqual(
      expect.arrayContaining([
        "setup.delayed_install",
        "setup.install_countdown",
      ]),
    );

    const shellEntry = cardSpecPlanningCards().find(
      (entry) => entry.definition.id === "onr_v1_176_the-shell-traders",
    );
    if (!shellEntry) throw new Error("missing_shell_traders_test_card");
    const withoutCountdown = deriveCardSpecAiHint({
      ...shellEntry,
      planning: {
        ...shellEntry.planning,
        planningAnnotations: undefined,
        engine: {
          ...shellEntry.planning.engine,
          hiddenReplacementLongtail: undefined,
        },
      },
    } as never);
    expect(withoutCountdown.roles).not.toContain("delayed_install");
    expect(withoutCountdown.effects ?? []).not.toContainEqual(
      expect.objectContaining({ target: "setup.install_countdown" }),
    );
  });

  it("sees all 27 canonical trace source cards without legacy trace fields", () => {
    const cards = cardSpecPlanningCards();
    const directTraceCards = cards.filter((entry) => {
      const engine = entry.planning.engine;
      return (
        engine.printedSubroutines?.some(
          (subroutine) => subroutine.kind === "trace",
        ) === true ||
        engine.abilities?.some((ability) =>
          ability.effects.some((effect) => effect.kind === "trace"),
        ) === true ||
        engine.accessEffects?.some((access) =>
          access.effects.some((effect) => effect.kind === "trace"),
        ) === true
      );
    });
    const directTraceNodes = directTraceCards.reduce((count, entry) => {
      const engine = entry.planning.engine;
      return (
        count +
        (engine.printedSubroutines ?? []).filter(
          (subroutine) => subroutine.kind === "trace",
        ).length +
        (engine.abilities ?? [])
          .flatMap((ability) => ability.effects)
          .filter((effect) => effect.kind === "trace").length +
        (engine.accessEffects ?? [])
          .flatMap((access) => access.effects)
          .filter((effect) => effect.kind === "trace").length
      );
    }, 0);
    const dynamicTraceCards = cards.filter(
      (entry) =>
        entry.planning.engine.relativeIce?.dynamicTraceSubroutines !==
        undefined,
    );

    expect(directTraceCards).toHaveLength(26);
    expect(directTraceNodes).toBe(27);
    expect(dynamicTraceCards).toHaveLength(1);
    expect(dynamicTraceCards[0]?.definition.id).toBe(
      "onr_proteus_026_hunting-pack",
    );
    expect(
      new Set([
        ...directTraceCards.map((entry) => entry.definition.id),
        ...dynamicTraceCards.map((entry) => entry.definition.id),
      ]).size,
    ).toBe(27);
  });

  it("keeps Codecracker's printed install and memory costs separate from ability prices", () => {
    const hint = actualHint("onr_v1_014_codecracker");

    expect(hint.costProfile).toMatchObject({
      clicks: 1,
      credits: 2,
      memory: 1,
    });
    expect(hint.breakerProfile).toMatchObject({
      breakCost: 0,
      pumpCost: 1,
      pumpStrengthAmount: 1,
    });
  });

  it("projects Data Raven and Asp trace outcomes from exact printed unions", () => {
    const dataRaven = actualHint("onr_v1_236_data-raven");
    const asp = actualHint("onr_v1_221_asp");

    expect(dataRaven.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "trace", target: "trace.source" }),
        expect.objectContaining({
          kind: "tag_source",
          target: "corp_ice.trace_tag",
          amount: 1,
        }),
        expect.objectContaining({
          kind: "persistent_counter_effect",
          target: "corp_ice.trace_tag_counter_counter",
          amount: 1,
        }),
      ]),
    );
    expect(dataRaven.conditions).toEqual(
      expect.arrayContaining([
        { kind: "requires_trace_attempt" },
        { kind: "requires_trace_success" },
      ]),
    );
    expect(asp.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "etr" }),
        expect.objectContaining({ kind: "run_lock", amount: 1 }),
      ]),
    );
  });

  it("projects Boardwalk virus pressure and the Corp purge action cost", () => {
    const hint = actualHint("onr_v1_008_boardwalk");

    expect(hint.functionSignals).toEqual(
      expect.arrayContaining([
        "virus.counter_gain_on_successful_run",
        "virus.corp_purgeable_counter",
      ]),
    );
    expect(hint.effects).toContainEqual(
      expect.objectContaining({
        kind: "persistent_counter_effect",
        timing: "successful_run",
        amount: 1,
      }),
    );
    expect(hint.actionCapacityProfiles).toContainEqual(
      expect.objectContaining({
        class: "action_cost",
        recipient: "corp",
        restriction: "purge_only",
        amount: 3,
        actionTypes: ["purge_virus_counters"],
      }),
    );
  });

  it("preserves agenda trace and scored hosted-credit ownership and timing", () => {
    const netwatch = actualHint("onr_v1_207_netwatch-operations-office");
    const coup = actualHint("onr_v1_193_corporate-coup");

    expect(netwatch.cardType).toBe("agenda");
    expect(netwatch.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "trace", target: "trace.source" }),
        expect.objectContaining({ kind: "tag_source", amount: 1 }),
      ]),
    );
    expect(coup.cardType).toBe("agenda");
    expect(coup.effects).toContainEqual(
      expect.objectContaining({
        kind: "finite_economy_pool",
        scope: "corp",
        timing: "when_scored",
        target: "economy.hosted_credit_bank",
        amount: 15,
      }),
    );
  });

  it("projects Baedeker and Back Door trace-link windows from typed effects", () => {
    for (const cardId of [
      "onr_v1_003_baedekers-net-map",
      "onr_v1_152_back-door-to-hilliard",
    ]) {
      const hint = actualHint(cardId);
      expect(hint.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "base_link",
            timing: "trace_window",
          }),
          expect.objectContaining({
            kind: "link",
            timing: "trace_window",
            amount: 1,
          }),
        ]),
      );
      expect(hint.functionSignals).toEqual(
        expect.arrayContaining(["trace.base_link", "trace.link_boost"]),
      );
    }
  });

  it("emits typed target skeletons for SMC and Mystery Box without inventing them elsewhere", () => {
    const smc = actualHint("onr_v1_059_self-modifying-code");
    const mysteryBox = actualHint("onr_v1_043_mystery-box");

    expect(smc.targetProfiles).toContainEqual(
      expect.objectContaining({
        kind: "search_install_target",
        timing: "activated_ability",
        targetType: "program",
      }),
    );
    expect(mysteryBox.targetProfiles).toContainEqual({
      zone: "stack_top",
      targetCardType: "program",
      lookCount: 5,
      showToOpponent: true,
      shuffleAfter: true,
    });
    expect(smc.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "search",
          scope: "stack",
          target: "program",
        }),
        expect.objectContaining({
          kind: "install",
          scope: "installed_card",
          target: "program",
        }),
      ]),
    );
    expect(mysteryBox.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "topdeck_info",
          scope: "stack",
          target: "look_top_stack",
          amount: 5,
        }),
        expect.objectContaining({
          kind: "search",
          scope: "stack",
          target: "top_stack_matching_card",
          amount: 5,
        }),
        expect.objectContaining({
          kind: "install",
          scope: "installed_card",
          target: "program",
          amount: 1,
        }),
      ]),
    );

    const noTarget = syntheticHint({
      abilities: [activated([{ kind: "search_stack_install_like" }])],
    });
    expect(noTarget.targetProfiles).toBeUndefined();
    expect(noTarget.effects ?? []).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "search" }),
        expect.objectContaining({ kind: "install" }),
      ]),
    );
  });

  it("compiles Reflector's single any-of matcher without duplicating coverage", () => {
    expect(actualHint("onr_v1_055_reflector").breakerProfile).toMatchObject({
      coverage: ["unknown_special"],
      breakCost: 0,
      maxSubroutinesPerBreak: 1,
    });
  });

  it("retains runner self-trash semantics when trashing is an ability cost", () => {
    expect(actualHint("onr_v1_059_self-modifying-code")).toMatchObject({
      effects: expect.arrayContaining([
        expect.objectContaining({
          kind: "program_trash",
          timing: "during_run",
          target: "source.trash",
        }),
      ]),
      functionSignals: expect.arrayContaining(["risk.self_trash"]),
    });
  });

  it("keeps scored agenda server placement and reveal choices on their actual target dimensions", () => {
    const hintFor = (cardId: string) => {
      const entry = cardSpecPlanningCards().find(
        (candidate) => candidate.definition.id === cardId,
      );
      if (!entry) throw new Error(`missing_test_card:${cardId}`);
      return deriveCardSpecAiHint(entry);
    };

    expect(hintFor("onr_v1_216_security-purge").targetProfiles).toContainEqual(
      expect.objectContaining({
        kind: "install_target",
        timing: "on_score",
        targetType: "server",
        purpose: "choose_server_for_revealed_ice_install",
      }),
    );
    expect(
      hintFor("onr_v1_219_superior-net-barriers").targetProfiles,
    ).toContainEqual(
      expect.objectContaining({
        kind: "use_target",
        timing: "on_score",
        targetType: "installed_ice",
        purpose: "choose_walls_to_reveal_for_credits",
      }),
    );
  });

  it("binds a successful-run fort target only to the typed force-rez followup", () => {
    const entry = targetAnnotatedEntry("onr_v1_026_false-echo");

    expect(deriveCardSpecAiHint(entry).targetProfiles).toContainEqual({
      schemaVersion: "target-profile-v1",
      kind: "use_target",
      timing: "after_successful_run",
      targetType: "server",
      purpose: "force_rez_fort_ice",
      avoid: ["hidden_info_dependent_choice"],
      hiddenInfoPolicy: "legal_targets_only",
      serverScope: "source_fort",
    });

    expect(() =>
      deriveCardSpecAiHint({
        ...entry,
        planning: {
          ...entry.planning,
          engine: {
            ...entry.planning.engine,
            successfulRunFollowups: [
              {
                kind: "optional_make_run_after_successful_run",
                target: "different_server",
                visibility: "public",
              },
            ],
          },
        },
      } as never),
    ).toThrow("card_spec_target_preference_without_supported_mechanical_owner");
  });

  it("projects Data Crèche as a successful-run bonus run without grip-reset semantics", () => {
    const hint = actualHint("onr_v1_123_bodyweight-data-creche");

    expect(hint).toMatchObject({
      roles: expect.arrayContaining(["run_support"]),
      effects: expect.arrayContaining([
        expect.objectContaining({
          kind: "future_run_effect",
          timing: "after_successful_run",
          target: "make_run",
        }),
      ]),
      functionSignals: expect.arrayContaining(["run.make_run"]),
      requiredMechanics: expect.arrayContaining([
        "successful_run_trigger",
        "make_run",
      ]),
    });
    expect(hint.roles).not.toContain("remote_support");
    expect(hint.functionSignals).not.toContain("run.successful_run_grip_reset");
    expect(hint.tacticSignals ?? []).not.toContain(
      "run.successful_run_grip_reset",
    );
    expect(hint.requiredMechanics).not.toEqual(
      expect.arrayContaining(["shuffle_grip_into_stack", "draw_cards"]),
    );
    expect(hint.riskTags).not.toContain("hidden_zone");
  });

  it("compiles all Originalset target preferences through exact typed owner unions", () => {
    const entries = cardSpecPlanningCards().filter(
      (entry) =>
        entry.definition.id.startsWith("onr_v1_") &&
        ((entry.planning.planningAnnotations?.card?.some(
          (annotation) => annotation.kind === "target_preference",
        ) ??
          false) ||
          (entry.planning.planningAnnotations?.capabilities?.some(
            (capability) =>
              capability.annotations.some(
                (annotation) => annotation.kind === "target_preference",
              ),
          ) ??
            false)),
    );
    expect(
      entries.reduce(
        (count, entry) =>
          count +
          (entry.planning.planningAnnotations?.card?.filter(
            (annotation) => annotation.kind === "target_preference",
          ).length ?? 0) +
          (entry.planning.planningAnnotations?.capabilities
            ?.flatMap((capability) => capability.annotations)
            .filter((annotation) => annotation.kind === "target_preference")
            .length ?? 0),
        0,
      ),
    ).toBe(71);
    for (const entry of entries)
      expect(() =>
        deriveCardSpecAiHint(targetAnnotatedEntry(entry.definition.id)),
      ).not.toThrow();

    const witnesses = [
      [
        "onr_v1_032_i-spy",
        {
          timing: "after_successful_run",
          targetType: "server",
          serverScope: "source_fort",
        },
      ],
      [
        "onr_v1_046_pattels-virus",
        {
          timing: "after_successful_run",
          targetType: "installed_ice",
          serverScope: "source_fort",
        },
      ],
      [
        "onr_v1_075_zetatech-software-installer",
        {
          kind: "install_target",
          timing: "paid_action",
          targetType: "program",
        },
      ],
      [
        "onr_v1_077_anonymous-tip",
        { kind: "use_target", timing: "on_play", targetType: "installed_ice" },
      ],
      [
        "onr_v1_100_misc-for-sale",
        { kind: "use_target", timing: "on_play", targetType: "card" },
      ],
      [
        "onr_v1_131_microtech-backup-drive",
        {
          kind: "replacement_target",
          timing: "replacement_window",
          targetType: "program",
        },
      ],
      [
        "onr_v1_289_edgerunner-inc-temps",
        { kind: "install_target", timing: "on_play", targetType: "card" },
      ],
      [
        "onr_v1_294_new-blood",
        { kind: "use_target", timing: "on_play", targetType: "ice_position" },
      ],
      [
        "onr_v1_298_planning-consultants",
        { kind: "use_target", timing: "on_play", targetType: "card" },
      ],
      [
        "onr_v1_316_cowboy-sysop",
        {
          kind: "use_target",
          timing: "activated_ability",
          targetType: "card",
        },
      ],
    ] as const;
    for (const [cardId, expected] of witnesses)
      expect(
        deriveCardSpecAiHint(targetAnnotatedEntry(cardId)).targetProfiles,
      ).toContainEqual(expect.objectContaining(expected));

    expect(
      deriveCardSpecAiHint(
        targetAnnotatedEntry("onr_v1_046_pattels-virus"),
      ).targetProfiles?.filter((profile) => "schemaVersion" in profile),
    ).toHaveLength(1);
    expect(
      deriveCardSpecAiHint(targetAnnotatedEntry("onr_v1_044_netspace-inverter"))
        .targetProfiles,
    ).toBeUndefined();
  });

  it("rejects near-matching target families without the exact typed owner kind", () => {
    const forged = (cardId: string, engine: Record<string, unknown>) => {
      const entry = targetAnnotatedEntry(cardId);
      return () =>
        deriveCardSpecAiHint({
          ...entry,
          planning: {
            ...entry.planning,
            engine: { ...entry.planning.engine, ...engine },
          },
        } as never);
    };

    expect(
      forged("onr_v1_032_i-spy", {
        runnerUtilityLongtail: {
          kind: "trace_link_end_run_after_encounter",
          visibility: "public",
        },
      }),
    ).toThrow("card_spec_target_preference_without_supported_mechanical_owner");
    expect(
      forged("onr_v1_075_zetatech-software-installer", {
        restrictedHostedCreditSource: {
          ...targetAnnotatedEntry("onr_v1_075_zetatech-software-installer")
            .planning.engine.restrictedHostedCreditSource,
          usableFor: ["play_events"],
        },
      }),
    ).toThrow("card_spec_target_preference_without_supported_mechanical_owner");
    expect(
      forged("onr_v1_046_pattels-virus", {
        virusCounter: {
          ...targetAnnotatedEntry("onr_v1_046_pattels-virus").planning.engine
            .virusCounter,
          addOnSuccessfulRun: {
            server: "any",
            counterScope: { kind: "source_card" },
            amount: 1,
            visibility: "public",
          },
        },
      }),
    ).toThrow("card_spec_unknown_virus_counter_target_profile_server");
    expect(
      forged("onr_v1_316_cowboy-sysop", {
        corpUtility: { kind: "encounter_tag", visibility: "public" },
      }),
    ).toThrow("card_spec_target_preference_without_supported_mechanical_owner");
  });

  it("projects static play, install, memory, and rez facts", () => {
    const runner = syntheticHint(
      {
        characteristics: {
          ...cardSpecPlanningCards()[0]!.planning.engine.characteristics,
          numeric: {
            ...cardSpecPlanningCards()[0]!.planning.engine.characteristics
              .numeric,
            installCost: 3,
            memoryCost: 2,
          },
        },
      },
      { side: "runner", type: "program" },
    );
    expect(runner.costProfile).toMatchObject({
      clicks: 1,
      credits: 3,
      memory: 2,
    });

    const operation = syntheticHint(
      {
        characteristics: {
          ...cardSpecPlanningCards()[0]!.planning.engine.characteristics,
          playCost: { kind: "fixed", credits: 4 },
        },
      },
      { side: "corp", type: "operation" },
    );
    expect(operation.costProfile).toMatchObject({ clicks: 1, credits: 4 });

    const ice = syntheticHint(
      {
        characteristics: {
          ...cardSpecPlanningCards()[0]!.planning.engine.characteristics,
          numeric: {
            ...cardSpecPlanningCards()[0]!.planning.engine.characteristics
              .numeric,
            rezCost: 6,
          },
        },
      },
      { side: "corp", type: "ice" },
    );
    expect(ice.costProfile).toMatchObject({ credits: 6 });
  });

  it("projects generic effects, conditions, and target shape without inventing preferences", () => {
    const hint = syntheticHint({
      abilities: [
        {
          ...activated([
            {
              kind: "look_top_stack_take_matching",
              count: 4,
              allowedTypes: ["program"],
              costPerTaken: 1,
              revealTakenToCorp: true,
              shuffleRemainder: true,
              visibility: "hidden_info_barrier",
            },
            {
              kind: "move_top_trash_to_grip",
              recipient: "runner",
              visibility: "hidden_info_barrier",
            },
          ]),
          condition: { kind: "runner_is_tagged" },
        },
      ],
    });

    expect(hint.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "topdeck_info",
          target: "look_top_stack",
          amount: 4,
        }),
        expect.objectContaining({
          kind: "card_recovery",
          target: "move_top_trash_to_grip",
        }),
      ]),
    );
    expect(hint.conditions).toContainEqual({ kind: "requires_runner_tagged" });
    expect(hint.targetProfiles).toContainEqual({
      zone: "stack_top",
      targetCardType: "program",
      lookCount: 4,
      showToOpponent: true,
      shuffleAfter: true,
    });
    expect(
      hint.targetProfiles?.some((profile) => "preferences" in profile),
    ).toBe(false);
  });

  it("projects trace outcomes and link windows from their exact typed unions", () => {
    const hint = syntheticHint({
      abilities: [
        activated([
          {
            kind: "trace",
            traceLimit: 5,
            onSuccess: [
              {
                kind: "add_tags",
                recipient: "runner",
                amount: 2,
                visibility: "public",
              },
              { kind: "end_run", visibility: "public" },
              {
                kind: "runner_run_lock_until_action_paid",
                amount: 3,
                visibility: "public",
              },
              {
                kind: "preventable_damage",
                recipient: "runner",
                damageType: "net",
                amount: 4,
                visibility: "public",
              },
              {
                kind: "add_counter",
                recipient: "runner",
                counterType: "baskerville",
                amount: 1,
                visibility: "public",
              },
            ],
            visibility: "public",
          },
          { kind: "use_base_link", baseLink: 2, visibility: "public" },
          { kind: "increase_trace_link", amount: 3, visibility: "public" },
        ]),
      ],
    });
    expect(hint.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "trace", target: "trace.source" }),
        expect.objectContaining({ kind: "tag_source", amount: 2 }),
        expect.objectContaining({ kind: "etr" }),
        expect.objectContaining({ kind: "run_lock", amount: 3 }),
        expect.objectContaining({
          kind: "damage",
          resource: "net_damage",
          amount: 4,
        }),
        expect.objectContaining({
          kind: "persistent_counter_effect",
          amount: 1,
        }),
        expect.objectContaining({ kind: "base_link", amount: 2 }),
        expect.objectContaining({ kind: "link", amount: 3 }),
      ]),
    );
    expect(hint.conditions).toEqual(
      expect.arrayContaining([
        { kind: "requires_trace_attempt" },
        { kind: "requires_trace_success" },
      ]),
    );
  });

  it("projects make-run supplements, hosted-credit ownership, virus, and draw tax", () => {
    const hint = syntheticHint({
      abilities: [
        activated([
          {
            kind: "make_run",
            target: { kind: "chosen_server" },
            bypassFirstIce: true,
            runTemporaryCredits: {
              side: "runner",
              amount: 4,
              usableFor: "any_runner_cost_during_this_run",
              returnUnusedAtRunEnd: true,
            },
            successfulRunRunnerCreditGain: 3,
            afterRunCompletedUnpreventableCoreDamage: 1,
            visibility: "public",
          },
          {
            kind: "add_hosted_credits",
            target: "source",
            amount: 2,
            visibility: "public",
          },
        ]),
      ],
      virusCounter: {
        counterKind: "boardwalk",
        addOnSuccessfulRun: {
          server: "any",
          counterScope: { kind: "source_card" },
          amount: 1,
          visibility: "public",
        },
      },
      remainingReplacementLongtail: {
        kind: "runner_draw_tax_tag",
        avoidTagCost: 1,
        visibility: "public",
      },
    });
    expect(hint.functionSignals).toEqual(
      expect.arrayContaining([
        "run.make_run",
        "run.bypass_first_ice",
        "economy.run_credits",
        "risk.self_damage",
        "virus.counter_gain_on_successful_run",
        "virus.corp_purgeable_counter",
        "draw.runner_tax",
      ]),
    );
    expect(hint.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "future_run_effect",
          target: "make_run",
        }),
        expect.objectContaining({
          kind: "counter_economy",
          scope: "runner",
          timing: "action",
        }),
        expect.objectContaining({
          kind: "persistent_counter_effect",
          timing: "successful_run",
        }),
        expect.objectContaining({
          kind: "tag_source",
          target: "runner_draw_tax_tag",
        }),
      ]),
    );
    expect(hint.targetProfiles).toContainEqual(
      expect.objectContaining({
        targetType: "server",
        purpose: "make_run:synthetic_typed_capability",
      }),
    );
  });

  it("keeps scored-agenda and printed lock semantics kind-specific", () => {
    const scored = syntheticHint(
      {
        scoredAgenda: {
          kind: "gain_credits_on_score",
          recipient: "corp",
          amount: 7,
          visibility: "public",
        },
      },
      { side: "corp", type: "agenda" },
    );
    expect(scored.effects).toContainEqual(
      expect.objectContaining({
        kind: "economy",
        timing: "when_scored",
        target: "score.credit_gain",
        amount: 7,
      }),
    );
    expect(scored.functionSignals).not.toContain("score.remote_fort_creation");

    const ice = syntheticHint(
      {
        printedSubroutines: [
          {
            kind: "prohibit_break_and_jack_out_next_ice",
            text: "*Runner cannot break any subroutines of the next piece of ice encountered during the run, and cannot jack out until after that encounter.",
          },
          {
            kind: "runner_run_lock_actions",
            amount: 2,
            text: "synthetic",
          },
        ],
      },
      { side: "corp", type: "ice" },
    );
    expect(ice.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "future_encounter_effect",
          target: "corp_ice.next_ice_break_lock",
        }),
        expect.objectContaining({
          kind: "no_jack_out",
          target: "corp_ice.next_ice_jack_out_lock",
        }),
        expect.objectContaining({ kind: "run_lock", amount: 2 }),
      ]),
    );
  });

  it("does not infer typed signals from forged near-match kinds", () => {
    const hint = syntheticHint({
      abilities: [
        {
          ...activated([
            { kind: "gain_credits_like", amount: 99, recipient: "runner" },
            { kind: "make_running", bypassFirstIce: true },
            { kind: "use_base_link_like", baseLink: 7 },
          ]),
          condition: { kind: "runner_is_tagged_like" },
        },
      ],
      scoredAgenda: { kind: "gain_credits_on_score_like", amount: 12 },
    });
    expect(hint.functionSignals).not.toContain("economy.burst_credit");
    expect(hint.functionSignals).not.toContain("run.bypass_first_ice");
    expect(hint.functionSignals).not.toContain("trace.base_link");
    expect(hint.functionSignals).not.toContain(
      "virus.counter_gain_on_successful_run",
    );
    expect(hint.functionSignals).not.toContain("score.credit_gain");
    expect(hint.conditions).not.toContainEqual({
      kind: "requires_runner_tagged",
    });
    expect(hint.effects).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ amount: 99 }),
        expect.objectContaining({ target: "bypass_first_ice" }),
      ]),
    );

    expect(() =>
      syntheticHint({
        virusCounterLike: {
          addOnSuccessfulRun: { target: "source", amount: 9 },
        },
      }),
    ).toThrow("card_spec_hint_unsupported_family: virusCounterLike");
  });

  it("does not infer static prices from lookalike characteristic fields", () => {
    const hint = syntheticHint(
      {
        characteristics: {
          ...cardSpecPlanningCards()[0]!.planning.engine.characteristics,
          numeric: {
            ...cardSpecPlanningCards()[0]!.planning.engine.characteristics
              .numeric,
            installCost: null,
            memoryCost: null,
            installationCost: 99,
            mu: 8,
          },
        },
      },
      { side: "runner", type: "program" },
    );

    expect(hint.costProfile).toEqual({ clicks: 1 });
  });
});
