# Realismusprüfung der UI-Designsets

Stand: 2026-05-03
Scope: privater NETGRID-Client für MVP 0.2, mit Blick auf spätere UI-Politur

## Bewertungsmaßstab

Die Prozentwerte beschreiben, wie realistisch das jeweilige Designset ohne grundlegenden Redesign-Bruch in eine echte Next.js/React-Oberfläche überführt werden kann.

Bewertet wurden:

- MVP-Scope-Treue: private Matches, feste Demo-Decks, keine Plattformfeatures.
- Side-View-Trennung: Runner und Corp brauchen unterschiedliche Arbeitsoberflächen.
- Hidden-Info-Schutz: keine gegnerischen verdeckten Kartennamen, Tokens oder private Payloads.
- Engine-Vertrag: Aktionen kommen aus `LegalActions`; `StateVersion`, Reconnect, Undo und Receipts sind sichtbar gedacht.
- UX-Realismus: wiederholtes Spielen, Scannen, Timingfenster, Run- und Server-Management.
- Implementierungsaufwand: Umsetzbarkeit mit vorhandenen React-Komponenten, CSS, `PlayerView`, `LegalAction`, WebSocket- und Match-Payloads.

## Kurzfazit

| Set | Direkte Realistik | Nach Anpassung | Einschätzung |
|---|---:|---:|---|
| Design A: Dark Tactical | 72 % | 88 % | Starkes Spielgefühl, gute Side-Trennung, aber mehrere Scope- und Kartennamen-Probleme. |
| Design B: Operations Dashboard | 64 % | 84 % | Technisch plausibel, aber als Haupt-UI zu diagnostisch und teilweise sicherheitsgefährlich formuliert. |
| Design C: Clean High Contrast | 86 % | 96 % | Beste MVP-Basis: lesbar, umsetzbar, side-sicherer und am wenigsten riskant. |
| Design D: Cinematic Dark | 78 % | 91 % | Sehr stark für Run-/Encounter-Fokus, aber nicht vollständig genug als alleinige Grundoberfläche. |

Empfehlung: Design C als Hauptstruktur verwenden, Design D als Run-/Encounter-Modus adaptieren, Design A als dunkle visuelle Alternative prüfen, und Design B nur als einklappbare Diagnose-/Debug-Schicht verwenden.

## Gemeinsame fehlende Bausteine

Diese Bestandteile fehlen in allen Sets noch als verbindlicher Umsetzungsentwurf:

- Exakte `PlayerView`-Bindung: welche Felder der Runner- bzw. Corp-View wo gerendert werden.
- Einheitliches Card-Komponentenmodell: bekannte Karte, unbekannte Karte, unrezzed Corp-Karte, rezzed Karte, scored Karte, accessed Karte.
- Choice-Handling: Zielauswahl, Subroutine-Auswahl, Access/Steal/Trash/Decline, Rez-Fenster und Pending Choice.
- Action-Submission-Zustände: optimistic disabled, pending, accepted, rejected, stale, duplicate idempotency receipt.
- Side-sichere Fehleranzeige: generische Fehler ohne Hinweise auf verdeckte Karten oder Token.
- Responsive Strategie: Desktop zuerst, aber definierte Breakpoints für schmale Browserfenster.
- Tastatur- und Screenreader-Grundlagen: Fokusreihenfolge, Labels, Dialogzustände.
- Redaktionsregeln für EventLog: Public, SideEvent, Redacted, SystemEvent.
- Undo-States: verfügbar, angefragt, wartet auf Gegner, akzeptiert, abgelehnt, nach Hidden-Info-Barrier blockiert.
- Reconnect-States: verbunden, reconnecting, resynced, opponent offline, session replaced.

## Design A: Dark Tactical

Dateien:

- [Einstieg](01-design-a-dark-tactical/entry.png)
- [Runner](01-design-a-dark-tactical/runner.png)
- [Corp](01-design-a-dark-tactical/corp.png)

### Stärken

- Sehr klare Unterscheidung zwischen Runner- und Corp-Perspektive.
- Runner-Ansicht priorisiert Runs, Rig, Grip und `LegalActions`.
- Corp-Ansicht priorisiert HQ, Serverbau, ICE, Remote-Management und Run Response.
- Dark-Tabletop-Stil passt gut zu einer privaten Spieloberfläche.
- Statusflächen für State, Reconnect, Undo und EventLog sind bereits visuell vorgesehen.

### Fehlende oder problematische Bestandteile

