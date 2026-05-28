---
activityId: act-2026-05-28-damage-impact-overlay
status: inbox
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-28
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Damage Impact Overlay für Runner-Grip als Lebenspool

## Ziel

Net Damage, Meat Damage und Core Damage sollen in der Web UI deutlich stärker und verständlicher präsentiert werden. Wenn der Runner Schaden nimmt, soll nicht nur ein normaler kleiner Cue erscheinen, sondern ein klares temporäres Damage-Fenster, das den Runner-Grip als aktuellen Überlebenspool visualisiert: Anzahl vor dem Damage, Damage-Menge, Anzahl danach und Flatline-Risiko beziehungsweise Flatline-Ergebnis.

## Kontext und Quellen

- Nutzerfund vom 2026-05-28: Damage wird visuell nicht stark genug hervorgehoben. Beim Runner ist der Grip faktisch der Pool, aus dem Damage zufällig Karten entfernt; das soll für den Spieler sofort sichtbar werden.
- Vorschlag aus Chat-Abstimmung: zentriertes, halbtransparentes Damage-Impact-Fenster mit Balken/Segmenten statt Handkartenbildern, klarer Damage-Menge und sichtbarem Heruntergehen des Pools.
- Regel-/Visibility-Basis:
  - `docs/releases/mvp/mvp-0-94-damage-flatline/damage-flatline-spec.md`
  - `docs/releases/v1/v1-1-1-discard-handlimit-core-damage/spec.md`
  - `docs/releases/v1/v1-1-1-discard-handlimit-core-damage/final-review.md`
- Relevante UI-Pfade:
  - `apps/web/app/action-cues.ts`
  - `apps/web/app/page.tsx`
  - `apps/web/app/globals.css`
  - bestehende Cue-/Audio-/Highlight-Tests in `apps/web/app/action-cues.test.ts` und angrenzenden Webtests.

## Scope

- Für öffentliche Damage-Resolved-Events eine eigene Damage-Impact-Präsentation ableiten.
- Damage-Typen mindestens abdecken:
  - Net Damage
  - Meat Damage
  - Core Damage, inklusive Hinweis auf dauerhaft reduziertes Runner-Handlimit, wenn der Payload das side-sicher hergibt
- Ein zentriertes Overlay oder Dialog-artiges Fenster ergänzen, das kurz sichtbar bleibt und manuell weggeklickt werden kann.
- Der Runner-Grip wird als abstrakter Balken oder Segmentleiste dargestellt, nicht als Kartenbilder:
  - Beispiel: `Grip 4 -> 2`
  - Damage-Menge als Impact-Marker: `-2`
  - nach Möglichkeit animiert: Segmente fallen aus, blinken oder werden als getroffen markiert.
- Bei Flatline eine deutlich härtere Variante anzeigen:
  - Titel sinngemäß `Flatline`
  - Text sinngemäß `Runner hatte nicht genug Grip für 4 Meat Damage.`
  - keine zusätzlichen Handkarten- oder Zufallsdetails.
- Falls der Damage von einer öffentlich bekannten Karte oder einem öffentlichen Effekt kommt, darf die Quelle genannt werden. Bei verdeckter oder redigierter Quelle nur generisch formulieren, z. B. `Korp-Effekt`.
- Das bestehende normale Action-Cue-System darf weiter existieren; das Damage-Overlay soll Damage-Ereignisse aber visuell priorisieren.

## Nicht im Scope

- Keine Änderung an Engine-Regellogik, Damage-Randomness, Flatline-Regeln, Core-Damage-Zählung oder Handlimit-Berechnung.
- Keine Damage Prevention, Avoid, Interrupts oder Replacement Effects einführen.
- Keine offiziellen Artworks, externen Card Frames, Card Backs oder fremden Bilddatenbank-Abhängigkeiten verwenden.
- Keine Anzeige konkreter getroffener Grip-Karten im Overlay. Eigene getroffene Karten sind nur über die bestehenden Heap-/Chronik-/Zonenpfade sichtbar, soweit diese side-sicher bereits vorgesehen sind.
- Keine neue allgemeine Redesign-Arbeit an Action Cues, Chronik, Boardlayout oder Match-End-Fenster.
- Keine Erweiterung öffentlicher Payloads um private Kartenlisten, Handlisten, DefinitionIds verdeckter Karten oder sonstige Hidden-Info-Daten.

