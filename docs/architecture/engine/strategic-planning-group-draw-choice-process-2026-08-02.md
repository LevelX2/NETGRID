# Strategic Planning Group – Draw-Choice-Fix

Status: **implementation_complete – lokale Integration und Cleanup ausstehend**
Quelle/Vorgabe: Playtest-Fund vom 02.08.2026
Primärer Agent: `release-implementation-agent`
Branch: `codex/spg-draw-choice`
Worktree: `C:\Projekte\NETGRID_SPG_DRAW_CHOICE`

## Zielprüfung

Die Vorgabe ist vollständig bestimmbar. Eine rezzte `Strategic Planning
Group` muss jeden zusammenhängenden Corp-Draw einschließlich des
verpflichtenden Kartenzugs ersetzen: Die Corp zieht eine zusätzliche Karte
und wählt anschließend aus genau den in diesem Draw gezogenen Karten eine,
die verdeckt unter R&D gelegt wird. Die nicht gewählten Karten bleiben in HQ.

## Gesamtziel

- Der Pflichtzug und normale Corp-Draws öffnen nach dem zusätzlichen Draw eine
  private Corp-Choice.
- Nur die Corp sieht Identitäten und Kartenansichten der gezogenen Karten.
- Die Engine erzeugt die `LegalAction`, bindet Choice, Optionen und
  `stateVersion` und revalidiert die gewählte Karte in `applyAction`.
- Die Wahl verändert netto weder die gedruckte Draw-Menge noch die
  R&D-/HQ-Zählung: Bei einem Ein-Karten-Draw bleiben eine Karte in HQ und eine
  Karte wird unter R&D gelegt.
- Replay, StateHash und öffentliche Events bleiben deterministisch und
  Hidden-Info-sicher.
- Eine Corp-KI löst die Choice ausschließlich über
  `corp.hand_and_agenda_management` und die exakt gebundene
  `resolve_choice`-Action auf.

## Annahmen

- „Whenever you draw one or more cards“ triggert einmal pro zusammenhängendem
  Draw-Aufruf, nicht einmal pro darin gezogener Karte.
- Die einzigartige Karte erzeugt regelkonform höchstens eine aktive
  Replacement-Quelle. Ein korrupter Zustand mit mehreren aktiven Kopien darf
  keine zweite offene Choice überschreiben.
- Die Auswahl umfasst alle Karten des aktuellen Draws einschließlich der
  zusätzlichen Karte.
- Die Corp darf die Karte frei wählen; es gibt keine öffentliche Enthüllung.

## Nicht-Ziele

- keine Änderung anderer Draw-Replacements;
- kein allgemeiner Umbau aller Corp-Draw-Aufrufer;
- keine neue KI-Strategie oder zweite Choice-Autorität;
- keine Produktversionsänderung, Remote-Integration oder Legacy-Migration.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Die Engine bleibt einzige Regelautorität.
- Der Choice-Resolver darf nur Optionswerte der bereits gewählten Action
  ergänzen; `actionId`, Executor, Plan-Step und Route bleiben unverändert.
- PublicEvents, Runner-View, Logs und Clientfehler enthalten keine gezogenen
  Kartenidentitäten oder Ordnungsinformationen.
- Nach jedem Paket: paketnahe Tests, Typecheck soweit betroffen,
  `git diff --check`, paketbezogener Commit.

## Automatische Fehlerbehandlung

- Fehlende oder stale Choice-/Action-/Optionsbindung scheitert fail-closed.
- Eine gewählte Karte muss zum aktuellen Draw gehören und noch in HQ liegen.
- Eine bereits offene Choice verhindert das Erzeugen einer zweiten Choice.
- Rote Tests werden im aktiven Paket eng behoben; kein Folgepaket beginnt vor
  bestandenem Done-Gate.

## Sicherheitsblocker

- Hidden-Info-Leak;
- IllegalAction oder stale Choice;
- Replay-/StateHash-Abweichung;
- KI-Auflösung ohne `corp.hand_and_agenda_management` als Executor;
- Änderung von `actionId`, Step oder Route durch den Choice-Resolver.

## State Machine

```text
planned
→ package_active
→ package_verifying
→ package_committed
→ next_package
→ final_verifying
→ main_integrating
→ worktree_cleaning
→ complete
```

## Paketfolge

| Paket  | Ziel                                                         | Commit                                                             |
| ------ | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| SPG-01 | Engine-Choice-Vertrag, Auflösung und private Projektion      | `fix(engine): make strategic planning group draw a private choice` |
| SPG-02 | Plan-first-KI-Ownership und exakt gebundene Kartenwahl       | `fix(ai): bind strategic planning group choice to corp hand plan`  |
| SPG-03 | UI-/Integrationsregression, Wissenspflege und Abschlussgates | `test(cards): verify strategic planning group draw choice`         |

## Paketdetails

### SPG-01 – Engine-Vertrag

Ziel: Der Draw legt keine Karte mehr automatisch zurück, sondern öffnet eine
private Choice aus genau den gezogenen Karten.

Arbeit:

