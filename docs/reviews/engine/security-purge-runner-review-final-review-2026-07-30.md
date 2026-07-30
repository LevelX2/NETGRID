# Security Purge: Runner-Anzeige und öffentliche Auflösung

Stand: 30. Juli 2026
Status: umgesetzt und verifiziert

## Fund

Beim Scoren von `Security Purge` veröffentlichte die Engine die Definitionen
der obersten R&D-Karten zwar im Ereignis, eröffnete aber unmittelbar die
private Zielserverwahl der Korp. Gegen eine Korp-KI konnte diese Wahl
abgeschlossen sein, bevor der Runner einen Zwischenstand erhielt. Die
clientseitig aus dem Ereignis abgeleitete Anzeige war deshalb nicht
verbindlich und konnte vollständig übersprungen werden.

Dadurch blieb für den Runner praktisch unsichtbar,

- welche bis zu drei R&D-Karten gezeigt wurden,
- welche davon ICE waren,
- vor welchen Servern die ICE installiert und gerezzt wurden,
- und welche übrigen Karten offen getrasht wurden.

## Verbindlicher Soll-Ablauf

Der aktive Kartentext lautet:

> Show the top three cards of R&D to Runner when you score Security Purge. If
> any of those cards are ice, install and rez them, at no cost. Trash the rest
> of those cards.

Daraus folgt für NETGRID:

1. Beim Scoren werden die obersten bis zu drei R&D-Karten bestimmt und
   öffentlich als durch den Karteneffekt gezeigte Karten markiert.
2. Die Rules Engine eröffnet eine blockierende Runner-Choice. Nur der Runner
   sieht die vollständigen Karten in seiner PlayerView und kann die Anzeige
   mit `Ansehen beenden` bestätigen.
3. Vor dieser Bestätigung wird keine Karte aus R&D bewegt und die Korp erhält
   keine Zielserverwahl.
4. Nach der Bestätigung wählt die Korp für jedes gezeigte ICE genau einen
   gültigen Server. Jedes ICE wird dort offen installiert und ohne Kosten
   gerezzt.
5. Alle gezeigten Nicht-ICE werden offen in die Archives getrasht. Enthält die
   Auswahl kein ICE, geschieht dieser Schritt unmittelbar nach der
   Runner-Bestätigung.
6. Reveal, Runner-Bestätigung und abschließende Install-/Rez-/Trash-Auflösung
   sind getrennte öffentliche Ereignisse. Die Chronik nennt die gezeigten
   Karten, jedes installierte ICE mit Zielserver und alle getrashten Karten.

## Umsetzung

- `agenda-purge-install-target-sequence.ts` besitzt jetzt eine eigene
  Runner-Review-Stufe vor der Korp-Zielwahl.
- Die Review-Choice wird über LegalAction und `applyAction` auf Seite,
  Choice-ID und StateVersion revalidiert.
- Die Runner-PlayerView projiziert nur die drei regelgerecht aufgedeckten
  R&D-Karten; die private Korp-Zielwahl bleibt dem Runner verborgen.
- Der Webclient verwendet für die Review den verbindlichen Karten-Choice-Dialog
  mit `Ansehen beenden`. Der bestehende Security-Purge-Zielwahldialog bleibt
  die nachgelagerte Korp-Fläche.
- Die öffentlichen Payloadfelder
  `agendaPurgeRunnerReviewOpened` und
  `agendaPurgeRunnerReviewResolved` trennen Reveal, Bestätigung und Auflösung
  für Chronik und Replay.

## Verifikation

- fokussierter Verbund: 6 Testdateien, 399 Tests grün;
- vollständige Engine-Suite: 210 Testdateien, 1.825 Tests grün;
- vollständige Web-Suite: 72 Testdateien, 727 Tests grün;
- vollständige Server-Suite: 23 Testdateien, 214 Tests grün;
- Typecheck `@netgrid/engine`: grün;
- Typecheck `@netgrid/web`: grün;
- Typecheck `@netgrid/server`: grün;
- `git diff --check`: grün.

Abgedeckt sind insbesondere Runner-/Korp-Sichtbarkeit, Wrong-Side- und
Stale-State-Ablehnung, Pflichtbestätigung, Zielwahl pro ICE, offenes Trashen
ohne ICE, kostenlose Rez-Auflösung, Chronik sowie deterministisches
Replay/StateHash.
