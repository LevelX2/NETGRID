import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { endTheRunSubroutineCount } from "../visible-run-analysis";
import type { CorpBoardTriage } from "./semantic-runtime-corp-board-triage";
import { semanticRuntimeCorpCentralPressureAssessment } from "./semantic-runtime-corp-central-pressure";

type VisibleVirusCounterCard = {
  card: VisibleCard;
  serverId: string | undefined;
  amount: number;
};

export function corpPurgeImpactScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  boardTriage: Pick<CorpBoardTriage, "primary" | "severity">,
): AiDecisionScoreComponent | undefined {
  if (
    action.type !== "purge_virus_counters" &&
    action.type !== "purge_runner_virus_counters"
  ) {
    return undefined;
  }
  const affected = visibleVirusCounterCards(input);
  const totalCounters = affected.reduce((sum, entry) => sum + entry.amount, 0);
  const criticalIce = affected.filter(
    ({ card }) =>
      card.type === "ice" &&
      ((card.definitionId ? endTheRunSubroutineCount(card.definitionId) : 0) >
        0 ||
        visibleIceHasMaterialHazard(card)),
  );
  const pressuredCentralServers = ["hq", "rd"].filter((serverId) => {
    if (!affected.some((entry) => entry.serverId === serverId)) return false;
    return semanticRuntimeCorpCentralPressureAssessment(
      input,
      serverId as "hq" | "rd",
    ).active;
  });
  const urgentScoreline =
    boardTriage.primary === "score_now" ||
    boardTriage.primary === "force_scoreline_clock" ||
    boardTriage.primary === "protect_score_remote" ||
    boardTriage.primary === "fund_score_remote";
  const clickCost = Math.max(3, legalActionClickCost(action));

  let value = purgeCounterVolumeValue(totalCounters);
  value += Math.min(900, criticalIce.length * 450);
  value += Math.min(1300, pressuredCentralServers.length * 650);
  if (urgentScoreline) value -= 2200;
  if (clickCost > 3) value -= (clickCost - 3) * 500;

  return {
    key: "corp_purge_tactical_impact",
    label: "Purge-Nutzen",
    value,
    reason: [
      `purge_visible_counter_total:${totalCounters}`,
      `purge_affected_card_count:${affected.length}`,
      `purge_critical_ice_count:${criticalIce.length}`,
      `purge_pressured_central_count:${pressuredCentralServers.length}`,
      `purge_pressured_centrals:${pressuredCentralServers.join(",") || "none"}`,
      `purge_click_cost:${clickCost}`,
      `purge_urgent_scoreline:${urgentScoreline}`,
      `purge_board_triage:${boardTriage.primary}`,
      `purge_board_triage_severity:${boardTriage.severity}`,
      `purge_component_value:${value}`,
    ].join("|"),
  };
}

function visibleVirusCounterCards(
  input: AiDecisionInput,
): VisibleVirusCounterCard[] {
  const installedCorpCards = input.playerView.servers.flatMap((server) =>
    [...server.ice, ...server.root].map((card) => ({
      card,
      serverId: server.id,
    })),
  );
  const installedRunnerCards = (input.playerView.opponent.rig ?? []).map(
    (card) => ({ card, serverId: undefined }),
  );
  return [...installedCorpCards, ...installedRunnerCards].flatMap(
    ({ card, serverId }) => {
      if (card.known === false) return [];
      const amount = Math.max(0, Math.floor(card.counters?.virus ?? 0));
      return amount > 0 ? [{ card, serverId, amount }] : [];
    },
  );
}

function purgeCounterVolumeValue(totalCounters: number): number {
  if (totalCounters <= 0) return -6000;
  if (totalCounters === 1) return -3200;
  if (totalCounters === 2) return 900;
  return 1800 + Math.min(1800, (totalCounters - 3) * 350);
}

function visibleIceHasMaterialHazard(card: VisibleCard): boolean {
  const text = `${card.rulesText ?? ""}`.toLocaleLowerCase("en-US");
  return (
    text.includes("damage") || text.includes("trash") || text.includes("tag")
  );
}

function legalActionClickCost(action: LegalAction): number {
  return (action.costs ?? []).reduce(
    (sum, cost) => sum + Math.max(0, Math.floor(cost.clicks ?? 0)),
    0,
  );
}
