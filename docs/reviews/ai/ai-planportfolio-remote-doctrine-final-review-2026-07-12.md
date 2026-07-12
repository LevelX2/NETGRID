# AI-Planportfolio und Remote-Doktrin – Final Review 2026-07-12

Status: umgesetzt; Safety-Verträge grün, bestehendes Hybrid-Aktionslimit-Gate
bleibt `attention_required`

## Ergebnis

Die bisherige einzelne TacticalPlan-Spur ist um ein begrenztes Planportfolio
ergänzt. Akute Interrupts und kurze Score-Konversionen bleiben unmittelbare
TacticalPlans. Wiederkehrende Economy-Zyklen und langfristige Entwicklung
können parallel als höchstens zwei Hintergrundprojekte fortgeschrieben werden.

Der erste produktive Entwicklungstyp ist
`corp.establish_scoring_remote`. Er entsteht nur, wenn das side-sicher aus dem
eigenen Deck abgeleitete `RemoteDoctrineProfile` einen Scoreline-Remote als
`supporting` oder `primary` verlangt. Fast Advance mit opportunistischem oder
keinem Remote-Bedarf und reine Asset-/Ambush-Remotes erzeugen dieses Projekt
nicht.

## Umgesetzter Vertrag

- Alle 19 TacticalPlan-Typen sind einer Ausführungsklasse zugeordnet:
  `reactive_interrupt`, `bounded_sequence`, `recurring_cycle` oder
  `development_project`.
- Das Portfolio hält höchstens einen Interrupt, einen Vordergrundplan und zwei
  Hintergrundprojekte. Hintergrundarbeit besitzt eine Zugkadenz und kann nach
  kurzfristiger Unterbrechung fortgesetzt werden.
- Broker-/Bank-Aufbau bleibt über eingeschobene Runs hinweg als
  Hintergrundzyklus erhalten, darf aber höchstens eine Portfolioaktion pro Zug
  verbrauchen.
- Corp-Remote-Projekte binden ein Zielremote über Züge hinweg. Schutzbänder
  berücksichtigen bekannte Pfaderreichbarkeit, sichtbare Breakkosten und die
  geschätzten Erholungszüge des Runners statt nur die ICE-Anzahl.
- HQ und R&D besitzen für den Remote-Ausbau eine Mindestabdeckung von je einem
  ICE. Diese Grenze ist ein Boden, kein weiteres zentrales Ausbauziel.
- Legales sofortiges Scoring bleibt Vordergrund. Eine Action kann zugleich als
  Beitrag zu Vordergrund und Hintergrund erscheinen; das erzeugt redigierte
  Mehrplan-Evidence, aber keine neue LegalAction und keinen globalen
  Ranking-Override.

## Regression aus dem ersten Kandidatenlauf

Der erste vollständige Kandidatenlauf machte eine zu breite globale
Portfolio-Sortierung sichtbar. Sie hob insbesondere
`runner.survival_defense` unabhängig von der bewährten TacticalPlan-Rangfolge
als Interrupt an und begünstigte lange Credit-Schleifen. Die Sortierung wurde
mit `ac5b348a6` entfernt. Das Portfolio greift produktiv nur noch über
Hintergrund-Kadenz, Continuity und Evidence ein; die vorhandene taktische
Rangfolge bleibt Auswahlautorität.

## AI Behavior Baseline

### Vollständiger Standardlauf

Der Standardlauf verwendete sechs Slots, zehn Seeds, 480 Aktionen und
`current_candidate` auf beiden Seiten. Der generierte Bericht liegt unter
`docs/reviews/ai/ai-behavior-baseline-v1-planportfolio-remote-doctrine-2026-07-12.md`;
kompakte JSON- und redigierte Rohtraces bleiben lokal unter `data/local/`.

Gegen die ältere Referenz `4a9e347f4` blieben alle Safety-Gates außer den
Aktionslimits grün: 0 illegale Aktionen, Replayfehler, Fallbacks, Timeouts,
Runtimefehler, Hidden-Info-Funde und `no_legal_action_failure`; Redaction war
sicher. Der Lauf hatte vier Aktionslimits gegenüber zwei in der älteren
Referenz. Da der Arbeitszweig erst auf dem späteren Stand `f3f71ceca` begann,
ist dieser Vergleich allein nicht zur Ursachenzuordnung geeignet.

### Isolierter Hybrid-Control-/Candidate-Vergleich

Für den einzigen betroffenen Slot
`strategy_panel_hybrid_score_punish_cheap_bag` wurden deshalb am exakten
Ausgangs-Commit und am finalen Kandidaten dieselben zehn Seeds mit 480 Aktionen
ausgeführt.

| Kennzahl                         | Control `f3f71ceca` | Kandidat `ac5b348a6` |  Delta |
| -------------------------------- | ------------------: | -------------------: | -----: |
| Spiele                           |                  10 |                   10 |      0 |
| Entscheidungen                   |               3.057 |                2.798 |   -259 |
| Aktionslimit-Partien             |                   4 |                    4 |      0 |
| Verpasste Scorefenster           |                   0 |                    0 |      0 |
| Remote-Contest-Skip-Rate         |               0,928 |                0,871 | -0,057 |
| Plan-Konversionsrate             |               0,733 |                0,742 | +0,009 |
| No-Progress / 100 Entscheidungen |               3,337 |                3,217 | -0,120 |
| Durchschnittliche Aktionen       |               305,7 |                279,8 |  -25,9 |
| Findings / 100 Entscheidungen    |               3,925 |                5,397 | +1,472 |

In beiden Läufen waren illegale Aktionen, Replayfehler, Fallbacks, Timeouts,
Runtimefehler, Hidden-Info-Funde und `no_legal_action_failure` null; beide
Tracebestände waren redaction-safe. Die Hard-Gate-Anzahl wurde durch die
Änderung nicht erhöht. Die vier Control-Limits lagen in Seeds 01, 02, 03 und
05; beim Kandidaten lagen sie in 02, 03, 05 und 07. Die Seed-Verschiebung und
die gestiegenen Diagnose-Findings – vor allem
`bank_over_target_without_funding_need` und `plan_step_action_mismatch` –
bleiben konkrete Folgeanalyse, nicht verdeckte Freigabe.

## Verifikation

- Paketnahe Remote-Doktrin-, Portfolio-, Broker-, Corp-Score-, Debug- und
  Semantic-Runtime-Tests sind grün.
- Der breite fokussierte Lauf umfasste zuletzt 171 Tests; nach der
  Auswahlgrenzen-Korrektur waren weitere 158 Tests grün.
- Alle drei AI-Shards waren mit 301 Testdateien und 1.982 Tests grün.
- `@netgrid/ai`-Typecheck, `check:ai` und `git diff --check` waren grün. Die
  bestehenden Derived-Facts-/Hint-Warnungen blieben nichtblockierende
  Qualitätsschuld; alle Checks meldeten null Fehler.
- Die Main-Integration und der Worktree-Cleanup werden im Prozessabschluss
  protokolliert.

## Restrisiko

Das bestehende Hybrid-Aktionslimit-Gate bleibt rot und muss als eigener
Trace-Analyseprozess geschlossen werden. Der vorliegende Rollout darf nicht als
Beleg gelten, dass die Hybrid-Endspiele oder Broker-Zielwerte bereits optimal
sind. Er liefert dafür erstmals Portfolio-, Kadenz- und Remote-Doktrin-Evidence,
ohne Engine-, LegalAction-, Replay-, StateHash- oder Hidden-Info-Verträge zu
ändern.
