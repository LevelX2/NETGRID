# Engine CardImplementation Architecture Iteration 2 Process

Datum: 2026-06-23
Branch: `codex/engine-card-architecture-iteration2`
Worktree: `C:\Projekte\NETGRID_engine_card_architecture_iteration2`

## Goal

Die Regelengine soll Karten moeglichst nicht ueber kartennamenspezifische Runtime-Sonderfaelle ausfuehren, sondern ueber deklarative, wiederverwendbare CardImplementation-Bausteine.

Zielbild:

```text
CardImplementation-Datei einer Karte
-> deklarativer generischer Funktionsbaustein mit Parametern
-> generischer Ability-/Effect-/Runtime-Interpreter
-> Engine fuehrt die Regel korrekt aus
-> LegalActions bleiben Engine-Autoritaet
-> keine kartennamenspezifische Sonderlogik ausserhalb Katalog/Test/Registry, soweit vermeidbar
```

## Leitplanken

- Keine Spielregelverschlechterung.
- Engine bleibt Regelautoritaet.
- Kartennamen bleiben in CardImplementation-Dateien, Katalog, Tests und Reports erlaubt; funktionale Runtime-Namen muessen generisch sein.
- Keine Hidden-Info-Grenzen aufweichen.
- Keine KI-Spieler-Arbeit in diesem Prozess.
- Wegen Nutzeranweisung keine `git status`- oder `git diff`-Pruefungen.

## Ausgangsbefund

- `corepack pnpm check:card-function-abstraction` besteht und meldet 151 bekannte Baseline-Findings.
- Vorherige Iteration hat zentrale Runtime-Kinds fuer Silver Lining, Omniscience, Fortress Respecification, Social Engineering, New Blood und Shell Traders bereits generisch benannt.
- Sichtbare Restkandidaten liegen vor allem in:
  - Shell-Traders-Hidden-Zone-Aktionsnamen und Runtime-Feldnamen.
  - Omniscience-Tag-Cause/Payload-Resten.
  - Social-Engineering-Public-Event-/Fehlertext-Resten.
  - Code-Viral-Cache-Resolver-/Delegate-Namen.
  - einem weiterhin sehr grossen `effect-interpreter.ts`.
  - weiteren expliziten Mechanics-ID-Sets.
  - einer weiterhin importlastigen Registry mit bisher nur einer Subregistry.

## Iterationen

### Paket 1: Prozessstart und objektive Baseline

Status: abgeschlossen

Umfang:

- Eigenen Worktree und Branch angelegt.
- Card-Function-Abstraction-Guard als Baseline ausgefuehrt.
- Prozessartefakt angelegt.

Checks:

- `corepack pnpm check:card-function-abstraction` -> bestanden, 151 Baseline-Findings.

### Paket 2: Kartennamenspezifische Runtime-Reste

Status: abgeschlossen

Ziel:

- Generische Namen fuer verbleibende funktionale Runtime-, Hidden-Zone-, Cause-, Payload- und Resolverpfade, soweit ohne Regelrisiko moeglich.

Umgesetzt:

- `shellTradersAbility` durch `delayedInstallAbility` ersetzt.
- `shellTradersStartTurnResolvedSourceIds` durch `delayedInstallStartTurnResolvedSourceIds` ersetzt.
- `shell_traders_set_aside` durch `delayed_install_set_aside` ersetzt.
- `runner.start.shell_traders...` durch `runner.start.delayed_install...` ersetzt.
- `shellTradersInstalledTarget` durch `delayedInstallInstalledTarget` ersetzt.
- `omniscience_foundation` als Tag-Cause durch `end_turn_tag_if_runner_received_tag` ersetzt.
- `omniscienceFoundationTagsAdded` durch `endTurnTagIfRunnerReceivedTagAdded` ersetzt.
- Card-Function-Abstraction-Report von 151 auf 147 Findings aktualisiert.

Checks:

- `corepack pnpm --filter @netgrid/engine test -- game/engine-runtime-internal/runtime-module-size.test.ts game/abilities/runner-special-trigger-execution.test.ts game/turn/runner-special-zone-install-actions.test.ts game/state/turn-flags-counters.test.ts compatibility/compatibility.test.ts` -> bestanden.
- `corepack pnpm --filter @netgrid/engine typecheck` -> bestanden.
- `corepack pnpm --filter @netgrid/shared typecheck` -> bestanden.
- `corepack pnpm check:card-function-abstraction` -> bestanden, 147 Baseline-Findings im Arbeitsbranch; nach Integration auf `main` 145 Baseline-Findings.

### Paket 3: Effect-Familien

Status: abgeschlossen

Ziel:

- Weitere klar abgrenzbare Effektfamilien aus dem zentralen Interpreter herausziehen.

Umgesetzt:

- Neue Familie `bad-publicity-effects.ts` fuer `add_bad_publicity` und `add_bad_publicity_from_frame_up_history`.
- Neue Familie `counter-effects.ts` fuer Source-Counter und Counter auf alle installierten Runner-Icebreaker.
- Neue Familie `hosted-credit-effects.ts` fuer gehostete Credits und Trash-on-empty.
- Neue Familie `advancement-effects.ts` fuer Advancement-Counter-Choice-Effekte.
- Dispatcher-Kommentar bleibt als Leitplanke erhalten: Reihenfolge im Dispatcher, Verhalten in fokussierten Familien.

