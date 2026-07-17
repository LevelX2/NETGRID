# Globale Asset-/Upgrade-Rezfenster während Runs – Final Review

Stand: 2026-07-16
Ergebnis: für lokale Main-Integration freigegeben

## Ergebnis

NETGRID bietet normale Rez-Aktionen für installierte Assets und Upgrades in
den bestehenden Run-Rezfenstern jetzt serverübergreifend an. Während eines
Runs auf Remote 1 kann die Corp deshalb beispielsweise eine unrezzed Hacker
Tracker Central in Remote 2 rezzen, sofern ihre Kosten und bestehenden
Lifecycle-Gates erfüllt sind.

ICE-Rez und fortgebundene Sonderfenster bleiben auf den angegriffenen Server
beziehungsweise das aktuell angegangene ICE begrenzt. Ein Encounter, eine
laufende Subroutine oder ein bereits initiierter Trace-Versuch öffnet weiterhin
kein zusätzliches normales Asset-/Upgrade-Rezfenster.

## Regelvertrag

Die allgemeine `(R)`-Erlaubnis eines Run-Zeitfensters gilt für Assets und
Upgrades unabhängig davon, in welchem Corp-Server sie installiert sind. Der
Serverbezug entsteht nur durch einen ausdrücklichen Kartentext oder ein
fortgebundenes Sonderfenster.

Für Hacker Tracker Central folgt daraus:

- Die Karte darf in einem allgemeinen Run-Rezfenster auch dann gerezzt werden,
  wenn der Runner einen anderen Server angreift.
- Sie muss vor dem Trace-Versuch aktiv sein, um Bits für diesen Trace
  bereitzustellen und den After-Trace-Counter zu erhalten.
- Ihr Kartentext enthält keine Sondererlaubnis, sie während eines bereits
  laufenden Trace-Versuchs zu rezzen.

## Ursache

`buildCorpRunRootRezActions` leitete den angegriffenen Server aus dem aktiven
Run ab und durchsuchte ausschließlich dessen Root. Dadurch vermischte der
Builder zwei unterschiedliche Verträge:

- normale Asset-/Upgrade-Rezoptionen des allgemeinen Run-Fensters;
- fortgebundene Run-Registry- und Fort-Pass-Aktionen.

Der erste Vertrag war dadurch regelwidrig auf das Runziel verengt.

## Umsetzung

Der normale Rezteil von `buildCorpRunRootRezActions` läuft nun über alle
Corp-Server in stabiler Server-ID-Reihenfolge und über die Rootkarten je Server
in stabiler Karten-ID-Reihenfolge. Für jede Karte bleiben die bestehenden
Prüfungen erhalten:

- installiertes Asset oder Upgrade;
- aktuell unrezzed;
- bezahlbare Rez- und Zusatzkosten;
- Agenda-Punkt-Kosten;
- Card-Lifecycle-Gates und fortgebundene Rezrestriktionen.

LegalAction-Label und Payload verwenden den tatsächlichen Server der
Zielkarte. Die Registry-/Fort-Pass-Aktionen erhalten weiterhin ausschließlich
den angegriffenen Server als Kontext. Es entstand keine Hacker-Tracker-Karten-
ID-Verzweigung und keine zweite Regelautorität in UI, Server oder KI.

## UI-Nachtrag vom 2026-07-17

Das Run-Fenster stellt serverübergreifende Asset-/Upgrade-Rezaktionen gesammelt
am Ende der Aktionsliste dar. Eine sichtbare Trennlinie mit der Überschrift
`Auf anderen Servern rezzen` grenzt sie von Aktionen am Runziel und sonstigen
Run-Aktionen ab. Die UI erkennt diese Gruppe ausschließlich an den vorhandenen
LegalAction-Feldern `rootRez` und `serverId`; sie erzeugt oder verändert keine
Regelerlaubnis.

## End-to-End-Nachweis

Die gehärtete Trace-Regression bildet den Nutzerfall direkt ab:

1. Hacker Tracker Central liegt unrezzed mit zwei vorhandenen Bits in Remote 2.
2. Fang 2.0 schützt Remote 1; der Runner startet einen Run auf Remote 1.
3. Die Corp erhält eine Rez-LegalAction für Hacker Tracker Central mit
   `serverId: remote_2` und 0 Credits Kosten.
4. Vor dem Rez kennt der Runner die Kartenidentität nicht; nach erfolgreichem
   `applyAction` ist die Karte öffentlich gerezzt.
5. Fang 2.0 wird am angegangenen ICE gerezzt und initiiert den Trace.
6. Während des laufenden Traces wird keine allgemeine Rez-LegalAction erzeugt.
7. Der Corp-Bid verbraucht beide Hacker-Tracker-Bits und die verbleibenden vier
   Corp-Credits; nach Abschluss des erfolgreichen Traces liegt wieder genau ein
   Bit auf Hacker Tracker Central.
8. `validateGameState`, Replay und finaler StateHash stimmen überein.

## Angrenzende Testpflege

Zwei bestehende Testsequenzen enthielten unrezzed Rootkarten in anderen
Servern und wechselten nach Runstart beziehungsweise ICE-Rez unmittelbar zur
Runner-Aktion. Sie passieren das nun korrekt geöffnete globale Corp-Rezfenster:

- der Mouse-/Expert-Access-Replay-Smoke vor dem R&D-Access;
- der unrezzed-Encoder-Gegenfall nach dem Rezzen des angegangenen ICE.

Die fachlichen Erwartungen dieser Tests bleiben unverändert.

## Sicherheits- und Architekturprüfung

- `getLegalActions` bleibt die einzige Quelle der auswählbaren Rez-Aktionen.
- `applyAction` revalidiert Action-ID, Seite, `stateVersion`, Ziel, Rezstatus,
  Serverzustand und Kosten über den bestehenden Rezpfad.
- Nur die Corp erhält Identität und Ziel der unrezzed Karten in ihren
  LegalActions; die Runner-View bleibt bis zum tatsächlichen Rez verdeckt.
- Öffentliche Events nennen die gerezzte Karte erst nach erfolgreicher
  Zustandsänderung.
- Replay, StateHash und deterministische Action-Reihenfolge bleiben erhalten.
- Keine UI-, Server-, KI-, Kartenpool- oder Legacy-Migrationsänderung war
  erforderlich.

## Verifikation

- `run-rez-window.test.ts`: 6/6 Tests grün.
- Vier fokussierte/angrenzende Testdateien: 163/163 Tests grün.
- Vollständige `@netgrid/engine`-Suite: 187/187 Testdateien und 1.701/1.701
  Tests grün.
- `corepack pnpm --filter @netgrid/engine typecheck`: grün.
- `git diff --check`: grün.

## Restpunkte

Keine offenen Regel-, Engine-, UI- oder Safety-Restpunkte innerhalb dieses
Scopes. Fortgebundene Sondertexte bleiben weiterhin einzeln durch ihre
Card-Lifecycle- oder Run-Registry-Verträge begrenzt.

## Führende Artefakte

- Prozess:
  `docs/architecture/card-rules/global-run-rez-windows-process-2026-07-16.md`
- Implementierung:
  `packages/engine/src/game/run/run-rez-window.ts`
- Unit-Regression:
  `packages/engine/src/game/run/run-rez-window.test.ts`
- Hacker-Tracker-End-to-End-Regression:
  `packages/engine/src/index-tests/mechanics/trace-tags-resources.test.ts`
- Final Review: dieses Dokument
