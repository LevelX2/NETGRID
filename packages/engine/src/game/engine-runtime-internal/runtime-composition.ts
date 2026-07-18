import { createActionRuntimeHosts } from "./action-runtime-hosts";
import { createCardRuntimeHosts } from "./card-runtime-hosts";
import { createCardRuntimeResolvers } from "./card-runtime-resolvers";
import { createChoiceHiddenZoneResolvers } from "./choice-hidden-zone-resolvers";
import { createChoiceHiddenZoneRuntime } from "./choice-hidden-zone-runtime";
import { createCorpRuntimeResolvers } from "./corp-runtime-resolvers";
import { createFlowRuntimeHosts } from "./flow-runtime-hosts";
import { createLifecycleRuntime } from "./lifecycle-runtime";
import { installRuntimePortBindings } from "./runtime-port-bindings";
import type { RuntimePortGroups } from "./runtime-port-contracts";
import type { RuntimeDeps } from "./runtime-shared";
import { createStateCorpRuntimeResolvers } from "./state-corp-runtime-resolvers";
import { createStateRuntimeResolvers } from "./state-runtime-resolvers";
import { createStateRuntimeServices } from "./state-runtime-services";
import { createTurnCorpRuntime } from "./turn-corp-runtime";
import { createTurnRuntimeResolvers } from "./turn-runtime-resolvers";

/**
 * Builds the domain graph in dependency order and installs its live bindings
 * once the complete graph exists. Factories may capture `runtimeDomainDeps`,
 * but public engine calls happen only after this function returns.
 */
export function initializeRuntimeComposition(
  runtimeDomainDeps: RuntimeDeps,
): void {
  const ports = {} as RuntimePortGroups;
  ports.turnCorpRuntime = createTurnCorpRuntime(runtimeDomainDeps);
  Object.assign(runtimeDomainDeps, {
    turnCorpRuntime: ports.turnCorpRuntime,
  });
  ports.stateCorpRuntimeResolvers =
    createStateCorpRuntimeResolvers(runtimeDomainDeps);
  ports.cardRuntimeResolvers = createCardRuntimeResolvers(runtimeDomainDeps);
  ports.choiceHiddenZoneResolvers =
    createChoiceHiddenZoneResolvers(runtimeDomainDeps);
  ports.corpRuntimeResolvers = createCorpRuntimeResolvers(runtimeDomainDeps);
  ports.stateRuntimeResolvers = createStateRuntimeResolvers(runtimeDomainDeps);
  ports.turnRuntimeResolvers = createTurnRuntimeResolvers(runtimeDomainDeps);
  ports.stateRuntimeServices = createStateRuntimeServices(runtimeDomainDeps);
  ports.cardRuntimeHosts = createCardRuntimeHosts(runtimeDomainDeps);
  ports.flowRuntimeHosts = createFlowRuntimeHosts(runtimeDomainDeps);
  ports.actionRuntimeHosts = createActionRuntimeHosts(runtimeDomainDeps);
  ports.lifecycleRuntime = createLifecycleRuntime(runtimeDomainDeps);
  ports.choiceHiddenZoneRuntime =
    createChoiceHiddenZoneRuntime(runtimeDomainDeps);
  Object.assign(
    runtimeDomainDeps,
    ports.turnCorpRuntime,
    ports.stateCorpRuntimeResolvers,
    ports.cardRuntimeResolvers,
    ports.choiceHiddenZoneResolvers,
    ports.corpRuntimeResolvers,
    ports.stateRuntimeResolvers,
    ports.turnRuntimeResolvers,
    ports.stateRuntimeServices,
    ports.cardRuntimeHosts,
    ports.flowRuntimeHosts,
    ports.actionRuntimeHosts,
    ports.lifecycleRuntime,
    ports.choiceHiddenZoneRuntime,
  );
  installRuntimePortBindings(ports);
}
