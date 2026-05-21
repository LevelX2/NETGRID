---
activityId: act-2026-05-21-no-limit-count-up-player-clock
status: done
kind: concept
area: server
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt: 2026-05-21
completedAt: 2026-05-21
branch:
releaseTarget: player clock / time controls
blockedBy: []
resultArtifacts:
  - packages/shared/src/api-contracts.ts
  - apps/server/src/multiplayer.ts
  - apps/server/src/multiplayer.test.ts
  - apps/web/app/match-timer-ui.ts
  - apps/web/app/match-timer-ui.test.ts
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
  - docs/architecture/live-match/player-clock-grace-period-contract-2026-05-19.md
checks:
  - corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts -t "player clock"
  - corepack pnpm --filter @netgrid/web test -- match-timer-ui.test.ts
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/server typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
relatedActivities:
  - act-2026-05-19-player-clock-grace-period-contract
  - act-2026-05-19-player-clock-grace-period-implementation
  - act-2026-05-17-timer-ui-only-clock
---

# No-Limit-Spielerzeit hochzählend anzeigen

## Ziel

Partien ohne Zeitbegrenzung sollen trotzdem die verbrauchte Entscheidungszeit je Seite sichtbar machen. Die Anzeige soll der bestehenden Zeitlimit-Anzeige möglichst ähnlich bleiben, aber hochzählend statt herunterzählend arbeiten und keine Zeitablauf-Regelwirkung haben.

## Kontext und Quellen

- Nutzerhinweis vom 2026-05-21: Auch ohne Zeitbegrenzung könnte die verbrauchte Zeit von Hannah und Korp gemessen werden; statt von einem Basiswert herunterzuzählen, soll die Anzeige hochzählen, z. B. fünf oder sechs Minuten verbrauchte Zeit.
- `docs/architecture/live-match/player-clock-grace-period-contract-2026-05-19.md`: `mode: "none"` ist bisher ohne Spielerzeit, ohne Abzug und ohne Niederlage durch Zeitablauf; die sichtbare Matchlaufzeit darf bleiben.
- `docs/activities/done/act-2026-05-19-player-clock-grace-period-implementation.md`: optionale serverautorisierte Spielerzeit mit Grundfrist und Zeitbalken ist umgesetzt.
- `docs/activities/done/act-2026-05-17-timer-ui-only-clock.md`: frühere UI-only-Uhr darf Orientierung anzeigen, aber keine Engine-, Server- oder Regelwirkung erzeugen.

## Scope

- Produkt-/Contract-Abgleich für `mode: "none"`:
  - keine Restzeit,
  - kein Zeitablauf,
  - keine Niederlage durch Timer,
  - aber sichtbare kumulierte Verbrauchszeit je Seite.
- No-Limit-Zeitmessung je Seite definieren:
  - Zeit zählt für den aktuellen Entscheidungseigner,
  - dieselben Aktivitätswechsel wie beim Spielerzeitmodell sollen die aktuelle Messperiode begrenzen,
  - automatische Effekte, Animationen, Chronikdarstellung und technische Wartezeiten zählen nicht als verbrauchte Spielerzeit.
- UI-Verhalten festlegen und umsetzen:
  - bestehender Zeitbalken oder dieselbe Anzeigezone wie bei Zeitlimit weiterverwenden,
  - beide Seiten zeigen hochzählende Verbrauchswerte,
  - aktuelle entscheidende Seite wird markiert,
  - keine rote Ablauf-/Critical-Darstellung, weil es keinen Grenzwert gibt,
  - Text und Labels müssen klar machen, dass es um verbrauchte Zeit geht, nicht um verbleibende Zeit.
- Reconnect/Reload berücksichtigen:
  - nach Reconnect soll die hochgezählte Zeit plausibel und konsistent weiterlaufen,
  - keine alten lokalen Timerreste dürfen doppelt gezählt werden.
- Tests für No-Limit-Verhalten ergänzen:
  - Server/API- oder Web-Test, je nachdem wo die Messung liegt,
  - UI-Test für die hochzählende Darstellung,
  - Regression, dass `mode: "none"` weiterhin kein `time_expired` auslösen kann.

