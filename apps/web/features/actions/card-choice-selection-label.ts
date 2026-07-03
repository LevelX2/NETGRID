export function choiceSelectionRangeLabel(
  minSelections: number,
  maxSelections: number,
): string {
  if (minSelections === maxSelections)
    return `${maxSelections} ${cardCountNoun(maxSelections)} auswählen`;
  if (minSelections === 0)
    return `Bis zu ${maxSelections} ${cardCountNoun(maxSelections)} auswählen`;
  return `${minSelections} bis ${maxSelections} ${cardCountNoun(maxSelections)} auswählen`;
}

function cardCountNoun(count: number): string {
  return count === 1 ? "Karte" : "Karten";
}
