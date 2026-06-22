# AI Trace Bid Efficiency Process 2026-06-22

## Status

`review_complete_pending_final_green`

Arbeitsbranch: `codex/ai-trace-bid-efficiency`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_TRACE_BID_EFFICIENCY`

Hauptworkspace: `C:\Projekte\NETGRID`

## Paketfortschritt

- `AI-TRACE-BID-0`: abgeschlossen und committed.
- `AI-TRACE-BID-1`: abgeschlossen und committed.
- `AI-TRACE-BID-2`: abgeschlossen und committed.
- `AI-TRACE-BID-3`: abgeschlossen und committed.
- `AI-TRACE-BID-4`: Review und Wissenspflege abgeschlossen; FINAL-GREEN steht noch aus.
- `FINAL-GREEN`: ausstehend.

## Quelle/Vorgabe

Quelle ist der Playtest-Screenshot vom 2026-06-22: Der Runner hat nach einem `Chance Observation`-Trace 5 gegen ein Korp-Gebot von 3 mit 2 Credits geboten, obwohl der Trace damit weiterhin erfolgreich war. Der Runner fiel dadurch auf 0 Credits, ohne das Trace-Ergebnis zu ändern.

Der Prozess folgt dem Skill `paketprozess-worktree-goal`: eigener Worktree, sequenzielle Pakete, Checks je Paket, Commit je Paket, finaler lokaler Merge nach `main`, kein Push.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise.

Bestimmbar sind:

- Gesamtziel: Trace-Bidding der KI darf keine Credits ausgeben, wenn der Einsatz das Trace-Ergebnis nicht verbessern kann.
- Reihenfolge: Prozess/Preflight, Ist-Analyse und Repro, generische Outcome-Delta-Bid-Policy, Runtime-Integration, Review/Wissenspflege, finaler Green-Lauf und lokaler Merge.
- In Scope: `packages/ai/src/**`, fokussierte AI-Tests, AI-Diagnostik und Review-/Wissensartefakte.
- Nicht-Ziele: keine Engine-Regeländerung, keine neue Trace-Regel, keine LegalAction-Erzeugung, keine Karten-Sonderlogik, keine UI-Änderung.
- Abnahme: Der konkrete Fall `Trace 5`, Korp-Gebot 3, Runner 2 Credits erzwingt Runner-Gebot 0; Fälle mit realer Ergebnisverbesserung bleiben erlaubt; relevante AI-Checks sind grün.
- Branch-/Worktree-Erwartung: eigener Branch `codex/ai-trace-bid-efficiency`, final lokal nach `main`.

Konservative Annahme: Die KI sieht beim Runner-Trace-Bid nur side-safe Trace-Informationen, die Engine und PlayerView ohnehin legal bereitstellen. Falls ein benötigter Trace-Parameter nicht side-safe oder nicht zuverlässig verfügbar ist, darf der Fix nur auf eindeutig bekannte Felder angewendet werden und muss den unbekannten Fall konservativ behandeln.

## Gesamtziel

Die AI erhält eine generische Trace-Bid-Effizienzregel:

```text
Bewerte nur legale Bid-Actions.
Bestimme für jede legale Bid-Aktion das erwartete Trace-Ergebnis aus side-safe sichtbaren Trace-Feldern.
Wenn mehrere legale Bids dasselbe gewünschte Ergebnis liefern, wähle den billigsten Bid.
Wenn kein bezahlbares Runner-Gebot den Trace von verloren zu gewonnen beziehungsweise vermieden ändern kann, wähle 0.
Wenn das aktuelle Ergebnis bereits günstig ist, gib keine zusätzlichen Credits aus, solange kein billigerer legaler Bid dasselbe Ergebnis hält.
```

Der Fix ist nicht auf `Chance Observation` beschränkt. Er gilt für Runner- und, soweit sicher modellierbar, auch für Korp-Trace-Bids, ohne neue Legalität zu erzeugen.

## Nicht-Ziele

- Keine Änderung an `packages/engine/**`.
- Keine Änderung an `LegalAction`-Erzeugung.
- Keine Änderung an `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung in PlayerViews, AI-Inputs, Debug, Logs, Reports, Reconnect-Payloads oder Simulationstraces.
- Keine produktive CardId-Sonderlogik für `Chance Observation`.
- Keine neue Kartenfreigabe und keine Änderung an Kartenmanifesten.
- Keine UI-Änderung.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Ein Paket wird erst abgeschlossen, wenn sein Done-Gate erfüllt ist.
- Die KI wählt weiterhin ausschließlich Actions aus `input.legalActions`.
- Die KI erzeugt keine Legalität und verändert keine Engine-Regeln.
- Trace-Bid-Effizienz ist ein generisches Action-Selection-Guardrail, keine Kartensonderregel.
- Debug-, Report- und Trace-Ausgaben bleiben redigiert.
- Unknown-Fälle dürfen nicht durch riskante Annahmen optimiert werden.

## Automatische Fehlerbehandlung

- Rote Tests werden im aktiven Paket eingegrenzt und eng behoben.
- Kein `test.skip`, `test.only`, pauschales Löschen von Tests oder breites Lockern von Assertions.
- Wenn Trace-Ergebnis-Projektion wegen fehlender Daten nicht sicher möglich ist, bleibt der vorhandene Auswahlpfad erhalten und der Fall wird als Follow-up dokumentiert.
- Wenn eine sinnvolle Entscheidung Hidden-Info oder Engine-Änderungen verlangen würde, wird ein Blocker-Report geschrieben.
- Konflikte mit weitergelaufenem `main` werden defensiv gelöst; beide Intentionen bleiben erhalten, wenn fachlich kompatibel.
- Kein `git reset --hard` und kein pauschales Revert fremder Änderungen.

## Sicherheitsblocker

Sofort stoppen und Blocker-Report schreiben, wenn:

- eine AI-Action nicht aus `input.legalActions` stammt;
- eine Änderung neue LegalAction-Erzeugung oder Engine-Vertragsänderung verlangt;
- Hidden-Info-Grenzen breiter werden müssten;
- Replay, StateHash oder Randomness beeinflusst würden;
- Debug-/Trace-/Reportdaten verdeckte Gegnerinformationen leaken;
- die Trace-Bid-Policy für Unknown-Fälle produktiv rät statt konservativ zu bleiben;
- der Fix nur als konkrete Karten-Sonderlogik lösbar wäre.

Removal Condition: Der Blocker ist entfernt, wenn der betroffene Vertrag ohne Scope-Erweiterung erhalten und durch fokussierte Checks belegt ist.

## State Machine

```text
process_prepared
  -> trace_bid_0_process_preflight
  -> trace_bid_1_discovery_and_repro
  -> trace_bid_2_generic_policy
  -> trace_bid_3_runtime_integration
  -> trace_bid_4_review_and_knowledge
  -> final_green
  -> merge_to_main
  -> complete
```

## Paketfolge

| Paket | Titel | Done-Gate | Commit |
| --- | --- | --- | --- |
| `AI-TRACE-BID-0` | Prozessartefakt und Preflight | Artefakt existiert, Worktree sauber, `git diff --check` grün | `docs(ai): define trace bid efficiency process` |
| `AI-TRACE-BID-1` | Ist-Analyse und Regression-Repro | Trace-Bid-Auswahlpfade gefunden; Screenshot-Fall als failing Test oder enger Repro-Test dokumentiert | `test(ai): reproduce wasteful runner trace bid` |
| `AI-TRACE-BID-2` | Generische Outcome-Delta-Bid-Policy | Pure Hilfslogik klassifiziert Bids nach Ergebnis und Kosten; aussichtslose Runner-Bids werden auf 0 reduziert; Ergebnis-verbessernde Minimalbids bleiben möglich | `feat(ai): add trace bid efficiency policy` |
| `AI-TRACE-BID-3` | Runtime-Integration und Diagnostik | `chooseRunnerAction` und sichere Korp-Pfade nutzen die Policy nur über LegalActions; Debug/Evidence bleibt side-safe | `fix(ai): route trace bids through efficiency guard` |
| `AI-TRACE-BID-4` | Review und Wissenspflege | Final Review beschreibt Scope, Checks, Grenzen und konkreten Screenshot-Fix; Wissensbasis/Log bei Wiederverwendbarkeit aktualisiert | `docs(ai): review trace bid efficiency fix` |
| `FINAL-GREEN` | Vollständiger AI-Green-Lauf und lokaler Merge | relevante AI-Tests, Typecheck, `git diff --check`, `git status --short`; Branch lokal nach `main` integriert und Worktree entfernt | `docs(ai): record trace bid efficiency final green` |

## Paketdetails

### AI-TRACE-BID-0: Prozessartefakt und Preflight

Ziel: Prozess, Worktree, Branch und Abnahmeregeln versionieren.

Arbeit:

- Hauptworkspace-Status prüfen.
- Worktree `C:\Projekte\NETGRID_AI_TRACE_BID_EFFICIENCY` auf Branch `codex/ai-trace-bid-efficiency` anlegen.
- Prozessartefakt in den Arbeitsbranch übernehmen.
- Relevante Agenten- und Wissensvorgaben lesen.

Checks:

```bash
git status --short
git diff --check
```

### AI-TRACE-BID-1: Ist-Analyse und Regression-Repro

Ziel: Den konkreten Screenshot-Fehler als Testanker fassen, ohne sofort Verhalten zu ändern.

Arbeit:

- Trace-Bid-Entscheidungspfade in `packages/ai/src/**` suchen.
- Ermitteln, ob Runner-Bids über `chooseRunnerAction`, Semantic Runtime, Legacy-Fallback oder Choice-spezifische Heuristik laufen.
- Einen fokussierten Test bauen, der den Fall abbildet:
  - Trace base 5.
  - Korp-Gebot 3 ist bekannt beziehungsweise aus dem Pending-Trace-Kontext side-safe verfügbar.
  - Runner hat 2 Credits und 0 Link beziehungsweise keine ausreichende Link-Hilfe.
  - Legale Runner-Bids enthalten `bid_0`, `bid_1`, `bid_2`.
  - Erwartung nach Fix: `bid_0`.
- Zusätzlich mindestens einen Gegenfall vormerken, in dem ein Runner-Minimalbid das Ergebnis tatsächlich ändern kann.

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
git diff --check
```

Wenn bestehende Testdateien anders geschnitten sind, die engsten vorhandenen AI-Testdateien nutzen und im Paketabschluss dokumentieren.

### AI-TRACE-BID-2: Generische Outcome-Delta-Bid-Policy

Ziel: Eine pure, wiederverwendbare Policy entscheidet über Trace-Bid-Effizienz.

Arbeit:

- Eine kleine Hilfsfunktion in passender AI-Modulstruktur anlegen oder vorhandene Trace-Hilfen erweitern.
- Eingabe nur aus side-safe AI-Input, Trace-Kontext und legalen Bid-Actions ableiten.
- Bid-Actions strukturiert parsen statt über fragile Textvergleiche, soweit das bestehende Action-Schema das erlaubt.
- Ergebnisprojektion generisch modellieren:
  - Runner: `runnerTotal = runnerLink + runnerBid + bekannte legale Link-/Trace-Credits`, soweit sicher verfügbar.
  - Korp: `corpTotal = baseTraceStrength + corpBid + bekannte legale Korp-Trace-Credits`, soweit sicher verfügbar.
  - Unknown-Felder konservativ behandeln.
- Dominierte Bids verwerfen:
  - höherer Preis bei gleichem Ergebnis;
  - Runner-Bid > 0, wenn auch maximaler bezahlbarer Bid das Ergebnis nicht drehen kann;
  - Overbid über den minimal nötigen Betrag hinaus, wenn derselbe Erfolg billiger erreichbar ist.
- Keine Spezialfälle nach Karten-ID einbauen.

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

### AI-TRACE-BID-3: Runtime-Integration und Diagnostik

Ziel: Die Policy wirkt im echten AI-Auswahlpfad.

Arbeit:

- `chooseRunnerAction` so härten, dass Trace-Bid-Choices vor finaler Auswahl durch die Effizienzpolicy gehen.
- Korp-Bids nur dann einbeziehen, wenn die Outcome-Projektion für den Korp-Pfad side-safe und eindeutig ist; sonst Runner-Fix priorisieren und Korp-Follow-up dokumentieren.
- Sicherstellen, dass No-Candidate- und Legacy-Fallbacks erhalten bleiben.
- Debug/Evidence mit neutralen Gründen ergänzen, z. B. `trace_bid_no_outcome_delta`, `trace_bid_minimal_winning_bid`, `trace_bid_unknown_context`.
- Redaction prüfen: keine gegnerischen Hidden-Zone-Daten, keine FullState-Dumps.

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

### AI-TRACE-BID-4: Review und Wissenspflege

Ziel: Umsetzung, Grenzen und Nachweise dokumentieren.

Arbeit:

- Final Review unter `docs/reviews/ai/` anlegen.
- Das Prozessartefakt auf den realen Abschlussstand aktualisieren.
- Wiederverwendbare Erkenntnisse in der Wissensbasis oder im Log ergänzen, falls der Fix einen dauerhaften AI-Vertrag etabliert.
- Konkrete Restpunkte nur als Follow-up dokumentieren, nicht still in das Paket erweitern.

Checks:

```bash
git diff --check
```

### FINAL-GREEN

Pflichtchecks:

```bash
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
git status --short
```

Wenn der vollständige AI-Testlauf wegen bekannter, nicht paketbezogener Baseline rot ist, fokussierte Tests und Typecheck ausführen, Baseline-Abweichung mit konkreten Testnamen dokumentieren und nicht als grün behaupten.

## Verifikationsregeln

- Nach jedem Codepaket paketbezogene Vitest-Dateien und `git diff --check`.
- Nach Codeänderungen immer `corepack pnpm --filter @netgrid/ai typecheck`.
- Am Ende vollständiger `corepack pnpm --filter @netgrid/ai test`, soweit Baseline dies erlaubt.
- Wenn Dateien außerhalb `packages/ai` geändert werden, betroffene Paketchecks ergänzen.
- Der Screenshot-Fall ist ein Muss-Test: Runner darf bei sicher aussichtslosem Trace-Bid keine Credits ausgeben.
- Mindestens ein Positivfall ist Pflicht: Runner darf minimal bieten, wenn der Bid das Trace-Ergebnis tatsächlich verbessert.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Arbeits-Worktree.
- Hauptworkspace nur für finalen lokalen Merge.
- Jeder Paketabschluss erhält einen thematischen Commit.
- Kein Push und kein Pull Request.
- Vor finalem Merge Arbeitsbranch sauber und geprüft.
- Aktuelles `main` vor finalem Merge in den Arbeitsbranch integrieren.
- Fast-Forward-Merge nach `main` bevorzugt; falls nicht möglich, Ursache prüfen und dokumentieren.
- Arbeits-Worktree erst nach erfolgreichem Merge und Hauptworkspace-Checks entfernen.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI-TRACE-BID-0 bis AI-TRACE-BID-4 plus FINAL-GREEN vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, agents/release-implementation-agent.md, agents/card-enablement-ai-knowledge-agent.md und docs/architecture/ai/ai-trace-bid-efficiency-process-2026-06-22.md.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_TRACE_BID_EFFICIENCY auf Branch codex/ai-trace-bid-efficiency.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe/aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Prozessartefakt ist committed.
- Alle Pakete und FINAL-GREEN sind abgeschlossen oder ein Sicherheitsblocker ist dokumentiert.
- Paketcommits liegen auf `codex/ai-trace-bid-efficiency`.
- Der konkrete Screenshot-Fall wählt Runner-`bid_0`.
- Ergebnis-verbessernde minimale Trace-Bids bleiben möglich.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.
- Finale AI-Checks, Typecheck und `git diff --check` sind grün oder eng als Baseline-Abweichung dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- Hauptworkspace ist nach Merge geprüft.
- Arbeits-Worktree ist entfernt.
