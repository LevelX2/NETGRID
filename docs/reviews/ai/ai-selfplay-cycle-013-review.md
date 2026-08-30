# KI-Selbstspielzyklus 013 – Clown-Kreditmaschine gegen Chrome Rush Bureau

Stand: 2026-08-20
Status: vier generische Ursachen der Corp-Score-Konversion behoben; drei
finale Seeds vollständig auditiert; Score-Exposure-Verdacht verdichtet

## Reproduktionsvertrag

- Auswahlseed: `a8184fd547734c8b809a14f562731dc8`
- Runner: **Krashkurs: Clown-Kreditmaschine**, 45 Karten,
  `standard_standard_runner_krashkurs_clown_kreditmaschine_2026_07_11_1.0.0`,
  `fnv1a:6d1893e2`
- Corp: **Chrome Rush Bureau**, 64 Karten und 16 Agendapunkte,
  `standard_standard_corp_chrome_rush_bureau_1.0.0`, `fnv1a:2ebf0f5c`
- Spielseeds:
  - `selfplay-013-1ed1eae2e6125753e9f3fc96ecdf6942`
  - `selfplay-013-bf7471809137eaf339b0797c9e69d37c`
  - `selfplay-013-1a257ae28b1f18d04f08a5e02df31b12`
- Regelprofile der Standarddecks: private lokale Classic-/Proteus-
  Playtestprofile, harte KI und Detailtrace

Alle Ausgangs-, Zwischen- und Abschlussläufe liegen in derselben
fortgeschriebenen isolierten SQLite-Datenbank des Worktrees. Die Datenbank
wurde nicht zwischen den Replays geleert. Die Analyse verwendete
ausschließlich die lokale read-only Maintenance-Analyse-API.

## Ergebnis wie im Programm

| Partie | Standarddecks                                                    |            Endergebnis | Agendapunkte | Ende         | Entscheidungen |
| ------ | ---------------------------------------------------------------- | ---------------------: | -----------: | ------------ | -------------: |
| Seed 1 | **Krashkurs: Clown-Kreditmaschine** gegen **Chrome Rush Bureau** | Runner **10 – 3** Corp |      **7:3** | Agendapunkte |            571 |
| Seed 2 | **Krashkurs: Clown-Kreditmaschine** gegen **Chrome Rush Bureau** | Corp **10 – 3** Runner |      **7:3** | Agendapunkte |            462 |
| Seed 3 | **Krashkurs: Clown-Kreditmaschine** gegen **Chrome Rush Bureau** | Runner **10 – 3** Corp |     **10:3** | Agendapunkte |            591 |

Die finalen Match-IDs sind `match_ec5b2d5b75e389b9`,
`match_21124ba27dbaae1a` und `match_df1e2cd6549ea67d`.

Die Ausgangsläufe `match_c64a44a2ac44c28e`,
`match_42737c56d7334318` und `match_7cb74cffd912c6c6` endeten Runner 10:5
nach 646 Entscheidungen, Corp 10:4 nach 444 Entscheidungen und Runner 10:1
nach 558 Entscheidungen. Gewinnerseite und Grundmuster bleiben über den
gesamten Zyklus stabil; die Scorefolgen und Endstände ändern sich durch die
Ursachenfixes deutlich.

## Vollständiger Decision-Denominator

Alle 1.624 finalen Entscheidungen wurden seitenweise und genau einmal
geladen:

- Seed 1: 571/571;
- Seed 2: 462/462;
- Seed 3: 591/591;
- ausschließlich `ai-decision-trace-v2` mit vollständigen historischen
  LegalActions, Engine-Evidence, actor-privaten Analysesnapshots und
  Checkpoint-Captures;
- `FLAGS=0` in jedem Seed: keine Lücke, kein Duplikat, Fallback, Timeout,
  Auswahlmismatch, Engine-Rejection, unbekanntes Assessment oder fehlende
  Auditsektion;
- getrennte vollständige Ereignishistorien mit 572, 463 und 592 Events und
  jeweils enthaltenem terminalem Zustand;
- 58 Runstarts, davon 43 erfolgreich, 13 gestohlene und zwölf von der Corp
  gescorte Agenden.

## Behobene Findings

### SP-061 – Score-Schutz für eine neue Remote verlor Bindung und Vorrang

`new_remote` bezeichnet in der LegalAction den noch nicht existierenden
Installationsort und nach der Installation in der Projektion die neu
entstandene Remote. Der Score-Schutz verlangte fälschlich zusätzlich eine
identische semantische Ziel-ID und verlor dadurch seine konkrete ICE-Action.
Nach der ersten Reparatur konnte dieselbe gebundene Schutzschicht noch von
immer weiteren nichtterminalen Zentralschichten verdrängt werden.

