# KI-Selbstspielzyklus 010 – Drei-Seed-Folgezyklus Siren Fortress

Stand: 2026-08-19
Status: mehrere generische Findings behoben und in drei vollständigen
Realpfad-Partien verifiziert; strategische Restverdachte bleiben getrennt in
der Indizienmatrix

## Reproduktionsvertrag

- Auswahlseed: `422509eecc6c66945c0f14fe281ffcd9`
- Runner: **Skivviss Mill Pressure**, 45 Karten,
  `standard_standard_runner_skivviss_mill_pressure_1.0.0`,
  `fnv1a:4ff6aee1`
- Corp: **Siren Fortress**, 45 Karten und 25 Agendapunkte,
  `standard_standard_corp_siren_fortress_1.0.0`, `fnv1a:addfa55f`
- Spielseeds:
  - `selfplay-009-21da56ae2f888799758d45f51a286ada`
  - `selfplay-010-b604b9c865446938399a534954564f51`
  - `selfplay-010-9e036c36e4bec7033bdde25aed3f2656`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen über den normalen Multiplayer-/KI-Pfad auf dem isolierten
Worktree-Port 8911. Die ursprüngliche fortgeschriebene Diagnosedatenbank blieb
mit allen Zwischenläufen erhalten. Nachdem sie auf rund 2 GB angewachsen war
und ein Serverneustart am Node-Heap-Limit scheiterte, wurden nur die drei
abschließenden Replays in einer neuen isolierten Abschlussdatenbank
fortgesetzt. Es wurde keine Datenbank gelöscht. Die Auswertung erfolgte
ausschließlich über die lokale read-only Maintenance-Analyse-API.

## Ergebnis wie im Programm

| Partie | Standarddecks | Endergebnis | Agendapunkte | Ende | Entscheidungen |
| --- | --- | ---: | ---: | --- | ---: |
| Seed 1, `match_2126aaf97f192174` | **Skivviss Mill Pressure** gegen **Siren Fortress** | Runner **10 – 0** Corp | **8:0** | Agendapunkte | 183 |
| Seed 2, `match_b919dcf4ed33e997` | **Skivviss Mill Pressure** gegen **Siren Fortress** | Runner **10 – 0** Corp | **7:0** | Agendapunkte | 169 |
| Seed 3, `match_8f7acfff2b3351cd` | **Skivviss Mill Pressure** gegen **Siren Fortress** | Runner **10 – 6** Corp | **7:6** | Agendapunkte | 459 |

Vor den Änderungen endete Seed 1 ebenfalls 10:0 bei 8:0 Agendapunkten. Seed 2
endete 10:4 bei 9:4 Agendapunkten und 356 Entscheidungen. Seed 3 endete 10:2
bei 4:2 Agendapunkten durch Corp-Deckout. Ein später Zwischenstand von Seed 3
erreichte zwar Corp 6, ließ die gewinnbringende Agenda aber bis zum Deckout in
HQ. Nach dem Fix installiert und avanciert die Corp sie im letzten sinnvollen
Fenster; der Runner reagiert und gewinnt anschließend durch Agendapunkte.

## Vollständiger Decision-Denominator

Alle 811 Entscheidungen der drei finalen Partien wurden seitenweise und genau
einmal geladen und klassifiziert:

- Seed 1: Indizes 1 bis 183, keine Lücke und kein Duplikat;
- Seed 2: Indizes 1 bis 169, keine Lücke und kein Duplikat;
- Seed 3: Indizes 1 bis 459, keine Lücke und kein Duplikat;
- ausschließlich `ai-decision-trace-v2`;
- 811-mal persistierte historische LegalActions, Engine-Evidence und
  actor-private Analysesnapshots;
- keine Fallbacks, Timeouts oder fehlenden Auditsektionen;
- insgesamt 29 Runs, sieben erfolgreiche Runs, acht gestohlene und zwei von
  der Corp gescorte Agenden.

Der dritte Seed wurde zusätzlich als neuer Matchlauf wiederholt. Beide Läufe
besitzen 459 vollständig identische Action-IDs, Actiontypen, Seiten und
Turnnummern und enden Runner 10 – Corp 6 bei 7:6 Agendapunkten. Die finalen
StateHashes unterscheiden sich erwartungsgemäß durch matchspezifische
Zustandsidentität; die fachliche Entscheidungsfolge ist identisch.

## Behobene Findings

### 1. Score-Schutz wurde auf neue leere Remotes fragmentiert

Der bisherige Trace setzte „keine unmittelbare Senkung der
Zugriffswahrscheinlichkeit“ mit „keine Schutzverstärkung“ gleich. Bekannter
Breaker-Creditverbrauch sowie Stop-, Tax-/Damage- und Encounter-Störung
fehlten. Zusätzlich wurden bereits liegende unrezzte ICE wie gemeinsam zu
finanzierende Pflichtschulden behandelt, während eine neue erste Schicht
leichter zugelassen wurde als die zweite Schicht einer bestehenden Remote.

