# Damage-Anzeige visuell vereinheitlichen

Status: Alle Pakete abgeschlossen, lokale Integration ausstehend

## Quelle und Zielprüfung

Der Nutzer möchte die normale Damage-Anzeige und die Damage-Stufe während
eines Karten-Zugriffs visuell vereinheitlichen. Der Endzustand ist ausreichend
präzise: Schaden belegt Karten-Segmente von links, verbleibende Handkarten
stehen unmittelbar links an einer klaren Flatline-Grenze, und eine beim
Zugriff regelkonform aufgedeckte Schadensquelle bleibt zusammen mit der
Damage-Anzeige sichtbar.

## /Goal

/Goal Arbeite die visuelle Vereinheitlichung der NETGRID-Damage-Anzeige
vollständig und sequenziell von Paket DVI-01 bis DVI-03 ab und merge den
abgeschlossenen Arbeitsbranch lokal nach `main`.

Lies zuerst `AGENTS.md`, `AGENTS.local.md`, die Pflichtseiten der
KI-Wissensbasis, `agents/small-adjustments-agent.md` und dieses Artefakt.
Arbeite ausschließlich im Worktree
`C:\Projekte\NETGRID-worktrees\damage-impact-visual-unification` auf Branch
`codex/damage-impact-visual-unification`. Nutze den Hauptworkspace nur für den
finalen lokalen Merge. Arbeite immer nur am aktuellen Paket, führe die
änderungsnahen Checks aus und committe jedes abgeschlossene Paket. Nach
Abschluss sind der saubere Arbeitsbranch lokal nach `main` zu integrieren,
`main` zu prüfen, der Worktree verifiziert zu entfernen und der gemergte
Arbeitsbranch zu löschen.

## Gesamtziel

- Die Anzahl der Karten im Runner-Grip vor dem Schaden wird als entsprechende
  Anzahl von Segmenten dargestellt.
- Verlorene Karten-Segmente beginnen links; verbleibende Karten-Segmente stehen
  rechts direkt an der Flatline-Grenze.
- Die bisherige Null-Markierung wird durch eine verständliche
  Flatline-Grenzmarkierung ersetzt.
- Normale Damage-Fenster und Access-/Ambush-Damage-Stufen verwenden dieselbe
  Meter-Komponente und Symbolsprache.
- Eine bereits öffentlich aufgedeckte Access-/Ambush-Karte bleibt über der
  Damage-Anzeige sichtbar.
- Verdeckte Kartenidentitäten werden niemals allein für die Anzeige
  offengelegt.

## Annahmen und Nicht-Ziele

- Damage-Regeln, Kartenauflösung, Trashkosten und Engine-Payloads bleiben
  unverändert.
- Bereits side-sicher projizierte Grip-Zahlen und öffentliche Kartenansichten
  sind die einzigen Datenquellen der Darstellung.
- Eine unbekannte Schadensquelle erhält keine Kartenabbildung und keine aus
  technischen Kennungen abgeleitete Identität.
- Kein Redesign anderer Access-, Chronicle-, Audio- oder Ergebnisfenster.
- Kein Eingriff in die auf den Standardports laufende Hauptinstanz.

## Controller-Invarianten und Sicherheitsblocker

- Die Rules Engine bleibt alleinige Regelautorität.
- `DamageImpactCue` darf nur side-sichere öffentliche Ergebnisdaten tragen.
- Eine Quellenkarte darf nur aus einer bereits sichtbaren `VisibleCard` oder
  aus der bestehenden öffentlichen Access-Reveal-Darstellung gerendert werden.
- Fehlen notwendige öffentliche Daten, wird ohne Karte weitergerendert; es wird
  keine verdeckte Identität erraten.
- Falls die Vereinheitlichung neue Engine- oder Hidden-Info-Felder verlangen
  würde, stoppt die Umsetzung vor dieser Erweiterung und dokumentiert den
  fachlichen Blocker.

## State Machine

