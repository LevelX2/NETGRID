import type { CardImplementationDefinition } from "../../../types";

// card name: Karl de Veres, Corporate Stooge
// text: Gain [1] each time you make a successful run. Only one unique card of a particular name can be in play at a time. If for some reason more than one is in play, trash all but one.
export const karlDeVeresCorporateStoogeImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_v1_166_karl-de-veres-corporate-stooge",
    unique: {
      kind: "unique_by_title",
      controller: "runner",
    },
    uniqueDirectLongtail: {
      kind: "karl_successful_run_credit",
      amount: 1,
      visibility: "public",
    },
  };
