# Armageddon: Semantisches Entscheidungsfenster

## Status

Abgeschlossen. Arbeitsbranch: `codex/armageddon-semantic-window`.

## Quelle und Ziel

Ein AI-Selbstspiel mit `Proteus Runner - HQ Virus & Derez` blockierte nach
einem erfolgreichen R&D-Run mit `SemanticCoverageFallbackError` fuer eine
`trigger_ability` von Armageddon. Ziel ist eine korrekte optionale
Rules-Engine-Wahl und eine side-safe semantische KI-Behandlung.

## Annahmen und Nicht-Ziele

- Die Karte bleibt auf ihren bestehenden Regeltext begrenzt.
- Keine allgemeine Freigabe eines Fallbacks fuer beliebige `trigger_ability`.
- Die KI bewertet nur PlayerView, LegalActions und erlaubte Metadaten.
- Keine Deckbalance- oder Kartenwertanpassung ausserhalb dieses Fensters.

## Controller-Invarianten

- Armageddon ist optional: normaler R&D-Zugriff bleibt moeglich.
- Jede KI-Entscheidung waehlt ausschliesslich eine LegalAction.
- Hidden Information bleibt ausserhalb der KI-Bewertung.
- Engine-Zustand, Eventlog und Replay bleiben deterministisch.

## Paketfolge

### ASW-01: Optionale Engine-Wahl

**Ziel:** Das erfolgreiche-R&D-Run-Fenster bietet Armageddon und normalen
Zugriff als echte Alternativen.

**Arbeit:** Legal-Action-Aufbau und Ausfuehrung so anpassen, dass der
Verzicht den Zugriff fortsetzt; Engine-Tests fuer beide Pfade ergaenzen.

**Done-Gate:** Beide Pfade sind legal, deterministisch und getestet.

**Commit:** `fix(engine): preserve optional Armageddon R&D access`

### ASW-02: Semantische KI-Behandlung

**Ziel:** Die Semantic Runtime erkennt den strukturierten
Armageddon-Zugriffsersatz und kann ihn gegen normalen Zugriff bewerten.

**Arbeit:** Strukturierte Binding-/Taktiksignale und einen ausschliesslich auf
den eindeutig gebundenen Fall beschraenkten Fallback ergaenzen; Unit-Tests
fuer Auswahl und Guardrail.

**Done-Gate:** Kein allgemeiner `trigger_ability`-Fallback; der gebundene
Armageddon-Fall erzeugt eine entscheidbare KI-Option.

**Commit:** `fix(ai): handle Armageddon access replacement`

### ASW-03: Regression und Evidenz

**Ziel:** Vollstaendige Regression des vorher blockierten Fensters.

**Arbeit:** Integrations- oder Simulationsregression ausfuehren, Checks
dokumentieren und den AI-Readiness-Status mit der nachgewiesenen Abdeckung
abgleichen.

**Done-Gate:** Relevante Engine- und AI-Checks bestehen; die vorherige
Semantic-Coverage-Blockade tritt nicht auf.

**Commit:** `test(ai): cover Armageddon successful-run decision`

## Verifikationsergebnis

- Gezielte Engine-Tests fuer Access-Actions und Successful-Run-Interventions:
  16 Tests bestanden.
- Gezielte AI-Tests fuer Action-Semantik und Runtime-Coverage-Fallback:
  37 Tests bestanden.
- Reproduktion mit Seed `fast-advance-baby-2026-07-22-3-004`: kein
  `SemanticCoverageFallbackError`, Replay erfolgreich; der Lauf erreichte nur
  das konfigurierte Limit von 480 Aktionen.
- `corepack pnpm check:ai`, `corepack pnpm check:ai-deck-doctrine-strategy`
  und `corepack pnpm check:proteus-ai-readiness` bestanden.

## Fehlerbehandlung

Bei einem fehlenden Legal-Action-Verzichtspfad oder einer nicht side-safely
bewertbaren Semantik wird das aktuelle Paket nicht abgeschlossen. Die
Abweichung wird mit reproduzierbarem Test und Removal Condition dokumentiert.

## Worktree- und Integrationsregeln

Die Arbeit erfolgt ausschliesslich in
`C:\Projekte\NETGRID_armageddon_semantic_window`. Nach den Paketcommits wird
aktuelles `main` defensiv integriert, geprueft, lokal nach `main` gemergt und
der Worktree mit Branch erst danach entfernt.

## Verifikation

- gezielte Engine- und AI-Vitest-Tests
- `corepack pnpm check:ai`
- `git diff --check`
- der reproduzierende Selbstspieltest, soweit lokal verfuegbar

## /Goal

`/Goal Arbeite den Prozess Armageddon Semantic Window vollstaendig und
sequenziell von ASW-01 bis ASW-03 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, die Paketdatei und die
Package-Anweisungen. Arbeite ausschliesslich im Worktree
C:\\Projekte\\NETGRID_armageddon_semantic_window auf Branch
codex/armageddon-semantic-window. Nutze den Hauptworkspace nur fuer den
finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische
Fortsetzung moeglich ist. Arbeite immer nur am aktuellen Paket, fuehre
Paketchecks aus und committe jedes abgeschlossene Paket. Bei Sicherheitsblocker
stoppe mit Blocker-Report und Removal Condition. Nach Abschluss: final
verifizieren, lokal nach main mergen, main pruefen, Worktree und Branch
verifizieren entfernen und Goal erst dann als complete markieren.`
