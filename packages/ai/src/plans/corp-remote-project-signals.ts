import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import type { AiDecisionInputWithDeckCapabilities } from "../runtime/ai-decision-input";
import type { CorpRemoteMaturityAssessment } from "../runtime/corp-remote-maturity-assessment";
import type {
  RemoteDoctrineProfile,
  RemoteProtectionTarget,
  RemotePurpose,
} from "../remote-doctrine-profile";
import { isCorpOpeningTurnSerial } from "../runtime/corp-opening-rush";
import { planInstanceIdForProposal } from "./plan-instance";
import type { ResidentPlanPortfolio } from "./resident-plan-portfolio";

export const STRATEGIC_SCORE_REMOTE_PROJECT_ID =
  "strategic-score-remote" as const;

export type CorpRemoteProjectNeed = Readonly<{
  needId: string;
  parentProjectId: typeof STRATEGIC_SCORE_REMOTE_PROJECT_ID;
  targetServerId: string;
  observedAtStateVersion: number;
  capability: "improve_remote_protection_path" | "credits";
  minimum: number;
}>;

export type CorpRemoteProjectSignal = Readonly<{
  projectId: typeof STRATEGIC_SCORE_REMOTE_PROJECT_ID;
  purpose: "scoring_remote";
  purposes: readonly RemotePurpose[];
  target: Readonly<{
    status: "unbound" | "bound";
    serverId: string;
    targetBindingRevision: number;
  }>;
  serverId: string;
  protectionTarget: RemoteProtectionTarget;
  buildTiming: RemoteDoctrineProfile["buildTiming"];
  targetRecoveryTurns: number;
  phase:
    | "harden_to_protection_target"
    | "fund_rez_path"
    | "payload_ready"
    | "leased_to_score_project"
    | "assessment_unknown";
  maturity: CorpRemoteMaturityAssessment;
  need?: CorpRemoteProjectNeed;
  cadence: Readonly<{
    turnKey: string;
    maximumActions: number;
    actionsUsed: number;
    open: boolean;
  }>;
  feasible: boolean;
  value: number;
  evidenceCode: string;
}>;

export type CorpRemoteOccupancyClaim = Readonly<{
  serverId: string;
  owner: "score" | "economy" | "ambush";
  ownerId: string;
}>;

