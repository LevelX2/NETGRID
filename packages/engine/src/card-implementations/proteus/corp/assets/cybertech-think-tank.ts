import type { CardImplementationDefinition } from "../../../types";

// card name: Cybertech Think Tank
// text: You may advance Cybertech Think Tank before and after you rez it. Cybertech Think Tank advancement counter: Increase by 1 the meat damage dealt by another source.
export const proteusCybertechThinkTankImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_055_cybertech-think-tank",
  advanceable: {
    while: "installed_before_and_after_rez",
  },
  corpUtility: {
    kind: "meat_damage_boost",
    cost: { kind: "advancement_counter", amount: 1 },
    amount: 1,
    timing: "successful_meat_damage",
    visibility: "public",
  },
};
