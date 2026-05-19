---
activityId: act-2026-05-19-corp-ai-unprotected-advanced-agenda-repeat
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget: Corp AI scoring remote strategy
blockedBy: []
resultArtifacts:
  - packages/ai/src/corp-plans.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai test -- -t "remote agenda|advanced remote|rez reserve|recent remote agenda|rezzes affordable"
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai test
  - git diff --check
---

# Korp-KI: Advanced Agenda nicht wiederholt ungeschützt anbieten

## Ziel

Die Korp-KI soll Scoring-Remote-Pläne besser gewichten: Eine Agenda im Fort installieren und ausbauen ist nur dann eine gute Strategie, wenn die Korp das Fort realistisch schützen kann oder bewusst als begrenzten Bluff spielt. Insbesondere soll die KI nicht mehrfach hintereinander eine advanced Agenda in ein Fort legen, das sie beim Run nicht schützt, obwohl der Runner dadurch direkt zugreifen kann.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-19: Die KI legte früh ein ICE in ein neues Fort, installierte zusätzlich eine Karte im Fort und baute sie einmal aus. Es war eine Agenda. Die Korp hatte 4 Credits. Beim Run wurde das ICE nicht gerezzt; der Runner konnte auf die Agenda zugreifen. Im nächsten Zug wiederholte die KI einen sehr ähnlichen Ablauf: erneut Karte ins Fort, einmal ausgebaut, Zugriff durch den Runner, wieder Agenda.
- Der Nutzer nennt es "Runner", der beschriebene Ablauf betrifft nach Spielrollen aber die Korp-KI: ICE installieren, Karte im Remote/Fort installieren, Agenda ausbauen und ICE rezzen sind Korp-Entscheidungen.
- Gewünschte Einordnung: Bluffing soll weiterhin möglich sein, aber die Grundgewichtung ist zu optimistisch, wenn die Korp eine advanced Agenda ohne tatsächliche Rez-/Schutzbereitschaft anbietet.
- Relevante Codefamilien laut Suchlauf:
  - `packages/ai/src/corp-plans.ts`: Planarten wie `build_scoring_remote`, `score_next_turn`, `recover_economy`, Schutz-/Reservebewertung.
  - `packages/ai/src/index.ts`: konkrete Korp-Aktionsauswahl, Rez-/Decline-Rez-Entscheidungen.
  - `packages/ai/src/deck-doctrine.ts`: Doctrines für Korp-Pläne.
  - Server-/Engine-Zustand liefert LegalActions; die KI darf weiter nur LegalActions wählen.

## Scope

- Ein fokussiertes AI-Fixture bauen oder reproduzieren:
  - frühe Korp-Runde,
  - Korp hat etwa 4 Credits,
  - ein neues Fort mit unrezzed ICE und einer installierten/advanced Root-Karte,
  - Root-Karte ist in Wahrheit Agenda,
  - Runner greift das Fort an,
  - Korp entscheidet trotz verfügbarer/denkbarer Schutzlage `decline_rez` oder kann das ICE wegen Kosten nicht bezahlen,
  - ähnlicher Plan wird im nächsten Korp-Zug wiederholt.
- Prüfen, ob der Fehler aus der Planung oder aus dem Rez-Entscheider kommt:
  - Scoring-Plan unterschätzt Runner-Zugriff und Rez-Kosten.
  - Rez-Entscheider spart Credits zu stark und schützt die Agenda nicht.
  - Korp installiert/advanced Agenda ohne genügende Credit-Reserve.
  - Wiederholungs-/Lernsignal fehlt nach gerade verlorener advanced Remote-Agenda.
- Bewertung für `build_scoring_remote` / `score_next_turn` so anpassen, dass advanced Agenda-Pläne sichtbare Schutzqualität, Rez-Reserve und Runner-Zugriffsdruck berücksichtigen.
- Rez-Entscheidung im Run prüfen: Wenn ein Remote eine advanced Root-Karte enthält und der Runner sonst zugreifen kann, soll die Korp ein bezahlbares, relevantes ICE eher rezzen.
- Wiederholungssperre oder Malus prüfen: Nach einem gerade gescheiterten advanced-Agenda-Remote darf die KI nicht sofort denselben riskanten Plan ohne bessere Schutzlage wiederholen.
- Debug-/Evidence-Felder ergänzen oder prüfen, z. B. `scoring_remote_protection`, `rez_reserve`, `advanced_root_risk`, `recent_remote_agenda_loss`, `remote_bluff_budget`.

