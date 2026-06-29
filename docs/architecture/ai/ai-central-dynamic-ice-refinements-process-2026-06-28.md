# AI Central Dynamic ICE Refinements Process, 2026-06-28

## Status

- Branch: `codex/ai-central-dynamic-ice`
- Worktree: `C:\Projekte\NETGRID_AI_CENTRAL_DYNAMIC_ICE`
- Integrationsziel: lokaler `main`
- Umsetzung: freigegeben, sequenziell, ohne Push/PR

## Anlass

Die letzte aktive Replay-Analyse zeigte, dass die Corp nach den Remote-Scoring-Korrekturen weiterhin zentrale Druckfenster falsch gewichtet:

- R&D wurde trotz installiertem `R&D Interface`, wiederholten R&D-Runs und Agenda-Diebstählen nicht als akut genug behandelt.
- ICE wurde auf R&D/HQ/Archives installiert, obwohl die Corp es nicht oder nur in wirkungsarmer Form rezzed bekam.
- Dynamische und positionsabhängige ICE wie `Dog Pile`, `Bug Zapper`, `Hunting Pack`, `Mobile Barricade` und variable Rez-/Modus-ICE wie `Credit Blocks` wurden zu grob als Schutz bewertet.
- Passive Tagged-Payoff-Strafen griffen auch, wenn kein konkreter LegalAction-Payoff im aktuellen Aktionsset sichtbar war.

## Leitplanken

- Kein Parallel-Planner: Der neue Code erweitert vorhandene Runtime-Assessments und Score-Komponenten.
- Nur side-safe Inputs: Corp-Entscheidungen dürfen eigene verdeckte Corp-ICE-Daten nutzen, aber keine verdeckten Runner-Hand-/Stack-Annahmen.
- Keine Engine-Regeländerung, solange LegalActions korrekt sind.
- Bestehende Remote-Scoring-Window-Logik bleibt die zentrale Quelle für Remote-Agenda-Entscheidungen.
- Central-Schutz entsteht nicht aus bloßer ICE-Anzahl, sondern aus bezahlbarer, relevanter Wirkung gegen sichtbare Runner-Coverage und aktuelle Drucklage.

## Paketfolge

1. Evidence und Prozessartefakte anlegen.
2. Central-Druck normalisieren: serverId, serverLabel und bekannte R&D/HQ-Multiaccess-Signale zusammenführen.
3. Central-ICE-Installation bewerten: akuten HQ/R&D-Druck, Agenda-/Access-Risiko und ausreichenden Schutz gegeneinander abwägen.
4. Dynamische ICE-Effektivität verschärfen: unrezzable, X=0, positionsabhängig schwach, sichtbare triviale Coverage und variable Rez-Modi getrennt bewerten.
5. Tagged-Payoff-Passivstrafen auf konkrete LegalActions begrenzen.
6. Proteus-Hints und generierte AI-Hint-Artefakte aktualisieren.
7. Fokussierte Regressionen, Typecheck und AI-Checks ausführen.
8. Sauber committen und lokal nach `main` mergen.

## Akzeptanzkriterien

- Label-only R&D/HQ-Events zählen in side-safe Central-Druck.
- Sichtbares `R&D Interface` oder HQ-Multiaccess erhöht servergenau die Central-Dringlichkeit.
- Eine nicht bezahlbare ICE-Installation auf akut bedrohtem Central-Server erzeugt keinen Scheinschutz und Economy kann gewinnen.
- Solo- oder positionsabhängig schwache ICE erzeugen keine Durable-Wertung, wenn sichtbare Runner-Coverage sie trivial macht.
- Variable Rez-/Modus-ICE wird nur dann positiv bewertet, wenn der gewählte oder finanzierbare Modus relevante sichtbare Coverage wirklich adressiert.
- Passive Tagged-Payoff-Strafe greift nicht ohne konkrete Payoff-LegalAction im aktuellen LegalAction-Set.
- Remote-Scoring-Window-Regressionen bleiben grün.

