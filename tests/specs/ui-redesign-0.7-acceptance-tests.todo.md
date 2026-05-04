# UI Redesign 0.7 Acceptance Tests

Status: Requirements Freeze
Stand: 2026-05-03

## Artifact und Requirements

- [x] V07-T001: V0.7-Dokumente existieren; alle Must-IDs stehen in Requirements und Testmatrix.
- [x] V07-T001: `MVP_0.7_REQUIREMENTS_REVIEW.md` enthält `ready_for_implementation: true`.

## UI und Visual Smokes

- [x] V07-T002: Entry folgt Design C und zeigt keine öffentlichen Plattformfunktionen.
- [x] V07-T007: Katalog, Decks, Match erstellen, Match fortsetzen und Diagnostics sind erreichbar.
- [x] V07-T008: RunnerBoard zeigt Runner-Zonen, Rig, Run-Fokus und LegalActions.
- [x] V07-T010: CorpBoard zeigt Corp-HQ, Server, Remotes, Runner Public Info, Rez Window und LegalActions.
- [x] V07-T015: Desktop- und schmaler Viewport haben keine überlappenden Panels oder auslaufenden Buttons.

## Hidden Info und Datenbindung

- [x] V07-T004: UI-Mapping nutzt nur `PlayerView`, `LegalActions`, side-gefilterte Events, Receipts und lokale UI-State.
- [x] V07-T005: Browserseite importiert keine Engine und rendert keinen `GameState`.
- [x] V07-T009: Runner-HTML/Payload enthält keine Corp-HQ/R&D/unrezzed-Titel.
- [x] V07-T011: Corp-HTML/Payload enthält keine Runner-Grip-/Stack-Titel.
- [x] V07-T013: EventLog, Undo, Reconnect und Diagnostics zeigen keine Tokens oder privaten Payloads.

## Run, Actions und Cards

- [x] V07-T003: Aktiver Run zeigt Timeline, Encounter, Break und Access verständlich.
- [x] V07-T012: Pending, stale und rejected Actions sind sicher modelliert.
- [x] V07-T014: CardView-Modi `placeholder`, `text-card`, `compact`, `preview`, `zoom`, `hidden` und `redacted` funktionieren.
- [x] V07-T017: Card-Display-Wechsel verändert keinen Match-State und keine LegalActions.
- [x] V07-T018: Ohne Asset-Freigabe werden keine externen oder offiziellen Kartenbilder geladen.

## Accessibility und Regression

- [x] V07-T019: Fokusreihenfolge, Labels, Tastaturbedienung und Kontrast sind geprüft.
- [x] V07-T020: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestehen.
