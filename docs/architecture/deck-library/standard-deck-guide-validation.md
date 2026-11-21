# Standarddeck-Guide-Validierung

Stand: 2026-11-21

## Sprachvertrag

Das Manifest `standard-deck-guides-2.0.0.json` verwendet
`netgrid-standard-deck-guides-v2`. Jeder Guide enthält `contentByLocale` mit
verpflichtendem Englisch (`en`) und optionalen weiteren Sprachen. Fehlt der
englische Inhalt oder ist ein Sprachinhalt unvollständig, ist der Guide
`invalid`. Kartentitel und Karten-IDs müssen in allen Sprachvarianten identisch
sein. Die Oberfläche darf für eine fehlende Sprache ausschließlich auf den
fachlich festgelegten englischen Inhalt zurückfallen.

## Laufzeitvertrag

Beim Serverstart werden Standarddeck-Anleitungen ausschließlich gegen den
Deckquellhash und den Strategieprofil-Eingabehash geprüft. Die Laufzeit
berechnet dafür keine `buildDeckStrategyProfile`-Profile.

Der Eingabehash bindet den normierten Deckquellhash an
`DECK_STRATEGY_PROFILE_ANALYSIS_REVISION`. Fehlt er oder weicht er ab, bleibt
der Guide sichtbar, aber mit dem Status `stale`. Das ist absichtlich
fail-closed; ein alter Guide wird nicht stillschweigend als aktuell ausgegeben.

## Pflege-Gate

`corepack pnpm check:standard-deck-guides` berechnet die vollständigen
Strategieprofile und vergleicht weiterhin deren Ausgaben mit
`sourceAnalysisHash` sowie den hinterlegten Strategiezuordnungen. Dadurch
bleibt auch eine vergessene Revisionserhöhung im Gate sichtbar.

Bei einer semantischen Änderung von `buildDeckStrategyProfile` oder einer
verwendeten Strategiequelle wird
`DECK_STRATEGY_PROFILE_ANALYSIS_REVISION` erhöht. Nach redaktioneller Prüfung
aktualisiert:

```text
corepack pnpm check:standard-deck-guides -- --write-analysis --reviewed-at=YYYY-MM-DD
```

Die einmalige Migrationsoption `--write-analysis-input-hashes` schreibt nur
Eingabehashes für bereits gegen das vollständige Profil verifizierte Guides;
sie bestätigt keine veraltete Analyse nachträglich.

## Abgleich mit dem KI-Spiel

`guideStatus: available` bestätigt, dass die Anleitung zum Deckstand passt.
`analysis.reviewStatus: observe` kennzeichnet eine Spielidee, deren Umsetzung
weiter beobachtet wird. Im Match leitet `buildAiDecisionInput` aus dem eigenen
Deck-Snapshot das Strategieprofil ab. Der Planer bewertet mit diesem Profil,
dem sichtbaren Spielstand und den angebotenen Aktionen sein aktuelles Ziel.
Ob er eine Kartenkombination vorbereitet und ausführt, lässt sich an diesen
einzelnen Entscheidungen prüfen.

Für „Doppelte Buchführung“ 0.1.0 enthält Paarung 843 in
`reproduction_json.guidedExample` eine solche Stellung. Nach 14 gespeicherten
Aktionen liegen drei Marker auf Virus Test Site und Project Zurich ist in HQ.
Auf Stand `a7180a402` installiert die schwere Corp-KI Zurich in einen neuen
Remote, spielt den Expert, verschiebt alle drei Marker und wertet für zwei
Punkte. Übernimmt sie erst nach der Installation, erreicht sie mit derselben
Umbuchung ebenfalls den gespeicherten Replay-Hash `fnv1a:1d13be8d`. Vor der
Korrektur wählte sie beim früheren Einstieg Sleeper vor HQ und beendete den
Zug mit null Punkten (`fnv1a:6a4f901d`). In beiden Fällen war schnelles
Werten die aktive Strategie. Die freie Nutzung des Expert ist in den
Paarungen 843–844 und 850–851 ausgewiesen.
