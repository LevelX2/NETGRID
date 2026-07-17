# Runner-Damage-Threat-Model-v2-Prozess

Status: aktiv

## Quelle und Zielprüfung

Quelle sind die Nutzerfreigabe vom 2026-07-17, die Analyse von
`runnerDamageThreatAssessment` nach `match_f5d27033a083d6b8` und der Wunsch,
Altstrukturen zu entfernen. Die Vorgabe ist für die direkte automatische
Umsetzung präzise genug.

Der bestehende Stand ist side-safe und löst die drei F5D-Fehler, vermischt aber
dauerhaftes Wissen über eine Damage-Strategie mit akuter Flatline-Gefahr. Die
Überarbeitung muss diese Trennung herstellen, ohne frühe Check-Runs, sichtbare
Payoffs, bekannte sichere Pfade oder unmittelbare Verteidigung pauschal zu
unterdrücken.

## Gesamtziel

Die Runner-KI führt ein dauerhaftes, ausschließlich aus sichtbarer Evidence
abgeleitetes Damage-Deck-Belief und daneben eine zeit- und situationsbezogene
Flatline-Risikobewertung. Nur die akute Bewertung steuert Handpuffer,
Creditreserve, Run-Risiko und Plan-Arbitration. Tatsächlicher Korp-Schaden,
verhinderter Schaden, Runner-Self-Damage, Trace-/Tag-Delivery und Damage-Payoff
werden strukturell getrennt. Aktualität wird in der laufenden Runtime über
öffentliche Turn-Serien statt über die variable Anzahl von StateVersions
bestimmt.

## Annahmen

- `turnSerial` ist öffentliche, deterministische Spielinformation und darf in
  `PlayerView` und `PublicGameEvent` projiziert werden.
- Alte gespeicherte Events ohne `turnSerial` dürfen für bestehende
  Checkpoint-Fixtures einen eng markierten Legacy-Fallback behalten; neue
  Runtime-Events nutzen ausschließlich die Turn-Serie.
- Ein einmal sichtbar bestätigtes Damage-Archetyp-Signal darf im Deck-Belief
  erhalten bleiben. Akute Vorsicht muss dagegen ohne aktuelles Fenster sinken.
- Strukturierte AI-Hints sind führend. Freitext-Tokens sind nur ein
  niedrig-konfidentes Fallback und dürfen allein keine bestätigte akute Lage
  erzeugen.

## Nicht-Ziele

- Keine Änderung der Engine-Regeln, Damage-Auflösung oder LegalActions.
- Keine Hidden-Info-Inferenz aus Korp-HQ, R&D oder unbekannten Karten.
- Keine kartenspezifische Soulkiller-, Urban-Renewal- oder
  Chance-Observation-Sonderregel.
- Keine allgemeine Vorgabe, den Runner immer auf maximale Handgröße ziehen zu
  lassen.
- Keine Änderung der Corp-KI oder der Decklisten.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Die Rules Engine bleibt einzige Regelautorität; die KI bewertet nur
  LegalActions.
- Deck-Belief und akutes Risiko besitzen getrennte Typen, Evidence und
  Consumer-Verträge.
- `actor: runner` darf kein Korp-Damage-Belief erzeugen.
- `damageAmount: 0` ist höchstens ein sichtbarer Damage-Versuch, kein erlittener
  aktueller Schaden.
- Ein aktuelles Tag ohne passende sichtbare Punish-Evidence ist kein
  Damage-Deck-Nachweis.
- Das effektive Handziel überschreitet nie `maxHandSize`.
- Bekannte Run-Pfade bleiben Aufgabe der vorhandenen Run-Quote; das
  Threat-Modell ergänzt unbekannte Exposition und konkrete Access-Ambushes.
- Replay, StateHash und Hidden-Info-Verträge bleiben grün.

## Automatische Fehlerbehandlung

- Rote Zieltests werden zunächst als erwartete Red Evidence dokumentiert und
  committed; nur die bezeichneten Erwartungen dürfen rot sein.
- Unerwartete Testfehler werden vor Paketfortschritt eingegrenzt.
- Fehlende Worktree-Abhängigkeiten werden mit
  `corepack pnpm install --frozen-lockfile` hergestellt.
- Bei Konflikten mit fortgeschrittenem `main` werden beide fachlichen
  Intentionen rekonstruiert; es gibt kein pauschales `ours` oder `theirs`.

## Sicherheitsblocker

