# V1.9.20 Implementation Review

Status: runtime WIP
Stand: 2026-05-13

## Umgesetzter Schnitt

- Detailplan, Requirements, Spezifikation, Testmatrix und Requirements Review sind erstellt.
- Der Scope ist auf 26 Zielkarten festgelegt.
- `packages/catalog/src/index.ts` führt `ONR_V1_9_20_WIP_CARD_IDS` als exakte 26er-Zielmenge.
- `packages/catalog/src/index.test.ts` schützt die Zielmenge und bestätigt, dass V1.9.20 noch nicht im Runtime-Releasepool steht.
- `data/scenarios/v1920-global-modifier-special-state-wip-smoke.json`, `data/manifests/card-implementation-manifest-1.9.20.json` und `data/rules/mechanics-coverage-1.9.20.json` dokumentieren den WIP-Scope maschinenlesbar ohne Promotion.
- 26/26 V1.9.20-Zielkarten haben Runtime-Definitionen in `packages/shared/src/index.ts` mit finalen display-only Texten ohne `WIP`-Präfix.
- `packages/engine/src/index.test.ts` schützt die Runtime-Zielmenge mit V1.9.21-No-Promotion-Sentinel und deckt Militech MRAM Chip/MRAM Chip als ersten legalen MU-Installationspfad mit PlayerView-Projektion ab.
- `packages/engine/src/index.ts` ergänzt einen ersten eng typisierten V1.9.20-Action-Economy-Assetpfad für rezzed Remote Facility/Nevinyrral/Pacifica Regional AI; `applyAction` revalidiert Side, rezzed Root-Quelle, Kartenfamilie und `gainedActions`.
- Fortress Architects ist als erster globaler statischer Modifier an die bestehende ICE-Rez-Kostenberechnung angebunden; der Effekt ist an eine sichtbare rezzed Root-Quelle gebunden.
- Main-Office Relocation projiziert nach dem Scoren einen öffentlichen Korp-Handgrößenmodifier in beiden PlayerViews, ohne `state.corp.maxHandSize` als Basiswert zu überschreiben.
- Loan from Chiba trägt als erster persistenter Sonderzustand öffentliche Recurring-Credit-Counter, die über Turnwechsel deterministisch erneuert werden.
- Die abgedeckten MRAM-, Action-Economy-, globalen Rez-Kosten-, Handgrößen- und Recurring-State-Pfade haben Replay-/StateHash-Assertions in `packages/engine/src/index.test.ts`.
- Nicht-promotende AI-Draft-Artefakte sind vorbereitet: `data/ai/ai-card-hints-deck-legal-v1920-draft.json`, `data/scenarios/ai-deck-legal-v1920-draft-smokes.json` und `data/manifests/v1920-deck-legal-ai-approval-draft-manifest.json`. Alle Karten bleiben darin `hinted_only`, nicht `ai_supported`.
- Es wurden noch keine Runtime-, AI- oder Web-Promotionen vorgenommen.

## Gate

`V1_9_20_done: false`
`V1_9_20_phase: implementing`

## Nächster Schnitt

Weitere Kartenpfade, Visibility-Lücken, finale AI-Smokes, Release-Promotion und Final Review nachziehen.

## Verifikation

- JSON-Validation für `data/**/*.json`: pass, 285 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 264 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 34 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 85 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 76 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
