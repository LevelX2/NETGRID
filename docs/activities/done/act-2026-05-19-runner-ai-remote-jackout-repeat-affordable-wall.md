---
activityId: act-2026-05-19-runner-ai-remote-jackout-repeat-affordable-wall
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget:
blockedBy: []
relatedActivities:
  - act-2026-05-17-runner-ai-jack-out-after-passing-ice
  - act-2026-05-17-runner-ai-post-break-access-hotfix
  - act-2026-05-17-runner-ai-repeat-rd-run
  - act-2026-05-17-runner-two-turn-rig-economy-plan
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/runner-plans.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai test -- index.test.ts -t "Bartmoss remote path"
  - corepack pnpm --filter @netgrid/ai test -- index.test.ts -t "last ICE|repeat R&D|two-turn|post-break|does not pump or repeat|stale legacy Archives"
  - corepack pnpm --filter @netgrid/ai typecheck
  - git diff --check
---

# Runner-KI: Remote-Run nicht nach unbezahltem Rez-Fenster abbrechen und wiederholen

## Fund

Im Playtest startete die Runner-KI im selben Zug zweimal einen Run auf `Fort 1`. Die Chronik zeigt jeweils:

- Runner-KI startet Run auf `Fort 1`.
- Korp rezzt das erste ICE nicht; der Run geht weiter.
- Runner-KI bricht den Run per Jack-out ab; auf `Fort 1` wird keine Karte zugegriffen.
- Später startet die Runner-KI erneut denselben Run auf `Fort 1`.

Die konkrete Lage laut Beobachtung:

- Runner hat `Bartmoss Memorial Icebreaker` installiert.
- Runner hat 3 Credits.
- `Fort 1` hat zwei `Wall of Static` als ICE, eine davon ist gerezzt.
- Das nicht gerezzte ICE wird von der Korp im Run nicht gerezzt.
- Im Root liegt eine Agenda beziehungsweise eine wertvolle installierte Korp-Karte. Diese Information darf die Runner-KI nur nutzen, soweit sie aus Runner-Sicht legal sichtbar ist; verdeckte Kartenidentität darf nicht geleakt werden.

Der auffällige Punkt ist nicht, dass die Runner-KI die verdeckte Root-Karte kennen soll. Der auffällige Punkt ist die inkonsistente Sequenz: Wenn die KI den Run gegen die sichtbare Struktur grundsätzlich für gut genug hält und nach dem nicht gerezzten ICE noch genug Credits hat, sollte sie den bezahlbaren Run durchziehen. Wenn der Run wegen Kosten, Risiko oder Zielwert nicht gut genug ist, sollte sie ihn gar nicht erst starten und erst recht nicht im selben Zug ohne neue positive Information wiederholen.

## Prüfauftrag

Den Entscheidungsfluss der Runner-KI für Remote-/Fort-Runs prüfen, insbesondere die Abstimmung zwischen:

- Vorab-Bewertung, ob ein Run gestartet wird.
- In-Run-Bewertung nach einem nicht gerezzten ICE.
- Bewertung des nächsten bekannten/rezzed ICE und der vorhandenen Icebreaker-Credits.
- Jack-out-Bewertung vor dem nächsten ICE oder vor dem Zugriff.
- Wiederholungsbremse für denselben Zielserver im selben Zug nach einem wirkungslosen Jack-out.

## Reproduktionsfixture

Einen fokussierten AI-Test oder Multiplayer-Advance-Test anlegen:

- Runner-KI am Zug, 3 Credits.
- `Bartmoss Memorial Icebreaker` installiert und einsatzbereit.
- `Fort 1` enthält eine verdeckte installierte Root-Karte.
- `Fort 1` hat zwei `Wall of Static`.
- Ein `Wall of Static` ist gerezzt und mit Bartmoss plus 3 Credits passierbar.
- Das andere `Wall of Static` ist unrezzed; die Korp wählt im Rez-Fenster `Kein Rez`.
- Die Runner-KI darf keine verdeckte Kartenidentität oder Agenda-Information nutzen.

