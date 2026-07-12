# Matchserie 70BE: KI-Final-Review

Status: abgeschlossen und lokal nach `main` integriert

## Review-Ergebnis

Die sechs freigegebenen Befunde aus `series_70be007e45d843a0` sind auf
generische Engine-/AI-Verträge zurückgeführt. Es bleiben keine offenen
kritischen oder hohen Review-Findings im vereinbarten Scope.

## Geschlossene Ursachen

1. Der spezialisierte `Systematic Layoffs`-Resolver liefert dieselbe
   generische Score-Konversionssemantik wie der allgemeine
   CardImplementation-Pfad. Dadurch bleibt ein legaler Same-Turn-Scoreplan
   nach der Agenda-Installation ausführbar und bricht andernfalls fail-closed
   ab.
2. Hosted-Credit- und Event-Run-Bedeutungen passieren die positive,
   side-sichere AI-Payload-Allowlist. Broker-Aufbau und -Auszahlung sind damit
   für generische Bank-Consumer erkennbar.
3. Projizierte Draw-Tax-Tags werden als Folgekosten bewertet; normale
   Creditkosten bleiben im bestehenden Kostenkomponentenpfad.
4. Alle projizierten Run-Aktionen werden gegen Credits nach ihren
   Aktionskosten bewertet. Ein unfinanzierbarer Event-Run kann weder durch
   einen Run- noch durch einen Handentwicklungsplan erzwungen werden.
5. Ein Ein-Karten-Handpuffer kann einen tatsächlich gemappten spekulativen
   Run überstimmen. Positive Broker-/No-Run-Entwicklungsverträge und sichtbare
   unmittelbare Agenda-/Score-Threat-Payoffs bleiben Ausnahmen.
6. Ein neues Real-Engine-Gate erzeugt LegalActions über die Engine, führt sie
   durch `buildAiDecisionInput` und wendet die relevante Score-Sequenz über
   `applyAction` an.

## Sicherheits- und Architekturreview

- Keine neue Aktion wird von der KI erzeugt; ausgewählt werden ausschließlich
  Engine-LegalActions.
- Die neuen AI-Input-Felder sind primitive Positive-Allowlist-Signale. Es
  werden keine CardInstances, privaten Payloads oder gegnerischen Hidden-Zones
  transportiert.
- Event-Run- und Handpufferentscheidungen verwenden nur aktuelle Credits,
  sichtbare ICE-/Serverdaten, eigene Handgröße und bereits vorhandene
  side-sichere Payoff-Evidence.
- Es gibt keine Kartenname-Sonderentscheidung in der produktiven Auswahl;
  Kartennamen erscheinen nur in Regressionen und Fixture-Aufbau.
- Replay-, StateHash- und `applyAction`-Autorität bleiben unverändert.

## Breite Review-Schleife

Die erste vollständige AI-Suite fand zwei widersprechende Alt-Fixtures. Die
Nachprüfung zeigte, dass der Handpuffer zu früh zum globalen Override erhoben
worden war. Die Endfassung aktiviert ihn erst beim Vergleich mit einem
gemappten spekulativen Run. Ein positiver Broker-Aufbau bleibt dadurch vor
Draw; ein reiner Central-Pressure-Test besitzt nun eine normale Dreikartenhand,
weil Handnot dort nicht Prüfgegenstand ist.

## Verifikation

- fokussierte Real-Engine-/Runtime-Gruppe: 104 Tests grün;
- Review-Gegenbeispiele und Match-Gate: 130 Tests grün;
- vollständige AI-Shards: 297 Dateien, 1.955 Tests grün;
- vollständige Engine-Suite: grün;
- `@netgrid/engine`- und `@netgrid/ai`-Typecheck: grün;
- `check:ai` und Deck-Doctrine: grün;
- `git diff --check`: grün.

## Restgrenzen

- Die Korrekturen behaupten keine optimale Gesamtstrategie für beliebige
  Decks oder Seeds; sie schließen die konkret belegten generischen
  Entscheidungsverträge.
- Lokale historische Matches werden nicht migriert oder umgeschrieben.
- Kein Push und kein Pull Request sind Teil dieses Abschlusses.