Der Scoreparent bindet nun Quellkarte, LegalAction und den
`new_remote`-Lebenszyklus genau einmal. Bereits ausreichend geschichtete
Zentralen dürfen diese erste gebundene Score-Schicht außerhalb terminaler
Gefahr nicht weiter verdrängen. Das schafft weder eine feste Kernremote noch
eine zweite Defense-Autorität: `corp.score_agenda` bleibt Parent,
`corp.defend_servers` bleibt einziger ICE-Allokator. Die finalen Replays
materialisieren den Vertrag unter anderem in Seed 3 an D321 und D418.

### SP-062 – Zwei ICE-Schichten galten ohne echten Runnerpfad als reif

Die enge Zwei-Layer-Ausnahme aus SP-045 betrachtete bisher nur bezahlbare
Corp-Rez-Kosten. Dadurch konnte eine Remote als scorebereit gelten, obwohl
der sichtbare Runner beide Schichten günstig und folgenlos passieren konnte.

Die Reifeprüfung verwendet jetzt die aktuelle Engine-zertifizierte
Post-Rez-Route des sichtbaren Runner-Rigs. Zwei Schichten genügen nur, wenn
sie den Zugriff blockieren, mindestens die Hälfte der allgemeinen
Runner-Liquidität binden oder eine unvermeidbare strukturierte
Damage-/Tag-/Action-Gefahr hinterlassen. Reine Legacy- oder unbekannte
Risikofelder werden nicht als sicherer Schaden ausgelegt. Im finalen ersten
Seed sind die D341-, D453-, D494- und D552-Scorefenster weiterhin legitim:
Die sichtbaren Wege kosten 8 von 8, 8 von 14, 12 von 19 und 14 von 22
allgemeinen Credits. Der Ownership-Test hält Install, Advance und Score beim
bestehenden Scoreplan.

### SP-064 – Sicherer Matchpoint-Score verlor gegen spekulativen Defense-Draw

Im Zwischenlauf `match_a48ad219c3173450` war eine installierte Agenda im
selben Zug exakt fertigstellbar; ein Diebstahl hätte dem Runner sofort den
Sieg gegeben. Trotzdem durfte ein spekulatives Defense-Draw den benötigten
Klick verbrauchen. Der Checkpoint
`cp-selfplay-013-03-score-before-defense-draw-d483` hält den vollständigen
Zustand fest.

`corp.score_agenda` veröffentlicht für genau diesen Fall jetzt
`preventsTerminalSteal`. Die bestehende P2-Scorekonversion bleibt damit vor
einem ungebundenen Defense-Draw, ohne allgemeines Draw oder Defense
abzuwerten. Der finale dritte Seed führt D481 bis D486 als gebundene
Operation-, Install-, Advance- und Scorefolge aus.

### SP-066 – Letztes Drawfenster verlor nach Agenda-Installation seine Frist

Nach SP-064 installierte die Corp im Zwischenlauf
`match_78be06130554dfa0` Tycho Extension im letzten sicheren Drawfenster.
Nach der Installation fiel der residente Scoreplan jedoch auf die gewöhnliche
Schutzprüfung zurück; D578 wählte Credit, obwohl ohne Abschluss vor der
nächsten Pflichtziehung die Niederlage feststand. Der Checkpoint
`cp-selfplay-013-04-last-draw-score-continuation-d578` reproduziert den
Verlust der Frist.

Ein im `last_draw_window` zugelassener Scoreplan behält seine Frist nun über
Install, Advance und Score, solange dieselbe Planinstanz, Agenda und Remote
gebunden bleiben. Die Regel erfindet keine neue Scorelinie und ignoriert
keinen Schutzbedarf; sie verhindert nur, dass die bereits gewählte
Überlebenslinie in eine garantierte Deckout-Warteposition zurückfällt. Im
finalen Seed 3 installiert D577 Tycho Extension und setzt mit D578/D579 die
Advance-Fortsetzung fort. Der Runner kann die günstige Zwei-Wall-Remote
anschließend legal contesten und gewinnt – die Corp hat aber nicht mehr
freiwillig die sichere Deckout-Niederlage gewählt.

## Gewinneranalyse

**Seed 1:** Der Runner gewinnt 7:3, startet 18 Runs, erreicht 13-mal den
Zugriff und stiehlt fünf Agenden. Die Corp erzeugt wiederholt echte
Scorefenster hinter Engine-zertifizierten Pfaden. Der Runner bezahlt diese
Pfade jedoch, füllt die Liquidität durch seine Kreditmaschine erneut auf und
konvertiert vier späte Scoreprojekte in Steals.

**Seed 2:** Die Corp gewinnt 7:3 und scoret sieben Agenden. Ab Zug 35 wird
eine finanzierte Mehrschicht-Remote konsequent genutzt. Der Runner startet 14
Runs, erreicht zehn Zugriffe und stiehlt zwei Agenden, kann das Corp-Scoretempo
zwischen den Zügen 35 und 57 aber nicht einholen.