- Draw-Ergebnis als gebundene Optionsmenge erfassen;
- zusätzliche Karte ohne rekursiven Trigger ziehen;
- private `select_cards`-Choice mit genau einer Auswahl erzeugen;
- Auflösung revalidiert Quelle, Karte, HQ-Zone und Draw-Menge;
- gewählte Karte verdeckt unter R&D legen;
- öffentliche Payloads nur mit Quelle und Counts ergänzen.

Done-Gate:

- Pflichtdraw und Click-Draw öffnen die Choice;
- beide gezogenen Karten sind auswählbar;
- Runner-View und PublicEvent enthalten keine Identitäten;
- ungültige/stale Auswahl wird abgelehnt;
- Engine-Fokustests, Engine-Typecheck und Diffcheck sind grün.

### SPG-02 – Plan-first-KI

Ziel: Die Corp-KI trifft dieselbe Auswahl über den bestehenden
Handmanagement-Owner.

Arbeit:

- `corp.hand_and_agenda_management` um eine Draw-Filter-Choice-Phase
  erweitern;
- exakte Action-/Choice-/StateVersion-/Optionsbindung erzeugen;
- generische Keep-/Discard-Bewertung nur innerhalb der gebundenen Optionen
  verwenden;
- Resolver liest ausschließlich die Planbindung und verändert keine Action;
- Ownership-, Gegenfall- und Hidden-Info-Tests ergänzen.

Done-Gate:

- Planmodul, Instanz, Step, Route und Executor sind nachgewiesen;
- Auswahl bindet exakt eine angebotene Karte;
- `actionId` und Executor bleiben unverändert;
- fokussierte AI-Tests, AI-Typecheck und aktive Strukturgates sind grün.

### SPG-03 – Integration und Abschluss

Ziel: Human-UI, Replay und dokumentierter Kartenvertrag sind vollständig
abgesichert.

Arbeit:

- Kartenpanel zeigt beide Karten nur der Corp und sendet die Choice-LegalAction;
- Pflichtdraw-Regression samt Replay/StateHash ergänzen;
- lokale Classic-Regelentscheidung und Abschlussstatus aktualisieren;
- relevante Engine-, AI-, Web- und Workspace-Gates ausführen.

Done-Gate:

- fokussierte Engine-/AI-/Webtests grün;
- Engine-/AI-/Web-Typechecks grün;
- `check:ai`, Source-Structure und `git diff --check` grün;
- Arbeitsbranch sauber und lokal integrierbar.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree
  `C:\Projekte\NETGRID_SPG_DRAW_CHOICE` auf
  `codex/spg-draw-choice`;
- Hauptworkspace nur für den finalen lokalen Merge;
- jedes abgeschlossene Paket erhält einen eigenen Commit;
- vor Abschluss aktuelles `main` in den Arbeitsbranch integrieren;
- bevorzugt Fast-Forward-Merge nach `main`;
- kein Push und kein Pull Request;
- Worktree erst nach grünem Main-Check entfernen und in Git sowie Dateisystem
  verifizieren; gemergten Branch anschließend mit `git branch -d` löschen.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Strategic-Planning-Group-Draw-Choice-Fix vollständig und
sequenziell von SPG-01 bis SPG-03 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main.

Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_SPG_DRAW_CHOICE auf
Branch codex/spg-draw-choice. Die Engine bleibt Regelautorität. Die KI-Choice
bleibt an corp.hand_and_agenda_management, die exakte resolve_choice-Action,
Choice-ID, Optionsmenge und stateVersion gebunden. Führe Paketchecks aus und
committe jedes bestandene Paket. Stoppe bei Hidden-Info-, Replay-, StateHash-,
IllegalAction- oder Ownership-Verletzungen. Integriere danach main, führe die
finalen Gates aus, merge lokal nach main und entferne Worktree und Branch
verifiziert.
```

## Abschlusskriterien

- SPG-01 bis SPG-03 mit bestandenem Done-Gate committed;
- Human und KI können aus allen Karten des Draws exakt eine unter R&D legen;
- Pflichtdraw, Hidden-Info, Replay, StateHash und Plan-Ownership sind belegt;
- lokal nach `main` integriert;
- Worktree und Arbeitsbranch nachweislich entfernt;
- `/Goal` als complete markiert.

## Implementierungsstand und Verification

- SPG-01: Engine-Vertrag in `d5939cd8c`; die Draw-Schicht delegiert den
  Replacement-Effekt an
  `game/choices/strategic-planning-group-draw-choice.ts`, damit
  `draw-random.ts` frei von Choice- und Public-Payload-Logik bleibt.
- SPG-02: Plan-first-Ownership in `e04e2d0ff`; Executor ist
  `corp.hand_and_agenda_management`, Capability `draw_filter_window`.
- SPG-03: Human-Kartenpanel, echte Engine-zu-KI-Fortsetzung,
  Regelentscheidung und Betriebslog sind ergänzt.
- Vollständiger Engine-Lauf: 212 Dateien / 1.846 Tests grün.
- Vollständiger Web-Lauf: 76 Dateien / 759 Tests grün.
- AI-Shards: 552 Dateien / 4.535 Tests grün.
- Engine-, AI- und Web-Typecheck sowie AI-, Engine-Source-,
  CardImplementation-, Card-Abstraction-, Paketgrenzen-, Format- und
  Diff-Gates sind grün.
