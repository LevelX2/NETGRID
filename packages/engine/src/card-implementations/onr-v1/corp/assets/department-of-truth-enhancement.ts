import type { CardImplementationDefinition } from "../../../types";
import {
  hostedCreditAddAbility,
  hostedCreditTakeAbility,
} from "../../../helpers";

// card name: Department of Truth Enhancement
// text: A: Put [3] from the bank on Department of Truth Enhancement. A: Take all the bits from Department of Truth Enhancement.
export const departmentOfTruthEnhancementImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_v1_318_department-of-truth-enhancement",
    abilities: [
      hostedCreditAddAbility({
        timing: "corp_main",
        amount: 3,
        label: "Department of Truth Enhancement: 3 Credits auf die Karte legen",
      }),
      hostedCreditTakeAbility({
        timing: "corp_main",
        mode: "all",
        label: "Department of Truth Enhancement: Credits von der Karte nehmen",
      }),
    ],
  };
