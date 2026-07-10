# Corp-Score-Conversion-Plan: Umsetzungsprozess

## Status

- Status: in Umsetzung
- Datum: 2026-07-10
- Primärer Agent: `release-implementation-agent`
- Arbeitsbranch: `codex/corp-score-conversion-plan`
- Worktree: `C:\Projekte\NETGRID_CORP_SCORE_CONVERSION_PLAN`
- Integrationsbranch: lokales `main`

## Quelle und Vorgabe

Die Corp-KI soll eine Agenda nicht nur über den bisherigen geschützten
Remote-Scorepfad, sondern alternativ über einen vollständig finanzierbaren und
deterministischen Same-Turn-Conversion-Pfad scoren können. Der Pfad darf
normale Advances, direkte Advancement-Counter-Platzierung,
Advancement-Counter-Transfer, Aktionsgewinn und Kombinationen dieser
Fähigkeiten verwenden. Alle aktuell freigegebenen Karten, die solche
Fähigkeiten bereitstellen oder deren Zielwert verändern, werden gegen ihren
Engine-, LegalAction-, Hint- und Planvertrag geprüft.

## Zielprüfung

Die Vorgabe ist für eine automatische sequenzielle Umsetzung ausreichend
präzise. Der vorhandene Plan `corp.create_score_window` bleibt die gemeinsame
Scoreplan-Hülle. Die Umsetzung ergänzt darin einen alternativen
`ScorelineConversionPath`; es entsteht kein konkurrierender zweiter
Scorecontroller.

## Gesamtziel

Die Semantic Runtime erkennt aus Corp-sichtbaren Karten, LegalActions und
expliziter Aktionssemantik vollständige Same-Turn-Pfade von einer Agenda in HQ
oder im Server bis zur legalen `score_agenda`-Aktion. Ein solcher Pfad bindet
Agenda, Server, benötigte Counter, Aktionsbudget, Credits und verwendbare
Conversion-Fähigkeiten. Nur ein vollständig erreichbarer Pfad darf die
Sicherheitsstrafe für eine ungeschützte Agenda-Installation aufheben.

## Annahmen

- `score_agenda` kostet gemäß aktuellem Enginevertrag keinen Klick.
- Die Corp darf ausschließlich eigene sichtbare Informationen,
  side-gefilterte PublicEvents, LegalActions und erlaubte Metadaten nutzen.
- Die Engine bleibt alleinige Regelautorität. Hints dürfen keine Kosten,
  Beträge, Ziele oder Legalität ersetzen.
- Same-Turn-Closeout hat Vorrang. Mehrturnige Vorbereitung darf Ressourcen
  aufbauen, aber keine ungeschützte Agenda ohne garantierten Abschluss
  installieren.
- Die Suche bleibt klein, deterministisch und auf Score-Conversion begrenzt;
  sie ist kein allgemeiner Game-Tree-Search.

## Nicht-Ziele

- keine Karten-ID-Sonderlogik für Vapor Ops oder einzelne Operations;
- keine Änderung der NETGRID-Regeln oder Kartenfreischaltung;
- kein FullGameState im AI-Paket;
- keine allgemeine Combo-Engine für beliebige Kartenfolgen;
- kein Remote-Push und keine Pull Request-Erstellung;
- keine Änderungen an fremden offenen Hauptworkspace-Artefakten.

## Controller-Invarianten

1. Jede gewählte Aktion ist eine aktuelle LegalAction.
2. `applyAction` validiert jeden tatsächlichen Schritt erneut.
3. Der Plan erzeugt keine hypothetische LegalAction.
4. Zukünftige Schritte werden nur aus side-sicheren Capability-Projektionen
   abgeleitet und nach jeder Zustandsänderung neu gegen LegalActions gemappt.
5. Kosten, Beträge, Timing und Zielbeschränkungen stammen aus standardisierten
   Engine-/LegalAction-Payloads.
