# Web-UI-Strukturrefactoring Nachprüfung 2026-06-24

## 1. Gesamturteil

**Technisch nicht ausreichend verifiziert.**

Die Struktur des Webclients ist nach dem Refactoring deutlich besser als der frühere `page.tsx`-Monolith: Matchstart, aktive Topbar, aktive Server-/Runner-Zonen, Workspace-Umschaltung, LegalActions, Chronicle, Decks, Catalog und Settings sind fachlich erkennbar in Feature-Bereiche getrennt. Es wurden keine zyklischen Imports und keine Feature-Imports zurück auf `page.tsx` gefunden.

Die technische Abnahme ist aber aktuell blockiert, weil `@netgrid/web` weder Typecheck noch Build besteht und die Web-Test-Suite 3 fehlschlagende Tests enthält. Die Fehler wirken nicht wie neue UI-Verhaltensbrüche durch die extrahierten Komponenten, sondern wie bestehende Vertrags-/Testdrift, müssen aber vor einer belastbaren Freigabe behoben werden.

## 2. Verifikation

| Prüfung | Ergebnis | Details |
| --- | --- | --- |
| `corepack pnpm --filter @netgrid/web typecheck` | fehlgeschlagen | 7 TypeScript-Fehler: fehlende/inkonsistente `CounterType`-Werte in `apps/web/app/action-board-ui.ts`, `apps/web/app/action-board-ui.test.ts` und `apps/web/app/chronicle.ts`. |
| `corepack pnpm --filter @netgrid/web test` | fehlgeschlagen | Vitest: 33 Testdateien, 423 Tests; 32 Dateien/420 Tests grün, 1 Datei/3 Tests fehlgeschlagen: `apps/web/app/damage-impact-overlay.test.ts`. |
| `corepack pnpm --filter @netgrid/web build` | fehlgeschlagen | Next.js 16.2.4 kompiliert erfolgreich, scheitert anschließend beim TypeScript-Schritt am `CounterType`-Fehler in `apps/web/app/action-board-ui.ts:294`. |
| `git diff --check` | erfolgreich | Keine Whitespace-/Patch-Fehler. |
| statische Importanalyse ohne neue Dependency | erfolgreich mit Restbefund | Keine Zyklen und keine Feature-Imports auf `page.tsx`; viele Feature-Module importieren aber noch Utilities aus `apps/web/app/*`. |

Build-Hinweis: `next build` änderte automatisch `apps/web/next-env.d.ts` von `./.next/dev/types/routes.d.ts` auf `./.next/types/routes.d.ts`. Diese generierte Änderung wurde nach Prüfung zurückgesetzt und nicht im Bericht commit-relevant gelassen.

## 3. Aktuelle Strukturkennzahlen

Fokusdateien:

| Datei | Zeilen | Größe |
| --- | ---: | ---: |
| `apps/web/app/page.tsx` | 4328 | 206268 Bytes |
| `apps/web/app/globals.css` | 12980 | 281224 Bytes |
| `apps/web/app/action-board-ui.ts` | 1773 | 79170 Bytes |

Größte relevante `.ts`/`.tsx`/`.css`-Dateien unter `apps/web/app`, `apps/web/features`, `apps/web/lib`:

| Datei | Zeilen |
| --- | ---: |
| `apps/web/app/globals.css` | 12980 |
| `apps/web/app/chronicle.test.ts` | 5767 |
| `apps/web/app/chronicle.ts` | 5297 |
| `apps/web/app/page.tsx` | 4328 |
| `apps/web/app/action-board-ui.test.ts` | 2724 |
| `apps/web/app/action-board-ui.ts` | 1773 |
| `apps/web/features/debug/AiDecisionDebugOverlay.tsx` | 1394 |
| `apps/web/app/maintenance/page.tsx` | 1385 |
| `apps/web/features/decks/DeckEditorPanel.tsx` | 1246 |
| `apps/web/features/cards/CardView.tsx` | 713 |
| `apps/web/features/settings/OptionsPanel.tsx` | 681 |
| `apps/web/features/catalog/CatalogPanel.tsx` | 503 |
| `apps/web/features/chronicle/ChroniclePanel.tsx` | 434 |
| `apps/web/features/decks/DeckTableBoard.tsx` | 421 |

Feature-Bereiche unter `apps/web/features`: 13 (`actions`, `app-shell`, `cards`, `catalog`, `chronicle`, `debug`, `decks`, `game-board`, `match-session`, `match-start`, `recent`, `results`, `settings`).

`page.tsx` trägt weiterhin:

- legitime Root-Orchestrierung: App-Root, Kontextprovider, Start-/Aktivspiel-Umschaltung, globale Dialoge.
- Controller-/State-Logik: Session, Matchstart, Deckauswahl, Catalog-Filter, Card-Fokus, Overlays, lokale UI-Einstellungen.
- API-/Session-Logik: Bootstrap, Join, Reconnect, WebSocket, Lifecycle-Aktionen, lokale Sessionpersistenz.
- Rest-JSX: Einstiegsnavigation, aktive Board-Komposition, rechte Leiste, globale Modals und Options-Dialog.
- wiederverwendbare Hilfsfunktionen: noch einige lokale Adapter wie `cardActionsFor`, `runActionForServer`, `scoreAreaCardsBySide`, Deck-Payload-Builder und WebSocket-Handler.

