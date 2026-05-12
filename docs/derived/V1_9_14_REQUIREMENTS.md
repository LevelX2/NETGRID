# V1.9.14 Requirements - Trace, Link, Tags und Resource-Tag-Interaktionen

Stand: 2026-05-13
Status: frozen

## Must Requirements

- Der Release umfasst genau die 25 Karten aus `docs/derived/V1_9_14_DETAILED_PLAN.md`.
- Jede Runtime-Freigabe braucht einen expliziten LegalAction-/Resolverpfad; generische `trigger_ability` bleibt gesperrt.
- Trace-/Link-/Bid-Entscheidungen muessen Side, Action-ID, StateVersion, Kosten und Timingpunkt revalidieren.
- Tag-Vermeidung, Tag-Entfernung, tagbedingte Kosten und Resource-Trash duerfen nur side-sichere Payloads erzeugen.
- Resource-Aktionen muessen installierte Runner-Ressourcen, Kosten und Choice-Ziele erneut validieren.
- Hidden-Zone-, Damage- und Counter-Ueberlappungen duerfen nur die bereits freigegebenen V1.9.11-, V1.9.12- und V1.9.13-Vertraege nutzen.
- KI-Entscheidungen duerfen nur aus LegalActions, PlayerView und side-gefilterten Events abgeleitet werden.
- Manifest, Mechanics-Coverage, Release-Smoke, AI-Hints, AI-Smokes und Final Review sind Pflicht vor `human_playable`, `deck_legal` und `ai_supported`.

## No-Scope Requirements

- Keine V1.9.15+-Karten.
- Keine offiziellen Assets oder externen Kartendatenbank-Abhaengigkeiten.
- Keine automatische Kartentextparser-Autoritaet.
- Keine Public-Plattform-, Account-, Cloud- oder Matchmaking-Funktion.

## Done Criteria

- Alle 25 Zielkarten sind gate-konform `human_playable`, `deck_legal` und `ai_supported`.
- Trace, Tags, Resource-Interaktionen, Visibility, Replay/StateHash, AI und Webclient-Version sind dokumentiert und getestet.
- Der Cursor darf erst nach Abschlusscommit und Push auf V1.9.15 wechseln.
