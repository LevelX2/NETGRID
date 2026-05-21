import type { CardImplementationDefinition } from "../../../types";

// card name: Trojan Horse
// text: Play only if Runner stole any agendas during his or her last turn. Give Runner a tag.
export const trojanHorseImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_306_trojan-horse",
  corpUtility: {
    kind: "trojan_horse_tag",
    visibility: "public",
  },
};
