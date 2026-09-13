# NETGRID premium audio pack

Except for the locally synthesized cues described below, the WAV files in this
directory were generated specifically for NETGRID with ElevenLabs Sound
Effects on 2026-08-22. They are not stock sounds and do not contain voices or
third-party recordings.

## Locally synthesized victory fanfare

`results/game-won-fanfare.wav` is an original, locally synthesized electronic
fanfare created on 2026-09-13. It uses six repeated opening notes followed by
an ascending C-major finish. It contains no samples or provider-generated
audio; the ElevenLabs-specific terms below apply to the other assets only.
Regenerate it with `node scripts/generate-victory-fanfare.mjs` from the
repository root. Output is 48 kHz, stereo, 16-bit PCM, 3.79 seconds, normalized
to a sample peak of -3 dBFS. The manifest uses a dedicated filename so browser
caches cannot serve the previous victory sound and a 3.8-second cooldown to
prevent the fanfare from overlapping itself. Per-asset provenance fields
override the pack defaults in `audio-provenance.json`.

## Locally synthesized agenda-steal cue

`agenda/agenda-stolen-descent.wav` is an original, locally synthesized cue
created on 2026-09-13. Six short electronic notes descend before a brief pause
and a sustained lowest note. It contains no samples or provider-generated
audio; ElevenLabs-specific terms do not apply to this asset. Regenerate it
with `node scripts/generate-agenda-steal-sound.mjs` from the repository root.
Output is 48 kHz, stereo, 16-bit PCM, 2.43 seconds, normalized to -17 dBFS RMS
with a sample-peak ceiling of -3 dBFS. The `agenda-runner` cue uses a dedicated
filename to avoid the previous sound being served from browser caches.

## License basis reviewed

- Account tier at generation time: ElevenLabs Free.
- Terms reviewed: [ElevenLabs Terms of Service for the EEA](https://elevenlabs.io/terms-of-use-eu), last updated 2026-03-31.
- Publication guidance reviewed: [Can I publish the content I generate?](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform).
- Under the reviewed terms, Free User output is limited to non-commercial use.
- When Free User output is shared or published non-commercially, attribution to
  ElevenLabs is required. This file supplies that attribution: generated with
  ElevenLabs Sound Effects — https://elevenlabs.io.
- ElevenLabs states that, as between the account holder and ElevenLabs, the
  account holder retains rights in generated output. The terms also state that
  output may be non-unique and provide no non-infringement warranty.

## Important release restriction

These files are cleared here only for NETGRID's current private,
non-commercial Version-0 development context. They must not be used in a
commercial NETGRID release unless the license is resolved separately. Moving
the repository or these assets into a public distribution requires preserving
the attribution above and confirming that the distribution remains
non-commercial and complies with the then-current ElevenLabs terms and
Prohibited Use Policy.

No paid plan was purchased and no commercial license is claimed. A later paid
subscription does not automatically change the license of output generated on
the Free tier; replacement generation under an eligible paid plan would be the
cleanest route for commercial publication.

Per-file prompts, generation settings, processing notes, final durations and
SHA-256 checksums are recorded in `audio-provenance.json`.
