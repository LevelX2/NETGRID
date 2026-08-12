# Runtime Port Architecture

Status: current  
Stand: 2026-08-12

## Zweck

Die interne Engine-Runtime wird über statisch typisierte Domain-Ports komponiert. Es gibt keinen dynamischen String-Lookup, keinen generischen Delegate-Store und keine untypisierte Wrappergrenze als produktiven Dispatchpfad.

## Komposition

`packages/engine/src/game/engine-runtime-internal/runtime-composition.ts` erzeugt die fachlichen Portgruppen in expliziter Abhängigkeitsreihenfolge.

`initializeRuntimeComposition(runtimeDomainDeps)`:

1. erzeugt die Domain-Factories gegen ein stabiles gemeinsames `RuntimeDeps`-Objekt;
2. ergänzt dieses Objekt schrittweise um die bereits gebauten Portgruppen;
3. baut den vollständigen Portgraphen auf;
4. übernimmt die fertigen Gruppen in dasselbe Dependency-Objekt;
5. installiert die öffentlichen internen Bindungen genau einmal über `installRuntimePortBindings(ports)`.

Factories dürfen `runtimeDomainDeps` als stabiles Objekt capturen. Öffentliche Engine-Aufrufe erfolgen erst nach Abschluss dieser Initialisierung.

## Typvertrag

`runtime-port-contracts.ts` beschreibt die Gesamtgruppen. Fachlich benannte Portmodule beschreiben die engeren Domain-Grenzen für State, Economy, Turn, Action, Corp, Card Lifecycle, Run, Access, Choice, Hidden Zone, Damage, Trace und weitere Engine-Domänen.

Diese Portverträge sind deklarativ:

- kein `any`;
- keine ausführbaren Statements in den reinen Portmodulen;
- keine Bootstrap-Rückimporte;
- konkrete Factories müssen ihren typisierten Port vollständig erfüllen.

## Stabiles Dependency-Objekt

Ein Runtime-Modul darf das gemeinsame `deps`-Objekt nicht bei der Factory-Erzeugung destrukturieren und damit eine unvollständige Momentaufnahme festhalten. Zugriffe erfolgen über `deps.member`, sodass später ergänzte Bindungen für die bereits erzeugten Closures sichtbar sind.

Diese Regel wird durch den Engine-Strukturguard ausführbar geschützt.

## Schichtgrenze

`game/engine-runtime.ts` ist die einzige zulässige äußere Fassade zur privaten Kompositionsschicht. Andere Engine-Bereiche dürfen `game/engine-runtime-internal/` nicht direkt konsumieren.

Die Portarchitektur verändert keine Spielregel. Hidden Info, LegalAction-Revalidierung, Replay, StateHash und seedbasierter Zufall bleiben separate verbindliche Engine-Verträge.
