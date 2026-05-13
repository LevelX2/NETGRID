# V1.9.22 Test Matrix

Stand: 2026-05-13
Status: planned

| Bereich | Pflichtnachweis | Aktueller Stand |
| --- | --- | --- |
| Scope | Genau 47 Zielkarten | Catalog-WIP-Guard gruen |
| No-Promotion | Keine V1.9.22-Karte im Runtime-/AI-Releasepool vor Gate | Catalog-WIP-Guard gruen |
| Resolver | Jede Karte hat Adapter oder Blocker | Runtime-Definitionen fuer 9 Runner-Hardware- und 10 Runner-Event-Zielkarten; Events mit No-`play_event`-Promotion-Guard, bis konkrete Resolver vorliegen |
| Runner-Programme | Programminstallation, MU und Breaker-Werte nur mit lokaler Wertbasis | Readiness Review und Engine-Guards halten 14/14 Programmkarten aus `playable_mvp` und ohne `install_card`-/`pump_breaker`-/`break_subroutine`-LegalActions, bis Werte bestaetigt sind |
| Corp-Longtail | Agenda-, ICE- und Operationskarten nur mit konkreten Resolvern | Engine-Guard und Corp-Readiness-Review halten 14/14 Corp-Longtailkarten aus `playable_mvp`, bis vollstaendige Zahlen-/Timing-/Kostenvertraege vorliegen |
| LegalAction/applyAction | Side, Timing, Quelle, Ziel, Kosten und Choices revalidiert | 9/9 Runner-Hardware-Install-LegalActions inkl. Wrong-Side-/Stale-Revalidation gruen |
| Visibility | Keine Hidden-Info-Leaks ueber PlayerViews/PublicEvents/Reconnect/Undo | 9/9 Runner-Hardware-Install-PublicPayloads und PlayerViews gruen |
| Replay/StateHash | Neue Effekte sind deterministisch replaybar | 9/9 Runner-Hardware-Install-Replay/StateHash gruen |
| AI | Hints, Smokes und side-sichere Fallbacks fuer alle `ai_supported` Karten | No-Promotion-Guard fuer 47/47 WIP-Karten gruen; AI-Hints/-Smokes fuer Promotion bleiben Folgearbeit |
| WIP-Artefakte | Manifest, Mechanics-Coverage und WIP-Szenario bleiben exakt zur 47er-Zielmenge und behaupten keine Promotion | Catalog-Artefakt-Alignment-Guard gruen |
| Server/Web | Webclient-Version erst bei Abschluss | Web-Catalog-No-Promotion- und Webclient-Version-Guard gruen; Webclient-Version bleibt Folgearbeit fuer Abschluss |
| Full Checks | catalog, engine, ai, server, web, typecheck, test, lint, build | Gruen fuer WIP-Artefakt-/AI-/Web-No-Promotion-Guard: JSON 302, catalog 37, engine 278, ai 86, server 72, web 79, typecheck, test, lint, build |

## Mindestchecks im ersten WIP

- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`

## Breiter WIP-Verify 2026-05-13 17:35 CEST

- JSON-Validation fuer `data/**/*.json`: pass, 302 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 36 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 278 Tests nach Runner-Programm-No-Playable-/No-LegalAction- und Corp-Longtail-No-Playable-Runtime-Guards.

## Runner-Programm-No-LegalAction-Guard 2026-05-13 18:00 CEST

- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 278 Tests.
- Zusatzabdeckung: 14/14 V1.9.22-Runner-Programmkarten oeffnen ohne lokal bestaetigte Kosten-/MU-/Breakerwerte keine `install_card`-, `pump_breaker`- oder `break_subroutine`-LegalActions.
- Runner-Event-Readiness ist dokumentiert; kein `play_event`-Resolver wurde ohne vollstaendigen lokalen Vertrag erfunden.
- Corp-Longtail-Readiness ist dokumentiert; kein Agenda-, ICE- oder Operations-Resolver wurde ohne vollstaendigen lokalen Vertrag erfunden.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 85 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 77 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass, Exit 0.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## WIP-Artefakt-Alignment-Guard 2026-05-13 18:10 CEST

- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 37 Tests.
- Zusatzabdeckung: `data/manifests/card-implementation-manifest-1.9.22.json`, `data/scenarios/v1922-per-card-longtail-wip-smoke.json` und `data/rules/mechanics-coverage-1.9.22.json` muessen exakt die 47 Karten aus `ONR_V1_9_22_WIP_CARD_IDS` abdecken.
- Zusatzabdeckung: neun Hardwarekarten muessen Install-Smokes, zehn Eventkarten den No-`play_event`-Guard und 28 Program-/Corp-Karten `planned_no_promotion` ausweisen.
- Zusatzabdeckung: Catalog-/AI-Promotion bleibt in Manifest, Szenario, Coverage und Runtime-Catalog fuer alle 47 Karten false.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 278 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 86 Tests inkl. Guard, dass 47/47 V1.9.22-WIP-Karten nicht `ai_supported`, `human_playable` oder `deck_legal` sind.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 79 Tests inkl. Guard, dass 47/47 V1.9.22-WIP-Karten nicht im `ai_supported`-Filter erscheinen, sichtbare Detailantworten nicht promotet sind und der Webclient vor Abschluss weiter `V1.9.21` zeigt.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.

