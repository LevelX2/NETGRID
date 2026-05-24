---
activityId: act-2026-05-24-proteus-phase-9-random-hidden-search-action-economy-longtail
status: inbox
kind: concept
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 9
blockedBy:
  - act-2026-05-24-proteus-phase-8-virus-antibody-purge
resultArtifacts: []
checks: []
---

# Proteus Phase 9: Random, Hidden-Zone-Search, Action-Economy und Longtail

## Ziel

Die späte Proteus-Longtail-Phase in kleine Umsetzungsschritte zerlegen und danach die Zielkarten mit generischen Random-/Hidden-Zone-/Action-Economy- und Lock-Familien umsetzen. `Ice and Data Special Report` bleibt bis zur Kostenklärung blockiert.

## Kontext und Quellen

- `docs/releases/proteus/release-slicing-plan.md`, Abschnitte `Phase 9`, `Slice 9` und `Ability-Bedarf nach Phase`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- `docs/releases/proteus/variable-ice-contract.md` für Random-/ICE-Nähe bei `Roadblock`.
- `docs/releases/proteus/purge-action-debt-contract.md` für Future-/Forgo-Actions-Bezug.
- V1.9.11 Hidden-Zone-Search/Reveal/Reorder/Shuffle-Artefakte.

## Zielkarten

- `onr_proteus_001_ai-board-member` AI Board Member
- `onr_proteus_006_please-dont-choke-anyone` Please Don't Choke Anyone
- `onr_proteus_007_project-venice` Project Venice
- `onr_proteus_035_roadblock` Roadblock
- `onr_proteus_046_corporate-guard-r-temps` Corporate Guard(R) Temps
- `onr_proteus_058_executive-boot-camp` Executive Boot Camp
- `onr_proteus_063_lisa-blight` Lisa Blight
- `onr_proteus_087_forwards-legacy` Forward's Legacy
- `onr_proteus_110_hijack` Hijack
- `onr_proteus_111_ice-and-data-special-report` Ice and Data Special Report
- `onr_proteus_126_test-spin` Test Spin
- `onr_proteus_131_bargain-with-viacox` Bargain with Viacox
- `onr_proteus_144_lucidrinetm-drip-feed` Lucidrine™ Drip Feed
- `onr_proteus_146_precision-bribery` Precision Bribery

## Scope

- Vor Umsetzung in kleinere Unterpakete schneiden: Random/Würfel, Hidden-Zone-Search/Install/Tutor, zusätzliche Aktionsökonomie, Future-Forgo-Actions, Data-Fort-Creation-Lock und Regelklärungen.
- Pro freigegebener Zielkarte eine eigene CardImplementation-Datei.
- Random-Familien mit Seed, `randomCounter`, `RandomDrawRecords`, PublicPayload und Replay/StateHash absichern.
- Hidden-Zone-Search/Install/Tutor nur über side-private LegalActions und bestehende Hidden-Zone-Gates umsetzen.
- `Ice and Data Special Report` als blocked lassen, bis `Cost 3 (0)` fachlich geklärt ist.

## Nicht im Scope

- Keine Umsetzung von Phase-8-Virus-/Purge-Resten.
- Keine pauschale Action-Economy-Neudefinition außerhalb der Zielkarten.
- Keine UI-/KI-Entscheidung für Random oder Hidden-Zone-Suche.
- Keine Proteus-Gesamtfreigabe, keine Decklegalität und keine AI-Hints.

## Akzeptanzkriterien

- [ ] Vor Codearbeit existiert eine Unterpaket-Liste oder ein kurzer Split-Plan für die Phase-9-Familien.
- [ ] Random-Resolver sind replay-/StateHash-stabil und leaken keine Seeds oder privaten Kandidatenlisten.
- [ ] Hidden-Zone-Effekte zeigen nur dem berechtigten Spieler die private Auswahl.
- [ ] Action-Economy-/Forgo-Action-Effekte sind StateHash-relevant und deterministisch.
- [ ] `Ice and Data Special Report` bleibt blockiert oder hat eine dokumentierte Regel-/Quellenentscheidung.
- [ ] Jede umgesetzte Zielkarte hat eigene CardImplementation-Datei, Manifest-/Coverage- und Testnachweis.

## Umsetzungshinweise

- Phase 9 ist bewusst kein einzelnes großes Implementierungspaket. Der erste Bearbeiter soll sie in kleinere Activities schneiden, wenn mehr als eine Mechanikfamilie gleichzeitig betroffen wäre.
- `Precision Bribery` braucht Data-Fort-Creation-Lock; nicht nebenbei in Run-/Access-Logik verstecken.

## Ergebnisnotiz

Noch offen.
