---
activityId: act-2026-05-23-synchronized-attack-hq-chronicle-summary
status: done
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-23
startedAt: 2026-05-23
completedAt: 2026-05-23
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
checks:
  - corepack pnpm --filter @netgrid/web test -- chronicle.test.ts -t "Synchronized Attack"
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Synchronized Attack on HQ mit konkreter Chronik-Zusammenfassung

## Ziel

Das Chronik-Protokoll soll bei der Korp-Entscheidung von `Synchronized Attack on HQ` nicht nur allgemein melden, dass die Korp-KI eine Entscheidung beantwortet hat. Stattdessen soll es die öffentlich zulässige Auswirkung der Entscheidung kompakt zusammenfassen: wie viele HQ-Karten behalten wurden, wie viele verdeckt abgeworfen wurden und wie viele Credits die Korp dafür bezahlt hat.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-23: Nach `Synchronized Attack on HQ` zeigte das Protokoll sinngemäß nur `Die Korp-KI hat eine Entscheidung beantwortet.`
- Erwartete Aussage im beobachteten Fall: Die Korp-KI hat 2 HQ-Karten behalten, 3 HQ-Karten verdeckt abgeworfen und 4 Credits bezahlt.
- Führender Kartenkontext: `Synchronized Attack on HQ` (`onr_v1_113_synchronized-attack-on-hq`) ist ein Runner-Prep mit Play-Kosten 4. Nach erfolgreichem HQ-Run muss die Korp ihre HQ-Karten abwerfen, darf aber pro behaltene HQ-Karte 2 Credits bezahlen.
- Bestehende technische Spur: Die Engine- und Release-Dokumentation nennen bereits eine private Korp-HQ-Retain-Choice mit `retainedCount` und `discardedCount` in der PublicPayload. Der Befund wirkt daher primär wie eine fehlende oder zu generische Web-/Chronik-Formatierung.

## Scope

- Chronik-/Protokollformatierung für die `Synchronized Attack on HQ`-Choice ergänzen oder korrigieren.
- Die spezielle `resolve_choice`-Anzeige nur für diesen bekannten Choice-/Payload-Kontext überschreiben, nicht generisch alle Entscheidungen umformulieren.
- Für den Beispielsfall soll die Meldung sinngemäß lauten:
  - `Die Korp-KI behält mit Synchronized Attack on HQ 2 HQ-Karten, wirft 3 HQ-Karten verdeckt ab und bezahlt dafür 4 Credits.`
- Singular/Plural sauber behandeln:
  - `1 HQ-Karte` statt `1 HQ-Karten`
  - `1 Credit` statt `1 Credits`
- Falls der handelnde Spieler kein KI-Spieler ist, denselben fachlichen Inhalt mit passender Spielerbezeichnung ausgeben.

## Nicht im Scope

- Keine Änderung am Kartenresolver, an LegalActions, Choice-Revalidation, Kostenlogik, Replay oder StateHash.
- Keine Änderung daran, welche HQ-Karten behalten oder abgeworfen werden.
- Keine Offenlegung von Kartennamen, Karten-IDs oder Positionen verdeckter HQ-Karten.
- Kein allgemeines Redesign der Chronik, der Live-Cues oder des KI-Entscheidungslogs.
- Keine Regeländerung an `Synchronized Attack on HQ`.

## Akzeptanzkriterien

- [x] Bei einer aufgelösten `Synchronized Attack on HQ`-Korp-Choice zeigt die Chronik Counts und bezahlte Credits statt nur einer generischen Entscheidungsantwort.
- [x] Die Meldung nennt nur öffentlich zulässige Informationen: behaltene Anzahl, verdeckt abgeworfene Anzahl und Creditkosten; sie nennt keine verdeckten Kartendetails.
- [x] Der Beispielzustand mit 2 behaltenen, 3 abgeworfenen HQ-Karten ergibt 4 bezahlte Credits.
- [x] Singular/Plural für Karte/Karten und Credit/Credits ist abgedeckt.
- [x] Ein fokussierter Web-/Chronik-Test deckt die neue Formatierung ab.

## Umsetzungshinweise

- Startpunkte sind wahrscheinlich `apps/web/app/chronicle.ts`, `apps/web/app/action-payload.ts` und die zugehörigen Webtests.
- Die Engine scheint laut bestehenden Nachweisen bereits `retainedCount` und `discardedCount` öffentlich bereitzustellen; die Umsetzung sollte diese Felder nutzen, statt verdeckte Choice-Optionen auszuwerten.
- Die Creditkosten können aus `retainedCount * 2` abgeleitet werden, sofern kein stabileres PublicPayload-Feld für bezahlte Kosten existiert.
- Der Text sollte im Stil der bestehenden Chronik bleiben und Korp statt Corp verwenden.

## Ergebnisnotiz

Umgesetzt: Die Web-Chronik erkennt die `successful_hq_run_corp_pay_to_retain_hq`-Choice von `Synchronized Attack on HQ` und formuliert die öffentliche Zusammenfassung mit behaltenen HQ-Karten, verdeckt abgeworfenen HQ-Karten und aus `retainedCount * 2` abgeleiteten Creditkosten. Der Test deckt den beobachteten KI-Fall sowie Singular/Plural für den Human-Fall ab; verdeckte Kartendetails werden nicht ausgelesen oder angezeigt.

Checks grün:

- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts -t "Synchronized Attack"`
- `corepack pnpm --filter @netgrid/web typecheck`
- `git diff --check`
