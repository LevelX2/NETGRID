---
activityId: act-2026-08-09-runner-access-trash-impact-valuation
status: done
kind: concept
area: ai-data
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-08-09
startedAt: 2026-08-12T23:54:42+02:00
completedAt: 2026-08-13T00:04:16+02:00
branch: codex/activities-ai-20260812
releaseTarget: post-card-semantics-restructuring
blockedBy: []
resultArtifacts:
  - packages/ai/src/runtime/runner-access-trash-impact.ts
  - packages/ai/src/runtime/plan-first-live-runtime.ts
checks:
  - focused canonical access-trash impact tests
  - focused runner.convert_run_window ownership and action-binding regressions
  - AI typecheck checked with unrelated worktree/report baseline errors separated
  - git diff --check
---

# Auswirkungen zugänglicher Corp-Karten vor dem Trashen bewerten

## Ziel

Der Runner soll bei einem Access nicht bloß feststellen, dass `trash` und
`decline` legal sind. Ein generisches, side-sicheres Bewertungsmodul soll den
konkreten Nutzen der Entfernung einer sichtbaren Corp-Karte gegen Trashkosten,
eigene Liquidität und den Wert alternativer Verwendungen abwägen.

Die Bewertung muss unterschiedliche Wirkungsarten aus der kanonischen
Kartensemantik verstehen können: laufende oder gespeicherte Economy,
ICE-Stärkung, Schutz und Zugriffsbesteuerung, Scoring-/Advance-Unterstützung,
Schaden, Tags und sonstige Boardwirkung. Karten, deren sichtbare Wirkung dem
Runner gegenwärtig gleichgültig ist, sollen nicht allein deshalb getrasht
werden, weil die Aktion bezahlbar und legal ist.

## Kontext und Quellen

- Playtest-Match `match_17b23313d4697e86`, erster Runner-Zug,
  Entscheidung 4.
- Der Runner hatte nach erfolgreichem Zugriff auf Remote 1 noch 5 Credits und
  3 Klicks. `BBS Whispering Campaign` enthielt sichtbar 14 Credits; das
  Trashen kostete 4 Credits und ließ den Runner mit 1 Credit zurück.
- `runner.convert_run_window` betrachtete sowohl Trashen als auch Ablehnen
  als zulässig, wählte Trashen aber mit generischer Access-Evidence. Die
  Entscheidungsdiagnose belegte weder Trashkosten und Restliquidität noch den
  verhinderten künftigen Corp-Ertrag.
- Das konkrete Ergebnis ist wahrscheinlich vertretbar: Für 4 Credits und den
  bereits eingesetzten Run-Klick wurden bis zu 14 gespeicherte Corp-Credits
  beseitigt. Der Befund betrifft deshalb primär die fehlende fachliche
  Bewertungsgrundlage, nicht zwingend die gewählte Aktion.
- Derselbe Entscheidungstyp tritt bei Karten aus R&D, HQ, Archives und
  Remotes sowie bei Assets und Upgrades mit sehr unterschiedlicher Wirkung
  auf.
- Regel- und Effektfakten sollen nach der laufenden Kartenrestrukturierung aus
  Kartendefinition, CardImplementation und Manifest stammen. AI-Hints dürfen
  nur zusätzliche strategische Semantik liefern, nicht Kartentext oder
  Regelwerte duplizieren.

## Scope

- Nach Abschluss der Kartenrestrukturierung den kanonischen Datenweg für
  sichtbare gegenwärtige und projizierbare Kartenwirkungen bestimmen.
- Einen kleinen generischen Impact-Evaluator für die Access-Entscheidung
  `trash` gegen `decline` entwerfen und im fachlichen Owner
  `runner.convert_run_window` konsumieren.
- Auf Runner-Seite mindestens bewerten:
  - von der Engine gequotete Trashkosten und Credits nach dem Trash;
  - gebundene oder absehbar notwendige Credits für den bestehenden Parent-
    Plan, Breaker, folgende Runs und akute Schutzbedürfnisse;
  - Click-, Run- und Zugopportunität, soweit sie für die aktuelle
    Accessentscheidung noch relevant ist.
- Auf Corp-Seite nur sichtbare, kanonisch ableitbare Wirkung bewerten:
  - bereits gespeicherte Credits oder Counter und erwartbarer Restnutzen;
  - wiederkehrende Economy und verbleibende Auszahlungsdauer;
  - ICE-, Server-, Advance-, Score- oder Zugriffsstärkung;
  - Schaden, Tags, Taxes und andere unmittelbare Bedrohungen;
  - fehlende oder aktuell bedeutungslose Wirkung.
- Unsichere Zukunftsannahmen konservativ und als Unsicherheit ausweisen. Kein
  Zugriff auf Hand, Deckreihenfolge oder verdeckte Kartenfähigkeiten der Corp.
- Ergebnis und wichtigste Beiträge strukturiert diagnostizieren, damit
  Playtests erkennen lassen, warum Trashen oder Ablehnen gewählt wurde.
- Mindestens eine zweite, nicht als BBS benannte Testkarte oder generische
  Fixture pro benötigter Wirkungsklasse verwenden, damit keine
  Einzelkartenlogik entsteht.

## Nicht im Scope

