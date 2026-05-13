# V1.9.21 Final Review - Deterministischer Zufall und Wuerfelkarten

Stand: 2026-05-13

## Gate-Ergebnis

`V1_9_21_done: true`
`ready_for_V1_9_22: true`

V1.9.21 ist abgeschlossen. Alle sechs Zielkarten sind als `human_playable`, `deck_legal` und `ai_supported` freigegeben. Es wurde keine V1.9.22-Karte promotet.

## Scope

- Runner: AI Boon, Boardwalk, Playful AI, Quest for Cattekin.
- Korp: Schlaghund, Rio de Janeiro City Grid.

## Nachweis

- Runtime/Katalog: `ONR_V1_9_21_RELEASE_CARD_IDS` ist im Runtime-Releasepool und in `DECK_LEGAL_AI_APPROVAL_V1921_CARD_IDS` enthalten.
- Engine: `packages/engine/src/index.test.ts::V1.9.21 Deterministic Random WIP` deckt Asset-, Upgrade-, Runner-Programm-, Event- und Resource-Zufallspfade mit `RandomDrawRecords`, Wrong-Side-Revalidation, PublicEvent-Redaction sowie Replay-/StateHash-Stabilitaet ab.
- Daten: `data/manifests/card-implementation-manifest-1.9.21.json`, `data/rules/mechanics-coverage-1.9.21.json` und `data/scenarios/v1921-deterministic-random-release-smoke.json`.
- AI: `data/ai/ai-card-hints-deck-legal-v1921.json`, `data/scenarios/ai-deck-legal-v1921-smokes.json` und `data/manifests/deck-legal-ai-approval-v1921-manifest.json`.
- Webclient: sichtbare Version `V1.9.21`.

## Textentscheidung

Die finalen Kartentexte sind display-only aus den lokal bestaetigten Regelkern-Aussagen der V1.9.10-bis-V1.9.xx-Planungsartefakte abgeleitet. Sie sind keine Parser-, Engine-, LegalAction-, KI-, Replay- oder StateHash-Autoritaet.

## Checks

- JSON-Validation fuer `data/**/*.json`: pass, 299 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 36 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 271 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 85 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 77 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## Restpunkte

Keine V1.9.21-Blocker. Der naechste erlaubte Release ist V1.9.22 Per-card Resolver Longtail und Originalset Completion Gate.
