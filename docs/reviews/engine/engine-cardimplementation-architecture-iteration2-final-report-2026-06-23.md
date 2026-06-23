# Engine CardImplementation Architecture Iteration 2 Final Report

Datum: 2026-06-23
Branch: `codex/engine-card-architecture-iteration2`

## Ergebnis

Die zweite Architekturiteration reduziert weitere kartennamenspezifische Runtime-Begriffe, entlastet den CardImplementation-Interpreter, leitet weitere Mechanics-Sets aus CardImplementation-Profilen ab, schneidet die Registry weiter und entfernt zwei einfache `@ts-nocheck`-Grenzen.

## Strukturelle Verbesserungen

- Delayed-Install-Runtime-Pfad ist nicht mehr nach The Shell Traders benannt.
- Omniscience-Endturn-Tag-Pfad nutzt eine funktionale Cause/Payload-Benennung.
- `effect-interpreter.ts` delegiert vier weitere Effektfamilien an fokussierte Module.
- Trace-/Run-Tax-/Tag-Condition-Mechanics kommen aus CardImplementation-Profilen statt aus expliziten ID-Listen.
- Proteus-Runner-Hardware, -Programme und -Resources liegen in Subregistries.
- `action-runtime-hosts.ts` und `card-runtime-hosts.ts` sind ohne `@ts-nocheck` typisiert.

## Wesentlich Veraenderte Module

- `packages/shared/src/ability-payload.ts`
- `packages/shared/src/index.ts`
- `packages/engine/src/ability-engine/effect-interpreter.ts`
- `packages/engine/src/ability-engine/effect-families/*`
- `packages/engine/src/card-implementations/registry.ts`
- `packages/engine/src/card-implementations/subregistries/*`
- `packages/engine/src/mechanics/card-implementation-derived-sets.ts`
- `packages/engine/src/mechanics/trace-tags.ts`
- `packages/engine/src/game/engine-runtime-internal/action-runtime-hosts.ts`
- `packages/engine/src/game/engine-runtime-internal/card-runtime-hosts.ts`
- `docs/reviews/engine/card-function-abstraction-2026-06-12.*`

## Neutralisierte Runtime-Reste

- `shellTradersAbility` -> `delayedInstallAbility`
- `shellTradersStartTurnResolvedSourceIds` -> `delayedInstallStartTurnResolvedSourceIds`
- `shell_traders_set_aside` -> `delayed_install_set_aside`
- `runner.start.shell_traders...` -> `runner.start.delayed_install...`
- `shellTradersInstalledTarget` -> `delayedInstallInstalledTarget`
- `omniscience_foundation` als Tag-Cause -> `end_turn_tag_if_runner_received_tag`
- `omniscienceFoundationTagsAdded` -> `endTurnTagIfRunnerReceivedTagAdded`

Der Card-Function-Abstraction-Report sinkt von 151 auf 147 Baseline-Findings.

## Aufgebrochene Monolithen

Neue Effektfamilien:

- `bad-publicity-effects.ts`
- `counter-effects.ts`
- `hosted-credit-effects.ts`
- `advancement-effects.ts`

Der Dispatcher bleibt fuer Effekt-Reihenfolge und Orchestrierung verantwortlich.

## Abgeleitete ID-Sets

Diese Sets werden jetzt aus CardImplementation-Profilen abgeleitet:

- `TRACE_ASSET_CARD_IDS`
- `RUN_TAX_UPGRADE_CARD_IDS`
- `TAG_CONDITION_UPGRADE_CARD_IDS`

## Registry-Entlastung

Die Hauptregistry importiert Proteus-Runner-Hardware, -Programme und -Resources ueber Subregistries. Die Subregistries bleiben katalog-only und enthalten keine Runtime- oder Ausfuehrungslogik.

## Leitplanken

Erhalten bzw. ergaenzt wurden kurze Architekturkommentare an Dispatcher und Subregistries. Sie markieren, dass Effektverhalten in Familien gehoert und Registries nur Kataloge sind.

## Praktischer Nutzen

- Neue Karten koennen eher vorhandene generische Effektfamilien nutzen.
- Funktionale Runtime-Namen sind weniger an einzelne Kartennamen gekoppelt.
- Mechanics-Mitgliedschaft folgt staerker aus CardImplementation-Profilen.
- Registry-Konflikte werden bei weiteren Proteus-Runner-Karten kleiner.
- Zwei Runtime-Host-Composer sind wieder normal typgeprueft.

## Checks

- `corepack pnpm --filter @netgrid/engine typecheck` -> bestanden.
- `corepack pnpm --filter @netgrid/shared typecheck` -> bestanden.
- `corepack pnpm --filter @netgrid/engine test` -> bestanden, 173 Testdateien / 1518 Tests.
- `corepack pnpm check:card-function-abstraction` -> bestanden, 147 Baseline-Findings.
- `corepack pnpm typecheck` -> bestanden.

## Offene Punkte

Restpunkt:
Verbleibende groessere Bloecke im Interpreter fuer Hidden-Zone-, Run-, Search-/Install- und temporaere Credit-Pfade.
Warum nicht umgesetzt:
Diese Bloecke haengen eng an Host-Callbacks, Hidden-Info-Barrieren, Run-State und Kosten-/Ziel-Revalidierung. Ein mechanisches Verschieben waere nicht ausreichend sicher.
Welche Voraussetzung fehlt:
Stabilere RuntimeDeps-/Host-Schnitte fuer HiddenZoneRuntimeDeps, RunRuntimeDeps, AccessRuntimeDeps und InstallRezRuntimeDeps.
Empfohlener spaeterer Auftrag:
Gezielter RuntimeDeps-/Host-Schnitt fuer Hidden-Zone-, Run- und Install/Search-Effektfamilien mit separaten Regressionstests.

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
Ein vollstaendiger Registry-Schnitt ueber alle Sets, Sides und Typen ist ein breiter Katalogumbau. Ohne Generator oder klaren Set-/Faction-Plan entsteht vor allem mechanische Importbewegung mit hohem Konflikt- und Review-Risiko.
Welche Voraussetzung fehlt:
Entscheidung, ob die Registry langfristig per Generator/Indexmuster oder pro Set/Faction als manuelle Subregistries gepflegt wird.
Empfohlener spaeterer Auftrag:
Registry-Generator oder systematischer Set-/Faction-Subregistry-Prozess mit Paritaetscheck.