`corp.defend_servers` erkennt diese Engine-gequoteten Wirkungen nun als
Schutzfortschritt, behandelt unrezzte ICE als alternative Rezrouten und darf
unter denselben engen Sicherungen die zur üblichen Reife fehlende zweite
Schicht fortsetzen. Die Ausnahme endet dort. Es gibt weder blindes drittes
Layering noch ein dauerhaft festgelegtes „Core Remote“; Agenda, Asset und
Scoreprojekt werden nach jeder Zustandsänderung neu bewertet.

### 2. Konkrete Runner-Contest-Routen verloren gegen Platzhaltersignale

Ein wiederholtes Matchpoint-Remote-Signal konnte einen bereits exakt
ausführbaren Runpfad überschreiben. Außerdem wurden ein bekannter
trashbarer Zugriff und ein wiederholter R&D-Probe teilweise als bloße
Informationsroute statt als gebundener Contest beziehungsweise endliche
Informationskampagne behandelt. Die konkrete LegalAction bleibt jetzt beim
zuständigen Runparent; ein Meta-Signal darf keinen ausführbaren Route-Head
ersetzen.

### 3. Recovery und Installationsvarianten waren nicht vollständig gebunden

Top-of-Heap-Recovery konnte trotz aktuellem Breakerbedarf pauschal als
unnötig verworfen werden. Bei Installationen mit mehreren Zahlungs- oder
Programm-Trash-Varianten konnte eine schwächere Variante eine direkte Route
verdrängen. Die Entwicklung priorisiert jetzt direkte vor gehosteten und
Programm-Trash-Varianten und prüft vor einer Trash-Installation einen exakt
benennbaren, fachlich vertretbaren Sacrifice. Ohne solchen Kandidaten bleibt
die Action sichtbar dispositioniert und fail-closed.

### 4. Run-Start-Sperre galt nicht für alle Run-LegalActions

Karten- und servergebundene Run-Starts konnten trotz globaler oder
serverspezifischer Engine-Sperre noch veröffentlicht werden. Sämtliche
Run-Start-Familien laufen nun durch dieselbe
`evaluateRunStartEligibility`. Die KI errät keine Sperre; sie erhält nur
Engine-legale aktuelle Actions.

### 5. Restklicks konnten trotz sicherem Creditpfad ownerlos bleiben

Im langen dritten Seed erreichte der Runner nach einem Agendadiebstahl einen
reichen Zustand mit drei Klicks und 16 Credits. Stärkere Pläne waren korrekt
abgeschlossen oder verworfen, aber auch der exakte Basic-Credit-Pfad wurde
wegen erfüllter Reserve ausgeschlossen. Ein endlicher P6-Plan nutzt nun
ansonsten ungenutzte Restklicks für aktuelle Basic Credits. Er ist pro Zug
begrenzt und wird von jedem stärkeren Plan verdrängt.

Der breite Test deckte dabei einen wichtigen Gegenfall auf: Am Matchpoint darf
dieser P6-Plan ein belegtes günstiges Deckout-Abwarten nicht verdrängen. Die
Priorität ist jetzt explizit: terminale Deckdrucklinie vor Restkapazität;
unterhalb des Matchpoints darf der Runner die Restklicks weiter in Credits
umsetzen.

### 6. Zusätzliche Pflichtziehungen erreichten die Scoredeadline nicht

Die Engine veröffentlichte bei aktivem Skivviss-Counter korrekt zwei
Corp-Pflichtziehungen pro Drawfenster. Die positive AI-DTO-Allowlist entfernte
aber genau diese öffentlichen Zählfelder. Die Scoreline rechnete deshalb rohe
Deckkarten statt verbleibender Drawfenster und hielt einen bereits letzten
Scoreversuch für „offen“.

Der DTO-Vertrag erhält jetzt die Engine-eigenen Pflichtziehcounts. Die
Scoreline berechnet `floor(verbleibende Deckkarten / Pflichtkarten je
Fenster)`. Im letzten belastbaren Matchpoint-Fenster darf
`corp.score_agenda` die gebundene Agenda trotz unvollständiger gewöhnlicher
Schutzreserve installieren; die Gegnerreaktion bleibt danach eine echte
Informationsgrenze. Im Replay wird aus dem vorherigen Deckout eine
ausgeführte Install-/Advance-Linie und schließlich eine Niederlage durch
Agendapunkte.

## Gewinneranalyse

**Seed 1:** Der Runner griff achtmal HQ und dreimal R&D an. Drei erfolgreiche
Runs genügten für drei Agenden und acht Punkte. Die Corp installierte zwar vier
HQ- und drei R&D-ICE, erzielte aber keinen eigenen Score. Der Sieger gewann
nicht durch einen einzelnen Treffer: frühe Zentraltests, vollständige
Breakerentwicklung und späterer HQ-Multiaccess bildeten eine durchgehende
Linie.

