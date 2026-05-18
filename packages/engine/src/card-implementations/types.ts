import type {
  CardDefinitionId,
  EventVisibilityClass,
} from "@netgrid/shared";

export type CardImplementationDefinition = {
  cardDefinitionId: CardDefinitionId;
  modifiers?: CardModifierImplementation[];
  abilities?: CardAbilityImplementation[];
};

export type CardModifierImplementation = CardRezCostModifierImplementation;

export type CardAbilityImplementation = OnPlayCardAbilityImplementation;

export type OnPlayCardAbilityImplementation = {
  kind: "on_play";
  costs: "printed";
  effects: CardEffectImplementation[];
};

export type CardEffectImplementation = GainCreditsEffectImplementation;

export type GainCreditsEffectImplementation = {
  kind: "gain_credits";
  recipient: "controller" | "runner" | "corp";
  amount: number;
  visibility: EventVisibilityClass;
};

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
