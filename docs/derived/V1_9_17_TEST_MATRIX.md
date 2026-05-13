# V1.9.17 Test Matrix

Status: final
Stand: 2026-05-13 12:12 CEST

| Bereich | Pflichtnachweis | Aktueller WIP-Stand |
| --- | --- | --- |
| Scope | 18/18 Zielkarten exakt | Release-Smokes und Catalog-Promotion grün |
| Promotion | Alle V1.9.17-Karten in Runtime-/AI-Releasepool erst nach Gate | `ONR_V1_9_17_RELEASE_CARD_IDS` und `DECK_LEGAL_AI_APPROVAL_V1917_CARD_IDS` grün |
| Displaytext | Kein `WIP` im Runtime-Text; display-only dokumentiert | Engine- und Final-Review grün |
| Generic Asset/Node | Install, Rez, Trash-on-access, PublicEvents | ESA-Contract-Harness und Release-Smoke grün |
| Campaign/Economy | Rezzed Economy-Asset-Ability mit LegalAction und applyAction-Revalidierung | Alle acht scoped Economy-Assets grün; `v1917AssetAbility` ist im Action-ID-Schlüssel gegen Mehrfachfähigkeiten geschützt |
| Recurring | Corp-Start-of-turn-Recurring ohne Akkumulation | Alle fünf scoped Recurring-Assets gemeinsam grün |
| Trace | Blood Cat und Krumz über Trace-Bid-Fenster | Blood Cat und Krumz Trace-3-Fenster grün |
| Hidden-Zone | Redigierte Choices für Corporate Negotiating Center, Rescheduler, Setup!, TRAP! | Corporate Negotiating Center Reveal und Rescheduler Korp-private Reorder-Choice grün; Setup!/TRAP! Access-Reveal grün |
| Access/Ambush | Setup! und TRAP! nur aus legalen Access-Fenstern | Setup!/TRAP! Access-Ambush-WIP grün |
| Damage/Tags | Solo Squad, Setup!, TRAP! und Tag-Flächen side-sicher | Solo Squad Meat Damage, Setup! Net Damage und TRAP! Net Damage plus Tag grün |
| Hosting/Recurring | Campaign-/Hosting-/Recurring-Assets ohne Akkumulation oder Host-Leak | Recurring grün; Corp-gehostete Karten kaskadieren beim Host-Trash nach Archives |
| Installierte Ziele/Counter | Cowboy Sysop und Disinfectant, Inc. mit sichtbaren Zielen | Installierte Runner-Ziele und Virus-Counter-Ziele grün |
| Visibility | PlayerView/PublicEvent/Reconnect/Undo ohne Hidden-Info | Engine-, Scenario- und Catalog-Gates grün |
| Replay/StateHash | Deterministische Replays je Effektfamilie | Engine-Smokes grün |
| AI | AI-Hints, AI-Smokes, legaler Fallback | V1.9.17-AI-Artefakte und AI-Gate grün |
| Server/Web | Keine Payload-Leaks; Webclient-Version erst bei Abschluss | Server/Web grün; Webclient-Version `V1.9.17` |
| Full Checks | catalog, engine, ai, server, web, typecheck, test, lint, build | Final grün; Build mit bekannter Turbopack-NFT-Warnung |

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
