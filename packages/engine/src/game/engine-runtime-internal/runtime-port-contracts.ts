/**
 * Statically derives every composition port from its concrete factory. A
 * factory signature change therefore reaches all migrated consumers without a
 * string lookup or a duplicate hand-written function contract.
 */
export type RuntimePortGroups = {
  actionRuntimeHosts: import("./action-runtime-port").ActionRuntimePort;
  cardRuntimeHosts: import("./card-runtime-host-port").CardRuntimeHostPort;
  cardRuntimeResolvers: import("./card-runtime-resolver-port").CardRuntimeResolverPort;
  choiceHiddenZoneResolvers: ReturnType<
    (typeof import("./choice-hidden-zone-resolvers"))["createChoiceHiddenZoneResolvers"]
  >;
  choiceHiddenZoneRuntime: ReturnType<
    (typeof import("./choice-hidden-zone-runtime"))["createChoiceHiddenZoneRuntime"]
  >;
  corpRuntimeResolvers: import("./corp-runtime-port").CorpRuntimePort;
  flowRuntimeHosts: ReturnType<
    (typeof import("./flow-runtime-hosts"))["createFlowRuntimeHosts"]
  >;
  lifecycleRuntime: import("./lifecycle-runtime-port").LifecycleRuntimePort;
  stateCorpRuntimeResolvers: import("./state-corp-runtime-port").StateCorpRuntimePort;
  stateRuntimeResolvers: ReturnType<
    (typeof import("./state-runtime-resolvers"))["createStateRuntimeResolvers"]
  >;
  stateRuntimeServices: import("./state-runtime-services").StateRuntimeServices;
  turnCorpRuntime: import("./turn-corp-runtime-port").TurnCorpRuntimePort;
  turnRuntimeResolvers: import("./turn-runtime-port").TurnRuntimePort;
};

export type RuntimePortSet = Partial<RuntimePortGroups>;

export type StateRuntimePortGroups = {
  lifecycleRuntime: import("./lifecycle-runtime-port").LifecycleRuntimePort;
  stateCorpRuntimeResolvers: import("./state-corp-runtime-port").StateCorpRuntimePort;
  stateRuntimeServices: import("./state-runtime-services").StateRuntimeServices;
};

export type StateClusterRuntimePortFunction<
  Group extends keyof StateRuntimePortGroups,
  Name extends keyof StateRuntimePortGroups[Group],
> = StateRuntimePortGroups[Group][Name] extends (
  ...args: infer Arguments
) => infer Result
  ? (...args: Arguments) => Result
  : never;

export type ActionRuntimePortGroups = Pick<
  RuntimePortGroups,
  "actionRuntimeHosts" | "corpRuntimeResolvers" | "turnRuntimeResolvers"
>;

export type ActionRuntimePortFunction<
  Group extends keyof ActionRuntimePortGroups,
  Name extends keyof ActionRuntimePortGroups[Group],
> = ActionRuntimePortGroups[Group][Name] extends (
  ...args: infer Arguments
) => infer Result
  ? (...args: Arguments) => Result
  : never;

export type CardRuntimePortGroups = Pick<
  RuntimePortGroups,
  "cardRuntimeHosts" | "cardRuntimeResolvers"
>;

export type CardRuntimePortFunction<
  Group extends keyof CardRuntimePortGroups,
  Name extends keyof CardRuntimePortGroups[Group],
> = CardRuntimePortGroups[Group][Name] extends (
  ...args: infer Arguments
) => infer Result
  ? (...args: Arguments) => Result
  : never;

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
