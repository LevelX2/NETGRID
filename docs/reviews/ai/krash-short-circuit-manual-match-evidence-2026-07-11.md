# Krash-/Short-Circuit-Match-Evidence

Status: freigegebene Umsetzungsgrundlage

## Match

- Match-ID: `match_ce2b72a6bf4d4e80`
- Modus: `human_corp_vs_runner_ai`
- Runner-KI: `hard`
- Seed: `match-mrfajodd-12iur8k`
- Ergebnis: Corp gewinnt durch Agenda-Punkte.
- End-StateVersion: 294
- End-StateHash: `fnv1a:8b91c378`
- Evidence: 295 Events, 295 Snapshots, 178 Detailed-AI-Traces.
- Alle Debug-Selektionen entsprechen der angewandten Aktion; 0 Fallbacks und
  0 Timeouts.

## Side-safe Kernevidence

- 84 Runner-Hauptaktionen: 39 Basic Credits, 15 Runs, 10 Events, 9
  Short-Circuit-Aktivierungen, 7 Draws und 4 Installationen.
- Krash und Cloak waren vor der Short-Circuit-Schleife installiert; MU war 2/4.
- Die neun Short-Circuit-Ergebnisse waren Krash, Lockjaw, Lockjaw, Pattel's
  Virus, Clown, Clown, Vewy Vewy Quiet, Vewy Vewy Quiet und Cloak.
- Nur der letzte Cloak wurde später installiert. Beide Lockjaws, zwei gesuchte
  Clowns und beide Vewys wurden nach der Suche abgeworfen.
- Zwei zusätzliche Krash blieben bis Spielende in Grip.
- End-Rig: Krash, zwei Cloaks und Short Circuit; keine namensgebende
  Clown-/Lockjaw-/Vewy-Unterstützung.
- 29 von 39 Basic-Credit-Entscheidungen verdrängten einen roh höher bewerteten
  Draw; während der Kreditentscheidungen lag keine legale Burst-Economy in Grip.
- Cortical Cybermodem wurde bei 1 Credit gezogen. Zehn Basic-Credit-Klicks
  brachten den Runner auf 11 Credits, aber ein eingeschobener R&D-Run einen
  Credit vor dem Ziel ließ keinen Installationsklick mehr übrig.

## Freigegebene Fehlergruppen

1. Coverage-Suche wird ohne offenen Coverage-Bedarf pauschal belohnt.
2. Suchzielwahl ignoriert Grip-Duplikate und Installationskonversion.
3. Lockjaw, Clown, Vewy und Krash besitzen falsche oder unvollständige
   funktionale KI-Semantik.
4. Discard schützt redundante Krash-Kopien und opfert die Engine.
5. Basic-Credit-Fallback besitzt keinen realistischen Draw-/Payoff-Horizont.
6. Plan-Mapping erzwingt deutlich schlechtere Runs und unterbricht Funding.
7. Eine integrierte Search-Choice-Install-Discard-/Economy-Regression fehlt.

## Nicht als Fehler umgesetzt

- Der erste Remote-Probe-Run gegen zuvor unbekanntes Cortical Scrub.
- Encounter-Fortsetzungen, bei denen kein bezahlbarer Access mehr möglich war.
- Regel- oder LegalAction-Änderungen an Short Circuit und Krash.

## Geplante Regressionen

- Installierter universeller Breaker unterdrückt Search ohne sichtbaren Bedarf.
- Suchzielwahl bevorzugt ein installierbares neues Supportprogramm vor drittem
  Krash und vor bereits gehaltener identischer Supportkarte.
- Der erste Lockjaw/Clown/Vewy erhält positiven Install-Grenznutzen mit Krash.
- Discard wirft überzählige Krash-Kopien vor einzigartigen Synergiekomponenten.
- Langer Basic-Credit-Pfad weicht Draw/Economy aus; kurzer konkreter Fundingpfad
  bleibt erlaubt.
- Stark negative opportunistische Runs unterbrechen ein fast fertiges Fundingziel
  nicht ohne belastbaren sichtbaren Payoff.
