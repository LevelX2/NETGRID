import type { CardImplementationDefinition } from "../../../types";

// card name: Homing Missile
// text: *Trace X-If trace is successful, end the run, and Runner cannot make another run until Runner takes an action to pay [2]. Pay X, above the rez cost, when you rez Homing Missile. X is Homing Missile's strength and trace limit, and X cannot be greater than 8.
export const proteusHomingMissileImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_025_homing-missile",
  variableRez: {
    kind: "x_strength",
    additionalCostPerValue: 1,
    minValue: 0,
    maxValue: 8,
    traceBaseFromValue: true,
    traceBidLimitFromValue: true,
    visibility: "public",
  },
};
