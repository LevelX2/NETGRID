export function counterAmountMeetsThreshold(
  amount: number,
  activeAtOrAbove: number,
): boolean {
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw new Error("Counterwert für Schwellenprüfung ist ungueltig.");
  if (!Number.isSafeInteger(activeAtOrAbove) || activeAtOrAbove <= 0)
    throw new Error("Counterschwelle ist ungueltig.");
  return amount >= activeAtOrAbove;
}

export function counterThresholdDeactivated(
  before: number,
  after: number,
  activeAtOrAbove: number,
): boolean {
  return (
    counterAmountMeetsThreshold(before, activeAtOrAbove) &&
    !counterAmountMeetsThreshold(after, activeAtOrAbove)
  );
}