export function buildCorpScoringRemoteProjectSignals(
  params: Readonly<{
    input: AiDecisionInput;
    previous?: ResidentPlanPortfolio;
    remoteDoctrine?: RemoteDoctrineProfile;
    scoreProjects: readonly Readonly<{
      projectId: string;
      serverId?: string;
      agendaInstanceId?: string;
      protectionNeed?: unknown;
      feasible?: boolean;
    }>[];
    remoteOccupancyClaims?: readonly CorpRemoteOccupancyClaim[];
    maturityByServerId: ReadonlyMap<string, CorpRemoteMaturityAssessment>;
  }>,
): CorpRemoteProjectSignal[] {
  const doctrine =
    params.remoteDoctrine ??
    (params.input as AiDecisionInputWithDeckCapabilities)
      .ownRemoteDoctrineProfile;
  if (
    !remoteDoctrineAllowsResidentScoreRemote(doctrine, params.scoreProjects)
  ) {
    return [];
  }
  if (isCorpOpeningTurnSerial(params.input.playerView.turnSerial)) return [];
  const concreteScoreProjects = params.scoreProjects.filter(
    (project) => project.feasible === true,
  );
  const previousSignal = previousRemoteSignal(params.previous);
  const claims = params.remoteOccupancyClaims ?? [];
  const reboundServerId = reboundServerAfterNewRemoteIceInstall(
    params.input,
    params.previous,
  );
  const retainedServerId =
    reboundServerId ??
    (previousSignal?.target.status === "bound" &&
    targetServerStillAvailable(
      params.input,
      previousSignal.serverId,
      claims,
      concreteScoreProjects,
    )
      ? previousSignal.serverId
      : undefined);
  const scoreLeaseServerId = concreteScoreProjects
    .map((project) => project.serverId)
    .filter(
      (serverId): serverId is string =>
        serverId !== undefined &&
        serverId !== "new_remote" &&
        params.input.playerView.servers.some(
          (server) => server.id === serverId && serverId.startsWith("remote_"),
        ),
    )
    .sort()[0];
  const targetServerId =
    retainedServerId ??
    scoreLeaseServerId ??
    preferredReusableRemote(params.input, claims, concreteScoreProjects) ??
    "new_remote";
  const targetStatus = targetServerId === "new_remote" ? "unbound" : "bound";
  const bindingChanged =
    previousSignal !== undefined &&
    (previousSignal.target.status !== targetStatus ||
      previousSignal.serverId !== targetServerId);
  const targetBindingRevision =
    (previousSignal?.target.targetBindingRevision ?? 0) +
    (bindingChanged ? 1 : 0);
  const maturity =
    params.maturityByServerId.get(targetServerId) ??
    ({
      knowledge: "unknown",
      observedAtStateVersion: params.input.playerView.stateVersion,
      unknownReasons: ["target_path_quote_missing"],
    } as const);
  const leased = concreteScoreProjects.some(
    (project) =>
      targetServerId !== "new_remote" &&
      project.serverId === targetServerId &&
      (project.agendaInstanceId !== undefined ||
        project.protectionNeed !== undefined),
  );
  const phase = leased
    ? "leased_to_score_project"
    : maturity.knowledge === "unknown"
      ? "assessment_unknown"
      : maturity.fundedTargetReached
        ? "payload_ready"
        : maturity.stagedTargetReached
          ? "fund_rez_path"
          : "harden_to_protection_target";
  const cadence = remoteCadence(
    params.input,
    params.previous,
    previousSignal,
    doctrine!.investmentBudget.backgroundActionsPerTurn,
  );
  const need = remoteNeed({
    phase,
    serverId: targetServerId,
    targetBindingRevision,
    observedAtStateVersion: params.input.playerView.stateVersion,
    maturity,
  });
  const feasible = need !== undefined && cadence.open;
  return [
    {
      projectId: STRATEGIC_SCORE_REMOTE_PROJECT_ID,
      purpose: "scoring_remote",
      purposes: [...doctrine!.purposes],
      target: {
        status: targetStatus,
        serverId: targetServerId,
        targetBindingRevision,
      },
      serverId: targetServerId,
      protectionTarget: doctrine!.protectionTarget,
      buildTiming: doctrine!.buildTiming,
      targetRecoveryTurns: doctrine!.investmentBudget.targetRecoveryTurns,
      phase,
      maturity,
      ...(need ? { need } : {}),
      cadence,
      feasible,
      value: remoteOptionsValue(doctrine!, phase, targetServerId),
      evidenceCode:
        phase === "harden_to_protection_target"
          ? `remote_protection_below_target:${targetServerId}`
          : phase === "fund_rez_path"
            ? `remote_staged_path_requires_funding:${targetServerId}:${need?.minimum ?? 0}`
            : phase === "payload_ready"
              ? `remote_payload_ready:${targetServerId}`
              : phase === "leased_to_score_project"
                ? `remote_leased_to_score_project:${targetServerId}`
                : `remote_protection_assessment_unknown:${targetServerId}`,
    },
  ];
}

export function remoteDoctrineAllowsResidentScoreRemote(
  doctrine: RemoteDoctrineProfile | undefined,
  scoreProjects: readonly Readonly<{
    protectionNeed?: unknown;
    feasible?: boolean;
  }>[] = [],
): boolean {
  if (
    doctrine?.source.plannerEffect !== "plan_portfolio" ||
    doctrine.dependency === "none" ||
    doctrine.protectionTarget === "none" ||
    doctrine.investmentBudget.backgroundActionsPerTurn <= 0 ||
    !doctrine.purposes.some(
      (purpose) => purpose === "scoreline" || purpose === "mixed",
    )
  ) {
    return false;
  }
  if (doctrine.buildTiming === "prebuild") return true;
  const concreteScoreProject = scoreProjects.some(
    (project) => project.feasible === true,
  );
  if (doctrine.buildTiming === "payload_first") return concreteScoreProject;
  return scoreProjects.some(
    (project) =>
      project.feasible === true && project.protectionNeed !== undefined,
  );
}

