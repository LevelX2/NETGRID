import type { CardImplementationDefinition } from "../../../types";

// card name: Netwatch Credit Voucher
// text: Play only if Runner is tagged. Give Runner a tag, and gain [1].
export const netwatchCreditVoucherImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_293_netwatch-credit-voucher",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: { kind: "runner_is_tagged" },
      effects: [
        {
          kind: "add_tags",
          recipient: "runner",
          amount: 1,
          visibility: "public",
        },
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
