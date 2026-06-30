# Classic Full Card Implementation Process

Status: `active`

Quelle/Vorgabe: Nutzerauftrag vom 2026-06-30 im Codex-Thread, verbindliche Kartendaten aus `data/cards/classic-cards.json`, aktueller Freigabestand aus `data/manifests/classic-card-support.json`.

## Zielprüfung

Der Auftrag ist ausreichend präzise für automatische Abarbeitung:

- Gesamtziel: 52/52 Classic-Karten vollständig implementiert, human-playable, deck- und formatlegal in den Classic-Formatprofilen sowie AI-supported.
- Reihenfolge: CLASSIC-00 bis CLASSIC-11 ist vorgegeben und sequenziell.
- Scope: Engine, Catalog/Manifest, Deck-/Formatauswahl, Matchstart-UI, AI-Hints, AI-Smokes, Tests, Dokumentation, Paketcommits und lokaler Merge nach `main`.
- Nicht-Ziele: Push, Pull Request, Remote-Integration, eigenständig spielbares Classic ohne Originalset, Kopplung von Kartenbild-/Catalog-Sichtbarkeit an Engine-Freigabe.
- Sicherheitsgrenzen: Rules Engine bleibt Regelautorität, LegalActions-only, `applyAction` revalidiert, Hidden-Info-Schutz und deterministisches Replay/StateHash bleiben Gates.

## Gesamtziel

Alle 52 Classic-Karten aus `data/cards/classic-cards.json` werden in einem eigenen Worktree auf `codex/classic-full-card-implementation` paketweise umgesetzt. Der finale Stand muss lokal nach `main` integriert und auf `main` verifiziert sein, bevor das Goal abgeschlossen werden darf.

## Annahmen

- `classic` ist ein optionales Zusatzset, das nur additiv zum Originalset aktivierbar ist.
- Classic-Kartenbilder und Catalog-Sichtbarkeit bleiben getrennt von Engine-, Deck-, Format- und AI-Freigabe.
- Lokale Regelentscheidungen sind zulässig, sofern sie die globalen NETGRID-Prinzipien nicht verletzen.
- Bei unvollständig vorhandenen generischen Mechaniken wird die Mechanik implementiert, statt die Karte dauerhaft zurückzustellen.
- AI-Support bedeutet mindestens side-sichere Hints/Scenarios/Smokes, die ausschließlich aus LegalActions wählen.

## Nicht-Ziele

- Keine externe Kartendatenbank und keine offiziellen Artworks, Frames, Logos oder Card Backs.
- Keine Rückwärtskompatibilitätsarbeit für alte lokale Daten, Replays oder Legacy-Formate.
- Keine produktive Remote-Integration, kein Push, kein PR.
- Keine Hidden-Info-Erweiterung in PlayerViews, PublicEvents, AI-Inputs, WebSocket-/Reconnect-Payloads, Replays, Logs oder Client-Fehlern.
- Keine eigenständige Classic-only-Formatfreigabe ohne Originalset.

## Controller-Invarianten

- Engine-Korrektheit hat Vorrang vor UI-Komfort.
- Die Rules Engine ist die einzige Regelautorität.
- UI, Server, menschliche Spieler und KI reichen nur `PlayerActions` aus `LegalActions` ein.
- `applyAction` validiert Seite, `actionId`, `stateVersion`, Timingpunkt, Kosten, Ziele und Choices erneut.
- Zufall läuft über Seed, `randomCounter` und `RandomDrawRecords`.
- Jede freigegebene Karte braucht eine CardImplementation, Registry-Eintrag, Manifest-Status, AI-Hint und Szenario-/Smoke-Referenz.

## Automatische Fehlerbehandlung

- Testfehler werden im aktuellen Paket eng behoben; es wird nicht zum nächsten Paket gewechselt.
- Bei Drift zwischen Daten, Manifest, Registry, AI-Hints oder Szenarien wird der Guard oder das jeweilige Artefakt angepasst.
- Bei Zielkonflikten mit Hidden-Info, Replay/StateHash oder LegalActions wird ein Blocker-Report geschrieben und nicht weiterpromotet.
- Bei Merge-Konflikten werden beide fachlichen Intentionen gelesen und defensiv integriert.

## Sicherheitsblocker

