# Runtime Port Architecture

Status: E06 action and lifecycle clusters migrated

## Problem

Die Ausgangsstruktur leitete 430 Funktionen über fünf Wrapperdateien
mit `(...args: any[]): any` und einen dynamischen String-Lookup weiter. Dadurch
prüft TypeScript genau an der zentralen Routinggrenze weder Parameter noch
Rückgabewerte zuverlässig.

## Zielvertrag

`runtime-port-contracts.ts` beschreibt die typisierte Kompositionsgrenze.
Zyklusfreie Portgruppen werden direkt aus ihrer konkreten Factory abgeleitet.
Für bereits migrierte Cluster liegen kleine deklarative Portmodule vor, gegen
die sowohl Factory als auch Delegate geprüft werden. Diese expliziten Verträge
verhindern, dass eine Typableitung aus dem State-Bootstrap wieder einen großen
Runtime-Importzyklus erzeugt. `RuntimePortRegistry` installiert eine typisierte
Auswahl genau einmal und meldet fehlende Gruppen explizit.

Die Portgruppen entsprechen zunächst den existierenden Factory-Grenzen. Diese
Stabilität erlaubt die schrittweise Migration ohne Regel- oder
Initialisierungsänderung:

1. E05 migriert State, Economy, Counter und Zone.
2. E06 migriert Turn, Action, Corp und Card Lifecycle.
3. E07 migriert Run, Access, Choice, Hidden Info, Damage und Trace.
4. E08 entfernt den verbliebenen Delegate-Store und die Altwrapper.

E04 führte die Grundlage bewusst parallel und ohne produktiven Consumer ein.
E05 hat die 67 Funktionen des State-Service-Clusters produktiv typisiert. Die
Factory-Grenzen für Economy, Lookup, Card Strength/Cost, Counter/Turn und Zone
implementieren nun eigene deklarative Ports. Die verbleibenden 59 untypisierten
Funktionen in `state-runtime-delegates.ts` gehören zu State-Corp-, Lifecycle-
und State-Resolver-Gruppen und werden in den folgenden Clustern migriert.

Der Strukturwächter schützt die fünf State-Portmodule gegen `any`, ausführbare
Statements und erneutes Größenwachstum. Die bekannte Zyklenliste blieb durch
E05 unverändert bei zwei Einträgen; insbesondere wurde kein zirkulärer
Factory-Typgraph als neue Baseline übernommen.

E06 hat weitere 177 Delegate-Funktionen aus Action, Turn, Corp, Card und
Lifecycle migriert. Die Action- und Card-Delegate-Dateien enthalten damit kein
`any` mehr; im State-Delegate verbleiben nur die 39 für E07 vorgesehenen
State-Resolver. Zusätzlich ist die lokale dynamische Weiterleitung vom
Corp-Resolver zum Turn-Corp-Runtime-Port entfallen. Die konkreten Teilfactories
werden jeweils gegen den für sie zuständigen `Pick` des Gesamtports geprüft,
sodass auch aggregierte Hostgruppen nicht nur am Delegate, sondern bereits bei
ihrer Erzeugung statisch abgesichert sind.

Nach E06 verbleiben insgesamt 186 Altsignaturen: 89 im Choice-, 58 im Flow- und
39 im State-Resolver-Cluster. Die beiden bekannten Importzyklen blieben erneut
unverändert.

## Invarianten

- Portverträge enthalten kein `any`.
- Jede migrierte Factory muss ihren deklarativen Port vollständig erfüllen.
- Deklarative Ports enthalten keine Runtime-Werte und keine Bootstrap-Imports.
- Fehlende Gruppen werfen vor dem ersten Funktionsaufruf einen benannten Fehler.
- Eine installierte Registry kann nicht während eines Spiels rekomponiert
  werden.
- Hidden Info, LegalAction-Revalidierung, Replay und Zufall werden durch die
  reine Kompositionsgrundlage nicht verändert.
