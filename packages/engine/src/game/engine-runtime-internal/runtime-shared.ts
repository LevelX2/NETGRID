import type {
  CardDefinition,
  ChoiceRequest,
  CounterType,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
  ResolvedGameEffect,
  Side,
} from "@netgrid/shared";
import type { DamageSummary } from "../damage/damage-core";
import type { CorpZoneChoiceHandlerHost } from "../hidden-zone/corp-zone-choice-handlers";
import type { HiddenZoneArrangeChoiceHandlerHost } from "../hidden-zone/arrange-choice-handlers";
import type { HiddenZoneNonSearchChoiceHandlerHost } from "../hidden-zone/nonsearch-choice-handlers";
import type {
  HiddenZoneSearchActivationHandlerHost,
  HiddenZoneSearchChoiceHandlerHost,
} from "../hidden-zone/search-choice-handlers";
import type { PendingChoiceResolutionHost } from "../choices/pending-choice-resolution";
import type { CardRunnerEventLongtailImplementation } from "../../ability-engine/definition-types";

type RuntimeFunction = (...args: any[]) => any;

// This is the first named slice of the staged RuntimeDeps surface. Keep adding
// domain-specific keys here as bootstrap files lose their broad any bindings.
export type CardRuntimeDeps = {
  cardImplementationRuntimeDeps?: unknown;
  executeEffectCommands?: RuntimeFunction;
  hiddenZoneArrangeChoiceHandlerHost?: RuntimeFunction;
  hiddenZoneNonSearchChoiceHandlerHost?: RuntimeFunction;
  hiddenZoneSearchActivationHandlerHost?: RuntimeFunction;
  hiddenZoneSearchChoiceHandlerHost?: RuntimeFunction;
  pendingChoiceResolutionHost?: RuntimeFunction;
};

export type RuntimeDeps = CardRuntimeDeps & Record<string, unknown>;
export type {
  GameState,
  LegalAction,
  PlayerAction,
  ChoiceRequest,
  Side,
  CardDefinition,
};
export type CardDefinitionId = string;
export type CardInstanceId = string;
export type { CorpServer, CounterType, DamageSummary, ResolvedGameEffect };
export type ServerId = "hq" | "rd" | "archives" | "new_remote" | (string & {});
export type {
  PendingChoiceResolutionHost,
  HiddenZoneSearchActivationHandlerHost,
  HiddenZoneSearchChoiceHandlerHost,
  HiddenZoneArrangeChoiceHandlerHost,
  HiddenZoneNonSearchChoiceHandlerHost,
  CorpZoneChoiceHandlerHost,
  CardRunnerEventLongtailImplementation,
};

export function runtimeBinding<T extends RuntimeFunction = RuntimeFunction>(
  runtime: Record<string, unknown>,
  property: string | symbol,
): T {
  const key = property as string;
  const value = runtime[key];
  if (value !== undefined && typeof value !== "function") return value as T;
  return ((...args: unknown[]) =>
    (runtime[key] as RuntimeFunction)(...args)) as T;
}

export function runtimeProxy<T extends object>(
  runtime: Record<string, unknown>,
): T {
  return new Proxy(
    {},
    { get: (_target, property) => runtimeBinding(runtime, property) },
  ) as T;
}