- Mehrere echte oder erkennbare Kartennamen und offizielle Anmutungen müssen raus.
- Runner-Screen zeigt out-of-scope Werte wie Link Strength; Corp-Screen zeigt Tags. Für MVP 0.2 sollten diese nicht sichtbar sein, außer sie sind durch den aktiven Kartenpool wirklich implementiert und getestet.
- Corp-Screen ist visuell sehr kartenreich. Das ist spielerisch attraktiv, aber mehr Aufwand für responsive Layouts, Drag-/Target-Auswahl und lesbare Card States.
- Entry-Screen ist gut, aber noch zu sehr generisches App-Menü mit Replays/Rules/Settings. Für MVP 0.2 sollten nur Start, Create, Join, Reconnect und Diagnostics sichtbar sein.
- Manche Kartenflächen sehen wie echte Card Frames aus. Das sollte in Richtung abstrakter Demo-Karten reduziert werden.

### Realismus

Direkt: 72 %.
Nach Anpassung: 88 %.

Der Gap ist lösbar. Hauptarbeit ist keine Engine-Arbeit, sondern Scope-Bereinigung, generisches Karten-Design und Komponenten-Disziplin.

### Angepasster Vorschlag

Design A bleibt als dunkle taktische Variante sinnvoll, wenn:

- Karten nur `Simple ...` oder `Demo ...` Labels aus dem internen Kartenpool nutzen.
- Nicht-MVP-Anzeigen wie Link, Tags, Bad Publicity und nicht belegte Statuswerte verschwinden.
- Replays/Rules/Settings im Einstieg in ein späteres Debug-Menü wandern.
- Corp-Server als strukturierte Slots gerendert werden: ICE-Lane, Root-Lane, Advancement, Rez-State.
- Runner-Lanes nur aktuelle Run-Ziele und aktuell relevante Timingpunkte hervorheben.

## Design B: Operations Dashboard

Dateien:

- [Einstieg](02-design-b-operations-dashboard/entry.png)
- [Runner](02-design-b-operations-dashboard/runner.png)
- [Corp](02-design-b-operations-dashboard/corp.png)

### Stärken

- Sehr nah an den MVP-0.2-Anforderungen für Match, WebSocket, Reconnect, Undo, Receipts und StateHash.
- Gut geeignet für Entwicklung, Test, Debugging und Visibility-Audits.
- LegalActions als Tabelle mit Action ID, StateVersion und Idempotency passen gut zum Serververtrag.
- Corp-Ansicht macht Per-Match-Lock, Action Receipt und Duplicate-Handling sichtbar.

### Fehlende oder problematische Bestandteile

- Als Haupt-Spieloberfläche ist das Design zu audit- und tabellenlastig. Das erschwert normales Spielen.
- Entry-Screen zeigt Token-/Audit-Details zu prominent. Konkrete Tokens dürfen nicht in Logs oder Event-Audit-Zeilen landen.
- IndexedDB/Client-State-Formulierungen wirken so, als könne der Client Match-State besitzen. Für MVP 0.2 muss der Server autoritativ bleiben.
- Runner-Screen enthält out-of-scope oder nicht zuverlässig MVP-0.2-sichere Mechaniken wie Brain Damage, Tags, Trace-Texte und echte Kartennamen.
- Sehr hohe Informationsdichte macht Responsive-Verhalten und visuelle QA teuer.
- Debug-Informationen können leicht versehentlich private Details offenlegen, wenn sie nicht strikt side-gefiltert sind.

### Realismus

Direkt: 64 %.
Nach Anpassung: 84 %.

Der Gap ist lösbar, aber Design B sollte nicht die normale Spieleroberfläche werden. Es ist am besten als einklappbare Diagnose- und Playtest-Ansicht.

### Angepasster Vorschlag

Design B wird zu einer Debug-Schicht:

- Spieler sehen standardmäßig eine einfachere Board-Ansicht.
- Diagnosebereiche liegen hinter einem `Diagnostics`-Drawer.
- Tokenwerte werden nie angezeigt, nur Status wie `Token safe`.
- Action Receipts zeigen nur IdempotencyKey-Kurzform, StateVersion, Result und StateHash.
- Logs zeigen keine Join-URL, keine SessionToken, keine ReconnectToken und keine privaten Payloads.
- Tables bleiben für `LegalActions`, Receipts und Tests wertvoll, aber nicht für jede Card-Zone.

## Design C: Clean High Contrast

Dateien:

- [Einstieg](03-design-c-clean-high-contrast/entry.png)
- [Runner, korrigiert](03-design-c-clean-high-contrast/runner-corrected.png)
- [Corp](03-design-c-clean-high-contrast/corp.png)
- [Einstieg, kartenbildfreundlich](03-design-c-clean-high-contrast/entry-card-images.png)
- [Runner, kartenbildfreundlich korrigiert](03-design-c-clean-high-contrast/runner-card-images-corrected.png)
- [Corp, kartenbildfreundlich korrigiert](03-design-c-clean-high-contrast/corp-card-images-corrected.png)

