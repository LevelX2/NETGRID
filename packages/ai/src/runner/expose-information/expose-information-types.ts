export type RunnerExposeInformationSignal = {
  kind: "run_window" | "proactive";
  informationId: string;
  rootPlanInstanceId?: string;
  parentPlanInstanceId?: string;
  serverId?: string;
  runId?: string;
  sourceCardInstanceId: string;
  sourceDefinitionId?: string;
  targetIceInstanceId?: string;
  targetPositionKeys?: string[];
  phase:
    | "expose_unknown_ice"
    | "decline_known_ice"
    | "play_information_event"
    | "install_information_tool"
    | "defer_known_information";
  selectedActionId: string;
  actionIds?: string[];
  rejectedActionIds: string[];
  admissible: boolean;
  evidenceCodes: string[];
};

export type ExposeInformationState = {
  kind: "expose_information";
  signal: RunnerExposeInformationSignal;
};

export type RunnerExposeInformationMemoryRecord = Readonly<{
  targetIceInstanceId: string;
  serverId: string;
  sourceCardInstanceId: string;
  selectedAtStateVersion: number;
}>;
