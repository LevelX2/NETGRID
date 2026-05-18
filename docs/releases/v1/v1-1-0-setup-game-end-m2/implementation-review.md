# V1.1.0 Implementation Review - Setup/Game-End M2 und NETGRID-Statusklarheit

Stand: 2026-05-07
Status: implemented

## Ergebnis

V1.1.0 ist umgesetzt. Neue Produktspiele starten explizit im Setup, Runner und Korp treffen private Mulligan-Entscheidungen über den bestehenden LegalActions-/PlayerActions-Vertrag, der Agenda-Zielstandard ist 7, und PlayerViews enthalten Identity sowie Agenda-Zielwert. Der Game-End-Vertrag für Agenda-Sieg, Korp-Deckout und Flatline ist durch Engine, Server, Replay, UI und Tests konsolidiert.

## Umgesetzter Scope

- `Phase` und `TimingPointId` um Setup/Mulligan erweitert.
- `SetupState` und `setupMode` ergänzt.
- `createGame` startet standardmäßig in explizitem Setup; `createGameAfterSetup` dient Tests/Harnesses.
- Setup-Mulligan als `resolve_choice` mit privater Choice und Hidden-Info-Barriere.
- Mulligan-Randomness über Seed, RandomCounter und RandomDrawRecords.
- `agendaPointsToWin` auf Produktstandard 7 normalisiert.
- `PlayerView` zeigt offene Identity und Agenda-Zielwert.
- Korp-Deckout im mandatory draw überschreibt nicht mehr den Game-over-Zustand.
- Multiplayer, Reconnect, AI-Advance und KI-Pacing auf Setup angepasst.
- Web-UI mit `Korp`, Rollenicons, Agenda-/Tag-Icons, Agenda `aktueller Wert / Zielwert`, Setup-Panel und side-safe Wartestatus.
- Browser-E2E-Helfer lösen Setup real über UI-Buttons.

## Geänderte Hauptmodule

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/chronicle.ts`
- `apps/web/app/action-cues.ts`
- `apps/web/app/match-start.ts`
- `apps/web/app/globals.css`
- `tests/e2e/helpers/match-flow.ts`
- `tests/specs/visibility-contract.test.ts`

## Architekturentscheidungen

- Die Rules Engine bleibt alleinige Regelautorität; Setup ist Engine-State und nicht UI-Orchestrierung.
- Mulligan nutzt den bestehenden Choice-Pfad statt eines Sonderprotokolls.
- `createGameAfterSetup` hält ältere Tests und Harnesses lesbar, ohne den Produktstart abzuschwächen.
- Runner-Deckout bleibt ausdrücklich nur vorbereitet; es wurde kein neuer Game-End-Grund aktiviert.
- Archive/facedown wird über bestehende Sichtbarkeitsdaten geschützt, ohne Full-Archives-Access vorzuziehen.
- Sichtbare Produkttexte verwenden `Korp`; technische IDs bleiben `corp`.

## Test- und Review-Befund

Die gezielten Tests für Engine, Server, Web und AI wurden aktualisiert und erweitert. Der finale Gate-Lauf ist in `docs/releases/v1/v1-1-0-setup-game-end-m2/final-review.md` dokumentiert.

## Bekannte Grenzen

- Full-Archives-Access bleibt ein späteres Gate.
- Runner-Deckout ist nicht als Siegbedingung aktiv.
- Core-Damage, Prevention, Avoid, Interrupt und Replacement bleiben gesperrt.
- Der Build zeigt weiterhin die bekannte Turbopack-NFT-Warnung zu `apps/web/next.config.ts`.
