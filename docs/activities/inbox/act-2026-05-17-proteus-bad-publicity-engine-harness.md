---
activityId: act-2026-05-17-proteus-bad-publicity-engine-harness
status: inbox
kind: test
area: engine
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget: Proteus planning
blockedBy:
  - act-2026-05-17-proteus-bad-publicity-loss-gate
resultArtifacts: []
checks: []
---

# Proteus Bad-Publicity-7+-Engine-Harness

## Ziel

Der Bad-Publicity-7+-Game-End-Vertrag aus `docs/derived/PROTEUS_BAD_PUBLICITY_LOSS_GATE_CONTRACT.md` soll durch einen engen Engine-Harness abgesichert werden, ohne Proteus-Karten zu promoten.

## Kontext und Quellen

- Vertragsartefakt: `docs/derived/PROTEUS_BAD_PUBLICITY_LOSS_GATE_CONTRACT.md`
- Proteus-Cluster: `bad_publicity_loss_gate` in `data/rules/proteus-mechanics-coverage-2026-05-17.json`
- Bestehende Basis: `docs/derived/RECURRING_BAD_PUBLICITY_0.99_SPEC.md`, `docs/derived/V1_1_0_TEST_MATRIX.md`

## Scope

- Minimalen Testpfad fuer `corp.badPublicity >= 7` als Game-End-Check definieren oder implementieren.
- Prioritaet gegen Korp-Agenda-Sieg, Runner-Agenda-Sieg, Flatline und Korp-Deckout testen.
- PublicPayload-/PlayerView-/Replay-/StateHash-Redaction fuer den neuen Ergebnisgrund absichern.

## Nicht im Scope

- Keine Proteus-Kartenpromotion.
- Keine Proteus-Decklegalitaet.
- Keine AI-Strategie fuer Bad-Publicity-Decks.
- Keine breiten Proteus-Resolver.

## Akzeptanzkriterien

- [ ] Harness prueft mindestens die Matrix P-BP-T001 bis P-BP-T010 oder dokumentiert bewusst ausgelassene Faelle.
- [ ] Neuer Game-End-Grund ist durch Engine-, API-/Shared-Typen und Ergebnisprojektion konsistent, falls Code umgesetzt wird.
- [ ] Hidden-Info-, Replay- und StateHash-Gates bleiben gruen.

## Umsetzungshinweise

- Bevorzugt synthetische Testfixtures oder lokale Harness-Karten statt Proteus-Runtime-Promotion verwenden.
- Bei Scaldan-artigem Zufall nur Seed, `randomCounter` und `RandomDrawRecords` verwenden.
- PublicPayload darf verdeckte Hidden-Resource-Quellen nur als redigierte Quelle ausweisen.

## Ergebnisnotiz

Noch offen.
