import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { rolesMatch } from "../runtime/role-match";
import type { KnownRezzedIcePathAssessment } from "../visible-run-analysis";
import {
  centralPressureTargetsForCard,
  isCentralPressureCardForMetrics,
} from "./central-pressure-card";
import { isRemoteServerTarget } from "../runtime/server-target";

type CentralServerTarget = "hq" | "rd" | "archives";

export type TrueCentralCloseoutProfile = {
  opportunity: boolean;
  reasons: string[];
};

export type BestTrueCentralCloseoutProfile = TrueCentralCloseoutProfile & {
  target?: CentralServerTarget;
};

export type RunnerNoFreshCentralContext = {
  targets: CentralServerTarget[];
  betterAlternatives: string[];
  allowedReasons: string[];
};

export type NoFreshCentralSubstitutionType =
  | "economy"
  | "rig_unlock"
  | "remote_contest"
  | "pressure_install"
  | "setup_search"
  | "end_turn";

type NoFreshCentralDependencies = {
  isRunnerEconomyAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
};

type TrueCentralCloseoutDependencies = {
  assessKnownRezzedIcePath: (
    iceCards: AiDecisionInput["playerView"]["servers"][number]["ice"],
    rigCards: NonNullable<AiDecisionInput["playerView"]["own"]["rig"]>,
    runnerCredits: number,
    rootCards: AiDecisionInput["playerView"]["servers"][number]["root"],
  ) => KnownRezzedIcePathAssessment;
  rolesForCardId: (definitionId: string | undefined) => string[];
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
};

type RunnerNoFreshCentralContextDependencies =
  TrueCentralCloseoutDependencies & {
    centralRunStreakWithoutValueForMetrics: (
      input: AiDecisionInput,
      target: CentralServerTarget,
    ) => number;
    isRunnerEconomyAction: (
      input: AiDecisionInput,
      action: LegalAction,
    ) => boolean;
    rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
    runnerCreditReserveTargetForInput: (input: AiDecisionInput) => number;
    runnerRemoteThreatProfile: (
      input: AiDecisionInput,
      serverId: string,
    ) => { contestable: boolean };
  };

export function createTrueCentralCloseoutProfileContext(
  dependencies: TrueCentralCloseoutDependencies,
): {
  bestTrueCentralCloseoutProfile: (
    input: AiDecisionInput,
  ) => BestTrueCentralCloseoutProfile;
  trueCentralCloseoutProfile: (
    input: AiDecisionInput,
    target: CentralServerTarget,
  ) => TrueCentralCloseoutProfile;
} {
  return {
    bestTrueCentralCloseoutProfile: (input) =>
      bestTrueCentralCloseoutProfile(input, dependencies),
    trueCentralCloseoutProfile: (input, target) =>
      trueCentralCloseoutProfile(input, target, dependencies),
  };
}

export function bestTrueCentralCloseoutProfile(
  input: AiDecisionInput,
  dependencies: TrueCentralCloseoutDependencies,
): BestTrueCentralCloseoutProfile {
  const profiles = (["rd", "hq", "archives"] as const)
    .map((target) => ({
      target,
      ...trueCentralCloseoutProfile(input, target, dependencies),
    }))
    .filter((profile) => profile.opportunity)
    .sort(
      (left, right) =>
        right.reasons.length - left.reasons.length ||
        left.target.localeCompare(right.target),
    );
  return profiles[0] ?? { opportunity: false, reasons: [] };
}

