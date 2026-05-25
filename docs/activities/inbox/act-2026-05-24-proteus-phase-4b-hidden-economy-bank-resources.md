---
activityId: act-2026-05-24-proteus-phase-4b-hidden-economy-bank-resources
status: inbox
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 4b
blockedBy:
  - act-2026-05-24-proteus-phase-4a-hidden-resource-activation-foundation
resultArtifacts: []
checks: []
---

# Proteus Phase 4b: Hidden Economy and Bank Resources

## Ziel

Die verdeckten Proteus-Economy- und Bank-Resources als eigene CardImplementation-Dateien auf der 4a-Aktivierungsgrundlage umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `4b Hidden Economy/Bank Resources`.
- `docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.

## Zielkarten

- `onr_proteus_128_airport-locker` Airport Locker
- `onr_proteus_133_chiba-bank-account` Chiba Bank Account
- `onr_proteus_143_liberated-savings-account` Liberated Savings Account
- `onr_proteus_152_swiss-bank-account` Swiss Bank Account
- `onr_proteus_153_time-to-collect` Time to Collect

## Scope

- Hidden reveal economy, hosted/stored credits und Runner-Choice-Windows generisch über CardImplementation deklarieren.
- Aktivierungsergebnis öffentlich machen, ohne vor validiertem Reveal die konkrete verdeckte Quelle zu leaken.
- Kosten-, Choice- und Timing-Revalidierung für jede Zielkarte testen.

## Nicht im Scope

- Keine Hidden-Access-, Prevention-, Damage-, Tag- oder Sabotage-Familien.
- Keine Decklegalität und keine AI-Hints.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Economy-/Bank-Effekte nutzen generische Hidden-Resource-Aktivierungsbausteine.
- [ ] Runner-Choices und gespeicherte Credits sind deterministic replay- und StateHash-stabil.
- [ ] Korp-Views und PublicEvents leaken nicht gewählte oder nicht aktivierte Quellen nicht.
- [ ] Wrong-Side-, stale-action-, Kosten-, Choice-, Hidden-Info- und Coverage-Tests sind vorhanden.

## Ergebnisnotiz

Noch offen.
