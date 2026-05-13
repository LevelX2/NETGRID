# V1.9.19 Final Review - Agenda Difficulty, Scored Agenda Abilities und Overadvance

Status: final
Stand: 2026-05-13

## Ergebnis

V1.9.19 ist als Release-Slice abgeschlossen. Alle 20 Zielkarten sind im privaten lokalen O:NR-v1-Originalset `human_playable`, `deck_legal` und `ai_supported`. Die sichtbare Webclient-Version steht auf `V1.9.19`.

## Freigegebene Karten

- Runner: Fait Accompli, Arasaka Owns You.
- Korp-Agendas: Artificial Security Directors, Genetics-Visionary Acquisition.
- Korp-Operationen: Falsified-Transactions Expert, Management Shake-Up, Project Consultants, Silver Lining Recovery Protocol, Systematic Layoffs, Team Restructuring.
- Korp-Assets: Chicago Branch, Corprunner's Shattered Remains, Experimental AI, Information Laundering, Vacant Soulkiller, Vapor Ops, Virus Test Site.
- Korp-Upgrades/Regionen: Olivia Salazar, Roving Submarine, Washington, D.C., City Grid.

## Gate-Ergebnis

- Runtime-/Catalog-Promotion: erfüllt über `ONR_V1_9_19_RELEASE_CARD_IDS`.
- AI-Promotion: erfüllt über `DECK_LEGAL_AI_APPROVAL_V1919_CARD_IDS` und `data/manifests/deck-legal-ai-approval-v1919-manifest.json`.
- Manifest/Coverage/Szenarien: erfüllt über `card-implementation-manifest-1.9.19.json`, `mechanics-coverage-1.9.19.json`, `v1919-agenda-overadvance-release-smoke.json`, AI-Hints und AI-Smokes.
- Engine-Regelautorität: LegalActions/applyAction revalidieren Agenda-Difficulty, Overadvance, Counter, Forfeit-Kosten, Access-Ambush und Steal-Kosten.
- Hidden-Info/Replay: R&D-Reveal, Access-Ambush, Damage, öffentliche Kosten und Replay/StateHash sind in fokussierten Engine-Smokes abgedeckt.
- Scope: keine V1.9.20+-Karte wurde freigegeben; Emergency Self-Construct bleibt außerhalb des Releasepools.

## Textentscheidung

Die V1.9.19-Kartentexte sind finale display-only Texte aus lokal bestätigten Regelkern-Aussagen nach `docs/derived/V1_9_ORIGINALSET_DISPLAY_TEXT_FINALIZATION_POLICY.md`. Kartentext bleibt keine Parser-, Engine-, LegalAction-, KI-, Replay- oder StateHash-Autorität.

## Verifikation

- JSON-Validation für `data/**/*.json`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 258 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 34 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 85 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 76 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## Abschluss

`V1_9_19_done: true`
`ready_for_V1_9_20: true`
