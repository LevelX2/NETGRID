---
activityId: act-2026-05-24-proteus-phase-8-virus-antibody-purge
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
releaseTarget: Proteus Phase 8
blockedBy:
  - act-2026-05-24-proteus-phase-7-cybernetics-deck-hardware
resultArtifacts: []
checks: []
---

# Proteus Phase 8: Virus, Antibody und Purge

## Ziel

Die Proteus-Virus-/Antibody-/Purge-Familie mit klarer Counter-Taxonomie, purgefähigen Scopes und Action-Debt-Spezialfenstern umsetzen. Bestehende O:NR-v1-Virusmuster dürfen wiederverwendet werden, reichen aber für Proteus nicht vollständig.

## Kontext und Quellen

- `docs/releases/proteus/release-slicing-plan.md`, Abschnitte `Phase 8`, `Slice 8` und `Ability-Bedarf nach Phase`.
- `docs/releases/proteus/virus-antibody-counter-contract.md`.
- `docs/releases/proteus/purge-action-debt-contract.md`.
- `docs/releases/proteus/bad-publicity-loss-gate-contract.md`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- `docs/activities/done/act-2026-05-17-proteus-virus-antibody-contracts.md`.
- `docs/activities/done/act-2026-05-17-proteus-purge-action-debt-contract.md`.

## Zielkarten

- `onr_proteus_009_viral-breeding-ground` Viral Breeding Ground
- `onr_proteus_054_bel-digmo-antibody` Bel-Digmo Antibody
- `onr_proteus_057_doppelganger-antibody` Doppelganger Antibody
- `onr_proteus_068_pattel-antibody` Pattel Antibody
- `onr_proteus_075_stereogram-antibody` Stereogram Antibody
- `onr_proteus_078_armageddon` Armageddon
- `onr_proteus_084_crumble` Crumble
- `onr_proteus_089_garbage-in` Garbage In
- `onr_proteus_090_highlighter` Highlighter
- `onr_proteus_094_scaldan` Scaldan
- `onr_proteus_097_taxman` Taxman
- `onr_proteus_098_vienna-22` Vienna 22
- `onr_proteus_099_viral-pipeline` Viral Pipeline

## Scope

- Purgefähige Runner-Virus-Counter-Registry mit Scopes `corp`, `server`, `card` und `effect`.
- Antibody-Folgezähler klar von purgefähigen Runner-Virus-Countern abgrenzen.
- Access-Origin, HQ-/R&D-Multiaccess, kostenlose Trash-Rechte, Start-of-turn-Penalties, RandomDrawRecords und Pipe-/Scaldan-Interaktionen umsetzen.
- Proteus-Purge als Action-Debt-/Spezialfenster-Familie modellieren, nicht als Alias des V0.99-Main-Action-Purge.
- Pro Zielkarte eigene CardImplementation-Datei.

## Nicht im Scope

- Keine Änderung der bestehenden V0.99/V1.9.12-Purge-Regel für aktive O:NR-v1-Karten, außer ein allgemeiner Helper wird kompatibel ergänzt.
- Keine Hidden Runner Resources.
- Keine Phase-9-Random-Longtail-Karten außerhalb Armageddon/Scaldan-Familienbezug.
- Keine Proteus-AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [ ] Counter-Taxonomie ist in Runtime, PlayerView/PublicPayload und Tests eindeutig.
- [ ] Purge entfernt nur registrierte purgefähige Runner-Virus-Counter und lässt Antibody-/Advancement-Counter stehen.
- [ ] Action-Debt ist StateHash-relevant, kumulierbar und wird deterministisch abgetragen.
- [ ] Random-Effekte nutzen Seed, `randomCounter` und `RandomDrawRecords`.
- [ ] HQ-/R&D-Access-Effekte leaken keine künftigen Karten oder Queue-Inhalte.
- [ ] Alle Zielkarten haben eigene CardImplementation-Dateien und Manifest-/Coverage-Nachweis.

## Umsetzungshinweise

- Dieses Paket ist groß; falls der Start zu breit wird, zuerst Counter-Registry + Antibody-Access als Unterpaket abspalten.
- Scaldan berührt zusätzlich Bad Publicity und Random; die vorhandene `bad_publicity_7`-Matrix muss wiederverwendet werden.

## Ergebnisnotiz

Noch offen.
