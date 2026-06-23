# Engine CardImplementation Architecture Final Report 2026-06-23

Status: completed

## Ergebnis

Der Engine-/CardImplementation-/Regelausführungsbereich ist in mehreren lauffähigen Slices stärker auf deklarative, wiederverwendbare CardImplementation-Bausteine ausgerichtet. Es gab keine KI-Spieler-Änderung und keine neue LegalAction-Autorität außerhalb der Engine.

## Strukturelle Verbesserungen

- `effect-interpreter.ts` delegiert Credits, Draw, Tags und Damage an fokussierte Effektfamilien unter `packages/engine/src/ability-engine/effect-families/`.
- Mehrere kartennamenspezifische funktionale Kinds und Hidden-Zone-Runtime-Namen wurden durch funktionale Namen ersetzt:
  - `silver_lining_recovery` -> `gain_credits_from_stolen_agenda_advancement_history`
  - `omniscience_foundation_end_turn_tag` -> `end_turn_tag_if_runner_received_tag`
  - `fortress_respecification_ice_reorder` -> `successful_run_fort_ice_reorder`
  - `social_engineering_secret_guess_run` -> `secret_spend_guess_then_targeted_bypass_run`
  - `new_blood_conceal_reorder_installed_ice` -> `conceal_and_reorder_installed_ice`
  - `shell_traders_delayed_install` -> `delayed_install_with_counter_countdown`
- Hidden-Zone-Choice-Source-Präfixe und Public-Payload-Felder für den Secret-Spend-Guess-Run-Pfad wurden funktional benannt.
- Mechanics-Sets für Advancement-Counter-Assets/-Operations, Action-Assets und Fort-Run-Window-Upgrades werden aus CardImplementation-Profilen abgeleitet.
- `runtime-shared.ts` nutzt echte Shared-Typen und einen ersten benannten `CardRuntimeDeps`-Slice statt nur `any`-Aliase.
- Die CardImplementation-Registry hat mit `subregistries/proteus-runner-resources.ts` einen ersten katalog-only Subregistry-Schnitt.

## Wesentliche Dateien

- `packages/engine/src/ability-engine/effect-interpreter.ts`
- `packages/engine/src/ability-engine/effect-families/*`
- `packages/engine/src/ability-engine/definition-types.ts`
- `packages/engine/src/game/hidden-zone/*`
- `packages/engine/src/game/play/corp-operation-resolution.ts`
- `packages/engine/src/public-context.ts`
- `packages/engine/src/mechanics/card-implementation-derived-sets.ts`
- `packages/engine/src/mechanics/agenda-scoring.ts`
- `packages/engine/src/game/engine-runtime-internal/runtime-shared.ts`
- `packages/engine/src/card-implementations/registry.ts`
- `packages/engine/src/card-implementations/subregistries/proteus-runner-resources.ts`
- `packages/shared/src/index.ts`
- `docs/reviews/engine/card-function-abstraction-2026-06-12.md`

## Leitplanken

Neue Kommentare sitzen an den Grenzen Effect-Dispatcher, derived Mechanics-Sets, RuntimeDeps-Slice und Subregistry. Sie sollen künftige CardImplementation-Arbeit auf funktionale Kinds, katalog-only Registry und fokussierte Effektfamilien lenken.

## Praktischer Nutzen

Künftige Karten können einfache Credit-/Draw-/Tag-/Damage-Effekte ohne Wachstum des zentralen Interpreters teilen. Mechanics-Sets müssen für diese ersten Familien nicht mehr als zweite Card-ID-Wahrheit gepflegt werden. Der Abstraction-Guard kennt den neuen Stand und blockt neue Leaks weiter.

## Wartbarkeit/Erweiterbarkeit

Primär verbessert wurden Wartbarkeit und Erweiterbarkeit. Spielregeln, Hidden-Info-Grenzen, LegalActions und KI-Entscheidungspfade wurden nicht erweitert. Der Registry-Schnitt ist bewusst klein gehalten, damit weitere Subregistries nach gleichem Muster folgen können.

## Checks

- `corepack pnpm --filter @netgrid/engine typecheck`: bestanden
- `corepack pnpm --filter @netgrid/engine test`: bestanden, 173 Testdateien, 1518 Tests
- `corepack pnpm check:card-function-abstraction`: bestanden, 151 Baseline-Findings
- `corepack pnpm --filter @netgrid/shared typecheck`: bestanden

## Offene Folgepunkte

- Weitere Effektfamilien extrahieren: Bad Publicity, Counters/Hosted Credits, Run/Access, Hidden-Zone, Advancement, Trash, Trace.
- Weitere Mechanics-ID-Sets aus CardImplementation-Profilen ableiten oder mit begründeter Übergangsnotiz belassen.
- Weitere Subregistries nach Bereichen schneiden.
- `engine-runtime-internal` weiter aus `@ts-nocheck` und breiten Bootstrap-Imports herauslösen.
- Shell-Traders-spezifische Action-Payload-Felder sind noch ein größerer separater Vertragsschnitt, weil sie LegacyAbilityPayload-Felder berühren.
