# AI Source Structure Optimization Loop 1

Status: package_done:AI-SRCOPT-1

Datum: 2026-06-22

## Quelle und Vorgabe

Aus den Review- und Ergebnisanalysen zur AI Play-Strength Decision Spine,
Access Intelligence Consolidation und Maturation-Folgearbeit bleibt ein
begrenzter Strukturrest im AI-Paket offen. Der Nutzer hat beauftragt, die
Source-Code-Optimierungen über ein verbindliches Goal in einer Schleife so weit
auszuführen, wie es innerhalb der aktuellen Codex-Grenzen belastbar möglich ist.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise, wenn die
Schleife nicht als unendlicher Refactoring-Auftrag verstanden wird. Diese erste
Schleife ist deshalb bewusst endlich: Sie misst die aktuellen Strukturreste,
setzt die höchsten risikoarmen Verbesserungen sequenziell um, verifiziert jedes
Paket und bewertet danach das verbleibende Potential neu.

## Gesamtziel

Die AI-Quellstruktur soll nach der Access-Intelligence-Arbeit weiter stabilisiert
werden, ohne Regel- oder KI-Verhalten breit umzubauen. Ziel ist eine klarere
Schichtgrenze zwischen `access`, `decision`, `memory`, `runtime/evaluation` und
dem weiterhin großen öffentlichen `index.ts`.

## Annahmen

- `main` ist der lokale Integrationsbranch.
- Der lokale Stand enthält bereits den Access-Intelligence-Abschluss und einen
  zusätzlichen lokalen Dokumentationscommit.
- Remote-Push oder Pull Request gehören nicht zu dieser Schleife.
- Kleine, vertragserhaltende Export- und Adapteränderungen sind erlaubt.
- Verhaltenserweiterungen sind nur zulässig, wenn sie bestehende Semantik
  präziser absichern und durch Tests gedeckt sind.

## Nicht-Ziele

- Kein großer Rewrite von `packages/ai/src/index.ts`.
- Keine Änderung der Rules Engine oder der Spielregeln.
- Keine neue Kartenfreischaltung.
- Keine Produkt-, UI- oder Serverarbeit.
- Keine Remote-Integration ohne separaten Nutzerauftrag.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- AI-Module leiten Entscheidungen aus strukturierten Daten ab, nicht aus
  frei geparsten Evidence-Strings als primärer Quelle.
- `access` darf nicht von Runtime-, Evaluation- oder Public-Index-Implementierung
  abhängen.
- Report- und Review-Dokumente dürfen keine Runtime-Importe etablieren.
- Jede Paketänderung erhält eigene Checks und einen eigenen Commit.

## Automatische Fehlerbehandlung

- Bei roten Tests wird nur der aktuelle Paketumfang eng debuggt.
- Bei Scope-Wachstum wird der neue Fund als Follow-up notiert, nicht still in das
  aktive Paket gezogen.
- Bei widersprüchlichen Verträgen zwischen alten und neuen Access-Memory-Pfaden
  wird ein Blocker dokumentiert.
- Bei Mergekonflikten werden beide fachlichen Intentionen gelesen und erhalten,
  sofern sie kompatibel sind.

## Sicherheitsblocker

- Verdeckte Kartendaten könnten in Public Events, PlayerViews, Logs oder AI
  Inputs gelangen.
- Determinismus, Replay oder StateHash würden durch die Änderung berührt.
- `applyAction`-Validierung oder LegalActions-Vertrag würde indirekt geschwächt.
- Access-Entscheidungen müssten aus unstrukturierten Evidence-Strings abgeleitet
  werden.

## State Machine

1. `prepared_for_execution`
2. `worktree_created`
3. `package_active:<ID>`
4. `package_done:<ID>`
5. `final_green`
6. `merged_to_main`
7. `complete`
8. `blocked:<reason>`

## Paketfolge

1. `AI-SRCOPT-0` Preflight, Messung und Statuskorrektur
2. `AI-SRCOPT-1` Access Outcome Memory Legacy-Adapter bereinigen
3. `AI-SRCOPT-2` Access Decision Projection Boundary härten
4. `AI-SRCOPT-3` RunTarget-Guidance-Hilfen aus Public Index/Tactical Duplication lösen
5. `AI-SRCOPT-4` Struktur-Gates und Abschlussdokumentation aktualisieren
6. `FINAL-GREEN` Vollständige Paketverifikation und lokaler Merge nach `main`

## AI-SRCOPT-0 Messbefund

Ausgangsstand nach Worktree-Anlage:

