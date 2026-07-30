# Match 5F7924: Agenda-, Defense- und Discard-Abschlussreview

Stand: 2026-07-30

Match: `match_5f7924e4893ba855`

Analyseumfang: 33 von 33 gespeicherten Corp-KI-Entscheidungen bis
StateVersion 65 wurden einzeln gegen LegalActions, Plan-first-Debug,
PlayerView und Folgeereignisse geprüft. Die fünf fixrelevanten oder
abgrenzenden Zustände sind als driftfreie Decision-Checkpoints versioniert.

## Urteil

Die drei reproduzierten Corp-KI-Fehler sind ursächlich behoben:

1. Agenda- und ICE-Plan sahen einander nicht als ausführbare gemeinsame
   Restzuglinie. Der Score-Parent kann jetzt einen exakt gebundenen
   Defense-Schritt auf einem neuen Remote beginnen; die folgende Neuplanung
   bindet die konkrete Agenda über Commitment und Execution Lease.
2. Der Cleanup-Score bewertete jede von drei Jack-Attack-Dubletten wie einen
   eigenständigen Tag-Enabler und unterschätzte Marked Accounts. Dubletten
   erhalten nun abnehmenden Wert, während aktive Action-, Function- und
   Tactic-Signale gemeinsam berücksichtigt werden.
3. Marked Accounts war im aktiven Hint fälschlich als
   `scored_activated` statt `on_access` beschrieben. Der aktive Hint und sein
   Runtime-Vertrag stimmen jetzt mit der Engine überein.

## Zug-9-Ergebnis

Die KI führt aus dem eingefrorenen State die folgende kohärente Linie aus:

1. geeignetes ICE als gebundene Schutzressource in `new_remote`;
2. exakt die Agenda des Root-Plans in den entstandenen Remote;
3. Jack Attack vor R&D als zusätzliche wiederkehrende
   Steuer-/Disruptionsschicht.

Der dritte Schritt wird durch `corp.defend_servers` ausgeführt und ist mit
`corp_scoreline_central_tax_allocation` in der privaten Buganzeige
nachvollziehbar. Ein zufälliger Draw oder ein vorzeitiges Advance verdrängt
diese letzte gebundene Defense-Aktion nicht.

## Begrenzung der qualitativen ICE-Bewertung

Die finale Regel ist absichtlich nicht apodiktisch:

- Unrezztes ICE kann gestufter Zukunftsschutz oder Bluff sein.
- Nicht-ETR-ICE wird nur mit sichtbarer Steuer-/Disruptionswirkung und
  begrenztem Rez-Funding-Gap zugelassen.
- Die zentrale Zusatzschicht verlangt eine Handdublette, einen sichtbaren
  Scoring-Remote, die letzte Corp-Aktion, exakte Zentralzuweisung, vollständige
  Engine-Quote und keine sichtbare passende Breaker-Antwort.
- Remote-Staging bleibt an einen exakten Score-Parent und ein unmittelbares
  Execution-Lease-Receipt gebunden.

Eine breitere Zwischenfassung wurde verworfen, nachdem sie 44 Regressionen in
17 AI-Testdateien erzeugte.

## Verifikation

- 73 Decision-Checkpoint-Dateien: 406/406 Tests grün.
- Vollständige `@netgrid/ai`-Suite: 533/533 Dateien und 4.348/4.348 Tests
  grün.
- `@netgrid/ai`-Typecheck: grün.
- `git diff --check`: grün.

## Bewusst offene, nicht ursächliche Punkte

- Der Deck-Audit-Hinweis zu Corporate Coup und gehosteten Credits bleibt
  außerhalb dieses Pakets.
- Der Dr.-Dreff-Consumer-Vertrag bleibt außerhalb dieses Pakets.
- Die jetzige Entscheidung ist qualitativ korrekt und eng gegatet; weitere
  Playtests müssen zeigen, ob die Gewichte zwischen zentraler Steuer-ICE-
  Schicht, Agenda-Advance und späterem Remote-Ausbau feinjustiert werden
  sollen.
