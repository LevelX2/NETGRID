# V1.9.21 Requirements

Status: planned
Stand: 2026-05-13

- V1921-MUST-001: Genau sechs V1.9.21-Zielkarten werden geplant; keine V1.9.22-Karte wird promotet.
- V1921-MUST-002: Sichtbare Texte sind finale display-only Texte aus lokal bestaetigten Regelkern-Aussagen.
- V1921-MUST-003: Zufall wird ausschliesslich ueber Seed, RandomCounter und RandomDrawRecords aufgeloest.
- V1921-MUST-004: Zufallsresultate erscheinen in side-sicheren PublicEvents und duerfen keine verdeckten Kartenidentitaeten leaken.
- V1921-MUST-005: applyAction revalidiert Side, Timing, Quelle, Ziele, Kosten und Choice-/Random-Kontext.
- V1921-MUST-006: Replay und StateHash reproduzieren jede neue Zufallsauflösung deterministisch.
- V1921-MUST-007: AI-Hints und AI-Smokes duerfen erst auf `ai_supported` wechseln, wenn Engine-, Visibility-, Replay-, Catalog- und Pflichtchecks gruen sind.

## Akzeptanz

- Runtime-WIP-Guard: 6/6 Zielkarten mit finalem Text, keine V1.9.22-Karte.
- Engine-Smokes fuer mindestens Runner-Zufallsauflösung, Korp-Zufallsasset/-upgrade, Visibility und Replay/StateHash.
- Releaseabschluss nur mit Manifest, Mechanics-Coverage, AI-Hints, AI-Smokes, AI-Approval, Final Review und Webclient-Version `V1.9.21`.
