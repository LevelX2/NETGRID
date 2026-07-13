# Implementation Review: Beobachtbare KI-gegen-KI-Simulation

Status: abgeschlossen
Stand: 2026-07-13
Prozess: `docs/architecture/ai/ai-vs-ai-observer-process-2026-07-13.md`

## Ergebnis

Der Spielstart `Simulation` führt nicht mehr den synchronen Batchlauf mit
`maxActions: 120` aus. Er erstellt jetzt ein persistiertes Match im Modus
`ai_vs_ai` und öffnet unmittelbar das normale, side-sichere Spielbrett. Runner
und Korp besitzen eigene KI-Controller; die lokale Hostsession ist ausschließlich
Beobachter und Ablaufcontroller.

Die Simulationssteuerung bietet vier ausdrückliche Zustände beziehungsweise
Aktionen:

- `Pause` stoppt den lokalen Automatik-Takt und lässt den letzten Zustand stehen.
- `Einzelschritt` führt genau eine persistierte Engine-Aktion aus.
- `Weiter` fordert getaktet einzelne Engine-Aktionen an.
- `Schnell` verkürzt nur den Abstand; auch hier bleibt jeder Server-Advance ein
  `single_step`.

`Simulation abbrechen` verwendet den bestehenden Lifecycle-`cancel`-Pfad. Der
letzte echte Engine-State bleibt sichtbar, es wird kein Sieger erzeugt und die
Tokens werden entwertet. Ein reguläres Spiel läuft dagegen ohne fachliches
Aktionslimit bis zu einer Engine-Siegbedingung.

## Vertragsgrenzen

- Der Browser erhält eine gültige Runner-`PlayerView`; gegnerische verdeckte
  Informationen bleiben verdeckt.
- Die Beobachtersession erhält keine ausführbaren `LegalActions` und darf keine
  `PlayerAction` für eine KI-Seite einreichen.
- Der initiale Spielzustand wird gespeichert und ausgeliefert, bevor die erste
  KI-Aktion ausgeführt wird.
- Reconnect, AI-Traces, PublicEvents, Replay und StateHash stammen aus demselben
  `StoredMatch` wie die beobachtete Partie.
- Beobachtete KI-Spiele sind im ersten Slice ausschließlich `Regelmatch` ohne
  Spielerzeit. KI-vs-KI-Matchserien und öffentliche Zuschauerrollen bleiben
  außerhalb des Umfangs.
- `/api/simulations/ai-vs-ai` bleibt für Batch-Benchmarks bestehen, ist aber
  nicht mehr mit dem interaktiven Startknopf verbunden.

## Relevante Umsetzung

- Shared/Server: `ai_vs_ai` ist ein echter `ApiMatchMode`; HTTP, SQLite,
  Controllerzuordnung, Observer-Autorisierung, side-sichere Payloads,
  Einzelschritt und aktiver Lifecycle-Abbruch sind erweitert.
- Web: Matchstart, Session-Recovery, neutrale Beobachtertexte,
  Simulationssteuerung, Ergebnisdarstellung und Abbruchdialog verwenden den
  persistierten Matchpfad.
- Tests: REST-Anlage, verbotene PlayerAction, Einzelpersistenz, Abbruch,
  Reconnect, Long-Run, Traces und Replay sind regressiv abgesichert.

Paketcommits:

- `a00e78bb0 docs(ai): plan observable ai-vs-ai process`
- `764065cc3 feat(server): add observable ai-vs-ai matches`
- `23e2da284 feat(web): observe and control ai-vs-ai matches`
- `6ab4e67ab test(ai): cover observable long-run simulations`

## Verifikation

Grün:

- `corepack pnpm --filter @netgrid/shared typecheck`
- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm --filter @netgrid/web typecheck`
- drei fokussierte Observer-/REST-/Long-Run-Tests in
  `apps/server/src/multiplayer.test.ts`
- 119 fokussierte Webtests aus `match-start.test.ts`,
  `session-recovery.test.ts` und `action-board-ui.test.ts`
- `git diff --check`

Der deterministische Long-Run `observable-ai-vs-ai-long-run` wurde nach Aktion
121 erfolgreich reconnectet und endete nach 183 einzeln persistierten Aktionen
regulär mit `corp_deck_empty`. Der vollständige Replay-StateHash ist grün; alle
183 Decision-Traces sind vorhanden.

Der reale Browserlauf über `scripts/start-netgrid.ps1` und Playwright bestätigte:

- `Simulation beobachten` öffnet das Spielbrett statt einer Ergebnisbox.
- Beide KI-Seiten, Chronik und die vier Steuerungen sind sichtbar.
- Pause hält den Zustand stabil.
- Ein manueller Schritt fügt genau eine sichtbare Aktion hinzu.
- Der bestätigte Abbruch lässt den letzten Boardzustand ohne Sieger sichtbar.

Die Browserkonsole meldete ausschließlich bereits fehlende lokale
Kartenbilddateien mit HTTP 404; für den neuen Ablauf trat kein Laufzeitfehler
auf.

## Restgrenzen

- Die Beobachtungsperspektive bleibt vorerst Runner-seitig; ein Wechsel der
  PlayerView-Perspektive ist nicht implementiert.
- Die vorhandene große Komponente `apps/web/app/page.tsx` bleibt ein
  Komplexitätsschwerpunkt. Für diesen Slice wurde kein sachfremdes Redesign
  vorgenommen.
- Batch-Benchmarks behalten ihre technischen Aktionsgrenzen. Das ist getrennt
  vom interaktiven, bis zum Engine-Ende laufenden Beobachtungsmodus.

