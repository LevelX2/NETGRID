# Paketprozess: Lokalisierte Kartenregeltexte und Navigationstooltips

Status: aktiv  
Quelle/Vorgabe: Nutzerauftrag vom 21.08.2026; direkte Umsetzung mit `paketprozess-worktree-goal`

## Zielprüfung

Der Endzustand ist hinreichend bestimmt:

- Die auswählbaren Produktsets `originalset-v1`, `classic` und `proteus` umfassen zusammen 582 Karten.
- Jede Produktkarte erhält einen kuratierten deutschen und französischen Regeltext.
- Englisch bleibt die kanonische Quelle und der ausdrücklich gewünschte Produkt-Fallback.
- Kartennamen, Kartentypen, Subtypen und Engine-Verträge werden nicht übersetzt oder verändert.
- Die bereits umgesetzten Navigationstooltips erhalten erklärende Texte in allen drei UI-Sprachen und eine Hover-Verzögerung von einer Sekunde.
- Gegnerische Aktionshinweise werden aus strukturierten PublicEvents auf dem jeweiligen Client lokalisiert, unabhängig von Fenster- oder Floating-Darstellung.
- Die Umsetzung erfolgt sequenziell im bestehenden Worktree mit einem Commit pro abgeschlossenem Paket.

## Gesamtziel

NETGRID zeigt auf Wunsch in Text-Tooltips für jede spielbare Produktkarte den kuratierten Regeltext in der ausgewählten UI-Sprache Deutsch oder Französisch. Die Lokalisierung bleibt eine rein lokale, side-sichere Präsentationsschicht und verändert weder CardSpec, Rules Engine, Matchzustand, Replay noch Netzwerkpayloads. Die obere Navigation erklärt ihre Ziele mit verzögerten, lokalisierten NETGRID-Tooltips. Gegnerische Aktionshinweise verwenden dieselbe ausgewählte Clientsprache in Infofenstern und Floating Text. Nach erfolgreicher Verifikation wird der Arbeitsbranch lokal nach `main` integriert und der Worktree samt Branch verifiziert entfernt.

## Annahmen

- Die englischen `CardSpec.text.rulesText`-Werte sind die führende Übersetzungsquelle.
- Eine maschinelle Rohübersetzung darf nur als nicht versionierter Arbeitsentwurf dienen. Jede versionierte Übersetzung wird Karten-ID für Karten-ID gegen den englischen Quelltext redaktionell geprüft.
- Bestehende vier manuell bestätigte Übersetzungen bleiben erhalten, sofern die Quelltexte unverändert sind.
- Sichtbare deutsche Texte verwenden `du`; französische Texte verwenden `vous`.
- Kanonische NETGRID-Begriffe werden über ein verbindliches Glossar vereinheitlicht.
- Neue Karten dürfen nach diesem Prozess weiterhin zunächst auf Englisch zurückfallen, bis beide bestätigten Übersetzungen ergänzt wurden.

## Nicht-Ziele

- Keine Übersetzung von Kartennamen, Kartentypen, Subtypen, Setnamen oder technischen IDs.
- Keine Laufzeitübersetzung und keine Abhängigkeit von einem externen Übersetzungsdienst.
- Keine Änderung von Kartenmechaniken, Engine-Verträgen, LegalActions, KI-Verhalten oder Hidden-Info-Projektionen.
- Keine Übersetzung von Testset- oder Systemkarten.
- Kein vollständiger Workspace-, Build-, E2E- oder AI-Shard-Lauf ohne direkt betroffene Vertragsfläche.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Sprachkatalogeintrag wird als bestätigt versioniert, bevor sein englischer Quelltext redaktionell abgeglichen wurde.
- Zahlen, Variablen, Kostenmarker, Aktionsmarker, Subroutine-Marker, Kartennamen und Zeilenstruktur dürfen fachlich nicht verloren gehen.
- Jede Sprachdatei ist vollständig und enthält exakt die erwarteten Karten-IDs ihres Sets.
- Fehlende oder ungültige Übersetzungen fallen sichtbar auf den kanonischen englischen Text zurück; sie werden nicht durch einen Ersatzwert kaschiert.
- Die Tooltip-Lokalisierung erhält keine zusätzliche Kartenkenntnis und darf keine verdeckte Definition sichtbar machen.
- Engine- und CardSpec-Dateien bleiben unverändert.

