# V1.9.18 Test Matrix

Status: frozen for WIP
Stand: 2026-05-13

| Bereich | Pflichtnachweis | Aktueller WIP-Stand |
| --- | --- | --- |
| Scope | 15/15 Zielkarten exakt | Engine- und Catalog-WIP-Smokes grün |
| No-Promotion | Keine V1.9.18-Karte in Runtime-/AI-Releasepool vor Gate | Catalog-WIP-Smoke grün |
| Displaytext | Kein `WIP` im Runtime-Text; display-only dokumentiert | Engine-WIP-Smoke grün |
| Generic Upgrade/Root/Server | Install, Rez, Trash-on-access, Serverbindung | Crybaby-Harness für Install, Rez, Access, Trash und Archives-Visibility grün; weitere Karten Folgearbeit |
| Grid/Region | City-Grid-/Region-Grenzen ohne Seiteneffekt | Region-Replacement im selben Remote mit Archives-Visibility grün; New Galveston R&D-Reveal und Paris Trace-2-Tag-Fenster grün; weitere City-Grid-Sonderfälle Folgearbeit |
| Access/Ambush | Crybaby, Dedicated Response Team, Dieter Esslin, Red Herrings, Turbeau Delacroix | Dedicated Response Team und Dieter Esslin Access-Ambush-Damage grün; Turbeau Access-Trace grün; Red Herrings Agenda-Steal-Tax grün |
| Trace/Tags/Damage | Trace-, Tag- und Damage-Fenster side-sicher | DRT Meat/Tag, Dieter Net Damage, Turbeau Access-Trace, Paris City Grid Trace-2-Tag und Omni/Paris Tag-Condition grün; weitere Karten Folgearbeit |
| Counter/Run | Counter- und Run-Flow-Pfade | Crystal Palace Station Grid und Dr. Dreff Power-Counter grün; Twenty-Four-Hour Surveillance Run-Start-Tax mit Stealth-/Recurring-Zahlung grün; weitere Run-Flow-Sonderfälle Folgearbeit |
| Visibility | PlayerView/PublicEvent/Reconnect/Undo ohne Hidden-Info | Folgearbeit |
| Replay/StateHash | Deterministische Replays je Effektfamilie | Folgearbeit |
| AI | AI-Hints, AI-Smokes, legaler Fallback | Draft-Hints und Draft-Smokes für 15/15 Karten angelegt; Paketcheck grün; offizielle AI-Promotion bleibt Folgearbeit |
| Server/Web | Keine Payload-Leaks; Webclient-Version erst bei Abschluss | Paketchecks grün; Webclient-Version bleibt bis Abschluss Folgearbeit |
| Full Checks | catalog, engine, ai, server, web, typecheck, test, lint, build | JSON-Validation 271, Engine 251, Catalog 32, AI 85, Server 72, Web 76, Typecheck, Test, Lint und Build grün; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung |

## Mindestchecks im WIP-Schnitt

- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`
- JSON-Validation für `data/**/*.json`

## Abschlusschecks

Vor Releaseabschluss müssen zusätzlich das offizielle Release-Smoke-Artefakt, das offizielle AI-Approval-Manifest, Final Review, Release-Promotion und Webclient-Version `V1.9.18` vorliegen. Die Draft-Manifest-/Coverage-/AI-Artefakte sind vorbereitet; die technischen Full Checks sind in diesem WIP-Schnitt grün.
