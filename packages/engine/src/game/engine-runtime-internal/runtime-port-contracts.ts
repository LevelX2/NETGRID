/**
 * Statically derives every composition port from its concrete factory. A
 * factory signature change therefore reaches all migrated consumers without a
 * string lookup or a duplicate hand-written function contract.
 */
export type RuntimePortGroups = {
  actionRuntimeHosts: ReturnType<
    (typeof import("./action-runtime-hosts"))["createActionRuntimeHosts"]
  >;
  cardRuntimeHosts: ReturnType<
    (typeof import("./card-runtime-hosts"))["createCardRuntimeHosts"]
  >;
  cardRuntimeResolvers: ReturnType<
    (typeof import("./card-runtime-resolvers"))["createCardRuntimeResolvers"]
  >;
  choiceHiddenZoneResolvers: ReturnType<
    (typeof import("./choice-hidden-zone-resolvers"))["createChoiceHiddenZoneResolvers"]
  >;
  choiceHiddenZoneRuntime: ReturnType<
    (typeof import("./choice-hidden-zone-runtime"))["createChoiceHiddenZoneRuntime"]
  >;
  corpRuntimeResolvers: ReturnType<
    (typeof import("./corp-runtime-resolvers"))["createCorpRuntimeResolvers"]
  >;
  flowRuntimeHosts: ReturnType<
    (typeof import("./flow-runtime-hosts"))["createFlowRuntimeHosts"]
  >;
  lifecycleRuntime: ReturnType<
    (typeof import("./lifecycle-runtime"))["createLifecycleRuntime"]
  >;
  stateCorpRuntimeResolvers: ReturnType<
    (typeof import("./state-corp-runtime-resolvers"))["createStateCorpRuntimeResolvers"]
  >;
  stateRuntimeResolvers: ReturnType<
    (typeof import("./state-runtime-resolvers"))["createStateRuntimeResolvers"]
  >;
  stateRuntimeServices: import("./state-runtime-services").StateRuntimeServices;
  turnCorpRuntime: ReturnType<
    (typeof import("./turn-corp-runtime"))["createTurnCorpRuntime"]
  >;
  turnRuntimeResolvers: ReturnType<
    (typeof import("./turn-runtime-resolvers"))["createTurnRuntimeResolvers"]
  >;
};

export type RuntimePortSet = Partial<RuntimePortGroups>;

export type StateRuntimePortGroups = {
  stateRuntimeServices: import("./state-runtime-services").StateRuntimeServices;
};

export type StateRuntimePortFunction<
  Name extends keyof StateRuntimePortGroups["stateRuntimeServices"],
> = StateRuntimePortGroups["stateRuntimeServices"][Name] extends (
  ...args: infer Arguments
) => infer Result
  ? (...args: Arguments) => Result
  : never;

export type RuntimePortFunction<
  Group extends keyof RuntimePortGroups,
  Name extends keyof RuntimePortGroups[Group],
> = RuntimePortGroups[Group][Name] extends (
  ...args: infer Arguments
) => infer Result
  ? (...args: Arguments) => Result
  : never;

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
