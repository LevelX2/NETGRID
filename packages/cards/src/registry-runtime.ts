import {
  GENERATED_CARD_SPECS,
  GENERATED_CARD_SPEC_SOURCE_REFS,
  GENERATED_SET_SPECS,
} from "./generated/card-spec-import-index";
import { createCardRegistry } from "./registry";

/** Production singleton. The generated index is the only import/discovery root. */
export const CARD_REGISTRY = createCardRegistry({
  cardSpecs: GENERATED_CARD_SPECS,
  setSpecs: GENERATED_SET_SPECS,
});

/** Bound source evidence; consumers never import the generated discovery root. */
export const CARD_SPEC_SOURCE_REFS = GENERATED_CARD_SPEC_SOURCE_REFS;
