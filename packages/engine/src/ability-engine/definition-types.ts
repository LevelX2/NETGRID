import type { EventVisibilityClass } from "@netgrid/shared";

export type CardModifierImplementation = CardRezCostModifierImplementation;

export type CardAbilityImplementation = OnPlayCardAbilityImplementation;

export type OnPlayCardAbilityImplementation = {
  kind: "on_play";
  costs: "printed";
  effects: CardEffectImplementation[];
};

export type CardEffectImplementation =
  | GainCreditsEffectImplementation
  | DrawCardsEffectImplementation;

export type GainCreditsEffectImplementation = {
  kind: "gain_credits";
  recipient: "controller" | "runner" | "corp";
  amount: number;
  visibility: EventVisibilityClass;
};

export type DrawCardsEffectImplementation = {
  kind: "draw_cards";
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
