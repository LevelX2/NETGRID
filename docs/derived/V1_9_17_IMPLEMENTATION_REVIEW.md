# V1.9.17 Implementation Review

Status: WIP
Stand: 2026-05-13

## Umgesetzter WIP-Schnitt

- `docs/derived/V1_9_17_DETAILED_PLAN.md`, `V1_9_17_REQUIREMENTS.md`, `V1_9_17_GENERIC_ASSET_NODE_SPEC.md`, `V1_9_17_TEST_MATRIX.md` und `V1_9_17_REQUIREMENTS_REVIEW.md` frieren den ersten V1.9.17-Scope ein.
- `packages/shared/src/index.ts` enthält WIP-Runtime-Definitionen für alle 18 V1.9.17-Zielkarten mit finalen display-only Texten ohne `WIP`-Präfix.
- `packages/catalog/src/index.ts` führt `ONR_V1_9_17_WIP_CARD_IDS` als WIP-Zielmenge, ohne sie in `ONR_V1_RUNTIME_RELEASE_CARD_IDS` oder AI-Approval aufzunehmen.
- `packages/catalog/src/index.test.ts` schützt die WIP-Zielmenge und prüft No-Promotion.
- `packages/engine/src/index.ts` bietet für rezzed V1.9.17-Economy-Assets eine typisierte, öffentliche `gain_credit`-LegalAction mit applyAction-Revalidierung auf rezzed Corp-Root, Zielkarte und festen WIP-Betrag von 2 Credits.
- `packages/engine/src/index.ts` ergänzt einen deterministischen Start-of-turn-Credit für rezzed V1.9.17-Recurring-/Campaign-Assets.
- `packages/engine/src/index.ts` bietet für Blood Cat und Krumz eine typisierte öffentliche Trace-3-Asset-LegalAction, die das bestehende side-sichere Trace-Bid-Fenster nutzt.
- `packages/engine/src/index.ts` ergänzt konkrete V1.9.17-WIP-LegalAction-Pfade für Corporate Negotiating Center als side-sicheren R&D-Top-Reveal, Rescheduler als Korp-private R&D-Top-2-Reorder-Choice, Solo Squad als typisierte Meat-Damage-Asset-Fähigkeit sowie Setup!/TRAP! als Access-gebundene Ambush-Pfade mit Net Damage und TRAP!-Tag.
- `packages/engine/src/index.ts` nimmt `v1917AssetAbility` in den LegalAction-ID-Schlüssel auf, damit mehrere Assetfähigkeiten derselben installierten Karte nicht per `actionId` kollidieren.
- `packages/engine/src/index.test.ts` prüft 18/18 Runtime-Definitionen, finale display-only Texte, den No-Scope-Guard gegen V1.9.18 sowie den generischen ESA-Contract-Pfad für Corp-Install, Rez, öffentliche Economy-Asset-Fähigkeit, Runner-Access, Trash-on-access, Archives-Visibility und Payload-Redaction. Zusätzlich sind alle acht Economy-Assets für öffentliche Gain-Credit-LegalActions, alle fünf Recurring-Assets gemeinsam für Turnstart-Credits, Blood Cat und Krumz für Trace-3-Fenster, Corporate Negotiating Center/Rescheduler für Hidden-Zone-Redaction/Reorder, Solo Squad für Damage-Replay und Setup!/TRAP! für Access-Ambush-Replay abgedeckt.
- `data/scenarios/v1917-generic-asset-node-wip-smoke.json` dokumentiert den aktuellen WIP-Smoke maschinenlesbar ohne Release- oder AI-Promotion.

## Textentscheidung

Die Kartentexte wurden nach `docs/derived/V1_9_ORIGINALSET_DISPLAY_TEXT_FINALIZATION_POLICY.md` aus lokal bestätigten Regelkern-Aussagen in der V1.9.10-bis-V1.9.xx-Matrix abgeleitet. Sie sind display-only und keine Regel-, Parser-, KI-, Replay- oder StateHash-Autorität.

## Noch offen

- Konkrete LegalAction-/applyAction-Abdeckung für die übrigen Campaign/Economy-, Recurring-, Hosting-, Virus/Counter/Prevention-, installierte-Ziele- und nicht final promoteten Asset-Pfade.
- Release-Manifest, Mechanics-Coverage, Release-Smoke, AI-Hints, AI-Smokes und AI-Approval-Manifest.
- Server-/Web-Gates, vollständige Pflichtchecks, Final Review und Webclient-Version `V1.9.17`.

## Verifikation

- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 234 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 31 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- JSON-Validation für `data/**/*.json`: pass, 259 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 85 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 76 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

Nach dem Hidden-Zone-/Ambush-/Damage- und Economy-/Recurring-Breitenschnitt verifiziert:

- JSON-Validation für `data/**/*.json`: pass, 259 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 241 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 31 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 85 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests. Ein paralleler Zwischenlauf brach einmal mit einem Vitest-Worker-Fehler ab; isolierter Re-Run war grün.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 76 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

Nach dem Economy-/Recurring-/Trace-Asset-Teilschnitt erneut vollständig verifiziert:

- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 236 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 31 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- JSON-Validation für `data/**/*.json`: pass, 259 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 85 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 76 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## Gate

`V1_9_17_done: false`
`V1_9_17_phase: implementing`
