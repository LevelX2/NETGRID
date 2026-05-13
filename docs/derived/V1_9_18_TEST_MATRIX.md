# V1.9.18 Test Matrix

Status: frozen for WIP
Stand: 2026-05-13

| Bereich | Pflichtnachweis | Aktueller WIP-Stand |
| --- | --- | --- |
| Scope | 15/15 Zielkarten exakt | Engine- und Catalog-WIP-Smokes grün |
| No-Promotion | Keine V1.9.18-Karte in Runtime-/AI-Releasepool vor Gate | Catalog-WIP-Smoke grün |
| Displaytext | Kein `WIP` im Runtime-Text; display-only dokumentiert | Engine-WIP-Smoke grün |
| Generic Upgrade/Root/Server | Install, Rez, Trash-on-access, Serverbindung | Crybaby-Harness für Install, Rez, Access, Trash und Archives-Visibility grün; weitere Karten Folgearbeit |
| Grid/Region | City-Grid-/Region-Grenzen ohne Seiteneffekt | Folgearbeit |
| Access/Ambush | Crybaby, Dedicated Response Team, Dieter Esslin, Red Herrings, Turbeau Delacroix | Dedicated Response Team und Dieter Esslin Access-Ambush-Damage grün; Turbeau Access-Trace grün; Red Herrings Agenda-Steal-Tax grün |
| Trace/Tags/Damage | Trace-, Tag- und Damage-Fenster side-sicher | DRT Meat/Tag, Dieter Net Damage und Turbeau Trace-Bid grün; weitere Karten Folgearbeit |
| Counter/Run | Counter- und Run-Flow-Pfade | Folgearbeit |
| Visibility | PlayerView/PublicEvent/Reconnect/Undo ohne Hidden-Info | Folgearbeit |
| Replay/StateHash | Deterministische Replays je Effektfamilie | Folgearbeit |
| AI | AI-Hints, AI-Smokes, legaler Fallback | Folgearbeit |
| Server/Web | Keine Payload-Leaks; Webclient-Version erst bei Abschluss | Folgearbeit |
| Full Checks | catalog, engine, ai, server, web, typecheck, test, lint, build | JSON-Validation, Engine 248, Catalog 32 und Typecheck grün; Full Checks Folgearbeit |

## Mindestchecks im WIP-Schnitt

- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`
- JSON-Validation für `data/**/*.json`

## Abschlusschecks

Vor Releaseabschluss müssen zusätzlich JSON-Validation, `ai`, `server`, `web`, `test`, `lint` und `build` grün sein und die Datenartefakte JSON-validiert vorliegen.
