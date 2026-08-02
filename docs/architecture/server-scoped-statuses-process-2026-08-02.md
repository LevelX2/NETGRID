# Prozess: Serverbezogene Regelzustände

Status: SSP-01 bis SSP-04 verifiziert; lokale Integration und Cleanup ausstehend

Arbeitsbranch: `codex/server-scoped-statuses`

Worktree: `C:\Projekte\NETGRID_SERVER_SCOPED_STATUSES`

## Quelle und Zielprüfung

Ausgangspunkt ist die Nutzerentscheidung vom 2. August 2026: Auf einem Fort
sollen nur Zustände angezeigt werden, die eindeutig genau dieses Fort
betreffen. Dazu gehören insbesondere eine aktuelle Run-Sperre und
servergebundene Zusatzkosten. Die Quelle eines Effekts darf im Tooltip genannt
werden; Typen, Funktionen, Status-IDs und UI-Komponenten dürfen nicht nach
konkreten Karten benannt sein.

Die Vorgabe ist für eine direkte Umsetzung ausreichend präzise. Der bestehende
Stand bietet bereits eine generische Run-Start-Restriction und einen
serverbezogenen CounterDisplay für einen ICE-Installationskostenaufschlag. Die
Arbeit vereinheitlicht diese beiden öffentlichen Projektionen, ohne neue
Regelautorität oder neue Kartenlogik einzuführen.

## Gesamtziel

Öffentliche, aktuelle und eindeutig einem Server zugeordnete Regelzustände
werden über einen kleinen diskriminierten `VisibleServerStatus`-Vertrag in der
`PlayerView` projiziert und in einer gemeinsamen Statuszeile am Server
angezeigt. Der erste Vertrag umfasst:

- einen auf genau diesem Server geltenden Run-Start-Ausschluss;
- eine auf genau diesem Server geltende Erhöhung oder Ermäßigung der
  ICE-Installationskosten der Korp.

Kartenquellen bleiben deklarative Auslöser. Die Rules Engine bleibt alleinige
Autorität für LegalActions, Kosten und Run-Zulässigkeit.

## Annahmen

- Ein serverbezogener Status ist nur dann sichtbar, wenn sein Effekt aktuell
  aktiv, öffentlich und auf genau einen vorhandenen Server gebunden ist.
- Der öffentliche Titel einer bekannten Effektquelle darf im Tooltip zur
  Erklärung erscheinen. Er ist kein Funktions-, Typ- oder Statusname.
- Kostenmodifikatoren werden je Operation aggregiert. Mehrere Erhöhungen oder
  mehrere Ermäßigungen ergeben je einen Status mit der Summe und einer
  deterministisch sortierten Quellenliste.
- Eine gleichzeitige Erhöhung und Ermäßigung bleibt als zwei Zustände sichtbar,
  weil beide Regeln aktiv sind. Die exakten Kosten einer konkreten Installation
  stammen weiterhin aus der LegalAction und ihrer Engine-Kostenquote.
- Globale Modifikatoren ohne eindeutige Serverbindung werden nicht in dieser
  Fläche angezeigt.

## Nicht-Ziele

- Keine Änderung von Run-Zulässigkeit, Kostenrechnung oder Kartenregeln.
- Keine neue Action, kein clientseitiges Kosten- oder Legalitätsurteil.
- Keine Migration echter Fort-Counter wie Pox-, Spy- oder Virus-Counter in
  Statusobjekte.
- Keine allgemeine Darstellung aller denkbaren Kartenmodifier.
- Keine kartenspezifischen UI-Zweige oder Karten-ID-Filter.
- Keine Anzeige verdeckter Quellen oder anderer Hidden-Informationen.

## Controller-Invarianten

- `applyAction` und die LegalAction-Erzeugung bleiben unverändert die
  Regelautorität.
