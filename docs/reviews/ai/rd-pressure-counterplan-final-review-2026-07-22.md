# R&D-Druck-Gegenplan und wirkungsbasierter Purge – Final Review

## Ergebnis

Die erneute Analyse des menschlichen Spiels `match_5caedbfa15e0ba79` hat drei
zusammenhängende Corp-KI-Lücken geschlossen.

1. Purges werden jetzt nach aktiver Wirkung statt nach der bloßen Summe
   sichtbarer Counter bewertet. Ein einzelner Highlighter-Counter erzeugt
   noch keinen zusätzlichen Zugriff; ein einzelner Garbage-Counter noch
   keinen Gratis-Trash. Zwei Highlighter-Counter bleiben dagegen eine akute
   R&D-Multiaccess-Gefahr.
2. Wiederholte erfolgreiche R&D-Zugriffe erzeugen einen persistenten
   `protect_rd`-Gegenplan. Installierbares wirksames ICE ist die direkte
   Antwort. Fehlt es, wird nach Verteidigung gezogen. Liegt bereits
   brauchbares unrezztes ICE, bleibt dessen Credit-Finanzierung vorrangig.
3. `Overtime Incentives.actionCapacityProfiles` besitzt nun einen echten
   Runtime-Consumer. Der Hint-Vertrag wird gegen Empfänger, Timing,
   Einschränkung, Zuverlässigkeit und Betrag der LegalAction geprüft. Nur bei
   Übereinstimmung werden `bankable` und `repeatable` übernommen; bei einem
   Mismatch bleiben die Engine-Fakten maßgeblich und die Abweichung sichtbar.

## Spielgleiche Evidence

- `corp-ineffective-virus-purge-d88`: `Day Shift` statt Purge bei
  `Highlighter 1 + Garbage 1`.
- `corp-ineffective-virus-purge-loop-d123`: auch spät in der wiederholten
  Schleife `Day Shift` statt erneut drei Folgeaktionen aufzugeben.
- `corp-highlighter-purge-pressure`: zwei aktive Highlighter-Counter bei
  offenem, gedrücktem R&D lösen weiterhin den erwarteten Purge aus.
- `corp-highlighter-rd-defense`: vorhandenes Data Wall wird weiterhin vor R&D
  installiert.

## Zusätzliche Gate-Funde

Der Paketprozess deckte zwei unabhängige bestehende Fehler auf und behob sie
separat:

- Der Armageddon-Zugriffsersatz griff ohne Existenzprüfung auf ein optionales
  LegalAction-Payload zu. Der Typecheck ist wieder vollständig grün.
- Eine sichere sofortige `Project Consultants`-Agenda-Konversion wurde zwar
  als `score_now` erkannt, aber nicht als passende Install-Aktion aligned.
  Die Triage bindet nun die konkret ausgewählte Action-ID und bevorzugt bei
  mehreren sicheren Sofortkonversionen die höherwertige Agenda, hier
  `Tycho Extension`. Unsichere Tycho-Fälle bleiben geschützt.

## Sicherheits- und Architekturgrenzen

- Ausschließlich `PlayerView`, sichtbare PublicEvents und LegalActions werden
  ausgewertet; es gibt keine Decklisten- oder Hidden-Info-Nutzung.
- Hint-Daten ersetzen keine Engine-Fakten und LegalActions bleiben die
  einzige Entscheidungs- und Legalitätsgrundlage.
- Es wurde kein Fallback, keine kartennamenspezifische Entscheidungsabkürzung
  und keine Audit-Ausnahme eingeführt.

## Verifikation

- Drei AI-Testshards: 442 Testdateien, 3.091 Tests, vollständig grün.
- Fokussierte Purge-, Central-Triage-, Scoreline-, Tycho-, Overtime- und
  Decision-Checkpoint-Tests: grün.
- `@netgrid/ai`-Typecheck: grün.
- `check:ai`: grün, keine Runtime- oder Type-Cycles.
- `check:ai-action-capacity`: grün, 46 profilierte Karten und null
  Contractverletzungen.
- `check:ai-deck-doctrine-strategy`: grün.
- Corp-Deck-Hint-Consumer-Audit: 16 eindeutige Karten, 45 Karten insgesamt,
  null blockierende Funde und null Warnungen.
- `git diff --check`: grün.
