import { afterEach, describe, expect, it, vi } from "vitest";

import { playMatchStartJingle } from "./audio";

describe("playMatchStartJingle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps the boot pulse, rising notes, and final chord as asset fallback", async () => {
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
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("missing test asset");
      }),
    );

    playMatchStartJingle(0.5);

    await vi.waitFor(() => expect(oscillators).toHaveLength(9));
    expect(oscillators).toHaveLength(9);
    expect(
      oscillators.map((oscillator) => oscillator.frequency.initial),
    ).toEqual([146.83, 293.66, 440, 587.33, 880, 293.66, 440, 587.33, 880]);
    expect(oscillators[0]?.frequency.ramp).toEqual({
      value: 73.42,
      at: 10.3,
    });
    expect(
      oscillators.slice(5).map((oscillator) => oscillator.startedAt),
    ).toEqual([10.74, 10.74, 10.74, 10.74]);
  });
});

describe("resource sound playback", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("plays a short metallic coin cluster at the configured volume", async () => {
    vi.resetModules();
    const context = resourceAudioContext();
    vi.stubGlobal("window", { AudioContext: context.AudioContext });
    const { playActionCueSound } = await import("./audio");

    playActionCueSound("credit", 0.5, 100);

    expect(context.oscillators).toHaveLength(6);
    expect(
      context.oscillators.every((oscillator) => oscillator.type === "sine"),
    ).toBe(true);
    expect(
      context.oscillators.every(
        (oscillator) =>
          oscillator.startedAt! >= 10 && oscillator.stoppedAt! < 10.3,
      ),
    ).toBe(true);
    const peaks = context.gains.flatMap((gain) =>
      gain.gain.ramps.map((ramp) => ramp.value),
    );
    expect(Math.max(...peaks)).toBeCloseTo(0.5 * 0.075);
    expect(context.sources).toHaveLength(0);
  });

  it.each([
    [3, 3],
    [12, 5],
  ])(
    "plays %i drawn cards as %i bounded paper snaps",
    async (amount, count) => {
      vi.resetModules();
      const context = resourceAudioContext();
      vi.stubGlobal("window", { AudioContext: context.AudioContext });
      const { playActionCueSound } = await import("./audio");

      playActionCueSound("draw", 0.4, amount);

      expect(context.sources).toHaveLength(count);
      expect(context.oscillators).toHaveLength(count);
      expect(
        context.sources.every((source) =>
          source.buffer?.getChannelData(0).some((sample) => sample !== 0),
        ),
      ).toBe(true);
      expect(
        context.sources.every(
          (source) => source.startedAt! >= 10 && source.stoppedAt! < 10.5,
        ),
      ).toBe(true);
    },
  );
});

class FakeAudioParam {
  initial: number | null = null;
  ramp: { value: number; at: number } | null = null;
  ramps: Array<{ value: number; at: number }> = [];

  setValueAtTime(value: number) {
    this.initial = value;
  }

  exponentialRampToValueAtTime(value: number, at: number) {
    this.ramp = { value, at };
    this.ramps.push(this.ramp);
  }
}

class FakeOscillator {
  type: OscillatorType = "sine";
  frequency = new FakeAudioParam();
  startedAt: number | null = null;
  stoppedAt: number | null = null;

  connect() {}

  start(at: number) {
    this.startedAt = at;
  }

  stop(at: number) {
    this.stoppedAt = at;
  }
}

class FakeGain {
  gain = new FakeAudioParam();

  connect() {}
}

function resourceAudioContext() {
  const oscillators: FakeOscillator[] = [];
  const gains: FakeGain[] = [];
  const sources: FakeBufferSource[] = [];
  class ResourceAudioContext {
    currentTime = 10;
    state = "running";
    destination = {};
    sampleRate = 48000;

    createOscillator() {
      const oscillator = new FakeOscillator();
      oscillators.push(oscillator);
      return oscillator;
    }

    createGain() {
      const gain = new FakeGain();
      gains.push(gain);
      return gain;
    }

    createBuffer(_channels: number, length: number) {
      const samples = new Float32Array(length);
      return { getChannelData: () => samples };
    }

    createBufferSource() {
      const source = new FakeBufferSource();
      sources.push(source);
      return source;
    }

    createBiquadFilter() {
      return { type: "", frequency: new FakeAudioParam(), connect() {} };
    }
  }
  return { AudioContext: ResourceAudioContext, oscillators, gains, sources };
}

class FakeBufferSource extends FakeOscillator {
  buffer: { getChannelData: (channel: number) => Float32Array } | null = null;
}
