# Match CE2B Runner-Suche und Economy Prozess 2026-07-11

Status: abgeschlossen und zur lokalen Integration verifiziert

## Quelle und Ist-Stand

Quelle ist das gespeicherte Match `match_ce2b72a6bf4d4e80` vom 11.07.2026
mit dem Runner-Deck `Krashkurs: Clown-Kreditmaschine`. Die zugweise Analyse
belegt neun Short-Circuit-Aktivierungen, obwohl Krash die erforderliche
Basisabdeckung bereits herstellte, sowie den Abwurf von Streetware Distributor
bei gleichzeitig zwei redundanten Krash-Kopien auf der Hand.

Der aktuelle `main` enthält bereits generische Korrekturen für abgeschlossene
Coverage-Suche, begrenzte Run-Finanzierung und den konkreten Discard-Vergleich.
Dieser Prozess ergänzt die noch offene Deckdifferenzierung und sichert die
Korrekturen gegen realistische strategische Planfortschreibung ab.

## Gesamtziel

Die Runner-KI unterscheidet zwischen erfüllter Mindestabdeckung und einer vom
Deck tatsächlich vorgesehenen Breaker-Weiterentwicklung. Ein universeller
Einzelbreaker beendet redundante Coverage-Suche, während echte spezialisierte
oder ergänzende Breaker eines Multi-Breaker-Decks situativ weiterentwickelt
werden dürfen. Dauerhafte Economy bleibt gegenüber redundanten Handkarten
geschützt. Die Spielchronik macht Suchquelle, Suchzweck und Ergebnis lesbar.

## /Goal

`/Goal Arbeite die Match-CE2B-Runner-Korrekturen vollständig und sequenziell
von Paket 1 bis Paket 5 ab, belege die deckabhängige Breaker-Architektur mit
realistischen Regressionen und merge den fertigen Arbeitsbranch lokal nach
main.`

## Fachliches Modell

- Mindestabdeckung beantwortet, ob der Runner bekannte Basis-ICE-Typen aktuell
  grundsätzlich brechen kann. Sie darf Druck- und Run-Pläne freigeben.
- Deckarchitektur beantwortet, ob das Deck darüber hinaus unterschiedliche
  Breaker-Rollen oder eine erkennbare Verbesserung vorsieht.
- Mehrere Kopien derselben Breaker-Definition sind keine Multi-Breaker-
  Strategie.
- Programme, die nur durch unsicheren Regeltext-Fallback als `special`
  erscheinen, begründen keinen offenen Breaker-Bedarf.
- Ein spezialisierter Zusatzbreaker bleibt nur dann suchwürdig, wenn er eine
  eigenständige, hochsicher erkannte Rolle erfüllt und die aktuelle Situation
  oder die Deckstrategie diese Rolle stützt.
- Eine mögliche spätere Optimierung blockiert keinen bereits bezahlbaren und
  aussichtsreichen Run. Sie ist Weiterentwicklung, nicht Mindestvoraussetzung.

## Controller-Invarianten

- Die KI verwendet ausschließlich PlayerView, side-gefilterte PublicEvents,
  LegalActions und erlaubte eigene Deckmetadaten.
- Engine, LegalAction-Vertrag, Replay und StateHash bleiben unverändert.
- Breaker-Suche benötigt einen konkreten, noch offenen Nutzen; Duplikate allein
  reichen nicht.
- Coverage-, Choice-, Install- und Discard-Semantik verwenden dasselbe
  deckabhängige Begriffsmodell.
- Dauerhafte Economy wird nicht zugunsten redundanter Breakerbestände
  abgeworfen.
- Chroniktexte zeigen ausschließlich öffentliche beziehungsweise dem eigenen
  Spieler bekannte Informationen.

## Paketfolge

### Paket 1: Prozess und Evidence

- Matchanker, aktueller `main`-Stand, Deckdifferenzierung und Invarianten
  dokumentieren.
- Done-Gate: Prozessartefakt vorhanden; `git diff --check` grün.
- Commit: `docs(ai): define match ce2b runner fix process`.

### Paket 2: Deckabhängiger Breaker-Bedarf

- Mindestabdeckung von optionaler Breaker-Weiterentwicklung trennen.
- Universal-, Spezialisten-, Hybrid- und Duplikatfälle generisch klassifizieren.
- Strategischen Übergang und Coverage-Suche mit derselben Klassifikation
  verbinden.
- Done-Gate: realistische Deck- und Zustandsregressionen grün.
- Commit: `fix(ai): make breaker search deck aware`.

### Paket 3: Economy-Discard und Planfortschreibung

- Den Streetware-/Krash-Zustand mit aktiv fortgeschriebener Strategie als
  Regression abbilden.
- Dauerhafte Economy gegenüber redundanten installierten oder gehaltenen
  Breakern schützen, ohne pauschal jede Economy-Karte unverwerfbar zu machen.
- Done-Gate: fokussierte Discard- und strategische Memory-Tests grün.
- Commit: `fix(ai): protect persistent economy from redundant discards`.

### Paket 4: Verständliche Suchchronik

- Short-Circuit-Aktivierung als Stack-Suche nach einem Programm benennen.
- Suchaktivierung, aufgedecktes Ergebnis und spätere Installation in der
  Chronik nachvollziehbar halten; keine falsche Hosting-Darstellung ergänzen.
- Done-Gate: Chroniktests mit matchnahen PublicEvent-Payloads grün.
- Commit: `fix(web): clarify runner stack search chronology`.

### Paket 5: Abschluss und Integration

- Fokussierte Tests, AI-Typecheck, angrenzende Tests und `git diff --check`.
- Final-Review und dauerhaft relevante Wissenspflege ergänzen.
- Aktuelles `main` integrieren, erneut verifizieren und den Branch lokal nach
  `main` mergen. Kein Push und kein Pull Request.
- Commit: `docs(ai): close match ce2b runner fixes`.

## Sicherheitsblocker

Der Prozess stoppt ohne Workaround, wenn die Verbesserung verdeckte Corp-Daten
benötigt, LegalActions umgehen müsste, Regeln statt KI-Entscheidungen verändert
oder Replay-/Side-Safety-Regressionen erzeugt.

## Abschlusskriterien

- Das Krash-Deck beendet redundante Breaker-Suche nach erfüllter Abdeckung.
- Ein realistisches Multi-Breaker-Deck behält begründete Spezialisten-
  Weiterentwicklung, ohne dadurch erreichbare Runs zu blockieren.
- Der matchnahe Streetware-Zustand verwirft eine redundante Krash-Kopie.
- Die Chronik benennt Short Circuits Suchzweck und Ergebnis nachvollziehbar.
- Alle Paketcommits sind lokal nach `main` integriert und die fremde Änderung
  an `apps/web/next-env.d.ts` bleibt unangetastet.

## Ergebnis

Die fachlichen Pakete sind abgeschlossen. Das Krash-Deck schließt seine
Breaker-Suche nach installierter Universalabdeckung; echte Hybrid- und
Spezialistensuiten behalten nur eine niedrig priorisierte, konkrete
Weiterentwicklung. Der Streetware-Discard ist gegen fortgeschriebenen
Such-Intent abgesichert und die Short-Circuit-Chronik verbindet Aktivierung,
Suchzweck und öffentliches Ergebnis. Die lokale Main-Integration wird nach dem
abschließenden Main-Abgleich im Finalstatus festgehalten.
