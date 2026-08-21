# Paketprozess: Lokalisierte Aktionsdarstellung und Spiel-Tooltips

## Status

Aktiv. Aktuelles Paket: AP-01.

## Quelle/Vorgabe

In einer englisch oder französisch eingestellten Partie erscheinen weiterhin deutsche Legal-Action-Beschriftungen und deutsche Counter-/Status-Tooltips. Sichtbares Beispiel: `Credit nehmen`, `Karte ziehen`, `Zug beenden` sowie der Tooltip von Pattel’s Virus.

## Zielprüfung

Die Vorgabe ist ausreichend präzise. Betroffene Erzeuger und Konsumenten liegen in der Web-Präsentationsschicht, insbesondere `apps/web/app/action-board-ui.ts` sowie den Action-, Card- und Game-Board-Komponenten. Die Engine bleibt sprachneutraler Regel- und LegalAction-Owner.

## Gesamtziel

Alle spielseitig sichtbaren Beschriftungen der Aktionsauswahl sowie Counter-, Serverstatus- und aktionsbezogenen Tooltips werden pro Client aus strukturierten Action-, Payload-, Counter- und Statusdaten auf Deutsch, Englisch oder Französisch gerendert. Unbekannte oder nicht unterstützte Locale-Werte fallen auf Englisch zurück. Deutsche Engine-Labels werden nicht als Übersetzungsquelle geparst.

## Annahmen

- Unterstützte Sprachen bleiben `de`, `en` und `fr`.
- Karten-, Spieler-, Server- und andere Eigennamen bleiben kanonisch.
- Technische Action-/Counter-/Status-IDs dürfen als semantische Schlüssel dienen; `actionId` und deutsche Freitext-Labels nicht.
- Bestehende deutschsprachige Unit-Erwartungen dürfen durch einen expliziten deutschen Test-Translator weiterlaufen; produktive Aufrufer übergeben immer die aktive Locale.
- Ein unbekannter semantischer Fall wird sichtbar und lokalisiert generisch beschrieben, nicht mit einem anderssprachigen Freitext-Fallback.

## Nicht-Ziele

- Keine Änderung an Rules Engine, LegalActions, PlayerActions, Matchzustand, Replay oder StateHash.
- Keine Übersetzung kanonischer Kartentitel oder gedruckter Kartenbilder.
- Keine KI-, Regel- oder Kartenmechanikänderung.
- Keine globale Bereinigung sämtlicher nicht aktionsbezogener Webtexte.
- Kein Parser für deutsche `action.label`-Sätze und kein Text-Ersetzungs-Workaround.

## Controller-Invarianten

- Locale ist reine Client-Präsentation; Spieler derselben Partie können unterschiedliche Sprachen verwenden.
- Auswahl und Submit verwenden unverändert dieselbe `actionId` und Payload.
- Kein Hidden-Info-Feld wird für die Übersetzung neu projiziert oder sichtbar gemacht.
- Action-Typ, strukturierte Payload-Semantik, öffentliche Kartenpräsentation, Counter-ID und Status-Kind sind die einzigen fachlichen Übersetzungsquellen.
- Englisch ist der deterministische Fallback für unbekannte Locale-Werte und fehlende lokalisierte Semantik.

## Automatische Fehlerbehandlung

- Rote direkt betroffene Tests werden im aktiven Paket ursachenbezogen behoben.
- Neue semantische Lücken werden als typisierte Kataloglücke geschlossen; kein Rückfall auf anderssprachigen Freitext.
- Fremde Änderungen in `main`, insbesondere an Nachrichtenkatalogen und Chronicle-/Action-Cue-Dateien, werden nicht verworfen oder beiläufig committed.
- Bei Main-Konflikten werden beide fachlichen Intentionen verstanden und erhalten.

## Sicherheitsblocker

Ein Blocker liegt vor, wenn eine notwendige sichtbare Unterscheidung ausschließlich aus einem deutschen Freitextlabel oder einem nicht side-sicheren Feld ableitbar wäre. Removal Condition: Die Engine/PlayerView stellt die benötigte strukturierte, side-sichere Semantik bereit oder der Produktfall erhält eine ausdrücklich genehmigte generische lokalisierte Darstellung.

