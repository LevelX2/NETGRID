# V1.0.5 Requirements Review - Action Board UX und Board-Klarheit

Stand: 2026-05-05
Status: bestanden

## Review-Ergebnis

Die V1.0.5-Anforderungen sind ausreichend eingefroren, um die Umsetzung zu starten. Am 2026-05-05 wurde der Freeze um kontextuelle karten- und objektgebundene LegalActions, lokal positionierbare Gegneraktions-Cues, eine eindeutige Run-Zielserver-Markierung, BoardHeader-Nutzenprüfung, eine RunTimeline-Ausrichtungsentscheidung und klare Rez-/Unrez-Zustände für installierte Corp-Karten ergänzt; diese Ergänzungen bleiben UI-Präsentationsanforderungen.

Der Scope ist bewusst eng: V1.0.5 verbessert die Lesbarkeit laufender Partien, normalisiert sichtbare UI-Begriffe, reduziert mehrdeutige flache Action-Listen, macht Cues lokal positionierbar, markiert aktuelle Run-Zielserver präzise, entfernt oder rechtfertigt redundante Boardfläche und macht gerezzte/ungerezzte Corp-Karten side-sicher unterscheidbar. Zusätzlich härtet die Phase V1.0.2-Cues/KI-Pacing sowie V1.0.4-Lifecycle-Verträge gegen Regression. Sie verändert keine Engine-Regeln, keine Karten, keine Mechaniken, keine Replay-Daten und keinen StateHash.

## Geprüfte Artefakte

- `docs/derived/V1_0_5_ACTION_BOARD_UX_PLAN.md`
- `docs/derived/V1_0_5_REQUIREMENTS.md`
- `docs/derived/ACTION_BOARD_UX_1_0_5_SPEC.md`
- `docs/derived/BOARD_RUN_UI_1_0_5_SPEC.md`
- `docs/derived/V1_0_5_TEST_MATRIX.md`
- `docs/derived/V1_0_5_BROWSER_PLAYTEST_SMOKE.md`
- `docs/derived/V1_0_2_REQUIREMENTS.md`
- `docs/derived/OPPONENT_ACTION_PRESENTATION_SPEC.md`
- `docs/derived/V1_0_4_REQUIREMENTS.md`
- `docs/derived/V1_0_4_FINAL_REVIEW.md`
- `docs/derived/RUN_BREACH_MULTIACCESS_0.97_SPEC.md`
- `docs/codex/CODEX_STATUS.md`
- `apps/web/app/page.tsx`
- `apps/web/app/chronicle.ts`
- `apps/web/app/action-cues.ts`
- `tests/specs/visibility-contract.test.ts`

## Konsistenzprüfung

| Vorgabe | Status | Ergebnis |
| --- | --- | --- |
| Engine bleibt Regelautorität | pass | V1.0.5 ist ausdrücklich Darstellung/Präsentation; keine GameState-, Replay- oder StateHash-Erweiterung. |
| Kein FullState im Browser | pass | Spezifikationen erlauben nur PlayerView, LegalActions, side-gefilterte Events, safe Match-Payloads und lokale UI-Einstellungen. |
| Keine Hidden-Info-Leaks | pass | Redaction, Runner-Rig, zentrale Server, Archive-Counts und Breach-/Access-Fortschritt haben eigene No-Leak-Regeln und Testspuren. |
| V1.0.2-Cues bleiben geschützt | pass | Cue-Mapping, Redaction, Reconnect-Queue, Audio und Highlight-Regeln sind Must- und Testspuren. |
| KI-Pacing bleibt LegalActions-basiert | pass | `advance_ai`, `fast`, `paced`, `manual` und `applyAction`-Revalidierung sind Regression-Gates. |
| V1.0.4-Lifecycle bleibt geschützt | pass | Forfeit/terminaler Status und Token-/Session-Sicherheit bleiben Teil der Regression-Gates. |
| Deutsche UI-Begriffe sind testbar | pass | Ein projektinternes UI-Glossar ersetzt die vorher offene Glossarfrage für V1.0.5. |
| Browser-Smoke ist wiederholbar | pass | Ein eigenes Smoke-Dokument definiert konkrete Prüfpunkte, auch ohne neues E2E-Framework. |
| Keine Scope-Ausweitung | pass | Neue Karten, Mechaniken, Assets, Tutorial, Chat-Erweiterung und Plattformfunktionen sind gesperrt. |
| Kontextuelle Actions bleiben Engine-kompatibel | pass | Die UI filtert und gruppiert nur vorhandene `LegalActions`; eingereicht wird weiterhin die originale `actionId` und `applyAction` revalidiert. |
| Cue-Position bleibt lokal | pass | Drag-/Preset-Positionen sind lokale UI-Einstellungen und dürfen nicht in Match-, Engine-, Replay- oder StateHash-Daten einfließen. |
| Run-Zielhighlight ist eindeutig | pass | Die Zielmarkierung wird ausschließlich aus `PlayerView.run.attackedServerId` abgeleitet und darf nicht pauschal alle Server rahmen. |
| BoardHeader hat Nutzwert oder entfällt | pass | Der obere Header darf keine bloße Sicht-/Fenster-Wiederholung bleiben; hilfreiche Statusinformation ist erlaubt. |
| Timeline-Ausrichtung ist bewusst entschieden | pass | Die Spezifikation erlaubt horizontal, vertikal/seitlich oder hybrid, verlangt aber Browserprüfung und kurze Begründung. |
| Rez-/Unrez-Zustände bleiben side-sicher | pass | Die Darstellung nutzt nur vorhandene PlayerView-Daten; Runner sieht ungerezzte Corp-Karten weiterhin anonym. |