export function trueCentralCloseoutProfile(
  input: AiDecisionInput,
  target: CentralServerTarget,
  dependencies: TrueCentralCloseoutDependencies,
): TrueCentralCloseoutProfile {
  const pointsNeeded =
    input.playerView.agendaPointsToWin - input.playerView.own.agendaPoints;
  if (pointsNeeded > 2) return { opportunity: false, reasons: [] };
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === target,
  );
  if (!server) return { opportunity: false, reasons: [] };
  const assessment = dependencies.assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
    server.root,
  );
  if (assessment.blocked) return { opportunity: false, reasons: [] };
  const visibleBreakCost = assessment.visibleBreakCost ?? 0;
  const openOrCheap = visibleBreakCost <= 1 || server.ice.length === 0;
  if (!openOrCheap) return { opportunity: false, reasons: [] };
  if (target === "archives") {
    const visibleAgenda = server.root.some(
      (card) => card.known && card.type === "agenda",
    );
    return {
      opportunity: visibleAgenda,
      reasons: visibleAgenda ? ["archives_visible_agenda"] : [],
    };
  }
  const installedTargets = new Set(
    (input.playerView.own.rig ?? [])
      .filter((card) =>
        isCentralPressureCardForMetrics(card.definitionId, true),
      )
      .flatMap((card) => centralPressureTargetsForCard(card.definitionId)),
  );
  const matchingInterface = installedTargets.has(target);
  const anyMultiaccess = (input.playerView.own.rig ?? []).some((card) =>
    rolesMatch(dependencies.rolesForCardId(card.definitionId), ["multiaccess"]),
  );
  const hasRunEvent = input.legalActions.some((action) => {
    if (action.side !== "runner" || action.type !== "play_event") return false;
    return centralPressureTargetsForCard(
      dependencies.sourceDefinitionIdForAction(input, action),
    ).includes(target);
  });
  const hqPressure =
    target === "hq" && input.playerView.opponent.handCount >= 5;
  const rndFreshness = false;
  const reasons = [
    "near_win",
    ...(matchingInterface ? ["interface"] : []),
    ...(anyMultiaccess ? ["multiaccess"] : []),
    ...(hasRunEvent ? ["run_event"] : []),
    ...(hqPressure ? ["hq_pressure"] : []),
    ...(rndFreshness ? ["rnd_freshness"] : []),
  ];
  const hasSpecificPressure =
    matchingInterface ||
    anyMultiaccess ||
    hasRunEvent ||
    hqPressure ||
    rndFreshness;
  return {
    opportunity: hasSpecificPressure,
    reasons,
  };
}

export function runnerNoFreshCentralContext(
  input: AiDecisionInput,
  dependencies: RunnerNoFreshCentralContextDependencies,
): RunnerNoFreshCentralContext {
  const targets = (["rd", "hq", "archives"] as const).filter((target) => {
    const hasRun = input.legalActions.some(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === target,
    );
    if (!hasRun) return false;
    const closeout = trueCentralCloseoutProfile(
      input,
      target,
      dependencies,
    ).opportunity;
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === target,
    );
    const matchingInterface = (input.playerView.own.rig ?? []).some((card) =>
      centralPressureTargetsForCard(card.definitionId).includes(target),
    );
    const anyMultiaccess = (input.playerView.own.rig ?? []).some((card) =>
      rolesMatch(dependencies.rolesForCardId(card.definitionId), [
        "multiaccess",
      ]),
    );
    return (
      dependencies.centralRunStreakWithoutValueForMetrics(input, target) > 0 &&
      !matchingInterface &&
      !anyMultiaccess &&
      !closeout &&
      !centralRunEventGoodForTarget(
        input,
        target,
        dependencies.sourceDefinitionIdForAction,
      ) &&
      server !== undefined
    );
  });
  if (targets.length === 0)
    return { targets: [], betterAlternatives: [], allowedReasons: [] };

  const better = new Set<string>();
  const reserveTarget = dependencies.runnerCreditReserveTargetForInput(input);
  if (
    input.playerView.own.credits <= reserveTarget &&
    input.legalActions.some((action) =>
      dependencies.isRunnerEconomyAction(input, action),
    )
  )
    better.add("economy");
  if (
    input.legalActions.some(
      (action) =>
        action.type === "start_run" &&
        typeof action.payload?.serverId === "string" &&
        isRemoteServerTarget(action.payload.serverId) &&
        dependencies.runnerRemoteThreatProfile(input, action.payload.serverId)
          .contestable,
    )
  )
    better.add("remote_contest");
  if (
    input.legalActions.some(
      (action) =>
        action.type === "install_card" &&
        rolesMatch(dependencies.rolesForAction(input, action), ["breaker_"]),
    )
  )
    better.add("rig_unlock");
  if (
    input.legalActions.some((action) => {
      if (action.type !== "install_card") return false;
      const definitionId = dependencies.sourceDefinitionIdForAction(
        input,
        action,
      );
      return isCentralPressureCardForMetrics(definitionId, true);
    })
  )
    better.add("pressure_install");
  if (
    input.legalActions.some((action) => {
      if (
        action.type === "draw_card" &&
        input.playerView.own.gripOrHq.length <= 2
      )
        return true;
      if (action.type !== "play_event" && action.type !== "resolve_choice")
        return false;
      return dependencies.rolesForAction(input, action).some(
        (role) =>
          role === "draw" ||
          role === "setup" ||
          rolesMatch([role], ["search", "tutor"]),
      );
    })
  )
    better.add("setup_search");

  const allowed = new Set<string>();
  for (const target of targets) {
    const profile = trueCentralCloseoutProfile(input, target, dependencies);
    if (profile.opportunity) allowed.add("closeout");
    const installed = input.playerView.own.rig ?? [];
    if (
      installed.some((card) =>
        centralPressureTargetsForCard(card.definitionId).includes(target),
      )
    )
      allowed.add("interface");
    if (
      installed.some((card) =>
        rolesMatch(dependencies.rolesForCardId(card.definitionId), [
          "multiaccess",
        ]),
      )
    )
      allowed.add("multiaccess");
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === target,
    );
    const assessment = dependencies.assessKnownRezzedIcePath(
      server?.ice ?? [],
      input.playerView.own.rig ?? [],
      input.playerView.own.credits,
      server?.root ?? [],
    );
    if (
      !assessment.blocked &&
      ((assessment.visibleBreakCost ?? 0) <= 0 ||
        (server?.ice.length ?? 0) === 0)
    )
      allowed.add("central_open");
  }
  const remoteContestable = input.legalActions.some(
    (action) =>
      action.type === "start_run" &&
      typeof action.payload?.serverId === "string" &&
      isRemoteServerTarget(action.payload.serverId) &&
      dependencies.runnerRemoteThreatProfile(input, action.payload.serverId)
        .contestable,
  );
  if (!remoteContestable) allowed.add("remote_uncontestable");
  if (better.size === 0) allowed.add("no_better_action");
  return {
    targets,
    betterAlternatives: [...better].sort(),
    allowedReasons: [...allowed].sort(),
  };
}