6. Hints liefern Strategieanker, Rollen und Prioritäten, nicht Regelwirkung.
7. Agenda- und Serverbindung bleiben über die gesamte Sequenz konsistent.
8. Reservierte Counter, Credits, Karten und Aktionen werden nicht durch einen
   konkurrierenden Cashout verbraucht, solange der Closeoutpfad gültig ist.
9. Fällt eine Voraussetzung weg, wird neu geplant oder sicher abgebrochen.
10. Hidden-Info-, Replay-, StateHash- und Determinismusverträge bleiben
    unverändert gültig.

## Automatische Fehlerbehandlung

- Fehlt eine standardisierte Capability, wird die Aktion nicht als
  Conversion-Schritt verwendet; der Audit meldet die Lücke.
- Ist nach einem ausgeführten Schritt kein passender Folgepfad mehr
  erreichbar, wird der Plan neu berechnet und nicht blind fortgesetzt.
- Stimmen Hint und Enginevertrag nicht überein, gewinnt die Engine; der Audit
  schlägt fehl.
- Ein optionaler Optimierungspfad darf nie den sicheren bestehenden
  Remote-Scorepfad blockieren.
- Paketchecks bleiben rot, bis die Ursache eng behoben oder als echter
  Sicherheitsblocker dokumentiert ist.

## Sicherheitsblocker

Die Umsetzung stoppt bei einem der folgenden Punkte:

- eine erforderliche Capability verlangt Zugriff auf Runner-Hidden-Info;
- ein zukünftiger Pfad kann nur durch erfundene oder nicht legal ableitbare
  Aktionen dargestellt werden;
- LegalAction-Payloads würden private Kartenidentitäten öffentlich leaken;
- ein Enginevertrag müsste zugunsten der KI abgeschwächt werden;
- ein Mergekonflikt definiert denselben AI-/Enginevertrag fachlich
  widersprüchlich.

## State Machine

```text
idle
  -> candidate_found
  -> path_feasible
  -> resources_reserved
  -> install_target
  -> gain_action_capacity / place_counter / move_counter / basic_advance
  -> score_ready
  -> score_agenda
  -> satisfied

Jeder Übergang kann über revalidate nach idle, blocked oder alternative_path
wechseln.
```

## Paketfolge

| Paket | Titel                           | Ergebnis                                               |
| ----- | ------------------------------- | ------------------------------------------------------ |
| P0    | Prozess und Worktree            | verbindlicher Prozess, Branch und Goal                 |
| P1    | Capability-Vertrag und Inventar | vollständige Taxonomie und Kartenmatrix                |
| P2    | LegalAction-Semantik            | standardisierte ausführbare Capability-Payloads        |
| P3    | Hint-Audit                      | Engine-/Hint-Konsistenz und automatische Gates         |
| P4    | Pfadberechnung                  | ressourcenbasierter deterministischer Same-Turn-Solver |
| P5    | Scoreplan-Integration           | alternativer Pfad in `corp.create_score_window`        |
| P6    | Choice und Reservierung         | zielgebundene Auswahl und Schutz geplanter Ressourcen  |
| P7    | Szenarien und Regression        | Familien-, Mischpfad- und Negativabdeckung             |
| P8    | Abschlussintegration            | Full Gates, Main-Abgleich, lokaler Merge und Cleanup   |

## Paketdetails

### P0 – Prozess und Worktree

- Ziel: Ausführungspfad verbindlich festlegen.
- Eingang: Nutzerfreigabe zur direkten Umsetzung.
- Arbeit: Worktree/Branch anlegen, Prozessartefakt und `/Goal` schreiben.
- Kernartefakt: dieses Dokument.
- Checks: `git status --short --branch`, `git diff --check`.
- Done-Gate: sauberer Paketcommit auf dem Arbeitsbranch.
- Commit: `docs(ai): define corp score conversion process`

### P1 – Capability-Vertrag und vollständiges Inventar

