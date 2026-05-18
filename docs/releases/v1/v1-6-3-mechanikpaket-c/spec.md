# Mechanikpaket C 1.6.3 Spezifikation

Stand: 2026-05-09  
Status: eingefroren

## Scope

V1.6.3 implementiert einen freigabefähigen Kern mit 5 Karten und drei Blöcken:

1. uninstall/destroy über ICE-Subroutinen (`trash program`)
2. generische Upgrade-Servermodifier
3. Region-Installlifecycle plus erfolgloser-Run-Credittrigger

## Nicht-Scope

- Kein Subtypen-/Hosting-/Recurring-/Unique-Scope aus V1.7.0.
- Kein Access-/HiddenZone-/Trace-/Tag-Breitenscope aus V1.7.1/V1.7.2.
- Keine zusätzliche AI-Support-Freigabe.

## Kartenvertrag V1.6.3

- `onr_v1_233_d-arc-knight`
  - ICE-Subroutine: trashes deterministisch ein installiertes Runner-Programm; danach End-the-run
- `onr_v1_267_sentinels-prime`
  - ICE-Subroutine: trashes deterministisch ein installiertes Runner-Programm; danach End-the-run
- `onr_v1_273_triggerman`
  - ICE-Subroutine: trashes deterministisch ein installiertes Runner-Programm; danach End-the-run
- `onr_v1_350_antiquated-interface-routines`
  - solange gerezzt: ICE im selben Fort erhalten +1 Stärke
- `onr_v1_371_tokyo-chiba-infighting`
  - Region-Lifecycle beim Install (rez on install, nur eine Region je Fort)
  - nach jedem erfolglosen Run auf diesem Fort: Corp erhält 1 Credit

## Engine-Vertrag

- `trash_installed_program` ist ein deterministischer Encounter-Resolver ohne Hidden-Info-Leak.
- Uninstall-Zielauswahl: höchste Installkosten, dann höchste MU-Kosten, dann stabile ID-Reihenfolge.
- Servergebundene Upgrade-Modifier werden über installierte/rezzte Root-Karten und Server-ID ermittelt.
- Region-Install: Install-Action trägt die erforderlichen Rez-Kosten; Karte wird sofort faceup/rezzed platziert; ältere Regionen am Fort werden nach Archives getrasht.
- Erfolgloser-Run-Bonus läuft im zentralen Run-Finish-Pfad deterministisch.

## ChoiceFlow-Hinweis

`L2_ChoiceFlow_Gegnerentscheidung_und_Guessing` bleibt in V1.6.3 als dokumentiert deferred, da der freigabefähige Kernkorb keine belastbar gemappten ChoiceFlow-Karten enthält.
