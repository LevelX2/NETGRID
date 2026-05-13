# V1.9.20 Test Matrix

Status: final
Stand: 2026-05-13

| Bereich | Pflichtnachweis | Aktueller Stand |
| --- | --- | --- |
| Scope | Genau 26 Zielkarten | Catalog-Release-Guard grün |
| No-Promotion | Keine V1.9.21+-Karte im Runtime-/AI-Releasepool | Catalog-Release-Guard grün |
| Displaytext | Kein `WIP` im Runtime-Text; display-only dokumentiert | 26/26 Runtime-Definitionen grün; display-only im Implementation Review dokumentiert |
| Handlimit/MU | Deterministische Berechnung und PlayerView-Projektion | MRAM-Hardware und Main-Office-Handlimit grün |
| Action Economy | Click-/Action-Modifikatoren nur aus sichtbaren legalen Quellen | Remote-Facility/Nevinyrral/Pacifica-Assetpfad inkl. Wrong-Side-/Stale-State-Rejection grün |
| Globale Modifier | Layering, Quellen und Revalidierung | Fortress-Architects-ICE-Rez-Kostenpfad grün |
| Persistente Sonderzustände | Quelle, Dauer, Ablauf, PublicEvent-Sicherheit | Loan-from-Chiba-Recurring-State grün |
| Visibility | Keine Hidden-Info-Leaks über Modifier, Reconnect, Undo oder Replay | Abgedeckte Action-Economy-, Rez-Kosten-, Handlimit- und Recurring-State-Pfade grün; Release-Artefakte side-sicher |
| Replay/StateHash | Deterministische Replays je Effektfamilie | Abgedeckte MRAM-, Action-Economy-, Rez-Kosten-, Handlimit- und Recurring-State-Pfade grün |
| AI | Hints, Smokes, legaler Fallback | Finale AI-Hints/-Smokes und Approval-Manifest grün; alle 26 Karten `ai_supported` |
| Server/Web | Webclient-Version erst bei Abschluss | Webclient-Version `V1.9.20` |
| Full Checks | catalog, engine, ai, server, web, typecheck, test, lint, build | JSON-Validation 285, Catalog 35, Engine 265, AI 85, Server 72, Web 76, Typecheck, Test, Lint und Build grün; Build nur mit bekannter NFT-Warnung |

## Mindestchecks im ersten WIP

- JSON-Validation für `data/**/*.json`
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`
