const CHRONICLE_CARD_TOUCH_DOUBLE_TAP_MIN_MS = 60;
export const CHRONICLE_CARD_TOUCH_DOUBLE_TAP_MS = 420;

export function shouldActivateChronicleCardTouchDoubleTap(previousTapMs: number, nowMs: number): boolean {
  const elapsed = nowMs - previousTapMs;
  return elapsed > CHRONICLE_CARD_TOUCH_DOUBLE_TAP_MIN_MS && elapsed < CHRONICLE_CARD_TOUCH_DOUBLE_TAP_MS;
}
