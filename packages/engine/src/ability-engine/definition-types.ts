import type { CardType, EventVisibilityClass, Side } from "@netgrid/shared";

export type CardModifierImplementation =
  | CardRezCostModifierImplementation
  | CardInstallCostModifierImplementation;

export type CardAbilityImplementation =
  | OnPlayCardAbilityImplementation
  | ActivatedCardAbilityImplementation;

export type OnPlayCardAbilityImplementation = {
  kind: "on_play";
  costs: "printed";
  effects: CardEffectImplementation[];
};

export type ActivatedCardAbilityImplementation = {
  kind: "activated";
  timing: "runner_main" | "corp_main";
  costs: readonly CardAbilityCostImplementation[];
  effects: readonly CardEffectImplementation[];
  label?: string;
};

export type CardAbilityCostImplementation = {
  kind: "action";
  amount: number;
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

export type CardInstallCostModifierImplementation = {
  kind: "install_cost";
  operation: "reduce";
  amount: number;
  activeWhile: "rezzed";
  sourceZone: "corp_root";
  visibility: EventVisibilityClass;
  appliesTo: {
    side: Extract<Side, "corp">;
    cardType: Extract<CardType, "ice">;
  };
};
