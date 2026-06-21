# AI213-AI221 Practical Micro Fixes Process

Status: in Umsetzung

Quelle/Vorgabe: Ergebnisanalyse nach AI201-AI212 vom 2026-06-21.

## Zielprüfung

Die Vorgabe ist präzise genug für automatische Abarbeitung. Gesamtziel, Paketfolge, Scope-Grenzen, Stop-Regeln, Artefakte, Tests und Merge-Erwartung sind bestimmbar. Die Umsetzung startet direkt, weil der Auftrag die sorgfältige Umsetzung ausdrücklich verlangt.

## Gesamtziel

AI213 bis AI221 wechseln von weiterer Proof-Infrastruktur zu kleinen praktischen Runtime-Micro-Fixes. Alle Eingriffe wählen ausschließlich aus vorhandenen `input.legalActions`, bleiben eng geflaggt, safety-gated und werden per Flag-off/Flag-on-Vergleich bewertet.

## Annahmen

- Lokaler `main` ist der Integrationsstand, auch wenn er vor `origin/main` liegt.
- Runtime-Micro-Fixes dürfen default-off existieren; default-on ist nur erlaubt, wenn AI218/AI219 praktische Verbesserung ohne Safety-Verschlechterung zeigen.
- Wenn kein Fix x5/x10 oder eine Fokus-Fixture verbessert, bleibt AI219 No-Go.
- Metriken aus AI212 sind Baseline-Referenz: x5 11/20 und x10 23/40 Action-Limits, 0 IllegalActions, 0 ReplayFailures, 0 Hidden-Info-Marker.

## Nicht-Ziele

- Keine neue LegalAction-Erzeugung.
- Keine Hidden-Info-Ausweitung.
- Keine generischen Credit-, Draw-, Run- oder Corp-Economy-Strafen.
- Keine weitere allgemeine Witness-/Scorecard-only-Serie.
- Keine produktive Übernahme eines Fixes, der x5/x10, `unsafeScoreChosen` oder `repeated_no_progress_run` verschlechtert.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- KI-Auswahl darf nur auf bereits angebotene LegalActions zeigen.
- Jeder nicht-triviale Guard dokumentiert, warum er sicher ist.
- Flag-off muss das bestehende Verhalten exakt erhalten.
- Safety-Fails stoppen den Paketprozess.

## Automatische Fehlerbehandlung

- Rote Tests werden im aktuellen Paket behoben.
- Ein Micro-Fix, der nur in Tests synthetisch wirkt, aber x5/x10 verschlechtert, wird nicht übernommen.
- Wenn ein Fix keine Verbesserung zeigt, wird er als No-Go oder default-off Debug/Trial belassen, nicht als produktive Änderung.

## Sicherheitsblocker

- IllegalAction, ReplayFailure oder Hidden-Info-Marker.
- Auswahl einer Action, die nicht in `input.legalActions` enthalten ist.
- Verschlechterung von x5 oder x10 ohne explizit dokumentierten positiven Tradeoff.
- Anstieg von `unsafeScoreChosen` oder `repeated_no_progress_run` ohne harte Begründung.

## State Machine

1. `prepared`: Prozessartefakt committed.
2. `comparator_ready`: AI213 Comparator default-off committed.
3. `micro_rules_ready`: AI214-AI217 als eng geflaggte Micro-Regeln committed.
4. `trial_complete`: AI218 Einzel-/Kombinationsvergleich dokumentiert.
5. `cutover_decided`: AI219 übernimmt genau einen Fix oder dokumentiert No-Go.
6. `scorecard_complete`: AI220 Practical Play Scorecard erstellt.
7. `sweep_complete`: AI221 Full Sweep grün.
8. `integrated`: Arbeitsbranch lokal nach `main` gemerged.
9. `cleaned`: Worktree entfernt.

## Paketfolge

| Paket | Titel | Commit |
| --- | --- | --- |
| AI213 | Practical Runtime Baseline - Flagged Comparator | `feat(ai): add practical micro runtime comparator` |
| AI214 | Runner Visible Coverage Install Micro-Fix | `fix(ai): prefer visible coverage install over stale setup` |
| AI215 | Corp Stale Punish Deactivation Micro-Fix | `fix(ai): deactivate stale corp punish intent` |
| AI216 | Corp Safe Scoreline Preference Micro-Fix | `fix(ai): prefer safe corp scoreline over passive setup` |
| AI217 | Run Payoff Completion Micro-Fix | `fix(ai): complete legal run payoffs before setup` |
| AI218 | Practical Micro-Fix Trial | `test(ai): compare practical micro fixes` |
| AI219 | Minimal Positive Cutover | `fix(ai): enable one practical micro improvement` |
| AI220 | Practical Play Scorecard | `docs(ai): report practical play improvements` |
| AI221 | Full Sweep | `test(ai): complete practical micro improvement sweep` |

## Paketdetails

AI213 ergänzt nur Flag, Comparator und Debug. AI214-AI217 implementieren eng begrenzte Micro-Regeln. AI218 misst einzeln und kombiniert. AI219 entscheidet maximal einen positiven Cutover oder No-Go. AI220/AI221 berichten und verifizieren.

## Verifikationsregeln

- Nach jedem Paket: passende Unit-/Builder-Checks, `git diff --check`, Commit.
- Runtime-Pakete: gezielte AI-Tests und Typecheck.
- Trial-/Sweep-Pakete: x5/x10-Trace-Vergleiche nach Vorgabe.
- Final: vollständige Pflichtliste aus AI221.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_AI213_AI221_PRACTICAL_MICRO_FIXES`.
- Arbeitsbranch: `codex/ai213-ai221-practical-micro-fixes`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für den finalen lokalen Merge.
- Jeder Paketabschluss ist ein eigener Commit.
- Kein Push ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

Arbeite AI213 bis AI221 sequenziell ab. Nutze ausschließlich den Arbeits-Worktree. Wähle nur aus `input.legalActions`. Keine Hidden-Info-Ausweitung, keine generischen Malus-Regeln. Wenn ein Fix x5/x10 oder Safety verschlechtert, verwerfe ihn oder belasse ihn default-off mit No-Go-Dokumentation. Committe jedes Paket.

## Abschlusskriterien

- AI213-AI221-Artefakte existieren.
- Flag-off bleibt unverändert.
- Jeder Micro-Fix ist eng getestet und im Trial bewertet.
- AI219 trifft eine belegte Cutover- oder No-Go-Entscheidung.
- AI221 Full Sweep ist grün.
- Arbeitsbranch ist lokal nach `main` integriert und Worktree entfernt.
