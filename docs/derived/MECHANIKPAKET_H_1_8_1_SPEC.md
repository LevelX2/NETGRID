# Mechanikpaket H 1.8.1 Spezifikation

Stand: 2026-05-09  
Status: eingefroren

## Scope

V1.8.1 implementiert einen freigabefähigen 12-Karten-Kern mit vier Blöcken:

1. Virus-/Counter-Trigger und Purge-Erweiterung
2. Run-Flow-Folgeflags (Bypass, Encounter-Tax, Future-Strength, Next-Encounter-Penalties)
3. Servergebundene Installkosten-Taxpfade
4. Scored-Agenda-Counter mit Click-to-Credit-Aktionen

## Nicht-Scope

- Keine Würfel-/Random-Resolver aus V1.9.0 (`Cockroach`, `Incubator` bleiben deferred).
- Keine offene `Grubb`-Sondermechanik (remainder-of-run-Breaker-Lifecycle) im V1.8.1-Gate.
- Keine Ambush-/Rest-Sonderresolver-Breite aus V1.9.0.
- Keine implizite AI-Support-Erweiterung.

## Kartenvertrag V1.8.1

- `onr_v1_012_clown`
  - Runner Program.
  - Solange installiert: Encounterte ICE werden mit `-1` Stärke behandelt.
- `onr_v1_046_pattels-virus`
  - Runner Virus Program.
  - Nach erfolgreichem Run: deterministische Platzierung eines Virus-Counters auf einem im Run vollständig gebrochenen ICE.
  - Jeder solcher Counter reduziert die Stärke des betroffenen ICE um 1.
- `onr_v1_049_pox`
  - Runner Virus Program.
  - Nach erfolgreichem Run: +1 Virus-Counter auf dem angegriffenen Server.
  - Je 2 Counter auf diesem Server: +1 zusätzliche Credit-Kosten für Corp-ICE-Install in/auf diesem Server.
- `onr_v1_094_inside-job`
  - Runner Event.
  - Startet Run und bypassed das erste ICE dieses Runs deterministisch.
- `onr_v1_173_restrictive-net-zoning`
  - Runner Resource.
  - Bei Install wird genau ein Server gebunden.
  - Corp zahlt +1 zusätzliche Credit-Kosten für ICE-Install in/auf diesem Server.
- `onr_v1_193_corporate-coup`
  - Corp Agenda.
  - Beim Scoren: 5 Counter auf der Agenda.
  - Corp-Aktion: `A` -> entferne 1 Counter, erhalte 1 Credit.
- `onr_v1_209_political-coup`
  - Corp Agenda.
  - Beim Scoren: 6 Counter auf der Agenda.
  - Corp-Aktion: `A` -> entferne 1 Counter, erhalte 1 Credit.
- `onr_v1_222_ball-and-chain`
  - ICE-Subroutine setzt Run-Flag: zukünftige ICE-Encounters kosten +1 Credit zusätzlich, sonst endet der Run.
- `onr_v1_225_canis-major`
  - ICE-Subroutine setzt Run-Flag: zukünftige ICE im Run werden mit +2 Stärke encountered.
- `onr_v1_226_canis-minor`
  - ICE-Subroutine setzt Run-Flag: zukünftige ICE im Run werden mit +1 Stärke encountered.
- `onr_v1_242_fatal-attractor`
  - ICE-Subroutine setzt Next-Encounter-Flag: beim nächsten Encounter 3 Net Damage, falls nicht alle Subroutinen gebrochen wurden.
- `onr_v1_268_shock-r`
  - ICE-Subroutine setzt Next-Encounter-Flag: Runner darf beim nächsten Encounter keine Subroutinen brechen und nicht jacken bis nach diesem Encounter.

## Engine-Vertrag

- Run-State enthält dedizierte Folgeflags für:
  - first-ICE-bypass
  - future encounter taxes
  - future encounter strength bonus
  - next-encounter penalties (Fatal Attractor, Shock.r)
  - Jack-out-Lock bis Abschluss des nächsten Encounters
- ICE-Stärke-Berechnung kombiniert:
  - Basisstärke
  - bestehende Strength-Modifiers
  - bestehende globale/root/scored modifiers
  - `Clown`-Modifier
  - rungebundene future-encounter-strength-Modifier
  - serverbezogene `Pattel's Virus`-Counter
- Purge entfernt Virus-Counter aus:
  - Karteninstanzen (`counters.virus`)
  - servergebundener Pox-Taxstruktur
- Corp-Installkosten für ICE berücksichtigen zusätzliche Taxes aus:
  - `Restrictive Net Zoning`
  - `Pox`
- Scored-Agenda-Aktionen (`Corporate Coup`, `Political Coup`) sind LegalAction-only und werden in `applyAction` vollständig revalidiert.

## Visibility-/Replay-Vertrag

- Keine Hidden-Info-Leaks durch neue Run-Flags, Server-Taxzustände oder Counter-Operationen.
- Event-/Replay-Payloads enthalten nur notwendige öffentliche Kontextfelder.
- StateHash bleibt deterministisch für:
  - Counter-Inkremente/Verbrauch/Purge
  - rungebundene Folgeflags
  - servergebundene Installkosten-Taxzustände.

## Deferred-Hinweis

Der Planungskorb für V1.8.1 enthält 15 Karten. Der freigabefähige Kernrelease setzt 12 Karten um; 3 Karten bleiben deferred dokumentiert:

- `onr_v1_013_cockroach` -> Würfelabhängigkeit (`V1.9.0`)
- `onr_v1_034_incubator` -> Würfelabhängigkeit (`V1.9.0`)
- `onr_v1_030_grubb` -> offener Resolver-Hinweis, außerhalb V1.8.1-Kernscope