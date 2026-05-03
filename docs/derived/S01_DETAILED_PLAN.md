# S01 Detaillierter Plan

Status: detaillierte Planungsfassung, noch kein Requirements-Freeze
Stand: 2026-05-03
Phasenname: `S01 Spielende, Ergebnisfenster, Matchserie und Audio`

## 1. Kurzentscheidung

S01 ist eine Sonderphase für das sichtbare Spielende und den darüberliegenden privaten Matchflow.

Die Phase ergänzt die bestehende Engine-, Server- und UI-Architektur, ohne neue Karten, neue Regelmechaniken, offizielle Assets oder öffentliche Plattformfunktionen einzuführen.

Kernformel:

> Die Engine entscheidet das Spielende. Der Server veröffentlicht nur side-sichere Ergebnisdaten. Die UI zeigt Ergebnis, Statistik, Grafik und Audio als reine Anzeigeebene.

## 2. Ausgangslage

Die Engine kennt bereits `agendaPointsToWin` und `winner`.

- Legacy-Demo-Partien nutzen `agendaPointsToWin = 6`, weil der frühe Corp-Demo-Deckstand nur 6 Agenda-Punkte enthält.
- Neuere V0.4-/V0.8-Decks nutzen regulär `agendaPointsToWin = 7`.
- Der Server sendet bereits `match_finished` mit Gewinner und finalem StateHash.
- Die Web-UI zeigt aktuell nur eine kleine Gewinnerzeile im Board.

S01 macht daraus einen bewusst gestalteten Abschlussfluss mit sicherer Statistik und optionaler Matchserie.

## 3. Scope-Entscheidung

S01 umfasst:

- Ergebnisfenster nach Spielende,
- grafische Hintergrundflächen für Sieg, Niederlage und Unentschieden,
- side-sichere Spielstatistik im Vordergrund,
- Audioeffekte für Spielende und Serienende,
- Startauswahl zwischen Einzelspiel und privater Matchserie,
- minimale private Matchserie als Hülle über mehrere einzelne Spiele,
- Tests für Ergebnisdaten, Sichtbarkeit, UI, Reconnect und Audio.

S01 ist keine offizielle Turnier- oder Organized-Play-Implementierung. Der Begriff `Matchserie` wird bewusst privat und lokal verstanden.

## 4. Nicht-Ziele

S01 baut nicht:

- neue Karten,
- neue Regelmechaniken,
- Damage, Trace, Flatline-Erweiterung oder vollständige offizielle Endbedingungen außerhalb vorhandener Engine-Pfade,
- öffentliche Lobbies, Matchmaking, Rankings, Accounts oder Turnierfunktionen,
- offizielle Artworks, Logos, Card Frames oder Card Backs,
- Bild- oder Audiodaten in Engine, Replay, StateHash, LegalActions oder PlayerActions,
- FullState oder verdeckte Kartendaten im Browser.

## 5. Fehlende Entscheidungen vor Umsetzung

Vor der Umsetzung sollte ein kurzer S01-Requirements-Freeze diese Punkte festlegen:

| Thema | Empfehlung | Grund |
|---|---|---|
| Serienformat | Erst `single_game` und `two_game_side_swap` planen; `best_of_three` nur als Erweiterung. | Seitenwechsel ist naheliegend, aber Turnierlogik bleibt aus Scope. |
| Begrifflichkeit | UI spricht von `Einzelspiel` und `Private Matchserie`. | Vermeidet falschen Anspruch auf offizielles Turnierformat. |
| Agenda-Ziel | Default aus Deck-/RulesBaseline übernehmen; kein freies X im normalen Modus. | Bestehende 6/7-Regel bleibt konsistent. |
| Statistikpflicht | Agenda-Punkte, Sieggrund, Spielzeit, Aktionen, Runs, erfolgreiche Runs, gestohlene/gescorte Agendas, StateHash. | Nützlich, side-sicher und ohne FullState im Client ableitbar. |
| Grafikquelle | Eigene generierte oder lokal erstellte Hintergründe. | Hält Asset-Gate und Projektregeln ein. |
| Audio | Standardmäßig stumm bis User-Interaktion; lokale kurze One-shot-Effekte. | Browser-Autoplay und Nutzerkontrolle bleiben sauber. |
| Reconnect-Verhalten | Ergebnisfenster erscheint nach Reconnect erneut, Audio feuert nicht automatisch erneut. | Ergebnis bleibt sichtbar, ohne störenden Doppelton. |

## 6. Vorgeschlagene Artefakte

Derived Docs:

