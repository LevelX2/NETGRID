---
activityId: act-2026-05-24-proteus-phase-2-bad-publicity-cards
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
releaseTarget: Proteus Phase 2
blockedBy:
  - act-2026-05-24-proteus-phase-1-visible-baseline-cards
resultArtifacts: []
checks: []
---

# Proteus Phase 2: Bad-Publicity-Karten

## Ziel

Die Bad-Publicity-Phase nach vorhandenem `bad_publicity_7`-Harness als Karten-Slice umsetzen. Vor Kartenpromotion muss Bad Publicity als generischer CardImplementation-Effekt nutzbar sein; die Game-End-Entscheidung bleibt Engine-Regel.

## Kontext und Quellen

- `docs/releases/proteus/release-slicing-plan.md`, Abschnitte `Phase 2`, `Slice 2` und `Ability-Bedarf nach Phase`.
- `docs/releases/proteus/bad-publicity-loss-gate-contract.md`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- `docs/activities/done/act-2026-05-17-proteus-bad-publicity-loss-gate.md`.
- `docs/activities/done/act-2026-05-17-proteus-bad-publicity-engine-harness.md`.

## Zielkarten

- `onr_proteus_002_charity-takeover` Charity Takeover
- `onr_proteus_108_faked-hit` Faked Hit
- `onr_proteus_109_frame-up` Frame-Up
- `onr_proteus_112_identity-donor` Identity Donor
- `onr_proteus_113_live-news-feed` Live News Feed
- `onr_proteus_117_poisoned-water-supply` Poisoned Water Supply
- `onr_proteus_123_senatorial-field-trip` Senatorial Field Trip
- `onr_proteus_125_subliminal-corruption` Subliminal Corruption

## Scope

- Generischen CardImplementation-Baustein für Bad-Publicity-Erhöhung und passende PublicPayload-Projektion einführen, falls noch nicht vorhanden.
- Pro Zielkarte eine eigene CardImplementation-Datei anlegen.
- Bad-Publicity-7+-Prioritätsmatrix gegen Agenda-Sieg, Flatline und Korp-Deckout erneut mit Zielkarten oder fokussierten Fixtures absichern.
- Redacted source handling für verdeckte oder künftig verdeckte Auslöser beibehalten.

## Nicht im Scope

- Keine Umsetzung von `Scaldan`; diese Karte bleibt wegen Virus/Random in Phase 8.
- Keine Umsetzung von `Back Door to Netwatch`; diese Karte bleibt wegen Hidden Resource in Phase 4.
- Keine UI- oder KI-Heuristik für Game-End.
- Keine Proteus-Decklegalität und keine AI-Hints.

## Akzeptanzkriterien

- [ ] Bad Publicity wird in Karten ausschließlich über generische Engine-/CardImplementation-Abstraktionen erhöht.
- [ ] Alle acht Zielkarten haben eigene CardImplementation-Dateien, Registry-/Coverage- und Manifestnachweis.
- [ ] `bad_publicity_7` bleibt Engine-autoritativ und gewinnt die dokumentierte Prioritätsmatrix.
- [ ] PublicEvents und PlayerViews enthalten keine private Auslöseridentität bei redacted Quellen.
- [ ] Keine neuen Proteus-ID-Branches im Runtime-Code.

## Umsetzungshinweise

- Bestehender Harness beweist den Game-End-Grund, ersetzt aber nicht den Karten-Effect.
- Jede Karte muss einzeln prüfen, ob sie zusätzlich Damage, Tag, Access oder Prevention berührt; solche Zusatzfamilien dürfen nur verwendet werden, wenn sie bereits generisch und side-sicher sind.

## Ergebnisnotiz

Noch offen.
