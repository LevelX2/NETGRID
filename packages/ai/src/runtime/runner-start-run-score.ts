import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import { createAiHintsByCard } from "../ai-hints";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export type RunnerHqSuccessWindowSetup = {
  sourceDefinitionId: string;
  minimumIceTrashCost: number;
  evidence: string[];
};

export function runnerHqSuccessWindowSetupAssessment(
  input: AiDecisionInput,
  action: LegalAction,
  serverId: string | undefined,
): RunnerHqSuccessWindowSetup | undefined {
  if (
    action.type !== "start_run" ||
    serverId !== "hq" ||
    input.playerView.run ||
    input.playerView.own.clicks < 2
  ) {
    return undefined;
  }
  const source = input.playerView.own.gripOrHq.find((card) => {
    if (!card.definitionId) return false;
    const hint = AI_HINTS_BY_CARD.get(card.definitionId);
    return (
      (hint?.conditions ?? []).some(
        (condition) => condition.kind === "requires_successful_hq_run",
      ) &&
      (hint?.effects ?? []).some(
        (effect) =>
          effect.kind === "ice_trash" &&
          "target" in effect &&
          effect.target === "rezzed_ice",
      )
    );
  });
  if (!source?.definitionId) return undefined;
  const hqServer = input.playerView.servers.find(
    (server) => server.id === "hq",
  );
  if (
    !hqServer ||
    hqServer.ice.some((ice) => !ice.known || ice.rezzed !== true)
  ) {
    return undefined;
  }
  const hqPath = assessKnownRezzedIcePath(
    hqServer.ice,
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
    hqServer.root,
    input.playerView.opponent.credits,
  );
  if (!hqPath.canReachAccess || hqPath.visibleTraceTagHazardUnavoidable) {
    return undefined;
  }
  const minimumIceTrashCost = input.playerView.servers
    .flatMap((server) => server.ice)
    .filter((ice) => ice.rezzed === true && Number.isFinite(ice.rezCost))
    .map((ice) => Math.max(0, ice.rezCost ?? 0))
    .filter((rezCost) => rezCost <= input.playerView.own.credits)
    .sort((left, right) => left - right)[0];
  if (minimumIceTrashCost === undefined) return undefined;
  const creditsAfterHqPath =
    hqPath.creditsAfterAvoidingVisibleIceHazards ?? hqPath.creditsAfterPath;
  if (creditsAfterHqPath < minimumIceTrashCost) return undefined;
  return {
    sourceDefinitionId: source.definitionId,
    minimumIceTrashCost,
    evidence: [
      `success_window_source:${source.definitionId}`,
      `visible_affordable_rezzed_ice_cost:${minimumIceTrashCost}`,
      `credits_after_hq_path:${creditsAfterHqPath}`,
      `runner_clicks:${input.playerView.own.clicks}`,
    ],
  };
}

type RunnerStartRunServer = AiDecisionInput["playerView"]["servers"][number];

export type RunnerStartRunScoreDependencies = {
  serverId: (action: LegalAction) => string | undefined;
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
  const server = input.playerView.servers.find(
    (entry) => entry.id === serverId,
  );
  if (serverId === "hq") {
    if (input.playerView.opponent.handCount <= 0) {
      components.push({
        key: "runner_hq_empty_no_access_payoff",
        label: "HQ leer",
        value: -3200,
        reason: "opponent_hand_count:0",
      });
    }
    components.push({
      key: "runner_hq_pressure",
      label: "HQ-Druck",
      value: 480,
      reason: "central:hq",
    });
    components.push(...dependencies.hqMemoryComponents(input, action));
    const successWindowSetup = runnerHqSuccessWindowSetupAssessment(
      input,
      action,
      serverId,
    );
    if (successWindowSetup) {
      components.push({
        key: "runner_hq_success_window_setup",
        label: "HQ-Erfolgsfenster vorbereiten",
        value: 1700,
        reason: successWindowSetup.evidence.join("|"),
      });
    }
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
  components.push(
    ...dependencies.knownIcePathComponents(input, action, server),
  );
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
