# V1.9.16 Requirements - Program Subtypes, Hosting, Stealth, Worm und Installed-card Destroy

Stand: 2026-05-13
Status: frozen

## Must Requirements

- Der Release umfasst genau die 16 Karten aus `docs/derived/V1_9_16_DETAILED_PLAN.md`.
- Jede Runtime-Freigabe braucht einen expliziten LegalAction-/Resolverpfad; generische `trigger_ability` bleibt gesperrt.
- Installations-, Hosting-, Stealth-/Recurring-, Trace-/Link- und Installed-card-Destroy-Pfade muessen Side, Action-ID, StateVersion, Kosten, Timingpunkt und Ziele revalidieren.
- Hosting- und Destroy-Payloads duerfen keine verdeckten Karteninformationen an falsche Seiten leaken.
- Trace-, Damage-, Recurring- und Hosting-Ueberlappungen duerfen nur die bereits freigegebenen V1.9.11-bis-V1.9.15-Vertraege nutzen.
- KI-Entscheidungen duerfen nur aus LegalActions, PlayerView und side-gefilterten Events abgeleitet werden.
- Manifest, Mechanics-Coverage, Release-Smoke, AI-Hints, AI-Smokes und Final Review sind Pflicht vor `human_playable`, `deck_legal` und `ai_supported`.

## Done Criteria

- Alle 16 Zielkarten sind gate-konform `human_playable`, `deck_legal` und `ai_supported`.
- Program Subtypes, Hosting, Stealth, Link, Visibility, Replay/StateHash, AI und Webclient-Version sind dokumentiert und getestet.
- Der Cursor darf erst nach Abschlusscommit und Push auf V1.9.17 wechseln.
