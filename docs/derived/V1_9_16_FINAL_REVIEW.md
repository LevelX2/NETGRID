# V1.9.16 Final Review - Program Subtypes, Hosting, Stealth, Worm und Installed-card Destroy

Stand: 2026-05-13 09:55 CEST
Status: final

## Gate-Ergebnis

`V1_9_16_done: true`

`ready_for_V1_9_17: true`

V1.9.16 ist als Release-Slice abgeschlossen. Alle 16 Zielkarten sind im privaten lokalen O:NR-v1-Originalset `human_playable`, `deck_legal` und `ai_supported`. Die sichtbare Webclient-Version steht auf `V1.9.16`.

## Abgeschlossener Scope

- Alle 16 Zielkarten von `Baedeker's Net Map` bis `Fragmentation Storm` sind in Runtime, Katalog, Manifest, Mechanics-Coverage, AI-Hints, AI-Smokes und AI-Approval-Manifest release-promotet.
- Runner-Programme installieren ueber explizite `install_card`-LegalActions mit MU-/Kosten-Revalidierung; Daemon-Hosting nutzt zielgebundene `hostOnCardId`-Actions.
- `Imp` hostet `Bakdoor` side-sicher; `Fragmentation Storm` kann den Daemon trashen und kaskadiert gehostete Programme replay-/StateHash-stabil in den Heap.
- Installierte Link-Karten tragen nur als oeffentliche installierte Karten zum side-sicheren Trace-Bid-Fenster bei.
- Stealth-/Recurring-Karten initialisieren und refreshen `recurring_credit` deterministisch ohne Akkumulation.
- `Fragmentation Storm` nutzt Trace 4 ohne Tag-Effekt; Programm-Trash und Net Damage laufen nur bei erfolgreichem Trace, Erfolg und Misserfolg replayen zum finalen StateHash.

## Artefakte

- `data/manifests/card-implementation-manifest-1.9.16.json`
- `data/rules/mechanics-coverage-1.9.16.json`
- `data/scenarios/v1916-program-subtype-hosting-stealth-smoke.json`
- `data/ai/ai-card-hints-deck-legal-v1916.json`
- `data/manifests/deck-legal-ai-approval-v1916-manifest.json`
- `data/scenarios/ai-deck-legal-v1916-smokes.json`

## Text- und Regelautoritaet

Die V1.9.16-Kartentexte sind finale display-only Texte aus lokal bestaetigten Regelkern-Aussagen nach `docs/derived/V1_9_ORIGINALSET_DISPLAY_TEXT_FINALIZATION_POLICY.md`. Kartentext bleibt keine Parser-, Engine-, LegalAction-, KI-, Replay- oder StateHash-Autoritaet.

## Verifikation

- JSON-Validation: pass, 258 `data/**/*.json`.
- `v1-9-install-and-check.ps1 -Task engine`: pass, 232 Tests.
- `v1-9-install-and-check.ps1 -Task catalog`: pass, 31 Tests.
- `v1-9-install-and-check.ps1 -Task ai`: pass, 85 Tests.
- `v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `v1-9-install-and-check.ps1 -Task web`: pass, 76 Tests.
- `v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `v1-9-install-and-check.ps1 -Task test`: pass.
- `v1-9-install-and-check.ps1 -Task lint`: pass.
- `v1-9-install-and-check.ps1 -Task build`: pass; bekannte nicht-blockierende Turbopack-NFT-Warnung bleibt.

## Grenzen

- Keine V1.9.17+-Karten wurden freigegeben.
- Keine generische `trigger_ability`-Freischaltung.
- Keine offiziellen Assets, externen Kartendatenbank-Abhaengigkeiten oder V2.x-Produktfeatures.
