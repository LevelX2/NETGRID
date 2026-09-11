import type {
  PlanModule,
  PlanMaterialization,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import {
  runnerTacticalProposal as proposal,
  runnerTacticalAssessment as assessment,
  runnerTacticalPlanDomain,
} from "../../plans/runner-tactical-module-support";
import type {
  RunnerTerminalWinSignal,
  TerminalWinState,
} from "./terminal-win-types";

export function createRunnerTerminalWinModule(): PlanModule {
  return {
    moduleId: "runner.secure_terminal_win",
    side: "runner",
    discover: (context) =>
      runnerTacticalPlanDomain<{ terminalWins: RunnerTerminalWinSignal[] }>(
        context,
      ).terminalWins.map((signal) => {
        const candidates = terminalWinCandidates(context, signal);
        return proposal(
          "runner.secure_terminal_win",
          signal.terminalId,
          { kind: "terminal_win", signal } satisfies TerminalWinState,
          "P1",
          [],
          { kind: "player", id: "corp" },
          candidates.length > 0,
          signal.evidenceCode,
        );
      }),
    assess: (instance, context, portfolio) => {
      const current = instance.moduleState as TerminalWinState;
      return assessment(
        instance,
        "P1",
        terminalWinCandidates(context, current.signal).length > 0,
        1,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = instance.moduleState as TerminalWinState;
      const forcesCorpMandatoryDraw =
        current.signal.terminalCondition === undefined ||
        current.signal.terminalCondition === "corp_empty_rd_mandatory_draw";
      return {
        step: {
          stepId: `${instance.instanceId}:force_terminal`,
          capability: {
            capabilityId: forcesCorpMandatoryDraw
              ? "force_corp_mandatory_draw_deckout"
              : "convert_immediate_runner_agenda_point",
            semanticActionTypes: current.signal.semanticActionTypes,
          },
          purpose: forcesCorpMandatoryDraw
            ? "End the Runner turn to force the rules-proven empty-R&D mandatory draw."
            : "Resolve the exact legal action that immediately reaches the Runner agenda-point threshold.",
        },
        candidates: terminalWinCandidates(context, current.signal),
        ...(forcesCorpMandatoryDraw
          ? {
              earlyEndTurnJustification: {
                kind: "rules_proven_terminal_win" as const,
                terminalCondition: "corp_empty_rd_mandatory_draw" as const,
              },
            }
          : {}),
      };
    },
  };
}

function terminalWinCandidates(
  context: PlanSchedulerContext,
  signal: RunnerTerminalWinSignal,
): PlanMaterialization["candidates"] {
  const exactActionIds = new Set(signal.actionIds ?? []);
  return context.actionCandidates
    .filter(
      (candidate) =>
        signal.semanticActionTypes.includes(candidate.semanticActionType) &&
        (exactActionIds.size > 0
          ? exactActionIds.has(candidate.actionId)
          : candidate.actionType === "end_turn" &&
            candidate.sourceKind === "game_rule"),
    )
    .map((candidate) => ({
      candidate,
      stepValue:
        signal.terminalCondition === "runner_immediate_agenda_point"
          ? 10_000
          : 1,
    }));
}