- `buildPlayerViewProjection` liest nur den aktuellen Engine-Zustand.
- Jeder Status trägt exakt eine `targetServerId` und erscheint ausschließlich
  an diesem Server.
- Statusvarianten sind über fachliche Semantik diskriminiert, nicht über
  Kartenidentitäten.
- Tooltips dürfen nur bereits öffentliche Quellinformationen verwenden.
- Die UI berechnet weder Run-Sperren noch Kostenmodifikatoren selbst.

## Automatische Fehlerbehandlung

- Nicht öffentliche, nicht aktive oder nicht eindeutig servergebundene
  Modifier werden nicht projiziert.
- Leere oder nicht positive Aggregationen erzeugen keinen Status.
- Unbekannte Statusvarianten werden durch TypeScript-Exhaustivität sichtbar;
  es gibt keinen kartenspezifischen Fallback.
- Rote Paketchecks werden im aktiven Paket behoben, bevor der Prozess
  fortgesetzt wird.

## Sicherheitsblocker

Ein Paket stoppt, wenn für die gewünschte Anzeige verdeckte Kartenidentitäten
offengelegt, Regelentscheidungen im Webclient dupliziert oder fremde offene
Änderungen überschrieben werden müssten. Die Removal Condition ist jeweils ein
öffentlicher Enginevertrag beziehungsweise ein konfliktfreier Integrationsweg.

## State Machine

`prepared -> shared_engine -> web -> verified -> merged -> cleaned`

Zu jedem Zeitpunkt ist genau ein Paket aktiv. Ein Zustandswechsel erfolgt erst
nach grünem Done-Gate und eigenem Commit.

## Paketfolge

### SSP-01 – Vertrag und Prozessartefakt

- Ziel: Scope, Invarianten und diskriminierten Statusvertrag festlegen.
- Eingang: aktueller `main`-Stand `00e87633c`.
- Arbeit: Ist-Stand prüfen; dieses Prozessartefakt erstellen; konkrete
  Varianten und Nicht-Ziele festhalten.
- Kernartefakt: dieses Dokument.
- Checks: Dokumentprüfung, `git diff --check`.
- Done-Gate: Vertrag ist kartengenerisch und grenzt Counter sowie globale
  Modifier ausdrücklich aus.
- Commit: `docs(architecture): define server-scoped status process`

### SSP-02 – Shared- und Engine-Projektion

- Ziel: `VisibleServerStatus` einführen und beide initialen Varianten aus den
  bestehenden Enginequellen projizieren.
- Eingang: SSP-01 abgeschlossen.
- Arbeit: Shared-Union ergänzen; bestehende Run-Restriction in den Vertrag
  überführen; öffentliche servergebundene ICE-Installationskostenmodifier aus
  Runner- und Korp-Quellen aggregieren; alten Kosten-Counter entfernen.
- Kernartefakte: `packages/shared/src/index.ts`, Engine-View- und
  Restriction-Dateien, Engine-Tests.
- Checks: fokussierte Shared-/Engine-Tests, Engine-Typecheck,
  `git diff --check`.
- Done-Gate: Run-Sperre, Aufschlag und Ermäßigung sind servergebunden,
  kartengenerisch und side-sicher projiziert; globale Modifier fehlen.
- Commit: `refactor(engine): project generic server statuses`

### SSP-03 – Einheitliche Webanzeige

- Ziel: Alle `VisibleServerStatus`-Varianten in einer gemeinsamen Statuszeile
  verständlich anzeigen.
- Eingang: SSP-02 abgeschlossen.
- Arbeit: alten Run-Restriction-Sonderpfad durch generische Statusableitung
  ersetzen; knappe Labels und erklärende Tooltips mit öffentlichen Quellen
  liefern; CSS und Tests anpassen.
- Kernartefakte: `apps/web/app/action-board-ui.ts`, Board-Komponenten,
  Webtests und CSS.
