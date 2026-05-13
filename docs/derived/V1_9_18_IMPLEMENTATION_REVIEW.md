# V1.9.18 Implementation Review

Status: WIP
Stand: 2026-05-13

## Umgesetzter WIP-Schnitt

- `docs/derived/V1_9_18_DETAILED_PLAN.md`, `V1_9_18_REQUIREMENTS.md`, `V1_9_18_GENERIC_UPGRADE_ROOT_SERVER_SPEC.md`, `V1_9_18_TEST_MATRIX.md` und `V1_9_18_REQUIREMENTS_REVIEW.md` frieren den ersten V1.9.18-Scope ein.
- `packages/shared/src/index.ts` enthält WIP-Runtime-Definitionen für alle 15 V1.9.18-Zielkarten mit finalen display-only Texten ohne `WIP`-Präfix.
- `packages/catalog/src/index.ts` führt `ONR_V1_9_18_WIP_CARD_IDS` als WIP-Zielmenge, ohne sie in `ONR_V1_RUNTIME_RELEASE_CARD_IDS` oder AI-Approval aufzunehmen.
- `packages/catalog/src/index.test.ts` schützt die WIP-Zielmenge und prüft No-Promotion gegen den Runtime-Releasepool.
- `packages/engine/src/index.test.ts` prüft 15/15 Runtime-Definitionen, finale display-only Texte, den No-Scope-Guard gegen V1.9.19 sowie mit Crybaby den ersten generischen Upgrade-/Root-Pfad für Corp-Install, Root-Rez, Runner-Access, Trash-on-access, Archives-Visibility und Payload-Redaction.
- `packages/engine/src/index.ts` und `packages/engine/src/index.test.ts` ergänzen Dedicated Response Team und Dieter Esslin als side-sichere Access-Ambush-Damage-Pfade sowie Turbeau Delacroix als Access-Trace-Fenster mit Corp-/Runner-Bid-Choices.
- Red Herrings ist als servergebundener Agenda-Steal-Tax im legalen `steal_agenda`-Fenster abgedeckt.
- `data/scenarios/v1918-generic-upgrade-root-server-wip-smoke.json` dokumentiert den aktuellen WIP-Smoke maschinenlesbar ohne Release- oder AI-Promotion.

## Textentscheidung

Die Kartentexte werden nach `docs/derived/V1_9_ORIGINALSET_DISPLAY_TEXT_FINALIZATION_POLICY.md` aus lokal bestätigten Regelkern-Aussagen in der V1.9.10-bis-V1.9.xx-Matrix abgeleitet. Sie sind display-only und keine Regel-, Parser-, KI-, Replay- oder StateHash-Autorität.

## Noch offen

- Weitere konkrete LegalAction-/applyAction-Abdeckung für Grid-/Region-, City-Grid-, Counter-, Run-Flow-, Tag-Condition- und Stealth-Pfade.
- Release-Manifest, Mechanics-Coverage, Release-Smoke, AI-Hints, AI-Smokes und AI-Approval-Manifest.
- Server-/Web-Gates, vollständige Pflichtchecks, Final Review und Webclient-Version `V1.9.18`.

## Gate

`V1_9_18_done: false`
`V1_9_18_phase: implementing`

## Verifikation

- JSON-Validation für `data/**/*.json`: pass, 266 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 248 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 32 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