function remoteNeed(
  params: Readonly<{
    phase: CorpRemoteProjectSignal["phase"];
    serverId: string;
    targetBindingRevision: number;
    observedAtStateVersion: number;
    maturity: CorpRemoteMaturityAssessment;
  }>,
): CorpRemoteProjectNeed | undefined {
  const prefix = `remote-hardening:${STRATEGIC_SCORE_REMOTE_PROJECT_ID}:${params.targetBindingRevision}`;
  if (params.phase === "harden_to_protection_target") {
    return {
      needId: prefix,
      parentProjectId: STRATEGIC_SCORE_REMOTE_PROJECT_ID,
      targetServerId: params.serverId,
      observedAtStateVersion: params.observedAtStateVersion,
      capability: "improve_remote_protection_path",
      minimum: 1,
    };
  }
  if (
    params.phase === "fund_rez_path" &&
    params.maturity.knowledge === "known"
  ) {
    const minimum = params.maturity.minimumRezFundingGap ?? 0;
    if (minimum <= 0) return undefined;
    return {
      needId: `${prefix}:funding`,
      parentProjectId: STRATEGIC_SCORE_REMOTE_PROJECT_ID,
      targetServerId: params.serverId,
      observedAtStateVersion: params.observedAtStateVersion,
      capability: "credits",
      minimum,
    };
  }
  return undefined;
}

function preferredReusableRemote(
  input: AiDecisionInput,
  claims: readonly CorpRemoteOccupancyClaim[],
  scoreProjects: readonly Readonly<{ serverId?: string }>[],
): string | undefined {
  const claimed = new Set(claims.map((claim) => claim.serverId));
  const scoreTargets = new Set(
    scoreProjects.flatMap((project) =>
      project.serverId && project.serverId !== "new_remote"
        ? [project.serverId]
        : [],
    ),
  );
  return input.playerView.servers
    .filter(
      (server) =>
        server.id.startsWith("remote_") &&
        remoteHasEngineCertifiedVisibleAgendaTarget(input, server.id) &&
        !claimed.has(server.id) &&
        !scoreTargets.has(server.id),
    )
    .sort(
      (left, right) =>
        right.ice.length - left.ice.length || left.id.localeCompare(right.id),
    )[0]?.id;
}

function targetServerStillAvailable(
  input: AiDecisionInput,
  serverId: string,
  claims: readonly CorpRemoteOccupancyClaim[],
  scoreProjects: readonly Readonly<{ serverId?: string }>[],
): boolean {
  const server = input.playerView.servers.find(
    (entry) => entry.id === serverId,
  );
  if (!server) return false;
  if (scoreProjects.some((project) => project.serverId === serverId))
    return true;
  const visibleAgendaIds = visibleAgendaInstanceIds(input);
  if (visibleAgendaIds.length === 0) {
    return (
      server.root.length === 0 &&
      !claims.some((claim) => claim.serverId === serverId)
    );
  }
  if (
    !remoteHasEngineCertifiedVisibleAgendaTarget(input, serverId)
  ) {
    return false;
  }
  return !claims.some((claim) => claim.serverId === serverId);
}

function remoteHasEngineCertifiedVisibleAgendaTarget(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const agendaIds = new Set(visibleAgendaInstanceIds(input));
  if (agendaIds.size === 0) return false;
  return input.legalActions.some(
    (action) =>
      action.side === "corp" &&
      action.type === "install_card" &&
      action.expiresAtStateVersion === input.playerView.stateVersion &&
      typeof action.source === "string" &&
      agendaIds.has(action.source) &&
      action.payload?.placement === "root" &&
      action.payload.serverId === serverId,
  );
}

