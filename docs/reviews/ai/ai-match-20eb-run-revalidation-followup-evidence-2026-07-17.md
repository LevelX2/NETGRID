# Follow-up-Evidence: Match 20EB – Remote-Run und Revalidierung (2026-07-17)

## Scope

- Match: `match_20eb121f1a2b3b1b`
- Runner-KI-Entscheidungen: D92 / StateVersion 185 und D113 / StateVersion 214
- Quelle: lokale SQLite-Runtime, Runner-PlayerViews, öffentliche Events,
  LegalActions und gespeicherte AI-Decision-Traces
- Beziehung zur Vollanalyse: Ergänzung der bereits vollständigen
  146/146-Decision-Coverage; keine neue Denominator-Lücke

## Korrigierte öffentliche Kausalkette vor D92

Die frühere Einordnung behandelte die einzelne verdeckte Rootkarte bei D92 als
potenziell unbekannten Agenda-Payoff. Die öffentliche Historie widerlegt das:

1. Nach `evt_139` lagen in Remote 1 zwei verdeckte Rootkarten. Die ältere
   side-safe ID `hidden_af96b334` blieb über alle folgenden Zustände stabil.
2. `evt_168` installierte eine neue Rootkarte in Remote 1 und veröffentlichte
   `rootReplacement: asset_to_agenda` sowie `replacedRootCardType: asset`.
   Dabei blieb `hidden_af96b334` liegen; die neue Karte erhielt die side-safe
   ID `hidden_b401fdda`.
3. Die Engine erlaubt in einem normalen Remote nur einen Agenda-/Asset-
   Hauptplatz; weitere gleichzeitig liegende Rootkarten müssen Upgrades sein.
   Damit war `hidden_af96b334` spätestens ab `evt_168` öffentlich als Upgrade
   beweisbar, obwohl ihr Titel verdeckt blieb.
4. `evt_179` bis `evt_181` advanced die neue Rootkarte. `evt_182` scorete
   Corporate Coup aus Remote 1; danach verschwand `hidden_b401fdda` und nur
   `hidden_af96b334` blieb zurück.
5. `evt_183` bis `evt_185` enthielten keine neue Installation in Remote 1.
   D92 startete mit `evt_186` den Run auf genau diesen Server.

Die spätere Aufdeckung als Dr. Dreff ist nur post-hoc Folgebeobachtung. Die
fachliche D92-Erwartung benötigt weder diesen Titel noch sonstige spätere
Hidden Info.

## D92 – falscher terminaler Remote-Override

- Runner: 31 liquide Credits, drei verbleibende Aktionen, null Agenda-Punkte.
- Corp: 23 Credits, sechs Agenda-Punkte und damit am Matchpoint.
- Remote 1: eine öffentlich als Upgrade ableitbare Rootkarte; ein bekanntes
  rezztes sowie zwei verdeckte unrezzte ICE.
- Rohbewertung:
  - `runner.start_run.remote_1`: `-691`
  - `runner.start_run.rd`: `2173` und damit Rohscore-Sieger
- Fehlerhafte Runtime-Evidence:
  - `remote_card_hypothesis:remote_1:unknown_root:0.42`
  - `hiddenRemoteCandidateMemory: []`
  - `runner_remote_root_threat: unknown_remote_root:1`
  - `matchpoint_contest_payoff:unknown`
- Arbitration: `opponent_matchpoint_contest` setzte den negativen Remote-Score
  per Mindestscore auf `10000` und verdrängte den R&D-Run.

Damit ist D92 der früheste kausale Fehler der Sequenz. Der Matchpoint-Override
prüft aktuell nur, ob eine Rootkarte `known === false` ist, nicht ob ihre
öffentlich mögliche Typmenge noch eine Agenda enthält.

## D113 – fehlende Revalidierung nach Upgrade-Rez

Der Runner bezahlte beziehungsweise band im Run nominal 30 Credits für Pump,
Break und weitere Run-Kosten; seine liquiden Credits fielen von 31 auf 3. Nach
dem Passieren aller drei ICE wurde die verbleibende Rootkarte öffentlich als
Dr. Dreff gerezzt und löste Jack Attack aus.

Bei D113 im `run.jack_out_window` waren beide LegalActions vorhanden:

- `continue_run`: Score `103`, nur generischer Action-Tiebreaker und private
  Actor-Prämie;
- `jack_out`: Score `-351`, dominiert von
  `runner_jack_out_pressure_loss: -450`.

Die Runtime revalidierte weder den entfallenen Agenda-Payoff noch die nur noch
drei liquiden Credits gegen die neue öffentliche Lage. Danach setzte der
Runner fort, löste Jack Attack vollständig aus, access-te und trashte Dr.
Dreff für drei Credits und beendete die Sequenz bei null liquiden Credits.

Dieses Finding bleibt als defensive Folgegrenze relevant, auch wenn der
primäre D92-Fix die historische Sequenz künftig verhindert.

## Bestehender Portfolio- und Eurocorpse-Stand

Die bereits integrierte Match-20EB-Remediation setzt den Nutzervertrag zur
Bankkadenz um:

- `maxActionsPerTurn: 1` ist nur eine weiche Ranking-Schwelle;
- `planPortfolioEntryCanAct` sperrt Hintergrundaktionen nach der Schwelle
  nicht;
- weitere Bankaktionen bleiben ohne wirklich sinnvolle Alternative wählbar;
- PlanMemory und öffentlicher Counter-Zuwachs führen die beobachtete Kadenz
  fort.

Die historischen `bankPortfolioActionsThisTurn:0`-Einträge stammen aus dem
analysierten Vor-Fix-Trace. Dieser Follow-up ändert die Portfolio-Policy nur,
wenn ihre aktuellen Tests oder Checkpoints rot werden.

Eurocorpse wurde im Ausgangsmatch leer installiert, anschließend nicht zum
Hosting genutzt und lieferte null Zahlungsnutzen. Die bereits integrierten
Checkpoints verhindern die leere Installation und priorisieren den konkreten
Hosting-Schritt. Sie bleiben Abschlussregression, sind aber kein neuer
Produktionsscope dieses Follow-ups.
