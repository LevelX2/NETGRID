---
activityId: act-2026-05-24-proteus-phase-8a-counter-taxonomy-purge-foundation
status: inbox
kind: implementation
area: engine
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 8a
blockedBy: []
resultArtifacts: []
checks: []
---

# Proteus Phase 8a: Counter Taxonomy/Purge Foundation

## Ziel

Die generische Grundlage für purgefähige Runner-Virus-Counter, Antibody-/Advancement-Abgrenzung, Proteus-Purge und CounterDisplay-Projektion schaffen, ohne Zielkarten zu promoten.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `8a Counter Taxonomy/Purge Foundation`.
- `docs/releases/proteus/virus-antibody-counter-contract.md`.
- `docs/releases/proteus/purge-action-debt-contract.md`.
- Bestehende O:NR-v1-Virus-/Counter-/Purge-Muster.

## Zielkarten

Keine Zielkartenpromotion.

## Scope

- Purgeable Runner-Virus-Counter vs. Antibody-/Advancement-Counter.
- Proteus-Purge-Grundlage mit Action Debt/Forgo Actions.
- CounterDisplay-Projektion und public-safe Payloads.
- Replay-/StateHash-stabile Counter- und Action-Debt-Zustände.

## Nicht im Scope

- Keine Antibody-, Agenda-, Run-, Access- oder Random-Zielkarten aus 8b bis 8f.
- Keine AI-Hints oder Decklegalität.
- Keine Alias-Änderung am bestehenden V0.99-Main-Action-Purge ohne explizite Kompatibilität.

## Akzeptanzkriterien

- [ ] Counter-Taxonomie ist runtime- und testseitig eindeutig.
- [ ] Purge entfernt nur registrierte purgefähige Runner-Virus-Counter und lässt Antibody-/Advancement-Counter stehen.
- [ ] Action-Debt ist LegalAction-basiert, StateHash-relevant, kumulierbar und deterministisch abtragbar.
- [ ] PlayerView/PublicPayload/Replay leaken keine privaten Counter- oder Kandidatenlisten.
- [ ] Folge-Slices 8b bis 8f können deklarativ auf der Grundlage aufsetzen.

## Ergebnisnotiz

Noch offen.
