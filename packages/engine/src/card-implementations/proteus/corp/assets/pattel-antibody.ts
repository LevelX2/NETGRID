import type { CardImplementationDefinition } from "../../../types";

// card name: Pattel Antibody
// text: When Runner accesses Pattel Antibody, you may pay [3] to put a Pattel counter on all installed icebreakers, even if Pattel Antibody is not installed. Ignore this effect if Runner accesses Pattel Antibody from the Archives. Each Pattel counter on an icebreaker reduces its strength by 1. If Pattel Antibody is accessed from R&D, Runner must show it to you.
export const pattelAntibodyImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_068_pattel-antibody",
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed", "hq", "rd", "archives"],
      ignoreIfAccessedFrom: ["archives"],
      revealIfAccessedFrom: ["rd"],
      cost: { kind: "corp_may_pay_credits", amount: 3 },
      visibility: "hidden_info_barrier",
      effects: [
        {
          kind: "add_counter_to_all_installed_runner_icebreakers",
          counterType: "pattel_antibody",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
