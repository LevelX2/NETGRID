import { type VisibleCard } from "@netgrid/shared";

export function isVisibleIcebreakerProgram(
  card: VisibleCard,
  visibleBreakerRoles: (card: VisibleCard) => readonly string[],
): boolean {
  return (
    card.known === true &&
    card.type === "program" &&
    visibleBreakerRoles(card).length > 0
  );
}

export function createVisibleIcebreakerProgramPredicate(
  visibleBreakerRoles: (card: VisibleCard) => readonly string[],
): (card: VisibleCard) => boolean {
  return (card) => isVisibleIcebreakerProgram(card, visibleBreakerRoles);
}