## Nicht im Scope

- Kein Verbot von Bluffs. Eine verdeckte advanced Karte darf weiterhin manchmal ein Bluff sein.
- Keine Hidden-Info-Nutzung durch die Runner-KI oder Korp-KI außerhalb der eigenen legalen Informationen.
- Keine Änderung an Engine-Regeln, Agenda-Score-/Steal-Regeln, `applyAction`, Replay oder StateHash.
- Keine pauschale Regel, jedes ICE immer zu rezzen.
- Keine vollständige Korp-Strategie-Neuentwicklung; es geht um einen begrenzten Schutz-/Reserve-/Wiederholungs-Fix für advanced Remote-Agendas.
- Keine Änderung an Kartendaten oder Decklegalität.

## Akzeptanzkriterien

- [ ] Ein AI-Test reproduziert den beobachteten Fehlpfad oder modelliert ihn ausreichend eng: advanced Agenda im Remote, Runner greift an, Korp schützt nicht und/oder wiederholt den Plan.
- [ ] Korp-Scoring-Pläne berücksichtigen Rez-Kosten und Credit-Reserve für sichtbare/unrezzed ICE vor einem advanced Agenda-Remote.
- [ ] Bei bezahlbarem relevantem ICE vor einer advanced Root-Karte wird `rez_ice` im Run gegenüber `decline_rez` deutlich bevorzugt, sofern der Runner sonst Zugriff bekommt.
- [ ] Wenn das vorhandene ICE nicht bezahlbar oder strategisch nicht relevant ist, wird der vorherige Scoring-/Advance-Plan entsprechend schlechter bewertet.
- [ ] Nach einem gerade verlorenen/aufgedeckten advanced Agenda-Remote erhält eine unmittelbare Wiederholung ohne bessere Schutzlage einen klaren Malus.
- [ ] Bluffing bleibt möglich, aber begrenzt und nachvollziehbar über Evidence; es darf nicht mehrfach hintereinander als Standardlinie dominieren.
- [ ] Debug/Evidence erklärt side-sicher, warum die Korp scored, blufft, Economy nimmt, ICE rezzt oder nicht rezzt.
- [ ] Bestehende Korp-KI-Tests für Economy, Remote-Scoring, HQ/R&D-Schutz und Bait/Bluff bleiben grün.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`, weil es um KI-Gewichtung an der Grenze von Agenda-/Remote-/Rez-Entscheidung geht.
- Wahrscheinliche Startpunkte:
  - `packages/ai/src/corp-plans.ts`
  - `packages/ai/src/index.ts`
  - `packages/ai/src/index.test.ts`
  - optional vorhandene AI-Fixture-/Input-Helfer für Korp-Remote-Scoring.
- Wichtig ist die Trennung zwischen eigener Hidden-Info der Korp und öffentlicher Boardlage: Die Korp darf wissen, dass ihre installierte Root-Karte eine Agenda ist; Runner-Inputs dürfen daraus nichts lernen, bevor die Karte legal aufgedeckt wird.
- Falls sich herausstellt, dass das ICE wegen Kosten tatsächlich nicht rezbar war, soll der Hauptfix in der Planphase liegen: Die Korp darf dann nicht mit zu knapper Reserve eine echte Agenda in ein kaum geschütztes Fort legen und ausbauen.

## Ergebnisnotiz

Umgesetzt. Die Korp-Planbewertung behandelt Agenda-Installationen hinter unrezzed ICE nur noch als sichere Score-Line, wenn nach der Aktion genug Credit-Reserve für ein relevantes Rez bleibt. Economy-Aktionen können diese Reserve realistisch schließen, inklusive installierter Credit-Payouts. Advanced-Remote-Wiederholungen nach einem frischen Remote-Agenda-Diebstahl erhalten einen klaren side-sicheren Malus mit Evidence `recent_remote_agenda_loss`, `recent_remote_agenda_repeat` und `remote_bluff_budget`; bounded Bluffing bleibt möglich, riskante Wiederholung wird blockiert. Regressionstests decken fehlende Rez-Reserve, Wiederholungs-Malus und bevorzugtes `rez_ice` gegen `decline_rez` vor advanced Root-Agenda ab.
