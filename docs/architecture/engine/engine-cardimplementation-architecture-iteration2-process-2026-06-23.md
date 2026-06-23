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

Status: in Arbeit

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
- `corepack pnpm check:card-function-abstraction` -> bestanden, 147 Baseline-Findings.

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

- Die verbleibenden groesseren Bloecke im Interpreter sind ueberwiegend Hidden-Zone-, Run-, Search-/Install- und temporaere Credit-Pfade mit eng gekoppelten Host-Callbacks. Sie bleiben in diesem Paket im Dispatcher, bis die jeweiligen RuntimeDeps-/Host-Schnitte weiter stabilisiert sind.

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

- Im Runtime-Internal-Bereich verbleiben 41 `@ts-nocheck`-Dateien. Die naechsten Kandidaten sind groessere Resolver-/Bootstrap-Dateien mit breiten Host-Deps; sie brauchen einen eigenen RuntimeDeps-Schnitt, damit keine Regeln oder Hidden-Info-Callbacks versehentlich umtypisiert werden.
- Weitere Registry-Subregistries sind moeglich, aber fuer diese Iteration wurden die zusammenhaengenden Proteus-Runner-Gruppen ohne Verhaltensrisiko herausgezogen. Der naechste Registry-Schnitt sollte vorzugsweise mechanisch generiert oder pro Set/Faction geplant werden.

Checks:

- `corepack pnpm --filter @netgrid/engine typecheck` -> bestanden.
- `corepack pnpm --filter @netgrid/engine test -- card-implementations/coverage.test.ts game/engine-runtime-internal/runtime-module-size.test.ts mechanics` -> bestanden.

### Paket 5: Abschlussreview

Status: geplant

Ziel:

- Offene-Punkte-Liste erneut pruefen.
- Nur echte Scope-/Risiko-/Grundsatz-Restpunkte belassen.
- Relevante Checks ausfuehren.
- Lokal nach `main` integrieren und Worktree entfernen.
