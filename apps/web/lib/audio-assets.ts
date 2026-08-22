import {
  PREMIUM_AUDIO_MANIFEST,
  type PremiumAudioCueKey,
} from "./audio-manifest";

const MAX_MASTER_VOLUME = 0.8;
const MAX_ACTIVE_SOURCES = 8;
const DAMAGE_CUES = new Set<PremiumAudioCueKey>([
  "damage-net",
  "damage-meat",
  "damage-core",
]);

type ActiveSource = {
  cue: PremiumAudioCueKey;
  source: AudioBufferSourceNode;
};

export type AudioAssetEngineDependencies = {
  context: () => AudioContext | null;
  fetchAsset?: typeof fetch;
  now?: () => number;
};

export type AudioAssetPlayOptions = {
  forceFallback?: boolean;
  intensity?: number;
};

export function clampAudioVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 0;
  return Math.min(MAX_MASTER_VOLUME, Math.max(0, volume));
}

export function boundedDamageImpulseCount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 1) return 1;
  if (amount < 3) return 2;
  return 3;
}

export class AudioAssetEngine {
  private readonly bufferCache = new Map<string, Promise<AudioBuffer>>();
  private readonly lastRequestedAt = new Map<PremiumAudioCueKey, number>();
  private readonly roundRobin = new Map<PremiumAudioCueKey, number>();
  private readonly activeSources: ActiveSource[] = [];
  private readonly fetchAsset: typeof fetch;
  private readonly now: () => number;
  private damageEpoch = 0;

  constructor(private readonly dependencies: AudioAssetEngineDependencies) {
    this.fetchAsset = dependencies.fetchAsset ?? ((...args) => fetch(...args));
    this.now = dependencies.now ?? Date.now;
  }

  preloadImportant(): Promise<void> {
    const context = this.dependencies.context();
    if (!context) return Promise.resolve();
    const loads = Object.entries(PREMIUM_AUDIO_MANIFEST)
      .filter(([, definition]) => definition.preload)
      .flatMap(([, definition]) => definition.files)
      .map((path) =>
        this.loadBuffer(context, path)
          .then(() => undefined)
          .catch(() => undefined),
      );
    return Promise.all(loads).then(() => undefined);
  }

  async play(
    cue: PremiumAudioCueKey,
    volume: number,
    options: AudioAssetPlayOptions = {},
  ): Promise<boolean> {
    const safeVolume = clampAudioVolume(volume);
    if (safeVolume <= 0 || options.forceFallback) return false;
    const context = this.dependencies.context();
    if (!context) return false;
    const definition = PREMIUM_AUDIO_MANIFEST[cue];
    const requestedAt = this.now();
    const previousRequest = this.lastRequestedAt.get(cue);
    if (
      previousRequest !== undefined &&
      requestedAt - previousRequest < definition.cooldownMs
    )
      return true;
    this.lastRequestedAt.set(cue, requestedAt);
    if (cue === "flatline") {
      this.damageEpoch += 1;
      this.stopActiveDamageSources();
    }
    const damageEpoch = this.damageEpoch;

    const variantIndex = this.roundRobin.get(cue) ?? 0;
    const path = definition.files[variantIndex % definition.files.length]!;
    this.roundRobin.set(cue, variantIndex + 1);

    let buffer: AudioBuffer;
    try {
      buffer = await this.loadBuffer(context, path);
    } catch {
      this.lastRequestedAt.delete(cue);
      return false;
    }

    if (DAMAGE_CUES.has(cue) && damageEpoch !== this.damageEpoch) return true;
    const impulseCount = DAMAGE_CUES.has(cue)
      ? boundedDamageImpulseCount(options.intensity ?? 1)
      : 1;
    const intensityGain = DAMAGE_CUES.has(cue)
      ? Math.min(1.18, 0.88 + Math.max(0, (options.intensity ?? 1) - 1) * 0.06)
      : 1;
    for (let index = 0; index < impulseCount; index += 1) {
      this.startBuffer(
        context,
        cue,
        buffer,
        safeVolume * definition.gain * intensityGain,
        index * 0.14,
      );
    }
    return true;
  }

  clearCache(): void {
    this.bufferCache.clear();
  }

  cachedAssetCount(): number {
    return this.bufferCache.size;
  }

  private loadBuffer(
    context: AudioContext,
    path: string,
  ): Promise<AudioBuffer> {
    const cached = this.bufferCache.get(path);
    if (cached) return cached;
    const pending = this.fetchAsset(path, {
      cache: "force-cache",
      credentials: "same-origin",
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Audio asset unavailable: ${path}`);
        return response.arrayBuffer();
      })
      .then((encoded) => context.decodeAudioData(encoded.slice(0)))
      .catch((error) => {
        this.bufferCache.delete(path);
        throw error;
      });
    this.bufferCache.set(path, pending);
    return pending;
  }

  private startBuffer(
    context: AudioContext,
    cue: PremiumAudioCueKey,
    buffer: AudioBuffer,
    gainValue: number,
    delay: number,
  ): void {
    while (this.activeSources.length >= MAX_ACTIVE_SOURCES) {
      const oldest = this.activeSources.shift();
      try {
        oldest?.source.stop();
      } catch {
        // A source that already ended needs no further cleanup.
      }
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(
      Math.max(0.0001, Math.min(0.8, gainValue)),
      context.currentTime + delay,
    );
    source.connect(gain);
    gain.connect(context.destination);
    const active = { cue, source };
    this.activeSources.push(active);
    source.onended = () => {
      const index = this.activeSources.indexOf(active);
      if (index >= 0) this.activeSources.splice(index, 1);
      source.disconnect();
      gain.disconnect();
    };
    source.start(context.currentTime + delay);
  }

  private stopActiveDamageSources(): void {
    for (const active of [...this.activeSources]) {
      if (!DAMAGE_CUES.has(active.cue)) continue;
      try {
        active.source.stop();
      } catch {
        // A source that already ended needs no further cleanup.
      }
    }
  }
}
