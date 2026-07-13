# Beobachtbare KI-gegen-KI-Simulation Prozess

Status: in_progress
Stand: 2026-07-13
Primärer Agent: release-implementation-agent
Arbeitsbranch: `codex/ai-vs-ai-observer`
Arbeits-Worktree: `C:\Projekte\NETGRID_AI_VS_AI_OBSERVER`

## Quelle und Vorgabe

Der Spielstart bietet aktuell `Simulation · KI gegen KI zum Beobachten und
Testen` an, führt aber nur einen synchronen Batchlauf aus. Der Webclient wartet
auf dessen Zusammenfassung und zeigt kein Spielbrett. Zusätzlich begrenzt der
Client den Lauf hart auf 120 Aktionen; der dadurch erreichte Zwischenstand wird
als `Aktionslimit erreicht` dargestellt.

Der gewünschte Endzustand ist ein tatsächlich beobachtbarer KI-gegen-KI-Modus:

- Nach dem Start wird das normale Spielbrett angezeigt.
- Jeder einzelne KI-Schritt verändert sichtbar genau einen Brettzustand.
- Der Beobachter kann pausieren, genau einen Schritt ausführen, getaktet oder
  schnell weiterlaufen lassen.
- Die laufende Simulation kann weiterhin ausdrücklich abgebrochen werden.
- Eine reguläre Partie läuft ohne fachliches Aktionslimit bis zu einem von der
  Rules Engine bestimmten Spielende.
- Replay, StateHash, KI-Traces und Datenbankstand gehören zu derselben
  beobachteten Partie.

## Zielprüfung

Die Vorgabe ist für automatische Umsetzung ausreichend präzise.

- Gesamtziel: den bisherigen Batchpfad am Spielstart durch ein gespeichertes,
  live fortschaltbares KI-vs-KI-Match ersetzen.
- Reihenfolge: Prozessartefakt, Shared-/Serververtrag, Webfluss, Regression und
  Review, finaler Main-Abgleich.
- In Scope: Matchmodus, Matchstart, Beobachterberechtigung, AI-Advance,
  Pausen-/Weiter-/Schrittsteuerung, aktiver Abbruch, Reconnect, Persistenz,
  Replay-/StateHash-Gates und fokussierte UI.
- Nicht-Ziele: neue KI-Heuristiken, neue Karten oder Mechaniken, Public
  Spectator, FullState im Client, parallele Simulationen oder eine neue
  Benchmarkoberfläche.
- Abnahme: Jeder Server-Advance führt höchstens eine sichtbare Engine-Aktion
  aus; die Partie endet regulär oder wird ausdrücklich abgebrochen.

Konservative Annahmen:

- Der lokale Beobachter erhält eine an die Runner-Seite gebundene
  Beobachtersession, aber keine ausführbaren `LegalActions`.
- Das Spielbrett zeigt eine gültige Runner-`PlayerView`; gegnerische verdeckte
  Informationen bleiben verdeckt. Ein Perspektivwechsel ist nicht Teil dieses
  ersten Slices.
- `Einzelschritt` ist zugleich der pausierte Zustand. `Getaktet` und `Schnell`
  steuern nur die lokale Verzögerung; auch `Schnell` sendet ausschließlich
  einzelne AI-Advance-Anforderungen.
- `Regelmatch` ist der verbindliche erste Slice. Eine KI-vs-KI-Matchserie wird
  nicht stillschweigend simuliert und bleibt außerhalb dieses Prozesses.

## Gesamtziel

`ai_vs_ai` wird ein persistierter Matchmodus des Multiplayer-Service. Beide
Seiten werden von KI-Controllern gesteuert, während der lokale Host nur
Beobachter und Ablaufcontroller ist. WebSocket-Bootstrap, PlayerView,
side-gefilterte Events, Chronicle, AI-Traces, Replay und StateHash verwenden
denselben Stored-Match-Pfad wie andere aktive Matches.

Der bisherige Endpunkt `/api/simulations/ai-vs-ai` bleibt als technischer
Batch-/Benchmarkpfad erhalten, wird aber vom interaktiven Spielstart nicht mehr
verwendet.

## Annahmen

- Der aktuelle Engine- und KI-Entscheidungspfad kann beide AI-Controller bereits
  aus einem `GameState` auswählen; erweitert werden Matchmodus, Berechtigung und
  Präsentation, nicht die KI-Regellogik.
- Aktive KI-vs-KI-Simulationen werden über den bestehenden Lifecycle-Endpunkt
  `cancel` abgebrochen und erhalten den terminalen Status `cancelled`, ohne
  Sieger und ohne künstlichen Engine-Endzustand.