## Automatische Fehlerbehandlung

- Ein fehlender Karten-ID-Schlüssel, ein beschädigter Marker oder eine veränderte numerische Struktur stoppt das aktuelle Paket.
- Ein sprachlich oder semantisch zweifelhafter Text bleibt Englisch und wird im Paketprotokoll als nicht abgeschlossen geführt; das Paket erreicht sein Done-Gate nicht.
- Testfehler werden nur im direkt betroffenen Übersetzungs-, Tooltip- oder UI-Pfad behoben.
- Unabhängige Baseline-Fehler werden dokumentiert und nicht in diesen Scope gezogen.
- Konflikte mit neuem `main` werden nach Intent beider Seiten gelöst; ein widersprüchlicher Übersetzungs- oder UI-Vertrag ist ein fachlicher Blocker.

## Sicherheitsblocker

Der Prozess stoppt fail-closed, wenn:

- der englische Quelltext einer Karte nicht eindeutig der Karten-ID zugeordnet werden kann;
- eine Übersetzung die Regelwirkung nicht bedeutungsgleich ausdrücken kann, ohne eine fachliche Entscheidung zur Mechanik zu treffen;
- Hidden-Info- oder PlayerView-Grenzen für lokalisierte Tooltips aufgeweicht werden müssten;
- der finale Merge relevante fremde Änderungen überschreiben würde;
- der Worktree vor dem Cleanup noch relevante Änderungen enthält.

Removal Condition: Quelle beziehungsweise Fachbegriff eindeutig klären, betroffene Übersetzung korrigieren, alle Paketchecks erneut grün ausführen und den Blocker im Prozesslog schließen.

## State Machine

`vorbereitet -> aktiv -> geprüft -> committed -> nächstes Paket`

Fehlerpfad:

`aktiv -> fehlgeschlagen -> eng korrigieren -> geprüft`

Blockerpfad:

`aktiv -> blockiert -> Blocker-Report + Removal Condition`

Abschluss:

`letztes Paket committed -> main abgleichen -> direkt betroffene Checks -> main Fast-Forward -> main prüfen -> Worktree entfernen und doppelt verifizieren -> Branch löschen -> Goal complete`

## Paketfolge

| Paket | Inhalt | Ziel-Commit |
| --- | --- | --- |
| P00 | Verzögerte, erklärende Navigationstooltips | `feat(web): add delayed navigation tooltips` |
| P01 | Übersetzungsvertrag, Glossar, Katalogstruktur und QA-Harness | `test(i18n): define card rule translation contract` |
| P02 | Originalset Deutsch 001–100 | `feat(i18n): translate originalset rules de 001-100` |
| P03 | Originalset Deutsch 101–200 | `feat(i18n): translate originalset rules de 101-200` |
| P03A | Gegnerische Aktionshinweise in Fenster- und Floating-Darstellung lokalisieren | `fix(i18n): localize opponent action cues` |
| P04 | Originalset Deutsch 201–300 | `feat(i18n): translate originalset rules de 201-300` |
| P05 | Originalset Deutsch 301–374 | `feat(i18n): complete originalset rules in German` |
| P06 | Originalset Französisch 001–100 | `feat(i18n): translate originalset rules fr 001-100` |
| P07 | Originalset Französisch 101–200 | `feat(i18n): translate originalset rules fr 101-200` |
| P08 | Originalset Französisch 201–300 | `feat(i18n): translate originalset rules fr 201-300` |
| P09 | Originalset Französisch 301–374 | `feat(i18n): complete originalset rules in French` |
| P10 | Classic Deutsch 001–054 | `feat(i18n): translate classic rules in German` |
| P11 | Classic Französisch 001–054 | `feat(i18n): translate classic rules in French` |
| P12 | Proteus Deutsch 001–077 | `feat(i18n): translate proteus rules de 001-077` |
| P13 | Proteus Deutsch 078–154 | `feat(i18n): complete proteus rules in German` |
| P14 | Proteus Französisch 001–077 | `feat(i18n): translate proteus rules fr 001-077` |
| P15 | Proteus Französisch 078–154 | `feat(i18n): complete proteus rules in French` |
| P16 | Vollständigkeitsprüfung, UI-Regressionen und Architekturdokumentation | `test(i18n): verify complete localized card rules` |
| P17 | Main-Abgleich, direkt betroffene Rechecks, Merge und Cleanup | kein zusätzlicher Feature-Commit erforderlich |

