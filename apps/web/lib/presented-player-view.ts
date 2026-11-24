import {
  choiceOptionPresentationForEngineKey,
  choiceOptionServerForEngineKey,
  type LegalAction as EngineLegalAction,
  type OfferedChoiceOption,
  type OfferedChoiceRequest,
  type OfferedLegalAction,
  type PlayerView as EnginePlayerView,
  type VisibleChoiceOption as EngineChoiceOption,
  type VisibleChoiceRequest as EngineChoiceRequest,
} from "@netgrid/shared";

// The live match uses offers. Tutorial and replay views are read directly
// from the Engine, so the shared rendering components can display both.
export type LegalAction = EngineLegalAction | OfferedLegalAction;
export type VisibleChoiceOption = EngineChoiceOption | OfferedChoiceOption;
export type VisibleChoiceRequest = Omit<
  EngineChoiceRequest | OfferedChoiceRequest,
  "options"
> & {
  options: VisibleChoiceOption[];
};
export type PlayerView = Omit<
  EnginePlayerView,
  "pendingChoice" | "legalActions"
> & {
  pendingChoice?: VisibleChoiceRequest;
  legalActions: LegalAction[];
};
export type SelectionId = string | number;

export function optionPresentation(option: VisibleChoiceOption) {
  return typeof option.id === "string"
    ? choiceOptionPresentationForEngineKey(option.id)
    : (option as OfferedChoiceOption).presentation;
}

export function optionServer(option: VisibleChoiceOption) {
  return typeof option.id === "string"
    ? choiceOptionServerForEngineKey(option.id)
    : (option as OfferedChoiceOption).serverId;
}

export function optionBidAmount(option: VisibleChoiceOption) {
  if (optionPresentation(option) !== "bid") return undefined;
  if (typeof option.value === "number") return option.value;
  // Tutorial fixtures can be literal Engine options carrying only bid_N.
  return typeof option.id === "string" ? Number(option.id.slice(4)) : undefined;
}
