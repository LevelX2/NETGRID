import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: Omnitech Spinal Tap Cybermodem
// text: Provides +1 MU. Put [2] from the bank on Omnitech Spinal Tap Cybermodem when it is installed. Use these bits only for using icebreakers during runs or increasing your link. At the start of each runner turn roll a die. On a 1, suffer 2 brain damage. This damage cannot be prevented. If it leaves play suffer 2 brain damage. Only one deck...
export const classicOmnitechSpinalTapCybermodemImplementation: CardImplementationDefinition =
  {
    cardDefinitionId:
      "onr_classic_048_omnitech-spinal-tap-cybermodem",
    hardwareDeck: true,
    modifiers: [
      {
        kind: "memory_units",
        operation: "increase",
        amount: 1,
        activeWhile: "installed",
        sourceZone: "runner_installed",
        side: "runner",
        visibility: "public",
      },
    ],
    lifecycle: {
      on_install: [addHostedCredits(2)],
      on_leave_play: [
        {
          kind: "damage",
          recipient: "runner",
          damageType: "core",
          amount: 2,
          preventable: true,
          visibility: "public",
        },
      ],
    },
    restrictedHostedCreditSource: restrictedHostedCreditSource({
      capacity: 2,
      usableFor: ["using_icebreaker_during_run", "increase_link"],
    }),
    runnerUtilityLongtail: {
      kind: "start_turn_random_effect_table",
      dieFaces: 6,
      randomPurpose: "runner_start_turn_source",
      outcomes: [
        {
          roll: 1,
          kind: "unpreventable_damage",
          damageType: "core",
          amount: 2,
        },
      ],
      defaultOutcome: { kind: "no_effect" },
      visibility: "public",
    },
  };
