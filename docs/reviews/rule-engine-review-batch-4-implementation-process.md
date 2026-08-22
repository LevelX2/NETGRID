# Regel-Engine-Review Batch 4 – Validierungs- und Umsetzungsprozess

Status: in Bearbeitung
Quelle: externes Prüfprotokoll vom 22.08.2026 zum Snapshot
`7ef751d2150763b424c64a98cc26edba197dd061`

## Zielprüfung

Die Vorgabe ist für eine automatische, sequenzielle Umsetzung ausreichend
präzise. Das Prüfprotokoll ist Review-Evidence und keine Arbeitsanweisung.
Jedes Finding wird gegen den aktuellen lokalen `main`-Ausgangsstand
`5c6fe262b717212eb7c4d0058485c4304a89ac96` neu validiert.

## Gesamtziel

Belastbare Findings aus Batch 4 werden an ihrer erzeugenden Engine-Schicht
fail-closed und ohne Fallback behoben. Nicht mehr aktuelle, nicht
reproduzierbare oder überdimensionierte Vorschläge werden mit Begründung
abgewiesen. Alle umgesetzten Pakete erhalten direkt änderungsnahe Tests und
einen eigenen Commit. Danach wird der Branch lokal nach `main` integriert und
der Prozess-Worktree samt Branch verifiziert entfernt.

## Annahmen

- Der aktuelle Code und seine Verträge sind gegenüber dem Report-Snapshot
  führend.
- F-04-02 und F-04-03 teilen denselben persistenten
  Trace-Credit-Integritätsvertrag und werden gemeinsam bearbeitet, falls beide
  bestätigt werden.
- Ein vollständiger Engine-Testlauf ist nicht automatisch erforderlich. Die
  vier direkt betroffenen Testdateien, berührte Typoberflächen und unmittelbar
  angrenzende Verträge bilden das Standard-Gate.
- Der Nutzer hat direkte Umsetzung beauftragt; es ist kein zusätzlicher
  Prompt-Handoff erforderlich.

## Nicht-Ziele

- Keine neue Kartenregel oder KI-Policy.
- Keine vorsorgliche Aufteilung großer Engine-Dateien.
- Keine allgemeine Sprach-, Benamungs- oder Formatierungsbereinigung.
- Kein Push, Pull Request oder Remote-Merge ohne weiteren Nutzerauftrag.
- Keine Legacy- oder Kompatibilitätsadapter für korrupte V0-Zustände.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- Persistenter Engine-Zustand wird an Wiederaufnahme- und Ausführungsgrenzen
  fail-closed validiert; ungültige Werte werden nicht gerundet, gekappt oder
  still ignoriert.
- Fehler werden vor der ersten Mutation des betroffenen Ablaufs ausgelöst.
- LegalAction-Identität, StateHash, RNG-Aufzeichnung, deterministisches Replay
  und Hidden-Info-Grenzen bleiben erhalten.
- Machine-Errors sind stabil und Englisch; sichtbare Texte werden nicht
  pauschal migriert.
- Genau ein Paket ist aktiv.

## Automatische Fehlerbehandlung

- Rote fokussierte Tests werden innerhalb des aktiven Pakets ursächlich
  diagnostiziert.
- Unabhängige Baselinefehler werden separat belegt und nicht in den Scope
  gezogen.
- Neue Findings werden als Follow-up klassifiziert; sie erweitern kein Paket
  still.
- Bei bereits behobenem oder nicht bestätigtem Finding wird kein künstlicher
  Code-Diff erzeugt.

## Sicherheitsblocker

Der Prozess stoppt, wenn ein Fix verdeckte Daten offenlegen, eine zweite
Regelautorität schaffen, Replay-/StateHash-Determinismus brechen oder einen
fachlich nicht eindeutig lösbaren Konflikt mit weitergelaufenem `main`
erfordern würde. Der Blockerbericht benennt Ursache und Removal Condition.

## State Machine

