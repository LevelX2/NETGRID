export type AccessLoopObservation = {
  turn: number;
  actionId: string;
  serverId: string;
  accessPayoff:
    | "agenda"
    | "trash_affordable"
    | "trash_unaffordable"
    | "known_low_value"
    | "unknown"
    | "no_payoff";
  outcome: "payoff" | "no_payoff" | "declined";
  evidence?: readonly string[];
};

export type AccessLoopDetection = {
  kind: "access_loop_detection";
  productiveUseAllowed: false;
  runtimeConsumerStatus: "none";
  repeatedNoPayoffAccessLoop: boolean;
  serverId?: string;
  repeatedCount: number;
  actionIds: string[];
  evidence: string[];
};

export function detectRepeatedNoPayoffAccessLoop(params: {
  observations: readonly AccessLoopObservation[];
  minimumRepeats?: number;
}): AccessLoopDetection {
  const minimumRepeats = params.minimumRepeats ?? 3;
  const grouped = groupNoPayoffObservations(params.observations);
  const loop = [...grouped.entries()]
    .map(([serverId, observations]) => ({ serverId, observations }))
    .filter((entry) => entry.observations.length >= minimumRepeats)
    .sort(
      (left, right) =>
        right.observations.length - left.observations.length ||
        left.serverId.localeCompare(right.serverId),
    )[0];
  if (!loop) {
    return {
      kind: "access_loop_detection",
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
      repeatedNoPayoffAccessLoop: false,
      repeatedCount: 0,
      actionIds: [],
      evidence: [
        "access_loop_detection:report_only",
        "access_loop_detection_repeated_no_payoff:false",
        `access_loop_detection_minimum_repeats:${minimumRepeats}`,
      ],
    };
  }
  return {
    kind: "access_loop_detection",
    productiveUseAllowed: false,
    runtimeConsumerStatus: "none",
    repeatedNoPayoffAccessLoop: true,
    serverId: loop.serverId,
    repeatedCount: loop.observations.length,
    actionIds: loop.observations.map((observation) => observation.actionId),
    evidence: [
      "access_loop_detection:report_only",
      "access_loop_detection_repeated_no_payoff:true",
      `access_loop_detection_server:${loop.serverId}`,
      `access_loop_detection_repeated_count:${loop.observations.length}`,
      `access_loop_detection_minimum_repeats:${minimumRepeats}`,
      ...loop.observations.flatMap((observation) => [
        `access_loop_detection_action:${observation.actionId}`,
        `access_loop_detection_turn:${observation.turn}`,
        `access_loop_detection_payoff:${observation.accessPayoff}`,
        `access_loop_detection_outcome:${observation.outcome}`,
        ...(observation.evidence ?? []),
      ]),
    ],
  };
}

function groupNoPayoffObservations(
  observations: readonly AccessLoopObservation[],
): Map<string, AccessLoopObservation[]> {
  const grouped = new Map<string, AccessLoopObservation[]>();
  for (const observation of observations) {
    if (!isNoPayoffObservation(observation)) continue;
    grouped.set(observation.serverId, [
      ...(grouped.get(observation.serverId) ?? []),
      observation,
    ]);
  }
  return grouped;
}

function isNoPayoffObservation(
  observation: AccessLoopObservation,
): boolean {
  return (
    observation.outcome !== "payoff" &&
    (observation.accessPayoff === "known_low_value" ||
      observation.accessPayoff === "trash_unaffordable" ||
      observation.accessPayoff === "no_payoff")
  );
}