Ein Paket stoppt, wenn eine Änderung verdeckte Kartendaten in öffentliche oder gegnerische Sicht projiziert, eine Action außerhalb von `LegalActions` erzeugt, `applyAction`-Revalidierung umgeht, nicht deterministischen Zufall einführt oder Replay/StateHash unstabil macht.

## State Machine

1. `preflight`: Hauptworkspace und Worktree prüfen, fremde Änderungen klassifizieren.
2. `package_active`: genau ein CLASSIC-Paket ist aktiv.
3. `package_verify`: Paketchecks und `git diff --check` laufen.
4. `package_commit`: nur paketzugehörige Änderungen werden committed.
5. `main_sync_optional`: nach stabilen Abschnitten darf lokal nach `main` integriert und wieder weitergearbeitet werden.
6. `final_gate`: CLASSIC-11 prüft Gesamtstatus, relevante Workspace-Checks und Dokumentation.
7. `main_integrated`: Arbeitsbranch ist lokal nach `main` gemerged, `main` ist geprüft, Worktree ist entfernt.

## Classic-Inventar

| Paket | Karten | Mechanikfamilien |
| --- | --- | --- |
| CLASSIC-03 | Corporate Shuffle, Reclamation Project, Finders Keepers, Meat Upgrade, Networking, Panzer Run | einfache Draw-/Economy-/Tag-Remove-/Random-/Double-Aktionen |
| CLASSIC-04 | Early Worm, Matador, MS-todon, Psychic Friend, Rent-I-Con, Schematics Search Engine, Superglue | Icebreaker, noisy break, rungebundene Trash-/Derez-/Expose-Fälle |
| CLASSIC-05 | Baskerville, Bolter Swarm, Brain Drain, Deadeye, Imperial Guard, Puzzle | Sentry/AP/Killer, Damage, Trace-Counter, noisy rez discount, end-of-turn trash |
| CLASSIC-06 | Dumpster, Entrapment, Trapdoor, Vortex, Glacier | Deflector, Run-Zielwechsel, Encounter-Repositioning, Install-Restrictions, agenda-point rez cost, start-of-run ICE move |
| CLASSIC-07 | Data Fort Remapping, Superserum, Unlisted Research Lab, Theorem Proof | Score-Fähigkeiten, Virus-Counter-Vermeidung, Extra-Draw, Access-Replacement/Install-as-program |
| CLASSIC-08 | Indiscriminate Response Team, London City Grid, Satellite Monitors, Self-Destruct, Shock Treatment, Sterdroid, Strategic Planning Group, Street Enforcer | Access-/Run-Trigger, Ambush, Region, Draw Replacement, Die Rolls, Strength Modifier, Tag Tax |
| CLASSIC-09 | Boostergang Connections, Corruption, Do the 'Drine, Gypsy Schedule Analyzer, Library Search, Running Interference, Crash Space, Elena Laskova, Executive File Clerk, Little Black Box, Omnitech "Spinal Tap" Cybermodem, Omnitech Wet Drive, Sandbox Dig, Vintage Camaro, Zetatech Portastation, Badtimes | Search/Reorder/Reveal, agenda-point transfer, unpreventable damage, recurring/restricted credits, trace auto-success, base MU, prevention/avoid, temporary MU reduction |

## Kartenliste und Testbedarf