- `docs/derived/S01_REQUIREMENTS.md`
- `docs/derived/S01_RESULT_MODAL_SPEC.md`
- `docs/derived/S01_MATCH_SERIES_SPEC.md`
- `docs/derived/S01_AUDIO_SPEC.md`
- `docs/derived/S01_TEST_MATRIX.md`
- `docs/derived/S01_REQUIREMENTS_REVIEW.md`

Mögliche Codebereiche:

- `packages/shared/src/index.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/http-server.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `tests/specs/visibility-contract.test.ts`

Optionale Assets:

- `apps/web/public/result-backgrounds/`
- `apps/web/public/audio/`

Asset-Dateien dürfen keine offiziellen Netrunner-Artworks, Logos, Card Frames oder Card Backs enthalten.

## 7. Ergebnisfenster

Das Ergebnisfenster wird geöffnet, wenn die UI einen autoritativen Gewinner sieht:

- `playerView.winner`,
- oder `match_finished`,
- oder Reconnect-/Bootstrap-Payload mit beendetem Match.

Texte aus Sicht der aktuellen Seite:

- Gewinner ist eigene Seite: `Du hast das Spiel gewonnen.`
- Gewinner ist Gegenseite: `Du hast das Spiel verloren.`
- Gewinner ist `draw`: `Das Spiel endet unentschieden.`

Das Fenster zeigt im Vordergrund:

- Ergebnistext,
- Gewinnerseite,
- Sieggrund,
- Agenda-Punkte Runner/Corp,
- Zielwert,
- Spielzeit oder Start-/Endzeit,
- Anzahl Aktionen,
- Runs und erfolgreiche Runs,
- gestohlene und gescorte Agendas,
- finaler StateHash gekürzt,
- bei Serienmodus zusätzlich Serienstand und nächster Schritt.

## 8. Statistikmodell

Statistikdaten werden serverseitig oder aus side-sicheren PublicEvents berechnet. Der Browser darf dafür keinen FullState, keine `cardInstances` und keine privaten Payloads erhalten.

Vorgeschlagener Payload:

```ts
type GameResultSummary = {
  winner: "runner" | "corp" | "draw";
  viewerOutcome: "won" | "lost" | "draw";
  reason: "agenda_points" | "corp_deck_empty" | "draw" | "unknown";
  agendaPointsToWin: number;
  runnerAgendaPoints: number;
  corpAgendaPoints: number;
  actionCount: number;
  runCount: number;
  successfulRunCount: number;
  stolenAgendaCount: number;
  scoredAgendaCount: number;
  startedAt?: string;
  finishedAt: string;
  finalStateHash: string;
};
```

Die genaue Form wird im Requirements-Freeze festgelegt.

## 9. Matchserie

Ein einzelnes Spiel bleibt die Engine-Einheit. Eine Matchserie liegt darüber.

Vorgeschlagenes Minimalmodell:

- `seriesId`,
- `seriesMode: "single_game" | "two_game_side_swap"`,
- `games[]`,
- `currentGameIndex`,
- Serienstand,
- initiale Seitenzuordnung,
- nächstes Spiel mit Seitenwechsel,
- Serienstatus: `active | finished`.

Wichtig: Ein Spiel endet durch Engine-Winconditions. Eine Serie endet durch Serienregeln. Diese Trennung verhindert, dass Engine, Replay und Multiplayer-Pipeline unnötig vermischt werden.

## 10. Audio

Audio ist reine UI-Präsentation.

Regeln:

- Audio ist standardmäßig deaktiviert oder erst nach User-Interaktion aktivierbar.
- Nutzer kann Audio stummschalten und Lautstärke setzen.
- Ergebnis-Sounds sind kurze One-shot-Effekte.
- Reconnect löst keinen automatischen erneuten Sound aus.
- Audiozustand gehört in lokale UI-Preference, nicht in Engine, Replay oder StateHash.

Geplante Effekte:

- Spiel gewonnen,
- Spiel verloren,
- Unentschieden,
- Matchserie gewonnen,
- Matchserie verloren.

## 11. Teststrategie

Pflichttests für S01:

| Bereich | Tests |
|---|---|
| Engine/Server | Spiel endet bei `agendaPointsToWin`, Legacy 6 bleibt gültig, V0.8-Default 7 bleibt gültig, `winner`, `game_over` und finaler StateHash stimmen. |
| Ergebnis-Payload | `match_finished` oder Bootstrap enthält side-sichere Ergebnisdaten und keine FullState-/Token-/Hidden-Info-Daten. |
| Statistik | Agenda-Punkte, Aktionenzahl, Runs, erfolgreiche Runs, Score/Steal-Zähler werden deterministisch aus erlaubten Daten berechnet. |
| UI | Ergebnisfenster erscheint bei Sieg, Niederlage und Draw; Text ist aus Sicht des Spielers korrekt. |
| Reconnect | Beendetes Spiel zeigt Ergebnisfenster nach Reconnect erneut; LegalActions bleiben leer; Audio feuert nicht erneut automatisch. |
| Matchserie | Serienstart, Spielende, nächstes Spiel, Seitenwechsel, Serienstand und Serienende funktionieren. |
| Audio | Opt-in, Mute, Volume und One-shot-Trigger funktionieren ohne Autoplay-Fehler. |
| Visibility | Ergebnisfenster, Statistik, Reconnect, Errors und Logs leaken keine verdeckten Karten, Decklisten, Tokens oder privaten Payloads. |
| Regression | `lint`, `typecheck`, `test`, `build` und Visibility-Contract bleiben grün. |

## 12. Vorgaben-Check

| Vorgabe | Bewertung |
|---|---|
| Engine bleibt Regelautorität | Erfüllt, wenn Spielende nur aus `winner`/Engine-Result kommt. |
| Server bleibt Matchautorität | Erfüllt, wenn Ergebnis- und Serienzustand serverseitig geführt werden. |
| UI reicht nur Actions aus `LegalActions` ein | Unverändert erfüllt; nach Spielende sind Actions deaktiviert. |
| Keine Hidden-Info-Leaks | Erfüllbar mit side-sicherem ResultSummary und Visibility-Tests. |
| Deterministisches Replay/StateHash | Erfüllt, solange Statistik, Grafik und Audio nicht in StateHash eingehen. |
| Keine offiziellen Assets | Erfüllt mit eigenen/generierten lokalen Ergebnisgrafiken und Audios. |
| Keine öffentlichen Plattformfunktionen | Erfüllt, solange Matchserie privat und lokal bleibt. |
| MVP-/Phasengrenzen | Erfüllt, weil S01 keine Karten, Regeln, KI-FullState oder Plattformfeatures erweitert. |

## 13. Risiken

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Matchserie wird mit offiziellem Turniermatch verwechselt | Scope wächst in Rankings/OP/Turnierlogik | UI und Docs nennen es `Private Matchserie`. |
| Statistik leakt Hidden Info | Fairnessbruch | Statistik nur aus erlaubten PublicEvents, PlayerView und serverseitig freigegebenen Aggregaten. |
| Freies Agenda-X erzeugt ungültige Partien | Verwirrende oder ungewinnbare Spiele | Default aus Deck-/RulesBaseline; Custom nur später als Entwickleroption. |
| Audio feuert bei Reconnect doppelt | schlechte UX | Clientseitige One-shot-Guards pro Match/Game-Ende. |
| Grafiken verletzen Asset-Regeln | Lizenz-/Projektgrenze verletzt | Nur eigene/generierte Assets; keine offiziellen Artworks, Frames, Logos oder Backs. |
| Serienzustand bricht Replaymodell | schwer nachvollziehbare Matches | Einzelspiel-Replay unverändert lassen; Serie referenziert Spiele statt Engine-State zu verändern. |

## 14. Empfohlene Umsetzungsschritte

1. S01 Requirements Freeze erstellen.
2. Ergebnis- und Statistikpayload spezifizieren.
3. Server-seitige ResultSummary berechnen und testen.
4. Web-UI `GameOverModal` bauen.
5. Audio-Preference und One-shot-Sound-Hook einbauen.
6. Visibility- und Reconnect-Tests ergänzen.
7. Private Matchserie als eigene Hülle über Einzelspiele ergänzen.
8. Serien-Tests und UI-Fluss ergänzen.
9. Regression vollständig laufen lassen.

## 15. Done-Kriterien

S01 ist fertig, wenn:

- Requirements, Spezifikationen und Testmatrix eingefroren sind,
- Spielende ein Ergebnisfenster mit korrektem Perspektivtext zeigt,
- Statistik side-sicher und deterministisch ist,
- Ergebnisgrafiken und Audio keine offiziellen Assets verwenden,
- Audio opt-in, stumm schaltbar und reconnect-sicher ist,
- Einzelspiel und private Matchserie im Startscreen klar unterscheidbar sind,
- eine Matchserie mehrere Spiele mit Serienstand und Seitenwechsel abbildet,
- `match_finished`, Reconnect und Ergebnisfenster keine Hidden-Info-Leaks enthalten,
- bestehende Engine-, Server-, UI-, Replay-, StateHash-, KI-, Deck-, Katalog- und Visibility-Gates grün bleiben.
