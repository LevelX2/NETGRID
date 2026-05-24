---
activityId: act-2026-05-24-proteus-phase-1-visible-baseline-cards
status: inbox
kind: concept
area: cards
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 1
blockedBy: []
resultArtifacts: []
checks: []
---

# Proteus Phase 1: Visible Baseline Cards

## Ziel

Die sichtbare Proteus-Baseline aus Phase 1 als engen CardImplementation-Slice umsetzen oder, bei bereits vorhandener Umsetzung, verifizieren und in Manifest/Coverage/Testspur aufnehmen. Der Slice darf nur Karten verwenden, deren Verhalten vollständig mit vorhandenen oder sehr kleinen generischen CardImplementation-Bausteinen ausdrückbar ist.

## Kontext und Quellen

- `docs/releases/proteus/release-slicing-plan.md`, Abschnitte `CardImplementation- und Ability-Bedarfsanalyse`, `Phase 1: Visible Baseline Cards` und `Slice 1`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- `docs/releases/proteus/README.md`.
- `docs/architecture/ability-engine/card-implementation-v1-pattern-catalog.md`.
- `docs/architecture/ability-engine/card-implementation-v1-migration-waves.md`.
- Vorläufer: `docs/activities/done/act-2026-05-17-proteus-visible-baseline-card-slice.md`.

## Zielkarten

- `onr_proteus_031_minotaur` Minotaur
- `onr_proteus_034_riddler` Riddler
- `onr_proteus_041_toughoniumtm-wall` Toughonium™ Wall
- `onr_proteus_049_emergency-rig` Emergency Rig
- `onr_proteus_051_rent-to-own-contract` Rent-to-Own Contract
- `onr_proteus_060_herman-revista` Herman Revista
- `onr_proteus_062_lesley-major` Lesley Major
- `onr_proteus_064_marcel-desoleil` Marcel DeSoleil
- `onr_proteus_065_networked-center` Networked Center
- `onr_proteus_066_obfuscated-fortress` Obfuscated Fortress
- `onr_proteus_069_pavit-bharat` Pavit Bharat
- `onr_proteus_070_rasmin-bridger` Rasmin Bridger
- `onr_proteus_072_research-bunker` Research Bunker
- `onr_proteus_073_simon-francisco` Simon Francisco
- `onr_proteus_077_weapons-depot` Weapons Depot
- `onr_proteus_085_disintegrator` Disintegrator
- `onr_proteus_150_streetware-distributor` Streetware Distributor

## Scope

- Pro Zielkarte eine eigene CardImplementation-Datei unter `packages/engine/src/card-implementations/` anlegen oder eine bestehende Umsetzung explizit verifizieren.
- Zuerst vorhandene Abstraktionen prüfen: `printedSubroutines`, einfache `abilities`, Install-/Rez-/Access-Basis und vorhandene Modifier.
- Pro Karte `reuse only`, `reuse plus small generic extension` oder `new generic family first` dokumentieren.
- Registry-, Coverage-, Manifest- und Szenario-/Smoke-Nachweis für genau diese Zielmenge ergänzen.
- Proteus bleibt außerhalb dieses Zielsets blockiert.

## Nicht im Scope

- Keine Hidden Runner Resources.
- Keine Variable-ICE-, Random-, Virus-/Purge- oder Bad-Publicity-Sonderpfade.
- Keine Proteus-Deckgesamtfreigabe, keine Formatlegalität und keine AI-Hints.
- Keine Proteus-Sammeldatei und keine neuen Proteus-ID-Branches im Runtime-Code.

## Akzeptanzkriterien

- [ ] Alle Zielkarten haben eine eindeutige per-card CardImplementation-Datei oder eine dokumentierte, bereits vorhandene per-card Umsetzung.
- [ ] Neue Logik nutzt deklarative CardImplementation-Familien; es gibt keine neuen `onr_proteus_*`-Branches in `packages/engine/src/index.ts`.
- [ ] Jede Zielkarte hat Manifest-/Coverage-Parität und fokussierte Engine-Smokes oder begründete `no_engine_behavior_required`-Einordnung.
- [ ] PlayerViews, PublicEvents, Reconnect, Replay, StateHash und LegalAction-Revalidation bleiben side-sicher.
- [ ] Nicht-Zielkarten bleiben blockiert, nicht decklegal, nicht formatlegal und nicht `ai_supported`.

## Umsetzungshinweise

- `Toughonium™ Wall` wurde im früheren sichtbaren Baseline-Slice bereits berührt; vor Neuimplementierung aktuellen Runtime-/Manifeststatus prüfen und nicht doppelt modellieren.
- Falls eine Karte nicht mit vorhandenen `kind`s abbildbar ist, sie aus Phase 1 herausnehmen oder zuerst eine kleine generische Abstraktion schneiden.
- Sichtbare einfache ICE sollten bevorzugt über `printedSubroutines` laufen.

## Ergebnisnotiz

Noch offen.