| ID | Karte | Side/Typ | Primäre Rolle | Testbedarf |
| --- | --- | --- | --- | --- |
| onr_classic_001_data-fort-remapping | Data Fort Remapping | corp/agenda | Score counter, paid end-run | Score-Trigger, Counter-Verbrauch, Run-Ende, Replay |
| onr_classic_002_superserum | Superserum | corp/agenda | Virus cleanup/prevention | Score-Trigger, Virus-Counter-Entfernung, nächste zwei Virus-Counter vermeiden |
| onr_classic_003_unlisted-research-lab | Unlisted Research Lab | corp/agenda | Extra turn draw | Start-of-turn Draw, deterministische DrawRecords |
| onr_classic_004_theorem-proof | Theorem Proof | corp/agenda | Access replacement, Runner program | Access nicht scorebar, Install-as-program, Runner-Score-Ability |
| onr_classic_005_baskerville | Baskerville | corp/ice | Net damage, trace counter, noisy rez discount | Subroutines, Trace, Runner-Counter-Removal, noisy discount |
| onr_classic_006_bolter-swarm | Bolter Swarm | corp/ice | Net damage, next-ICE break lock | Damage, next encounter break prevention, noisy discount |
| onr_classic_007_brain-drain | Brain Drain | corp/ice | Die roll brain damage | Seeded die roll, unprevented/normal brain damage path |
| onr_classic_008_deadeye | Deadeye | corp/ice | Program trash, ETR | Target choice, noisy discount |
| onr_classic_009_dumpster | Dumpster | corp/ice | Archives deflector | Install restriction, target change, empty Archives ICE fallback |
| onr_classic_010_entrapment | Entrapment | corp/ice | Paid deflector | Corp payment, target fort choice, encounter reposition |
| onr_classic_011_glacier | Glacier | corp/ice | Agenda-point rez cost, movable wall | Rez cost, ETR x2, start-of-run move/reveal |
| onr_classic_012_imperial-guard | Imperial Guard | corp/ice | Program trash, ETR | Target choice, noisy discount |
| onr_classic_013_puzzle | Puzzle | corp/ice | ETR with delayed trash | ETR, end-of-turn trash once |
| onr_classic_014_trapdoor | Trapdoor | corp/ice | Subsidiary deflector | Install restriction, no remote fallback auto-break |
| onr_classic_015_vortex | Vortex | corp/ice | Paid deflector | Corp payment, any fort target, encounter reposition |
| onr_classic_016_badtimes | Badtimes | corp/operation | Temporary MU reduction | Tagged-only legality, end-of-turn expiry, MU pressure |
| onr_classic_017_corporate-shuffle | Corporate Shuffle | corp/operation | Double draw/shuffle | Two-action cost, draw five, HQ-to-R&D choice, shuffle |
| onr_classic_018_reclamation-project | Reclamation Project | corp/operation | Double Archives recursion | Two-action cost, Archives search, reveal, HQ store |
| onr_classic_019_indiscriminate-response-team | Indiscriminate Response Team | corp/asset | Successful-run hand shuffle | Optional trigger, hidden hand count redaction, DrawRecords |
| onr_classic_020_london-city-grid | London City Grid | corp/upgrade | Region noisy tax | Region install/rez rule, noisy breaker tax on fort |
| onr_classic_021_satellite-monitors | Satellite Monitors | corp/asset | Start-turn die roll tags | Run-count memory, seeded rolls, tag events |
| onr_classic_022_self-destruct | Self-Destruct | corp/upgrade | Access ambush trash/damage | Subsidiary install, access-only tap, fort trash, damage |
| onr_classic_023_shock-treatment | Shock Treatment | corp/upgrade | Tagged access ambush | Four-tag condition, hardware/program trash targeting |
| onr_classic_024_sterdroid | Sterdroid | corp/upgrade | Temporary ICE strength double | Paid tap, cap at 10, end-of-turn expiry |
| onr_classic_025_strategic-planning-group | Strategic Planning Group | corp/asset | Draw replacement | Extra draw, bottom one drawn card, unique rule |
| onr_classic_026_street-enforcer | Street Enforcer | corp/upgrade | Start-run tag tax | Fort-bound start-run trigger, credit loss by tags |
| onr_classic_027_early-worm | Early Worm | runner/program | Wall breaker | Break wall, pump strength |
| onr_classic_028_matador | Matador | runner/program | Sentry breaker | Break sentry, pump strength |
| onr_classic_029_ms-todon | MS-todon | runner/program | Noisy sentry breaker | Noisy flag, first sentry break tag, stealth-credit loss |
| onr_classic_030_psychic-friend | Psychic Friend | runner/program | Code gate breaker | Break code gate, run/end-turn pump duration |
| onr_classic_031_rent-i-con | Rent-I-Con | runner/program | Universal disposable breaker | Break any subroutine, pump, end-of-run trash |
| onr_classic_032_schematics-search-engine | Schematics Search Engine | runner/program | HQ access expose | HQ access trigger, installed-card expose redaction |
| onr_classic_033_superglue | Superglue | runner/program | Post-break derez | Just-broken-all gate, tap, derez |
| onr_classic_034_boostergang-connections | Boostergang Connections | runner/event | Hand-to-stack tutor | Trash hand count, stack search, shuffle |
| onr_classic_035_corruption | Corruption | runner/event | Agenda point transfer | Turn-scored agenda gate, point loss/gain, credits, tag |
| onr_classic_036_do-the-drine | Do the 'Drine | runner/event | Unpreventable brain damage economy | Choice bounds, no flatline, no prevent, credit gain |
| onr_classic_037_finders-keepers | Finders Keepers | runner/event | Random economy | Three seeded dice, credit gain |
| onr_classic_038_gypsytm-schedule-analyzer | Gypsy Schedule Analyzer | runner/event | R&D run reveal/store | Replacement access, reveal until agenda, HQ store, shuffle |
| onr_classic_039_library-search | Library Search | runner/event | Conditional multiaccess | R&D/HQ run, noisy/trace exclusion, +2 access |
| onr_classic_040_meat-upgrade | Meat Upgrade | runner/event | Double tag removal/draw | Two-action cost, remove up to two tags, draw three |
| onr_classic_041_networking | Networking | runner/event | Double economy | Two-action cost, gain 9 |
| onr_classic_042_panzer-run | Panzer Run | runner/event | Double economy/draw | Two-action cost, gain 4, draw two |
| onr_classic_043_running-interference | Running Interference | runner/event | Double run rez tax | Generic run choice, rez surcharge by printed rez cost |
| onr_classic_044_crash-space | Crash Space | runner/resource | Recurring credit, trace auto-success, self-trash | Start-turn credit, trace replacement, leave-play loss |
| onr_classic_045_elena-laskova | Elena Laskova | runner/resource | Prep economy boost | First prep bit-gain bonus, unique rule |
| onr_classic_046_executive-file-clerk | Executive File Clerk | runner/resource | Hidden HQ look | Hidden install/trash, paid tap, HQ view redaction |
| onr_classic_047_little-black-box | Little Black Box | runner/hardware | Deck, MU/hand size, prevention/link credit | Deck uniqueness, prevention budget, recurring restricted credit |
| onr_classic_048_omnitech-spinal-tap-cybermodem | Omnitech "Spinal Tap" Cybermodem | runner/hardware | Deck, restricted credits, random brain damage | Recurring credits, die roll, unpreventable damage, leave-play damage |
| onr_classic_049_omnitech-wet-drive | Omnitech Wet Drive | runner/hardware | Dynamic base MU | Base MU equals hand count, install/trash recalculation |
| onr_classic_050_sandbox-dig | Sandbox Dig | runner/resource | Hidden R&D look | Hidden install/trash, paid tap, top-three R&D view |
| onr_classic_051_vintage-camaro | Vintage Camaro | runner/hardware | Tag avoid with action debt | Avoid timing, future action debt, payment |
| onr_classic_052_zetatech-portastation | Zetatech Portastation | runner/hardware | Prep-only recurring credit | Recurring restricted credit, start-turn refill |