## State Machine

`PREPARED -> AP-01 -> AP-02 -> AP-03 -> AP-04 -> FINAL_VERIFY -> MAIN_MERGED -> CLEANED -> COMPLETE`

Genau ein Paket ist aktiv. Ein Paketwechsel erfolgt erst nach bestandenem Done-Gate und eigenem Commit.

## Paketfolge

1. AP-01 – Übersetzungsvertrag und Hardcoding-Inventar
2. AP-02 – Primäre und kontextabhängige Legal-Action-Labels
3. AP-03 – Counter-, Serverstatus- und aktionsbezogene Tooltips
4. AP-04 – Choice-/Run-Randpfade und Oberflächenregression

## Paketdetails

### AP-01 – Übersetzungsvertrag und Hardcoding-Inventar

- Ziel: Ein typisierter, framework-neutraler Präsentationskatalog deckt `de`, `en`, `fr` und englischen Fallback ab; das verbindliche In-Scope-Inventar ist testbar.
- Eingangsvoraussetzungen: Prozessartefakt committed, Worktree sauber.
- Konkrete Arbeit: Locale-Vertrag und Katalogstruktur erstellen; Action-, Counter-, Serverstatus-, Choice- und Run-Präsentation inventarisieren; Vollständigkeitstests ergänzen.
- Kernartefakte: `apps/web/i18n/action-presentation.ts`, zugehörige Tests und dieses Prozessartefakt.
- Tests/Checks: Katalogvollständigkeit für alle drei Locales, Fallbacktest, `git diff --check`.
- Done-Gate: Jede definierte semantische Katalogfunktion existiert in allen Sprachen; unbekannte Locale ergibt Englisch.
- Commit: `feat(i18n): define action presentation catalog`

### AP-02 – Primäre und kontextabhängige Legal-Action-Labels

- Ziel: Actionpanel, Kartenaktionen, Server-Runbuttons und Runfenster rendern Action-Beschriftungen in der aktiven Locale.
- Eingangsvoraussetzungen: AP-01 committed und sauber.
- Konkrete Arbeit: Locale durch alle produktiven Label-Aufrufer führen; Basisaktionen, Kosten, Run-Fortsetzungen, Zugriff, Install/Play/Rez/Score/Trash, Breaker- und strukturierte Kartenfähigkeiten lokalisieren; deutsche Freitext-Fallbacks aus nichtdeutschen Pfaden entfernen.
- Kernartefakte: `action-board-ui.ts`, `LegalActionsPanel.tsx`, `CardView.tsx`, `ActiveServerGrid.tsx`, Run-Komponenten und fokussierte Tests.
- Tests/Checks: Actionlabel-Matrix für `de`, `en`, `fr`; produktive Aufruferprüfung; `git diff --check`.
- Done-Gate: Die im Screenshot sichtbaren drei Basisaktionen und die direkt angrenzenden Actionpfade sind in allen drei Sprachen korrekt; Action-ID/Payload bleiben identisch.
- Commit: `feat(actions): localize legal action labels`

### AP-03 – Counter-, Serverstatus- und aktionsbezogene Tooltips

- Ziel: Counter- und Statusbadges zeigen ihre Hilfe in der aktiven Locale.
- Eingangsvoraussetzungen: AP-02 committed und sauber.
- Konkrete Arbeit: Counter-ID/Counter-Type- und Status-Kind-basierte Tooltiptexte lokalisieren; Locale an CardBadges, Identitäts-/Serverchips und ICE-Modifikatoren führen; Pattel’s Virus als Regression abdecken.
- Kernartefakte: `action-board-ui.ts`, `CardBadges.tsx`, betroffene Board-Komponenten und Tests.
- Tests/Checks: Tooltip-Matrix für `de`, `en`, `fr`, Pluralfälle und englischer Fallback, `git diff --check`.
- Done-Gate: Kein unterstützter Counter-/Serverstatus-Tooltip fällt in Englisch oder Französisch auf deutschen Fließtext zurück.
- Commit: `feat(tooltips): localize game status help`

