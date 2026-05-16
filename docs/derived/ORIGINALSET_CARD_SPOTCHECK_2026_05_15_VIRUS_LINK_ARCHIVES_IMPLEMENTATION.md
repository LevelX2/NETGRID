# Originalset-Spotcheck Umsetzung 2026-05-15 Virus/Link/Archives

Quelle: `docs/derived/originalset-spotcheck-jobs/done/spotcheck-2026-05-15-virus-link-archives.md`

## Ergebnis

Der Job ist fachlich `done`. Die ursprünglich offenen Resolververträge wurden durch den Folgejob `spotcheck-2026-05-16-runner-breaker-prevention-resolvers` abgeschlossen:

- `Pile Driver`: Multi-Subroutine-Wall-Breaker für bis zu vier Subroutinen plus exakt 3 Stealth-Verlust.
- `Full Body Conversion`: Meat-Damage-Prevention-Fenster mit vollständiger Prevention und Korp-Zahlungs-/Bypass-Modell.

Umgesetzt wurden die sicheren, eng begrenzten Härtungen:

- `Cockroach`: Multi-Copy-Counter-Schwelle, wrong-side/stale Discard-Choice und public-payload-sicherer Counter-Nachweis.
- `Replicator`: echter Trace-Subroutine-Breaker mit Pump statt generischem Trace-Link-Stub.
- `Scatter Shot`: 2 restricted Recurring Credits für accessed Upgrade-Trashkosten, Asset-Negativfall und Runner-Zugstart-Refresh.
- `Access through Alpha`: Base Link 9 und genau eine Base-Link-Quelle pro Trace.
- `Detroit Police Contract`, `Off-Site Backups`, `Urban Renewal`: fokussierte Revalidation-/No-target-/Tag-Drift-Tests.
- `Red Herrings`: Agenda-Steal-Tax bleibt im selben Run aktiv, wenn der Runner Red Herrings zuvor trasht.

## Geänderte Artefakte

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/catalog/src/index.test.ts`
- `data/ai/ai-card-hints-deck-legal-v1914.json`
- `data/ai/ai-card-hints-deck-legal-v1916.json`
- `data/ai/ai-card-hints-deck-legal-v1922.json`
- `data/manifests/card-implementation-manifest-1.9.14.json`
- `data/manifests/card-implementation-manifest-1.9.16.json`
- `data/manifests/card-implementation-manifest-1.9.22.json`
- `data/rules/mechanics-coverage-1.9.22.json`
- `data/rules/v1922-local-card-facts.json`
- `data/rules/v1922-resolver-contracts.json`
- `data/scenarios/v1922-per-card-longtail-release-smoke.json`
- `data/scenarios/v1922-per-card-longtail-wip-smoke.json`
- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`
- `data/reports/originalset-card-spotcheck-register.json`

## Tests

Die vollständigen Pflichtchecks werden im Jobbericht und Abschlussbericht dokumentiert.

## Abschluss

Follow-up 2026-05-16: `spotcheck-2026-05-16-runner-breaker-prevention-resolvers` hat `Pile Driver` und `Full Body Conversion` mit eigenen Resolververträgen umgesetzt und grün geprüft. Der Sammeljob wird deshalb als `done` geführt.
