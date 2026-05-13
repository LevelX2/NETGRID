# V1.9.17 Test Matrix

Status: frozen for WIP
Stand: 2026-05-13

| Bereich | Pflichtnachweis | Aktueller WIP-Stand |
| --- | --- | --- |
| Scope | 18/18 Zielkarten exakt | Engine- und Catalog-WIP-Smokes grün |
| No-Promotion | Keine V1.9.17-Karte in Runtime-/AI-Releasepool vor Gate | Catalog-WIP-Smoke grün |
| Displaytext | Kein `WIP` im Runtime-Text; display-only dokumentiert | Engine-WIP-Smoke grün |
| Generic Asset/Node | Install, Rez, Trash-on-access, PublicEvents | ESA-Contract-Harness grün; weitere Karten Folgearbeit |
| Campaign/Economy | Rezzed Economy-Asset-Ability mit LegalAction und applyAction-Revalidierung | Alle acht scoped Economy-Assets grün; `v1917AssetAbility` ist im Action-ID-Schlüssel gegen Mehrfachfähigkeiten geschützt |
| Recurring | Corp-Start-of-turn-Recurring ohne Akkumulation | Alle fünf scoped Recurring-Assets gemeinsam grün |
| Trace | Blood Cat und Krumz über Trace-Bid-Fenster | Blood Cat und Krumz Trace-3-Fenster grün |
| Hidden-Zone | Redigierte Choices für Corporate Negotiating Center, Rescheduler, Setup!, TRAP! | Corporate Negotiating Center Reveal und Rescheduler Korp-private Reorder-Choice grün; Setup!/TRAP! Access-Reveal grün; weitere Spezialfälle Folgearbeit |
| Access/Ambush | Setup! und TRAP! nur aus legalen Access-Fenstern | Setup!/TRAP! Access-Ambush-WIP grün |
| Damage/Tags | Solo Squad, Setup!, TRAP! und Tag-Flächen side-sicher | Solo Squad Meat Damage, Setup! Net Damage und TRAP! Net Damage plus Tag grün |
| Hosting/Recurring | Campaign-/Hosting-/Recurring-Assets ohne Akkumulation oder Host-Leak | Recurring grün; Corp-gehostete Karten kaskadieren beim Host-Trash nach Archives; weitere aktive Host-Eligibility-Fälle Folgearbeit |
| Visibility | PlayerView/PublicEvent/Reconnect/Undo ohne Hidden-Info | Folgearbeit |
| Replay/StateHash | Deterministische Replays je Effektfamilie | Folgearbeit |
| AI | AI-Hints, AI-Smokes, legaler Fallback | Folgearbeit |
| Server/Web | Keine Payload-Leaks; Webclient-Version erst bei Abschluss | Package-Gates grün; Webclient-Version bleibt offen |
| Full Checks | catalog, engine, ai, server, web, typecheck, test, lint, build | Aktueller WIP-Schnitt grün; Build mit bekannter Turbopack-NFT-Warnung |

## Mindestchecks im WIP-Schnitt

- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`
- JSON-Validation für `data/**/*.json`
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`

## Abschlusschecks

Vor Releaseabschluss müssen zusätzlich `ai`, `server`, `web`, `test`, `lint` und `build` grün sein und die Datenartefakte JSON-validiert vorliegen.