## Paketfolge

| Paket | Ziel | Done-Gate | Commit-Message |
| --- | --- | --- | --- |
| CLASSIC-00 | Prozess, Inventar, Regelentscheidungen | Artefakte vorhanden, 52 Karten inventarisiert, Nicht-Ziele dokumentiert | `docs: add classic full implementation process` |
| CLASSIC-01 | Foundation für Classic-Definitions, Registry und Guards | 52 Datenkarten, 52 Manifestkarten, Registry-/resolverRef-/Status-/AI-/Scenario-Drift geprüft | `feat(engine): add classic implementation foundation` |
| CLASSIC-02 | Additive Format- und Matchstart-Auswahl | Original, Original+Classic, Original+Protheus, Original+Classic+Protheus auswählbar und serverseitig revalidiert | `feat(match): support additive classic card pools` |
| CLASSIC-03 | einfache Economy/Draw/Double Basics | sechs Karten implementiert, AI-Hints/Smokes grün | `feat(engine): implement classic basic economy cards` |
| CLASSIC-04 | Runner-Programme und Breaker | sieben Karten implementiert, noisy/run-bound effects getestet | `feat(engine): implement classic runner programs` |
| CLASSIC-05 | Corp ICE Baseline und Noisy/Sleepy | sechs ICE implementiert, Damage/Trace/noisy/Puzzle-Gates grün | `feat(engine): implement classic baseline ice` |
| CLASSIC-06 | Deflector/Run-Redirect/Glacier | fünf Karten implementiert, Replay/StateHash/Visibility getestet | `feat(engine): implement classic run redirect ice` |
| CLASSIC-07 | Classic Agendas | vier Agendas implementiert, Score-/Access-Trigger grün | `feat(engine): implement classic agendas` |
| CLASSIC-08 | Corp Assets/Upgrades/Ambush | acht Karten implementiert, Access-/Run-Trigger grün | `feat(engine): implement classic corp assets and upgrades` |
| CLASSIC-09 | Runner Events/Resources/Hardware | sechzehn Runner-/Corp-Restkarten implementiert, Such-/Damage-/Credit-/Avoid-Gates grün | `feat(engine): implement remaining classic runner cards` |
| CLASSIC-10 | AI und Deckspielbarkeit | Active/compiled hints, scenarioRefs, AI-Deckpool und AI-Smokes aktualisiert | `feat(ai): enable classic deck playability` |
| CLASSIC-11 | Final Completion Gate | 52/52 Status grün, relevante Checks bestanden, lokal nach `main` gemerged, Worktree entfernt | `docs: finalize classic full implementation` |