Der Test soll die komplette Sequenz ab Start des Runner-KI-Zugs oder mindestens ab Run-Start abbilden. Wichtig ist, dass nicht nur eine isolierte LegalAction bewertet wird, sondern die tatsächliche KI-Sequenz mit Rez-Fenster, Weiterlaufen, Encounter/Break und Zugriff beziehungsweise Jack-out geprüft wird.

## Erwartetes Verhalten

- Wenn die Runner-KI den Run startet und nach dem nicht gerezzten ICE weiterhin genug Credits und einen passenden Icebreaker für das bekannte/rezzed `Wall of Static` hat, soll sie den Run sinnvoll fortsetzen, die nötigen Icebreaker-Aktionen ausführen und den Zugriff nehmen.
- Wenn die KI den Run aus Runner-Sicht nicht für lohnend hält, soll sie den Run nicht starten und stattdessen eine sinnvolle Alternative wählen, z. B. Credit nehmen, Karte ziehen oder Setup.
- Nach einem Run-Abbruch ohne Zugriff soll die Runner-KI denselben Remote-/Fort-Run im selben Zug nicht erneut starten, solange keine neue relevante Information oder Ressourcenänderung eingetreten ist.

## Mögliche Ursachen prüfen

- Start-Run-Scoring und In-Run-Scoring nutzen unterschiedliche Kostenmodelle für Bartmoss oder `Wall of Static`.
- Die KI bewertet `Kein Rez` der Korp fälschlich als Grund zum Auschecken statt als positive Information.
- Das nächste rezzed ICE wird im Movement-Fenster als nicht bezahlbar oder gefährlicher bewertet, als es mit den aktuellen Credits ist.
- Bereits investierte Clicks und der Zweck des gestarteten Runs werden im Jack-out-Scoring nicht ausreichend berücksichtigt.
- Der gleiche Zielserver erhält nach einem wirkungslosen Jack-out keine negative Markierung für den restlichen Runner-Zug.

## Nicht im Scope

- Hidden-Info-Nutzung durch die Runner-KI einführen.
- Remote-Runs pauschal erzwingen.
- Alle Runner-KI-Runstrategien neu schreiben.
- Chroniktexte ändern, sofern sie die beobachtete Sequenz bereits korrekt wiedergeben.

## Akzeptanzkriterien

- Es gibt einen Regressionstest für den beschriebenen Fort-Run mit `Bartmoss Memorial Icebreaker`, 3 Credits und `Wall of Static`.
- Die Runner-KI beendet in der bezahlbaren Variante den Run nicht direkt nach einem nicht gerezzten ICE per Jack-out.
- Die Runner-KI führt den Run bei ausreichenden Credits durch oder entscheidet sich vorab gegen den Run.
- Die Runner-KI wiederholt im selben Zug keinen identischen Remote-/Fort-Run, wenn der erste Run ohne Zugriff und ohne neue relevante Lageänderung abgebrochen wurde.
- Der Test bestätigt, dass verdeckte Root-Kartenidentität nicht in die Runner-KI-Entscheidung eingeht.
- Bestehende Runner-KI-Regressionen zu Jack-out, Post-Break-Access, wiederholten R&D-Runs und Zwei-Zug-Setup bleiben grün.

## Ergebnis

Abgeschlossen. Die Runner-KI-Sequenz fuer den Remote-Run mit installiertem `Bartmoss Memorial Icebreaker`, 3 Credits, zwei `Wall of Static`, verdecktem Root und manuell abgelehntem Outer-ICE-Rez ist jetzt als Regression abgedeckt: Die KI startet den aus sichtbarer Sicht vertretbaren Run, nutzt Bartmoss gegen das gerezzte Wall, setzt fort und waehlt den Zugriff; `jack_out` taucht in der Sequenz nicht auf. Der Test prueft zugleich, dass die verdeckte Root-Identitaet nicht in AIInput oder Decision-Debug erscheint.

Zusaetzlich wertet die Runner-KI einen identischen Remote-Run im selben Zug staerker ab, wenn der vorherige Run auf denselben Server per Jack-out ohne Zugriff endete und danach keine neue relevante Ressource oder Information sichtbar wurde. Das gilt sowohl im Plan-Scoring als auch im Baseline-Scoring.
