# Runner-KI R&D Repeat Access Observation

Stand: 2026-05-08
Status: Planungs- und Backlog-Notiz

## Beobachtung

In einem lokalen Human-Corp-vs-Runner-KI-Spiel lief die Runner-KI dreimal hintereinander ungeschützt auf R&D und griff jeweils auf eine Karte zu. Wenn die accessed R&D-Karte nicht gestohlen, getrasht, entfernt oder anderweitig bewegt wird, bleibt sie regelhaft oben auf R&D liegen. Mehrfaches erneutes Anlaufen desselben unveränderten Top-of-R&D-Zustands hat daher oft keinen zusätzlichen Wert.

## Einordnung

Das ist keine Engine- oder Visibility-Regelverletzung. Es ist eine Schwäche der Runner-KI-Bewertung:

- V1.4.1 bewertet `pressure_rnd` und `safe_probe_run` bereits planbasiert.
- V1.4.1 hat aber keinen Belief State und keine FullState-Simulation.
- Die konkrete Heuristik "wiederholter R&D-Access auf eine Runner-bekannte, unveränderte Top-Karte ist wenig wertvoll" ist bisher nicht als eigenes Kriterium dokumentiert.

## Empfohlener Aspekt

Als nächster Runner-KI-Härtungspunkt sollte `R&D access freshness` aufgenommen werden.

Mindestvertrag:

- Die Runner-KI darf sich nur side-sichere, vom Runner tatsächlich gesehene Access-Fakten merken.
- Nach erfolgreichem R&D-Access ohne Move der accessed Karte soll ein erneuter R&D-Run kurzfristig deutlich abgewertet werden.
- Die Abwertung muss aufgehoben werden, sobald die Top-of-R&D-Lage plausibel nicht mehr dieselbe ist, z. B. durch Corp-Draw, Shuffle, Arrange, Swap, Steal, Trash, Remove-from-game oder sonstige R&D-Zonenbewegung.
- Die KI darf daraus keine verdeckten HQ-/R&D-/Remote-Informationen ableiten.
- DecisionDebug soll den Grund als sichtbare oder Runner-bekannte Information formulieren, z. B. `known_rnd_top_not_fresh`.

## Geeignete Umsetzungsschicht

Kurzfristig reicht ein kleiner AI-Level-2-Härtungsslice auf Basis von side-gefilterten PublicEvents und Runner-PlayerView, ohne allgemeinen Belief State.

Für V1.4.2 oder ein kleines V1.4.1K-Patch-Gate wäre zu prüfen:

- ObservedFacts oder RunnerPlan-Memory für `last_accessed_rnd_top`.
- Invalidation-Regeln für R&D-Top-Freshness.
- Score-Penalty für `pressure_rnd` und `safe_probe_run`, wenn nur derselbe bekannte Top-Access zu erwarten ist.
- Negativfixture: drei ungeschützte R&D-Runs ohne R&D-Top-Veränderung dürfen nicht wiederholt als bester Plan gewählt werden.
- Positivfixture: Nach Corp-Draw oder Shuffle darf R&D-Druck wieder normal bewertet werden.

## Gate-Hinweis

Dieser Punkt darf den Hidden-Info-Vertrag nicht aufweichen. Es geht nur um vom Runner bereits gesehene Information und deren regelkonforme Fortdauer, nicht um Vorhersage verdeckter Karten.

## Ergänzende Playtest-Beobachtung: Unbrechbares ICE

In einem weiteren lokalen Spiel lief die Runner-KI auf einen Außenserver, die Corp rezzte `Crystal Wall`, und die Runner-KI pumpte `Efficient Fracter`, obwohl dieser Breaker die `Crystal Wall` nach aktuellem Engine-Vertrag nicht brechen kann. Danach wurde der Run durch die ungebrochene End-the-run-Subroutine beendet; anschließend lief die Runner-KI erneut auf denselben sichtbar blockierten Außenserver, ohne zuvor eine passende Lösung installiert zu haben.

Einordnung:

- Das legale Pumpen eines Breakers ist nicht automatisch ein guter Zug.
- Die Runner-KI muss zwischen `pump legal` und `pump useful` unterscheiden.
- Sichtbar gerezztes End-the-run-ICE, das mit dem aktuellen Rig nicht brechbar ist, muss kurzfristig als Blocker für erneute Runs auf denselben Server gelten.

Empfohlene und inzwischen umgesetzte Härtung:

- Reaktive Runner-KI bewertet `pump_breaker` nur hoch, wenn derselbe Breaker das aktuelle ICE nach den echten Card-Ability-/ICE-Subtype-Regeln grundsätzlich brechen kann.
- Runner-Planer bewertet sichtbare gerezzte End-the-run-ICE als Blocker, wenn kein installiertes Runner-Programm dieses ICE nach Card-Ability-/ICE-Subtype-Regeln brechen kann.
- Regression: `Efficient Fracter` gegen `Crystal Wall` wird nicht mehr gepumpt; nach dem beendeten Run wird ein sofortiger erneuter Run auf denselben sichtbar unbrechbaren Außenserver zugunsten von Economy/Setup verworfen.
