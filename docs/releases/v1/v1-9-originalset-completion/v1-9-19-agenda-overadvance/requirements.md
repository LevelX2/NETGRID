# V1.9.19 Requirements

Status: frozen
Stand: 2026-05-13

## Must

- V1919-MUST-001: Genau 20 V1.9.19-Zielkarten werden geplant; keine V1.9.20+-Karte wird promotet.
- V1919-MUST-002: Alle Zielkarten erhalten finale display-only Runtime-Texte ohne `WIP`-Präfix.
- V1919-MUST-003: Score-, Steal-, Difficulty- und Overadvance-Pfade werden nur über LegalActions und serverseitig revalidiertes `applyAction` ausgelöst.
- V1919-MUST-004: Scored-Agenda-Statics, aktive Agenda-Fähigkeiten und Agenda-Punktkosten verändern Siegbedingung, Punkte und Kosten deterministisch.
- V1919-MUST-005: Hidden-Zone-, Access-, Ambush-, Counter- und Damage-Randpfade leaken keine verdeckten Kartendaten.
- V1919-MUST-006: Replay und StateHash bleiben für jeden neuen Pfad stabil.
- V1919-MUST-007: AI-Hints und AI-Smokes verwenden nur legale Aktionen und side-sichere Decision-Debug-Daten.
- V1919-MUST-008: Releaseabschluss erfordert Manifest, Mechanics-Coverage, Release-Smoke, AI-Hints, AI-Smokes, AI-Approval-Manifest, Final Review, Webclient-Version und volle Pflichtchecks.

## Should

- V1919-SHOULD-001: Gemeinsame Agenda-/Overadvance-Helfer aus V1.8.0 wiederverwenden.
- V1919-SHOULD-002: WIP-Schnitte klein halten: erst Definitionen/No-Promotion, dann konkrete Resolverpfade.
- V1919-SHOULD-003: Asset-/Upgrade-Randpfade nur soweit für die Zielkarten nötig erweitern.
