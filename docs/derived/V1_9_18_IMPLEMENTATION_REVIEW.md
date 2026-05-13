# V1.9.18 Implementation Review

Status: final
Stand: 2026-05-13

## Umgesetzter WIP-Schnitt

- `docs/derived/V1_9_18_DETAILED_PLAN.md`, `V1_9_18_REQUIREMENTS.md`, `V1_9_18_GENERIC_UPGRADE_ROOT_SERVER_SPEC.md`, `V1_9_18_TEST_MATRIX.md` und `V1_9_18_REQUIREMENTS_REVIEW.md` frieren den ersten V1.9.18-Scope ein.
- `packages/shared/src/index.ts` enthält WIP-Runtime-Definitionen für alle 15 V1.9.18-Zielkarten mit finalen display-only Texten ohne `WIP`-Präfix.
- `packages/catalog/src/index.ts` führt `ONR_V1_9_18_WIP_CARD_IDS` als WIP-Zielmenge, ohne sie in `ONR_V1_RUNTIME_RELEASE_CARD_IDS` oder AI-Approval aufzunehmen.
- `packages/catalog/src/index.test.ts` schützt die WIP-Zielmenge und prüft No-Promotion gegen den Runtime-Releasepool.
- `packages/engine/src/index.test.ts` prüft 15/15 Runtime-Definitionen, finale display-only Texte, den No-Scope-Guard gegen V1.9.19 sowie mit Crybaby den ersten generischen Upgrade-/Root-Pfad für Corp-Install, Root-Rez, Runner-Access, Trash-on-access, Archives-Visibility und Payload-Redaction.
- `packages/engine/src/index.ts` und `packages/engine/src/index.test.ts` ergänzen Dedicated Response Team und Dieter Esslin als side-sichere Access-Ambush-Damage-Pfade sowie Turbeau Delacroix als Access-Trace-Fenster mit Corp-/Runner-Bid-Choices.
- Red Herrings ist als servergebundener Agenda-Steal-Tax im legalen `steal_agenda`-Fenster abgedeckt.
- City-Grid-/Region-Install ersetzt eine ältere Region im selben Remote und macht die alte Region in Archives sichtbar.
- Crystal Palace Station Grid und Dr. Dreff decken explizite Power-Counter-LegalActions für rezzed servergebundene Upgrades ab.
- New Galveston City Grid deckt einen side-sicheren R&D-Top-Reveal aus einem rezzed City-Grid-Upgrade ab.
- Paris City Grid deckt ein City-Grid-Trace-2-Tag-Fenster mit Korp-/Runner-Bid-Choices ab.
- Omni Kismet und Paris City Grid decken getaggter-Runner-Condition-LegalActions ab.
- Twenty-Four-Hour Surveillance deckt einen servergebundenen Run-Start-Tax ab, der durch Runner-Run-/Stealth-Recurring-Credits bezahlt werden kann.
- `data/scenarios/v1918-generic-upgrade-root-server-wip-smoke.json` dokumentiert den aktuellen WIP-Smoke maschinenlesbar ohne Release- oder AI-Promotion.
- `data/manifests/card-implementation-manifest-1.9.18.json`, `data/rules/mechanics-coverage-1.9.18.json`, `data/scenarios/v1918-generic-upgrade-root-server-release-smoke.json`, `data/ai/ai-card-hints-deck-legal-v1918.json`, `data/scenarios/ai-deck-legal-v1918-smokes.json` und `data/manifests/deck-legal-ai-approval-v1918-manifest.json` promoten die Zielmenge final.
- `packages/catalog/src/index.ts`, `packages/catalog/src/index.test.ts`, `packages/ai/src/index.test.ts` und `apps/web/app/api/cards/catalog-data.test.ts` führen die 15 V1.9.18-Karten im Runtime-/AI-Releasepool; `apps/web/app/page.tsx` zeigt `V1.9.18`.

## Textentscheidung

Die Kartentexte werden nach `docs/derived/V1_9_ORIGINALSET_DISPLAY_TEXT_FINALIZATION_POLICY.md` aus lokal bestätigten Regelkern-Aussagen in der V1.9.10-bis-V1.9.xx-Matrix abgeleitet. Sie sind display-only und keine Regel-, Parser-, KI-, Replay- oder StateHash-Autorität.

## Noch offen

- Keine V1.9.18-Completion-Gates offen. Folgearbeit beginnt mit V1.9.19 Agenda Difficulty, Scored Agenda Abilities und Overadvance.

## Gate

`V1_9_18_done: true`
`V1_9_18_phase: done`

## Verifikation

- JSON-Validation für `data/**/*.json`: pass, 272 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 251 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 33 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 85 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 76 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- Nach Release-Promotion erneut geprüft: JSON-Validation pass, 272 Dateien; `catalog` pass, 33 Tests; `web` pass, 76 Tests.