```text
prepared
  -> B4-00-validating
  -> package-active
  -> package-verified
  -> package-committed
  -> next-package | final-verification
  -> main-synchronized
  -> merged-to-main
  -> worktree-removed
  -> branch-removed
  -> complete
```

## Paketfolge

| ID | Titel | Finding |
| --- | --- | --- |
| B4-00 | Current-State-Audit und Prozessfreigabe | F-04-01 bis F-04-05 |
| B4-01 | Zufallsschadens-Subroutine vollständig abschließen | F-04-01 |
| B4-02 | Temporäre Encounter-Trace-Credits fail-closed validieren | F-04-02, F-04-03 |
| B4-03 | Schlaghund-Ergebnisvertrag an den echten Ablauf binden | F-04-04 |
| B4-04 | P3.47-Choice-Quellenvertrag fail-closed validieren | F-04-05 |
| B4-05 | Abschlussverifikation und Wissensrückführung | bestätigte Pakete |

Nicht bestätigte Pakete werden in B4-00 als entfallen markiert und nicht
künstlich umgesetzt.

## Auditentscheidung B4-00

Der Report-Snapshot ist Vorfahr des aktuellen Ausgangsstands. Zwischen
`7ef751d...` und `5c6fe262b` wurden die vier betroffenen Produktionsdateien
nicht geändert. Die fokussierte Ausgangsbaseline umfasst 44 grüne Tests; die
Lücken sind fehlende Negativ- beziehungsweise Ergebnisassertionen und werden
durch den grünen Altstand nicht widerlegt.

| Finding | Entscheidung | Begründung |
| --- | --- | --- |
| F-04-01 | bestätigt | Nur Fehlwurf, Nullschaden und Suspendierung markieren den Random-Damage-Index; der sofortige Trefferpfad nicht. Der Caller ergänzt ihn ebenfalls nicht. |
| F-04-02 | bestätigt | Der passende persistierte Grant wird erst nach `traceAttemptedThisRun` und dem Subroutine-Marker durch `Math.floor`/`Math.max` normalisiert. Nichtendliche Werte können den Bid-Vertrag vergiften. |
| F-04-03 | bestätigt | Run-Ende und Passieren des ICE löschen den Grant nach derselben stillen Normalisierung. |
| F-04-04 | bestätigt | Der Handler beendet den Fehlwurf korrekt, der Wrapper synthetisiert danach mangels Payload weiterhin `damageAmount: 10`. |
| F-04-05 | bestätigt | Start und Wiederaufnahme normalisieren P3.47-Parameter; fehlende oder nichtendliche Werte können bis in Creditberechnung und Kartenbewegung gelangen. |

B4-02 schützt denselben Restbetragsvertrag zusätzlich in den nachgelagerten
Payment-Resolvern. Damit bleibt eine persistierte Wiederaufnahme mitten im
Trace fail-closed; eine reine Korrektur nur am Trace-Start würde dort eine
zweite ungeschützte Zustandsgrenze lassen.

## Paketdetails

### B4-00 – Current-State-Audit und Prozessfreigabe

- Ziel: Jedes Finding am aktuellen Branch anhand von Producer, Consumer,
  Mutationsreihenfolge und vorhandenen Tests bewerten.
- Eingang: sauberer Prozess-Worktree auf aktuellem `main`.
- Arbeit: Snapshot-Diff prüfen; betroffene Implementierungen und Tests lesen;
  Findingstatus und endgültige Paketfolge dokumentieren.
- Kernartefakt: dieses Prozessdokument.
- Checks: `git diff --check`; keine Produktionssuite.
- Done-Gate: jedes Finding ist bestätigt, entfallen oder abgewiesen und die
  Paketfolge entsprechend festgelegt.
- Commit: `docs(review): validate rule engine review batch 4`

### B4-01 – Zufallsschadens-Subroutine vollständig abschließen

- Ziel: Ein sofort abgewickelter Treffer markiert denselben Subroutine-Index
  genau einmal als erledigt.
