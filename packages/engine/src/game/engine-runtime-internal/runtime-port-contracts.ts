import type { createChoiceHiddenZoneRuntime } from "./choice-hidden-zone-runtime";
import type { createLifecycleRuntime } from "./lifecycle-runtime";
import type { createTurnCorpRuntime } from "./turn-corp-runtime";
import type { createActionRuntimeHosts } from "./action-runtime-hosts";
import type { createCardRuntimeHosts } from "./card-runtime-hosts";
import type { createFlowRuntimeHosts } from "./flow-runtime-hosts";
import type { createStateRuntimeServices } from "./state-runtime-services";
import type { createCardRuntimeResolvers } from "./card-runtime-resolvers";
import type { createChoiceHiddenZoneResolvers } from "./choice-hidden-zone-resolvers";
import type { createCorpRuntimeResolvers } from "./corp-runtime-resolvers";
import type { createStateRuntimeResolvers } from "./state-runtime-resolvers";
import type { createTurnRuntimeResolvers } from "./turn-runtime-resolvers";
import type { createStateCorpRuntimeResolvers } from "./state-corp-runtime-resolvers";

/**
 * Statically derives every composition port from its concrete factory. A
 * factory signature change therefore reaches all migrated consumers without a
 * string lookup or a duplicate hand-written function contract.
 */
export type RuntimePortGroups = {
  actionRuntimeHosts: ReturnType<typeof createActionRuntimeHosts>;
  cardRuntimeHosts: ReturnType<typeof createCardRuntimeHosts>;
  cardRuntimeResolvers: ReturnType<typeof createCardRuntimeResolvers>;
  choiceHiddenZoneResolvers: ReturnType<typeof createChoiceHiddenZoneResolvers>;
  choiceHiddenZoneRuntime: ReturnType<typeof createChoiceHiddenZoneRuntime>;
  corpRuntimeResolvers: ReturnType<typeof createCorpRuntimeResolvers>;
  flowRuntimeHosts: ReturnType<typeof createFlowRuntimeHosts>;
  lifecycleRuntime: ReturnType<typeof createLifecycleRuntime>;
  stateCorpRuntimeResolvers: ReturnType<typeof createStateCorpRuntimeResolvers>;
  stateRuntimeResolvers: ReturnType<typeof createStateRuntimeResolvers>;
  stateRuntimeServices: ReturnType<typeof createStateRuntimeServices>;
  turnCorpRuntime: ReturnType<typeof createTurnCorpRuntime>;
  turnRuntimeResolvers: ReturnType<typeof createTurnRuntimeResolvers>;
};

export type RuntimePortSet = Partial<RuntimePortGroups>;

/**
 * Typed installation boundary for the staged delegate migration. Missing
 * groups fail explicitly, and a registry cannot silently change composition
 * after installation.
 */
export class RuntimePortRegistry<Ports extends RuntimePortSet> {
  private ports?: Readonly<Ports>;

  install(ports: Ports): void {
    if (this.ports) throw new Error("Runtime ports are already installed.");
    this.ports = ports;
  }

  require<Name extends keyof Ports>(name: Name): NonNullable<Ports[Name]> {
    const port = this.ports?.[name];
    if (port === undefined)
      throw new Error(`Runtime port group is not installed: ${String(name)}`);
    return port as NonNullable<Ports[Name]>;
  }
}

export function defineRuntimePortSet<const Ports extends RuntimePortSet>(
  ports: Ports,
): Ports {
  return ports;
}
