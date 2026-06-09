import type { CardImplementationDefinition } from "../../../types";

// card name: Wilson, Weeflerunner Apprentice
// text: Each of your turns, you may choose to gain an action, which you may use only to make a run. You cannot spend more than [3] during that run to pay for using icebreakers or increasing your link. Use this ability only once per turn and only during your turn. [T]: Avoid receiving a tag. [T]: Prevent any amount of meat damage.
export const wilsonWeeflerunnerApprenticeImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_v1_187_wilson-weeflerunner-apprentice",
    remainingReplacementLongtail: {
      kind: "run_action_spending_cap",
      actionGain: 1,
      spendingCap: 3,
      appliesTo: ["icebreaker_use", "increase_link"],
      visibility: "public",
    },
    tagPreventionSources: [
      {
        kind: "avoid_tag",
        amount: 1,
        cost: { kind: "trash_source" },
        priority: 130,
        visibility: "public",
      },
    ],
    damagePreventionSources: [
      {
        kind: "damage_prevention",
        damageTypes: ["meat"],
        amount: "all",
        cost: { kind: "trash_source" },
        priority: 130,
        visibility: "public",
      },
    ],
  };