## Risikoentscheidungen

| Risiko | Entscheidung |
| --- | --- |
| Es liegt keine offizielle deutsche Terminologiefreigabe vor. | V1.0.5 nutzt ein projektinternes UI-Glossar. Es beansprucht keine offizielle Übersetzung und ändert keine technischen IDs. |
| `R&D` deutsch zu glätten könnte Wiedererkennung verlieren. | UI-Hauptlabel ist `F&E (R&D)`, technische ID bleibt `rd`, Tests dürfen beide Displayteile erwarten. |
| `Jack-out` ist als englischer Begriff etabliert. | Haupttext wird deutsch `Run abbrechen`, etablierter Begriff darf in Klammern bleiben. |
| Runner-Rig-Gruppierung könnte vermeintliche Nicht-Karten anzeigen. | Nur tatsächlich sichtbare PlayerView-Rig-Karten werden gruppiert; leere Gruppen bleiben kompakt oder ausgeblendet. |
| Browser-/Visual-Smokes bleiben manuell. | Für V1.0.5 ist ein wiederholbares dokumentiertes Runbook zulässig; automatisches E2E bleibt späterer Qualitätsrelease. |
| Action-Gruppen könnten durch rohe ActionTypes sichtbar bleiben. | Requirements und Spec verlangen ein Mapping; Testmatrix enthält einen Glossar-/Rohlabel-Test. |
| Kontextfilter versteckt wichtige Handlungsfenster. | Globale Aktionen, Choices und laufende Run-/Access-/Encounter-Pflichtentscheidungen bleiben im permanenten Panel; nur eindeutig karten-/objektgebundene Optionen wandern in den Auswahlkontext. |
| Frei bewegliche Cues verdecken Boardbereiche. | Default bleibt boardschonend; Mitte ist nur bewusste lokale Option, Cues bleiben dismissbar und werden im schmalen Viewport begrenzt. |
| Run-Zielrahmen sieht wie allgemeiner Cue-Fokus aus. | Aktiver Run-Zielrahmen wird als eigener Boardzustand modelliert und von Cue-/Hover-Highlights unterscheidbar gemacht. |
| BoardHeader-Entfernung nimmt Orientierung weg. | Nützliche Header-Inhalte müssen in Topbar, Action Panel oder RunTimeline erhalten bleiben, wenn der separate Kasten entfällt. |
| Vertikale Timeline verschlechtert den Boardscan. | Vertikal/seitlich ist nur freigegeben, wenn Desktop- und Schmalviewport-Smokes zeigen, dass Actions, Rig und Server lesbar bleiben. |
| Unrez-Optik könnte Hidden Info verraten. | Runner-Platzhalter bleiben einheitlich und kartenspezifische Unterschiede sind nur in der eigenen Corp-Sicht erlaubt. |

## Nachreview des erweiterten Scopes

Der erweiterte V1.0.5-Scope wurde nachträglich gegen die Detaildokumente geprüft. Ergebnis: Die Ergänzungen waren fachlich enthalten, aber an mehreren Stellen noch zu offen für eine eindeutige Umsetzung. Die folgenden Vorgaben wurden deshalb nachgeschärft:

