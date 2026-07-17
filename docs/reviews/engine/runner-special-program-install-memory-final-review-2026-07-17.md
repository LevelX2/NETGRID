# Runner-Spezialinstallationen: MU-Final-Review

Datum: 2026-07-17  
Ergebnis: fachlich abgeschlossen

## Ergebnis

`Sneak Preview` und alle aktiven vergleichbaren Kartenpfade behandeln volle MU
jetzt wie die normale Programminstallation: Ein Programm bleibt auswählbar,
wenn genügend MU durch Trash installierter Programme erreichbar ist. Bei
tatsächlichem MU-Mangel öffnet die Engine eine Runner-private,
stateVersion-gebundene Trash-vor-Install-Choice und setzt danach exakt den
ursprünglichen Kartenablauf fort.

Die gemeinsame reine Komponente unter
`packages/engine/src/game/install/runner-program-install-memory.ts` berechnet
Defizit und Erreichbarkeit, baut die Choice und revalidiert deren Auswahl.
Search-, Nonsearch- und Access-Pfade besitzen nur ihre jeweils notwendige
deterministische Fortsetzung.

## Geprüfte Karten und Pfade

- `Sneak Preview`: Stack und Heap bleiben bei voller MU verfügbar; kostenloser
  Install, Stack-Shuffle und temporäre Rückgabe bleiben erhalten.
- `Self-Modifying Code` und `Airport Locker`: Der gemeinsame bezahlte
  Stack-Sucheffekt verwendet Erreichbarkeit nach Trash. Der Quelltrash von
  Self-Modifying Code wird vor dem Install berücksichtigt.
- `Mystery Box`: Der öffentliche Top-5-Ablauf bleibt erhalten. Die Quelle wird
  vor der Installation getrasht und ihre MU automatisch angerechnet.
- `Hijack`: Programmziele im Grip bleiben erreichbar; temporäre Credits werden
  erst in der fortgesetzten Installation abgerechnet. Hardware bleibt
  unverändert.
- `Test Spin`: Zielwahl, kostenloser Install, Shuffle, Runstart und Cleanup
  bleiben über die MU-Fortsetzung hinweg gebunden.
- `Theorem Proof`: Das Access-Replacement wird bei erreichbaren 2 MU auch bei
  voller MU angeboten. Der Zugriff endet erst nach ausreichendem Programmtrash
  und erfolgreichem Install.
- `Valu-Pak Software Bundle`: Bundle-Start und Folgeaktionen erkennen
  Trash-Erreichbarkeit. Bundle-Markierung, temporärer Installationscredit und
  Aktionsverbrauch überleben die normale Replacement-Choice.
- `The Shell Traders`, normale Grip-Installation und `Edgerunner Temps` wurden
  als bereits korrekte Referenzpfade geprüft und nicht funktional verändert.

## Invarianten und Regressionen

- Ziel, Zone, Unique, Credits, MU und Trash-Auswahl werden bei Auflösung erneut
  geprüft.
- MU-Choices sind Runner-privat; die Korp erhält keine Stack-, Heap- oder
  Grip-Kandidaten.
- Stale Choice-Aktionen werden abgewiesen.
- Quelltrash, Zahlung, Shuffle, Runstart und Access-Abschluss passieren nicht
  doppelt.
- Replay und StateHash stimmen in den neuen 4/4-MU-Szenarien überein.

## Verifikation

- Engine-Typecheck: grün.
- Web-Typecheck inklusive generierter Route-Typen: grün.
- Fokussierte Karten-/Komponententests: 113 Tests grün.
- Engine-Gesamtlauf ohne das nachweislich vorbestehende Größen-Gate:
  188 Testdateien, 1.728 Tests grün.
- `git diff --check`: grün.
- Der berührte Baustein `hidden-zone-nonsearch-runtime.ts` liegt mit 1.499
  Zeilen unter seinem Gate von 1.500.

Der vollständige Engine-Befehl bleibt ausschließlich wegen des bereits auf
`main` reproduzierbaren, von diesem Paket unberührten Gates rot:
`turn-runtime-resolvers.ts` hat 3.280 statt maximal 3.200 Zeilen. Dieser Befund
ist kein fachlicher oder durch diese Änderung verursachter Regressionsfehler.

## Restpunkte

Keine fachlichen Restpunkte für den MU-Installationsvertrag. Die allgemeine
Verkleinerung von `turn-runtime-resolvers.ts` bleibt eine separate
Architekturaufgabe und gehört nicht in diesen Kartenfix.
