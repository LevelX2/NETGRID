/**
 * Statically derives every composition port from its concrete factory. A
 * factory signature change therefore reaches all migrated consumers without a
 * string lookup or a duplicate hand-written function contract.
 */
export type RuntimePortGroups = {
  actionRuntimeHosts: import("./action-runtime-port").ActionRuntimePort;
  cardRuntimeHosts: import("./card-runtime-host-port").CardRuntimeHostPort;
  cardRuntimeResolvers: import("./card-runtime-resolver-port").CardRuntimeResolverPort;
  choiceHiddenZoneResolvers: import("./choice-resolver-runtime-port").ChoiceResolverRuntimePort;
  choiceHiddenZoneRuntime: import("./choice-hidden-zone-runtime-port").ChoiceHiddenZoneRuntimePort;
  corpRuntimeResolvers: import("./corp-runtime-port").CorpRuntimePort;
  flowRuntimeHosts: import("./flow-runtime-port").FlowRuntimePort;
  lifecycleRuntime: import("./lifecycle-runtime-port").LifecycleRuntimePort;
  stateCorpRuntimeResolvers: import("./state-corp-runtime-port").StateCorpRuntimePort;
  stateRuntimeResolvers: import("./state-runtime-resolver-port").StateRuntimeResolverPort;
  stateRuntimeServices: import("./state-runtime-services").StateRuntimeServices;
  turnCorpRuntime: import("./turn-corp-runtime-port").TurnCorpRuntimePort;
  turnRuntimeResolvers: import("./turn-runtime-port").TurnRuntimePort;
};

export type RuntimePortSet = Partial<RuntimePortGroups>;

export type StateRuntimePortGroups = {
  lifecycleRuntime: import("./lifecycle-runtime-port").LifecycleRuntimePort;
  stateCorpRuntimeResolvers: import("./state-corp-runtime-port").StateCorpRuntimePort;
  stateRuntimeResolvers: import("./state-runtime-resolver-port").StateRuntimeResolverPort;
  stateRuntimeServices: import("./state-runtime-services").StateRuntimeServices;
};

type RuntimeFunction<Port> = Port extends (
  ...args: infer Arguments
) => infer Result
  ? (...args: Arguments) => Result
  : never;

type ClusterRuntimePortFunction<
  Ports,
  Group extends keyof Ports,
  Name extends keyof Ports[Group],
> = RuntimeFunction<Ports[Group][Name]>;

export type StateClusterRuntimePortFunction<
  Group extends keyof StateRuntimePortGroups,
  Name extends keyof StateRuntimePortGroups[Group],
> = ClusterRuntimePortFunction<StateRuntimePortGroups, Group, Name>;

export type ActionRuntimePortGroups = Pick<
  RuntimePortGroups,
  "actionRuntimeHosts" | "corpRuntimeResolvers" | "turnRuntimeResolvers"
>;

export type ActionRuntimePortFunction<
  Group extends keyof ActionRuntimePortGroups,
  Name extends keyof ActionRuntimePortGroups[Group],
> = ClusterRuntimePortFunction<ActionRuntimePortGroups, Group, Name>;

export type CardRuntimePortGroups = Pick<
  RuntimePortGroups,
  "cardRuntimeHosts" | "cardRuntimeResolvers"
>;

export type CardRuntimePortFunction<
  Group extends keyof CardRuntimePortGroups,
  Name extends keyof CardRuntimePortGroups[Group],
> = ClusterRuntimePortFunction<CardRuntimePortGroups, Group, Name>;

export type ChoiceRuntimePortGroups = Pick<
  RuntimePortGroups,
  "choiceHiddenZoneResolvers" | "choiceHiddenZoneRuntime"
>;

export type ChoiceRuntimePortFunction<
  Group extends keyof ChoiceRuntimePortGroups,
  Name extends keyof ChoiceRuntimePortGroups[Group],
> = ClusterRuntimePortFunction<ChoiceRuntimePortGroups, Group, Name>;

export type FlowRuntimePortGroups = Pick<RuntimePortGroups, "flowRuntimeHosts">;

export type FlowRuntimePortFunction<
  Name extends keyof FlowRuntimePortGroups["flowRuntimeHosts"],
> = ClusterRuntimePortFunction<FlowRuntimePortGroups, "flowRuntimeHosts", Name>;

export type StateRuntimePortFunction<
  Name extends keyof StateRuntimePortGroups["stateRuntimeServices"],
> = ClusterRuntimePortFunction<
  StateRuntimePortGroups,
  "stateRuntimeServices",
  Name
>;

export type RuntimePortFunction<
  Group extends keyof RuntimePortGroups,
  Name extends keyof RuntimePortGroups[Group],
> = ClusterRuntimePortFunction<RuntimePortGroups, Group, Name>;

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