- Branch: `codex/ai-source-structure-optimization-loop-1`
- Basis: `de180046 docs(ai): prepare source structure optimization loop`
- `packages/ai/src/index.ts`: weiterhin größter AI-Entry mit ca. 1,3 MB.
- Konkrete Strukturreste:
  - `packages/ai/src/memory/remote-access-outcome.ts` existiert neben dem
    neueren `packages/ai/src/access/access-outcome-memory.ts` und ist nur noch
    durch Legacy-Tests direkt sichtbar.
  - Access-Module importieren Projection-Typen/Funktionen noch direkt aus
    `decision/access-decision-projection`.
  - `index.ts` enthält noch eigene RunTarget-Guidance-Gewichtung, während
    `tactical-plans.ts` eine verwandte Recommendation-Delta-Logik hält.
- Veralteter Abschlussstatus:
  - `docs/reviews/ai/ai-access-intelligence-consolidation-final-report-2026-06-21.md`
    stand noch auf `implementation_complete_before_final_green`.
  - Der Status wurde auf `complete` korrigiert und verweist auf den separat
    laufenden Strukturprozess.

## AI-SRCOPT-1 Ergebnis

- Der neue `access/access-outcome-memory`-Pfad besitzt mit
  `accessOutcomeMemoryPlanEvidence` einen strukturierten Helper für
  No-Plan-Bonus-Evidence.
- `tactical-plans.ts` nutzt diesen Helper statt einer lokalen Dublette.
- `memory/remote-access-outcome.ts` ist als Legacy-Kompatibilitätsadapter
  enger gefasst:
  - kein direkter `decision/access-decision-projection`-Import mehr;
  - Outcome-Evidence wird über Access-Outcome-Evidence gespiegelt;
  - der alte `declinedTrashOutcomePlanEvidence`-Parser ist deprecated und
    status-gated.
- Checks:
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/access/access-outcome-memory.test.ts src/memory/remote-access-outcome.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot`
  - `corepack pnpm --filter @netgrid/ai typecheck`
  - `git diff --check`

## Paketdetails

### AI-SRCOPT-0 Preflight, Messung und Statuskorrektur

Ziel: Aktuellen Strukturstand und stale Dokumentationsstatus festhalten.

Arbeit:

- AI-Strukturreste mit `rg`, Importscan und relevanten Dateigrößen messen.
- Den finalen Access-Intelligence-Reportstatus korrigieren, falls er noch
  `implementation_complete_before_final_green` oder veraltete offene Punkte
  nennt.
- Process-State auf `package_done:AI-SRCOPT-0` setzen.

Checks:

- `pnpm --filter @netgrid/ai test -- --run src/decision/module-boundaries.test.ts`
- `git diff --check`

Done-Gate:

- Messung ist dokumentiert.
- Stale Abschlussstatus ist korrigiert oder als bewusst verbleibender Follow-up
  begründet.
- Commit: `docs(ai): prepare source structure optimization loop`

### AI-SRCOPT-1 Access Outcome Memory Legacy-Adapter bereinigen

Ziel: Der alte `memory/remote-access-outcome`-Pfad darf keine konkurrierende
Access-Outcome-Quelle mehr darstellen.

Arbeit:

- Prüfen, ob `packages/ai/src/memory/remote-access-outcome.ts` produktiv genutzt
  wird oder nur noch Legacy-Testfläche ist.
- Den Legacy-Pfad, falls möglich, auf die neue strukturierte
  `access/access-outcome-memory`-Semantik ausrichten oder als expliziten
  Kompatibilitätsadapter markieren.
- Evidence-String-basierte Bonusunterdrückung in einen strukturierten
  Statushelfer überführen, sofern der öffentliche Vertrag das erlaubt.
- Tests anpassen oder ergänzen.

Checks:

- `pnpm --filter @netgrid/ai test -- --run src/access/access-outcome-memory.test.ts src/memory/remote-access-outcome.test.ts`
- `git diff --check`

Done-Gate:

- Kein neuer produktiver Import hängt am Legacy-Pfad.
- Tests belegen die Kompatibilität.
- Commit: `refactor(ai): align legacy remote access outcome memory`

### AI-SRCOPT-2 Access Decision Projection Boundary härten

Ziel: Access-nahe Module sollen Access-Projection-Verträge über eine access-nahe
Fassade statt über direkte `decision`-Imports konsumieren können.

Arbeit:

- Eine kleine access-seitige Projection-Fassade oder Re-Export-Struktur anlegen.
- Access-Module auf diese Fassade umstellen, wo die Projektion fachlich Teil der
  Access-Struktur ist.
- Boundary-Test ergänzen, der direkte `access -> decision/access-decision-projection`
  Kopplung verhindert, ohne legitime Decision-Tests zu blockieren.

Checks:

- `pnpm --filter @netgrid/ai test -- --run src/decision/access-decision-projection.test.ts src/decision/module-boundaries.test.ts`
- `git diff --check`

Done-Gate:

- Access-Module importieren Projection-Typen nicht mehr direkt aus dem
  Decision-Modul.
- Boundary-Test schützt die neue Grenze.
- Commit: `refactor(ai): add access projection boundary facade`

### AI-SRCOPT-3 RunTarget-Guidance-Hilfen aus Public Index/Tactical Duplication lösen

Ziel: Die Recommendation-zu-Priorität/Gewichtung-Logik soll an einer kleinen
gemeinsamen Stelle liegen und nicht in Public Index und Tactical-Plans driften.

Arbeit:

- Duplizierte RunTarget-Guidance- oder Delta-Switches identifizieren.
- Einen kleinen fachnahen Helper extrahieren, bevorzugt ohne neue
  Runtime-Abhängigkeiten.
- `index.ts` und `tactical-plans.ts` auf den Helper umstellen.
- Tests ergänzen, die neue Recommendation-Werte gegen Drift absichern.

Checks:

- `pnpm --filter @netgrid/ai test -- --run src/tactical-plans.test.ts src/index.test.ts`
- `git diff --check`

Done-Gate:

- Eine gemeinsame Quelle deckt RunTarget-Recommendation-Gewichtung ab.
- Bestehende AI-Tests bleiben grün.
- Commit: `refactor(ai): share run target guidance scoring`

### AI-SRCOPT-4 Struktur-Gates und Abschlussdokumentation aktualisieren

Ziel: Die neue Strukturgrenze ist dokumentiert und gegen Regression geschützt.

Arbeit:

- Placement Guide oder Abschlussreport um die neue Grenze und den neuen
  Adapterstatus ergänzen.
- Process-State auf `final_green_ready` setzen.
- Restpotential für die nächste Schleife knapp bewerten.

Checks:

- `pnpm --filter @netgrid/ai test -- --run src/decision/module-boundaries.test.ts src/public-export-contract.test.ts`
- `git diff --check`

Done-Gate:

- Dokumentation nennt den neuen Stand konkret.
- Keine neuen offenen FINAL-GREEN-Punkte ohne Blockerklassifikation.
- Commit: `docs(ai): record source structure optimization loop`

### FINAL-GREEN

Ziel: Der Arbeitsbranch ist vollständig verifiziert, lokal nach `main` gemerged
und der Worktree ist entfernt.

Checks:

- `pnpm --filter @netgrid/ai test`
- `pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
- `git status --short`