## 4. Positive Befunde

- `page.tsx` ist überwiegend Orchestrierung und Controller geworden; große fachliche UI-Blöcke sind in `features/match-start`, `features/app-shell` und `features/game-board` ausgelagert.
- Die neuen Dateien `ActiveServerGrid.tsx`, `ActiveRunnerZoneBoard.tsx`, `ActiveMatchTopbar.tsx`, `ActiveMatchWorkspaceArea.tsx` und `MatchHostConsole.tsx` sind fachlich erkennbar geschnitten und bilden keine offensichtlich falsche neue Domänenschicht.
- Keine statisch erkennbaren Importzyklen im Webclient zwischen `apps/web/app`, `apps/web/features` und `apps/web/lib`.
- Keine Feature-Komponente importiert zurück aus `apps/web/app/page.tsx`.
- LegalAction-Grenze bleibt in den geprüften UI-Komponenten grundsätzlich erhalten: `ActiveServerGrid`, `ActiveRunnerZoneBoard`, `LegalActionsPanel`, `AccessReviewModals` und `RunTimelineOverlay` erhalten LegalActions/Handler als Props oder nutzen bestehende Helper; sie erzeugen keine eigene Spiellegalität.
- Hidden-Info-Darstellung bleibt in den geprüften Pfaden side-safe angelegt: `CardView`, `ArchivesDualStackLane`, `ActiveServerGrid`, `ActiveRunnerZoneBoard`, `ChroniclePanel` und Access-/Expose-Modals arbeiten weiter mit `VisibleCard`, `hiddenSide`, `known` und bestehenden Redaction-Helpern.
- Session-/Reconnect-Logik bleibt in `page.tsx` und kleinen Session-Helpern; `MatchHostConsole`, `MatchJoinConsole`, `MatchResumePanel` und `ActiveMatchTopbar` übernehmen keine Persistenz- oder Serverlogik.
- CSS-Tokens und Basisregeln sind über `apps/web/app/styles/tokens.css` und `base.css` getrennt. Zentrale Z-Index-Tokens existieren für Run-, Choice-, Access-, Tooltip-, Resource-Strip- und Topbar-Layer.

## 5. Gefundene Risiken

### Hoch: Webclient ist aktuell nicht typecheck- und buildfähig

Betroffene Dateien:

- `packages/shared/src/index.ts:142`
- `apps/web/app/action-board-ui.ts:294`
- `apps/web/app/action-board-ui.ts:296`
- `apps/web/app/chronicle.ts:542`
- `apps/web/app/chronicle.ts:552`
- `apps/web/app/chronicle.ts:3905`
- `apps/web/app/action-board-ui.test.ts:1321`
- `apps/web/app/action-board-ui.test.ts:1451`

Begründung: Web-Code und Tests verwenden Counter-Werte wie `data_raven`, `doppelganger_antibody` und `pattel_antibody`, die im aktuellen `CounterType` aus `packages/shared/src/index.ts` nicht enthalten sind. Dadurch scheitern Typecheck und Build.

Mögliche Auswirkung: Der Webclient kann nicht belastbar freigegeben werden; außerdem ist unklar, ob UI-/Chronicle-Darstellung und Shared-Vertrag für diese Counter synchron sind.

### Mittel: Tests sind teilweise an alte Source-Standorte statt an Verhalten gebunden

Betroffene Datei:

- `apps/web/app/damage-impact-overlay.test.ts:4`

Begründung: Die Tests lesen weiterhin `apps/web/app/page.tsx`, obwohl die geprüfte Damage-Overlay-Logik nach `apps/web/features/actions/DamageImpactOverlay.tsx` ausgelagert wurde. Die erwarteten Strings existieren in der neuen Komponente weiterhin.

Mögliche Auswirkung: Refactorings erzeugen falsche rote Tests, obwohl das Verhalten im geprüften Quelltext weiter vorhanden ist. Das schwächt die Aussagekraft der Web-Test-Suite.

### Mittel: Feature-Module hängen noch breit an `apps/web/app`-Utilities

Betroffene Beispiele:

- `apps/web/features/game-board/ActiveServerGrid.tsx` importiert `../../app/action-board-ui` und `../../app/action-cues`.
- `apps/web/features/cards/CardView.tsx` importiert `../../app/action-board-ui` und `../../app/card-image-service`.
- `apps/web/features/catalog/CatalogPanel.tsx` importiert `../../app/catalog-ui`, `../../app/card-image-service` und `../../app/ai-hint-inspector-ui`.
- `apps/web/features/decks/DeckEditorPanel.tsx` importiert `../../app/deck-editor-ui`, `../../app/deck-strategy-profile-ui` und `../../app/catalog-ui`.

