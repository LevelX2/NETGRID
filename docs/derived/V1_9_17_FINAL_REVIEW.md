# V1.9.17 Final Review - Generische Asset/Node-Fähigkeiten

Stand: 2026-05-13 12:12 CEST
Status: final

## Gate-Ergebnis

`V1_9_17_done: true`

`ready_for_V1_9_18: true`

V1.9.17 ist als Release-Slice abgeschlossen. Alle 18 Zielkarten sind im privaten lokalen O:NR-v1-Originalset `human_playable`, `deck_legal` und `ai_supported`. Die sichtbare Webclient-Version steht auf `V1.9.17`.

## Abgeschlossener Scope

- Alle 18 Zielkarten von `BBS Whispering Campaign` bis `TRAP!` sind in Runtime, Katalog, Manifest, Mechanics-Coverage, AI-Hints, AI-Smokes und AI-Approval-Manifest release-promotet.
- Generische Asset-/Node-Pfade decken Corp-Install, Root-Rez, Runner-Access, Trash-on-access, Archives-Visibility und Payload-Redaction ab.
- Economy-/Campaign-Assets haben öffentliche `gain_credit`-LegalActions; Recurring-Assets refreshen deterministisch am Corp-Turnstart ohne Akkumulation.
- Blood Cat und Krumz nutzen side-sichere Trace-3-Fenster.
- Corporate Negotiating Center und Rescheduler nutzen Hidden-Zone-Barrieren für R&D-Reveal und Korp-private R&D-Reorder-Choices.
- Cowboy Sysop und Disinfectant, Inc. decken sichtbare Zielpfade für installierte Runner-Karten und Virus-Counter ab.
- Solo Squad, Setup! und TRAP! decken Damage-/Tag-/Access-Ambush-Pfade replay-/StateHash-stabil ab.
- Gehostete Korp-Karten kaskadieren beim Host-Trash nach Archives.

## Artefakte

- `data/manifests/card-implementation-manifest-1.9.17.json`
- `data/rules/mechanics-coverage-1.9.17.json`
- `data/scenarios/v1917-generic-asset-node-release-smoke.json`
- `data/ai/ai-card-hints-deck-legal-v1917.json`
- `data/manifests/deck-legal-ai-approval-v1917-manifest.json`
- `data/scenarios/ai-deck-legal-v1917-smokes.json`

## Text- und Regelautorität

Die V1.9.17-Kartentexte sind finale display-only Texte aus lokal bestätigten Regelkern-Aussagen nach `docs/derived/V1_9_ORIGINALSET_DISPLAY_TEXT_FINALIZATION_POLICY.md`. Kartentext bleibt keine Parser-, Engine-, LegalAction-, KI-, Replay- oder StateHash-Autorität.

## Verifikation

- JSON-Validation: pass, 265 `data/**/*.json`.
- `v1-9-install-and-check.ps1 -Task engine`: pass, 243 Tests.
- `v1-9-install-and-check.ps1 -Task catalog`: pass, 32 Tests.
- `v1-9-install-and-check.ps1 -Task ai`: pass, 85 Tests.
- `v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `v1-9-install-and-check.ps1 -Task web`: pass, 76 Tests.
- `v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `v1-9-install-and-check.ps1 -Task test`: pass.
- `v1-9-install-and-check.ps1 -Task lint`: pass.
- `v1-9-install-and-check.ps1 -Task build`: pass; bekannte nicht-blockierende Turbopack-NFT-Warnung bleibt.

## Grenzen

- Keine V1.9.18+-Karten wurden freigegeben.
- Keine generische `trigger_ability`-Freischaltung.
- Keine offiziellen Assets, externen Kartendatenbank-Abhängigkeiten oder V2.x-Produktfeatures.
