import type { AiDecisionInput } from "@netgrid/shared";

import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import { semanticRuntimeChoiceWithEvidence } from "./semantic-runtime-score-components";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";

const OPPONENT_MATCHPOINT_CONTEST_SCORE_FLOOR = 10_000;

export function runnerOpponentMatchpointContestSemanticChoice(
  input: AiDecisionInput,
  choices: readonly SemanticRuntimeChoice[],
  runTargets: readonly RunnerRunTargetEvaluation[],
): SemanticRuntimeChoice | undefined {
  if (
    input.side !== "runner" ||
    input.playerView.winner !== null ||
    input.playerView.opponent.agendaPoints <
      input.playerView.agendaPointsToWin - 1
  ) {
    return undefined;
  }

  const candidates = runTargets
    .filter((target) => urgentReachableRemoteContest(input, target))
    .flatMap((target) => {
      const choice = choices.find(
        (candidate) =>
          !candidate.exclusion &&
          candidate.action.type === "start_run" &&
          candidate.action.actionId === target.actionId,
      );
      return choice ? [{ choice, target }] : [];
    })
    .sort(
      (left, right) =>
        matchpointPayoffRank(right.target) -
          matchpointPayoffRank(left.target) ||
        right.target.score - left.target.score ||
        right.choice.score - left.choice.score ||
        left.choice.action.actionId.localeCompare(right.choice.action.actionId),
    );
  const selected = candidates[0];
  if (!selected) return undefined;

  return semanticRuntimeChoiceWithEvidence(selected.choice, {
    minimumScore: OPPONENT_MATCHPOINT_CONTEST_SCORE_FLOOR,
    reasonCode: "runner.endgame.opponent_matchpoint_contest",
    explanation:
      "Der Runner contestet den öffentlich erkennbaren Matchpoint-Remote, solange der sichtbare Restpfad erreichbar und bezahlbar ist.",
    evidence: [
      "runner_opponent_matchpoint_contest:true",
      `opponent_agenda_points:${input.playerView.opponent.agendaPoints}`,
      `agenda_points_to_win:${input.playerView.agendaPointsToWin}`,
      `matchpoint_contest_server:${selected.target.targetServerId}`,
      `matchpoint_contest_payoff:${selected.target.accessPayoff}`,
      `matchpoint_contest_path:${selected.target.pathPassability}`,
      `matchpoint_contest_credits_after:${selected.target.creditsAfterRun}`,
    ],
  });
}

function urgentReachableRemoteContest(
  input: AiDecisionInput,
  target: RunnerRunTargetEvaluation,
): boolean {
  if (
    target.targetKind !== "remote" ||
    target.pathPassability !== "reachable" ||
    target.creditsAfterRun < 0 ||
    target.recommendation === "do_not_run_now"
  ) {
    return false;
  }
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === target.targetServerId,
  );
  if (!server) return false;
  const hasUnknownRootCard = server.root.some((card) => card.known === false);
  const hasVisibleAgenda = server.root.some(
    (card) => card.known !== false && card.type === "agenda",
  );
  return (
    target.scoreThreat ||
    target.accessPayoff === "score_threat" ||
    target.accessPayoff === "agenda" ||
    hasUnknownRootCard ||
    hasVisibleAgenda
  );
}

function matchpointPayoffRank(target: RunnerRunTargetEvaluation): number {
  if (target.accessPayoff === "agenda") return 4;
  if (target.scoreThreat || target.accessPayoff === "score_threat") return 3;
  return 2;
}