function visibleAgendaInstanceIds(input: AiDecisionInput): string[] {
  return input.playerView.own.gripOrHq.flatMap((card) =>
    card.known && card.type === "agenda" ? [card.instanceId] : [],
  );
}

function reboundServerAfterNewRemoteIceInstall(
  input: AiDecisionInput,
  previous: ResidentPlanPortfolio | undefined,
): string | undefined {
  const origin = previous?.selectedActionOrigin;
  if (!origin || origin.selectedAtStateVersion !== previous?.stateVersion) {
    return undefined;
  }
  const provider = previous.instances.find(
    (instance) => instance.instanceId === origin.executorInstanceId,
  );
  if (
    provider?.parentInstanceId !==
    planInstanceIdForProposal({
      moduleId: "corp.establish_scoring_remote",
      dedupeKey: STRATEGIC_SCORE_REMOTE_PROJECT_ID,
    })
  ) {
    return undefined;
  }
  const state = provider.moduleState as {
    kind?: unknown;
    signals?: Array<{
      actionIds?: string[];
      actionId?: string;
      serverId?: string;
      sourceCardInstanceId?: string;
      parentKind?: string;
    }>;
  };
  const signal = state.signals?.find(
    (entry) =>
      (entry.actionIds?.includes(origin.selectedActionId) ||
        entry.actionId === origin.selectedActionId) &&
      entry.serverId === "new_remote" &&
      entry.parentKind === "remote",
  );
  if (!signal?.sourceCardInstanceId) return undefined;
  return input.playerView.servers.find(
    (server) =>
      server.id.startsWith("remote_") &&
      server.ice.some(
        (ice: VisibleCard) => ice.instanceId === signal.sourceCardInstanceId,
      ),
  )?.id;
}

function remoteCadence(
  input: AiDecisionInput,
  previous: ResidentPlanPortfolio | undefined,
  previousSignal: CorpRemoteProjectSignal | undefined,
  maximumActions: number,
): CorpRemoteProjectSignal["cadence"] {
  const turnKey = `corp:${input.playerView.turnSerial ?? input.actionNumber}`;
  let actionsUsed =
    previousSignal?.cadence.turnKey === turnKey
      ? previousSignal.cadence.actionsUsed
      : 0;
  const origin = previous?.selectedActionOrigin;
  const provider = origin
    ? previous?.instances.find(
        (instance) => instance.instanceId === origin.executorInstanceId,
      )
    : undefined;
  if (
    origin?.selectedAtStateVersion === previous?.stateVersion &&
    provider?.parentInstanceId ===
      planInstanceIdForProposal({
        moduleId: "corp.establish_scoring_remote",
        dedupeKey: STRATEGIC_SCORE_REMOTE_PROJECT_ID,
      })
  ) {
    actionsUsed += 1;
  }
  return {
    turnKey,
    maximumActions,
    actionsUsed,
    open: actionsUsed < maximumActions,
  };
}

function previousRemoteSignal(
  previous: ResidentPlanPortfolio | undefined,
): CorpRemoteProjectSignal | undefined {
  const instance = previous?.instances.find(
    (entry) =>
      entry.moduleId === "corp.establish_scoring_remote" &&
      entry.dedupeKey === STRATEGIC_SCORE_REMOTE_PROJECT_ID,
  );
  const state = instance?.moduleState as
    | { kind?: unknown; signal?: CorpRemoteProjectSignal }
    | undefined;
  return state?.kind === "remote" ? state.signal : undefined;
}

function remoteOptionsValue(
  doctrine: RemoteDoctrineProfile,
  phase: CorpRemoteProjectSignal["phase"],
  serverId: string,
): number {
  const dependencyValue =
    doctrine.dependency === "primary"
      ? 16
      : doctrine.dependency === "supporting"
        ? 10
        : 5;
  const reuseValue = serverId === "new_remote" ? 2 : 8;
  const phaseValue =
    phase === "payload_ready"
      ? 6
      : phase === "leased_to_score_project"
        ? 0
        : phase === "assessment_unknown"
          ? 0
          : 4;
  return dependencyValue + reuseValue + phaseValue;
}