- Ziel: Eine kartenunabhängige Score-Conversion-Taxonomie definieren.
- Eingang: P0 abgeschlossen.
- Arbeit:
  - Capability-Arten `install_score_target`, `gain_action_capacity`,
    `place_advancement`, `move_advancement`, `basic_advance` und
    `score_ready` modellieren;
  - aktuelle Karten mit Counterplatzierung, Countertransfer,
    Counterbanken, sofortigem und wiederkehrendem Aktionsgewinn sowie
    Overadvance-Zielen inventarisieren;
  - Beträge, Kosten, Timing, Quell-/Zielbeschränkungen, Wiederholbarkeit und
    Rez-Voraussetzungen erfassen;
  - Verantwortungsgrenze zwischen Enginevertrag, ActionSemanticCandidate,
    Hints und TacticalPlan dokumentieren.
- Kernartefakte: AI-Architekturdokument, Capability-Typen oder abgeleitete
  Facts-Tests.
- Checks: paketnahe Contract-/TypeScript-Tests, `git diff --check`.
- Done-Gate: jede relevante aktuelle Engine-Fähigkeit ist genau einer
  Capability oder einem ausdrücklich ausgeschlossenen Typ zugeordnet.
- Commit: `docs(ai): define score conversion capability contract`

### P2 – Standardisierte Engine-/LegalAction-Semantik

- Ziel: Der Plan kann regelrelevante Zahlen ausschließlich aus LegalActions
  lesen.
- Eingang: P1-Vertrag ist stabil.
- Arbeit:
  - Advancement-Platzierung und -Transfer mit einheitlichen Feldern für
    Betrag, Modus, Quelle, Zielraum und Kosten versehen;
  - sofortigen Aktionsgewinn als Netto-Aktionskapazität ausweisen;
  - transferierbare Ziele unabhängig von bezahlbaren Basic-Advance-Aktionen
    side-sicher repräsentieren;
  - Action-Erzeugung und `applyAction`-Revalidierung unverändert strikt
    halten.
- Kernartefakte: Engine Ability Runtime, Shared LegalAction-Vertrag nur falls
  nötig, Engine-Contracttests.
- Checks: gezielte Engine-Tests, Replay-/Visibility-nahe Tests,
  `git diff --check`.
- Done-Gate: alle inventarisierten ausführbaren Fähigkeiten liefern eine
  korrekte standardisierte Capability-Payload ohne Hidden-Info-Leak.
- Commit: `feat(engine): expose score conversion action semantics`

### P3 – Hint-Konsistenz und Capability-Audit

- Ziel: Hints beschreiben strategische Verwendung vollständig und
  widerspruchsfrei.
- Eingang: P2-Payloadvertrag steht.
- Arbeit:
  - Advancement-, Transfer-, Aktionsgewinn- und Overadvance-Karten prüfen;
  - irreführende `planRoles`, fehlende Taktiksignale, Strategieanker,
    RequiredMechanics und Benchmarkverweise korrigieren;
  - automatischen Audit für „Engine kann, Hint verschweigt“, „Hint behauptet,
    Engine kann nicht“ und fehlendes Plan-Mapping hinzufügen;
  - Zahlen nicht in Hints duplizieren.
- Kernartefakte: `data/ai/ai-card-hints-active.json`, Ableitungs-/Invarianttests.
- Checks: `check:ai`, Hint-/Doctrine-Tests, `git diff --check`.
- Done-Gate: alle P1-Karten bestehen den Audit; keine Hint-Regelautorität.
- Commit: `feat(ai): align score conversion capability hints`

### P4 – Generische Same-Turn-Pfadberechnung

- Ziel: Einen vollständigen, deterministischen Closeoutpfad finden.
- Eingang: standardisierte Capabilities und konsistente Hints.
- Arbeit:
  - sichtbare Zielagenda, Advancement-Defizit und optional wertvolle
    Overadvance-Schwelle bestimmen;
  - Klick-, Credit-, Counter-, Kartenverbrauchs- und Rezbudget führen;
  - kleine begrenzte Suche über sofortige Aktionsgewinne, Installation,
    Platzierung, Transfer und Basic Advance implementieren;
  - Reihenfolge und Voraussetzungen validieren;
  - exact-fit bevorzugen, Overadvance nur mit sichtbarem Nutzen;
  - Ergebnis mit Zielagenda, Server, Schritten, Kosten, Reserven und Evidence
    ausgeben.
