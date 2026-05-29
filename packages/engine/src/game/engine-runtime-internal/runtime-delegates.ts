import { createChoiceHiddenZoneRuntime } from "./choice-hidden-zone-runtime";
import { createLifecycleRuntime } from "./lifecycle-runtime";
import { createTurnCorpRuntime } from "./turn-corp-runtime";
import { createActionRuntimeHosts } from "./action-runtime-hosts";
import { createCardRuntimeHosts } from "./card-runtime-hosts";
import { createFlowRuntimeHosts } from "./flow-runtime-hosts";
import { createStateRuntimeServices } from "./state-runtime-services";
import { createCardRuntimeResolvers } from "./card-runtime-resolvers";
import { createChoiceHiddenZoneResolvers } from "./choice-hidden-zone-resolvers";
import { createCorpRuntimeResolvers } from "./corp-runtime-resolvers";
import { createStateRuntimeResolvers } from "./state-runtime-resolvers";
import { createTurnRuntimeResolvers } from "./turn-runtime-resolvers";
import { createStateCorpRuntimeResolvers } from "./state-corp-runtime-resolvers";
import type { RuntimeDeps } from "./runtime-shared";
import { runtimeDelegates } from "./runtime-delegate-store";

export function initializeRuntimeDelegates(
  runtimeDomainDeps: RuntimeDeps,
): void {
  runtimeDelegates.turnCorpRuntime = createTurnCorpRuntime(runtimeDomainDeps);
  (runtimeDomainDeps as Record<string, unknown>).turnCorpRuntime =
    runtimeDelegates.turnCorpRuntime;
  runtimeDelegates.stateCorpRuntimeResolvers =
    createStateCorpRuntimeResolvers(runtimeDomainDeps);
  runtimeDelegates.cardRuntimeResolvers =
    createCardRuntimeResolvers(runtimeDomainDeps);
  runtimeDelegates.choiceHiddenZoneResolvers =
    createChoiceHiddenZoneResolvers(runtimeDomainDeps);
  runtimeDelegates.corpRuntimeResolvers =
    createCorpRuntimeResolvers(runtimeDomainDeps);
  runtimeDelegates.stateRuntimeResolvers =
    createStateRuntimeResolvers(runtimeDomainDeps);
  runtimeDelegates.turnRuntimeResolvers =
    createTurnRuntimeResolvers(runtimeDomainDeps);
  runtimeDelegates.stateRuntimeServices =
    createStateRuntimeServices(runtimeDomainDeps);
  runtimeDelegates.cardRuntimeHosts = createCardRuntimeHosts(runtimeDomainDeps);
  runtimeDelegates.flowRuntimeHosts = createFlowRuntimeHosts(runtimeDomainDeps);
  runtimeDelegates.actionRuntimeHosts =
    createActionRuntimeHosts(runtimeDomainDeps);
  runtimeDelegates.lifecycleRuntime = createLifecycleRuntime(runtimeDomainDeps);
  runtimeDelegates.choiceHiddenZoneRuntime =
    createChoiceHiddenZoneRuntime(runtimeDomainDeps);
}

export * from "./card-runtime-delegates";
export * from "./flow-runtime-delegates";
export * from "./choice-runtime-delegates";
export * from "./state-runtime-delegates";
export * from "./action-runtime-delegates";
