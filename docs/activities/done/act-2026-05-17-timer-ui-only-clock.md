---
activityId: act-2026-05-17-timer-ui-only-clock
status: done
kind: implementation
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-5
releaseTarget:
blockedBy:
  - docs/architecture/live-match/visible-match-timer-system-concept-2026-05-17.md
resultArtifacts:
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
  - apps/web/app/match-timer-ui.ts
  - apps/web/app/match-timer-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/web exec vitest run app/match-timer-ui.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Sichtbare UI-Uhr ohne Regelwirkung

## Ziel

Im Spielbereich soll eine kompakte sichtbare Uhr erscheinen, die Matchlaufzeit und aktuelle Entscheidungs-/Seitenzeit zeigt, ohne Engine-, Server- oder Regelwirkung.

## Kontext und Quellen

- `docs/architecture/live-match/visible-match-timer-system-concept-2026-05-17.md`

## Scope

- UI-only-Anzeige für Matchlaufzeit und aktive Seite/Entscheidungsalter.
- Anzeige darf lokal zwischen vorhandenen Server-/PlayerView-Updates weiterzählen.
- UI-Text bleibt deutsch und side-sicher.
- Optionaler Platz im Chat-/Lobbybereich nur, wenn ohne Layoutdrift möglich.

## Nicht im Scope

- Keine harten Zeitlimits.
- Kein Auto-Pass, Aktionsverlust, Forfeit oder Spielverlust.
- Keine Änderung an `applyAction`, `LegalActions`, `PlayerActions`, `GameState`, Replay, StateHash oder KI.
- Kein neuer Server-/WebSocket-Vertrag.

## Akzeptanzkriterien

- [x] Sichtbare Uhr ist im aktiven Matchbereich vorhanden und stört Board-/Action-Flächen nicht.
- [x] Uhr basiert nur auf bereits side-sicheren Daten und lokaler Anzeigezeit.
- [x] Uhr erzeugt keine Actions und verändert keine Engine-/Serverdaten.
- [x] Reconnect/Reload zeigt eine plausible neue Anzeige ohne alte lokale Timerreste.
- [x] Web-Typecheck und relevante UI-Tests laufen.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`.
- Wenn ein autoritativer Server-Snapshot fehlt, Anzeige klar als Orientierung behandeln und nicht als Deadline.

## Ergebnisnotiz

Kompakte UI-only-Uhr im aktiven Boardbereich umgesetzt. Sie zeigt lokale Matchlaufzeit seit dem geladenen aktiven Match, aktive Seite bzw. sichtbaren Entscheidungsstatus und das Alter des aktuellen side-sicheren Entscheidungssnapshots. Die Anzeige ist ausdrücklich als Orientierung markiert, erzeugt keine Actions und berührt keine Engine-, Server-, WebSocket-, Replay-, StateHash- oder KI-Verträge.

Checks grün: `corepack pnpm --filter @netgrid/web exec vitest run app/match-timer-ui.test.ts`, `corepack pnpm --filter @netgrid/web typecheck`, `git diff --check`.

Hinweis: Ein früherer breiter Web-Testaufruf über das Paket-Script lief nicht als fokussierter Dateifilter und zeigte eine bestehende, nicht paketbezogene Abweichung in `app/action-board-ui.test.ts` (`Stärke +1 ... gegen Data Wall (ICE 2)` statt `... gegen ICE 2`). Diese Activity ändert `action-board-ui` nicht.
