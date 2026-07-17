import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import { visibleCardDefinition } from "../card-definition-lookup";
import { rolesMatch } from "../role-match";
import { semanticRuntimeCorpCentralPressureAssessment } from "../semantic-runtime-corp-central-pressure";
import { corpKnownAgendaInventory } from "../corp-known-agenda-inventory";
import { semanticRuntimeCorpBoardTriage } from "../semantic-runtime-corp-board-triage";
import { type SemanticRuntimeCorpScoreDependencies } from "./semantic-runtime-corp-score-contracts";
import {
  corpHqAgendaCount,
  corpPreparedScoreRemotePipeline,
} from "./semantic-runtime-corp-score-facts";
import {
  corpVisibleAdvancementRequirement,
  corpVisibleCardIsAgenda,
  corpBurstEconomyOperationForAction,
  positiveOrZeroNumber,
} from "./semantic-runtime-corp-score-action-economy";
import { corpVisibleUnrezzedRezCost } from "./semantic-runtime-corp-score-facts";

type CorpActiveRemoteScorelineState = {
  serverId: string;
  cardId: string;
  reserveFloor: number;
  agendaPointsAtRisk: number;
  advancesRemaining: number;
  unrezzedRemoteRezCost: number;
  evidence: string[];
};

export function corpActiveRemoteScorelineState(
  input: AiDecisionInput,
): CorpActiveRemoteScorelineState | undefined {
  return input.playerView.servers
    .filter((server) => server.id.startsWith("remote_"))
    .flatMap((server) =>
      server.root
        .filter((card) => card.known !== false && corpVisibleCardIsAgenda(card))
        .map((card) => {
          const requirement = corpVisibleAdvancementRequirement(card);
          const counters = positiveOrZeroNumber(card.advancementCounters) ?? 0;
          const advancesRemaining =
            requirement === undefined ? 0 : Math.max(0, requirement - counters);
          const unrezzedRemoteRezCost = corpVisibleUnrezzedRezCost(server.ice);
          const reserveFloor = Math.min(
            8,
            Math.max(2, advancesRemaining + unrezzedRemoteRezCost),
          );
          const agendaPointsAtRisk = corpVisibleAgendaPoints(card);
          return {
            serverId: server.id,
            cardId: card.instanceId,
            reserveFloor,
            agendaPointsAtRisk,
            advancesRemaining,
            unrezzedRemoteRezCost,
            evidence: [
              `active_scoreline_server:${server.id}`,
              `active_scoreline_card:${card.instanceId}`,
              `active_scoreline_requirement:${requirement ?? "unknown"}`,
              `active_scoreline_counters:${counters}`,
              `active_scoreline_reserve_floor:${reserveFloor}`,
            ],
          };
        }),
    )
    .sort(
      (left, right) =>
        right.agendaPointsAtRisk - left.agendaPointsAtRisk ||
        right.reserveFloor - left.reserveFloor ||
        left.serverId.localeCompare(right.serverId),
    )[0];
}

export function corpPreparedScoreRemoteAgendaSearchComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
): AiDecisionScoreComponent | undefined {
  if (corpKnownAgendaInventory(input)?.remainingStealableAgendaPoints === 0) {
    return undefined;
  }
  if (corpActiveRemoteScorelineState(input)) return undefined;
  const pipeline = corpPreparedScoreRemotePipeline(input);
  if (!pipeline) return undefined;
  if (corpHqAgendaCount(input) > 0) return undefined;
  const rdCount =
    positiveOrZeroNumber(input.playerView.own.stackOrRdCount) ?? 0;
  if (rdCount <= 0) return undefined;
  if (
    (boardTriageState.primary === "protect_hq" ||
      boardTriageState.primary === "protect_rd") &&
    boardTriageState.severity === "critical"
  ) {
    return undefined;
  }
  const credits = input.playerView.own.credits;
  if (credits < pipeline.reserveFloor) return undefined;
  const roles = dependencies.rolesForAction(input, action);
  const burstEconomy = corpBurstEconomyOperationForAction(
    input,
    action,
    dependencies,
    actionSemanticCandidate,
  );
  const drawsCards =
    action.type === "draw_card" || (burstEconomy?.drawCards ?? 0) > 0;
  const isEconomy =
    action.type === "gain_credit" ||
    Boolean(burstEconomy) ||
    rolesMatch(roles, ["economy"]);
  const evidence = [
    "prepared_score_remote_agenda_search:true",
    `server:${pipeline.serverId}`,
    `ice_count:${pipeline.iceCount}`,
    `credits:${credits}`,
    `reserve_floor:${pipeline.reserveFloor}`,
    `unrezzed_remote_rez_cost:${pipeline.unrezzedRezCost}`,
    `rd_count:${rdCount}`,
    `triage_primary:${boardTriageState.primary}`,
    `triage_severity:${boardTriageState.severity}`,
  ];
  if (drawsCards) {
    const hqPressure = semanticRuntimeCorpCentralPressureAssessment(
      input,
      "hq",
    );
    const pointsToWin = input.playerView.agendaPointsToWin ?? 7;
    const runnerAtMatchPoint =
      input.playerView.opponent.agendaPoints >= pointsToWin - 1;
    if (
      runnerAtMatchPoint &&
      (hqPressure.active ||
        hqPressure.visibleMultiaccess ||
        hqPressure.eventMultiaccess ||
        hqPressure.successfulAccessEvents > 0)
    ) {
      return {
        key: "corp_matchpoint_hq_draw_exposure",
        label: "Matchpoint-HQ-Exposure",
        value: -2600,
        reason: [
          ...evidence,
          "runner_at_match_point:true",
          ...hqPressure.evidence,
        ].join("|"),
      };
    }
    return {
      key: "corp_prepared_score_remote_agenda_search",
      label: "Agenda-Suche fuer vorbereitetes Remote",
      value: action.type === "draw_card" ? 2200 : 1300,
      reason: [...evidence, `action:${action.type}`, "draws_cards:true"].join(
        "|",
      ),
    };
  }
  if (isEconomy) {
    return {
      key: "corp_prepared_score_remote_credit_loop_penalty",
      label: "Credit-Loop trotz vorbereitetem Remote",
      value: -1300,
      reason: [...evidence, `action:${action.type}`, "draws_cards:false"].join(
        "|",
      ),
    };
  }
  return undefined;
}

export function corpVisibleAgendaPoints(card: VisibleCard): number {
  const definition = visibleCardDefinition(card);
  return (
    positiveOrZeroNumber(card.agendaPoints) ??
    positiveOrZeroNumber(definition?.agendaPoints) ??
    0
  );
}

export function corpServerIceCount(
  input: AiDecisionInput,
  serverId: string,
): number {
  return (
    input.playerView.servers.find((server) => server.id === serverId)?.ice
      .length ?? 0
  );
}