- Kernartefakte: neues fokussiertes Modul unter `packages/ai/src/plans/` und
  Unit-Tests.
- Checks: Solver-Unit-Tests, Typecheck, `git diff --check`.
- Done-Gate: Vapor-, Burst-, Aktionsgewinn- und Mischpfade werden gefunden;
  unvollständige Pfade werden verworfen.
- Commit: `feat(ai): compute generic same-turn score conversion paths`

### P5 – Integration in den bestehenden Scoreplan

- Ziel: Conversion ist ein alternativer Pfad desselben Scoreziels.
- Eingang: P4 liefert belastbare Pfade.
- Arbeit:
  - `corp.create_score_window` um Conversion-Current-/Next-Steps erweitern;
  - Agenda- und Serverziel in Plan und Memory binden;
  - ungeschützte Installation nur bei garantiertem Same-Turn-Closeout
    freigeben;
  - normalen geschützten Scorepfad und bestehende Safety-Gates erhalten;
  - nach jedem Schritt neu berechnen und passend fortschreiten.
- Kernartefakte: Corp Tactical Plans, Plan Types, Progression und Tests.
- Checks: Tactical-Plan-Tests, Runtime-Scoring-Tests, Typecheck,
  `git diff --check`.
- Done-Gate: Conversionpfad gewinnt nur mit vollständigem Closeout; sonst
  greift weiterhin der sichere Scoreplan.
- Commit: `feat(ai): integrate conversion path into corp score plan`

### P6 – Choice-Zielbindung und Ressourcenreservierung

- Ziel: Der Plan wird auf derselben Agenda mit der richtigen Menge beendet.
- Eingang: P5 erzeugt aktiven Conversionplan.
- Arbeit:
  - `p3_34.move_advancement` in den Corp-Choice-Router aufnehmen;
  - Move-Wertformat `source|target|amount` korrekt auswerten;
  - geplante Agenda und exact-fit-Menge priorisieren;
  - Counter-Cashout, konkurrierenden Creditverbrauch und unpassende
    Conversionziele während eines gültigen Plans abwerten;
  - sichere Fallbacks bei ungültigem Plan erhalten.
- Kernartefakte: Choice-Router, Advancement-Choice-Scorer,
  Plan-/Decision-Mapping und Tests.
- Checks: Choice-/Reservation-Tests, Runtime-Tests, `git diff --check`.
- Done-Gate: kein alphabetischer Move-Fallback; geplante Ressourcen bleiben
  bis zum Abschluss verfügbar.
- Commit: `feat(ai): bind conversion choices and reserve score resources`

### P7 – Deterministische Szenarien und Regression

- Ziel: Kartenfamilien und Mischpfade Ende-zu-Ende absichern.
- Eingang: P1 bis P6 abgeschlossen.
- Arbeit:
  - Vapor Ops: Agenda installieren, exakt übertragen, kostenlos scoren;
  - 0-Credit-Transfer trotz fehlender Basic-Advance-Aktion;
  - direkte Counterbursts mit 2, 3 und 4 Countern;
  - Overtime-/Pacifica-Aktionsgewinn als Enabler;
  - gemischte Burst-/Transfer-/Basic-Advance-Pfade;
  - Overadvance-Schwellen;
  - Negativfälle für fehlende Klicks, Credits, Ziele, Rezstatus und
    ungeschützte unvollständige Pfade;
  - Hint-/Capability-Matrix auf alle inventarisierten Karten anwenden.
- Kernartefakte: Unit-, Contract-, Szenario- und Simulationsregressionen.
- Checks: paketnahe Tests, AI-Shards, relevante Engine-Gates,
  `git diff --check`.
