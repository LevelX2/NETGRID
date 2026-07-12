# Final Review: KI-Entscheidungsverträge härten

Datum: 2026-07-12

## Ergebnis

Die fünf nachgeprüften Fehlerklassen sind an gemeinsamen fachlichen Verträgen
statt durch weitere isolierte Scorekorrekturen geschlossen. Negative und
positive Gegenbeispiele laufen durch den produktiven Chooser. Die vollständige
KI-Suite ist grün.

## Umgesetzte Verträge

1. **Corp-Placement:** ICE-abhängige Upgrades ohne ICE und Regionsersatz ohne
   sichtbaren Grenznutzen werden semantisch zurückgestellt. Aktiver
   unmittelbarer Nutzen lässt die Aktion weiterhin zu.
2. **Persistente Kartenentwicklung:** Direkte Installation, vorbereitete
   verzögerte Installation und deren Fortschreibung verwenden eine gemeinsame
   Projektion auf Zielkarte und Entwicklungsphase.
3. **Breaker-Varianten:** Ein zweiter Breaker desselben Primärtyps braucht eine
   deckstrategische Absicht, konkrete bessere Eigenschaften und darf keine noch
   offene primäre Abdeckung verdrängen.
4. **Folgeaktionsbudget:** Such- und Schutzpläne unterscheiden gleichzügige
   Konversion, Vorbereitung für den nächsten Zug und nicht erreichbare
   Folgeaktionen.
5. **Real-Engine-Gates:** Rasmin-Placement, Regionsersatz und
   Code-Gate-Abdeckung werden aus Engine-Zustand, PlayerView und LegalActions
   bis zur tatsächlichen Chooser-Auswahl geprüft.

## Gefundene Integrationsursachen

Das Real-Engine-Gate fand zwei Lücken, die synthetische Tests nicht erkannten:

- `regionReplacementWarning` wurde in `input-dto.ts` aus dem LegalAction-Payload
  entfernt. Der Chooser konnte den Regionsvertrag im echten Spiel deshalb
  nicht anwenden.
- Der allgemeine Upgrade-Placement-Score bewertete Regionsersatz zusätzlich zum
  neuen Ausschlussvertrag. Diese doppelte Zuständigkeit ist entfernt.

Der Runner-Gate-Aufbau wurde außerdem an die echte verpflichtende Corp-
Abwurfentscheidung angepasst. Der Test erzwingt keinen künstlichen
Runner-Zustand.

## Verifikation

- Fokussierter Real-Engine- und Runtime-Block: 103 Tests grün.
- Vollständige `@netgrid/ai`-Suite: 295 Testdateien, 1.939 Tests grün.
- `@netgrid/ai` Typecheck: grün.
- `check:ai-deck-doctrine-strategy`: grün.
- `check:proteus-ai-readiness`: grün, 154 Karten und 154 aktive Hints.
- `git diff --check`: grün.

## Restrisiko

Die Verträge verhindern die nachgeprüften strukturellen Fehlpfade. Ihre
strategischen Gewichtungen bleiben durch weitere echte Spiele und die
Behavior-Baseline zu beobachten; grüne Gates beweisen keine globale
Spieloptimalität.