Der Prozess stoppt, wenn die gewünschte Bewertung verdeckte Kartenidentitäten,
vollständigen GameState im AI-Pfad oder nicht öffentliche Turndaten benötigen
würde. Ein solcher Blocker erhält einen Report mit Removal Condition.

## State Machine

`P1_PREPARE -> P2_RED_EVIDENCE -> P3_MODEL_SPLIT -> P4_CONSUMERS -> P5_CLEANUP -> P6_VERIFY_INTEGRATE -> COMPLETE`

## Paketfolge

### P1: Preflight und Prozessvertrag

Status: aktiv

Ziel: Worktree, Branch, Scope, Invarianten und Gates verbindlich sichern.

Kernartefakte:

- dieses Prozessdokument
- Worktree `C:\Projekte\NETGRID_AI_DAMAGE_THREAT_MODEL_V2`
- Branch `codex/ai-damage-threat-model-v2`

Checks: sauberer Worktree, `git diff --check`.

Done-Gate: Prozessartefakt formatiert und als eigener Paketcommit vorhanden.

Commit: `docs(ai): plan damage threat model v2`

### P2: Rote Evidence und Consumer-Matrix

Status: ausstehend

Ziel: Die belegten Schwächen vor der Implementierung reproduzierbar machen.

Konkrete Zielregressionen:

- Runner-Self-Damage erzeugt kein Korp-Damage-Belief.
- vollständig verhinderter Schaden zählt nicht als aktuell erlittener Schaden.
- ein generisches Trace-Ereignis bestätigt kein Damage-Deck.
- zwei unabhängige sichtbare Delivery-/Payoff-Signale bestätigen das
  Deck-Belief.
- ein bestätigtes Deck-Belief bleibt erhalten, während akutes Risiko nach
  unbestätigten Runner-Zügen sinkt.
- ein voller auf zwei reduzierte Handpuffer besitzt ein effektives Ziel von
  zwei und erzeugt auf dem letzten Klick keinen falschen Survival-Draw.
- F5D-Ziel- und Gegenproben bleiben im Vertrag.

Kernartefakte: fokussierte Unit-, PlayerView-, Event- und
Decision-Checkpoint-Tests.

Checks: exakt erwartete Red-Evidence-Fehler; alle bestehenden Gegenproben grün;
`git diff --check`.

Done-Gate: Zieltests und erwartete Fehlerliste sind nachvollziehbar committed.

Commit: `test(ai): capture damage threat model v2 regressions`

### P3: Deck-Belief und akutes Flatline-Risiko

Status: ausstehend

Ziel: Das bisherige skalare Threat-Modell fachlich trennen.

Konkrete Arbeit:

- öffentlichen `turnSerial` in PlayerView und PublicGameEvent projizieren;
- strukturierte Evidence nach Akteur, tatsächlichem Schaden, verhindertem
  Versuch, sichtbarer Damage-Quelle, Delivery und Payoff klassifizieren;
- dauerhaftes Damage-Deck-Belief aus unabhängiger sichtbarer Evidence bilden;
- akute Flatline-Gefahr aus aktuellem Fenster, Hand, Tags, aktiven Quellen und
  Turn-Abstand ableiten;
- Evidence und Debug-Facts für beide Achsen getrennt ausgeben.

Checks: neue Modelltests, PlayerView-/Event-Projektion, AI- und
Engine-Typecheck, `git diff --check`.

Done-Gate: P2-Modelltests grün; keine Hidden-Info- oder Replay-Abweichung.

Commit: `feat(ai): split damage deck belief from flatline risk`

### P4: Consumer auf konkrete Gefahr umstellen

Status: ausstehend

Ziel: Hand-, Economy-, Run- und Arbitration-Consumer nutzen die richtige Achse.

Konkrete Arbeit:

- effektives Handziel auf `maxHandSize` begrenzen;
- dauerhaften, temporären und letzten-Klick-Handpuffer unterscheiden;
- Creditreserve und Survival-Priorität aus akuter Gefahr statt bloßem
  Deck-Belief ableiten;
- serverbezogene Run-Risiken und replay-stabile Probevariation beibehalten;
- sichtbaren Sofort-Payoff, Matchpoint und unmittelbare defensive
  Installationen nicht pauschal sperren;
- F5D-Reaktionsreserve und bekannter Access-Ambush bleiben wirksam.

Checks: Consumer-Unit-Tests, F5D-Checkpoints, angrenzende Run-/Plan-Tests,
`git diff --check`.

Done-Gate: alle Ziel- und Gegenproben grün, keine neue Plan-Arbitration-
Regression.

Commit: `fix(ai): consume acute flatline risk across runner policy`

