import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { shellCoverageSubstitution } from "./shell-traders-coverage-substitution";
import { buildRunnerShellTradersPipelineSignals } from "./shell-traders-plan-signals";
import { runnerShellTradersActionDispositions } from "./shell-traders-dispositions";

function original() {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../runtime/test-fixtures/meta-529-shell-substitution.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const input = {
    ...f.checkpoint.input,
    ...buildAiDecisionInputDto(f.checkpoint.input),
  } as AiDecisionInput;
  const target = input.playerView.specialZones!.setAside.find(
    (c) => c.definitionId === f.gap.handAnswerDefinitionId,
  )!;
  const action = input.legalActions.find(
    (a) =>
      a.payload?.targetCardId === target.instanceId &&
      a.payload.delayedInstallAbility === "remove_shell_counter",
  )!;
  return { input, action, target, gap: f.gap };
}
describe("Shell current coverage development substitution", () => {
  it("substitutes only the admitted P4 install and leaves whole access explicitly unknown", () => {
    const { input, action, gap } = original();
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: Object.fromEntries(
        [
          ...(input.playerView.own.rig ?? []),
          ...input.playerView.own.gripOrHq,
          ...(input.playerView.specialZones?.setAside ?? []),
        ]
          .filter((c) => c.known && c.definitionId)
          .map((c) => [c.instanceId, c.definitionId!]),
      ),
    });
    const signals = buildRunnerShellTradersPipelineSignals({
      input,
      candidates,
      coverageGaps: [gap],
      handDevelopment: [],
    });
    const signal = signals.find((s) => s.actionIds.includes(action.actionId))!;
    expect(signal).toMatchObject({
      phase: "progress",
      priorityClass: "P4",
      shellCountersBefore: 1,
      replacementAssessment: { status: "not_needed" },
      accessAssessment: { status: "unknown" },
      coverageSubstitution: {
        stateVersion: 423,
        gapId: gap.gapId,
        shellCredits: 1,
      },
    });
    const direct = input.legalActions.find(
      (a) =>
        a.type === "install_card" &&
        a.payload?.runnerProgramTrashBeforeInstall !== true,
    )!;
    expect(runnerShellTradersActionDispositions(signals)).toContainEqual(
      expect.objectContaining({
        actionId: direct.actionId,
        ownerModuleId: "runner.shell_traders_pipeline",
        disposition: "explicitly_nonproductive",
      }),
    );
  });
  it.each([
    "no_install",
    "wrong_definition",
    "old_version",
    "shell_old_version",
    "corrupt_cost",
    "two_counters",
    "memory_sacrifice",
    "no_click_saving",
    "cheaper_install",
    "hosted_install",
    "urgent",
    "same_turn_conversion",
    "upgrade",
    "redundant",
    "unaffordable_shell",
    "foreign_target",
    "wrong_source",
    "wrong_target",
  ])("rejects %s without widening paid access authority", (mode) => {
    const { input, action, target, gap } = original();
    const install = input.legalActions.find(
      (a) =>
        a.type === "install_card" &&
        a.payload?.runnerProgramTrashBeforeInstall !== true,
    )!;
    let freeMemory = 5,
      counters = 1;
    if (mode === "no_install") gap.installActionIds = [];
    if (mode === "wrong_definition") gap.handAnswerDefinitionId = "other";
    if (mode === "old_version") install.expiresAtStateVersion--;
    if (mode === "shell_old_version") action.expiresAtStateVersion--;
    if (mode === "corrupt_cost") action.costs = [{ credits: -1 }];
    if (mode === "two_counters") counters = 2;
    if (mode === "memory_sacrifice") freeMemory = 1;
    if (mode === "no_click_saving") install.costs = [{ credits: 3 }];
    if (mode === "cheaper_install") install.costs = [{ credits: 0, clicks: 1 }];
    if (mode === "hosted_install") install.payload!.hostCardId = "host";
    if (mode === "urgent") gap.priorityClass = "P2";
    if (mode === "same_turn_conversion") gap.sameTurnRunConversion = {};
    if (mode === "upgrade") gap.needKind = "coverage_upgrade";
    if (mode === "redundant")
      input.playerView.own.rig!.push({
        ...target,
        instanceId: "installed-copy",
      });
    if (mode === "unaffordable_shell") input.playerView.own.credits = 0;
    if (mode === "foreign_target") target.owner = "corp";
    if (mode === "wrong_source") action.source = "absent-source";
    if (mode === "wrong_target") action.payload!.targetCardId = "absent-target";
    expect(
      shellCoverageSubstitution(
        input,
        action,
        target,
        gap,
        counters,
        freeMemory,
        2,
      ),
    ).toBeUndefined();
  });
});