**Seed 2:** Sieben der neun Runs gingen auf R&D. Der Runner stahl schon früh
eine Drei-Punkte-Agenda und beendete das Spiel später mit Tycho Extension.
Die Corp investierte erneut in Zentral- und Remote-ICE, begann aber keinen
Agenda-Score. Die unterschiedliche Zielwahl gegenüber Seed 1 bestätigt, dass
der Runner nicht starr HQ spammt, sondern den jeweils zugänglicheren
Zentralserver konvertiert.

**Seed 3:** Nur einer von neun Runs wurde als erfolgreich gezählt, dennoch
gewann der Runner. Er hielt den langen Fortress-Aufbau aus, stahl zunächst
drei Punkte aus Archives und beantwortete den späten Corp-Matchpointversuch.
Nachdem die Remote ihn nicht sofort zum Sieg führte, wechselte er auf HQ und
fand dort zweimal Black Ice Quality Assurance. Das ist eine plausible
Gegnerreaktion auf den nun tatsächlich ausgeführten Corp-Scoreplan.

## Verliereranalyse und Metaebene

Die drei Niederlagen haben nicht dieselbe Ursache:

1. In Seed 1 und 2 verliert Siren Fortress 0 Punkte, weil es den gekauften
   Schutz nicht rechtzeitig in einen Scoreversuch umsetzt. Zentrale Defense
   verzögert den Runner, verhindert die wenigen erfolgreichen Multiaccesses
   aber nicht. Agendaexposition auf HQ/R&D und fehlendes eigenes Tempo wirken
   gemeinsam.
2. Seed 3 widerlegt ein pauschales „Deck kann nicht scoren“. Die Corp scoret
   AI Chief Financial Officer und Tycho Extension früh auf derselben Remote
   und erreicht sechs Punkte. Das Fortress-Konzept funktioniert dort: acht
   von neun Runs liefern keinen als erfolgreich gezählten Zugriff.
3. Der frühere Seed-3-Verlust war dennoch veränderbar. Mit sechs Punkten,
   mehreren ICE auf Remote 1 und gewinnbringenden Agenden in HQ nahm die Corp
   bis zum leeren Deck Credits beziehungsweise weitere Defense. Nach dem Fix
   installiert sie Tycho Extension, avanciert zweimal und zwingt den Runner
   zur Antwort.
4. Der finale Verlust ist kein klarer weiterer lokaler Bug. Die Corp hat nur
   sechs Credits, muss fünf Advancements über zwei Corpzüge verteilen und
   öffnet dabei HQ als alternatives Ziel. Der Runner findet dort genau die
   fehlenden vier Punkte. Ob ein früherer Scorebeginn oder eine andere
   Zentral-/Remote-Ressourcenverteilung generell besser wäre, bleibt eine
   strategische Verdichtung, nicht Grundlage für einen weiteren Schnellfix.

Das Matchup ist für Siren Fortress gegen dauerhafte Zentralpressure und
Multiaccess ungünstig, aber nicht allein entscheidend. Zwei Seeds zeigen
veränderbaren Score-Stau; der dritte zeigt, dass konsolidierter Schutz und
rechtzeitige Scorekonversion beinahe gewinnen können.

## Neue Ideen und Restverdachte

- Defensive Root-Upgrades besitzen weiterhin keinen vollständig mit ICE,
  Agenda-Risiko und Scoretempo vergleichbaren Defense-Pfad (SP-029).
- Die wiederholten 0-Punkte-Niederlagen verdichten SP-017: Ein generischer
  Makrovertrag sollte den erwarteten Verlust durch weiteres Warten gegen den
  frühesten vollständig gequoteten Install-/Advance-/Score-Horizont stellen.
  Dafür fehlen noch Vergleichszustände mit tatsächlich besserer LegalAction.
- Eine technische Prozessgrenze ist erreicht: Die vollständigen Detailtraces
  aller Zwischenreplays ließen die einzelne SQLite-Datei auf rund 2 GB
  wachsen. Künftige Mehrfachzyklen sollten finale Evidence langfristig
  erhalten, rohe erfolglose Zwischenläufe aber über die bestehende
  Maintenance-Cleanup-Policy begrenzt halten oder pro Abschlussblock
  segmentieren. Ein stilles Löschen ist ausgeschlossen.

## Verifikation

- fokussierte DTO-, Scoreline-, Plan-Ownership-, Remote-, Recovery-,
  Installationsvarianten-, Restkapazitäts- und Engine-Run-Eligibility-Tests:
  grün;
- acht angrenzende AI-Testdateien vollständig grün;
- die breite `plan-first-live-runtime`-Datei verbessert die bestehende
  `main`-Baseline von 25 auf 22 Fehler; keine neue Fehlerbezeichnung kommt
  hinzu, drei bisher rote Fälle werden durch dieses Changeset grün;
- drei finale Realpfad-Partien mit 811/811 vollständig auditierten
  Entscheidungen, ohne Fallback, Timeout, Lücke oder fehlende Auditsektion;
- zusätzlicher Seed-3-Replay mit 459/459 identischen fachlichen
  Entscheidungen.

Verdichtete Fälle und Reproduktionsdaten stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
