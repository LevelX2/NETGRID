import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
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
    dependencies
      .rolesForCardId(card.definitionId)
      .some((role) => role.includes("multiaccess")),
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
      dependencies
        .rolesForAction(input, action)
        .some((role) => role.startsWith("breaker_"))
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
            role === "draw" || role === "setup" || role.includes("search"),
        )) ||
    action.type === "resolve_choice"
  )
    return "setup_search";
  if (action.type === "end_turn") return "end_turn";
  return undefined;
}