**Seed 3:** Der Runner gewinnt 10:3 über sechs Steals bei 26 Runs und 20
erfolgreichen Zugriffen. Die reparierte letzte Score-Continuation verhindert
den freiwilligen Deckout, doch der Runner besitzt für die sichtbar günstige
Remote den genauen Breaker- und Creditpfad und stiehlt die abschließende
Agenda.

## Verliereranalyse und Metaebene

1. **Seed 1 – Corp verliert trotz legaler Scorefenster.** Die vier späten
   Remotes binden jeweils mindestens die Hälfte der sichtbaren allgemeinen
   Runner-Credits und erfüllen damit den generischen Reifevertrag. Der Runner
   regeneriert schneller als die Corp zusätzlichen Grenzschutz aufbauen kann.
   Das verdichtet SP-006 (`corp-score-exposure-risk`), belegt aber in keinem
   Einzelzustand eine sicher bessere LegalAction-Linie.
2. **Seed 2 – Runner verliert durch Tempo und Matchup.** Er contestet früh,
   stiehlt zwei Agenden und nutzt Zentralzugriffe. Die Corp erreicht danach
   eine finanzierte Mehrschicht-Scorelinie und scoret schneller. Es gibt
   keinen wiederholten passiven Hold, keine fehlende Coverage und keine
   dominante ausgelassene Contest-Action.
3. **Seed 3 – Corp verliert nach erzwungener Überlebenslinie.** Nicht zu
   installieren hätte die nächste Pflichtziehung und damit sicheren Deckout
   bedeutet. Die ausgeführte Agenda-Linie ist daher strategisch richtig,
   obwohl der Runner sie anschließend brechen kann. Das Ergebnis ist kein
   Beleg für einen weiteren Last-Draw- oder Scoreownerfehler.
4. **Abgrenzung zu SP-065.** Die ab D479 beobachteten Runner-Endturns laufen
   über `forgo_terminal_deck_pressure` bei Runner-Matchpoint, günstigem
   Deckrennen und vollständig abgelehnten produktiven Alternativen. Sie sind
   nicht die in Paarung 024 behobene falsche
   `forgo_exhausted_options`-Disposition. Der finale Realpfad-Audit korrigiert
   deshalb die frühere Kreuzreferenz; SP-065 selbst bleibt durch Paarung 024
   behoben und verifiziert.

## Architektur-, Test- und Dokumentationswirkung

- Scoreparent, Defense-Support und konkrete LegalAction bleiben getrennt,
  aber durch Planursprung und Lifecycle-Bindung verbunden.
- Die Zwei-Layer-Ausnahme akzeptiert nur aktuelle Engine-zertifizierte
  Runnerpfade; unbekannte Folgen werden nicht in scheinbare Sicherheit
  umgedeutet.
- Matchpoint- und Last-Draw-Fristen bleiben Eigenschaften derselben residenten
  Scoreinstanz. Kein Choice-Resolver erhält Server-, Agenda- oder
  Actionautorität.
- `planning-architecture.md` dokumentiert alle vier Verträge. Der
  Änderungskompass und die AI-README wurden geprüft; ihre bestehenden
  Owner-, Quote- und Fail-closed-Grenzen bleiben ausreichend.

## Ablauf- und Laufzeitoptimierung

Die drei Seeds werden pro Paarung genau einmal gemeinsam ausgeführt. Der
Decision-Denominator wird ohne wiederholte Eventeinbettung in 200er-Seiten
geladen; die Ereignisse folgen getrennt in 500er-Seiten bis zum nachgewiesenen
Terminalzustand. So entfallen redundante, pro Decision-Seite wiederholte
Eventblöcke. Nach dem Main-Rückmerge genügte ein kompletter Drei-Seed-Replay
mit `FLAGS=0`; unveränderte Verlustmuster wurden nicht noch einmal über
vollständige Rohbundles analysiert.

## Verifikation

- finale Drei-Seed-Serie mit 1.624/1.624 auditierten Entscheidungen,
  vollständigen terminalen Ereignishistorien und `FLAGS=0` je Seed;
- 266/266 fokussierte Plan-First- und Zyklus-013-Checkpointtests grün;
- Ownership-Regressionen sichern Scoreparent, Defense-Executor, Step,
  Action-ID und fehlende Resolverautorität;
- der aus Paarung 016 übernommene Damage-Layer-Test verwendet jetzt das
  kanonische Engine-Feld `unbrokenRunEffect.causesDamageOrProgramTrash` und
  bleibt unter der strengeren echten Runnerpfad-Prüfung grün;
- der AI-Typecheck weist ausschließlich die fünf bekannten unabhängigen
  Baselinefehler aus.

Verdichtete Fälle und Reproduktionsdaten stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
