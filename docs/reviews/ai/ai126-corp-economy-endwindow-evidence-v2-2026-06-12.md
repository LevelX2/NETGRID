# AI126 Corp Economy Endwindow Evidence v2

Datum: 2026-06-12

Branch: `codex/ai123-ai130-x10-residual-action-limit-sweep`

## Ziel

AI126 prüft die Corp-Credit-Endfenster im A-D-x10-Korpus und trennt Reserve, No-Alternative und echte Tempo-Fehler. Es nimmt keine Runtime-Änderung vor.

## Quelle

- `docs/reviews/ai/ai120-residual-action-limit-a-d-10seed-2026-06-12.json`
- `docs/reviews/ai/ai123-x10-residual-cluster-inventory-2026-06-12.json`

Offizielle x10-Corp-Credit-Subcluster:

| Subcluster | Spiele |
| --- | ---: |
| `corp_late_gain_credit_real_rez_or_protection_reserve` | 3 |
| `corp_late_gain_credit_no_safe_alternative` | 2 |

## Falltabelle

| Pair | Seed | Offizielle Klasse | Punkte R/C | Credits-Fenster | sichtbare Progress-/Schutzaktionen | Ability-Klasse | Bewertung |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| B | `ai-v143-tuning-001` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 0/6 | viele Corp-Credits nach Scoreline-Fenstern | `advance_card`, `score_agenda` bei 112, spätere Install-Fenster | `scoreline_progress` | Reserve/Tempo gemischt, aber Scoreline wurde tatsächlich genutzt; kein sicherer Strafkandidat. |
| B | `ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 6/3 | Corp-Credits vor und zwischen Rez-/Install-Blöcken | `rez_ice`, Install-Fenster, mehrere `activated_card_ability` | `rez_or_ice_progress` plus `opaque_no_progress` | Rez-/Schutzreserve plausibel; Ability bleibt ohne Outcome nicht als sichere Alternative gewertet. |
| C | `ai-v143-tuning-004` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 2/3 | wiederholte Corp-Credits, aber Scoreline und Rez sichtbar | `advance_card`, `score_agenda` bei 105, `rez_ice` bei 140/159 | `scoreline_progress` und `rez_or_ice_progress` | Reserve plausibel; kein isolierter Economy-Fehler. |
| D | `ai-v143-tuning-006` | `corp_late_gain_credit_no_safe_alternative` | 0/0 | 13 Corp-Credits im Endfenster | nur Install bei 114 und Rez bei 131/135; keine Score-/Advance-Legal-Facts im Fenster | `rez_or_ice_progress` schwach | Echter No-Safe-Endwindow-Fall, aber ohne belegte bessere LegalAction-Alternative. |
| D | `ai-v143-tuning-010` | `corp_late_gain_credit_no_safe_alternative` | 6/1 | 8 Corp-Credits im Endfenster | Install bei 108/145, Rez bei 113; keine Scoreline-Legal-Facts im Fenster | `rez_or_ice_progress` schwach | No-Safe-Fall mit schwacher Schutz-/Rez-Spur; noch kein Runtime-Kandidat. |

## Ability-Klassifikation

| Klasse | Befund |
| --- | --- |
| `scoreline_progress` | B001, C004 haben echte Score-/Advance-Progression. |
| `remote_protection` | nicht sicher belegbar. |
| `central_protection` | nicht sicher belegbar. |
| `rez_or_ice_progress` | B003, C004, D006, D010 zeigen Rez-/Install-Spuren. |
| `economy_only` | mehrere reine `gain_credit`-Folgen, besonders D006/D010. |
| `opaque_no_progress` | B003 enthält mehrere `activated_card_ability`-Aktionen ohne belegten Fortschritts-Outcome. |
| `unknown` | LegalAction-Alternativen fehlen bis AI127. |

## Prüfpunkte

| Frage | Ergebnis |
| --- | --- |
| Credits vor/nach Action | AI123-Endfenster zeigt viele Corp-Credit-Aktionen, aber nicht in allen Entries strukturierte Credit-before/after-Werte. |
| billigster relevanter Rezbedarf | Nur indirekt über Rez-/Protection-/Install-Spuren und offizielle Reserve-Klassifikation belegbar. |
| zentrale Schutzlücken | Nicht ausreichend aus AI123 ableitbar; keine Hidden-Info- oder Full-State-Erweiterung vorgenommen. |
| Remote-/Scoreline-Fenster | B001 und C004 zeigen Scoreline-Progression; D006/D010 zeigen keine sichere Scoreline-Alternative. |
| legale Advance-/Score-/Install-/Rez-Actions | Teilweise in Action-Sequenz sichtbar; echte LegalAction-Alternativen fehlen noch. |
| opake `activated_card_ability` | Werden nicht als sichere Alternative gezählt, solange kein Progress-Outcome belegt ist. |

## Entscheidung

AI126 nimmt keinen Runtime-Fix vor.

Begründung:

- Die Reserve-Fälle sind nicht klar falsch; sie enthalten Scoreline-, Rez- oder Protection-Kontext.
- Die zwei No-Safe-Fälle sind echte Restkandidaten, aber noch ohne side-safe Alternativen-Snapshot.
- Opake Ability-Referenzen reichen nicht als Fixgrund.
- Ein generischer Corp-Economy-Malus wäre zu breit und würde legitime Rez-/Protection-Reserve treffen.

AI128-Kandidatenstatus:

- `D / ai-v143-tuning-006` und `D / ai-v143-tuning-010` bleiben Beobachtungskandidaten.
- Ein Runtime-Test ist nur zulässig, wenn AI127 für diese oder wiederholte ähnliche Fenster eine konkrete Scoreline-, Protection-, Install- oder Rez-Alternative side-safe belegt.

## Verifikation

- Analyse aus `docs/reviews/ai/ai120-residual-action-limit-a-d-10seed-2026-06-12.json`
- Analyse aus `docs/reviews/ai/ai123-x10-residual-cluster-inventory-2026-06-12.json`
- `git diff --check`