- Done-Gate: alle Must-Szenarien grün und keine illegale Aktion/Hidden-Info.
- Commit: `test(ai): cover corp score conversion card families`

### P8 – Abschlussintegration

- Ziel: Arbeitsbranch vollständig und konfliktfrei nach lokalem `main`
  integrieren.
- Eingang: P7 grün, Worktree sauber.
- Arbeit:
  - Prozessstatus, AI-Architekturindex und Monatslog aktualisieren;
  - aktuelle `main`-Änderungen in den Arbeitsbranch integrieren;
  - Konflikte defensiv unter Erhalt beider Intentionen lösen;
  - finale Gates ausführen;
  - Branch lokal nach `main` mergen;
  - Main-Status prüfen und Worktree entfernen.
- Kernartefakte: Prozessabschluss, Wissens-/Statuspflege, Git-Integration.
- Checks: `corepack pnpm typecheck`, paketnahe Tests,
  `corepack pnpm test:ai:shards`, relevante AI-/Engine-Gates,
  `git diff --check`.
- Done-Gate: lokales `main` enthält alle Paketcommits, fremde Änderungen sind
  erhalten, Main-Checks sind grün und der Prozess-Worktree ist entfernt.
- Commit: `docs(ai): close corp score conversion process`

## Verifikationsregeln

- Nach jedem Paket laufen mindestens paketnahe Tests und `git diff --check`.
- Tests mit Timeout oder Abbruch zählen nicht als bestanden.
- Engineänderungen benötigen Engine-Unit-/Contracttests.
- AI-Entscheidungsänderungen benötigen positive und negative Tests.
- Hintänderungen benötigen abgeleitete Facts-/Invariant-/Doctrine-Gates.
- Vor dem Merge laufen Typecheck, AI-Shards und alle durch die geänderten
  Verträge berührten Gates erneut.

## Worktree-, Git- und Integrationsregeln

- Genau ein Paket ist aktiv.
- Jedes Paket erhält einen eigenen Commit.
- Nur paketzugehörige Dateien werden gestaged.
- Fremde Änderungen im Hauptworkspace werden nicht übernommen, verworfen oder
  bereinigt.
- Vor Abschluss wird aktuelles `main` in den Arbeitsbranch integriert.
- Bevorzugter Abschluss ist ein lokaler Fast-Forward-Merge nach `main`.
- Kein Push und kein PR ohne gesonderten Nutzerauftrag.

## Verbindliches `/Goal`

```text
/Goal Arbeite den Corp-Score-Conversion-Prozess vollständig und sequenziell
von P0 bis P8 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die projektweiten Wiki-Einstiegsseiten,
packages/ai/AGENTS.md, packages/engine/AGENTS.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_CORP_SCORE_CONVERSION_PLAN auf Branch
codex/corp-score-conversion-plan. Nutze den Hauptworkspace nur für den finalen
Merge. Stelle keine Zwischenfragen, solange der Prozess konservative
automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket.
Führe Paketchecks aus, dokumentiere Abweichungen und committe jedes
abgeschlossene Paket. Bei Sicherheitsblocker stoppe mit einem Blocker-Report
und klarer Removal Condition. Integriere nach allen Paketen aktuelles main,
verifiziere final, merge lokal nach main, prüfe main, entferne den Worktree und
markiere das Goal erst dann als complete.
```

## Abschlusskriterien

- Der bestehende Scoreplan besitzt einen alternativen generischen
  Conversionpfad.
- Kein relevanter Pfad ist an eine Karten-ID gekoppelt.
- Alle relevanten Karten bestehen den Engine-/Hint-/Plan-Audit.
- Vapor Ops und gemischte Beschleunigerlinien werden Ende-zu-Ende genutzt.
- Ungeschützte Agenda-Installationen erfolgen nur bei garantiertem
  Same-Turn-Closeout.
- Choice und Ressourcenreservierung bleiben zielkonsistent.
- Paketnahe und finale Gates sind grün.
- Alle Paketcommits sind lokal in `main` integriert.
