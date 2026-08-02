# Einheitliche Corporation-Draw-Transaktionen

Status: **in progress**
Quelle/Vorgabe: Nutzerfreigabe vom 02.08.2026 nach systemischer Analyse von
`Strategic Planning Group` und Mehrfach-Draws
Primärer Agent: `release-implementation-agent`
Branch: `codex/corp-draw-transactions`
Worktree: `C:\Projekte\NETGRID_CORP_DRAW_TRANSACTIONS`

## Zielprüfung

Die Vorgabe ist vollständig bestimmbar. Nach Comprehensive Rules 8.4.2 bis
8.4.5 bildet jede Anweisung „Draw N cards“ genau einen Draw-Vorgang. Eine
rezzte `Strategic Planning Group` ergänzt diesen Vorgang um eine Karte und
lässt die Corp anschließend genau eine Karte aus der gesamten gezogenen Menge
unter R&D legen. Folgeanweisungen und Folge-Choices dürfen erst nach Abschluss
dieses Draw-Vorgangs fortgesetzt werden.

## Gesamtziel

- Jeder Corp-Draw besitzt eine fachlich richtige, explizite Ereignisgrenze.
- Mehrere Karten einer Draw-Anweisung werden gemeinsam gezogen und lösen
  `Strategic Planning Group` genau einmal aus.
- Pflichtkarte, verpflichtende und gewählte zusätzliche Startkarten bilden
  einen gemeinsamen Corp-Pflichtzug.
- Gezogene Karten bleiben bis zum Abschluss der Draw-Reaktionen Corp-privat
  beiseitegelegt.
- Serialisierbare Fortsetzungen führen CardImplementation-Effekte,
  Pflichtzug und nachgelagerte Karten-Choices deterministisch weiter.
- PublicEvents und Chronicle unterscheiden Basis-, Zusatz-, Gesamt- und
  Nettozählungen, ohne Kartenidentitäten zu veröffentlichen.
- Bestehende KI-Ownership von `Strategic Planning Group` bleibt bei
  `corp.hand_and_agenda_management` und der exakt gebundenen LegalAction.

## Annahmen

- „Zusätzliche Karte am Start des Corp-Zugs“ modifiziert den gemeinsamen
  Pflichtzug. Das gilt für `Unlisted Research Lab`, gewählte
  `Employee Empowerment`-Boni und `Skivviss`-Counter.
- Getrennte gedruckte Draw-Anweisungen bleiben getrennte Draw-Transaktionen;
  nur die Kartenmenge einer einzelnen Anweisung wird gebündelt.
- `Strategic Planning Group` zieht genau eine zusätzliche Karte ohne
  rekursiven Trigger.
- Die Version-0-Umgebung benötigt keine Rückwärtskompatibilität für laufende
  Replays oder persistierte Zwischenzustände.

## Nicht-Ziele

- kein allgemeiner Umbau des Runner-Draw-Systems;
- keine neue KI-Strategie und keine zweite Choice-Autorität;
- keine Änderung von Karten ohne Corp-Draw-Bezug;
- kein Push, Pull Request oder Remote-Merge;
- keine Produktversionsänderung.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Die Rules Engine bleibt einzige Regelautorität.
- Ein gedrucktes `Draw N` ruft den Corp-Draw-Kern genau einmal mit `N` auf.
- Während einer offenen Draw-Reaktion kann kein nachgelagerter Effekt und
  keine nachgelagerte Choice vorzeitig auf die gezogenen Karten zugreifen.
- Fortsetzungen sind typisiert, serialisierbar, validierbar und Bestandteil
  von StateHash und Replay.
- Nur die Corp sieht Identitäten der gezogenen Karten. Runner-View,
  PublicEvents, Chronicle, Logs und Clientfehler enthalten nur sichere Counts
  und öffentliche Quellen.
- Die SPG-KI-Choice verändert weder Action-ID noch Plan-Step, Route oder
  Executor.
- Nach jedem Paket folgen paketnahe Tests, Typecheck, `git diff --check` und
  ein eigener Commit.

## Automatische Fehlerbehandlung