- Keine vollständige strategische Neubewertung sämtlicher Corp-Karten in
  diesem einen Paket. Fehlende Semantikfamilien werden als kleine
  Folge-Activities erfasst.
- Keine BBS-Karten-ID, Namensprüfung oder fest codierte 14-zu-4-Heuristik.
- Keine erneute Kodierung von Trashkosten, Countern, Auszahlungsregeln oder
  Effekttext in AI-Hints.
- Kein Zugriff auf verdeckte Informationen und keine Wahrscheinlichkeitswerte
  aus tatsächlichen Hidden Cards.
- Keine Regeländerung an Access, Trashkosten oder LegalActions.
- Keine Auswahlentscheidung im Choice-Resolver; dieser vervollständigt nur
  die Payload der exakt gebundenen LegalAction.

## Akzeptanzkriterien

- [x] `runner.convert_run_window` bleibt alleiniger fachlicher Owner der
      Trash-/Decline-Entscheidung; das Bewertungsmodul liefert Werte und
      Evidence, aber wählt keine Action.
- [x] Kosten, Counter, aktuelle Wirkung und Regelzeitpunkte stammen aus der
      kanonischen Karten- und Engine-Semantik, nicht aus redundanten
      AI-Hint-Feldern.
- [x] Der Evaluator ist generisch und enthält weder BBS-Karten-ID noch
      Kartennamensvergleich.
- [x] Die beobachtete BBS-Situation mit 14 gespeicherten Credits und
      Trashkosten 4 bewertet den verhinderten Corp-Nutzen sowie die
      Runner-Restliquidität sichtbar und kann das Trashen begründen.
- [x] Eine leere oder nahezu verbrauchte BBS bei hoher Trashbelastung wird
      ohne anderen akuten Nutzen abgelehnt.
- [x] Eine sichtbar stark defensive oder Scoring unterstützende Karte kann
      trotz fehlender Economy als wertvolles Trashziel erkannt werden.
- [x] Eine teure Karte ohne gegenwärtig nachteilige Wirkung kann liegen
      bleiben; bloße Bezahlbarkeit erzeugt keinen positiven Trashwert.
- [x] Reservierte Credits eines gebundenen Parent-Plans können eine ansonsten
      attraktive Trashentscheidung nachvollziehbar in `decline` ändern.
- [x] Diagnose-Evidence nennt mindestens Trashkosten, Restliquidität,
      bewertete sichtbare Wirkung, Unsicherheit, Opportunity Cost und
      resultierende Marge.
- [x] Tests decken mindestens gespeicherte Economy, wiederkehrende Economy,
      defensive Wirkung, aktuell irrelevante Wirkung und knappe
      Parent-Finanzierung ab.
- [x] Plan, Route, exakte Action-ID und Executor bleiben gebunden; es entsteht
      keine zweite Entscheidungsautorität und kein generischer Fallback.
- [x] Fokussierte AI-Tests, kanonische Semantik-/Hint-Gates, erforderlicher
      AI-Typecheck und `git diff --check` sind grün.

## Umsetzungshinweise

- Vor jedem KI-Patch den verbindlichen AI-Architektur-Preflight aus
  `AGENTS.md` vollständig ausführen.
- Die Activity bleibt bis zum kanonischen Kartenmodell blockiert, damit
  Effekt- und Timingwissen nicht ein zweites Mal in einer Übergangsstruktur
  modelliert wird.
- Für die erste Umsetzung wenige belastbare Wirkungsklassen verwenden. Wo die
  kanonische Semantik keine sichere Aussage erlaubt, muss die Diagnose diese
  Lücke sichtbar machen statt mit einem pauschalen Kartenwert fortzufahren.
- Matchdaten bei der späteren Regression ausschließlich über die read-only
  Maintenance-Analyse-API lesen.

## Ergebnisnotiz

`runner.convert_run_window` bewertet Trashen und Ablehnen nun über eine kleine
kanonische Impact-Projektion, ohne die Auswahlhoheit an einen Resolver oder
zweiten Plan abzugeben. Die Projektion liest sichtbare Counter sowie
mechanische Wirkungen und Zeitpunkte aus der CardSpec-Planungssicht; die
Trashkosten und zweckgebundenen Trash-Credits stammen aus der aktuellen
Engine-LegalAction. Kartennamen und BBS-spezifische IDs kommen im Evaluator
nicht vor.

Die strukturierte Evidence weist Trashkosten, allgemeine Zahlung,
Restliquidität, Economy- und Parent-Reserve, sichtbare Wirkungsklassen,
Unsicherheitsabschlag, Opportunity Cost, Liquiditätsabschlag und resultierende
Marge aus. Die beobachtete Situation mit 14 sichtbaren gespeicherten Credits
trägt das Trashen trotz vier Credits Kosten; eine leere Kampagne, eine
wirkungslos gewordene teure Karte oder eine zu knappe Parent-Reserve führen
dagegen zu `decline`.

Die fokussierten Tests sind grün. Der vollständige AI-Typecheck wurde
ausgeführt und meldet nach Behebung der neuen Typfehler ausschließlich die
bereits getrennt reproduzierten Worktree-Doppeltypen sowie vier fehlende
CardSpec-Migrationsreports. `git diff --check` ist grün.
