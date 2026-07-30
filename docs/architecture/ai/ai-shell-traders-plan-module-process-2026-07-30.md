# KI-Planmodul für The Shell Traders

Status: vorbereitet

Quelle:

- Nutzerauftrag vom 2026-07-30, nach Integration der vier vorgelagerten
  KI-Folgearbeiten ein eigenes Shell-Traders-Planmodul umzusetzen
- `docs/releases/v1/v1-9-originalset-completion/v1-9-12-counter-virus-recurring/shell-traders-completion-review.md`
- `docs/reviews/ai/ai-shell-traders-full-test-gate-2026-06-23.md`
- integrierter Main-Stand `2ac7fa435`

## Gesamtziel

`/Goal Implementiere The Shell Traders als eigenes deck- und
kartenpräsenzgebundenes Runner-Planmodul. Das Modul plant konkrete
Set-Aside-Ziele, Shell-Counter-Fortschritt, mehrere installierte
Shell-Traders-Kopien, die verpflichtende Startzugwahl, kostenlose
Auto-Installation und notwendige MU-/Programm-Ersetzungen als zusammenhängende
Pipeline. Es meldet dem Zugdirigenten Dringlichkeit und Wert, übernimmt aber
nicht selbst das Kommando. Ohne The Shell Traders im eigenen Deck, Rig oder
öffentlichen eigenen Set-Aside-Zustand darf das Modul keinen Einfluss haben.
Fail-closed-, LegalAction-, Replay-, StateHash- und Choice-Revalidierung
bleiben unverändert stark. Verifiziere paketweise, committe jeden Schritt,
merge den fertigen Branch lokal nach main und entferne Worktree und
Arbeitsbranch nachweislich.`

Arbeitsbranch:
`codex/ai-shell-traders-pipeline`

Worktree:
`C:\Projekte\NETGRID_AI_SHELL_TRADERS_PIPELINE`

## Ausgangslage

- Die Engine bildet den Kartenvertrag bereits vollständig über
  `delayedInstallAbility` ab:
  `set_aside_from_grip`, `remove_shell_counter`, öffentliche Shell-Counter,
  kostenlose Installation und bei MU-Mangel eine verpflichtende
  `delayed_install_memory`-Choice.
- Die KI kennt einzelne Shell-Traders-Helfer und bewertet
  Set-Aside-Aktionen teilweise als generische persistente
  Handentwicklung beziehungsweise Coverage-Support.
- `shellTradersTargetValue` und `shellTradersDirectInstallUrgency` sind in
  Produktion nicht an einen eigenen Planbesitzer angeschlossen.
- Die Startzugwahl sortiert aktuell primär nach niedrigster verbleibender
  Counterzahl und Programmbias. Sie bewertet weder konkrete Coverage-Lücken
  noch den MU-/Ersatzbedarf des bevorstehenden Auto-Installs.
- Dadurch fehlt eine zusammenhängende Pipeline: Vorbereitung, mehrzügiger
  Fortschritt, mehrere Quellen, Zielwert, Fertigstellungszeitpunkt und
  notwendige Rig-Ersetzung werden nicht durch denselben Fachplan beurteilt.

## Zielarchitektur

Das neue Modul `runner.shell_traders_pipeline` veröffentlicht genau gebundene
Planinstanzen je vorbereitetem Ziel beziehungsweise je neuer
Vorbereitungsoption.

Jede Instanz bindet mindestens:

- Shell-Traders-Quellinstanz und aktuelle LegalAction;
- Zielkarteninstanz und Definition;
- Phase `prepare`, `progress`, `complete_or_replace` oder `hold`;
- aktuelle Shell-Counter und erwartete Restschritte;
- Zielrollen und gegebenenfalls konkrete Breaker-Coverage-Lücke samt Server;
- aktuellen MU-Bedarf, freie MU und zulässige Ersatzkandidaten;
- Prioritätsklasse, Wert, Evidenz und Replan-Grenze.

Der Zugdirigent vergleicht diese Pipeline mit Coverage, Run, Defense,
Economy und Handentwicklung. Das Fachmodul liefert die Detailbewertung, darf
aber keine Scheduler-Sonderautorität erhalten.

## Invarianten

- Nur aktuelle `LegalActions` werden materialisiert; Action-, Source-,
  Target-, StateVersion- und Choice-Bindungen werden erneut geprüft.
- Das Modul ist deaktiviert, wenn weder eine eigene installierte
  `The Shell Traders`-Instanz noch ein eigener dazugehöriger öffentlicher
  Set-Aside-Zustand existiert. Reine Deckkenntnis erzeugt ohne aktuelle Route
  keinen Plan.