## Paketdetails

### P00 – Navigationstooltips

- Ziel: Native System-Tooltips der aktiven oberen Navigation durch erklärende NETGRID-Tooltips ersetzen.
- Kernartefakte: `AppShell.tsx`, `globals.css`, UI-Sprachdateien, Regressionstest.
- Checks: fokussierter Vitest; I18N-Key-Gate; `git diff --check`.
- Done-Gate: Sechs Navigationsziele sind dreisprachig erklärt, Hover wartet eine Sekunde, Tastaturfokus nicht.
- Status: abgeschlossen mit Commit `e74535e13`.

### P01 – Vertrag und QA-Harness

- Ziel: Stabile, set- und sprachgetrennte Katalogstruktur sowie automatisierte Integritätsprüfungen.
- Arbeit: Glossar anlegen; Sprachkataloge modularisieren; erwartete Produktkarten-IDs aus dem Katalog ableiten; Marker-, Zahlen-, Titel- und Vollständigkeitsprüfungen ergänzen.
- Kernartefakte: `apps/web/i18n/card-rule-translations.ts`, Katalogverzeichnis, Tests, Glossar.
- Checks: fokussierte I18N-/Tooltip-Tests; Katalogtest; `git diff --check`.
- Done-Gate: Leere Teilkataloge können schrittweise befüllt werden, Fallback bleibt grün, QA meldet fehlende Paketbereiche präzise.

### P02–P15 – Sprachpakete

- Ziel: Sämtliche im Bereich genannten Karten redaktionell bestätigen.
- Eingang: P01 committed; vorheriges Paket committed.
- Arbeit je Karte: englische Quelle lesen; Titel und Regelmarker erhalten; Glossar anwenden; Übersetzung bedeutungsgleich formulieren; gegen Quelle gegenlesen.
- Kernartefakte: genau eine set-/sprachbezogene Katalogdatei und Paketfortschritt im Testvertrag.
- Checks: Bereichsvollständigkeit; Marker-/Zahlen-/Titelprüfung; Stichproben für komplexe und kurze Texte; Tooltip-Auswahltest; `git diff --check`.
- Done-Gate: Jede erwartete Karten-ID des Paketbereichs besitzt genau einen nichtleeren, geprüften Text; keine strukturelle Abweichung.

### P03A – Gegnerische Aktionshinweise

- Ziel: Die gemeinsame Cue-Pipeline lokalisiert Titel, Beschreibungen, Akteure und Aktionsordnungen clientseitig für Deutsch, Englisch und Französisch.
- Arbeit: Den vorhandenen Chronicle-Übersetzer in die Cue-Ableitung durchreichen; Fenster und Floating Text bleiben reine Render-Varianten desselben lokalisierten Cue-Modells.
- Kernartefakte: `action-cues.ts`, `page.tsx`, UI-Sprachdateien und fokussierte Cue-Tests.
- Checks: Cue-Ableitung in Englisch und Französisch; beide Display-Modi verwenden denselben lokalisierten Cue; I18N-Key-Gate; `git diff --check`.
- Done-Gate: Keine deutsche Legacy-Zeichenkette wird bei englischer oder französischer Clientsprache als Titel, Beschreibung, Akteur oder Aktionsangabe ausgegeben; PublicEvent- und Hidden-Info-Verträge bleiben unverändert.

### P16 – Gesamtverifikation

