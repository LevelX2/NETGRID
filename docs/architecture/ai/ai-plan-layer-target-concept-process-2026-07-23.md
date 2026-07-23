# KI-Planebene-Zielkonzept – Dokumentationsprozess

Status: abgeschlossen – initialer WIP-Stand; das Zielkonzept selbst bleibt
fortlaufend pflegbar
Quelle/Vorgabe: Nutzerauftrag vom 2026-07-23
Primärer Agent: `architecture-review-agent`
Branch: `codex/ai-plan-layer-target-concept`
Worktree: `C:\Projekte\NETGRID_AI_PLAN_LAYER_TARGET_CONCEPT`

## Zielprüfung

Die Vorgabe ist für einen ersten belastbaren WIP-Stand ausreichend präzise.
Gesucht ist noch kein Implementierungsplan und keine Codeänderung, sondern ein
führendes, fortlaufend pflegbares Zielkonzept, aus dem später sequenzielle
Umsetzungspakete abgeleitet werden können.

## Gesamtziel

Ein WIP-Architekturvertrag beschreibt die zukünftige NETGRID-KI-Planebene so
vollständig, dass:

- Planwahl vor Einzelaktionswahl stattfindet;
- Runner und Corp getrennte Scheduler mit einem gemeinsamen Planrahmen nutzen;
- Planmodule ihren internen Ablauf eigenständig verfeinern können;
- Lebenszyklus, Priorisierung, Steps, Ressourcen, Unterbrechungen,
  Wiederaufnahme und Abschluss einheitlich geregelt sind;
- alle freiwilligen KI-Aktionen auf einen aktiven Plan-Step zurückführbar sind;
- vorhandene TacticalPlan-Typen eingeordnet und Zielmodule benannt sind;
- konkrete historische Problemfälle als Abnahmeszenarien festgehalten sind;
- aus dem Zielkonzept später ein Implementierungsprozess geschnitten werden
  kann, ohne die Architekturfrage erneut grundsätzlich zu öffnen.

## Annahmen

- Das Dokument bleibt ausdrücklich `WIP`, bis ein späteres Architektur-Gate es
  als Implementierungsgrundlage freigibt.
- Der gemeinsame Rahmen wird strenger stabilisiert als die innere Logik
  einzelner Planmodule.
- Aktuelle Runtime-Typen sind Ist-Evidence, aber nicht automatisch der
  endgültige Zielvertrag.
- Bestehende Detailverträge bleiben als Quellen erhalten. Das neue Konzept
  führt sie zusammen und löst sie nicht stillschweigend auf.

## Nicht-Ziele

- keine Implementierung;
- keine Änderung produktiver KI-Wertungen;
- keine abschließende Prioritätskalibrierung mit festen Zahlenwerten;
- kein vollständiger Paketplan für den späteren Runtime-Umbau;
- keine Freigabe einer neuen Play-Strength-Stufe.

## Controller-Invarianten

- Die Engine bleibt einzige Regelautorität.
- Die KI wählt ausschließlich vorhandene `LegalActions`.
- Plan-Memory und Diagnostik bleiben side-safe, deterministisch und
  StateVersion-gebunden.
- Genau ein Paket ist aktiv.
- Neue belastbare Architekturentscheidungen werden in der Wissensbasis
  verankert.

## Automatische Fehlerbehandlung

- Widersprüche zwischen aktuellen Verträgen werden im WIP-Konzept als
  Ist-Abweichung oder offene Entscheidung markiert.
- Detailfragen, die den gemeinsamen Rahmen nicht blockieren, bleiben als
  ausdrücklich benannte WIP-Punkte offen.
- Ein Sicherheits- oder Hidden-Info-Konflikt stoppt die Ausarbeitung und
  erhält eine Removal Condition.

## Paketfolge

### P0 – Quellen- und Ist-Inventar

Ziel: Führende Wissensseiten, aktuelle Architekturverträge, produktive
TacticalPlan-Typen und bekannte Plan-/Action-Arbitration-Lücken erfassen.

Done-Gate:

- Pflichtwissen gelesen;
- aktuelle Plantypen vollständig inventarisiert;
- führende und historische Quellen getrennt.

Commit: `docs(ai): inventory plan layer target concept sources`

### P1 – Gemeinsamer Planrahmen

Ziel: Planmodul-Vertrag, Scheduler-Zyklus, Lebenszyklus, Portfolio,
Priorisierung, Steps, Ressourcen und Commitment-Ketten definieren.

Done-Gate:

- jede freiwillige Hauptaktion besitzt eine Planherkunft;
- Modulgrenze und Kernverantwortung sind eindeutig;
- EndTurn-, Override- und Repetition-Regeln sind festgelegt.

Commit: `docs(ai): define modular plan layer target framework`

### P2 – Runner- und Corp-Zielmodule

Ziel: getrennte Scheduler, gemeinsamer Kernel, aktuelle Plantypen und
Zielmodul-Inventar mit Migrationsrichtung dokumentieren.

Done-Gate:

- alle aktuellen Runner- und Corp-Plantypen eingeordnet;
- generische, strategische, reaktive und unterstützende Module getrennt;
- Erweiterungsregeln pro Planmodul dokumentiert.

Commit: `docs(ai): define runner and corp plan module targets`

### P3 – Ausführung, Diagnostik und Abnahme

Ziel: Zugablauf, Planwechsel, historische Beispielszenarien, Diagnostik,
Tests und spätere Umsetzungsableitung festlegen.

Done-Gate:

- Highlighter-R&D- und Manhunt-Flatline-Szenarien abgedeckt;
- Regressionen für Folgeaktionen, negative Aktionslandschaft und EndTurn
  beschrieben;
- Testpyramide und Architektur-Gates vollständig.

Commit: `docs(ai): specify plan scheduler execution and acceptance`

### P4 – Wissensverankerung und Review

Ziel: Konzept als führendes WIP-Artefakt verlinken, Konsistenz prüfen und
Dokumentationsstand abschließen.

Done-Gate:

- AI-Architekturindex und Wissensindex verweisen auf das Konzept;
- `git diff --check` ist grün;
- Markdown-Struktur, interne Links und Ist-/Zieltrennung sind geprüft.

Commit: `docs(ai): anchor plan layer target concept`

## Verifikationsregeln

Nach jedem Paket:

```text
git diff --check
git status --short
```

Zum Abschluss zusätzlich:

```text
rg -n "KI-Planebene.*Ziel" docs/architecture/ai KI-Wissen-NETGRID
```

Da ausschließlich Dokumentation geändert wird, sind keine Runtime-Tests
erforderlich. Codebezogene Aussagen werden gegen die produktiven
`packages/ai/src/plans/`-Verträge geprüft.

## Worktree-, Git- und Integrationsregeln

- Arbeit ausschließlich im oben genannten Worktree.
- Hauptworkspace ausschließlich für die abschließende lokale Integration.
- Nur prozesszugehörige Dokumentationsänderungen committen.
- Kein Push und kein Pull Request.
- Vor einem finalen Merge aktuelles `main` integrieren und die
  Dokumentationschecks erneut ausführen.

## Abschlusskriterien

- WIP-Zielkonzept vollständig angelegt;
- aktuelle Plantypen und Zielmodule enthalten;
- gemeinsame Rahmeninvarianten und side-spezifische Verantwortungen geklärt;
- Wissensbasis verlinkt;
- Arbeitsbranch sauber und lokal nach `main` integrierbar.