Bewusste Restgrenze:

Restpunkt:
Verbleibende groessere Bloecke im Interpreter fuer Hidden-Zone-, Run-, Search-/Install- und temporaere Credit-Pfade.
Warum nicht umgesetzt:
Diese Bloecke haengen eng an Host-Callbacks, Hidden-Info-Barrieren, Run-State und Kosten-/Ziel-Revalidierung. Ein mechanisches Verschieben waere nicht ausreichend sicher.
Welche Voraussetzung fehlt:
Stabilere RuntimeDeps-/Host-Schnitte fuer HiddenZoneRuntimeDeps, RunRuntimeDeps, AccessRuntimeDeps und InstallRezRuntimeDeps.
Empfohlener spaeterer Auftrag:
Gezielter RuntimeDeps-/Host-Schnitt fuer Hidden-Zone-, Run- und Install/Search-Effektfamilien mit separaten Regressionstests.

Checks:

- `corepack pnpm --filter @netgrid/engine typecheck` -> bestanden.
- `corepack pnpm --filter @netgrid/engine test -- ability-engine game/engine-runtime-internal/runtime-module-size.test.ts` -> bestanden.

### Paket 4: Mechanics, Registry, RuntimeDeps und Helper

Status: abgeschlossen

Ziel:

- Einfache ID-Sets weiter aus CardImplementation-Profilen ableiten.
- Registry substantiell weiter entlasten.
- Typisierte RuntimeDeps-Slices und naheliegende Helper dort fortfuehren, wo der Scope sicher bleibt.

Umgesetzt:

- Registry um `proteus-runner-programs.ts` und `proteus-runner-hardware.ts` erweitert.
- Hauptregistry nutzt jetzt drei Proteus-Runner-Subregistries fuer Hardware, Programme und Resources.
- `TRACE_ASSET_CARD_IDS`, `RUN_TAX_UPGRADE_CARD_IDS` und `TAG_CONDITION_UPGRADE_CARD_IDS` werden aus CardImplementation-Profilen abgeleitet.
- `action-runtime-hosts.ts` und `card-runtime-hosts.ts` brauchen kein `@ts-nocheck` mehr und nutzen `Record<string, unknown>`.
- Helper-/Profilpotenzial der beruehrten Karten wurde geprueft; dieser Schnitt bewegt Katalog-, Mechanics- und Bootstrap-Grenzen, aber keine wiederholten Kartenimplementierungen, deshalb wurde kein zusaetzlicher CardImplementation-Helper eingefuehrt.

Bewusste Restgrenze:

Restpunkt:
41 verbleibende `@ts-nocheck`-Dateien im Runtime-Internal-Bereich.
Warum nicht umgesetzt:
Die verbleibenden Dateien sind groessere Resolver-/Bootstrap-Dateien mit breiten Host-Deps und teils verdeckten Informationsgrenzen. Eine schnelle Umtypisierung wuerde Regeln, Hidden-Info-Callbacks oder LegalAction-Revalidierung riskieren.
Welche Voraussetzung fehlt:
Domänenspezifische RuntimeDeps-Schnitte fuer Action, Flow, Choice, State, Access, HiddenZone, Damage, Trace und InstallRez.
Empfohlener spaeterer Auftrag:
Separater RuntimeDeps-Typisierungsprozess mit einem Host-Cluster pro Paket und vollstaendigen Engine-Regressionstests.

Restpunkt:
Weitere Registry-Subregistries jenseits der Proteus-Runner-Gruppen.
Warum nicht umgesetzt:
Ein vollstaendiger Registry-Schnitt ueber alle Sets, Sides und Typen ist ein breiter Katalogumbau. Ohne Generator oder klaren Set-/Faction-Plan entsteht vor allem mechanische Importbewegung mit hohem Konfliktrisiko.
Welche Voraussetzung fehlt:
Entscheidung, ob die Registry langfristig per Generator/Indexmuster oder pro Set/Faction als manuelle Subregistries gepflegt wird.
Empfohlener spaeterer Auftrag:
Registry-Generator oder systematischer Set-/Faction-Subregistry-Prozess mit Paritaetscheck.

Checks:

- `corepack pnpm --filter @netgrid/engine typecheck` -> bestanden.
- `corepack pnpm --filter @netgrid/engine test -- card-implementations/coverage.test.ts game/engine-runtime-internal/runtime-module-size.test.ts mechanics` -> bestanden.

### Paket 5: Abschlussreview

Status: abgeschlossen

Ziel:

- Offene-Punkte-Liste erneut pruefen.
- Nur echte Scope-/Risiko-/Grundsatz-Restpunkte belassen.
- Relevante Checks ausfuehren.
- Lokal nach `main` integrieren und Worktree entfernen.

Umgesetzt:

- Offene Punkte erneut gelesen.
- Abschlusschecks ausgefuehrt.
- Abschlussreport erstellt.

Checks:

- `corepack pnpm --filter @netgrid/engine typecheck` -> bestanden.
- `corepack pnpm --filter @netgrid/shared typecheck` -> bestanden.
- `corepack pnpm --filter @netgrid/engine test` -> bestanden, 173 Testdateien / 1518 Tests.
- `corepack pnpm check:card-function-abstraction` -> bestanden, 145 Baseline-Findings auf integriertem `main`.
- `corepack pnpm typecheck` -> bestanden.
