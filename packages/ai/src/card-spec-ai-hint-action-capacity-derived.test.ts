import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";

import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

const profile = (input: Record<string, unknown>) => ({
  restriction: "unrestricted",
  amountKind: "fixed",
  bankable: false,
  repeatable: false,
  ...input,
});

function syntheticHint(
  engine: Record<string, unknown>,
  options: { side?: "corp" | "runner"; type?: string } = {},
) {
  const entry = cardSpecPlanningCards().find(
    (candidate) =>
      candidate.definition.side === (options.side ?? "corp") &&
      candidate.planning.engine.abilities === undefined &&
      candidate.planning.engine.corpUtility === undefined &&
      candidate.planning.engine.flatlineReplacementSources === undefined &&
      candidate.planning.engine.lifecycle === undefined &&
      candidate.planning.engine.printedSubroutines === undefined &&
      candidate.planning.engine.remainingReplacementLongtail === undefined &&
      candidate.planning.engine.runnerUtilityLongtail === undefined &&
      candidate.planning.engine.tagPreventionSources === undefined,
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

describe("CardSpec action-capacity profile derivation", () => {
  it.each([
    [
      "runner program-install action bundle",
      {
        abilities: [
          {
            kind: "on_play",
            costs: "printed",
            effects: [
              {
                kind: "start_runner_program_install_action_bundle",
                actionCount: 5,
                temporaryCredit: 1,
                allowedActionKind: "install_program",
                mayStopEarly: true,
                visibility: "public",
              },
            ],
          },
        ],
      },
      { side: "runner" },
      profile({
        class: "restricted_gain",
        timing: "immediate",
        recipient: "runner",
        restriction: "program_install_only",
        reliability: "guaranteed",
        sourceResource: "source_card",
        expiresAt: "side_turn_end",
        amount: 5,
        actionTypes: ["install_card"],
      }),
    ],
    [
      "on-play gain_actions",
      {
        abilities: [
          {
            kind: "on_play",
            costs: "printed",
            effects: [
              {
                kind: "gain_actions",
                recipient: "corp",
                amount: 2,
                visibility: "public",
              },
            ],
          },
        ],
      },
      {},
      profile({
        class: "immediate_gain",
        timing: "immediate",
        recipient: "corp",
        reliability: "guaranteed",
        sourceResource: "source_card",
        expiresAt: "side_turn_end",
        amount: 2,
      }),
    ],
    [
      "scored counter ability gain_actions",
      {
        abilities: [
          {
            kind: "activated",
            timing: "corp_main",
            costs: [
              {
                kind: "source_counter",
                counterType: "boon",
                amount: 1,
                source: "source",
              },
            ],
            effects: [
              {
                kind: "gain_actions",
                recipient: "corp",
                amount: 1,
                visibility: "public",
              },
            ],
            label: "synthetic",
          },
        ],
      },
      { type: "agenda" },
      profile({
        class: "finite_bank",
        timing: "scored_activated",
        recipient: "corp",
        reliability: "guaranteed",
        sourceResource: "counter",
        expiresAt: "source_leaves_play",
        amount: 1,
        bankable: true,
        repeatable: true,
      }),
    ],
    [
      "advancement counter ability gain_actions",
      {
        abilities: [
          {
            kind: "activated",
            timing: "corp_main",
            costs: [
              { kind: "advancement_counter", amount: 1, source: "source" },
            ],
            effects: [
              {
                kind: "gain_actions",
                recipient: "controller",
                amount: 1,
                visibility: "public",
              },
            ],
            label: "synthetic",
          },
        ],
      },
      {},
      profile({
        class: "finite_bank",
        timing: "immediate",
        recipient: "corp",
        reliability: "guaranteed",
        sourceResource: "advancement_counter",
        expiresAt: "source_leaves_play",
        amount: 1,
        bankable: true,
        repeatable: true,
      }),
    ],
    [
      "on-rez and turn-start lifecycle gain_actions",
      {
        lifecycle: {
          on_rez: [
            {
              kind: "gain_actions",
              recipient: "controller",
              amount: 1,
              visibility: "public",
            },
          ],
          start_of_corp_turn: [
            {
              effects: [
                {
                  kind: "gain_actions",
                  recipient: "controller",
                  amount: 1,
                  visibility: "public",
                },
              ],
            },
          ],
        },
      },
      {},
      [
        profile({
          class: "immediate_gain",
          timing: "on_rez",
          recipient: "corp",
          reliability: "guaranteed",
          sourceResource: "source_card",
          expiresAt: "side_turn_end",
          amount: 1,
        }),
        profile({
          class: "recurring_gain",
          timing: "start_of_turn",
          recipient: "corp",
          reliability: "guaranteed",
          sourceResource: "source_card",
          expiresAt: "source_leaves_play",
          amount: 1,
          repeatable: true,
        }),
      ],
    ],
    [
      "rezzed-leave turn-start lifecycle gain_actions",
      {
        lifecycle: {
          start_of_corp_turn: [
            {
              effects: [
                {
                  kind: "gain_actions",
                  recipient: "controller",
                  amount: 1,
                  visibility: "public",
                },
              ],
            },
          ],
        },
        uniqueDirectLongtail: {
          kind: "rezzed_leave_action_gain_asset",
          actionGain: 1,
          visibility: "public",
        },
      },
      {},
      profile({
        class: "recurring_gain",
        timing: "start_of_turn",
        recipient: "corp",
        reliability: "conditional",
        sourceResource: "source_card",
        expiresAt: "source_leaves_play",
        amount: 1,
        repeatable: true,
      }),
    ],
    [
      "restricted corp install utility",
      {
        corpUtility: {
          kind: "gain_restricted_install_actions",
          amount: 3,
          mayStopEarly: true,
          visibility: "public",
        },
      },
      {},
      profile({
        class: "restricted_gain",
        timing: "immediate",
        recipient: "corp",
        restriction: "install_only",
        reliability: "guaranteed",
        sourceResource: "source_card",
        expiresAt: "side_turn_end",
        amount: 3,
        actionTypes: ["install_card"],
      }),
    ],
    [
      "optional runner extra action",
      {
        runnerUtilityLongtail: {
          kind: "optional_extra_action_with_delayed_damage",
          extraActions: 1,
          damageType: "core",
          damageAmount: 1,
          damageTiming: "end_of_turn",
          preventable: false,
          limit: "once_per_turn_per_source",
          visibility: "public",
        },
      },
      { side: "runner" },
      profile({
        class: "recurring_gain",
        timing: "immediate",
        recipient: "runner",
        reliability: "conditional",
        sourceResource: "source_card",
        expiresAt: "side_turn_end",
        amount: 1,
        repeatable: true,
      }),
    ],
    [
      "random persistent runner action",
      {
        runnerUtilityLongtail: {
          kind: "start_turn_random_effect_table",
          dieFaces: 6,
          randomPurpose: "runner_start_turn_source",
          outcomes: [
            {
              roll: 6,
              kind: "trash_source_and_grant_persistent_extra_action",
              extraActions: 1,
            },
          ],
          defaultOutcome: { kind: "no_effect" },
          visibility: "public",
        },
      },
      { side: "runner" },
      profile({
        class: "random_gain",
        timing: "start_of_turn",
        recipient: "runner",
        restriction: "random_action",
        reliability: "random",
        sourceResource: "die_roll",
        expiresAt: "persistent",
        amount: 1,
        repeatable: true,
      }),
    ],
    [
      "run spending-cap replacement",
      {
        remainingReplacementLongtail: {
          kind: "run_action_spending_cap",
          actionGain: 1,
          spendingCap: 3,
          appliesTo: ["icebreaker_use", "increase_link"],
          visibility: "public",
        },
      },
      { side: "runner" },
      profile({
        class: "restricted_gain",
        timing: "immediate",
        recipient: "runner",
        restriction: "run_only",
        reliability: "conditional",
        sourceResource: "source_card",
        expiresAt: "resolution",
        amount: 1,
        repeatable: true,
        actionTypes: ["start_run"],
      }),
    ],
    [
      "forgo-next-action subroutine",
      {
        printedSubroutines: [
          { kind: "runner_forgoes_next_action", text: "synthetic" },
        ],
      },
      {},
      profile({
        class: "action_loss",
        timing: "encounter",
        recipient: "runner",
        reliability: "conditional",
        sourceResource: "encounter_effect",
        expiresAt: "side_turn_end",
        amount: 1,
        repeatable: true,
      }),
    ],
    [
      "flatline future-action debt",
      {
        flatlineReplacementSources: [
          {
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
        ],
      },
      { side: "runner" },
      profile({
        class: "action_debt",
        timing: "prevention_window",
        recipient: "runner",
        reliability: "guaranteed",
        sourceResource: "replacement_effect",
        expiresAt: "debt_paid",
        amount: 4,
      }),
    ],
    [
      "flatline action override",
      {
        flatlineReplacementSources: [
          {
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
      { side: "runner" },
      profile({
        class: "action_loss",
        timing: "persistent",
        recipient: "runner",
        reliability: "guaranteed",
        sourceResource: "replacement_effect",
        expiresAt: "persistent",
        amount: 1,
      }),
    ],
  ])("derives %s without card identity", (_name, engine, options, expected) => {
    const profiles = syntheticHint(
      engine as Record<string, unknown>,
      options as { side?: "corp" | "runner"; type?: string },
    ).actionCapacityProfiles;
    expect(profiles).toEqual(Array.isArray(expected) ? expected : [expected]);
  });

  it("fails closed for incomplete recognized action-capacity shapes", () => {
    expect(() =>
      syntheticHint({
        abilities: [
          {
            kind: "activated",
            timing: "corp_main",
            costs: [],
            effects: [
              {
                kind: "gain_actions",
                recipient: "corp",
                amount: 1,
                visibility: "public",
              },
            ],
            label: "synthetic",
          },
        ],
      }),
    ).toThrow("card_spec_unknown_action_capacity_activated_gain_shape");

    expect(
      syntheticHint(
        {
          runnerUtilityLongtail: {
            kind: "start_turn_random_effect_table",
            dieFaces: 6,
            randomPurpose: "runner_start_turn_source",
            outcomes: [{ roll: 1, kind: "no_effect" }],
            defaultOutcome: { kind: "no_effect" },
            visibility: "public",
          },
        },
        { side: "runner" },
      ).actionCapacityProfiles,
    ).toBeUndefined();

    expect(() =>
      syntheticHint(
        {
          flatlineReplacementSources: [
            {
              kind: "flatline_replacement_installed",
              replacement: "installed_flatline_prevention",
              resolution: { runnerActionsPerTurnOverride: 4 },
              cost: { kind: "trash_source" },
              visibility: "public",
            },
          ],
        },
        { side: "runner" },
      ),
    ).toThrow("card_spec_unknown_action_capacity_flatline_action_loss_shape");
  });
});