### P5: Altstrukturen und Verträge konsolidieren

Status: ausstehend

Ziel: Es bleibt genau eine führende Damage-Belief-/Flatline-Risk-API.

Konkrete Arbeit:

- ungenutzten Bool-Detector `runner-visible-damage-pressure` samt isolierten
  Tests entfernen;
- alte Typnamen, Felder und Evidence ohne Consumer entfernen oder migrieren;
- Hint-/Consumer-Verträge und Exporte auf die neue API prüfen;
- strukturierte Fallback-Grenzen durch Tests sichern.

Checks: `rg`-Dead-Code-Prüfung, öffentliche Exporttests, `check:ai:full`, AI-
Typecheck, `git diff --check`.

Done-Gate: keine parallele Alt-API und keine verwaisten Consumer.

Commit: `refactor(ai): remove legacy damage pressure paths`

### P6: Breite Verifikation, Wissenspflege und Integration

Status: ausstehend

Ziel: aktueller Code, Dokumentation, `main` und Cleanup sind nachweislich
abgeschlossen.

Konkrete Arbeit:

- fokussierte und angrenzende AI-/Engine-Tests ausführen;
- vollständige relevante AI-Suite beziehungsweise ein sauber gegen `main`
  klassifiziertes Delta sichern;
- Final Review und Monatslog aktualisieren;
- aktuelles `main` defensiv in den Arbeitsbranch integrieren;
- finale Checks wiederholen und bevorzugt Fast-Forward nach `main` mergen;
- Worktree und gemergten Branch entfernen und doppelt verifizieren.

Checks: Fokusverbund, AI-/Engine-Typecheck, `check:ai:full`, Format-, Diff- und
Statusprüfungen; bei Vollsuite-Rot Vergleich auf demselben `main`.

Done-Gate: Main enthält alle Paketcommits, ist sauber, Worktree-Pfad und Branch
sind entfernt, kein Push wurde ausgeführt.

Commit: `docs(ai): close damage threat model v2 review`

## Verifikationsregeln

- Direkte Vitest-Dateiaufrufe werden bevorzugt, weil gefilterte pnpm-Testargs in
  frischen Worktrees unzuverlässig sein können.
- Ein grüner Hint-Gate ersetzt keinen Consumer-Test.
- Engine-/View-Verträge werden separat von AI-Entscheidungstests geprüft.
- Vollsuite-Altfehler müssen auf demselben aktuellen `main` reproduzierbar sein,
  bevor sie als Baseline klassifiziert werden.

## Worktree-, Git- und Integrationsregeln

- Ausschließlich der Arbeits-Worktree wird für P1 bis P6 bearbeitet.
- Jedes Paket erhält nach bestandenem Done-Gate einen eigenen Commit.
- Der Hauptworkspace wird nur für Preflight und finalen lokalen Merge genutzt.
- Kein Push, kein Pull Request und kein Force-Reset.
- Cleanup erfolgt erst nach nachgewiesenem Merge und sauberem Worktree.

## Controller-Prompt-Kern

```text
/Goal Arbeite Runner Damage Threat Model v2 vollständig und sequenziell von P1
bis P6 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, packages/ai/AGENTS.md und
docs/architecture/ai/runner-damage-threat-model-v2-process-2026-07-17.md.
Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_DAMAGE_THREAT_MODEL_V2 auf Branch
codex/ai-damage-threat-model-v2. Nutze den Hauptworkspace nur für den finalen
Merge. Arbeite immer nur am aktuellen Paket, führe seine Checks aus, dokumentiere
Abweichungen und committe jedes abgeschlossene Paket. Stoppe nur bei einem
Sicherheitsblocker. Integriere am Ende aktuelles main defensiv, wiederhole die
finalen Checks, merge lokal nach main, entferne Worktree und gemergten Branch
und markiere das Goal erst nach doppelter Cleanup-Verifikation als complete.
```

## Abschlusskriterien

- Damage-Deck-Belief und akute Flatline-Gefahr sind getrennt und side-safe.
- Self-Damage, verhinderter Schaden und generischer Trace werden nicht als
  tatsächlich erlittener Korp-Schaden fehlklassifiziert.
- Akutes Risiko altert turn-basiert; Deckwissen bleibt nachvollziehbar.
- Hand-, Credit-, Run- und Plan-Consumer verwenden effektive, konkrete Gefahr.
- F5D-Ziele und positive Gegenproben bleiben grün.
- Die parallele Bool-Altstruktur ist entfernt.
- Dokumentation, Paketcommits, Main-Merge und Cleanup sind vollständig.