### Stärken

- Beste Lesbarkeit und geringster Implementierungswiderstand.
- Sehr gut für MVP-Tests, Lernen und wiederholtes Spielen.
- Runner-Screen zeigt Run-Progress, `LegalActions`, Grip, Rig und EventLog klar.
- Corp-Screen trennt Corp-Hand, Serverbau, Runner Public Info und LegalActions gut.
- Helle Oberfläche macht versteckte/öffentliche Zonen leichter unterscheidbar.
- Korrigierter Runner-Screen nutzt generische Demo-Karten und reduziert Scope-Risiken deutlich.
- Die kartenbildfreundlichen Varianten zeigen plausibel, wie echte Kartenabbilder später in stabile Kartenflächen, Card Preview, Zoom und Text-Fallback eingebunden werden können.
- Card Display Optionen im Einstieg machen Bildkarten zu einer lokalen Anzeigepräferenz statt zu einer Spielregel.

### Fehlende oder problematische Bestandteile

- Runner-Screen nennt `Access 3 cards`; Multiaccess ist für den MVP-Scope kritisch und sollte nicht als Standard angezeigt werden.
- Corp-Screen enthält `Demo Program` in HQ. Corp-HQ sollte nur Corp-Kartentypen enthalten.
- Memory-/MU-Hinweise sollten nur angezeigt werden, wenn sie im aktiven Demo-Scope wirklich benötigt werden.
- Die Entry-Oberfläche ist sehr gut, könnte aber Reconnect und Copy-Link-Zustände noch genauer zeigen.
- LegalActions brauchen Ziel- und Choice-Details: welches ICE, welche Subroutine, welche Karte wird installiert.
- Corp-Screen braucht klarere Rez-/Unrezzed-Zustände und Advancement-Counter.
- Die kartenbildfreundlichen Varianten erhöhen die Dichte und brauchen deshalb zwingend Text-Fallback, Zoom/Focus und ein großes Card Preview Panel.
- Hidden Cards dürfen auch im Bildmodus keine echten Kartenrücken, Bild-URLs oder unterscheidbaren Assetzustände verwenden.
- Einige Kartenbildbeispiele zeigen spätere Typen wie Resource. Diese dürfen nur angezeigt werden, wenn sie im aktuellen Kartenpool/PlayerView wirklich existieren.

### Realismus

Direkt: 86 %.
Nach Anpassung: 96 %.

Der Gap ist vollständig lösbar. Design C ist die beste Grundlage für eine erste robuste Implementierung.

### Angepasster Vorschlag

Design C wird zur Haupt-UI:

- Entry: `Runner vs AI`, `Create Private Match`, `Join Invite`, `Resume`.
- Runner: Run-Lanes, Grip, Rig, eigene Ressourcen, gegnerische Hidden-Zonen nur als Counts, `LegalActions` rechts.
- Corp: Server-Builder mit HQ/R&D/Archives/Remote, eigene versteckte Karten sichtbar, Runner Hidden-Zonen nur als Counts.
- Diagnose nur als schmaler Statusstreifen plus optionaler Drawer.
- Alle Kartenlabels aus dem internen Demo-Kartenpool oder generische `Demo ...` Namen.
- Kein Multiaccess-Text, solange die Engine ihn nicht ausdrücklich anbietet.
- CardView von Anfang an bildfreundlich bauen: stabiles `5 / 7`-Format, Image/Text-Umschaltung, Zoom/Focus und generischer Platzhalter.
- Echte Kartenbilder bleiben ein separates Asset-Gate; vor Freigabe lädt der Bildmodus nur eigene generische Platzhalter.
- Card Preview ist wichtiger als viel Text auf kleinen Boardkarten.

## Design D: Cinematic Dark

Dateien:

- [Einstieg](04-design-d-cinematic-dark/entry.png)
- [Runner, korrigiert](04-design-d-cinematic-dark/runner-corrected.png)
- [Corp, korrigiert](04-design-d-cinematic-dark/corp-corrected.png)

### Stärken

- Sehr gutes Gefühl für aktuelle Runs und Encounter.
- Runner-Screen macht `Encounter`, Subroutines, Breaker und LegalActions stark sichtbar.
- Corp-Screen macht Remote Defense, Rez Window, Per-Match-Lock und Action Receipt gut greifbar.
- Korrigierte Varianten sind wesentlich scope-sicherer als die Drafts.
- Besonders geeignet als fokussierter Run-Modus über einer normalen Board-Ansicht.

