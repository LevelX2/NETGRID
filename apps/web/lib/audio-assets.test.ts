import { describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  AudioAssetEngine,
  boundedDamageImpulseCount,
  clampAudioVolume,
} from "./audio-assets";
import {
  PREMIUM_AUDIO_CUE_KEYS,
  PREMIUM_AUDIO_MANIFEST,
  isLocalPremiumAudioPath,
} from "./audio-manifest";

describe("premium audio manifest", () => {
  it("maps every required cue to a valid local WAV path", () => {
    expect(Object.keys(PREMIUM_AUDIO_MANIFEST)).toEqual([
      ...PREMIUM_AUDIO_CUE_KEYS,
    ]);
    for (const definition of Object.values(PREMIUM_AUDIO_MANIFEST)) {
      expect(definition.files.length).toBeGreaterThan(0);
      expect(definition.files.every(isLocalPremiumAudioPath)).toBe(true);
      for (const path of definition.files) {
        const localPath = fileURLToPath(
          new URL(`../public${path}`, import.meta.url),
        );
        expect(existsSync(localPath), localPath).toBe(true);
      }
    }
  });

  it("clamps volume to the safe master range", () => {
    expect(clampAudioVolume(-1)).toBe(0);
    expect(clampAudioVolume(0.45)).toBe(0.45);
    expect(clampAudioVolume(5)).toBe(0.8);
    expect(clampAudioVolume(Number.NaN)).toBe(0);
  });

  it.each([
    [1, 1],
    [2, 2],
    [3, 3],
    [20, 3],
  ])("limits %i damage to %i controlled impulses", (amount, expected) => {
    expect(boundedDamageImpulseCount(amount)).toBe(expected);
  });
});

describe("AudioAssetEngine", () => {
  it("caches a decoded asset across later playback", async () => {
    const context = new FakeAudioContext();
    const fetchAsset = vi.fn(async () => audioResponse());
    let now = 1000;
    const engine = new AudioAssetEngine({
      context: () => context as unknown as AudioContext,
      fetchAsset: fetchAsset as unknown as typeof fetch,
      now: () => now,
    });

    expect(await engine.play("access", 0.5)).toBe(true);
    now += 1000;
    expect(await engine.play("access", 0.5)).toBe(true);

    expect(fetchAsset).toHaveBeenCalledTimes(1);
    expect(context.decodeAudioData).toHaveBeenCalledTimes(1);
    expect(engine.cachedAssetCount()).toBe(1);
  });

  it("reports a missing asset so the caller can use the synthetic fallback", async () => {
    const context = new FakeAudioContext();
    const engine = new AudioAssetEngine({
      context: () => context as unknown as AudioContext,
      fetchAsset: vi.fn(async () =>
        audioResponse(false),
      ) as unknown as typeof fetch,
    });

    expect(await engine.play("access", 0.5)).toBe(false);
    expect(engine.cachedAssetCount()).toBe(0);
  });

  it("reports a decode error so the caller can use the synthetic fallback", async () => {
    const context = new FakeAudioContext();
    context.decodeAudioData.mockRejectedValueOnce(new Error("bad wav"));
    const engine = new AudioAssetEngine({
      context: () => context as unknown as AudioContext,
      fetchAsset: vi.fn(async () => audioResponse()) as unknown as typeof fetch,
    });

    expect(await engine.play("damage-net", 0.5, { intensity: 2 })).toBe(false);
    expect(context.sources).toHaveLength(0);
  });

  it("does not start the match cue twice inside its cooldown", async () => {
    const context = new FakeAudioContext();
    const engine = new AudioAssetEngine({
      context: () => context as unknown as AudioContext,
      fetchAsset: vi.fn(async () => audioResponse()) as unknown as typeof fetch,
      now: () => 1000,
    });

    expect(await engine.play("match-start", 0.5)).toBe(true);
    expect(await engine.play("match-start", 0.5)).toBe(true);
    expect(context.sources).toHaveLength(1);
  });

  it("uses at most three sources for high damage values", async () => {
    const context = new FakeAudioContext();
    const engine = new AudioAssetEngine({
      context: () => context as unknown as AudioContext,
      fetchAsset: vi.fn(async () => audioResponse()) as unknown as typeof fetch,
    });

    expect(await engine.play("damage-core", 0.5, { intensity: 20 })).toBe(true);
    expect(context.sources).toHaveLength(3);
  });

  it("lets flatline stop active damage and suppress a pending damage load", async () => {
    const context = new FakeAudioContext();
    let resolveFirstFetch: ((response: Response) => void) | undefined;
    const firstFetch = new Promise<Response>((resolve) => {
      resolveFirstFetch = resolve;
    });
    const fetchAsset = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(() => firstFetch)
      .mockResolvedValue(audioResponse());
    let now = 1000;
    const engine = new AudioAssetEngine({
      context: () => context as unknown as AudioContext,
      fetchAsset,
      now: () => now,
    });

    const pendingDamage = engine.play("damage-net", 0.5, { intensity: 3 });
    now += 1000;
    expect(await engine.play("flatline", 0.5)).toBe(true);
    resolveFirstFetch?.(audioResponse());
    expect(await pendingDamage).toBe(true);

    expect(context.sources).toHaveLength(1);
  });
});

function audioResponse(ok = true): Response {
  return {
    ok,
    arrayBuffer: async () => new ArrayBuffer(8),
  } as Response;
}

class FakeAudioParam {
  setValueAtTime() {}
}

class FakeGain {
  gain = new FakeAudioParam();
  connect() {}
  disconnect() {}
}

class FakeSource {
  buffer: AudioBuffer | null = null;
  onended: (() => void) | null = null;
  startedAt: number | null = null;
  stopped = false;
  connect() {}
  disconnect() {}
  start(at: number) {
    this.startedAt = at;
  }
  stop() {
    this.stopped = true;
  }
}

class FakeAudioContext {
  currentTime = 4;
  destination = {};
  sources: FakeSource[] = [];
  decodeAudioData = vi.fn(async () => ({ duration: 1 }) as AudioBuffer);

  createBufferSource() {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }

  createGain() {
    return new FakeGain();
  }
}