- Checks: fokussierte Webtests, Web-Typecheck, `git diff --check`.
- Done-Gate: kein Kartenname steckt in Typ-, Funktions-, Status-ID- oder
  Komponentenbezeichnungen; Quellen erscheinen nur erklärend im Tooltip.
- Commit: `refactor(web): render generic server statuses`

### SSP-04 – Review, Wissensrückführung und breite Verifikation

- Ziel: Umsetzung gegen den Vertrag prüfen und dauerhaft dokumentieren.
- Eingang: SSP-03 abgeschlossen.
- Arbeit: Final Review erstellen; Architektur-/Statuswissen aktualisieren,
  soweit der Stand wiederverwendbar ist; relevante breite Tests, Typechecks,
  Builds und Formatprüfung ausführen.
- Kernartefakte: Final Review, relevante Wissens-/Statusseiten.
- Checks: Engine- und Web-Gates mit mindestens 600 Sekunden äußerem
  Zeitfenster, `format:changed`, `git diff --check`.
- Done-Gate: Checks sind grün oder ein konkreter Blocker mit Removal Condition
  ist dokumentiert.
- Commit: `docs(review): close server-scoped status process`

### SSP-05 – Integration und Cleanup

- Ziel: Arbeitsstand lokal nach `main` integrieren und Arbeitsobjekte
  verifiziert entfernen.
- Eingang: SSP-04 abgeschlossen, Worktree sauber.
- Arbeit: aktuellen `main` in den Branch integrieren; relevante Checks nach
  Konfliktlösung wiederholen; bevorzugt Fast-Forward nach `main`; Main prüfen;
  Worktree und gemergten Branch entfernen.
- Checks: `git status --short`, `git diff --check`, Worktree-Liste und
  Dateisystemprüfung.
- Done-Gate: Änderungen liegen auf `main`; Worktree-Pfad und Branch existieren
  nicht mehr.

## Verifikationsregeln

- Fokussierte Testaufrufe erhalten mindestens 180 Sekunden äußeres Zeitfenster.
- Breite Package-, Typecheck- oder Build-Gates erhalten mindestens 600
  Sekunden.
- Tests sichern nicht nur Labels, sondern die servergenaue Bindung, öffentliche
  Quellen, Aggregation und den Ausschluss globaler Modifier.
- Nach jedem Paket laufen `git diff --check`, selektives Staging und ein eigener
  Commit.

## Worktree-, Git- und Integrationsregeln

Die Umsetzung erfolgt ausschließlich in
`C:\Projekte\NETGRID_SERVER_SCOPED_STATUSES` auf
`codex/server-scoped-statuses`. Der primäre Checkout wird nur für den finalen
lokalen Merge verwendet. Fremde Änderungen im primären Checkout bleiben
unangetastet. Es erfolgt kein Push.

## Controller-Prompt-Kern

`/Goal Arbeite den Prozess Serverbezogene Regelzustände vollständig und
sequenziell von SSP-01 bis SSP-05 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main. Lies AGENTS.md und dieses Prozessartefakt.
Arbeite ausschließlich im festgelegten Worktree, immer nur am aktuellen Paket,
führe Paketchecks aus und committe jedes abgeschlossene Paket. Erzeuge keine
kartenspezifische zweite Regelautorität. Nach erfolgreicher Endverifikation
merge lokal nach main, prüfe main und entferne Worktree sowie Branch
verifiziert. Markiere das Goal erst danach als complete.`

## Abschlusskriterien

- Ein gemeinsamer öffentlicher Serverstatus-Vertrag trägt die initialen
  Run- und Kostenvarianten.
- Projektion und UI sind servergenau, side-sicher und kartengenerisch.
- Bestehende Legalität und Kostenrechnung bleiben unverändert.
- Relevante Tests, Typechecks und Builds bestehen.
- Alle Pakete sind einzeln committed, lokal nach `main` integriert und der
  Arbeits-Worktree sowie der Branch sind verifiziert entfernt.