- Vorbereitungen werden nicht als generische Economy oder Recurring Credits
  klassifiziert.
- Ein echter, konkret adressierter Breaker-Gap darf hohe Dringlichkeit
  erzeugen. Redundante Breaker oder wertarme Ziele bleiben ablehnbar.
- Counter-Fortschritt ist kein Selbstzweck. Ein letzter Counter darf nur
  aktiv entfernt werden, wenn der Zielinstall und ein gegebenenfalls
  notwendiger Programmtrash qualitativ vertretbar sind oder eine
  verpflichtende Engine-Choice keine Alternative lässt.
- Mehrere Shell-Traders-Kopien werden als parallele
  Fortschrittskapazität modelliert; dieselbe Quelle und dasselbe Ziel dürfen
  innerhalb einer Entscheidung nicht doppelt verbraucht werden.
- Informations- und Zufallsgrenzen lösen Neuplanung aus. Eine
  Set-Aside-Auflösung, Startzugwahl, Auto-Installation oder MU-Choice ist
  eine materielle Beobachtungsgrenze.
- Die private Betreiber-Buganzeige darf vollständige Karten beider Seiten
  sowie vollständige Plan-, Ziel-, Counter- und MU-Bindungen anzeigen.
- `productive_action_without_owner` und `missing_plan_module_coverage`
  bleiben harte Fehler und werden nicht durch Baseline-Automatismen
  verdeckt.

## Nicht-Ziele

- Keine Änderung des fachlich bereits korrekten Engine-Kartenvertrags, sofern
  ein reproduzierter KI-Test keine Engine-Lücke beweist.
- Keine generische Sonderregel „immer Shell Traders benutzen“.
- Kein kartennamenspezifischer Bypass außerhalb des neuen Planmoduls und
  seiner schmalen Domain-/Choice-Adapter.
- Keine Rückwärtskompatibilitätsarbeit für alte lokale Replays oder Payloads
  jenseits des bereits vorhandenen `shellTradersAbility`-Lesefallbacks.
- Kein Start eines Worktree-Servers, kein Zugriff auf Standardports oder die
  Main-SQLite.
- Kein Push und kein Pull Request.

## State Machine

`PREPARED -> DOMAIN_AND_OWNER -> TARGET_AND_MU_POLICY ->
CONDUCTOR_AND_DEBUG -> VERIFIED -> MERGED -> CLEANED`

Genau ein Paket ist aktiv. Aktueller Zustand: `TARGET_AND_MU_POLICY`.

## Paketfolge

### S0 – Prozess und Preflight

Ziel:

- Scope, Invarianten, Planphasen, Reihenfolge und Integrationsvertrag
  festschreiben.

Checks:

- sauberer Worktree auf integriertem `main`;
- `git diff --check`.

Done-Gate:

- Prozessartefakt committed.

Commit:

- `docs(ai): define Shell Traders plan process`

### S1 – Domainvertrag und eindeutiger Planbesitzer

Ziel:

- `set_aside_from_grip` und `remove_shell_counter` erhalten einen eindeutigen
  Besitzer `runner.shell_traders_pipeline`.

Arbeit:

- typisierten Domainvertrag für Quelle, Ziel, Phase, Counter, Rollen,
  Coverage und MU einführen;
- Modul registrieren und nur aus aktuellen, exakt gebundenen
  Shell-Traders-LegalActions entdecken;
- generische Development-/Coverage-Besitzer für dieselben Aktionen
  ausschließen oder ausdrücklich delegieren;
- positive und negative Deck-/Rig-/Set-Aside-Gates testen.

Done-Gate:

- Jede produktive Shell-Traders-Aktion besitzt genau einen Owner; ohne
  aktuelle Shell-Traders-Route entsteht kein Modulvorschlag.

Commit:

- `feat(ai): own Shell Traders delayed install pipeline`

Ergebnis:

- `runner.shell_traders_pipeline` besitzt die exakt gebundenen
  Vorbereitungs- und Counter-Aktionen.
- Quelle, Ziel, LegalAction, Counter, Coverage und MU sind Teil des
  typisierten Domainvertrags.
- Generische Handentwicklung lässt diese Aktionen aus; abgelehnte
  Fertigstellungen bleiben ausdrücklich beim Fachmodul.
- Positive und negative Modul-/Signalgates sind grün.

### S2 – Ziel-, Counter- und MU-/Ersatzpolitik

Ziel:

- Die Pipeline wählt Ziele und Fortschritt qualitativ statt nur nach
  niedrigster Counterzahl.

Arbeit:

- konkrete Coverage-Lücken und Server an passende Breaker binden;
- direkte Installation, verzögerte Installation, Restcounter,
  Handentlastung und Fertigstellungszeitpunkt vergleichen;
- mehrere Shell-Traders-Quellen und mehrere Set-Aside-Ziele deterministisch
  bewerten;
- Startzugchoice und bezahlte Counter-Aktion auf dieselbe Zielbewertung
  führen;
- MU-Fit und möglichen Programmtrash vor dem letzten Counter bewerten;
  kritische installierte Coverage nicht für eine schlechtere Variante
  opfern.

Done-Gate:

- Breaker-Lücken, redundante Ziele, Mehrfachquellen, letzte Counter,
  volle MU und sinnvolle Breaker-Ersetzung besitzen positive und negative
  Regressionen.

Commit:

- `feat(ai): plan Shell Traders targets and rig replacement`

Ergebnis:

- Die Startzugwahl vergleicht konkrete vorbereitete Ziele nach fehlender
  Breaker-Coverage, Zielwert, Restcountern, Fertigstellung und MU-Risiko.
- Eine Fertigstellung, die nur durch Verlust eines einzigartigen anderen
  Breakers möglich wäre, verliert gegen eine sichere sinnvolle Alternative.
- Die verpflichtende Shell-Traders-MU-Choice verwendet die bestehende
  qualitative Minimalersatzpolitik mit der vorbereiteten Karte als
  tatsächlichem Installationsziel.
- Mehrere Quellen und Ziele bleiben über Source-, Target- und Choice-IDs
  getrennt und werden nach jeder Choice aus dem neuen Zustand neu bewertet.

### S3 – Zugdirigent, Replan und Buganzeige

Ziel:

- Der Zugdirigent kann die Pipeline kohärent mit anderen Plänen vergleichen
  und die private Buganzeige macht die Entscheidung prüfbar.

Arbeit:

- Prioritätsklassen für akute Coverage, nützlichen Setup-Fortschritt und
  optionales Halten definieren;
- Commitments nur bis zur nächsten materiellen Informations-/Choice-Grenze
  halten und danach rematerialisieren;
- Debugdaten für Quelle, Ziel, Phase, Counter, Coverage, MU,
  Ersatzentscheidung und Replan-Grund ausgeben;
- sicherstellen, dass generische Economy/Run-Pläne eine akute gebundene
  Pipeline nicht unbegründet verdrängen und umgekehrt.

Done-Gate:

- Runtime-/Scheduler-/Commitment-/Debug-Regressionen sind grün; die
  Betreiberansicht kann die vollständige Pipeline nachvollziehen.

Commit:

- `feat(ai): conduct and expose Shell Traders plans`

### S4 – Gesamtverifikation und Integration

Checks:

- alle fokussierten Shell-Traders-, Choice-, Coverage-, MU-, Scheduler- und
  Debugtests;
- vollständige `@netgrid/ai`-Suite;
- `corepack pnpm --filter @netgrid/ai typecheck`;
- `corepack pnpm check:ai`;
- `node scripts/check-package-boundaries.mjs`;
- `git diff --check`.

Done-Gate:

- alle Pflichtchecks grün;
- Abschlussreview dokumentiert;
- Branch lokal nach `main` integriert;
- Worktree und gemergter Arbeitsbranch entfernt.

Commit:

- `docs(ai): close Shell Traders plan process`

## Automatische Fehlerbehandlung

- Jeder Paketvertrag wird zuerst durch fokussierte positive und negative
  Regressionen gebunden.
- Fixture-/LegalAction-Drift wird von Verhaltensänderungen getrennt.
- Eine fehlende Planabdeckung wird am zuständigen Modul behoben und nicht
  durch Fallback oder Disposition verschleiert.
- Breite Regressionen werden an der engsten verantwortlichen
  Domain-/Prioritätsgrenze korrigiert.
- Rote Pflichtchecks blockieren Integration und Cleanup.

## Abschlusskriterien

- `runner.shell_traders_pipeline` besitzt Vorbereitung und Fortschritt
  eindeutig.
- Ziele, Counter, Mehrfachquellen, MU und Ersetzung werden zusammenhängend
  bewertet.
- Akute Coverage gewinnt gegen generische Economy, ohne eine
  Always-Shell-Traders-Regel einzuführen.
- Ohne aktuelle Shell-Traders-Route bleibt das übrige KI-Verhalten
  unverändert.
- Plan-first-, Fail-closed-, Choice-, LegalAction-, Replay- und
  StateHash-Verträge bleiben stark.
- Der Branch ist lokal nach `main` integriert und vollständig bereinigt.
