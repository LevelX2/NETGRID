import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { assessCorpTerminalAgendaDefense } from "../defense/corp-terminal-agenda-defense";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
afterEach(resetResidentPlanPortfolioMemory);
it.each([
  { d: 303, stackExhausted: false },
  { d: 304, stackExhausted: false },
  { d: 304, stackExhausted: true },
])(
  "keeps the terminal advance defense contract at D$d (empty Stack: $stackExhausted)",
  ({ d, stackExhausted }) => {
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
    if (stackExhausted) cp.input.playerView.opponent.deckCount = 0;
    const input: AiDecisionInput = {
      ...cp.input,
      ...buildAiDecisionInputDto(cp.input),
    };
    if (stackExhausted)
      Object.assign(input, {
        planningStateIdentity: buildPlanningStateIdentity(input),
      });
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
    } else if (!stackExhausted) {
      expect(
        input.playerView.opponent.rig?.some(
          (card) => card.definitionId === 271,
        ),
      ).toBe(true);
      expect(input.playerView.opponent.deckCount).toBeGreaterThan(0);
      expect(
        assessCorpTerminalAgendaDefense(input, "r2", "terminal-test")
          ?.best,
      ).toMatchObject({
        fundedProtection: false,
        evidence: expect.arrayContaining([
          "unknownSubsetReason:unsupported_runner_access_effect",
        ]),
      });
      expect(result.actionId).not.toBe(advance.actionId);
    } else {
      expect(result.actionId).not.toBe(advance.actionId);
      expect(
        result.decisionDebug?.planFirstDecision?.dispositions,
      ).toContainEqual(
        expect.objectContaining({
          actionId: advance.actionId,
          ownerModuleId: "corp.score_agenda",
          disposition: "explicitly_nonproductive",
          evidenceCode: "corp_terminal_agenda_defense:r2:0/1",
        }),
      );
    }
    expect(result.evidence!.some((e) => e.startsWith("plan_step_id:"))).toBe(
      true,
    );
  },
);