- Eingang: F-04-01 in B4-00 bestätigt.
- Arbeit: Mutationsreihenfolge am autoritativen Encounter-Pfad korrigieren und
  Trefferregression ergänzen.
- Kernartefakte: `encounter-printed-effects.ts` und direkter Test.
- Checks: fokussierter Encounter-Test; `git diff --check`.
- Done-Gate: Treffer-, Fehlwurf-, Nullschaden- und Suspendierungspfad besitzen
  konsistente Abschlusssemantik.
- Commit: `fix(engine): complete resolved random damage subroutines`

### B4-02 – Temporäre Encounter-Trace-Credits fail-closed validieren

- Ziel: Trace-Start und Run-End-Cleanup akzeptieren denselben nichtnegativen
  Safe-Integer-Vertrag und mutieren bei Korruption nichts.
- Eingang: F-04-02 und/oder F-04-03 in B4-00 bestätigt.
- Arbeit: gemeinsame oder bewusst identische Validierung an beiden Grenzen;
  stabile Machine-Errors; Mutationsreihenfolge; fokussierte Negativtests.
- Kernartefakte: gemeinsamer Trace-Credit-Validator,
  `encounter-printed-effects.ts`, `run-end-cleanup.ts`, die zuständigen
  State-Runtime-Resolver und direkte Tests.
- Checks: beide fokussierten Run-Testdateien; Engine-Typecheck bei veränderter
  Typoberfläche; `git diff --check`.
- Done-Gate: `NaN`, Infinity, negative und gebrochene Werte scheitern vor
  Marker-, Trace-, Choice-, Grant- oder Payload-Mutation.
- Commit: `fix(engine): reject invalid encounter trace credit state`

### B4-03 – Schlaghund-Ergebnisvertrag an den echten Ablauf binden

- Ziel: ExecutionResult spiegelt Würfelwurf, tatsächlich zugefügten Schaden
  und Source-Trash statt eines Payload-Fallbacks.
- Eingang: F-04-04 in B4-00 bestätigt.
- Arbeit: kleinen typisierten Handler-Rückgabevertrag einführen und Wrapper
  daran binden; Fehlwurfregression ergänzen.
- Kernartefakte: `special-damage-abilities.ts` und direkter Test.
- Checks: fokussierter Special-Damage-Test; Engine-Typecheck bei exportierter
  Typänderung; `git diff --check`.
- Done-Gate: Treffer und Fehlwurf liefern exakt den realen Zustand, ohne
  zweite Schadensberechnung.
- Commit: `fix(engine): report actual Schlaghund damage outcome`

### B4-04 – P3.47-Choice-Quellenvertrag fail-closed validieren

- Ziel: Start und Wiederaufnahme akzeptieren ausschließlich den exakten
  ganzzahligen Choice-Vertrag; Source-Text wird nicht normalisiert.
- Eingang: F-04-05 in B4-00 bestätigt.
- Arbeit: Startparameter validieren; persistierte Parameter streng parsen;
  stabile familienbezogene Machine-Errors; mutationfreie Negativtests.
- Kernartefakte: `nonsearch-choice-handlers.ts` und direkter Test.
- Checks: fokussierter Nonsearch-Choice-Test; Engine-Typecheck bei
  Typoberflächenänderung; `git diff --check`.
- Done-Gate: fehlende, nichtendliche, negative und gebrochene Werte scheitern
  vor Kartenbewegung und Creditgewinn.
- Commit: `fix(engine): validate persisted runner trash choice contracts`

### B4-05 – Abschlussverifikation und Wissensrückführung

- Ziel: bestätigte Korrekturen gemeinsam verifizieren und wiederverwendbare
  Erkenntnisse knapp in den Monatslog zurückführen.
- Eingang: alle bestätigten Fixpakete committed.
- Arbeit: direkt betroffene Testdateien gemeinsam ausführen; notwendige
  Typ-/Strukturgates; Prozessstatus und Log aktualisieren.
- Kernartefakte: Tests, `KI-Wissen-NETGRID/03 Betrieb/Log 2026-08.md`, dieses
  Prozessdokument.