- Ungültige Mengen, veraltete Quellen, fremde Karten, doppelte oder fehlende
  Fortsetzungen und inkonsistente Set-aside-Zonen scheitern fail-closed.
- Kann die Corp eine erforderliche Basis- oder SPG-Zusatzkarte nicht ziehen,
  gewinnt der Runner wegen leerem R&D; es wird keine unvollständige Choice
  fortgesetzt.
- Rote Tests werden innerhalb des aktuellen Pakets eng behoben. Das nächste
  Paket beginnt erst nach bestandenem Done-Gate.
- Konflikte mit fortgeschrittenem `main` werden additiv gelöst; bei
  widersprüchlichen Verträgen stoppt der Prozess als fachlicher Blocker.

## Sicherheitsblocker

- Hidden-Info-Leak einer gezogenen Kartenidentität;
- mehrere gleichzeitig offene Choices oder verlorene Fortsetzung;
- Replay-/StateHash-Abweichung;
- illegale oder stale Auswahl wird akzeptiert;
- KI-Choice außerhalb von `corp.hand_and_agenda_management`;
- nicht sauberer Worktree vor Merge oder Cleanup.

## State Machine

```text
planned
→ DRAW-01 active/verifying/committed
→ DRAW-02 active/verifying/committed
→ DRAW-03 active/verifying/committed
→ DRAW-04 active/verifying/committed
→ DRAW-05 active/verifying/committed
→ main integrated
→ final verified
→ worktree removed and branch deleted
→ complete
```

## Paketfolge

| Paket   | Ziel                                                 | Commit-Vorschlag                                                |
| ------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| DRAW-01 | Generischer Corp-Draw-Transaktionsvertrag            | `refactor(engine): add corp draw transactions`                  |
| DRAW-02 | Fortsetzungen und fehlerhafte Mehrfach-Draw-Aufrufer | `fix(engine): resume effects after corp draw choices`           |
| DRAW-03 | Einheitlicher Corp-Pflichtzug                        | `fix(engine): aggregate corp mandatory draw modifiers`          |
| DRAW-04 | Kartenmatrix, Chronicle, UI und KI-Integration       | `test(cards): cover strategic planning group draw transactions` |
| DRAW-05 | Dokumentation, Gesamtgates und Abschluss             | `docs(engine): finalize corp draw transaction contract`         |

## Fortschritt

| Paket   | Status    | Verification                                                                                   |
| ------- | --------- | ---------------------------------------------------------------------------------------------- |
| DRAW-01 | completed | 212 Engine-Testdateien / 1.848 Tests, Shared- und Engine-Typecheck, Format- und Diffcheck grün |
| DRAW-02 | completed | 212 Engine-Testdateien / 1.851 Tests, Shared- und Engine-Typecheck, Format- und Diffcheck grün |
| DRAW-03 | pending   | –                                                                                              |
| DRAW-04 | pending   | –                                                                                              |
| DRAW-05 | pending   | –                                                                                              |

## Paketdetails

### DRAW-01 – Generischer Corp-Draw-Transaktionsvertrag

Ziel: Ein gemeinsamer Engine-Vertrag bildet `Draw N` einschließlich privater
Set-aside-Menge und SPG-Abschluss ab.

Eingangsvoraussetzungen:

- bestehender SPG-Choice-Vertrag und vollständige Regelanalyse;
- sauberer Arbeitsbranch im isolierten Worktree.

Arbeit:

- typisierten Transaktions- und Zählvertrag ergänzen;
- Karten zunächst Corp-privat set-aside legen;
- SPG-Zusatzkarte derselben Transaktion hinzufügen;
- genau eine private Choice aus der gesamten Menge erzeugen;
- gewählte Karte unter R&D und übrige Karten gemeinsam nach HQ bewegen;
- State-Validierung, PlayerView-Redaktion, Replay und StateHash sichern;
- bestehende terminale Batch-Draw-Pfade auf den Vertrag führen.

Kernartefakte:

- `packages/shared/src/index.ts`
- `packages/engine/src/game/state/draw-random.ts`
- `packages/engine/src/game/choices/strategic-planning-group-draw-choice.ts`
- Validierungs-, View- und Engine-Tests.

Done-Gate:

- Einzel- und Mehrfach-Draw öffnen genau eine SPG-Choice über `N + 1` Karten;
- vor Auflösung liegen die Karten side-private set-aside, danach korrekt in
  HQ beziehungsweise unter R&D;
- Deckout, stale Auswahl, Hidden Info, Replay und StateHash sind grün;
- fokussierte Tests, Shared-/Engine-Typecheck und Diffcheck bestehen.

### DRAW-02 – Fortsetzungen und fehlerhafte Aufrufer

Ziel: Kein Folgeeffekt und keine Folge-Choice läuft vor Abschluss einer
SPG-Draw-Reaktion weiter.

Eingangsvoraussetzung: DRAW-01 committed.

Arbeit:

- serialisierbare Fortsetzungen und zentralen Resume-Dispatch ergänzen;
- CardImplementation-Interpreter bei einem ausgesetzten Draw pausieren;
- On-play- und Activated-Fortsetzungen unterstützen;
- `Day Shift` erst danach fortsetzen;
- `Corporate Shuffle` als einen Fünf-Karten-Draw ausführen und anschließend
  seine HQ-Choice öffnen;
- `Simple Draw Operation`, `Archive Planning Operation` und
  `EffectCommand draw_card(amount)` auf Batch-Draw umstellen;
- Strukturregression gegen neue Einzel-Draw-Schleifen ergänzen.

Done-Gate:

- Corporate Shuffle: eine SPG-Choice mit sechs Karten, danach genau eine
  Corporate-Shuffle-HQ-Choice;
- Day-Shift-Credit entsteht erst nach Draw-Abschluss;
- Testset- und generische Mengenpfade triggern SPG einmal;
- fokussierte Tests, Engine-Typecheck und Diffcheck bestehen.

### DRAW-03 – Einheitlicher Corp-Pflichtzug

Ziel: Alle zusätzlichen Startzugkarten modifizieren einen einzigen
Pflichtzug.

Eingangsvoraussetzung: DRAW-02 committed.

Arbeit:

- Startzug-Boni zunächst sammeln statt sofort ziehen;
- Employee-Empowerment-Entscheidungen vollständig vor dem Draw auflösen;
- Pflichtkarte, Unlisted Research Lab, Skivviss und gewählte optionale Boni
  zu einer Basis-Draw-Menge aggregieren;
- Pflichtzugphase erst nach vollständigem Draw samt SPG verlassen;
- öffentliche Quellen- und Count-Payloads konsistent erzeugen.

Done-Gate:

- kombinierte Quellen öffnen genau eine SPG-Choice über Basisgesamtzahl plus
  eine Karte;
- Employee-Skip und -Draw, mehrere Quellen, mehrere Skivviss-Counter und
  Deckout sind getestet;
- keine Startzug-Choice geht verloren und keine Phase wechselt vorzeitig;
- fokussierte Tests, Engine-Typecheck und Diffcheck bestehen.

### DRAW-04 – Kartenmatrix, Chronicle, UI und KI

Ziel: Der Engine-Vertrag ist über alle aktiven Karten und Konsumenten hinweg
sichtbar, bedienbar und regressionssicher.

Eingangsvoraussetzung: DRAW-03 committed.

Arbeit:

- Integrationsmatrix für Annual Reviews, Employee Empowerment, ESA Contract,
  Euromarket Consortium, AI Chief Financial Officer, Rescheduler, Night
  Shift, Panic Button und AI Board Member ergänzen;
- Basis-, Zusatz-, Gesamt- und Nettozahlen in sicheren PublicPayloads
  vereinheitlichen;
- Chronicle mit echten Engine-Events prüfen, insbesondere Corporate Shuffle
  mit SPG-Gesamtzahl und nachgelagerter HQ-Mischung;
- Human-Choice, PlayerView und Reconnect ohne Kartenleak prüfen;
- bestehende SPG-Plan-first-Ownership für größere Optionsmengen und die
  Corporate-Shuffle-Sequenz absichern.

Done-Gate:

- alle realen Corp-Draw-Karten sind positiv oder als unveränderte
  Einzel-Draw-Gegenprobe abgedeckt;