### Fehlende oder problematische Bestandteile

- Als alleinige UI fehlen Normalzustände außerhalb eines Runs: Corp-Action-Phase, Runner-Action-Phase ohne aktiven Run, Match wartet, Undo-Anfrage wartet, Access-Entscheidung.
- Der Runner-Screen hat doppelte Event-Trail-Flächen. Eine davon sollte verschwinden.
- Die linke Runner-Spalte verwendet bei Hidden-Zonen teils missverständliche Corp/Runner-Texte.
- Hoher visueller Anspruch bedeutet mehr CSS- und QA-Aufwand.
- Dunkle, schmale Panels erhöhen das Risiko für Textüberlauf.
- Corp-Screen zeigt relativ viel Kartentext auf kleinen Karten. In der echten UI sollte Detailtext eher in Hover/Focus/Detailpanel.

### Realismus

Direkt: 78 %.
Nach Anpassung: 91 %.

Der Gap ist lösbar. Design D sollte als Run-/Encounter-Fokusmodus oder Dark-Skin für fortgeschrittenes Spielen dienen, nicht als alleiniger MVP-Startpunkt.

### Angepasster Vorschlag

Design D wird als fokussierter Modus verwendet:

- Normale Board-Ansicht bleibt Design C-ähnlich.
- Sobald ein Run aktiv ist, wechselt der Center-Bereich in einen Design-D-Encounter-Modus.
- Subroutines, Breaker, Rez-Fenster und Access werden prominent.
- EventLog wird einmalig geführt, rechts unten oder unten als Timeline.
- Kartentext wandert in ein Detailpanel, damit Kartenflächen stabil bleiben.
- Auf kleinen Viewports wird zuerst die aktuelle Choice sichtbar, danach Board und EventLog.

## 100-Prozent-Gap

Der Gap zu einer zu 100 % umsetzbaren UI-Spezifikation ist lösbar. Kein Design verlangt eine unmögliche Engine-Funktion. Die Risiken liegen fast vollständig in der Übersetzung der Bilder in klare UI-Komponenten und Scope-Regeln.

Nötige Anpassungen für 100 % Umsetzbarkeit:

1. Ein verbindliches Komponentenmodell definieren:
   - `AppShell`
   - `EntryScreen`
   - `RunnerBoard`
   - `CorpBoard`
   - `ServerGrid`
   - `CardView`
   - `LegalActionsPanel`
   - `ChoiceRequestPanel`
   - `ConnectionStatus`
   - `UndoPanel`
   - `EventLog`
   - `DiagnosticsDrawer`

2. Alle sichtbaren Daten ausschließlich aus diesen Quellen ableiten:
   - `PlayerView`
   - `LegalActions`
   - `ChoiceRequest`
   - side-gefilterter `EventLog`
   - `ActionReceipt`
   - `OpponentStatus`
   - Match-/Session-Metadaten ohne Klartexttokens

3. Alle nicht sicheren Bildideen entfernen:
   - echte oder erkennbare NETGRID-Kartennamen
   - offizielle Framing-Anmutungen
   - Tokenwerte in Logs
   - Full-GameState-Debug
   - nicht belegte Mechanics wie Trace, Damage oder Multiaccess
   - öffentliche Plattform-Elemente

4. Side-spezifische Primärziele festlegen:
   - Runner: Run starten, Run fortsetzen, ICE begegnen, Breaker nutzen, Access entscheiden, Rig/Grip verwalten.
   - Corp: Server bauen, ICE installieren, rezzen, advancen, scoren, Run Response treffen, Hidden-Info-Barrieren respektieren.

5. Designentscheidung:
   - Primär: Design C.
   - Run-Fokus: Design D.
   - Dark-Skin-Ideen: Design A.
   - Debug/Playtest: Design B als Drawer.

## Angepasster Zielvorschlag

Für die tatsächliche Umsetzung sollte ein hybrider Vorschlag formuliert werden:

- Einstieg aus Design C mit einzelnen Status-Elementen aus Design D.
- Runner-Board aus Design C, bei aktivem Run mit Design-D-Encounter-Zentrum.
- Corp-Board aus Design C, mit Design-D-Remote-Defense-Fokus während Runner-Runs.
- LegalActions aus Design B, aber als kompakte Liste statt dauerhafte Audit-Tabelle.
- Debug- und Replay-Details aus Design B nur in einem einklappbaren Diagnosebereich.
- Dunkle Variante später aus Design A/D ableiten, sobald die helle MVP-Struktur stabil ist.

Damit ist eine Umsetzung auf 100 % Spezifikationsrealismus erreichbar, ohne den MVP-Scope zu sprengen.
