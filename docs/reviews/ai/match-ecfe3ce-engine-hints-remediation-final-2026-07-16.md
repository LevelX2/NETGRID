# Match ECFE3CE: Engine-, Hint- und Consumer-Remediation 2026-07-16

## Ergebnis

Die freigegebenen Punkte F1, F2 und H1 bis H5 aus dem vollständigen Audit von
`match_ecfe3ce373a56823` sind umgesetzt. Die historische Partie bleibt als
unveränderliche Evidence erhalten; auf aktuellem Code sind die fehlerhaften
Entscheidungs- und Regelverträge durch spielgleiche beziehungsweise
mechanikgleiche Regressionen geschlossen.

## Korrigierte Run-Pfadquote

Der ursprüngliche Auditbefund wurde präzisiert: Krash war bei Decision 59
installiert und konnte sowohl Rex als auch Data Wall 2.0 brechen. Fehlerhaft
war nicht die Breaker-Coverage, sondern die doppelte Budgetführung. Die
garantierte Vermeidung von Rex' sichtbarem Trace wurde nur als Hazard
abgezogen, anschließend aber nicht aus demselben Credit-Pool wie das spätere
ICE bezahlt.

Die Pfadquote führt jetzt jede garantierte Hazard-Vermeidung und jeden
späteren Break durch denselben eingeschränkten Credit-Pool. Gebrochene oder
bezahlte Trace-Subroutinen erzeugen danach keinen zweiten Treffer-Effekt. Im
historischen Zustand entstehen 4 Credits für Rex plus 4 Credits für Data Wall
2.0, also 8 Credits Pfadkosten und 0 verbleibende Credits. Der Remote-Run wird
zugunsten der Entwicklung verworfen. Mit 10 Credits bleibt derselbe Pfad als
positive Gegenprobe bei 8 Kosten und 2 Reserve erreichbar.

Der spätere Jack-out in Decision 63 war korrekt: In der konkreten Partie
kostete die tatsächliche niedrigere Trace-Auktion 3 und Data Wall 2.0 weitere
4 Credits. Der Run hätte deshalb nur 1 Credit statt der geforderten Reserve
übrig gelassen.

## Einheitliche Run-Sperre

Die Fang-Sperre ist nun ein gemeinsamer Engine-Vertrag. Unter ausstehenden
Pflichtaktionen oder einer offenen Credit-Zahlung werden folgende Quellen
nicht mehr als LegalActions angeboten:

- normale Runs,
- Run-only- und Bonus-Runs,
- erzwungene Folgeruns,
- Legacy-Run-Events und
- Kartenimplementierungen mit gedrucktem `make_run`-Effekt.

Unabhängig vom LegalAction-Builder prüft `startRun` die Sperre erneut, bevor
Run-Zähler, Credits, Karten oder der Run-State verändert werden. Damit gilt
die Regel auch für verzögerte Choices und jede zukünftige Quelle, die direkt
den gemeinsamen Startpfad verwendet.

## Kartenhints und produktive Consumer

- Fang trägt keine Tag-Rolle, keinen Tag-Druckplan und keine
  `add_tag`-Mechanik mehr.
- All-Nighter verlangt keinen erfolgreichen ersten Run; der Folgerun ist ein
  Action-Follow-up.
- Private LDL Access wird als HQ-Run mit R&D-Access-Replacement projiziert.
- Bodyweight Synthetic Blood veröffentlicht fünf gezogene Karten. Der
  produktive Draw-Consumer nutzt die Menge mit abnehmendem Zusatzwert, damit
  die Karteneffizienz sichtbar bleibt, ohne einen akuten Kreditaufbauplan bei
  2 Credits zu überstimmen.
- TKO 2.0 veröffentlicht den Verlust einer Runner-Aktion als strukturierten
  `action_penalty`; Inspector und generischer Semantik-Consumer erhalten das
  Signal `corp_ice.runner_action_loss`.

## Erneute Analyse des letzten beendeten Spiels

Der read-only SQLite-Schnellpfad bestätigt weiterhin
`match_ecfe3ce373a56823` als letztes beendetes Spiel: Runner-KI auf `hard`, 351
Events, 351 StateSnapshots und 208 detaillierte KI-Traces. Der vollständige
Decision-Denominator bleibt 208/208.

Die erneute Prüfung ändert nicht die historischen Actions, trennt aber ihre
Ursachen jetzt sauber:

- Decision 59 war eine zu billige Pfadquote, nicht fehlende Wall-Coverage.
- Decisions 60 bis 63 waren eine Folge dieses Starts; der konkrete Jack-out
  selbst war rational.
- Die Fang-Umgehung war eine Engine-LegalAction-Lücke über alternative
  Run-Quellen und ist jetzt quellenunabhängig geschlossen.
- Die fünf Hint-Funde waren echte Quelle-/Consumer-Vertragsfehler und sind bis
  zur produktiven Nutzung geschlossen.
- Die Broker-Beobachtungen bleiben ein eigener Strategiekomplex und sind
  nicht durch die Run- oder Hint-Fixes automatisch erledigt.

## Broker-Folgegate

Der vollständige Entscheidungs-Census steht in
`docs/architecture/ai/match-ecfe3ce-broker-audit-2026-07-16.md`. Bestätigt sind
vier getrennte Optimierungspunkte:

1. Decision 156 ließ einen legalen letzten Lade-Klick zugunsten eines Basic
   Credits aus.
2. Decision 179 installierte eine zweite Kopie ohne ausreichende
   Amortisationsprüfung.
3. Decisions 180 und 191 zeigen eine falsche Quellenwahl: Der pauschale
   Erstladebonus bevorzugt eine leere oder neue Kopie gegenüber einer bereits
   reifen Bank.
4. Decision 56 war ein wahrscheinlich verfrühter Cashout im Umfeld der
   fehlerhaften Run-Pfadquote und muss nach deren Korrektur gezielt neu
   reproduziert werden.

Ein einzelner Broker kann wegen seines gemeinsamen
`once_per_turn_per_source`-Limits nicht im selben Zug erst laden und danach
auszahlen. Der Nutzerverdacht eines ausgelassenen zweiten Einsatzes derselben
Kopie ist daher regeltechnisch entlastet; die ausgelassenen Ladefenster und
die zu frühe Mehrkopien- beziehungsweise Cashout-Wahl sind dagegen real.

## Verifikation

- AI-Vollsuite: 340/340 Testdateien, 2324/2324 Tests.
- Engine-Vollsuite: 186/186 Testdateien, 1694/1694 Tests.
- AI- und Engine-Typecheck: grün.
- Compiled-Hints-, Derived-Facts-, Compiled-Index-, Manual-Overlay-,
  Action-Semantic-Signal- und Inspector-Gates: grün, 0 harte Fehler.
- Hint-Bestand: 618 Karten, 602 Action-Signal-Abdeckungen.
- Format- und Diff-Hygiene: grün.

## Restpunkt

Die Broker-Heuristik ist absichtlich nicht Teil dieser Remediation. Ihre vier
bestätigten Folgefunde benötigen eigene spielgleiche Checkpoints und ein
separates Freigabe-Gate, damit Notfall-Cashouts, normale Reifeziele,
Mehrkopien-Amortisation und Quellenwahl nicht vermischt werden.
