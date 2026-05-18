import type {
  CardDefinitionId,
  EventVisibilityClass,
} from "@netgrid/shared";

export type CardImplementationDefinition = {
  cardDefinitionId: CardDefinitionId;
  modifiers?: CardModifierImplementation[];
};

export type CardModifierImplementation = CardRezCostModifierImplementation;

export type CardRezCostModifierImplementation = {
  kind: "rez_cost";
  operation: "reduce";
  amount: number;
  activeWhile: "rezzed";
  sourceZone: "corp_root";
  visibility: EventVisibilityClass;
  appliesTo: {
    cardType: "ice";
    subtype?: string;
    sameServerAsSource?: boolean;
  };
};