## Akzeptanzkriterien

- [ ] Bei Net Damage erscheint ein auffälliges Damage-Impact-Overlay mit Damage-Typ, Damage-Menge und abstraktem Runner-Grip-Pool vor/nach dem Damage.
- [ ] Bei Meat Damage erscheint dasselbe Muster mit visuell unterscheidbarer Meat-Damage-Gestaltung.
- [ ] Bei Core Damage erscheint dasselbe Muster plus side-sicherer Hinweis auf Core Damage beziehungsweise reduziertes Runner-Handlimit, sofern im PlayerView/PublicPayload vorhanden.
- [ ] Bei Flatline durch Damage erscheint eine klare Flatline-Variante statt nur eines kleinen Statushinweises.
- [ ] Das Overlay zeigt keine konkreten Grip-Karten, keine versteckten DefinitionIds, keine vor-Damage-Grip-Liste und keine nicht öffentlichen Kartentitel.
- [ ] Korp-Sicht und Runner-Sicht bleiben side-sicher: Die Korp sieht nur Counts und öffentliche Quelle; der Runner erhält keine zusätzlichen Informationen außerhalb seiner ohnehin sichtbaren Zone-/Heap-Sicht.
- [ ] Reconnect und EventTail erzeugen keine mehrfach störenden alten Damage-Overlays; es soll nur für neue beziehungsweise noch nicht präsentierte Events erscheinen.
- [ ] Das Overlay ist auf Desktop und Mobile lesbar, verdeckt nicht dauerhaft die Spielfläche und kann geschlossen werden.
- [ ] Bestehende Action-Cue-Auto-Dismiss-/Audio-/KI-Pacing-Pfade hängen nicht durch das neue Overlay.
- [ ] Webtests oder fokussierte Unit-Tests decken Cue-/Overlay-Ableitung, Hidden-Info-Redaction und mindestens einen Flatline-Fall ab.

## Umsetzungshinweise

- Zuerst prüfen, welche Damage-Daten bereits in `PublicGameEvent.publicPayload` und `formatChronicleEvent` vorhanden sind. Wenn `damageType`, `damageAmount`, `cardsTrashed`, `flatline`, `coreDamageAfter` oder `runnerMaxHandSizeAfter` bereits vorhanden sind, diese nutzen.
- Falls ein Vorher-/Nachher-Gripwert nicht side-sicher im Event vorhanden ist, nicht aus privaten Kartenlisten rekonstruieren. Stattdessen aus PlayerView-Counts nur den aktuellen Zustand darstellen oder eine kleine shared/server Payload-Ergänzung prüfen, die ausschließlich öffentliche Counts enthält.
- Sinnvoller Datenvertrag für das Overlay, falls vorhanden oder ergänzbar:
  - `damageType`
  - `damageAmount`
  - `cardsTrashed`
  - `runnerGripBefore` als Count
  - `runnerGripAfter` als Count
  - `flatline`
  - `coreDamageAfter`
  - `runnerMaxHandSizeAfter`
- Wenn Payload-Erweiterungen nötig sind, diese minimal und mit Visibility-/Reconnect-/Undo-Leak-Tests absichern.
- Visualisierungsvorschlag:
  - Net Damage: kalte, digitale Störung/Glitch-Akzentfarbe.
  - Meat Damage: roter harter Impact.
  - Core Damage: dunkler Riss/bleibender Schaden plus Handlimit-Hinweis.
  - Keine dekorativen Fremdassets; CSS, vorhandene Icons oder projektinterne abstrakte Visuals reichen.
- Das Overlay kann als eigene Komponente neben `OpponentActionCueOverlay` in `apps/web/app/page.tsx` entstehen und aus der bestehenden EventTail-Verarbeitung gespeist werden.
- Die Damage-Overlay-Queue sollte deduplizieren, ähnlich wie bestehende Cues über EventIds.

## Ergebnisnotiz

Noch nicht umgesetzt. Dieses Paket beschreibt den abgestimmten Vorschlag und soll als sorgfältige Umsetzungsvorlage für eine side-sichere, deutlichere Damage-Präsentation dienen.