- Runner sieht keine Identitäten, Corp sieht die vollständige Auswahl;
- Chronicle zeigt korrekte Counts in getrennten Meldungen;
- KI behält Action-ID, Step, Route und Executor;
- fokussierte Engine-/Web-/AI-Tests und Typechecks bestehen.

### DRAW-05 – Dokumentation und Gesamtgates

Ziel: Current-State-Wissen, Regelentscheidung und vollständige Verifikation
entsprechen dem neuen Vertrag.

Eingangsvoraussetzung: DRAW-04 committed.

Arbeit:

- diesen Prozess auf `completed` setzen und Implementierungsstand ergänzen;
- bisherigen engen SPG-Prozess als Vorgänger/Fundquelle einordnen;
- Classic-Regelentscheidung und Betriebslog präzisieren;
- Final Review mit Kartenmatrix, Risiken und Gate-Ergebnissen anlegen;
- vollständige Engine-/Webtests, Shared-/Engine-/Web-Typechecks,
  `test:ai:shards`, Struktur-, Format- und Diff-Gates ausführen;
- aktuelles `main` integrieren und relevante Gates wiederholen.

Done-Gate:

- Dokumentation beschreibt ausschließlich den produktiven Current State;
- alle Abschlussgates sind grün oder ein echter Blocker ist mit Removal
  Condition dokumentiert;
- Arbeitsbranch ist sauber und lokal nach `main` integrierbar.

## Verifikationsregeln

- Fokussierte Engine-/AI-Tests erhalten mindestens 180 Sekunden äußeres
  Zeitfenster.
- Vollständige Engine-, Web-, Workspace- und AI-Shard-Läufe erhalten
  mindestens 600 Sekunden.
- Noch laufende Testprozesse werden über ihre Cell-ID weiterverfolgt, nicht
  allein wegen eines frühen Yields neu gestartet.
- Nach jedem Paket: relevante Tests, Typecheck, Formatcheck,
  `git diff --check`, explizites Staging nur der Paketdateien und Commit.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich in
  `C:\Projekte\NETGRID_CORP_DRAW_TRANSACTIONS` auf
  `codex/corp-draw-transactions`;
- Hauptworkspace nur für den finalen lokalen Merge;
- kein Push und kein Pull Request;
- vor Merge aktuelles `main` additiv in den Arbeitsbranch integrieren;
- bevorzugter Fast-Forward-Merge nach `main`;
- Worktree erst nach grünem Main-Check und sauberem Arbeitsstatus entfernen;
- Entfernung in Git und Dateisystem doppelt verifizieren;
- gemergten Branch anschließend mit `git branch -d` löschen.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Corporation-Draw-Transaktionsprozess vollständig und
sequenziell von DRAW-01 bis DRAW-05 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main.

Lies AGENTS.md, packages/engine/AGENTS.md und dieses Prozessartefakt. Arbeite
ausschließlich im Worktree C:\Projekte\NETGRID_CORP_DRAW_TRANSACTIONS auf
Branch codex/corp-draw-transactions. Arbeite immer nur am aktuellen Paket,
führe dessen Done-Gate aus und committe es vor dem Folgepaket. Stoppe bei
Hidden-Info-, Replay-, StateHash-, IllegalAction-, Choice- oder
KI-Ownership-Verletzungen. Integriere danach aktuelles main, führe die finalen
Gates aus, merge lokal nach main und entferne Worktree sowie Branch
verifiziert. Markiere das Goal erst danach als complete.
```

## Abschlusskriterien

- DRAW-01 bis DRAW-05 sind einzeln geprüft und committed;
- jeder Corp-Draw besitzt genau die fachlich richtige Ereignisgrenze;
- SPG wählt aus der vollständigen Draw-Menge und blockiert Folgeeffekte bis
  zum Abschluss;
- Pflichtzugmodifikatoren sind einheitlich aggregiert;
- Human, KI, Chronicle, PlayerViews, Replay und StateHash sind abgesichert;
- lokal nach `main` integriert und dort verifiziert;
- Arbeits-Worktree und gemergter Branch sind nachweislich entfernt;
- `/Goal` ist erst dann `complete`.
