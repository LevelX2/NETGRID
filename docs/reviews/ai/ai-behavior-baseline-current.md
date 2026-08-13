# AI Behavior Baseline v1 – aktueller Arbeitsbaumstand

Stand: 2026-08-13  
Status: Hard Gates grün; Referenz wegen uncommittetem Arbeitsbaum vorläufig

## Prüfvertrag

- sechs feste Deck-Slots;
- zehn feste Seeds je Slot;
- höchstens 480 Aktionen je Partie;
- Runner und Corp jeweils `current_candidate`;
- 60 Partien mit 14.034 Entscheidungen;
- lokaler Arbeitsbaum auf Basis von Git-Head `180335e5b`.

Der Lauf liegt lokal unter
`data/local/ai-behavior-baseline-v1-current-180335e5b-2026-08-13.*`.
Die Dateien werden nicht versioniert. Da der Runner nur `gitHead` und keinen
Arbeitsbaum-Fingerprint speichert, wird dieser Stand erst nach Commit und
erneutem identischem Lauf zur reproduzierbaren Commit-Referenz.

## Ergebnis

Alle technischen Hard Gates sind grün:

- 0 Illegal Actions;
- 0 Replayfehler;
- 0 Action-Limit-Partien;
- 0 Fallbacks und 0 Timeouts;
- 0 Runtimefehler;
- 0 klassifizierte oder unklassifizierte Runtime-Abbrüche;
- 0 Hidden-Info-Findings und 0 `no_legal_action_failure`;
- Redaction-Safe: ja.

Die rote Ausgangsbeobachtung `b6a8e4114` enthielt 28 klassifizierte
Runtimefehler: 14 fehlende oder konkurrierende Planowner, 11 vorzeitige
EndTurn-Routen, zwei ungültige Search-Support-Graphen und ein Choice-Fenster
ohne zulässigen Owner. Nach Beseitigung dieser frühen Abbrüche wurden mehrere
tiefer liegende Ownership-Konflikte sichtbar und ebenfalls geschlossen.

Die Korrekturen folgen dem Plan-first-Vertrag:

- irreversible Kredit-/Schuldenaktionen gehören ausschließlich zum exakt
  gebundenen Elternplan und nicht zu generischer Liquidität oder Development;
- ein Recurring-Economy-Hold besitzt nur konkrete produktive Halteschritte,
  niemals EndTurn bei verbleibender nutzbarer Kapazität;
- Search-Choices erhalten strukturierte Source-Bindungen und vervollständigen
  nur die Payload der bereits gewählten LegalAction;
- regelgenerierte Runner-Start-of-turn-Reihenfolgen werden in einem engen,
  deterministischen Window-Resolver aufgelöst;
- optionale Program-Trash-Installationen und Defense-Reaktionsreserven haben
  jeweils genau einen aktuell zuständigen Owner.

## Verhaltenswerte und Aussagegrenze

Der grüne Arbeitsbaumstand misst absolut:

- Missed Score Window Rate: 0,146 bei 103 Fenstern;
- Advanced Remote Contest Skip Rate: 0,831 bei 556 Gelegenheiten;
- Plan Conversion Rate innerhalb von drei Entscheidungen: 0,688 bei 3.694
  abgeschlossenen Planintents;
- Strategic No-Progress: 3,185 je 100 Entscheidungen;
- Clearly Dominated Plan Choices: 0;
- Trace Findings: 1,268 je 100 Entscheidungen;
- durchschnittlich 233,9 Aktionen und 32,817 Züge je Partie.

Die Deltas zur roten Ausgangsbeobachtung sind keine belastbare
Spielstärke-Aussage. Dort endeten viele Partien am ersten Runtimefehler und
lieferten nur 6.963 Entscheidungen beziehungsweise durchschnittlich 116,05
Aktionen. Der grüne Stand beobachtet damit ungefähr die doppelte Spieltiefe.
Höhere Missed-Score-, Contest-Skip-, No-Progress- und Finding-Raten können
daher aus neu erreichten späten Spielzuständen stammen. Künftige
Verhaltensvergleiche verwenden die nächste saubere, committete grüne Referenz.

Die auffälligsten aktuellen Beobachtungsfelder bleiben:

- `strategy_panel_net_damage_black_ice`: Missed Score 0,375 und Contest-Skip
  0,949;
- `strategy_panel_hybrid_score_punish_cheap_bag`: Plan Conversion 0,603,
  No-Progress 5,098/100 und Contest-Skip 0,878;
- alle Action-Capacity- und Persistent-Install-Raten sind `n/a`, weil das
  Standardpanel keine qualifizierenden Gelegenheiten erzeugte.

## Sinnvolle Messergänzungen

Priorität 1:

- `worktreeDirty` und ein Diff-Fingerprint im Benchmarkvertrag;
- Entscheidungstiefe bis zum ersten Hard Failure sowie vollständig erreichte
  Entscheidungen pro Slot und Seed;
- verhaltensmetrische Deltas nur auf gemeinsam erreichten Horizonten oder
  getrennt nach Early-, Mid- und Late-Game;
- Zähler für Owner-Integrität: doppelte Dispositionen, produktive Aktionen
  ohne Owner, Route/Disposition-Konflikte und unvollständige Choice-Origin-
  Bindungen.

Priorität 2:

- Contest-Skips nach `unreachable`, `unaffordable`, `known_no_payoff` und
  echter verpasster positiver Gelegenheit aufteilen;
- Plan Conversion nach Planmodul und Abbruchursache statt nur aggregiert;
- Search-Effektivität messen: Ziel nach Reveal verfügbar, gewählte Alternative
  und Schließen der Coverage-Lücke innerhalb von N Entscheidungen;
- Debt-Financing nur als gebundene Nutzung messen, einschließlich erhaltener
  Exit-/Liability-Reserve;
- Start-of-turn-Reihenfolgen mit unmittelbarem Wertunterschied protokollieren;
- gezielte Zusatzpanels für Action Capacity und Persistent Installs ergänzen,
  statt `n/a` als unauffälliges Ergebnis zu lesen.

## Verifikation und offene breite Gates

- Baseline-Regressions-, Runner-Core-Plan- und Search-Builder-Tests: 58 grün;
- `plan-first-live-runtime.test.ts`: 212 grün, ein Corp-Score-Funding-Test rot;
- Engine-Typecheck, Formatierung, Diff-Check, `check:ai` und
  `check:package-boundaries`: grün;
- AI-Typecheck: nur vier fehlende historische CardSpec-Migrationsreport-JSONs;
- vollständige AI-Shards: weiterhin rot, überwiegend durch die gleichzeitig
  integrierte Originalset-Card-Audit-Umstellung mit ungültig gewordenen
  Decision-Checkpoint-Hashes und Card-Hint-Goldens;
- `check:engine-source-structure` hat unabhängig vom Fix einen internen
  TypeScript-AST-Guard-Fehler im Prüfscript.

Diese breiten Restbefunde ändern den grünen Runtime-/Replay-/Redaction-Status
des Standardpanels nicht, müssen vor einem allgemeinen Release-Gate aber
separat bereinigt werden.
