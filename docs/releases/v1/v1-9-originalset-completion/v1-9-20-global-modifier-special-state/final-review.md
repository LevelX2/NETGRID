# V1.9.20 Final Review - Globale Modifier, Handgroesse, Action Economy und persistente Sonderzustaende

Stand: 2026-05-13

## Gate-Ergebnis

`V1_9_20_done: true`
`ready_for_V1_9_21: true`

V1.9.20 ist abgeschlossen. Alle 26 Zielkarten sind als `human_playable`, `deck_legal` und `ai_supported` freigegeben. Es wurde keine V1.9.21+-Karte promotet.

## Scope

- Runner: Emergency Self-Construct, Gremlins, Militech MRAM Chip, MRAM Chip, Diplomatic Immunity, Loan from Chiba, Preying Mantis.
- Korp-Agendas: Bioweapons Engineering, Black Ice Quality Assurance, Corporate Boon, Encryption Breakthrough, Ice Transmutation, Main-Office Relocation, Subsidiary Branch.
- Korp-Assets/Upgrades: City Surveillance, Euromarket Consortium, Fortress Architects, Hacker Tracker Central, I Got a Rock, Nevinyrral, Newsgroup Taunting, Pacifica Regional AI, Remote Facility, Rustbelt HQ Branch, South African Mining Corp, Jerusalem City Grid.

## Nachweis

- Runtime/Katalog: `ONR_V1_9_20_RELEASE_CARD_IDS` ist im Runtime-Releasepool und in `DECK_LEGAL_AI_APPROVAL_V1920_CARD_IDS` enthalten.
- Engine: `packages/engine/src/index.test.ts::V1.9.20 Global Modifier/Special-State WIP` deckt MRAM-MU, Action-Economy-Assets, Fortress-Architects-Rez-Kosten, Main-Office-Handlimit, Loan-from-Chiba-Recurring-State, Replay/StateHash, Visibility und applyAction-Revalidierung ab.
- Daten: `data/manifests/card-implementation-manifest-1.9.20.json`, `data/rules/mechanics-coverage-1.9.20.json` und `data/scenarios/v1920-global-modifier-special-state-release-smoke.json`.
- AI: `data/ai/ai-card-hints-deck-legal-v1920.json`, `data/scenarios/ai-deck-legal-v1920-smokes.json` und `data/manifests/deck-legal-ai-approval-v1920-manifest.json`.
- Webclient: sichtbare Version `V1.9.20`.

## Textentscheidung

Die finalen Kartentexte sind display-only aus den lokal bestaetigten Regelkern-Aussagen der V1.9.10-bis-V1.9.xx-Planungsartefakte abgeleitet. Sie sind keine Parser-, Engine-, LegalAction-, KI-, Replay- oder StateHash-Autoritaet.

## Checks

- JSON-Validation fuer `data/**/*.json`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 35 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 265 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 85 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 76 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## Restpunkte

Keine V1.9.20-Blocker. Der naechste erlaubte Release ist V1.9.21 Deterministischer Zufall und Wuerfelkarten.
