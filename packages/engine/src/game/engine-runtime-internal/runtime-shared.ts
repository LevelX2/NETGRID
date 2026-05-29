export type RuntimeDeps = Record<string, any>;
export type GameState = any;
export type LegalAction = any;
export type PlayerAction = any;
export type ChoiceRequest = any;
export type Side = any;
export type CardDefinition = any;
export type CardDefinitionId = string;
export type CardInstanceId = string;
export type CorpServer = any;
export type CounterType = any;
export type DamageSummary = any;
export type ResolvedGameEffect = any;
export type ServerId = "hq" | "rd" | "archives" | "new_remote" | (string & {});
export type PendingChoiceResolutionHost = any;
export type HiddenZoneSearchActivationHandlerHost = any;
export type HiddenZoneSearchChoiceHandlerHost = any;
export type HiddenZoneArrangeChoiceHandlerHost = any;
export type HiddenZoneNonSearchChoiceHandlerHost = any;
export type CorpZoneChoiceHandlerHost = any;
export type CardRunnerEventLongtailImplementation = any;

export function runtimeBinding(
  runtime: Record<string, any>,
  property: string | symbol,
): any {
  const key = property as string;
  const value = runtime[key];
  if (value !== undefined && typeof value !== "function") return value;
  return (...args: any[]) => runtime[key](...args);
}
