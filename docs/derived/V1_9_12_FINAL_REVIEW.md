# V1.9.12 Final Review - Counter, Virus, Purge und Recurring Pools

Stand: 2026-05-13 00:58 CEST
Status: final
Primaerer Agent: release-implementation-agent

## Scope

V1.9.12 schliesst den Counter-, Virus-/Purge- und Recurring-Pool-Slice fuer genau elf lokale O:NR-v1-Originalset-Karten ab:

- `onr_v1_009_butcher-boy`
- `onr_v1_010_cascade`
- `onr_v1_017_deep-thought`
- `onr_v1_032_i-spy`
- `onr_v1_064_skivviss`
- `onr_v1_082_deal-with-militech`
- `onr_v1_091_hunt-club-bbs`
- `onr_v1_174_rigged-investments`
- `onr_v1_176_the-shell-traders`
- `onr_v1_198_detroit-police-contract`
- `onr_v1_199_employee-empowerment`

Keine V1.9.13+-Karte und kein V2.x-Produktfeature wurde in diesen Release aufgenommen.

## Umsetzung

- Die elf Zielkarten sind in Runtime, Katalog und AI-Approval als `human_playable`, `deck_legal` und `ai_supported` freigegeben.
- Virus-Programme erhalten Virus-Counter und Recurring-Counter ueber Rules-Engine-State.
- `purge_virus_counters` bleibt Corp-only, kostet drei Clicks und entfernt nur Virus-Counter.
- Recurring-Counter auf Runner-Programmen und -Ressourcen refreshen am Runner-Turnstart ohne Akkumulation.
- I Spy, Deal with Militech und Hunt Club BBS verwenden die side-sicheren Hidden-Zone-Pfade aus V1.9.11.
- Detroit Police Contract und Employee Empowerment verwenden eng typisierte scored-Agenda-Resolver.
- Die sichtbare Webclient-Version steht auf `V1.9.12`.

## Textfinalisierung

Im festen Automations-Worktree lag keine versionierte lokale Volltextquelle fuer die elf Zielkarten vor. Nach `docs/derived/V1_9_ORIGINALSET_DISPLAY_TEXT_FINALIZATION_POLICY.md` wurden die finalen Kartentexte aus lokal bestaetigten Regelkern-Aussagen in den fuehrenden V1.9.10-bis-V1.9.xx-Artefakten abgeleitet.

Diese Texte sind display-only. Sie sind keine Parser-, Engine-, LegalAction-, KI-, Replay- oder StateHash-Autoritaet.

## Artefakte

- `data/manifests/card-implementation-manifest-1.9.12.json`
- `data/rules/mechanics-coverage-1.9.12.json`
- `data/scenarios/v1912-counter-virus-recurring-release-smoke.json`
- `data/ai/ai-card-hints-deck-legal-v1912.json`
- `data/scenarios/ai-deck-legal-v1912-smokes.json`
- `data/manifests/deck-legal-ai-approval-v1912-manifest.json`

## Verifikation

- JSON-Validation: pass, 233 `data/**/*.json`.
- `v1-9-install-and-check.ps1 -Task catalog`: pass, 27 Tests.
- `v1-9-install-and-check.ps1 -Task engine`: pass, 213 Tests.
- `v1-9-install-and-check.ps1 -Task ai`: pass, 84 Tests.
- `v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `v1-9-install-and-check.ps1 -Task web`: pass, 76 Tests.
- `v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `v1-9-install-and-check.ps1 -Task test`: pass.
- `v1-9-install-and-check.ps1 -Task lint`: pass.
- `v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## Gate-Ergebnis

`V1_9_12_done: true`

`ready_for_V1_9_13: true`

Der Automation-Cursor darf auf V1.9.13 wechseln.