### AP-04 – Choice-/Run-Randpfade und Oberflächenregression

- Ziel: Angrenzende Choice-, Kontexttitel-, Run-Status- und Hinweistexte innerhalb der Aktionsdarstellung sind konsistent lokalisiert.
- Eingangsvoraussetzungen: AP-03 committed und sauber.
- Konkrete Arbeit: strukturierte Choice-Optionen und aktionsbezogene Kontext-/Runtexte schließen; produktive Aufrufer auditieren; Prozessstatus und Ergebnisse dokumentieren.
- Kernartefakte: Action-/Choice-Komponenten, `action-board-ui.ts`, Übersetzungskatalog, fokussierte Oberflächen- und Quellenaudittests.
- Tests/Checks: direkt betroffene Webtests, i18n-Katalogcheck, Web-Typecheck soweit nicht durch unabhängige Baseline blockiert, `git diff --check`.
- Done-Gate: Produktive Actionflächen übergeben Locale; In-Scope-Hardcodings sind entfernt oder ausdrücklich kanonische Eigennamen; keine Submit-Semantik wurde verändert.
- Commit: `test(actions): cover localized presentation surfaces`

## Verifikationsregeln

- Pro Paket nur direkt änderungsnahe Tests und berührte Typoberflächen prüfen.
- Keine Engine-/AI-Breitläufe, da keine Regel- oder KI-Semantik geändert wird.
- Nach jedem Paket `git diff --check`, paketbezogenes Staging und eigener Commit.
- Tests müssen mindestens Deutsch, Englisch, Französisch und englischen Fallback belegen.
- Ein Quellenaudit prüft, dass produktive Action-/Tooltip-Aufrufer die aktive Locale übergeben.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/action-presentation-localization`
- Arbeits-Worktree: `C:\Projekte\NETGRID_ACTION_PRESENTATION_LOCALIZATION`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Umsetzung ausschließlich im Arbeits-Worktree; Hauptworkspace nur für finalen lokalen Merge.
- Vor Cleanup werden ignorierte Installations-/Buildreste im exakt verifizierten Worktree mit `git clean -ndx` geprüft und anschließend gezielt entfernt, damit kein pnpm-Restordner verbleibt.
- Final bevorzugt Fast-Forward nach lokalem `main`; kein Push und kein Pull Request.

## Controller-Prompt-Kern

`/Goal Arbeite die Lokalisierung der spielseitigen Aktionsdarstellung vollständig und sequenziell von AP-01 bis AP-04 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, die projektbezogene Wissensbasis und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_ACTION_PRESENTATION_LOCALIZATION auf Branch codex/action-presentation-localization. Nutze den Hauptworkspace nur für den finalen Merge. Arbeite nur am aktuellen Paket, prüfe direkt änderungsnah und committe jedes Done-Gate. Parse weder actionId noch deutsche Freitextlabels als fachliche Semantik. Bei Sicherheitsblocker stoppe mit Removal Condition. Integriere danach aktuelles main, verifiziere, merge lokal nach main und markiere das Goal erst nach nachgewiesenem Worktree- und Branch-Cleanup als complete.`

## Abschlusskriterien

- Primäre, kontextabhängige und Run-bezogene Actionlabels folgen der aktiven Locale.
- Counter-, Serverstatus- und aktionsbezogene Tooltips folgen der aktiven Locale.
- Direkt angrenzende Choice-/Kontexttexte der Aktionsdarstellung sind lokalisiert.
- Deutsch, Englisch und Französisch sind vollständig abgedeckt; unbekannte Locale fällt auf Englisch zurück.
- Keine Engine-, Action-ID-, Payload-, Match-, Replay- oder StateHash-Semantik wurde geändert.
- Alle vier Pakete sind fokussiert geprüft und separat committed.
- Branch ist lokal in `main` integriert; Worktree und Branch sind verifiziert entfernt.
