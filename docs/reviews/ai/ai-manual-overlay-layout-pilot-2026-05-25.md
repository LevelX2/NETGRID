# AI Manual Overlay Layout Pilot

Datum: 2026-05-25

## Kurzfazit

Der Pilot legt ein modulares, read-only Manual-Overlay-Layout an, ohne den aktiven Hintpfad zu ersetzen. `data/ai/ai-card-hints-active.json` bleibt die Runtime-Quelle; die neuen Overlay-Dateien werden nur durch `corepack pnpm check:ai-manual-overlays` gelesen und gegen aktive Hints sowie den Derived-Basic-Facts-Report verglichen.

Der Pilot deckt die sechs fachlich offenen Derived-Basic-Facts-Karten ab:

- `Japanese Water Torture`
- `Self-Modifying Code`
- `Mystery Box`
- `Deep Thought`
- `Crystal Palace Station Grid`
- `Red Herrings`

Gate-Befund:

- Overlay-Dateien: 2
- Overlay-Karten: 6
- Harte Errors: 0
- Warnings: 8

## Warum ein Overlay-Layout nötig ist

Der Derived-Basic-Facts-Pfad kann mechanische Facts aus CardImplementations ableiten. Diese Facts sollen langfristig nicht nochmal manuell in Hintdaten dupliziert werden. Manuelle AI-Hints sollten stattdessen strategische und reviewbezogene Informationen halten:

- `lineSupport`
- `quality`
- `confidence`
- `needsHumanReview`
- strategische Notizen
- erklärte Descriptor-Gaps, falls sie noch offen sind

Das Overlay-Layout trennt diese Ebene sichtbar von mechanischen Facts wie `effects`, `conditions`, `breakerProfile`, `remoteRole` oder `targetProfiles`.

## Gewähltes Pilotsegment

Gewählt wurde die kleine Hybrid-Variante mit zwei Segmenten:

- `data/ai/hints/overlays/onr-v1/runner/programs.json`
- `data/ai/hints/overlays/onr-v1/corp/upgrades.json`

Damit bleiben die Overlays nach Set, Side und CardType strukturiert, decken aber beide fachlich offenen Gruppen ab. Die Alternative "pro Karte neben Implementation" wurde zurückgestellt, weil sie AI-Wissen in Engine-Nähe streuen würde. Eine reine Set-Datei wäre für spätere Pflege zu grob. Langfristig bleibt die empfohlene Struktur:

1. Generated Basic Facts aus Implementations.
2. Modulare Manual Overlays nach Set/Side/CardType.
3. Ein compiled Vergleichsindex als Vorstufe zum aktiven Monolithen.
4. `ai-card-hints-active.json` bis zu einem separaten Migrationsentscheid als aktive Runtime-Datei.

## Karten im Overlay

Runner-Programme:

- `Deep Thought`: strategische R&D-/Interface-Pressure-Bewertung; Topdeck-Info bleibt mechanisch.
- `Japanese Water Torture`: erklärende Manual Note; Breaker-Coverage und `forgo_actions` bleiben mechanisch.
- `Mystery Box`: erklärende Manual Note; Search-/Install-Target und `oncePerRun` bleiben mechanisch.
- `Self-Modifying Code`: Install-Target-Profil bleibt mechanisch; mögliche Monolith-Bereinigung bleibt getrennt.

Corp-Upgrades:

- `Crystal Palace Station Grid`: Remote-Protection ist strategisch/kontextabhängig; Run-Tax bleibt mechanisch. Die Crystal-Palace-Denylist bleibt geschützt.
- `Red Herrings`: Remote-Protection ist strategisch/kontextabhängig; Agenda-Steal-Tax und Access-Condition bleiben mechanisch.

## Was bewusst nicht ins Overlay kommt

Nicht im Manual Overlay modelliert:

- `effects`
- `conditions`
- `breakerProfile`
- `remoteRole`
- `targetProfiles`
- `roles`
- `planRoles`
- `requiredMechanics`
- `aiSupportStatus`
- LegalActions, PlayerActions, Planner- oder Runtime-Felder
- Hidden-Info-Felder

Diese Trennung verhindert, dass mechanische Kartentext-/Implementation-Facts erneut manuell gepflegt werden.

## Script und Gate

Neues Script:

```text
scripts/check-ai-manual-overlays.mjs
```

Neues Root-Script:

```text
corepack pnpm check:ai-manual-overlays
```

Der Check:

- liest alle JSON-Dateien unter `data/ai/hints/overlays/`,
- validiert `schemaVersion`, `status` und Segment-Scope,
- prüft CardIds gegen `data/ai/ai-card-hints-active.json`,
- vergleicht Side/CardType mit dem aktiven Monolithen,
- validiert bekannte `lineSupport`- und `quality.confidence`-Werte über eine fokussierte JS-Spiegelung der Known-Lists,
- blockt Hidden-Info-Felder, `aiSupportStatus` und Runtime-/Legalitätsfelder,
- warnt bei mechanischer Fact-Duplikation,
- schützt Crystal Palace gegen bekannte Economy-/Counter-Fehlrollen,
- erzeugt den deterministischen Report `docs/reviews/ai/ai-manual-overlay-pilot-report-2026-05-25.json`.

`hint-ontology.ts` wurde nicht direkt aus dem MJS-Script geladen, weil dafür eine fragile TS-Loader-Brücke nötig wäre. Der Pilot nutzt nur eine kleine Known-List-Spiegelung für die Overlay-Felder; die aktive Ontology-Validation bleibt in den AI-Tests.

## Hard Errors und Warnings

Aktueller Gate-Report:

- Harte Errors: 0
- Warnings: 8

Die acht Warnings stammen aus Aufgabe 017: mehrere Runner-Info-/Access-Kontext-Karten haben Generated Facts ohne eigenes Manual Overlay. Der Batch-6-Closeout klassifiziert diese Kontexte read-only und lässt keine offenen Descriptor-Follow-ups zurück. Die bestehenden Overlay-Dateien bleiben frei von Runtime-, Hidden-Info- und mechanischen Duplikationsfeldern.

Harte Error-Klassen:

- Overlay-CardId fehlt im aktiven Hintindex.
- Segment-Side oder CardType widerspricht aktivem Hint.
- Hidden-Info-Feld im Overlay.
- unbekannte Overlay-Ontology-Werte.
- Overlay versucht `aiSupportStatus` zu setzen.
- Overlay enthält Runtime-/Legalitätsfelder.
- Overlay widerspricht der Crystal-Palace-Denylist.

Warning-Klassen:

- mechanische Fact-Duplikation im Overlay.
- Overlay ohne strategisches oder qualitybezogenes Feld.
- `needsHumanReview = true`.
- Descriptor-Gap ohne rationale Notiz.
- aktive `lineSupport`-/`quality`-Werte weichen vom Overlay ab.
- Karte fehlt im Pilot, obwohl sie im gewählten Segment als Manual-Overlay-Bedarf markiert ist.

## Bewusst nicht geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Engine-, Regel-, Strategy-, Planner-, Runtime- oder Consumer-Anbindung.
- Keine Profilumschaltung.
- Keine neuen Decks.
- Keine Migration weiterer Karten.

## Nächster Schritt

Der nächste praktische Schritt ist ein read-only Compiler-Prototyp, der Generated Basic Facts und Manual Overlay zu einem Vergleichsindex zusammenführt. Dieser Index sollte weiter nur gegen `ai-card-hints-active.json` diffen und die Runtime-Datei nicht ersetzen.
