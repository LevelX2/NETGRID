import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

type RunnerStartRunServer = AiDecisionInput["playerView"]["servers"][number];

export type RunnerStartRunScoreDependencies = {
  serverId: (action: LegalAction) => string | undefined;
  doctrineRunWeight: (
    input: AiDecisionInput,
    action: LegalAction,
    serverId: string | undefined,
  ) => AiDecisionScoreComponent | undefined;
  hqMemoryComponents: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent[];
  rndMemoryComponents: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent[];
  archivesComponents: (
    input: AiDecisionInput,
    action: LegalAction,
    server: RunnerStartRunServer | undefined,
  ) => AiDecisionScoreComponent[];
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  remoteComponents: (
    input: AiDecisionInput,
    action: LegalAction,
    server: RunnerStartRunServer | undefined,
  ) => AiDecisionScoreComponent[];
  knownIcePathComponents: (
    input: AiDecisionInput,
    action: LegalAction,
    server: RunnerStartRunServer | undefined,
  ) => AiDecisionScoreComponent[];
  repeatedRunTargetComponents: (
    input: AiDecisionInput,
    serverId: string | undefined,
  ) => AiDecisionScoreComponent[];
};

export function runnerStartRunScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerStartRunScoreDependencies,
): AiDecisionScoreComponent[] {
  if (action.type !== "start_run") return [];
  const components: AiDecisionScoreComponent[] = [];
  const serverId = dependencies.serverId(action);
  const doctrineWeight = dependencies.doctrineRunWeight(
    input,
    action,
    serverId,
  );
  if (doctrineWeight) components.push(doctrineWeight);
  const server = input.playerView.servers.find(
    (entry) => entry.id === serverId,
  );
  if (serverId === "hq") {
    components.push({
      key: "runner_hq_pressure",
      label: "HQ-Druck",
      value: 480,
      reason: "central:hq",
    });
    components.push(...dependencies.hqMemoryComponents(input, action));
  } else if (serverId === "rd") {
    components.push({
      key: "runner_rnd_pressure",
      label: "R&D-Druck",
      value: 640,
      reason: "central:rd",
    });
    components.push(...dependencies.rndMemoryComponents(input, action));
  } else if (serverId === "archives") {
    components.push({
      key: "runner_archives_pressure",
      label: "Archive-Druck",
      value: 250,
      reason: "central:archives",
    });
    components.push(...dependencies.archivesComponents(input, action, server));
  }
  if (dependencies.isRemoteServerTarget(serverId)) {
    components.push(...dependencies.remoteComponents(input, action, server));
  }
  components.push(...dependencies.knownIcePathComponents(input, action, server));
  if ((server?.ice.length ?? 0) === 0) {
    components.push({
      key: "runner_free_server_path",
      label: "Freier Server",
      value: 350,
      reason: serverId ?? "unknown",
    });
  }
  components.push(...dependencies.repeatedRunTargetComponents(input, serverId));
  return components;
}
