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
`reproduction_json.guidedExample` eine solche Stellung. Übernahm die schwere
Corp-KI nach den ersten 15 gespeicherten Aktionen, lagen auf Virus Test Site
drei Marker und Project Zurich war installiert. Die KI spielte den Expert,
verschob alle drei Marker und wertete Zurich für zwei Punkte. Ihr Replay
erreichte den gespeicherten Hash `fnv1a:1d13be8d`. Übernahm sie eine Aktion
früher, lag Zurich noch auf der Hand. Sie installierte Sleeper vor HQ, nahm
einen Credit und beendete den Zug (`fnv1a:6a4f901d`). In beiden Stellungen
führte sie `corp.fast_advance` als aktive Strategie (Quellstand `e2dcd5849`).
In den zehn frei gespielten Pilotpartien der Paarungen 843 und 844 hatte die
Corp den Expert jedes Mal auf der Hand und spielte ihn keinmal.
