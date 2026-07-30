# Vier KI-Folgearbeiten vor dem Shell-Traders-Planmodul

Status: in Umsetzung

Quelle:

- `data/local/match-5f7924-current-ai-vs-ai-einzelanalyse-2026-07-30.md`
- Nutzerfreigabe vom 2026-07-30, die vier Folgearbeiten vor dem
  Shell-Traders-Planmodul umzusetzen und separat nach `main` zu integrieren

## Gesamtziel

`/Goal Arbeite die vier reproduzierten Folgearbeiten aus dem aktuellen
Match-5F7924-Selfplay vollständig und sequenziell ab: Planbesitz für
Disgruntled Ice Technician, überlaufsichere Corp-Defense-Draws, konkrete
Runner-Suchbindung an Breaker-Lücken und Matchpoint-Vorrang für sichtbare
fortgeschrittene Remotes. Verifiziere jeden Schritt, committe jedes Paket,
merge den fertigen Branch lokal nach main und entferne Worktree und
Arbeitsbranch nachweislich. Beginne das Shell-Traders-Planmodul erst auf
diesem integrierten Main-Stand.`

Arbeitsbranch:
`codex/ai-followups-before-shell-traders`

Worktree:
`C:\Projekte\NETGRID_AI_FOLLOWUPS_BEFORE_SHELL_TRADERS`

## Zielprüfung

Der Auftrag ist präzise genug:

- Die vier Fehlerklassen sind durch einen vollständigen aktuellen Selfplay
  und zwei fail-closed Abbruchzustände belegt.
- Die fachlichen Zielzustände folgen aus dem produktiven Plan-first-,
  Coverage-, Commitment- und Dirigentenvertrag.
- Die Reihenfolge ist vorgegeben: Diese vier Arbeiten werden vor dem
  Shell-Traders-Modul integriert.

## Annahmen

- Der vorhandene vollständige Lauf auf Git-Stand `d31a83feb` bleibt die
  qualitative Ausgangsevidence.
- Reproduzierbare aktuelle Engine-Zustände oder eng äquivalente
  Decision-Checkpoints dürfen die lokalen Rohprotokolle als Testfixture
  ersetzen.
- `Disgruntled Ice Technician` gehört als gebundene Run-Fortsetzung in ein
  bestehendes Runner-Run-/Conversion-Planmodul; dieses Paket führt kein
  kartennamenspezifisches Sondermodul ein.

## Nicht-Ziele

- Kein Shell-Traders-Planmodul in diesem Arbeitsbranch.
- Keine Abschwächung von `productive_action_without_owner` oder
  `missing_plan_module_coverage`.
- Keine allgemeine „immer suchen“, „immer contesten“ oder „nie bei voller
  Hand ziehen“-Regel.
- Keine ICE-, Defense- oder Rez-Sonderlogik außerhalb der zuständigen
  Corp-Planmodule.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Die Engine und ihre aktuellen `LegalActions` bleiben alleinige
  Regelautorität.
- Jede produktive Aktion benötigt genau einen aktuellen Planmodul-Besitzer
  oder eine explizite, begründete Nichtproduktiv-/Unknown-Disposition.
- Konkrete Karten-, Server-, Ability- und Action-IDs dürfen innerhalb eines
  Plans gebunden werden.
- Informationsgrenzen und materielle Zustandsänderungen erzwingen
  Rematerialisierung beziehungsweise Neuplanung.
- Der Zugdirigent priorisiert Planlinien; Fachmodule behalten die
  Detailbewertung.
- Die private Betreiber-Buganzeige darf und soll vollständige Karten beider
  Seiten und vollständige Planinformationen zeigen.

## Automatische Fehlerbehandlung

- Zuerst wird jeder Zielvertrag als fokussierter Regressionstest gebunden.
- Fixture- oder LegalAction-Drift wird getrennt von Verhaltenskorrekturen
  behoben.
- Rote Checks blockieren das nächste Paket.
- Breite Regressionen werden am engsten verantwortlichen Planvertrag
  korrigiert; Erwartungen werden nicht pauschal abgeschwächt.

## Sicherheitsblocker

Der Prozess stoppt ohne Fallback, wenn:

- eine produktive Aktion weiterhin ohne eindeutigen Owner bleibt;
- die Lösung Hidden Information außerhalb der privaten Buganzeige benötigen
  würde;
- Engine-, Replay-, StateHash-, LegalAction- oder Side-Safety-Verträge
  regressieren;
- fremde Änderungen beim Main-Merge nicht verlustfrei integrierbar sind.

## State Machine

`PREPARED -> RUN_FOLLOWUP_OWNER -> CORP_DRAW_CAPACITY ->
RUNNER_SEARCH_BINDING -> MATCHPOINT_CONDUCTOR -> VERIFIED -> MERGED -> CLEANED`

Genau ein Paket ist aktiv. Aktueller Zustand: `PREPARED`.

## Paketfolge

### F0 – Prozess und Preflight

Ziel:

- Scope, Reihenfolge, Invarianten und Integrationsvertrag fixieren.

Checks:

- `git status --short --branch`
- `git diff --check`

Done-Gate:

- Prozessartefakt committed, Worktree sauber.

Commit:

- `docs(ai): define pre-shell followup process`

### F1 – Planbesitz für Disgruntled-Ice-Technician-Fortsetzung

Ziel:

- Die legale produktive Post-Pass-Derez-Aktion erhält einen eindeutigen
  Runner-Planowner und kann den Selfplay nicht mehr fail-closed abbrechen.

Arbeit:

- Die konkrete LegalAction semantisch als gebundene Run-Fortsetzung
  klassifizieren.
- Owner-, Horizont- und Coverage-Vertrag des passenden Runner-Moduls
  erweitern.
- Positive Derez- und begründete Ablehnungsfälle abdecken.
- Fehlender oder konkurrierender Owner bleibt ein harter Fehler.

Checks:

- fokussierte Runner-Plan-/Coverage-/Cutover-Tests
- `@netgrid/ai` Typecheck

Done-Gate:

- Die reproduzierte Aktion besitzt genau einen Owner; Negativfälle bleiben
  explizit dispositioniert.

Commit:

- `fix(ai): own runner post-pass derez followups`

### F2 – Überlaufsicherer Corp-Defense-Draw

Ziel:

- Ein Defense-Draw darf keine vorhersehbare Agenda-Abwurflinie erzeugen,
  wenn eine sinnvolle sofortige Handkonvertierung legal ist.

Arbeit:

- Exakte Handkapazität, sichtbare Agendaexposition und aktuelle
  installierbare Defense-Konversion in den Defense-Plan einbeziehen.
- Die konkrete Defense-Installation bleibt qualitativ bewertet; es entsteht
  keine Always-Install-Regel.
- Draw bleibt bei vorhandener Kapazität oder besserer tatsächlicher
  Suchnotwendigkeit zulässig.

Checks:

- Match-5F7924-Decision-Checkpoint
- Corp-Defense-, Draw-, Hand- und Turn-Planner-Tests

Done-Gate:

- Der reproduzierte Draw vor Agenda-Abwurf verliert gegen die zertifizierte
  Defense-Konversion; Gegenproben bleiben grün.

Commit:

- `fix(ai): prevent defense draws from forcing agenda discard`

### F3 – Konkrete Runner-Suchbindung

Ziel:

- Legale Search-/Recovery-Aktionen werden an die tatsächlich fehlende
  Breaker-Klasse und den betroffenen Server gebunden.

Arbeit:

- Widersprüchliche „kein Bedarf“-/„kein Ziel“-Dispositionen beseitigen.
- Planproposal, Choice und Fortsetzung mit konkreter Action-, Source-,
  Coverage- und Serverbindung rematerialisieren.
- Ohne echte Lücke oder passende Antwort bleibt die Suche ablehnbar.

Checks:

- Runner-Coverage-, Search-Choice-, Plan- und Cutover-Tests
- Match-5F7924-Decision-Checkpoint

Done-Gate:

- Die reproduzierten Suchaktionen sind bei echter Lücke ausführbar und
  ownergebunden; unpassende Sucher werden nicht künstlich priorisiert.

Commit:

- `fix(ai): bind runner searches to concrete breaker gaps`

### F4 – Matchpoint-Score-Threat im Zugdirigenten

Ziel:

- Ein sichtbares fortgeschrittenes Remote mit möglichem gegnerischem
  Matchpoint verdrängt generische Economy, sobald eine konkrete
  Search-/Recovery-/Contest-Linie legal und finanzierbar ist.

Arbeit:

- Das vorhandene Score-Threat-Signal an die konkrete Runner-Planlinie
  binden.
- Planvarianten bis zur nächsten Informations- oder Engine-Grenze
  vergleichen.
- Economy bleibt Unterstützung des Contest-Plans, erhält aber oberhalb der
  benötigten Reserve keine eigene Autorität.

Checks:

- Match-5F7924-Endgame-Checkpoint
- Runner-Contest-, Economy-, Scheduler-, Commitment- und Cutover-Tests

Done-Gate:

- Die Entscheidungen 314/315 wählen keine bedeutungslosen Basis-Credits
  mehr; nicht erreichbare Remotes erzeugen keine Always-Contest-Regel.

Commit:

- `fix(ai): prioritize executable matchpoint remote answers`

### F5 – Gesamtverifikation und Abschluss

Ziel:

- Alle vier Korrekturen gemeinsam abnehmen und den dauerhaften Stand
  dokumentieren.

Checks:

- alle neuen fokussierten Tests
- vollständige `@netgrid/ai`-Suite
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm check:ai`
- `corepack pnpm check:package-boundaries`
- `git diff --check`

Done-Gate:

- Alle Pflichtchecks grün und Abschlussreview erstellt.

Commit:

- `docs(ai): close pre-shell followup remediation`

### F6 – Integration und Cleanup

Ziel:

- Arbeitsbranch lokal nach `main` integrieren und Arbeitsressourcen
  nachweislich entfernen.

Done-Gate:

- `main` enthält alle Paketcommits und ist sauber.
- Worktree fehlt in Git-Liste und Dateisystem.
- Der gemergte Arbeitsbranch ist gelöscht.

## Abschlusskriterien

- Alle vier Fehlerklassen besitzen fokussierte Regressionsevidence.
- Keine produktive Derez-Fortsetzung bleibt ohne Owner.
- Defense-Draw, konkrete Coverage-Suche und Matchpoint-Contest werden durch
  ihre Fachpläne bewertet und vom Dirigenten kohärent priorisiert.
- Fail-closed, LegalAction-, Replay- und Hidden-Info-Verträge bleiben
  unverändert stark.
- Der Branch ist lokal nach `main` integriert und vollständig bereinigt.