- Falls eine KI keine legale Entscheidung erzeugen kann oder `applyAction`
  ablehnt, stoppt der Automatiklauf sichtbar mit einem sicheren Fehler. Der
  Zustand wird nicht als reguläres Spielergebnis umgedeutet.
- Der Hauptworkspace enthält beim Prozessstart fremde, uncommittete
  Matchstart-/Deckauswahländerungen. Sie werden nicht verändert. Vor dem finalen
  Merge werden sie erneut klassifiziert und beide kompatiblen Intentionen
  erhalten.

## Nicht-Ziele

- Kein Entfernen oder Abschwächen des bestehenden Batch-Simulators für CLI,
  Benchmarks und Soak-Läufe.
- Kein echtes Public-Spectator- oder Zuschauerrollenmodell.
- Kein Senden von FullState, gegnerischen Handkarten, Deckreihenfolgen oder
  unredigierten KI-Eingaben an den Browser.
- Kein menschlicher Eingriff in KI-`LegalActions`.
- Keine neue Engine-Aktion, kein geändertes Siegkriterium und kein künstlicher
  Draw nach einer festen Aktionszahl.
- Keine neue Matchserienlogik für zwei KI-Seiten.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- Jede KI wählt ausschließlich aus aktuellen `LegalActions`; `applyAction`
  validiert die Auswahl erneut.
- Die Beobachtersession darf `advance_ai`, Preview/Trace und Lifecycle-Abbruch
  auslösen, aber niemals eine PlayerAction für eine KI-Seite einreichen.
- Der an den Browser gesendete Brettzustand bleibt eine gültige, side-sichere
  `PlayerView`.
- Ein AI-Advance im beobachtbaren Modus führt genau eine Engine-Aktion aus.
- Keine automatische Initialaktion darf vor dem ersten sichtbaren
  Spielbrett-Bootstrap stattfinden.
- Jeder akzeptierte Schritt wird gespeichert, über WebSocket verteilt und ist
  im Replay mit StateHash reproduzierbar.
- Ein Abbruch bewahrt den letzten echten Engine-State, setzt keinen Sieger und
  entwertet die Sessiontokens über den bestehenden Lifecycle-Pfad.

## Automatische Fehlerbehandlung

- Stale State oder Stale Match: aktuellen side-sicheren Payload übernehmen und
  den nächsten Schritt erst daraus ableiten.
- KI-Entscheidung nicht legal oder Engine-Aktion abgelehnt: Automatik pausieren,
  sichere Fehlermeldung anzeigen, Matchzustand nicht als Sieg oder Draw ändern.
- WebSocket getrennt: keine weiteren Schritte senden; Reconnect stellt denselben
  Stored-Match-Stand wieder her.
- Fokussierter Test scheitert: Fehler eng im aktiven Paket debuggen; kein
  Paketwechsel vor grünem Done-Gate.
- Technische Schutzgrenzen dürfen einen Lauf nur als Fehler stoppen. Sie dürfen
  nicht als `action_limit_reached` oder reguläres Ergebnis erscheinen.

## Sicherheitsblocker

Stop ohne Rückfrage, wenn:

- sichtbare Einzelschritte nur durch FullState oder gegnerische private Daten im
  Browser möglich wären;
- der Beobachter nur durch das Zulassen menschlicher `PlayerActions` auf einer
  KI-Seite steuerfähig wäre;
- ein reguläres Spielende ohne Änderung der Engine-Siegregeln nicht erreichbar
  wäre;
- der finale Merge die fremden uncommitteten Hauptworkspace-Änderungen nicht
  sicher erhalten kann.

Removal Condition: Blockerbericht mit betroffener Datei, Ursache, sicherer
Alternative und konkret benötigter Entscheidung.

## State Machine

```text
AIVIEW-00_process
  -> AIVIEW-01_match_contract
  -> AIVIEW-02_visible_web_control
  -> AIVIEW-03_regression
  -> AIVIEW-04_review_and_knowledge
  -> integrate_main
  -> cleanup
  -> complete
```

Laufzeit:

```text
create_ai_vs_ai
  -> visible_initial_player_view
  -> paused | paced | fast
  -> single_ai_action
  -> visible_player_view
  -> paused | paced | fast | engine_finished | cancelled | safe_error
```

## Paketfolge

### AIVIEW-00: Prozessartefakt

Ziel: Diesen Prozess als verbindliche Arbeitsgrundlage im Worktree anlegen.

Eingangsvoraussetzungen:

- Worktree und Branch existieren.
- Fremde Hauptworkspace-Änderungen sind als unangetasteter Parallelstand
  klassifiziert.

