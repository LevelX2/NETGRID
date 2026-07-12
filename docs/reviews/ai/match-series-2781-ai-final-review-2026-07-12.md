# Matchserie 2781: KI-Final-Review

## Ergebnis

Die sechs freigegebenen Ursachen aus `series_2781b26755923764` sind an ihren
gemeinsamen fachlichen Bewertungsquellen behoben. Es wurden keine Kartenname-
Sonderregeln, Hidden-Info-Abkuerzungen oder nachtraeglichen Anzeige-Score-
Korrekturen eingefuehrt.

## Geschlossene Ursachen

1. Strukturierte effektive ICE-Subtypen sind gegenueber Woertern aus
   alternativen Regeltexten autoritativ. Credit Blocks gilt im gewaehlten
   Sentry-Zustand nicht mehr als durch einen reinen Wall-Breaker abgedeckt.
2. ICE-abhaengige Upgrades werden ohne schutzgebendes ICE deutlich abgewertet;
   mit bestehendem Schutz bleibt die Gegenprobe attraktiv.
3. Das Ersetzen einer nicht stapelbaren Region traegt einen separaten
   Ersatzkostenfaktor. Er ist nicht im allgemeinen Placement-Score versteckt.
4. Der Schutzsuchplan reserviert bei letzter Aktion ein bezahlbares gefundenes
   ICE zur Installation, statt blind erneut zu ziehen.
5. Broker bewertet den Zustand nach Installation. Verbleibende Credits,
   Aktionen, moegliche Ladung und ein reserviertes hochwertiges Runfenster
   bestimmen, ob sofort aufgebaut oder bewusst verschoben wird.
6. Persistente Installationsbewertung folgt der Zielkarteninstanz ueber direkte
   Installation, Programmverdrängung und Shell Traders. Bereits vorhandene
   funktionale Breaker-Abdeckung wird konsistent erkannt; echte
   Breaker-Support-Faehigkeiten bleiben davon getrennt.

## Verifikation

- fokussierte Pakettests waehrend der Umsetzung: unter anderem 30, 189, 187
  und abschliessend 99 grüne Tests;
- vollstaendige `@netgrid/ai`-Suite: 292 Testdateien, 1.923 Tests, alle gruen;
- `corepack pnpm --filter @netgrid/ai typecheck`: gruen;
- `git diff --check`: gruen.

## Restrisiko

Die Tests belegen die Ursachen und angrenzenden Gegenbeispiele, ersetzen aber
keine neue Matchserie. Insbesondere die langfristige Broker-Konversion und die
relative Auswahl mehrerer wirtschaftlich unterschiedlicher Breaker sollten in
den naechsten Playtests und der Behavior Baseline beobachtet werden.
