export function clampReplayFrame(index: number, frameCount: number): number {
  if (frameCount <= 0) return 0;
  return Math.max(0, Math.min(frameCount - 1, Math.floor(index)));
}

export function nextReplayFrame(index: number, frameCount: number): number {
  return clampReplayFrame(index + 1, frameCount);
}

export function playbackDelayMs(speed: number): number {
  return Math.max(100, Math.round(1000 / Math.max(0.25, speed)));
}