Konkrete Arbeit:

- Ziel, Scope, Invarianten, Paketfolge und Abschlussregeln dokumentieren.

Kernartefakt:

- `docs/architecture/ai/ai-vs-ai-observer-process-2026-07-13.md`

Tests/Checks:

- `git diff --check`

Done-Gate:

- Prozess beschreibt sichtbare Einzelschritte, Pause/Weiter, Abbruch,
  reguläres Spielende, Hidden-Info-Grenze und Integration.

Commit-Message:

- `docs(ai): plan observable ai-vs-ai process`

### AIVIEW-01: Matchvertrag und Serversteuerung

Ziel: `ai_vs_ai` als gespeicherten Matchmodus mit zwei KI-Controllern und
beobachtender Hostsession bereitstellen.

Konkrete Arbeit:

- Shared- und Storage-Verträge um `ai_vs_ai` erweitern.
- Matchanlage mit zwei AI-Controllern und einem ausgewählten KI-Deckpaar
  ermöglichen.
- Keine KI-Aktion vor dem initialen PlayerView-Bootstrap ausführen.
- Beobachter darf KI schrittweise fortsetzen und Preview nutzen, aber keine
  PlayerAction einreichen.
- Side-Payload für Beobachter enthält keine ausführbaren `LegalActions`.
- Aktiven KI-vs-KI-Lauf über Lifecycle `cancel` abbrechbar machen.
- Reconnect, Speicherung, Replay, StateHash und AI-Traces auf dem bestehenden
  Matchpfad halten.

Kernartefakte:

- `packages/shared/src/api-contracts.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/multiplayer-payload.ts`
- `apps/server/src/http-server.ts`
- `apps/server/src/storage-sqlite.ts`
- fokussierte Server-/Shared-Tests

Tests/Checks:

- Shared-Vertragstests
- fokussierte Multiplayer-/HTTP-/SQLite-Tests
- `git diff --check`

Done-Gate:

- Beide Controller sind KI, Host ist steuernder Beobachter, genau ein Advance
  erzeugt genau eine persistierte Engine-Aktion, PlayerActions sind gesperrt und
  aktiver Abbruch erzeugt keinen Sieger.

Commit-Message:

- `feat(server): add observable ai-vs-ai matches`

### AIVIEW-02: Sichtbarer Webfluss und Ablaufsteuerung

Ziel: Der Spielstart öffnet das normale Spielbrett und macht jeden KI-Schritt
bedienbar und sichtbar.

Konkrete Arbeit:

- `Simulation` über `/api/matches` statt Batch-Endpunkt starten.
- Simulationsdecks in den Match-Create-Vertrag überführen.
- Ergebnisbox und `maxActions: 120` aus dem interaktiven Startfluss entfernen.
- Beobachtungsansicht sprachlich von `Du spielst Runner` trennen.
- Persistente Simulationsteuerung mit Einzelschritt, Weiter, Schnell und Pause
  anbieten.
- Für KI-vs-KI auch im Schnellmodus ausschließlich `single_step` senden.
- Aktiven Lauf mit bestätigtem `Simulation abbrechen` über Lifecycle `cancel`
  beenden.

Kernartefakte:

- `apps/web/app/match-start.ts`
- `apps/web/app/page.tsx`
- `apps/web/features/match-start/MatchHostConsole.tsx`
- `apps/web/features/debug/AiPacingControls.tsx`
- `apps/web/features/app-shell/ActiveMatchTopbar.tsx`
- fokussierte Webtests

Tests/Checks:

- Matchstart-/Pacing-/Topbar-Komponententests
- Web-Typecheck
- `git diff --check`

Done-Gate:

- Start zeigt sofort das Brett; jede sichtbare Aktualisierung entspricht genau
  einem Schritt; Pause/Weiter/Schnell/Einzelschritt und Abbruch sind erreichbar;
  keine 120-Aktionen-Grenze bleibt im interaktiven Pfad.

Commit-Message:

- `feat(web): observe and control ai-vs-ai matches`

### AIVIEW-03: Regression und End-to-End-Verträge

Ziel: Die fachlichen und sicherheitsrelevanten Anforderungen automatisiert
absichern.

Konkrete Arbeit:

- Matchanlage mit zwei AI-Controllern testen.
- Initialzustand ohne vorgezogene KI-Aktion prüfen.
- Einzelschritt gegen StateVersion, Eventzahl und StateHash prüfen.
- Menschliche PlayerAction im Beobachtermodus ablehnen.
- Abbruch eines aktiven Laufs ohne Sieger prüfen.
- Reconnect und side-sichere PlayerView prüfen.
- Einen deterministischen Lauf über mehr als 120 Aktionen bis zum regulären
  Engine-Ende oder eine entsprechend kontrollierte Long-Run-Regression prüfen,
  ohne Aktionslimit als Ergebnisgrund.
