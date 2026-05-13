# V1.9.20 Test Matrix

Status: planned
Stand: 2026-05-13

| Bereich | Pflichtnachweis | Aktueller Stand |
| --- | --- | --- |
| Scope | Genau 26 Zielkarten | Planung gestartet |
| No-Promotion | Keine V1.9.20-Karte im Runtime-/AI-Releasepool vor Gate | Folgearbeit |
| Displaytext | Kein `WIP` im Runtime-Text; display-only dokumentiert | Folgearbeit |
| Handlimit/MU | Deterministische Berechnung und PlayerView-Projektion | Folgearbeit |
| Action Economy | Click-/Action-Modifikatoren nur aus sichtbaren legalen Quellen | Folgearbeit |
| Globale Modifier | Layering, Quellen und Revalidierung | Folgearbeit |
| Persistente Sonderzustände | Quelle, Dauer, Ablauf, PublicEvent-Sicherheit | Folgearbeit |
| Visibility | Keine Hidden-Info-Leaks über Modifier, Reconnect, Undo oder Replay | Folgearbeit |
| Replay/StateHash | Deterministische Replays je Effektfamilie | Folgearbeit |
| AI | Hints, Smokes, legaler Fallback | Folgearbeit |
| Server/Web | Webclient-Version erst bei Abschluss | Folgearbeit |
| Full Checks | catalog, engine, ai, server, web, typecheck, test, lint, build | Folgearbeit |

## Mindestchecks im ersten WIP

- JSON-Validation für `data/**/*.json`
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`
