# Deck Strategy Completeness – Final Review 2026-07-18

Status: abgeschlossen und zur lokalen Integration freigegeben

## Ergebnis

Die aus Decklisten abgeleitete Strategie ist für den vollständigen aktuellen Bestand geprüft und technisch geschlossen. Das neue Gate umfasst alle 40 aktiven Standarddecks, alle 21 versionierten Deck-Snapshots und sämtliche 24 Strategy-IDs der Taxonomie. Jede Strategy-ID besitzt eine klassifizierte Runtime-Familie sowie einen absichtlich bestimmten Target-/Reserve-Vertrag; unbekannte Runtime-Fallbacks werden im Gate abgelehnt.

39 der 40 aktiven Standarddecks liefern mindestens eine produktive Primärstrategie. `Ghost Circuit` bleibt als einziger Fall bewusst neutral, weil zwei reale Breaker-Coverage-Lücken vorliegen. Konditionale First-/Chosen-ICE-Bypass-Pfade können genau eine fehlende Coverage-Klasse überbrücken, erfinden aber keinen Breaker und machen Ghost Circuit daher nicht künstlich produktiv.

## Geschlossene Befunde

- Runtime-Kosten werden aus dem tatsächlichen `numeric`-Vertrag gelesen. Alle verwendeten Supportdimensionen sind explizit implementiert; unbekannte Dimensionen brechen fail-closed ab.
- Mehrfachmetadaten derselben Karte und zusätzliche Kopien besitzen abnehmenden Grenznutzen. Evidenzvielfalt wird vor alphabetischer Ordnung gewertet; exakte Gleichstände am Primary-Cutoff bleiben erhalten.
- Alle vier jüngeren Corp-Linien (`corp.action_tempo`, `corp.overadvance_value`, `corp.draw_engine`, `corp.deck_recycle_engine`) besitzen vollständige Consumerpfade über Intent, Rollen, Target/Reserve, TacticalGoals, Action-Fit und relevante Discard-/Remote-Signale.
- Verbleibende öffentliche Profilmetadaten sind über `DECK_STRATEGY_METADATA_CONSUMER_CONTRACT` als produktiv/diagnostisch oder rein diagnostisch klassifiziert. Inspector-Warnungen enthalten Kartenprovenienz.
- Ein breiter Regressionslauf zeigte, dass ein exakt gemappter Tempo-Run eine bereits begonnene und höher bewertete Broker-Bankaufladung blockieren konnte. Die Planarbitration lässt den Run jetzt nur dann zugunsten des Bankaufbaus weichen, wenn sowohl der explizite Build-Commitment-Score als auch der explizite Low-Value-Run-Gegenbeleg vorliegen. Der reale 70BE-Fall schützt diesen Konsumentenpfad.
- Das historische AI006-Prüfskript verwendet wieder eine reale aktuelle Legacy-only-Fixture. Zwei veraltete Web-Katalogerwartungen wurden an den aktuellen, bereits kompilierten Hintvertrag angepasst.

## Verifikation

- Deckstrategie-Vollbestands-Gate: 40 aktive Standarddecks, 21 Snapshots, 24 Strategy-IDs, 4/4 Tests grün.
- `@netgrid/ai` Typecheck: grün.
- `@netgrid/web` Typecheck: grün.
- `@netgrid/web` Volltest: 51 Dateien, 635 Tests grün.
- `@netgrid/ai` Shard 1: 132 Dateien, 947 Tests grün.
- `@netgrid/ai` Shard 2: 131 Dateien, 1.011 Tests grün.
- `@netgrid/ai` Shard 3: 131 Dateien, 846 Tests grün.
- AI-Gesamtbestand nach Integration des aktuellen `main`: 394 Dateien, 2.804 Tests grün.
- `check:ai-deck-doctrine-strategy`: grün.
- `git diff --check`: grün.

## Abgrenzung und Reststand

Rules Engine, Kartenregeln, `LegalActions`, PlayerViews und Hidden-Info-Verträge wurden nicht erweitert oder abgeschwächt. In diesem Prüfbereich verbleibt kein konkreter Maßnahmenpunkt. Künftige Auffälligkeiten zur allgemeinen Spielstärke oder zur Qualität einzelner Entscheidungen sind getrennte Playtest-/Matchanalyse-Themen und kein offener Consumer- oder Vollständigkeitsfehler dieses Deckstrategievertrags.

Führende Detailartefakte sind der [Deck-Strategy-Completeness-Prozess](../../architecture/ai/deck-strategy-completeness-process-2026-07-18.md) und der [Metadaten-Consumer-Audit](deck-strategy-metadata-consumer-audit-2026-07-18.md).
