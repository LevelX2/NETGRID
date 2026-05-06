# V1.0.7 Final Review - Browser-E2E und Visual QA

Stand: 2026-05-06
Status: done

## Gate-Ergebnis

V1.0.7 Browser-E2E und Visual QA ist umgesetzt und lokal verifiziert.

`V1_0_7_implemented: true`

`V1_0_7_verified: true`

`V1_0_7_done: true`

## Gate-Befehl

```txt
corepack pnpm e2e
```

Alias:

```txt
corepack pnpm test:e2e
```

Der Befehl startet den Multiplayer-Server und die Next-Web-App auf freien lokalen Ports, setzt `NETRUNNER_MATCH_STORAGE_PATH` auf eine temporäre Datei unter `tmp/e2e-runtime-*` und führt Playwright Chromium aus.

## Geprüfte Viewports

- Desktop: 1280x720.
- Tablet: 1024x768.
- Schmal: 390x844.

## Geprüfte Flows

- Human-vs-KI Desktop mit KI-Takt, Gegner-Cue, menschlicher Aktion, Actions, Credits, Kostenchips und Card-Display.
- Human-vs-Human Desktop mit Host, Join-Link, Joiner-Deckauswahl, Ready-Lobby, Countdown und aktivem Spiel in zwei getrennten Browser-Kontexten.
- Lifecycle/Reconnect mit Cancel, Recreate, Joiner-Leave, Fortsetzen/Wieder verbinden, Reload, Forfeit und Verwerfen.
- Tablet-Board mit direkter Server-Run-Action, Run-Ziel, RunTimeline, Card-Display und Layoutscan.
- Schmalviewport mit Textfit, Action-Buttons, Cue-Bereich, RunTimeline, Card Preview, Card-Display und Layoutscan.
- Hidden-Info-Flow mit verdeckter Corp-Installation und Runner-Redaction.
- Runtime-Isolation gegen die normale lokale `data/runtime/multiplayer/matches.json`.

## Artefakte

Der erfolgreiche Lauf erzeugte Screenshots unter `test-results/e2e/`:

- `desktop-human-vs-ai-active.png`
- `desktop-human-vs-human-host-active.png`
- `desktop-human-vs-human-joiner-active.png`
- `desktop-lifecycle-terminal.png`
- `tablet-active-board-run.png`
- `narrow-active-board-run.png`
- `desktop-hidden-install-corp.png`
- `desktop-hidden-install-runner-redacted.png`

Zusätzliche Playwright-Artefakte:

- `test-results/e2e/.last-run.json`
- `playwright-report/` für den lokalen HTML-Report
- Traces, Videos und Failure-Screenshots werden bei Fehlschlägen durch die Playwright-Konfiguration behalten.

## Leak-Befund

Kein Hidden-Info-, Token-, Decklisten-, Bildpfad- oder DOM-Leak wurde im V1.0.7-Gate festgestellt.

Geprüft wurden DOM-Text, relevante Attribute, LocalStorage, `netrunner.recentSessions` und empfangene WebSocket-Payloads. Gesperrte sichtbare Muster umfassen Session-/Reconnect-/Join-Tokens, private Payloads, `cardInstances`, `decklist`, sichtbare `deckHash`-/`cardDefinitionId`-Lecks, Card-Back-Bildrouten und konkrete verdeckte Kartentitel.

Hinweis: `deckHash` bleibt in bestehenden side-sicheren Serverpayloads Vertragsmetadatum und wurde in V1.0.7 nicht als Serververtragsänderung entfernt. Der Browser-Gate stellt sicher, dass es nicht mehr im DOM/Storage als sichtbare lokale UI-Leakfläche auftaucht.

## Checks

- `corepack pnpm e2e`: pass, 7/7 Playwright-Tests.
- `corepack pnpm --filter @netrunner/web test`: pass, 4 Testdateien, 27 Tests.
- `corepack pnpm --filter @netrunner/server test`: pass, 1 Testdatei, 34 Tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 13 Tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass; bekannte Turbopack-NFT-Warnung bleibt als Warnung ohne Build-Fehler.
- `git diff --check`: pass; nur CRLF-Hinweise für bestehende Arbeitskopie-Konvertierung.

## Scope-Abgleich

V1.0.7 hat keine neuen Karten, Mechaniken, offiziellen Assets, Replay-/StateHash-/Randomness-Erweiterungen, Accounts, öffentlichen Lobbys, Matchmaking-, Ranking-, Turnier- oder Chat-Funktionen eingeführt.

Der neue Stand ist ein Qualitätsinfrastruktur-Gate über bestehende V1.x-Flows.