- Ziel: Beide Sprachen decken alle 582 Produktkarten ab und die UI wählt sie korrekt aus.
- Checks: vollständiger thematischer I18N-Test, Tooltip-Tests, Navigationstooltip-Test, I18N-Key-Gate, Web-Typecheck nur soweit direkt betroffen; bekannte unabhängige Fehler separat ausweisen.
- Done-Gate: 582 deutsche und 582 französische Einträge, Fallbacktests und side-sichere Aufrufer grün, Worktree sauber nach Commit.

### P17 – Integration und Cleanup

- Ziel: Aktuelles `main` defensiv einbinden, direkt betroffene Checks wiederholen, bevorzugt Fast-Forward mergen und Prozessartefakte entfernen.
- Done-Gate: `main` enthält alle Paketcommits; `git status --short` und `git diff --check` sind für Prozessänderungen sauber; Worktree fehlt in Git-Liste und Dateisystem; Branch ist gelöscht.

## Verifikationsregeln

- Pro Paket nur direkt änderungsnahe Vitest-Dateien und das I18N-Key-Gate.
- JSON muss parsebar und formatiert sein.
- Karten-ID-Mengen werden gegen `@netgrid/catalog` geprüft.
- Bracket-Tokens wie `[1]`, `[T]`, `[X]` bleiben als Multimenge erhalten.
- Ziffernfolgen und die Anzahl von `A:`- sowie `*`-Markern bleiben erhalten.
- Wenn der englische Text den eigenen Kartennamen nennt, muss die Übersetzung ihn unverändert enthalten.
- Ein Gesamt-Typecheck ist nur wegen der geänderten JSON-/TypeScript-Importoberfläche vorgesehen; unabhängige Baselinefehler blockieren nicht still, sondern werden ausgewiesen.

## Worktree-, Git- und Integrationsregeln

- Arbeitsworktree: `C:\Projekte\NETGRID_CARD_RULE_TRANSLATIONS`
- Arbeitsbranch: `codex/card-rule-translations-complete`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Der Hauptworkspace ist aktuell durch fremde Änderungen belegt; diese werden weder gestaged noch verändert.
- Jedes Paket erhält genau einen klar zugeordneten Commit.
- Vor jedem Commit: direkte Checks, `git diff --check`, explizites Staging ausschließlich der Paketdateien.
- Vor Integration: aktuellen `main` in den Arbeitsbranch einbinden und Konflikte intent-erhaltend lösen.
- Finaler Merge bevorzugt `git merge --ff-only codex/card-rule-translations-complete`.
- Kein Push und kein Pull Request ohne gesonderten Nutzerauftrag.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Paketprozess „Lokalisierte Kartenregeltexte und Navigationstooltips“ vollständig und sequenziell von P00 bis P17 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, die NETGRID-Wissensbasis und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_CARD_RULE_TRANSLATIONS auf Branch codex/card-rule-translations-complete.
Nutze den Hauptworkspace nur für Preflight und finalen Merge.
Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist.
Arbeite immer nur am aktuellen Paket. Führe die direkt änderungsnahen Checks aus, dokumentiere das Ergebnis, führe git diff --check aus und committe jedes abgeschlossene Paket separat.
Liefere keine ungeprüfte Maschinenübersetzung als bestätigten Regeltext aus.
Bei Sicherheitsblocker: stoppe, schreibe einen Blocker-Report mit Removal Condition.
Nach P16: aktuelles main defensiv einbinden, direkt betroffene Checks wiederholen, lokal nach main mergen, main prüfen, den sauberen Worktree entfernen und die Entfernung in Git und Dateisystem verifizieren, den gemergten Branch löschen und Goal erst dann als complete markieren.
```

## Abschlusskriterien

- P00 bis P16 sind jeweils geprüft und separat committed.
- Alle 582 Produktkarten besitzen deutsche und französische Regeltexte.
- Englischer Fallback, Laufzeitumschaltung, Side-Sicherheit und Kartenbild-Tooltip-Verhalten bleiben erhalten.
- Navigationstooltips sind dreisprachig, erklärend und um eine Sekunde verzögert.
- Aktuelles `main` enthält alle Änderungen ohne Verlust fremder Intentionen.
- Arbeitsworktree und Arbeitsbranch sind nach dem Merge nachweislich entfernt.
- Erst danach wird das `/Goal` als `complete` markiert.
