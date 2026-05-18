# S01 Audio Spec

Status: frozen_for_implementation
Stand: 2026-05-03

## Zweck

S01-Audio gibt kurze Rückmeldung bei Spielende. Audio ist reine Präsentation und kein Match-State.

## Regeln

- Audio ist Opt-in.
- Audio hat lokale Lautstärkeregelung.
- Audioeffekte sind kurze One-shot-Signale.
- Reconnect in ein bereits beendetes Spiel löst keinen automatischen initialen Sound aus.
- Audiozustand liegt in lokaler UI-Preference, nicht in Engine, Server-State, Replay oder StateHash.

## Effekte

- Sieg: aufsteigende helle Tonfolge.
- Niederlage: absteigende gedämpfte Tonfolge.
- Draw: neutrale Tonfolge.

## Asset-Regel

Die Umsetzung nutzt Web-Audio-Synthese und keine offiziellen oder externen Audiodateien.
