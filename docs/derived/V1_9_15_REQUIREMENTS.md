# V1.9.15 Requirements - Run Flow, Access, Multiaccess und Ambush on Access

Stand: 2026-05-13
Status: frozen

## Must Requirements

- Der Release umfasst genau die 14 Karten aus `docs/derived/V1_9_15_DETAILED_PLAN.md`.
- Jede Runtime-Freigabe braucht einen expliziten LegalAction-/Resolverpfad; generische `trigger_ability` bleibt gesperrt.
- Run-Start, Run-Locks, Access-Queue, Zusatzaccess und Ambush-/ICE-Folgen muessen Side, Action-ID, StateVersion, Kosten, Timingpunkt und Ziele revalidieren.
- Access- und Hidden-Zone-Payloads duerfen keine verdeckten Karteninformationen an falsche Seiten leaken.
- Trace-, Counter-, Recurring- und Damage-Ueberlappungen duerfen nur die bereits freigegebenen V1.9.11-bis-V1.9.14-Vertraege nutzen.
- KI-Entscheidungen duerfen nur aus LegalActions, PlayerView und side-gefilterten Events abgeleitet werden.
- Manifest, Mechanics-Coverage, Release-Smoke, AI-Hints, AI-Smokes und Final Review sind Pflicht vor `human_playable`, `deck_legal` und `ai_supported`.

## No-Scope Requirements

- Keine V1.9.16+-Karten.
- Keine offiziellen Assets oder externen Kartendatenbank-Abhaengigkeiten.
- Keine automatische Kartentextparser-Autoritaet.
- Keine Public-Plattform-, Account-, Cloud- oder Matchmaking-Funktion.

## Done Criteria

- Alle 14 Zielkarten sind gate-konform `human_playable`, `deck_legal` und `ai_supported`.
- Run Flow, Access, Multiaccess, Visibility, Replay/StateHash, AI und Webclient-Version sind dokumentiert und getestet.
- Der Cursor darf erst nach Abschlusscommit und Push auf V1.9.16 wechseln.