`vorbereitet -> DVI-01 aktiv -> DVI-01 geprüft/committed -> DVI-02 aktiv ->
DVI-02 geprüft/committed -> DVI-03 aktiv -> DVI-03 geprüft/committed ->
main abgeglichen -> nach main integriert -> Worktree/Branch entfernt -> fertig`

Genau ein Paket ist aktiv. Ein roter Done-Gate-Test blockiert das nächste
Paket. Follow-ups erweitern den Scope nicht stillschweigend.

## Paketfolge

### DVI-01 – Gemeinsame Meter-Semantik

- Ziel: Eine wiederverwendbare Damage-Meter-Komponente mit links beginnendem
  Schaden und rechts verankerter Flatline-Grenze schaffen.
- Eingang: Bestehender `DamageImpactCue` und dessen side-sichere Grip-Werte.
- Arbeit: Segmentberechnung aus der Overlay-Komponente lösen, Reihenfolge
  `lost -> remaining -> flatline -> overkill` festlegen, zugängliche
  Flatline-Markierung und unbekannten Grip-Zustand berücksichtigen.
- Kernartefakte: `apps/web/features/actions/`,
  `apps/web/app/damage-impact-overlay.test.ts`, `apps/web/messages/`.
- Checks: fokussierte Damage-Komponententests und `git diff --check`.
- Done-Gate: Beispiele 3/2, 6/2, exakt tödlich, Overkill und unbekannter Grip
  sind im Test abgedeckt; keine Engine-Änderung.
- Commit: `feat(web): align damage meter with flatline boundary`

Abschluss 2026-08-29:

- Gemeinsame Meter-Komponente und separat testbare Segmentberechnung erstellt.
- Reihenfolge `lost -> remaining -> flatline -> overkill` umgesetzt.
- Flatline-Grenze mit Symbol, Text, Tooltip und zugänglicher Beschriftung
  ersetzt die visuelle Null.
- `corepack pnpm --filter @netgrid/web exec vitest run
app/damage-impact-meter.test.ts app/damage-impact-overlay.test.ts`: 10 Tests
  bestanden.
- Web-Typecheck ausgeführt; einziger gemeldeter Fehler ist der unabhängige
  Baseline-Fixture-Fehler in `app/ai-turn-plan-comparison-ui.test.ts`, dem die
  Felder `executionOrigin` und `selectedStep` fehlen. Dieser Scope verändert
  weder das Fixture noch den betreffenden AI-Vertrag.
- `git diff --check`: bestanden.

### DVI-02 – Normale und Access-Damage-Darstellung vereinheitlichen

- Ziel: Dieselbe Meter-Komponente in beiden Darstellungswegen verwenden.
- Eingang: DVI-01 abgeschlossen.
- Arbeit: Normales Overlay kompakt halten; Access-/Ambush-Karte während des
  öffentlichen Damage-Ergebnisses oberhalb beziehungsweise zusammen mit dem
  gemeinsamen Meter zeigen; bestehende Bestätigung und Queue-Semantik
  erhalten; responsive CSS anpassen.
- Kernartefakte: `DamageImpactOverlay.tsx`, `AccessReviewModals.tsx`,
  `globals.css` sowie die direkt angrenzenden Präsentationstests.
- Checks: Damage-, Layering- und Action-Cue-Tests; Web-Typecheck nur falls die
  Typoberfläche geändert wird; `git diff --check`.
- Done-Gate: Access-Ambush zeigt Karte und gemeinsames Meter; normales Damage
  zeigt dasselbe Meter ohne erzwungene Karte; Hidden-Info-Grenze bleibt
  testgesichert.
- Commit: `feat(web): unify access and standalone damage presentation`

Abschluss 2026-08-29:

- `AccessDamageStage` nutzt dieselbe `DamageImpactMeter`-Komponente wie das
  normale Damage-Fenster.
- Während eines Damage-Ergebnisses bleibt `reveal.card` sichtbar; die Karte
  stammt unverändert aus der bereits öffentlichen Access-Reveal-Darstellung.
- Das Damage-Layout ordnet die öffentliche Karte kompakt über dem gemeinsamen
  Meter an und wechselt danach zurück in den bisherigen Access-Ablauf.