export function createRunnerNoFreshCentralContext(
  dependencies: RunnerNoFreshCentralContextDependencies,
): (input: AiDecisionInput) => RunnerNoFreshCentralContext {
  return (input) => runnerNoFreshCentralContext(input, dependencies);
}

export function centralRunEventGoodForTarget(
  input: AiDecisionInput,
  target: "hq" | "rd" | "archives",
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined,
): boolean {
  return input.legalActions.some((action) => {
    if (action.side !== "runner" || action.type !== "play_event") return false;
    return centralPressureTargetsForCard(
      sourceDefinitionIdForAction(input, action),
    ).includes(target);
  });
}

export function createCentralRunEventGoodForTarget(dependencies: {
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
}): (input: AiDecisionInput, target: CentralServerTarget) => boolean {
  return (input, target) =>
    centralRunEventGoodForTarget(
      input,
      target,
      dependencies.sourceDefinitionIdForAction,
    );
}

export function noFreshCentralSubstitutionTypeForAction(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: NoFreshCentralDependencies,
): NoFreshCentralSubstitutionType | undefined {
  if (dependencies.isRunnerEconomyAction(input, action)) return "economy";
  if (
    action.type === "start_run" &&
    typeof action.payload?.serverId === "string" &&
    isRemoteServerTarget(action.payload.serverId)
  )
    return "remote_contest";
  if (action.type === "install_card") {
    const definitionId = dependencies.sourceDefinitionIdForAction(
      input,
      action,
    );
    if (isCentralPressureCardForMetrics(definitionId, true))
      return "pressure_install";
    if (
      rolesMatch(dependencies.rolesForAction(input, action), ["breaker_"])
    )
      return "rig_unlock";
  }
  if (
    action.type === "draw_card" ||
    (action.type === "play_event" &&
      dependencies
        .rolesForAction(input, action)
        .some(
          (role) =>
            role === "draw" ||
            role === "setup" ||
            rolesMatch([role], ["search"]),
        )) ||
    action.type === "resolve_choice"
  )
    return "setup_search";
  if (action.type === "end_turn") return "end_turn";
  return undefined;
}

export function createNoFreshCentralSubstitutionTypeForAction(
  dependencies: NoFreshCentralDependencies,
): (
  input: AiDecisionInput,
  action: LegalAction,
) => NoFreshCentralSubstitutionType | undefined {
  return (input, action) =>
    noFreshCentralSubstitutionTypeForAction(input, action, dependencies);
}