- Checks: vier direkt betroffene Testdateien, erforderlicher
  Engine-Typecheck/Strukturgate und `git diff --check`.
- Done-Gate: kein neuer roter direkt betroffener Check; Abschlussstand und
  bewusst nicht umgesetzte Vorschläge sind dokumentiert.
- Commit: `docs(knowledge): record rule engine review batch 4`

## Verifikationsregeln

- Pro Paket zuerst nur der direkt betroffene Test.
- Negativtests prüfen neben dem Error-Code ausdrücklich die Abwesenheit jeder
  vorgelagerten Mutation.
- Typchecks nur bei berührter Typoberfläche oder gemeinsamem Vertrag.
- Kein vollständiger Engine-Lauf allein wegen des Merge-Zeitpunkts.
- Nach jeder Änderung: `git diff --check`, ausschließlich paketbezogenes
  Staging und ein eigener Commit.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_RULE_ENGINE_REVIEW_BATCH_4`
- Branch: `codex/rule-engine-review-batch-4`
- Integration: lokaler `main` im primären Checkout.
- Der Hauptworkspace wird während der Paketarbeit nicht verändert.
- Vor dem Abschluss wird weitergelaufenes `main` defensiv in den Arbeitsbranch
  integriert und bei fachlicher Überlappung gezielt nachgetestet.
- Bevorzugter Main-Merge: Fast-forward.
- Nach erfolgreichem Merge werden exakt dieser Worktree und der vollständig
  gemergte Branch entfernt; Git-Registrierung und Dateisystem werden geprüft.
- Kein Push oder Pull Request ohne ausdrücklichen Auftrag.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Prozess „Regel-Engine-Review Batch 4“ vollständig und
sequenziell von B4-00 bis B4-05 ab und merge den abgeschlossenen Arbeitsbranch
lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, packages/engine/AGENTS.md und
docs/reviews/rule-engine-review-batch-4-implementation-process.md. Arbeite
ausschließlich im Worktree C:\Projekte\NETGRID_RULE_ENGINE_REVIEW_BATCH_4 auf
Branch codex/rule-engine-review-batch-4. Nutze den Hauptworkspace nur für den
finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische
Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket. Validiere
Review-Findings gegen den aktuellen Code, führe ausschließlich
änderungsnahe Paketchecks aus und committe jedes abgeschlossene Paket. Bei
Sicherheitsblocker stoppe ohne Fallback und dokumentiere Ursache und Removal
Condition. Nach Abschluss aktuelles main integrieren, relevante Checks
gezielt wiederholen, lokal nach main mergen, main prüfen, den sauberen
Arbeits-Worktree entfernen, seine Entfernung in Git und Dateisystem
verifizieren, den gemergten Branch löschen und das Goal erst dann als
complete markieren.
```

## Abschlusskriterien

- B4-00 bis B4-05 sind sequenziell abgeschlossen oder Findings in B4-00
  begründet als entfallen markiert.
- Jeder Produktionscode-Diff entspricht einem bestätigten aktuellen Finding.
- Direkt betroffene Regressionstests und erforderliche Typ-/Strukturgates sind
  grün oder unabhängige Baselineabweichungen sind reproduzierbar getrennt.
- Der Arbeitsbranch ist lokal in `main` enthalten.
- Worktree und gemergter Branch sind entfernt und ihre Entfernung doppelt
  verifiziert.
- Es erfolgte kein Push ohne Nutzerauftrag.

## Fortschritt

- [x] B4-00 – Current-State-Audit und Prozessfreigabe
- [ ] B4-01 – Zufallsschadens-Subroutine vollständig abschließen
- [ ] B4-02 – Temporäre Encounter-Trace-Credits fail-closed validieren
- [ ] B4-03 – Schlaghund-Ergebnisvertrag an den echten Ablauf binden
- [ ] B4-04 – P3.47-Choice-Quellenvertrag fail-closed validieren
- [ ] B4-05 – Abschlussverifikation und Wissensrückführung
