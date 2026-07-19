import { afterEach, describe, expect, it, vi } from "vitest";

import { playMatchStartJingle } from "./audio";

describe("playMatchStartJingle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("schedules the boot pulse, rising notes, and final chord", () => {
    const oscillators: FakeOscillator[] = [];

    class FakeAudioContext {
      currentTime = 10;
      state = "running";
      destination = {};

      createOscillator() {
        const oscillator = new FakeOscillator();
        oscillators.push(oscillator);
        return oscillator;
      }

      createGain() {
        return new FakeGain();
      }
    }

    vi.stubGlobal("window", { AudioContext: FakeAudioContext });

    playMatchStartJingle(0.5);

    expect(oscillators).toHaveLength(9);
    expect(oscillators.map((oscillator) => oscillator.frequency.initial)).toEqual([
      146.83,
      293.66,
      440,
      587.33,
      880,
      293.66,
      440,
      587.33,
      880,
    ]);
    expect(oscillators[0]?.frequency.ramp).toEqual({
      value: 73.42,
      at: 10.3,
    });
    expect(oscillators.slice(5).map((oscillator) => oscillator.startedAt)).toEqual([
      10.74,
      10.74,
      10.74,
      10.74,
    ]);
  });
});

class FakeAudioParam {
  initial: number | null = null;
  ramp: { value: number; at: number } | null = null;

  setValueAtTime(value: number) {
    this.initial = value;
  }

  exponentialRampToValueAtTime(value: number, at: number) {
    this.ramp = { value, at };
  }
}

class FakeOscillator {
  type: OscillatorType = "sine";
  frequency = new FakeAudioParam();
  startedAt: number | null = null;

  connect() {}

  start(at: number) {
    this.startedAt = at;
  }

  stop() {}
}

class FakeGain {
  gain = new FakeAudioParam();

  connect() {}
}
