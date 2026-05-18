# V1.9.18 Test Matrix

Status: final
Stand: 2026-05-13

| Bereich | Pflichtnachweis | Aktueller WIP-Stand |
| --- | --- | --- |
| Scope | 15/15 Zielkarten exakt | Engine- und Catalog-WIP-Smokes grün |
| Promotion | Exakt 15 V1.9.18-Karten in Runtime-/AI-Releasepool nach Gate | Catalog-Release-Smoke grün; Runtime-/AI-Pool 275 |
| Displaytext | Kein `WIP` im Runtime-Text; display-only dokumentiert | Engine-WIP-Smoke grün |
| Generic Upgrade/Root/Server | Install, Rez, Trash-on-access, Serverbindung | Crybaby-Harness für Install, Rez, Access, Trash und Archives-Visibility grün |
| Grid/Region | City-Grid-/Region-Grenzen ohne Seiteneffekt | Region-Replacement im selben Remote mit Archives-Visibility grün; New Galveston R&D-Reveal und Paris Trace-2-Tag-Fenster grün |
| Access/Ambush | Crybaby, Dedicated Response Team, Dieter Esslin, Red Herrings, Turbeau Delacroix | Dedicated Response Team und Dieter Esslin Access-Ambush-Damage grün; Turbeau Access-Trace grün; Red Herrings Agenda-Steal-Tax grün |
| Trace/Tags/Damage | Trace-, Tag- und Damage-Fenster side-sicher | DRT Meat/Tag, Dieter Net Damage, Turbeau Access-Trace, Paris City Grid Trace-2-Tag und Omni/Paris Tag-Condition grün |
| Counter/Run | Counter- und Run-Flow-Pfade | Crystal Palace Station Grid und Dr. Dreff Power-Counter grün; Twenty-Four-Hour Surveillance Run-Start-Tax mit Stealth-/Recurring-Zahlung grün |
| Visibility | PlayerView/PublicEvent/Reconnect/Undo ohne Hidden-Info | Public payloads und Hidden-Zone-Barrieren in Engine-/Scenario-Smokes grün |
| Replay/StateHash | Deterministische Replays je Effektfamilie | Engine-Smokes replay-/StateHash-stabil |
| AI | AI-Hints, AI-Smokes, legaler Fallback | AI-Hints, AI-Smokes und Approval-Manifest für 15/15 Karten final; Paketcheck grün |
| Server/Web | Keine Payload-Leaks; Webclient-Version erst bei Abschluss | Paketchecks grün; Webclient-Version `V1.9.18` |
| Full Checks | catalog, engine, ai, server, web, typecheck, test, lint, build | JSON-Validation 272, Engine 251, Catalog 33, AI 85, Server 72, Web 76, Typecheck, Test, Lint und Build grün; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung |

## Mindestchecks im WIP-Schnitt

- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`
- JSON-Validation für `data/**/*.json`

## Abschlusschecks

Releaseabschluss vollständig erbracht. Folge-Cursor ist V1.9.19.
