# V1.9.19 Test Matrix

Status: frozen for WIP
Stand: 2026-05-13

| Bereich | Pflichtnachweis | Aktueller Stand |
| --- | --- | --- |
| Scope | Genau 20 Zielkarten | Planung eingefroren |
| No-Promotion | Keine V1.9.19-Karte im Runtime-/AI-Releasepool vor Gate | Catalog-WIP-Smoke grün |
| Displaytext | Kein `WIP` im Runtime-Text; display-only dokumentiert | Engine-WIP-Smoke grün |
| Agenda Difficulty | Score-/Steal-/Difficulty-/Overadvance-Revalidierung | Teilabdeckung grün: Score/Difficulty/Overadvance für Artificial Security Directors und Genetics-Visionary Acquisition plus Roving Submarine/Washington, D.C., City Grid als servergebundene Modifier; Steal-/Kostenpfade bleiben Folgearbeit |
| Scored Agenda | Static/Active/Forfeit/Counter-Pfade side-sicher | Teilabdeckung grün: gescorte Artificial Security Directors/Genetics-Visionary Acquisition öffnen eine side-sichere R&D-Top-Reveal-LegalAction; Forfeit-/Counter-Pfade bleiben Folgearbeit |
| Operations/Assets/Upgrades | Randpfade nur zielkartenbezogen | Teilabdeckung grün: Chicago Branch/Vapor Ops Power-Counter, Information Laundering Economy und Experimental AI Access-Ambush-Program-Trash; Operationen und weitere Ambush-/Damage-Pfade bleiben Folgearbeit |
| Visibility | PlayerView/PublicEvent/Reconnect/Undo ohne Hidden-Info | Teilabdeckung grün für gescorte V1.9.19-R&D-Reveal-Aktion; weitere Randpfade bleiben Folgearbeit |
| Replay/StateHash | Deterministische Replays je Effektfamilie | Teilabdeckung grün für Score/Difficulty/Overadvance |
| AI | AI-Hints, AI-Smokes, legaler Fallback | Draft-Hints und Draft-Smokes für 20/20 Karten angelegt; Paketcheck grün; offizielle AI-Promotion bleibt Folgearbeit |
| Server/Web | Keine Payload-Leaks; Webclient-Version erst bei Abschluss | Folgearbeit |
| Full Checks | catalog, engine, ai, server, web, typecheck, test, lint, build | JSON-Validation 277, Engine 255 nach Asset-Randpfad-Schnitt, Catalog 33, AI 85, Server 72, Web 76, Typecheck, Test, Lint und Build zuletzt grün; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung |

## Mindestchecks im ersten WIP

- JSON-Validation für `data/**/*.json`
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`
