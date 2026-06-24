# Remaining Engine CardImplementation Architecture Process

Status: in_progress

Quelle/Vorgabe: Nutzerauftrag vom 2026-06-24 auf Basis von `main` nach Merge `65711b0a` und lokalem Startstand `318d3769`.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise. Gesamtziel, harte DoD, Phasen, Scope, Nicht-Ziele, Zielmodule, Git-Regeln, echte Blocker und vollständige Abschlusschecks sind bestimmt. Kleine Lücken werden konservativ geschlossen: fachliche Strukturentscheidungen werden im Code getroffen, Tests werden über öffentliche Engine-Pfade bevorzugt, und alte Kompatibilitätsformen werden nur an klaren Boundaries übersetzt.

## Gesamtziel

`Complete Remaining NETGRID Engine CardImplementation Architecture`

Die Engine führt Kartenregeln nicht mehr über Kartennamen, Definition-IDs, Longtail-Sonderpfade oder dynamische untypisierte Runtime-Bindings aus. CardImplementation-Dateien deklarieren funktional benannte Profile; die Runtime-Komposition ist explizit typisiert; Effect-Familien sind fachlich zuständig und exhaustiv abgesichert; Registry, State, Payloads, AI-/Semantik-Consumer und Architekturchecks spiegeln den Endzustand.

## Nicht-Ziele

- Kein allgemeines UI-Refactoring.
- Keine KI-Entscheidungsarchitektur außerhalb notwendiger Engine-Semantik-Consumer.
- Kein bloßes Umbenennen von Problemen zur Guard-Beruhigung.
- Kein Merge nach `main`, solange die harte DoD nicht erfüllt ist.
- Kein Push ohne ausdrücklichen Nutzerwunsch und grüne vollständige Abschlusschecks.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Fehlende interne Voraussetzungen werden umgesetzt, nicht als Folgeauftrag abgelegt.
- Tests werden vor riskanten Umbauten ergänzt oder erweitert.
- Alte Adapter, offene Bags, Proxies, Longtail-Catch-alls und aktive Karten-ID-Regelentscheidungen werden bis Abschluss entfernt.
- Nach jeder Konfliktauflösung laufen die vollständigen Abschlusschecks erneut.

## Sicherheitsblocker

Nur widersprüchliche maßgebliche Regelquellen, fehlende zwingende externe Ressourcen oder technische Toolausführungsunfähigkeit stoppen den Prozess. Umfang, Kopplung, fehlende Typen, fehlende Tests, Regressionsrisiko oder Merge-Konflikte sind keine Abschlussblocker.

## State Machine

`preflight -> guard_red -> characterization -> runtime_ports -> effect_families -> longtail_state_payload_id -> registry_ai_size_docs -> final_checks -> merge_main -> complete`

Bei rotem Paket-Gate bleibt der Prozess im aktuellen Zustand. Bei echtem Blocker wird ein Blocker-Report mit Removal Condition dokumentiert und nicht gemerged.

## Paketfolge

### P0 Guard-Zielcheck und Selbsttests

Ziel: `check-engine-cardimplementation-architecture-target.mjs` so verschärfen, dass der aktuelle Restzustand korrekt rot wird und umbenannte Verstöße durch Selbsttests erkannt werden.

Kernartefakte:
- `scripts/check-engine-cardimplementation-architecture-target.mjs`
- Guard-Selbsttests
- betroffene Check-Scripts

Checks:
- Architekturcheck muss vor der Korrektur der Architektur echte Findings melden.
- Guard-Selbsttests müssen die geforderten Varianten erkennen.
- `git diff --check`

Commit: `test(engine): harden card implementation architecture guard`

### P1 Charakterisierungstests für riskante Runtime-Bereiche

Ziel: Verhalten über öffentliche Engine-Pfade absichern, bevor Runtime-Komposition und Effects umgebaut werden.

Kernartefakte:
- Tests für `getLegalActions`, `applyAction`, PlayerViews und PublicEvents
- Hidden-Zone-, Search-, Install-/Rez-, Run-, Trace-, Replacement-, Damage-, Delayed-Effect- und Compatibility-Regressionen

Checks:
- fokussierte Engine-Testläufe für neue/angepasste Regressionen
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Commit: `test(engine): characterize remaining card implementation runtime behavior`

### P2 Runtime-Komposition typisieren

Ziel: offene Runtime-Bags, Proxy-DI, dynamische Member-Resolver, Callable-Bags und `@ts-nocheck` aus Runtime- und CardImplementation-Komposition entfernen.

Kernartefakte:
- `packages/engine/src/game/engine-runtime-internal/*`
- `packages/engine/src/game/card-implementation/*`
- Runtime-Port-Interfaces und Composition Root

