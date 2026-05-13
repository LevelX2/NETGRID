# V1.9.20 Test Matrix

Status: planned
Stand: 2026-05-13

| Bereich | Pflichtnachweis | Aktueller Stand |
| --- | --- | --- |
| Scope | Genau 26 Zielkarten | Catalog-WIP-Guard grün |
| No-Promotion | Keine V1.9.20-Karte im Runtime-/AI-Releasepool vor Gate | Catalog-WIP-Guard grün |
| Displaytext | Kein `WIP` im Runtime-Text; display-only dokumentiert | 26/26 Runtime-Definitionen grün; display-only im Implementation Review dokumentiert |
| Handlimit/MU | Deterministische Berechnung und PlayerView-Projektion | MRAM-Hardware und Main-Office-Handlimit grün; weitere Handlimit-Pfade Folgearbeit |
| Action Economy | Click-/Action-Modifikatoren nur aus sichtbaren legalen Quellen | Remote-Facility/Nevinyrral/Pacifica-Assetpfad grün; weitere Action-Familien Folgearbeit |
| Globale Modifier | Layering, Quellen und Revalidierung | Fortress-Architects-ICE-Rez-Kostenpfad grün; weitere Modifier Folgearbeit |
| Persistente Sonderzustände | Quelle, Dauer, Ablauf, PublicEvent-Sicherheit | Loan-from-Chiba-Recurring-State grün; weitere Sonderzustände Folgearbeit |
| Visibility | Keine Hidden-Info-Leaks über Modifier, Reconnect, Undo oder Replay | Abgedeckte Action-Economy-, Rez-Kosten-, Handlimit- und Recurring-State-Pfade grün; Reconnect/Undo und weitere Effektfamilien Folgearbeit |
| Replay/StateHash | Deterministische Replays je Effektfamilie | Abgedeckte MRAM-, Action-Economy-, Rez-Kosten-, Handlimit- und Recurring-State-Pfade grün; weitere Effektfamilien Folgearbeit |
| AI | Hints, Smokes, legaler Fallback | Nicht-promotende Draft-Hints/-Smokes angelegt; finale `ai_supported`-Promotion Folgearbeit |
| Server/Web | Webclient-Version erst bei Abschluss | Folgearbeit |
| Full Checks | catalog, engine, ai, server, web, typecheck, test, lint, build | JSON-Validation 285, Catalog 34, Engine 264, AI 85, Server 72, Web 76, Typecheck, Test, Lint und Build grün; Build nur mit bekannter NFT-Warnung |

## Mindestchecks im ersten WIP

- JSON-Validation für `data/**/*.json`
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`