## Verifikationsregeln

- Pro Paket mindestens gezielte Unit-/Scenario-Tests für geänderte Engine-/AI-/Web-Bereiche.
- Immer vor Commit: `git diff --check`.
- Bei Status-/Manifeständerungen: Guard gegen Kartendaten, Supportmanifest, Registry, resolverRefs, AI-Hints und SzenarioRefs.
- Bei finalem Gate: mindestens `corepack pnpm typecheck`, relevante Package-Tests, workspace tests soweit praktikabel, `corepack pnpm lint`/`corepack pnpm build` soweit für den geänderten Umfang nötig, plus `git diff --check`.

## Paket-Verify-Log

| Paket | Datum | Ergebnis | Kommandos |
| --- | --- | --- | --- |
| CLASSIC-02 | 2026-06-30 | grün | `node -e "JSON.parse(require('fs').readFileSync('data/decks/deck-format-profiles-1.3.0.json','utf8'))"`, `corepack pnpm --filter @netgrid/shared typecheck`, `corepack pnpm --filter @netgrid/decks typecheck`, `corepack pnpm --filter @netgrid/server typecheck`, `corepack pnpm --filter @netgrid/web typecheck`, `corepack pnpm --filter @netgrid/decks exec vitest run src/index.test.ts`, `corepack pnpm --filter @netgrid/web exec vitest run app/match-start.test.ts app/match-start-storage.test.ts app/deck-match-filters.test.ts app/api/decks/strategy-profile/strategy-profile-data.test.ts app/deck-strategy-profile-ui.test.ts`, `corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts -t "enforces the selected match card pool"`, `git diff --check` |
| CLASSIC-03 | 2026-06-30 | grün | `node -e "for (const file of ['data/manifests/classic-card-support.json','data/ai/ai-card-hints-active.json','data/ai/ai-card-hints-compiled.json','data/scenarios/classic-03-simple-operation-event-smoke.json']) JSON.parse(require('fs').readFileSync(file,'utf8'))"`, `corepack pnpm --filter @netgrid/engine typecheck`, `corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/definition-descriptors.test.ts src/game/play/corp-operation-resolution.test.ts src/game/turn/runner-main-actions.test.ts src/game/hidden-zone/nonsearch-choice-handlers.test.ts`, `corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts`, `corepack pnpm check:engine-cardimplementation-architecture-target`, `corepack pnpm check:card-function-abstraction`, `git diff --check` |

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_CLASSIC_FULL_CARD_IMPLEMENTATION`.
- Arbeitsbranch: `codex/classic-full-card-implementation`.
- Hauptworkspace `C:\Projekte\NETGRID` wird nur für Preflight und finale lokale `main`-Integration genutzt.
- Kein Push, kein PR, keine Remote-Integration.
- Fremde Änderungen im Hauptworkspace bleiben unangetastet und werden nicht revertiert.
- Jedes Paket wird einzeln committed.

## Abschlusskriterien

- Alle Classic-Karten haben konkrete CardImplementation-Dateien und Registry-Einträge.
- `data/manifests/classic-card-support.json` meldet für 52/52 Karten `implemented`, `engine_supported`, `playable`, `human_playable`, `deck_legal`, `format_legal` und `ai_supported`.
- Alle Classic-Karten haben resolverRefs, AI-Hints und SzenarioRefs.
- Deck-/Formatauswahl ist additiv und verbietet Classic-only.
- AI nutzt nur ai-supported Karten.
- Final Review ist geschrieben, Webclient-Version/Status ist nach Projektkonvention aktualisiert, Arbeitsbranch ist lokal nach `main` integriert und `main` ist verifiziert.