Begründung: Das ist kein Zyklus und aktuell kein Verhaltensbruch, aber die Richtung ist fachlich unsauber: `features` sind schon die fachlichen UI-Bereiche, während `app` weiterhin viele wiederverwendbare Utilities hostet.

Mögliche Auswirkung: Weitere Auslagerungen bleiben abhängig von der Root-App-Struktur; Tests und Imports können bei späteren Moves unnötig brechen.

### Niedrig: CSS bleibt als großer globaler Surface gekoppelt

Betroffene Datei:

- `apps/web/app/globals.css`

Begründung: `globals.css` ist mit 12980 Zeilen weiterhin der dominante UI-Surface. Tokens und Basisregeln sind getrennt, aber Feature-Regeln, Media Queries, Layering und viele harte Z-Index-Werte liegen global nebeneinander.

Mögliche Auswirkung: Neue Komponenten sind weiterhin auf globale Klassennamen und Nebenwirkungen angewiesen. Das ist wartbar, aber bei weiteren UI-Schnitten fehleranfällig.

## 6. Empfohlene Folgeaufgaben

1. **Notwendig: CounterType-Vertrag synchronisieren**
   - Ziel: Klären und beheben, ob `data_raven`, `doppelganger_antibody` und `pattel_antibody` gültige `CounterType`-Werte sein sollen oder ob Web/Chronicle auf bestehende generische Countertypen umstellen müssen.
   - Betroffene Bereiche: `packages/shared/src/index.ts`, `apps/web/app/action-board-ui.ts`, `apps/web/app/chronicle.ts`, zugehörige Tests.
   - Nutzen: Typecheck und Build werden wieder belastbar; Counter-Darstellung und Shared-Vertrag sind eindeutig.
   - Risiko: Änderung berührt Shared-/Engine-Vertrag, daher nicht als beiläufiger Audit-Fix durchführen.
   - Empfehlung: notwendig.

2. **Sinnvoll: DamageImpactOverlay-Test auf neue Komponentendatei umstellen**
   - Ziel: `apps/web/app/damage-impact-overlay.test.ts` soll `apps/web/features/actions/DamageImpactOverlay.tsx` oder besser exportierte Helper/DOM-Verhalten prüfen.
   - Betroffene Bereiche: `apps/web/app/damage-impact-overlay.test.ts`, optional `apps/web/features/actions/DamageImpactOverlay.tsx`.
   - Nutzen: Test-Suite passt zum refaktorierten Layout und bleibt bei weiteren Root-Schnitten aussagekräftig.
   - Risiko: gering; Test-only oder kleine Helper-Extraktion.
   - Empfehlung: sinnvoll.

3. **Optional: Web-Utility-Zielstruktur für `app`-Helper festlegen**
   - Ziel: Häufig importierte reine Helper aus `apps/web/app/*` schrittweise nach `features/*` oder `lib/*` verschieben, aber nur bei konkretem Anlass.
   - Betroffene Bereiche: `action-board-ui`, `catalog-ui`, `deck-editor-ui`, `card-image-service`, `chronicle`, `action-cues`.
   - Nutzen: sauberere Import-Richtung und stabilere Feature-Grenzen.
   - Risiko: mittleres Churn-Risiko, wenn als Großmove durchgeführt.
   - Empfehlung: optional, nur paketweise.

## 7. Bewusst nicht empfohlene Änderungen

- Keine weitere pauschale Aufteilung von `DeckEditorPanel.tsx`, `CatalogPanel.tsx`, `CardView.tsx`, `LegalActionsPanel.tsx`, `ChroniclePanel.tsx`, `ActiveServerGrid.tsx` oder `ActiveRunnerZoneBoard.tsx` nur wegen Zeilenzahl. Die Dateien sind überwiegend fachlich geschlossen; zusätzliche Schnitte sollten konkrete Wiederverwendung, Testbarkeit oder Komplexitätsreduktion bringen.
- Kein CSS-Framework-Wechsel. Das aktuelle Problem ist globale Kopplung und Größe, nicht fehlende Framework-Funktionalität.
- Keine neue State-Management-Library. `page.tsx` enthält weiterhin viel State, aber der Zustand folgt den bestehenden Match-/Session-Grenzen; ein Library-Wechsel würde jetzt mehr Risiko als Nutzen erzeugen.
- Keine UI-Neugestaltung im Zuge dieses Audits. Die Befunde betreffen Typvertrag, Tests und Modulgrenzen.

## 8. Abnahmebewertung

- Typecheck, Tests, Build und Diff-Check wurden ausgeführt.
- `page.tsx`, `globals.css`, `action-board-ui.ts` und die größten Feature-Dateien wurden bewertet.
- Ersatzmonolithen und Importgrenzen wurden konkret untersucht.
- LegalAction-, Hidden-Info-, Session- und UI-State-Grenzen wurden stichprobenartig geprüft.
- Der aktuelle Stand ist strukturell deutlich verbessert, aber wegen roter Pflichtchecks nicht freigabefähig.
- Während der Prüfung wurden keine Codeänderungen vorgenommen. Nur dieser Bericht wurde angelegt; generierter `next-env.d.ts`-Build-Churn wurde zurückgesetzt.
