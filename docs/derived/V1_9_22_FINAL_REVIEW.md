# V1.9.22 Final Review - Per-card Resolver Longtail und Originalset Completion Gate

Stand: 2026-05-14

## Gate-Ergebnis

`V1_9_22_done: true`
`V1_9_originalset_completion_done: true`
`ready_for_next_release: complete`

V1.9.22 ist abgeschlossen. Alle 47 Zielkarten sind als `human_playable`, `deck_legal` und `ai_supported` freigegeben. Damit ist die V1.9.10-bis-V1.9.22-Originalset-Completion-Kette vollständig durchlaufen; V2.x bleibt trotz Completion-Gate eine separate Produktentscheidung.

## Scope

- Runner-Programme: False Echo, Flak, Hammer, Japanese Water Torture, Netspace Inverter, Newsgroup Filter, Poltergeist, Rabbit, Reflector, Scatter Shot, Shield, Speed Trap, Startup Immolator und Zetatech Software Installer.
- Runner-Events: Anonymous Tip, Core Command: Jettison Ice, Forged Activation Orders, If You Want It Done Right..., misc.for-sale, Open-Ended Mileage Program, Organ Donor, Security Code WORM Chip, Synchronized Attack on HQ und Valu-Pak Software Bundle.
- Runner-Hardware: Arasaka Portable Prototype, Artemis 2020, Bodyweight Data Creche, Corolla Speed Chip, Microtech Backup Drive, Pandora's Deck, Parraline 5750, PK-6089a und ZZ22 Speed Chip.
- Korp-Karten: Corporate Retreat, Corporate War, Data Fort Reclamation, Marine Arcology, Political Overthrow, Security Purge, Haunting Inquisition, Tutor, Viral 15, Virizz, Zombie, Edgerunner, Inc., Temps, Off-Site Backups und Planning Consultants.

## Nachweis

- Runtime/Katalog: `ONR_V1_9_22_RELEASE_CARD_IDS` ist im Runtime-Releasepool und in `DECK_LEGAL_AI_APPROVAL_V1922_CARD_IDS` enthalten.
- Engine: `packages/engine/src/index.test.ts::V1.9.22 Per-card Longtail WIP` deckt die 47 Zielkarten ueber installierte Runner-Programme, Hardware, Runner-Events, scored-Agenda-Faehigkeiten, Corp-ICE-Resolver und Corp-Operations ab.
- Daten: `data/manifests/card-implementation-manifest-1.9.22.json`, `data/rules/mechanics-coverage-1.9.22.json`, `data/scenarios/v1922-per-card-longtail-release-smoke.json` und `data/reports/v1922-completion-gate-status.json`.
- AI: `data/ai/ai-card-hints-deck-legal-v1922.json`, `data/scenarios/ai-deck-legal-v1922-smokes.json` und `data/manifests/deck-legal-ai-approval-v1922-manifest.json`.
- Webclient: sichtbare Version `V1.9.22`; der Web-Katalog zeigt V1.9.22-Karten im `ai_supported`-Filter und liefert AI-Hints in Detailantworten.

## Textentscheidung

Die finalen Kartentexte sind display-only aus lokalen Fakten, Spoilerwertabgleich und den bestaetigten Regelkern-Aussagen der V1.9.22-Artefakte abgeleitet. Sie sind keine Parser-, Engine-, LegalAction-, KI-, Replay- oder StateHash-Autoritaet.

## Checks

- JSON-Validation fuer `data/**/*.json`: pass, 312 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 309 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 86 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 80 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass nach Wiederholung; der erste Lauf hatte einen nicht reproduzierbaren Vitest-Worker-Exit im Serverpaket, der isolierte Servercheck und der zweite Gesamtcheck waren gruen.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## Restpunkte

Keine V1.9.22-Blocker. Die Releasekette V1.9.10 bis V1.9.22 ist abgeschlossen; weitere Produkt- oder V2.x-Freigaben bleiben eigenstaendige Release-Planung.
