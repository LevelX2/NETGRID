type RuntimeDelegateGroup = object;

type RuntimeDelegateGroups = {
  actionRuntimeHosts: RuntimeDelegateGroup;
  cardRuntimeHosts: RuntimeDelegateGroup;
  cardRuntimeResolvers: RuntimeDelegateGroup;
  choiceHiddenZoneResolvers: RuntimeDelegateGroup;
  choiceHiddenZoneRuntime: RuntimeDelegateGroup;
  corpRuntimeResolvers: RuntimeDelegateGroup;
  flowRuntimeHosts: RuntimeDelegateGroup;
  lifecycleRuntime: RuntimeDelegateGroup;
  stateCorpRuntimeResolvers: RuntimeDelegateGroup;
  stateRuntimeResolvers: RuntimeDelegateGroup;
  stateRuntimeServices: RuntimeDelegateGroup;
  turnCorpRuntime: RuntimeDelegateGroup;
  turnRuntimeResolvers: RuntimeDelegateGroup;
};

export const runtimeDelegates = {} as RuntimeDelegateGroups;

export function runtimeDelegate(
  groupName: keyof RuntimeDelegateGroups,
  delegateName: string,
): Function {
  const delegate = Object.getOwnPropertyDescriptor(
    runtimeDelegates[groupName],
    delegateName,
  )?.value;
  if (typeof delegate !== "function") {
    throw new Error(
      `Runtime delegate fehlt: ${String(groupName)}.${delegateName}`,
    );
  }
  return delegate as Function;
}