Done-Gate:

- Arbeitsbranch ist sauber.
- Branch ist lokal nach `main` integriert.
- Hauptworkspace ist sauber.
- Worktree ist entfernt.
- Goal wird erst danach als complete markiert.

## Verifikationsregeln

- Paketchecks dürfen enger sein als FINAL-GREEN, müssen aber den berührten Code
  direkt abdecken.
- `git diff --check` läuft vor jedem Paketcommit.
- Typcheck und vollständiger AI-Testlauf laufen im FINAL-GREEN.
- Nicht ausgeführte Checks werden mit Grund dokumentiert.

## Worktree-, Git- und Integrationsregeln

- Branch: `codex/ai-source-structure-optimization-loop-1`
- Worktree: `C:\Projekte\NETGRID_AI_SOURCE_STRUCTURE_OPT_LOOP_1`
- Umsetzung läuft ausschließlich im Worktree.
- Hauptworkspace wird nur für Prozessartefakt, Worktree-Setup und finalen Merge
  nach `main` genutzt.
- Jeder Paketabschluss erhält einen Commit.
- Kein Push ohne separaten Nutzerauftrag.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI Source Structure Optimization Loop 1 vollständig und
sequenziell von AI-SRCOPT-0 bis AI-SRCOPT-4 plus FINAL-GREEN ab und merge den
abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, agents/release-implementation-agent.md
und docs/architecture/ai/ai-source-structure-optimization-loop-2026-06-22.md.
Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_SOURCE_STRUCTURE_OPT_LOOP_1 auf Branch
codex/ai-source-structure-optimization-loop-1.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische
Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe oder aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit
Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen,
Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Alle Pakete sind in Reihenfolge umgesetzt oder mit Blocker dokumentiert.
- AI-Strukturgrenzen sind mindestens für Access-Outcome-Memory,
  Access-Projection und RunTarget-Guidance verbessert.
- FINAL-GREEN besteht oder ein klarer Blocker verhindert den Merge.
- Nach erfolgreichem Merge ist das verbleibende Strukturpotential neu bewertet.