- Replay und StateHash des beobachteten Laufs prüfen.

Kernartefakte:

- `apps/server/src/multiplayer.test.ts`
- `apps/server/src/http-server.test.ts` oder passende vorhandene HTTP-Tests
- `apps/web/app/match-start.test.ts`
- passende Web-Source-/Komponententests

Tests/Checks:

- fokussierte Server- und Webtests
- Server- und Web-Typecheck
- `git diff --check`

Done-Gate:

- Alle Must-Anforderungen besitzen Regressionen; keine Visibility-, Replay-,
  stale-action- oder illegal-action-Abweichung bleibt offen.

Commit-Message:

- `test(ai): cover observable ai-vs-ai lifecycle`

### AIVIEW-04: Review und Wissensrückführung

Ziel: Umsetzung, Checks, Grenzen und aktuelle Bedienung dauerhaft dokumentieren.

Konkrete Arbeit:

- Implementation Review anlegen.
- Führende KI-/Betriebsübersicht nur soweit nötig aktualisieren.
- Prozessstatus und tatsächliche Checks abschließend nachführen.

Kernartefakte:

- `docs/reviews/ai/ai-vs-ai-observer-implementation-review-2026-07-13.md`
- `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- dieses Prozessartefakt

Tests/Checks:

- finale fokussierte Tests
- betroffene Typechecks
- `git diff --check`
- sauberer Arbeits-Worktree

Done-Gate:

- Review nennt Verhalten, Dateien, Tests, Grenzen und Restpunkte; Prozessstatus
  ist `completed`.

Commit-Message:

- `docs(ai): review observable ai-vs-ai matches`

## Verifikationsregeln

- Nach jedem Paket relevante Checks und `git diff --check` ausführen.
- Nur paketzugehörige Änderungen stagen.
- Jedes Paket separat committen.
- Keine Tests mit absichtlich gelockerten Assertions oder versteckten
  Aktionsgrenzen grünstellen.
- Vor Main-Integration mindestens fokussierte Shared-, Server- und Webtests
  sowie betroffene Typechecks erneut ausführen.
- Nicht ausgeführte breite Checks mit konkretem Grund und Risiko dokumentieren.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree
  `C:\Projekte\NETGRID_AI_VS_AI_OBSERVER`.
- Branch: `codex/ai-vs-ai-observer`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen Abgleich und lokalen
  Merge nach `main` verwenden.
- Vor dem Merge fremde uncommittete Hauptworkspace-Änderungen erneut prüfen.
  Keine Änderung staschen, überschreiben oder automatisch committen.
- `main` defensiv in den Arbeitsbranch integrieren, wenn er weitergelaufen ist.
- Push und Pull Request sind nicht Teil dieses Prozesses.
- Nach erfolgreichem Merge Worktree und gemergten Branch entfernen und beide
  Entfernungen verifizieren.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Prozess Beobachtbare KI-gegen-KI-Simulation vollständig und sequenziell von AIVIEW-00 bis AIVIEW-04 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die Pflichtseiten der Wissensbasis, die relevanten Package-AGENTS und docs/architecture/ai/ai-vs-ai-observer-process-2026-07-13.md.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_VS_AI_OBSERVER auf Branch codex/ai-vs-ai-observer.
Nutze den Hauptworkspace nur für den finalen Abgleich und Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Führe Paketchecks aus und committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage und schreibe einen Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, den sauberen Arbeits-Worktree verifiziert entfernen, den gemergten Arbeitsbranch löschen und Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Der Spielstart `Simulation` öffnet ein gespeichertes KI-vs-KI-Match auf dem
  normalen Spielbrett.
- Jeder Schritt ist einzeln sichtbar; kein Schnellpfad überspringt
  Zwischenzustände.
- Einzelschritt, Weiter, Schnell, Pause und aktiver Abbruch funktionieren.
- Es gibt kein fachliches 120-Aktionen-Limit im interaktiven Pfad.
- Reguläre Partien enden ausschließlich über Engine-Siegbedingungen.
- Beobachter können keine PlayerActions für KI-Seiten einreichen.
- PlayerView, Events, AI-Debug, Replay und StateHash bleiben side-sicher und
  deterministisch.
- Pakete sind separat committed, nach `main` integriert und der Arbeits-Worktree
  sowie Branch sind verifiziert entfernt.
