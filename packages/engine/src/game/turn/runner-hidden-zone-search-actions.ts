import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { buildLegalAction } from "./action-builders";

export type RunnerStackSearchProgramToGripActionInput = {
  cardId: CardInstanceId;
  definition: CardDefinition;
  mode: "top5_programs" | "stack_program";
  creditCost: number;
};

export function buildRunnerStackSearchProgramToGripAction(
  state: GameState,
  input: RunnerStackSearchProgramToGripActionInput,
): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "gain_credit",
    input.mode === "top5_programs"
      ? `${input.definition.title}: Top 5 nach Programmen prüfen`
      : `${input.definition.title}: Stack nach Programm durchsuchen`,
    input.cardId,
    [
      {
        clicks: 1,
        ...(input.creditCost > 0 ? { credits: input.creditCost } : {}),
      },
    ],
    {
      cardId: input.cardId,
      v1911HiddenZoneAbility: "search_stack_program_to_grip",
    },
  );
}