- Flatline-Farbe und -Titel sind in beiden Varianten konsistent.
- `corepack pnpm --filter @netgrid/web exec vitest run
app/damage-impact-meter.test.ts app/damage-impact-overlay.test.ts
app/run-layering.test.ts app/action-cues.test.ts`: 69 Tests bestanden.
- Web-Typecheck erneut ausgeführt; weiterhin ausschließlich der dokumentierte,
  unabhängige Baseline-Fixture-Fehler in
  `app/ai-turn-plan-comparison-ui.test.ts`.
- `git diff --check`: bestanden.

### DVI-03 – Fokussierte Endverifikation und Prozessabschluss

- Ziel: Direkte Regressionen, responsive Darstellung und Integrationszustand
  verifizieren.
- Eingang: DVI-02 abgeschlossen.
- Arbeit: Fokussierte Tests erneut ausführen; wenn eine visuelle Browserprüfung
  nötig ist, ausschließlich auf freien Nicht-Standardports und mit isolierter
  SQLite-Datei arbeiten; Prozessartefakt nach Current-State-Regel entfernen.
- Checks: relevante Web-Tests, gegebenenfalls Web-Typecheck,
  `git diff --check`, sauberer Worktree.
- Done-Gate: Alle änderungsnahen Checks grün; keine Prozesse auf `3100` oder
  `8787` verändert; Prozessartefakt aus dem aktuellen Dokumentationsstand
  entfernt.
- Commit: `chore(web): verify unified damage presentation`

Abschluss 2026-08-29:

- Firefox-Prüfung mit den echten Komponenten auf dem isolierten Web-Port
  `3410` durchgeführt; Standardports `3100` und `8787` blieben unangetastet.
- Normale Ansicht geprüft: verlorene Segmente beginnen links, verbleibende
  Segmente stehen sichtbar direkt an der Flatline-Grenze.
- Access-Ansicht geprüft: bereits aufgedeckte Ambush-Karte bleibt oberhalb des
  identischen kompakten Meters sichtbar; Bestätigung passt ohne Scrollen in
  die Desktop-Ansicht.
- Visuell entdeckten Bestandsfehler behoben: Die undefinierte CSS-Variable
  `--success` machte verbleibende Segmente unsichtbar; Damage-Flächen nutzen
  nun das vorhandene Projekttoken `--ok`.
- Temporäre Vorschau-Routen, Screenshots, Playwright-Sitzung und separater
  Next-Cache wurden nach der Prüfung entfernt; Port `3410` wurde beendet.
- Finaler fokussierter Vitest-Lauf: 70 Tests bestanden.
- `node scripts/check-web-i18n.mjs`: 2301 Nachrichten über drei Locales und 64
  lokalisierte Oberflächen konsistent. Der Paket-Alias für denselben Check ist
  wegen seines bestehenden relativen CWD-Pfads nicht aus `apps/web` lauffähig;
  der Root-Aufruf ist grün.
- `git diff --check`: bestanden.

## Automatische Fehlerbehandlung

- Testfehler werden am verursachenden UI- oder Präsentationspfad behoben.
- Keine Ersatzwerte, technischen ID-Heuristiken oder `catch-and-continue`-
  Pfade zur Darstellung einer Quellenkarte.
- Bei Konflikten mit neuen `main`-Änderungen werden beide Intentionen gelesen
  und kompatibel zusammengeführt; ein abweichender Vertrag ist ein fachlicher
  Blocker.

## Integrations- und Abschlussregeln

- Kein Push und kein Pull Request.
- Vor dem Merge aktuelles `main` defensiv in den Arbeitsbranch integrieren,
  sofern `main` weitergelaufen ist.
- Nur direkt änderungsnahe Tests wiederholen.
- Arbeitsbranch bevorzugt per Fast-Forward nach `main` integrieren.
- Fremde offene Änderungen im Hauptcheckout bleiben unangetastet.
- Worktree erst nach erfolgreichem Merge und sauberem Status entfernen; Pfad
  und Git-Registrierung danach separat prüfen.
- Gemergten Branch mit `git branch -d` löschen.
