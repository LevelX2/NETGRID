export type CorpRemoteContestabilityAssessment = {
  serverId: string;
  contestable: boolean;
  evidence: string[];
};

export type CorpCentralRezReserveAssessment = {
  serverId: "hq";
  sourceDefinitionId: string;
  rezFloor: number;
  creditsAfterAction: number;
  blockedByFloor: boolean;
  evidence: string[];
};

export type CorpTaggedRunnerPayoffActionProfile = {
  kind:
    | "damage"
    | "economic"
    | "resource_trash"
    | "hardware_trash"
    | "tag_source"
    | "installed_economy"
    | "funding"
    | "unknown";
  value: number;
  evidence: string[];
};
