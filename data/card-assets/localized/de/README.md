# Deutsche display-only Karten-Skins

Dieses Verzeichnis enthält die lokale deutsche Kartenbild-Schicht für selbst gerenderte Anzeigeersatzkarten. Ziel dieses Stands ist, alle 33 Agenda-/Projektkarten aus `data/cards/originalset-v1-cards.json` als deutsche Projektkarten-Drafts verfügbar zu machen.

Diese Artefakte sind reine Anzeige- und Asset-Daten. Engine, LegalActions, Replay, StateHash, KI und Decklegalität bleiben ausschließlich an die stabilen Original-`cardId`s, Originalkartendaten und Engine-Verträge gebunden.

## Trennung der Ebenen

- Originalkarte: `data/cards/originalset-v1-cards.json` bleibt Quelle für `cardId`, Originaltitel, Subtypen, Entwicklungskosten, Projektpunkte und Originaltext.
- Deutsche Anzeige: `cards.de.json` enthält deutsche Titel, deutsche Projekttypzeilen, deutschen Draft-Regeltext, Symbolsegmente, Originalreferenzen und Renderpfade.
- Grundbild: `art/` enthält separate Illustrationen ohne Frame, Regeltext, Zahlen, Logos oder sichtbaren Bildtext.
- Frame: `frames/project-frame-v1.*` bleibt ein wiederverwendbarer deutscher Projekt-Frame mit Layoutkoordinaten.
- Gerenderte Karte: `rendered/svg/`, `rendered/full/`, `rendered/preview/` und `rendered/thumb/` enthalten vorgerenderte Kartenfronten, in denen Grundbild und Frame bereits kombiniert sind.

## Fallback-Prinzip

Die internen `cardId`s bleiben unverändert und verweisen weiter auf die Originalkarten. Eine spätere Anzeigeauswahl darf eine deutsche Skin-Karte bevorzugen, wenn für die `cardId` ein deutscher Eintrag vorhanden ist. Fehlt der deutsche Skin-Eintrag oder ein gerendertes Asset, muss die Anzeige auf die Originalkarte zurückfallen. Aus der deutschen Skin darf keine Spielbarkeit, Decklegalität, KI-Fähigkeit oder Regelentscheidung abgeleitet werden.

## Projekttyp-Zeile

Die Projekteinordnung steht im Regeltextkasten oben und ist in `cards.de.json` strukturiert hinterlegt:

- `gray-ops`: `Projekt - Graue Operation`
- `black-ops`: `Projekt - Schwarze Operation`
- `research`: `Projekt - Forschung`
- `asset`: `Projekt - Anlage`
- mehrere Klassen: `Projekt - Schwarze Operation / Forschung`
- ohne Untergruppe: `Projekt`

Die Daten führen dafür `sourceProjectClass`, `sourceProjectClasses` und `localizedProjectClass`.

## Übersetzungs- und Symbolregeln

- Titel werden deutsch, eindeutig und stimmungsvoll übersetzt.
- Der eigentliche Projekttext wird als deutscher Draft wiedergegeben; die Standardformel "Wenn du dieses Projekt abschließt ..." wird nicht verwendet.
- Normale Agenda-Auslöser wie "When scored" werden entfernt, sofern sie nur die übliche Agenda-Auslösung beschreiben.
- `Runner` und `Run` bleiben erhalten.
- `Trace` wird `Ortung`, `Tag` wird `Markierung`.
- `Credits` und `Bits` werden als `Gridmark` übersetzt; feste Beträge werden nach Möglichkeit als eigenes Gridmark-Symbol gerendert.
- `HQ` wird möglichst als `Hauptquartier` übersetzt, `Data Fort` als `Datenfestung`.
- Action-Kosten werden nicht als `[A]` oder `A:` gerendert, sondern als eigenes rechtsweisendes Aktionssymbol. Mehrere Action-Kosten werden als mehrere Symbole dargestellt.
- Lange Texte werden für die Karte verdichtet, ohne den Regelkern absichtlich zu verändern. Die Originalfunktion bleibt trotzdem die lokale Originalkarte.

## Asset-Struktur und Renderprozess

1. `node scripts/generate-localized-agenda-skin-data.mjs`
   - liest alle Agenda-Karten aus `data/cards/originalset-v1-cards.json`,
   - schreibt `cards.de.json`,
   - erzeugt fehlende eigene Grundbilder unter `art/`,
   - ersetzt vorhandene Grundbilder nicht automatisch.
2. `node scripts/render-localized-card-assets.mjs`
   - rendert alle Einträge aus `cards.de.json`,
   - unterstützt Aktions- und Gridmark-Symbole,
   - rendert Typzeile, Titel, Projektpunkte und Entwicklungskosten,
   - schreibt SVG sowie PNGs in `full`, `preview` und `thumb`,
   - erzeugt `rendered/agenda-preview-contact-sheet.png` zur schnellen Sichtprüfung.

`rendered/full/` bleibt exakt `1488x2079`. `preview` und `thumb` werden aus demselben SVG vorgerendert.

## Warnung

Diese Schicht ist keine Engine-Regelautorität. Sie darf keine LegalActions, PlayerActions, Resolver, Replay-Daten, StateHashes, KI-Inputs, Decklegalität, Hidden-Info-Sichtbarkeit oder Spielzustände beeinflussen.

Es werden keine offiziellen Artworks, offiziellen Card Frames, Logos, Card Backs oder externen Kartendatenbankbilder verwendet. Die Grundbilder sind lokale Draft-Assets beziehungsweise strukturierte Prompts für spätere Bildgenerierung.