Checks:
- fokussierte Runtime-/CardImplementation-Tests
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm check:engine-cardimplementation-architecture-target`
- `git diff --check`

Abschluss 2026-06-24:
- Runtime-Composition-Ports und Hidden-Zone-Linking sind explizit typisiert; offene Runtime-Bags, Proxy-DI und `@ts-nocheck` sind aus dem P2-Scope entfernt.
- `corepack pnpm --filter @netgrid/engine typecheck`: grün.
- `corepack pnpm --filter @netgrid/engine test`: grün, 173 Testdateien / 1519 Tests.
- P2-Guard-Scans für `runtimeProxy`, `Record<string, unknown>`, Index-Signatures, `@ts-nocheck`, `any` und `unknown` im P2-Zielschnitt: keine Treffer.
- `corepack pnpm check:engine-cardimplementation-architecture-target`: erwartbar weiter rot für P3-P5-Kategorien; P2-Kategorie `runtime escape hatches removed` steht bei `0`.
- `git diff --check`: keine Whitespace-Fehler; nur CRLF-Normalisierungswarnungen für bestehende Dateien.

Commit: `refactor(engine): type runtime composition ports`

### P3 Effect-Ausführung fachlich strukturieren

Ziel: nummerierte/unspezifische Context-Effect-Sammeldateien entfernen, Effect-Kinds genau einer fachlichen Familie zuordnen und Exhaustiveness absichern.

Kernartefakte:
- `packages/engine/src/ability-engine/effect-interpreter.ts`
- `packages/engine/src/ability-engine/effect-families/*`
- Effect-Context- und Ergebnis-Typen

Checks:
- Effect-Familien-Parität/Exhaustiveness
- fokussierte Effect- und Mechanics-Tests
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm check:engine-cardimplementation-architecture-target`
- `git diff --check`

Abschluss 2026-06-24:
- Nummerierte `context-effects-part-*`-Dateien und der Catch-all-Context-Dispatcher sind durch fachlich benannte Effect-Familien ersetzt.
- Jede `CardEffectImplementation.kind` hat genau einen Effect-Family-Owner; die P3-Kategorie `effect families are domain-owned and exhaustive` steht bei `0`.
- `corepack pnpm --filter @netgrid/engine exec vitest run src/ability-engine src/game/card-implementation src/index-tests/mechanics/trace-tags-resources.test.ts src/index-tests/mechanics/per-card-longtail.test.ts`: grün, 12 Testdateien / 118 Tests.
- `corepack pnpm --filter @netgrid/engine typecheck`: grün.
- `corepack pnpm --filter @netgrid/engine test`: grün, 173 Testdateien / 1519 Tests.
- `corepack pnpm check:engine-cardimplementation-architecture-target`: erwartbar weiter rot für P4/P5-Kategorien; P3-Kategorie steht bei `0`.

Commit: `refactor(engine): split effect execution into domain families`

### P4 Longtail-, State-, Payload- und Karten-ID-Regelpfade migrieren

Ziel: Longtail-Catch-alls, kartenspezifische Runtime-Kinds, State-/Payload-Felder und aktive Definition-ID-Regelentscheidungen in funktionale Profile und Boundary-Kompatibilität migrieren.

Kernartefakte:
- `packages/engine/src/card-implementations/*`
- `packages/engine/src/mechanics/*`
- `packages/engine/src/game/*`
- `packages/shared/src/*`
- `packages/engine/src/compatibility/*`

Checks:
- relevante Mechanics-/Originalset-/Proteus-Regressionen
- `corepack pnpm --filter @netgrid/engine typecheck`
- bei Shared-Änderungen `corepack pnpm --filter @netgrid/shared typecheck`
- `corepack pnpm check:engine-cardimplementation-architecture-target`
- `git diff --check`

Commit: `refactor(engine): remove card specific runtime rule paths`

### P5 Registry, AI-/Semantik-Consumer, Modulgrenzen und dauerhafte Kommentare

Ziel: echte Gruppenregistries oder Generatorlösung herstellen, AI-/Semantik-Consumer auf kanonische funktionale Sprache bringen, Size-Grenzen finalisieren und zentrale Architekturkommentare ergänzen.

Kernartefakte:
- `packages/engine/src/card-implementations/registry.ts`
- `packages/engine/src/card-implementations/subregistries/*`
- `packages/ai/src/*`
- Check-Scripts und bestehende Architektur-/Review-Daten

Checks:
- Registry-Parität und Eindeutigkeit
- `corepack pnpm check:ai`
- `corepack pnpm check:engine-cardimplementation-architecture-target`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Commit: `refactor(engine): finalize registry and semantic architecture guards`

### P6 Vollständige Abschlussprüfung und Integration

Ziel: alle harten Abschlusskriterien auf finalem Branchstand erfüllen, danach lokal nach `main` integrieren und erneut vollständig prüfen.

Checks vor Merge:
- `corepack pnpm check:engine-cardimplementation-architecture-target`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/shared typecheck`
- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm check:card-function-abstraction`
- `corepack pnpm check:ai`
- `corepack pnpm typecheck`
- `git diff --check`

Checks nach Merge, falls Code durch Merge/Konfliktauflösung verändert wird: dieselbe vollständige Liste erneut.

Commit: kein Paketcommit; finaler Merge nach `main` erst bei vollständiger DoD.

## Worktree-, Git- und Integrationsregeln

Arbeits-Worktree: `C:\Projekte\NETGRID_REMAINING_ENGINE_CARD_ARCHITECTURE`

Arbeitsbranch: `codex/remaining-engine-cardimplementation-architecture`

Hauptworkspace: `C:\Projekte\NETGRID`

Der Hauptworkspace enthält zu Prozessbeginn uncommitted Web-UI-Änderungen, die als fremd und nicht in Scope klassifiziert sind. Sie werden nicht verändert. Der finale Merge nach `main` erfolgt erst nach sauberem Branchabschluss und nach erneuter Prüfung des Hauptworkspace-Zustands.

## Controller-Prompt-Kern

Arbeite ausschließlich im Arbeits-Worktree auf dem Arbeitsbranch. Nutze den Hauptworkspace nur für finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Arbeite paketweise, verifiziere jedes Paket, committe jedes abgeschlossene Paket und beginne erst danach das nächste. Stoppe nur bei echtem Sicherheitsblocker. Das Parent Goal bleibt aktiv, bis alle harten Abschlusskriterien nach finalem Merge erfüllt sind.

## Abschlusskriterien

Alle 24 harten DoD-Punkte aus der Vorgabe sind erfüllt, die vollständigen Abschlusschecks laufen grün auf dem endgültigen Integrationsstand, der Arbeits-Worktree ist entfernt, und das Goal wird erst danach geschlossen.