| Bereich | Befund | Nachgeschärfte Umsetzungsvorgabe |
| --- | --- | --- |
| Kontextuelle LegalActions | Die Filteridee war vorhanden, aber Anzeigeform, Matching und Lebenszyklus waren zu weich. | Standard ist ein `Ausgewählte Karte`-/`Ausgewähltes Objekt`-Abschnitt im linken Action Panel. Matching erfolgt über `source`, `payload.cardId`, `payload.resourceId`, `payload.breakerId`, `abilityRef.sourceCardInstanceId`, `targetRequirements[].sourceIceRef` und `payload.serverId`; Auswahl wird bei State-Wechsel nur gehalten, wenn das Objekt sichtbar bleibt. |
| Gegneraktions-Cue-Position | Drag oder Presets waren genannt, aber ohne konkrete Persistenz-/Fallback-Regel. | Ziel ist Drag per Handle plus Presets. Mindestumfang sind Presets mit `Mitte` und `Zurücksetzen`. Empfohlener lokaler Schlüssel ist `netgrid.actionCuePosition.v1`; Positionen werden viewport-relativ gespeichert und beim Resize geklemmt. |
| BoardHeader | Die Frage `nutzen oder entfernen` war noch optional formuliert. | Standard ist Entfernen des redundanten gerahmten Headers; nützliche Statusinformation wandert in Topbar, Action Panel, RunTimeline oder KI-Takt. |
| RunTimeline-Ausrichtung | Vertikal/seitlich war als Prüfidee genannt, aber ohne Default. | Standard bleibt horizontal-kompakt mit klarer Richtung und Zielkopplung. Vertikal/seitlich darf nur übernommen werden, wenn Desktop- und Schmalviewport-Smoke besser ausfallen. |
| Run-Zielmarkierung | Zielmarkierung war spezifiziert, aber CSS-/Zustandstrennung war implizit. | Aktiver Run-Zielrahmen nutzt eigene Zustandsableitung, z. B. `activeRunTarget`, nicht die allgemeine Cue-Highlight-Klasse. Genau ein Server darf diesen Zustand tragen. |
| Rez-/Unrez-Darstellung | Rotation, Chip und Rahmen waren als Alternativen genannt, aber ohne erste Standardform. | Standard ist `Ungerezzt`-Chip plus gedämpfte Darstellung und gestrichelter Rahmen für Corp-Sicht. Rotation ist optional und nur zulässig, wenn Text/Tooltip und Layout lesbar bleiben. Runner sieht weiter einheitliche verdeckte Platzhalter. |

Damit enthält der Release-Scope nach aktuellem Stand ausreichende Umsetzungsvorgaben. Keine zusätzliche Rückfrage an den Menschen ist blockerrelevant.

## Coverage-Check

| Bereich | Status |
| --- | --- |
| Must-Anforderungen | pass, 18 Must-Anforderungen mit Testspur |
| Action Board UX | pass |
| Kontextuelle Kartenaktionen | pass |
| Lokale Cue-Positionierung | pass |
| Run-Zielserver-Markierung | pass |
| BoardHeader-Nutzenprüfung | pass |
| RunTimeline-Ausrichtungsentscheidung | pass |
| Rez-/Unrez-Darstellung | pass |
| Board-/Run-/Server-Spezifikation | pass |
| UI-Glossar | pass |
| Cue-/Audio-/Reconnect-Regression | pass |
| KI-Pacing-/Advance-AI-Regression | pass |
| Hidden-Info-/Payload-Regression | pass |
| Browser-/Visual-Smoke | pass, als Implementierungs-Gate definiert |
| Scope-Grenzen | pass |

## Offene Punkte

Keine blockerrelevanten offenen Punkte.

Für die Umsetzung bleiben normale technische Detailentscheidungen offen, aber ausreichend begrenzt:

- exakte CSS-Position des Cue-Overlays auf Desktop und schmalem Viewport,
- ob Rig-Gruppen mit leeren Gruppen vollständig ausgeblendet oder kompakt angezeigt werden,
- ob zusätzlich zum linken Action-Kontext ein Desktop-Popover an der Karte ergänzt wird,
- ob Drag für Cue-Positionierung direkt stabil genug ist oder Presets als Mindestumfang zuerst geliefert werden,
- ob eine vertikale/seitliche RunTimeline im Browser-Smoke besser abschneidet als der horizontale Default,
- ob Unrez-ICE zusätzlich zum Standardchip mit Rotation dargestellt wird,
- ob R&D in bestimmten engen UI-Stellen als `F&E` oder `F&E (R&D)` angezeigt wird,
- ob Browser-Smoke zunächst manuell dokumentiert oder mit Browser-Automation teilautomatisiert wird.

Diese Punkte blockieren die Implementierung nicht, solange Requirements, Spezifikationen und Testmatrix eingehalten werden.

## Gate

`V1_0_5_requirements_freeze_done: true`

`ready_for_implementation: true`
