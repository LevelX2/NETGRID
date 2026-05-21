import type { CardImplementationDefinition } from "../../../types";

// card name: Edgerunner, Inc., Temps
// text: Gain three consecutive actions, which you may use only to install cards. You are not required to take all three of these actions.
export const edgerunnerIncTempsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_289_edgerunner-inc-temps",
  corpUtility: {
    kind: "gain_restricted_install_actions",
    amount: 3,
    mayStopEarly: true,
    visibility: "public",
  },
};
