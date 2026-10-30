import type { GameState } from "@netgrid/shared";

export function delayedAgendaAccessReplacementEffect(
  run: NonNullable<GameState["run"]>,
):
  | Extract<
      NonNullable<NonNullable<GameState["run"]>["runDurationEffects"]>[number],
      { kind: "delayed_agenda_access_replacement" }
    >
  | undefined {
  return run.runDurationEffects?.find(
    (effect) => effect.kind === "delayed_agenda_access_replacement",
  );
}
