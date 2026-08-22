"use client";

import { useTranslations } from "use-intl/react";
import { useState } from "react";

import { playPremiumAudioCue } from "../lib/audio";
import {
  PREMIUM_AUDIO_CUE_KEYS,
  PREMIUM_AUDIO_MANIFEST,
  type PremiumAudioCueKey,
} from "../lib/audio-manifest";

type AudioLabProps = {
  audioEnabled: boolean;
  audioVolume: number;
  onAudioEnabled: (enabled: boolean) => void;
  onAudioVolume: (volume: number) => void;
};

export function AudioLab({
  audioEnabled,
  audioVolume,
  onAudioEnabled,
  onAudioVolume,
}: AudioLabProps) {
  const t = useTranslations("AudioLab");
  const [forceFallback, setForceFallback] = useState(false);
  const [damageAmount, setDamageAmount] = useState(1);

  const play = (cue: PremiumAudioCueKey) => {
    if (!audioEnabled) return;
    playPremiumAudioCue(cue, audioVolume, {
      forceFallback,
      intensity: cue.startsWith("damage-") ? damageAmount : 1,
    });
  };

  return (
    <aside className="audioLab" data-testid="audio-lab" aria-label={t("title")}>
      <header className="audioLabHeader">
        <div>
          <strong>{t("title")}</strong>
          <span>{t("internalOnly")}</span>
        </div>
      </header>
      <div className="audioLabControls">
        <label>
          <input
            type="checkbox"
            checked={audioEnabled}
            onChange={(event) => onAudioEnabled(event.target.checked)}
          />
          {t("audioEnabled")}
        </label>
        <label>
          {t("volume", { percent: Math.round(audioVolume * 100) })}
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={audioVolume}
            onChange={(event) => onAudioVolume(Number(event.target.value))}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={forceFallback}
            onChange={(event) => setForceFallback(event.target.checked)}
          />
          {t("forceFallback")}
        </label>
        <label>
          {t("damageAmount")}
          <input
            type="number"
            min="1"
            max="20"
            value={damageAmount}
            onChange={(event) =>
              setDamageAmount(
                Math.min(20, Math.max(1, Number(event.target.value) || 1)),
              )
            }
          />
        </label>
      </div>
      <div className="audioLabCueList">
        {PREMIUM_AUDIO_CUE_KEYS.map((cue) => (
          <button
            key={cue}
            type="button"
            className="audioLabCue"
            disabled={!audioEnabled}
            onClick={() => play(cue)}
          >
            <strong>{cue}</strong>
            <span>{PREMIUM_AUDIO_MANIFEST[cue].files.join(", ")}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