## Nicht im Scope

- Keine neue Zeitlimit-Variante, kein zusätzlicher Countdown-Preset und keine Turnierregel.
- Keine Änderung an `player_clock`-Restzeit, Grundfrist, Zeitablauf oder `time_expired`.
- Keine clientseitige Alleinautorität für eine persisted oder reconnectfähige Spielerzeit.
- Keine Timerdaten in Engine-Replay, StateHash, `AIInput`, `DecisionDebug`, PublicEvents oder Hidden-Info-nahen Payloads.
- Keine Chronikmeldung für jede einzelne kurze Entscheidung.

## Akzeptanzkriterien

- [ ] Ohne Zeitbegrenzung zeigt die Matchoberfläche pro Seite eine hochzählende verbrauchte Zeit.
- [ ] Die Anzeige verwendet denselben oder einen visuell konsistenten Ort wie die Zeitlimit-Anzeige.
- [ ] Der aktuelle Entscheidungseigner ist sichtbar markiert.
- [ ] Die Werte zählen nicht von einem Startbudget herunter und zeigen keinen Ablauf-/Critical-Zustand.
- [ ] `mode: "none"` erzeugt weiterhin keine Zeitablauf-Niederlage und keinen `time_expired`-Lifecycle-Grund.
- [ ] Reconnect/Reload erzeugt keine doppelte Zählung und zeigt einen plausiblen fortgesetzten Stand.
- [ ] Timer-Payloads bleiben ohne Hidden Cards, Tokens, Decklisten, FullState, `AIInput`, `DecisionDebug` oder private Choice-Details.
- [ ] Replay und StateHash bleiben durch No-Limit-Zeitmessung unverändert.
- [ ] Passende Server-/Shared-/Web-Tests oder begründete kleinere Testabdeckung sind ergänzt.

## Umsetzungshinweise

- Primärer Folgeagent: `release-implementation-agent`.
- Wahrscheinliche Startpunkte:
  - `docs/architecture/live-match/player-clock-grace-period-contract-2026-05-19.md` für die Contract-Nachschärfung,
  - `packages/shared/src/api-contracts.ts` für additive Snapshot-Felder, falls die Messung serverseitig projiziert wird,
  - `apps/server/src/multiplayer.ts` und `apps/server/src/http-server.ts` für serverseitige No-Limit-Verbrauchszeit,
  - `apps/web/app/match-timer-ui.ts`, `apps/web/app/page.tsx` und `apps/web/app/globals.css` für Darstellung,
  - bestehende Player-Clock-Tests als Regressionseinstieg.
- Wenn die vorhandene Implementierung bereits genug serverseitige Aktivitätsdaten für `mode: "none"` berechnet, soll das Paket klein bleiben und diese Daten nur sauber projizieren und darstellen.
- Wenn die Analyse zeigt, dass nur eine lokale, nicht reconnectfähige Komfortanzeige sinnvoll ist, muss das im Ergebnis begründet und gegen den Reconnect-Anspruch abgegrenzt werden.

## Ergebnisnotiz

Umgesetzt: `mode: "none"` führt nun serverseitig eine hochzählende, reconnectfähige Verbrauchszeit je Side, ohne Restzeitkonto, Grundfrist, Critical-/Expired-Warnung oder `time_expired`-Lifecycle-Folge. Die Matchoberfläche nutzt den bestehenden Uhrenbereich weiter, markiert die aktuell entscheidende Side und beschriftet No-Limit-Werte als verbrauchte Zeit. Der API-Snapshot wurde additiv um `consumedMs` erweitert; der Architekturvertrag dokumentiert die neue No-Limit-Projektion und die Hidden-Info-Grenzen.

Checks: Server-Player-Clock-Test, Web-Timer-Helper-Test, Shared-Typecheck, Server-Typecheck, Web-Typecheck und `git diff --check` sind grün. Parallel vorhandene, nicht paketbezogene Arbeitsbaumänderungen wurden nicht mitgestaged.
