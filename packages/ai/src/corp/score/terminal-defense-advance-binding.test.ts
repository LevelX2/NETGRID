import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
afterEach(resetResidentPlanPortfolioMemory);
it.each([303, 304])(
  "keeps exact advance ownership at terminal defense boundary D%i",
  (d) => {
    const cp = JSON.parse(
      readFileSync(
        new URL(
          `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-458-terminal-defense-d${d}.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    );
    expect(Object.values(cp.validation).every((value) => value === true)).toBe(
      true,
    );
    const input: AiDecisionInput = {
      ...cp.input,
      ...buildAiDecisionInputDto(cp.input),
    };
    expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
    restoreAiRuntimeCheckpoint(
      input,
      cp.input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    const advance = input.legalActions.find((a) => a.type === "advance_card")!;
    const result = chooseAiAction(input);
    expect(result.fallbackUsed).toBe(false);
    expect(input.legalActions.some((a) => a.actionId === result.actionId)).toBe(
      true,
    );
    if (d === 303) {
      expect(result.actionId).toBe(advance.actionId);
      expect(result.reasonCode).toBe("plan_first.corp.score_agenda");
    } else {
      expect(result.actionId).not.toBe(advance.actionId);
      expect(
        result.decisionDebug?.planFirstDecision?.dispositions,
      ).toContainEqual(
        expect.objectContaining({
          actionId: advance.actionId,
          ownerModuleId: "corp.score_agenda",
          disposition: "explicitly_nonproductive",
          evidenceCode: "corp_terminal_agenda_defense:remote_2:0/1",
        }),
      );
    }
    expect(result.evidence!.some((e) => e.startsWith("plan_step_id:"))).toBe(
      true,
    );
  },
);
