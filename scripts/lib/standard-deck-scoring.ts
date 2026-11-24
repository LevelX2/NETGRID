import { planningCardWithFactsByDefinitionId } from "../../packages/cards/src/planning/index";
import type { Side } from "../../packages/shared/src/index";
import hintData from "../../data/ai/card-spec-ai-hints-generated.json";

export type DeckToScore = {
  id: string;
  name: string;
  version: string;
  side: Side;
  cards: readonly { cardId: number; quantity: number }[];
  trial?: boolean;
};

export const axes = {
  runner: [
    [
      "economy",
      "Wirtschaft",
      "Netto-Credits, Auszahlungen und nutzbare zweckgebundene Credits. Teure oder bedingte Quellen zählen schwächer.",
    ],
    [
      "breakers",
      "Icebreaker",
      "Abdeckung von Wall, Code Gate und Sentry. Gewichtet nach Kopien, Suchbarkeit, Kosten und Verlässlichkeit.",
    ],
    [
      "speed",
      "Starttempo",
      "Günstige Breaker, sofortiges Geld, schneller Kartenzug und frühe Run-Effekte.",
    ],
    [
      "central",
      "Zentraldruck",
      "Mehrfachzugriffe, gezielte HQ- und R&D-Runs sowie Zugriffsersatz mit Druck auf die Zentralen.",
    ],
    [
      "remote",
      "Remote-Angriff",
      "Werkzeuge zum Angreifen, Umgehen, Offenlegen oder Sabotieren eines Wertungs-Remotes.",
    ],
    [
      "damage",
      "Schadensschutz",
      "Tatsächliche Prävention oder Ersetzung von Net-, Meat- und Core-Schaden. Wiederholbarer Schutz zählt stärker.",
    ],
    [
      "tags",
      "Tag-/Trace-Schutz",
      "Tags verhindern oder entfernen, Link erhöhen und Trace-Effekte abfangen.",
    ],
    [
      "control",
      "Sabotage",
      "ICE trashen oder derezzen, Corp-Credits angreifen und ihre Aktionen oder Infrastruktur stören.",
    ],
    [
      "refill",
      "Nachschub",
      "Kartenzug, Suche und Wiederherstellung aus dem Trash. Programmsuche zählt zusätzlich bei der Breaker-Suche.",
    ],
    [
      "special",
      "Sondermechanik",
      "Dichte und Vielfalt ausgewählter Mechaniken, die im Runner-Standardfeld selten sind.",
    ],
  ],
  corp: [
    [
      "economy",
      "Wirtschaft",
      "Netto-Credits, laufende Erträge und Rabatte für den Ausbau. Teure und scoregebundene Quellen zählen schwächer.",
    ],
    [
      "opener",
      "Früher Run-Stopp",
      "Bezahlbare Run-Stopps in den ersten Zügen. Mehrere ICE-Typen erhöhen die Abdeckung.",
    ],
    [
      "ice",
      "ICE-Zoll",
      "Stärke, Subroutinen, zusätzliche Run-Kosten und ausreichend ICE für mehrere Schichten. Hohe Rez-Kosten mindern den Beitrag.",
    ],
    [
      "speed",
      "Wertungstempo",
      "Advances pro Agenda, gewichtet nach Agendapunkten, plus Karten für zusätzliche Advances, Klicks und frühere Wertungsfenster.",
    ],
    [
      "remote",
      "Remote-Schutz",
      "ICE-Schichten, Upgrades und Regeln, die den Zugriff auf eine Agenda im Remote erschweren.",
    ],
    [
      "central",
      "Zentralschutz",
      "Einsetzbares ICE und gezielte Verteidigung von HQ und R&D, einschließlich zentraler Zugriffshindernisse.",
    ],
    [
      "damage",
      "Schadensdruck",
      "Schaden durch ICE, Zugriffe und Corp-Aktionen. Reichweite, Schadenshöhe und Voraussetzungen zählen.",
    ],
    [
      "tags",
      "Tag-/Trace-Druck",
      "Tags und Traces als Druckmittel. Tag-Strafen erhalten Zusatzgewicht bei eigenen Tag-Quellen.",
    ],
    [
      "control",
      "Board-Kontrolle",
      "Programme, Hardware oder Ressourcen angreifen, Runner-Klicks entziehen sowie Runs umleiten oder blockieren.",
    ],
    [
      "special",
      "Sondermechanik",
      "Dichte und Vielfalt ausgewählter Mechaniken, die im Corp-Standardfeld selten sind.",
    ],
  ],
} as const;

type Printed = NonNullable<
  ReturnType<typeof planningCardWithFactsByDefinitionId>
>;
type Hint = {
  roles: readonly string[];
  planRoles: readonly string[];
  requiredMechanics: readonly string[];
  valueHints: { economy?: number };
};
type Entry = Printed & { quantity: number; hint: Hint; tokens: Set<string> };
type Evidence = { title: string; quantity: number; weight: number };
export type DeckMetric = {
  score: number;
  detail: string;
  evidence: Evidence[];
};
const hints = new Map<number, Hint>(
  hintData.cards.map(({ cardId, hint }) => [cardId, hint]),
);
const iceTypes = ["wall", "code_gate", "sentry"] as const;
type IceType = (typeof iceTypes)[number];
const normalize = (value: string) => value.toLowerCase().replaceAll(" ", "_");
const format = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });
const show = (value: number) => format.format(value);
const cap = (value: number) => Math.min(1, Math.max(0, value));
const rating = (ratio: number) =>
  ratio >= 1 ? 10 : Math.min(9, 1 + Math.round(9 * cap(ratio)));
const sum = (values: readonly number[]) =>
  values.reduce((total, value) => total + value, 0);
const role = (e: Entry, ...values: string[]) =>
  values.some((value) => e.hint.roles.includes(value));
const plan = (e: Entry, ...values: string[]) =>
  values.some((value) => e.hint.planRoles.includes(value));
const token = (e: Entry, ...values: string[]) =>
  values.some((value) => e.tokens.has(value));
const price = (e: Entry) =>
  e.facts.cost ?? e.facts.installCost ?? e.facts.rezCost;
const affordable = (e: Entry, max: number) => (price(e) ?? Infinity) <= max;
const own = (e: Entry, recipient: string) =>
  recipient === e.facts.side || recipient === "controller";

function deckEntries(deck: DeckToScore) {
  const seen = new Set<number>();
  return deck.cards.map(({ cardId, quantity }): Entry => {
    const printed = planningCardWithFactsByDefinitionId(cardId);
    const hint = hints.get(cardId);
    if (
      !printed ||
      !hint ||
      printed.facts.side !== deck.side ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      seen.has(cardId)
    )
      throw new Error(
        `Ungültiger Karteneintrag in ${deck.id}: ${cardId} × ${quantity}`,
      );
    seen.add(cardId);
    return {
      ...printed,
      hint,
      quantity,
      tokens: new Set([...printed.facts.mechanics, ...hint.requiredMechanics]),
    };
  });
}

function contributions(
  entries: readonly Entry[],
  value: (entry: Entry) => number,
): Evidence[] {
  return entries
    .map((entry) => ({
      title: entry.facts.title,
      quantity: entry.quantity,
      weight: entry.quantity * value(entry),
    }))
    .filter(({ weight }) => weight > 0)
    .sort(
      (a, b) => b.weight - a.weight || a.title.localeCompare(b.title, "de"),
    );
}

function openingChance(copies: number, deckSize: number) {
  let miss = 1;
  for (let drawn = 0; drawn < Math.min(5, deckSize); drawn++)
    miss *= Math.max(0, (deckSize - copies - drawn) / (deckSize - drawn));
  return show(100 * (1 - miss));
}

function weighted(
  entries: readonly Entry[],
  factor: number,
  target: number,
  value: (entry: Entry) => number,
  note?: string,
): DeckMetric {
  const evidence = contributions(entries, value);
  const raw = sum(evidence.map(({ weight }) => weight)) * factor;
  return {
    score: rating(raw / target),
    detail: `${show(raw)} / ${show(target)} gewichtete Karteneinheiten pro 45 Karten${note ? ` · ${note}` : ""}`,
    evidence,
  };
}

function immediateCash(entry: Entry): number {
  if (entry.facts.cost === undefined) return 0;
  return Math.max(
    0,
    ...(entry.planning.engine.abilities ?? [])
      .filter((a) => a.kind === "on_play" && !a.condition)
      .map(
        (a) =>
          sum(
            (a.effects ?? []).map((e) =>
              e.kind === "gain_credits" && own(entry, e.recipient)
                ? e.amount
                : 0,
            ),
          ) - entry.facts.cost!,
      ),
  );
}

function economy(entry: Entry, entries: readonly Entry[]): number {
  const {
    facts,
    planning: { engine },
    hint,
  } = entry;
  const direct = immediateCash(entry);
  if (direct > 0)
    return Math.min(1.8, direct / 2.5) * (affordable(entry, 3) ? 1 : 0.7);
  if (facts.type === "agenda")
    return token(
      entry,
      "gain_credits_on_score",
      "shuffle_selected_hq_agendas_into_rd_gain_credits",
      "scored_agenda_credit_until_install_or_rez",
      "score_credit_swing_if_corp_credit_threshold_met",
    ) || hint.valueHints.economy
      ? 0.35
      : 0;
  if (facts.type === "ice") return 0;
  const restricted = engine.restrictedHostedCreditSource;
  if (restricted) {
    const usable = restricted.usableFor.some((use) => {
      if (use === "using_icebreaker_during_run_non_noisy")
        return entries.some(
          (e) =>
            e.planning.engine.icebreakerAbilities?.length &&
            !e.facts.subtypes.map(normalize).includes("noisy"),
        );
      if (use === "using_killer_during_run")
        return entries.some((e) => role(e, "breaker_killer"));
      if (use === "using_icebreaker_during_run")
        return entries.some(
          (e) => e.planning.engine.icebreakerAbilities?.length,
        );
      if (use === "play_events" || use === "install_programs")
        return entries.some(
          (e) => e.facts.type === (use === "play_events" ? "event" : "program"),
        );
      return true;
    });
    return usable ? (affordable(entry, 3) ? 0.65 : 0.43) : 0;
  }
  if (
    token(entry, "discounted_rez_ice_on_this_fort") ||
    role(entry, "event_credit_host")
  )
    return 0.45;
  const hasOwnGain = (engine.abilities ?? []).some((a) =>
    a.effects?.some(
      (e) =>
        e.kind === "gain_credits" && own(entry, e.recipient) && e.amount > 0,
    ),
  );
  if (
    !(
      hasOwnGain ||
      role(entry, "economy", "high_risk_economy", "recurring_credit") ||
      plan(
        entry,
        "remote_asset_economy",
        "recover_economy",
        "build_economy",
        "resource_value_engine",
        "credit_swing",
      ) ||
      engine.corpRootRezCreditOutcome ||
      (hint.valueHints.economy && facts.type === "upgrade")
    )
  )
    return 0;
  const quality = Math.min(1.35, 0.45 + 0.22 * (hint.valueHints.economy ?? 1));
  return (
    quality *
    (affordable(entry, 3) ? 1 : 0.65) *
    (role(entry, "high_risk_economy", "tag_self") ? 0.5 : 1)
  );
}

function economyProfile(
  entries: readonly Entry[],
  factor: number,
  target: number,
): DeckMetric {
  const cash = sum(
    entries
      .filter((e) => affordable(e, 3) && immediateCash(e) >= 2)
      .map((e) => e.quantity),
  );
  const size = sum(entries.map((e) => e.quantity));
  return weighted(
    entries,
    factor,
    target,
    (e) => economy(e, entries),
    `Sofortiges Geld in ${cash} Kartenkopien (mindestens 2 Netto-Credits bei höchstens 3 Credits Spielkosten). In den ersten fünf Karten liegt mit ${openingChance(cash, size)} % Wahrscheinlichkeit mindestens eine davon.`,
  );
}

function programSearch(entry: Entry): boolean {
  return (
    token(entry, "search_stack_install") ||
    (token(entry, "search_stack_to_grip", "stack_search", "search_stack") &&
      plan(entry, "build_rig", "stack_search", "rig_setup"))
  );
}

function draw(entry: Entry): boolean {
  return (
    role(entry, "draw", "draw_operation") ||
    plan(entry, "draw_for_answers", "hand_rebuild") ||
    (entry.planning.engine.abilities ?? []).some((a) =>
      a.effects?.some(
        (e) => e.kind === "draw_cards" && own(entry, e.recipient),
      ),
    )
  );
}

function breaker(entry: Entry, family: IceType): number {
  const {
    facts,
    planning: { engine },
  } = entry;
  return Math.max(
    0,
    ...(engine.icebreakerAbilities ?? []).map((ability) => {
      if (ability.kind !== "break_subroutine") return 0;
      const { matches, special } = ability;
      const scope =
        matches.kind === "any"
          ? 0.95
          : matches.kind === "selected_ice_subtype"
            ? 0.32
            : (matches.kind === "ice_subtype" &&
                  normalize(matches.subtype) === family) ||
                (matches.kind === "ice_subtype_any_of" &&
                  matches.subtypes.map(normalize).includes(family))
              ? 1
              : 0;
      if (!scope) return 0;
      const strength = facts.strength ?? 0;
      const pumps = (engine.icebreakerAbilities ?? []).filter(
        (a) => a.kind === "increase_strength",
      );
      const pumpCost =
        strength >= 3
          ? 0
          : Math.min(
              8,
              ...pumps
                .filter((a) => a.amount > 0)
                .map(
                  (a) => Math.ceil((3 - strength) / a.amount) * a.cost.amount,
                ),
            );
      const breakCost =
        ability.cost.amount * Math.ceil(2 / (ability.count ?? 1));
      const efficiency = Math.max(
        0.68,
        Math.min(1.15, 1.15 - 0.04 * (pumpCost + breakCost)),
      );
      const conditional =
        engine.installTargetBinding ||
        ability.onUse?.some((effect) => effect.kind === "end_run") ||
        special?.kind === "run_end_trash_source_if_used" ||
        special?.kind === "run_start_random_strength_bonus" ||
        special?.kind === "blink_random_break_or_net_damage" ||
        special?.kind === "bartmoss_post_encounter_self_trash_check";
      return (
        scope *
        efficiency *
        (conditional ? 0.55 : 1) *
        (affordable(entry, 4) ? 1 : 0.82)
      );
    }),
  );
}

function breakerProfile(entries: readonly Entry[], factor: number): DeckMetric {
  const search = Math.min(
    1.1,
    0.2 * sum(entries.filter(programSearch).map((e) => e.quantity)) * factor,
  );
  const familyValues = iceTypes.map((family) => {
    const weight =
      sum(entries.map((entry) => entry.quantity * breaker(entry, family))) *
      factor;
    return weight === 0 ? 0 : cap((1 - 0.65 ** (weight + search)) / 0.76);
  });
  return {
    score: rating(sum(familyValues) / iceTypes.length),
    detail: `Deckungswerte (Wall / Code Gate / Sentry) ${familyValues.map((value) => show(value * 100)).join(" / ")} von 100. Suchbonus bis ${show(search)} Gewichtseinheiten.`,
    evidence: contributions(entries, (e) =>
      Math.max(
        ...iceTypes.map((family) => breaker(e, family)),
        programSearch(e) ? 0.2 : 0,
      ),
    ),
  };
}

const damageTypes = ["net", "meat", "core"] as const;
type DamageType = (typeof damageTypes)[number];

function prevention(entry: Entry, type: DamageType): number {
  const amount = Math.max(
    0,
    ...(entry.planning.engine.damagePreventionSources ?? [])
      .filter((source) => source.damageTypes.includes(type))
      .map(
        (source) =>
          Math.min(source.amount === "all" ? 4 : source.amount, 4) *
          (source.cost.kind === "none" ? 1 : 0.68),
      ),
  );
  const replacement = entry.planning.engine.flatlineReplacementSources?.some(
    (source) =>
      source.kind === "damage_replacement_from_grip" &&
      source.damageType === type,
  )
    ? 2.4
    : 0;
  return Math.max(amount, replacement) * (affordable(entry, 3) ? 1 : 0.7);
}

function damageProtection(
  entries: readonly Entry[],
  factor: number,
): DeckMetric {
  const protectionFor = (type: DamageType) =>
    sum(entries.map((e) => e.quantity * prevention(e, type))) * factor;
  const net = protectionFor("net"),
    meat = protectionFor("meat"),
    core = protectionFor("core");
  const score = rating(
    0.4 * cap(net / 6) + 0.4 * cap(meat / 6) + 0.2 * cap(core / 4),
  );
  return {
    score,
    detail: `Schutzgewicht pro 45 Karten Net ${show(net)}, Meat ${show(meat)}, Core ${show(core)}. Teilgewichte 40 %, 40 %, 20 %.`,
    evidence: contributions(entries, (e) =>
      Math.max(...damageTypes.map((type) => prevention(e, type))),
    ),
  };
}

function centralPressure(entry: Entry): number {
  if (
    role(entry, "multiaccess", "rd_multiaccess", "hq_access") ||
    token(entry, "successful_run_bonus_access", "access_count")
  )
    return 1.45;
  if (
    role(entry, "rd_access_replacement", "hq_pressure", "rd_pressure") ||
    plan(
      entry,
      "conditional_hq_access_replacement",
      "rnd_deck_pressure",
      "hq_free_trash_access",
    )
  )
    return 1;
  return plan(
    entry,
    "pressure_hq",
    "pressure_rnd",
    "multi_central_virus_pressure",
  )
    ? 0.65
    : 0;
}

function remoteAttack(entry: Entry): number {
  if (
    plan(
      entry,
      "contest_remote",
      "remote_scoring_denial",
      "remote_ice_sabotage",
      "pressure_remote",
    ) ||
    token(entry, "secret_spend_guess_then_targeted_bypass_run")
  )
    return 1.2;
  if (
    role(entry, "ice_trash", "derez", "expose") ||
    token(
      entry,
      "trash_rezzed_ice",
      "trash_unrezzed_ice",
      "expose_installed_cards",
    )
  )
    return 0.65;
  return role(entry, "run_support", "efficient_breaker") &&
    centralPressure(entry) === 0
    ? 0.42
    : 0;
}

function runnerMetrics(entries: readonly Entry[], factor: number) {
  return {
    economy: economyProfile(entries, factor, 16),
    breakers: breakerProfile(entries, factor),
    speed: weighted(entries, factor, 16, (e) =>
      Math.max(
        affordable(e, 3) ? Math.max(...iceTypes.map((f) => breaker(e, f))) : 0,
        affordable(e, 3) && immediateCash(e) > 0 ? 0.9 : 0,
        affordable(e, 3) && programSearch(e) ? 0.85 : 0,
        affordable(e, 2) && draw(e) ? 0.62 : 0,
        affordable(e, 1) && token(e, "make_run", "start_run") ? 0.65 : 0,
      ),
    ),
    central: weighted(entries, factor, 12, centralPressure),
    remote: weighted(entries, factor, 10, remoteAttack),
    damage: damageProtection(entries, factor),
    tags: weighted(entries, factor, 9, (e) => {
      if (
        e.planning.engine.tagPreventionSources?.length ||
        role(e, "tag_removal") ||
        token(e, "remove_tags", "cancel_successful_trace_effect")
      )
        return 1;
      return (e.facts.baseLink ?? 0) > 0 ||
        role(e, "link") ||
        plan(e, "trace_defense", "avoid_traces")
        ? 0.65
        : 0;
    }),
    control: weighted(entries, factor, 10, (e) => {
      if (
        role(e, "ice_trash", "derez", "corp_credit_denial") ||
        plan(
          e,
          "hq_credit_denial",
          "corp_action_denial",
          "tax_corp_rez",
          "rnd_deck_pressure",
        ) ||
        token(
          e,
          "trash_rezzed_ice",
          "trash_unrezzed_ice",
          "corp_credit_loss",
          "runner_spend_corp_credit_loss",
        )
      )
        return 1;
      return role(e, "rez_tax", "ice_modifier") || token(e, "add_bad_publicity")
        ? 0.6
        : 0;
    }),
    refill: weighted(entries, factor, 13, (e) => {
      if (
        programSearch(e) ||
        token(
          e,
          "search_trash_to_grip",
          "choose_stack_or_trash_program_install",
          "search_stack_to_grip",
        ) ||
        plan(e, "recover_rig", "recover_cards", "stack_search")
      )
        return 1.15;
      return draw(e) ||
        token(
          e,
          "look_top_stack_take_one_arrange_rest",
          "look_top_stack_take_matching",
        )
        ? 0.8
        : 0;
    }),
  };
}

function runStop(entry: Entry): number {
  if (entry.facts.type !== "ice") return 0;
  const directStops = entry.facts.subroutines?.filter(
    (s) =>
      s.type === "end_the_run" ||
      s.type === "end_the_run_and_trash_source_at_end_of_turn",
  );
  if (
    directStops?.some(
      (s) => s.requiresSuccessfulTraceSubroutineIndex === undefined,
    )
  )
    return 1;
  return directStops?.length ||
    role(entry, "etr_ice") ||
    token(
      entry,
      "end_the_run_unless_runner_pays",
      "paid_end_the_run_subroutines",
    )
    ? 0.55
    : 0;
}

function earlyStop(entry: Entry): number {
  const stop = runStop(entry);
  if (!stop) return 0;
  const rez = affordable(entry, 3) ? 1 : affordable(entry, 5) ? 0.45 : 0;
  return (
    stop *
    rez *
    (token(entry, "install_only_inside_subsidiary_data_fort") ? 0.45 : 1)
  );
}

function earlyProtection(
  entries: readonly Entry[],
  factor: number,
): DeckMetric {
  const result = weighted(entries, factor, 12, earlyStop);
  const kinds = new Set(
    entries
      .filter((e) => earlyStop(e) >= 0.55)
      .flatMap((e) =>
        e.facts.subtypes
          .map(normalize)
          .filter((subtype) => iceTypes.some((kind) => kind === subtype)),
      ),
  );
  const raw = sum(result.evidence.map(({ weight }) => weight)) * factor;
  const copies = sum(
    entries.filter((e) => earlyStop(e) >= 1).map((e) => e.quantity),
  );
  const size = sum(entries.map((e) => e.quantity));
  return {
    ...result,
    score: rating((raw + 0.55 * kinds.size) / 12),
    detail: `${show(raw)} gewichtete Stopps pro 45 Karten + ${show(0.55 * kinds.size)} für ${kinds.size} abgedeckte ICE-Typen. Zielwert 12. ${copies} günstige direkte Stopps. Chance auf mindestens einen in den ersten fünf Karten ${openingChance(copies, size)} %.`,
  };
}

function iceTax(entry: Entry): number {
  if (entry.facts.type !== "ice") return 0;
  const { strength, subroutines } = entry.facts;
  const subs = Math.min(4, subroutines?.length ?? 0);
  const power = Math.min(6, strength ?? 0);
  const tax =
    role(entry, "taxing_ice") ||
    token(
      entry,
      "run_duration_break_subroutine_cost",
      "run_duration_encounter_cost_or_end_run",
    );
  return (
    (0.25 + 0.19 * subs + 0.09 * power + (tax ? 0.32 : 0)) *
    (affordable(entry, 4) ? 1 : affordable(entry, 7) ? 0.9 : 0.72)
  );
}

function scoreHelp(e: Entry): number {
  if (e.facts.type === "agenda") return 0;
  if (
    token(
      e,
      "agenda_difficulty",
      "add_advancement_counters_after_passing_last_ice_on_this_fort",
      "move_advancement_counters",
      "distribute_advancement_counters",
      "gain_actions",
    ) ||
    plan(
      e,
      "corp_action_burst",
      "corp_action_tempo",
      "advance_score_window_support",
      "advancement_to_action_engine",
    )
  )
    return affordable(e, 3) ? 0.44 : 0.28;
  return 0;
}

function agendaTempo(entries: readonly Entry[], factor: number): DeckMetric {
  const agendas = entries.filter((e) => e.facts.type === "agenda");
  const points = sum(
    agendas.map((e) => e.quantity * (e.facts.agendaPoints ?? 0)),
  );
  if (
    !points ||
    agendas.some(
      (e) =>
        e.facts.advancementRequirement === undefined ||
        e.facts.agendaPoints === undefined,
    )
  )
    throw new Error("Wertungstempo benötigt vollständige Corp-Agendadaten");
  const difficult =
    sum(
      agendas.map(
        (e) =>
          e.quantity * e.facts.agendaPoints! * e.facts.advancementRequirement!,
      ),
    ) / points;
  const shortCopies = sum(
    agendas
      .filter((e) => e.facts.advancementRequirement! <= 3)
      .map((e) => e.quantity),
  );
  const agendaCopies = sum(agendas.map((e) => e.quantity));
  const shortBonus = (0.65 * shortCopies) / agendaCopies;
  const tempo = Math.max(0, 6 - difficult);
  const helpers = contributions(entries, scoreHelp);
  const help = Math.min(1.05, sum(helpers.map((e) => e.weight)) * factor);
  return {
    score: rating((tempo + shortBonus + help) / 4),
    detail: `${show(difficult)} Advances je Agenda, nach Agendapunkten gewichtet. ${shortCopies} von ${agendaCopies} Agendakopien mit höchstens 3 Advances (+${show(shortBonus)}). Wertungshilfe +${show(help)}. Ziel für 10 ist 4 bei (6 − gewichtete Advances) + Boni.`,
    evidence: [
      ...contributions(
        agendas,
        (e) =>
          (Math.max(0, 6 - e.facts.advancementRequirement!) *
            e.facts.agendaPoints!) /
          points,
      ),
      ...helpers,
    ],
  };
}

function remoteDefense(e: Entry): number {
  if (e.facts.type === "ice") return 0.35 * iceTax(e) + 0.18 * runStop(e);
  if (
    token(
      e,
      "server_run_start_restriction",
      "steal_cost",
      "runner_pay_or_end_run_after_passing_ice_on_this_fort",
    ) ||
    plan(
      e,
      "remote_upgrade_tax",
      "remote_upgrade_trap",
      "remote_scoring_denial",
    )
  )
    return 1.3;
  if (
    e.facts.type === "upgrade" &&
    (role(e, "ice_modifier", "run_defense") ||
      plan(e, "remote_upgrade_rez_support", "remote_upgrade_modifier") ||
      token(e, "discounted_rez_ice_on_this_fort", "run_start_tax"))
  )
    return 0.82;
  return 0;
}

function centralDefense(e: Entry): number {
  if (e.facts.type === "ice")
    return (
      (0.35 * earlyStop(e) + 0.3 * iceTax(e)) *
      (token(e, "install_only_inside_subsidiary_data_fort") ? 0.4 : 1)
    );
  if (
    token(
      e,
      "reduce_current_access_queue",
      "temporary_hq_ice_encounter_after_successful_run",
      "start_run_redirect_to_source_fort",
    ) ||
    plan(e, "rnd_access_trap", "hq_discard_buffer")
  )
    return 1.2;
  if (e.facts.type === "upgrade" && token(e, "steal_cost", "run_start_tax"))
    return 0.68;
  return e.facts.type === "agenda" && role(e, "ambush") ? 0.6 : 0;
}

function tagSource(e: Entry): boolean {
  return (
    token(
      e,
      "add_tags",
      "give_runner_tag",
      "add_tags_by_trace_margin_over_runner_link",
      "runner_draw_tax_tag",
    ) ||
    role(e, "tag_ice") ||
    plan(e, "tag_source")
  );
}

function corpDamage(e: Entry, tagSupport: number): number {
  const printed = sum(
    (e.facts.subroutines ?? []).map((s) => {
      if (s.type === "do_damage") return s.amount ?? 1;
      if (s.type === "random_damage" && s.damageOnResults?.length)
        return sum(s.damageOnResults) / s.damageOnResults.length;
      if (
        s.traceSuccessEffect?.type === "net_damage" ||
        s.traceSuccessEffect?.type ===
          "end_run_trash_hardware_and_unpreventable_meat_damage"
      )
        return 0.5 * s.traceSuccessEffect.amount;
      return 0;
    }),
  );
  const direct = Math.max(
    0,
    ...(e.planning.engine.abilities ?? []).map(
      (a) =>
        sum(
          (a.effects ?? []).map((effect) =>
            effect.kind === "damage" ? effect.amount : 0,
          ),
        ) *
        (a.condition?.kind === "runner_is_tagged"
          ? tagSupport
          : a.condition
            ? 0.65
            : 1),
    ),
  );
  if (printed > 0)
    return Math.min(1.45, 0.43 * printed) * (affordable(e, 5) ? 1 : 0.72);
  if (direct > 0)
    return Math.min(2, 0.5 * direct) * (affordable(e, 4) ? 1 : 0.8);
  if (
    role(
      e,
      "damage",
      "damage_ice",
      "net_damage",
      "meat_damage",
      "core_damage_ice",
    ) ||
    token(
      e,
      "printed_subroutine_damage",
      "damage_from_source_advancement_counters",
      "run_start_counter_damage",
    ) ||
    (e.facts.type !== "ice" && token(e, "damage", "net_damage", "core_damage"))
  )
    return 0.65 * (affordable(e, 5) || e.facts.type === "agenda" ? 1 : 0.75);
  return 0;
}

function corpMetrics(entries: readonly Entry[], factor: number) {
  const tagCopies = sum(entries.filter(tagSource).map((e) => e.quantity));
  const tagSupport = Math.min(1, 0.25 + 0.15 * tagCopies * factor);
  return {
    economy: economyProfile(entries, factor, 13),
    opener: earlyProtection(entries, factor),
    ice: weighted(entries, factor, 19, iceTax),
    speed: agendaTempo(entries, factor),
    remote: weighted(entries, factor, 16, remoteDefense),
    central: weighted(entries, factor, 15, centralDefense),
    damage: weighted(
      entries,
      factor,
      12,
      (e) => corpDamage(e, tagSupport),
      `${tagCopies} Kartenkopien mit Tag-Quelle`,
    ),
    tags: weighted(entries, factor, 11, (e) => {
      if (tagSource(e)) return e.facts.type === "ice" ? 0.82 : 1.1;
      if (
        token(e, "runner_is_tagged", "runner_tags_at_least") ||
        role(e, "tag_punishment", "tag_punishment_operation")
      )
        return 0.7 * tagSupport;
      return token(e, "trace") ? 0.35 : 0;
    }),
    control: weighted(entries, factor, 13, (e) => {
      if (
        token(
          e,
          "trash_installed_program",
          "trash_installed_runner_cards",
          "trash_hardware",
          "trash_programs",
          "corp_trash_installed_runner_resource",
          "runner_run_lock_actions",
          "return_installed_runner_programs_to_grip",
        ) ||
        role(e, "program_trash", "run_lock_ice") ||
        plan(e, "disrupt_runner_rig", "hardware_pressure")
      )
        return affordable(e, 5) ? 1.08 : 0.78;
      if (
        token(
          e,
          "start_run_redirect_to_source_fort",
          "deflect_run",
          "runner_draw_tax_tag",
          "end_the_run_and_runner_forgoes_next_action",
          "next_encounter_no_break_subroutines",
          "purge_runner_virus_counters",
        )
      )
        return 0.75;
      return 0;
    }),
  };
}

const specialFamilies: Record<string, readonly string[]> = {
  "ICE verschieben oder austauschen": [
    "encounter_reposition",
    "move_self_to_different_position_on_same_fort",
    "swap_unrezzed_fort_ice_with_hq_ice",
    "start_run_ice_move",
    "corp_return_passed_ice_to_hq",
  ],
  "Run umleiten": [
    "deflect_run",
    "start_run_redirect_to_source_fort",
    "random_resume_from_rezzed_ice_back_or_jack_out",
  ],
  "Run-Regeln verändern": [
    "server_run_start_restriction",
    "next_encounter_no_break_subroutines",
    "prohibit_break_and_jack_out_next_ice",
    "run_duration_break_subroutine_cost",
    "runner_run_lock_actions",
  ],
  "Würfel und verdeckte Gebote": [
    "random_die_resolution",
    "roll_die_on_pass_rezzed_ice_on_same_fort",
    "secret_spend_guess_then_targeted_bypass_run",
    "blink_random_break_or_net_damage",
  ],
  "Agenda-Zugriff ersetzen": [
    "agenda_access_replacement",
    "delayed_agenda_access_replacement",
    "rd_access_replacement",
    "reduce_current_access_queue",
  ],
  "Künftige Klicks binden": [
    "obligation_debt",
    "future_action_debt",
    "lose_future_clicks",
    "end_the_run_and_runner_forgoes_next_action",
  ],
  "Entwicklungsmarker umbuchen": [
    "move_advancement_counters",
    "advancement_to_action_engine",
  ],
  "HQ-Agendas für Credits zurückmischen": [
    "shuffle_selected_hq_agendas_into_rd_gain_credits",
  ],
  "HQ-Agendas für Credits offenlegen": ["show_hq_agendas_for_credits"],
  "Agendapunkte gegen Credits tauschen": [
    "convert_recent_agenda_points_to_economy",
  ],
  "Nach der Wertung sofort ausbauen": [
    "score_install_hq_cards_into_new_remote_then_rez",
    "score_rez_installed_ice_at_no_cost",
    "rez_expensive_ice_after_score",
  ],
  "Deckung der Breaker ändern": [
    "icebreakerSubtypeChange",
    "against_selected_installed_ice",
    "choose_icebreaker_subtype_on_install",
    "run_start_random_strength_bonus",
  ],
  "Sonderwege zu Punkten": [
    "runner_gain_agenda_point",
    "gain_runner_event_agenda_point",
    "mark_next_agenda_access_agenda_point",
    "overadvance_bonus_agenda_points",
  ],
  "Druck über Bad Publicity": [
    "bad_publicity_closeout",
    "add_bad_publicity_from_frame_up_history",
    "bad_publicity_pressure",
  ],
  "Kartenziehen oder Deck angreifen": [
    "corp_forced_draw_pressure",
    "rnd_deck_pressure",
    "corp_draw_replacement",
    "shuffle_grip_into_stack",
    "runner_draw_tax_tag",
  ],
  "Corp-Geld oder HQ indirekt unter Druck setzen": [
    "runner_spend_corp_credit_loss",
    "corp_discard_hq_with_retain_payment",
  ],
  "ICE durch Wertung verstärken": [
    "select_rezzed_ice_mark_modifier",
    "choose_fort_ice_strength_bonus",
  ],
  "Rolle einer Karte wechseln": [
    "install_as_runner_program",
    "remove_from_game_on_leave_play",
    "delayed_install_with_counter_countdown",
    "temporary_program_install",
  ],
  "Zerstörung gegen Gegenleistung": [
    "trash_own_rezzed_ice_for_credits",
    "pay_rez_cost_to_trash_rezzed_ice",
    "trash_rezzed_ice_on_last_successful_run_fort_and_add_tags",
    "corp_choice_derez_last_rezzed_black_ice_or_bad_publicity",
  ],
  "Regeln für Stealth verändern": [
    "block_stealth_bits_during_runs_on_this_fort",
    "lose_bits_from_stealth_sources",
    "no_noisy_icebreaker_or_trace_condition",
  ],
  "Schaden durch anderen Effekt ersetzen": [
    "emergency_damage_replacement",
    "corp_damage_replacement_pdca_action_counter",
    "runner_hand_size_pressure",
  ],
  "Speicher aus Handgröße bestimmen": [
    "memory_limit_from_grip_size",
    "temporary_memory_limit_modifier",
  ],
};

function families(entries: readonly Entry[]) {
  return Object.entries(specialFamilies)
    .filter(([, tokens]) =>
      entries.some(
        (e) => token(e, ...tokens) || plan(e, ...tokens) || role(e, ...tokens),
      ),
    )
    .map(([name]) => name);
}

function specialMetric(
  entries: readonly Entry[],
  factor: number,
  rare: ReadonlySet<string>,
): DeckMetric {
  const covered = families(entries);
  const active = covered.filter((name) => rare.has(name));
  const common = covered.filter((name) => !rare.has(name));
  const evidence = contributions(entries, (entry) =>
    Number(families([entry]).some((name) => rare.has(name))),
  );
  const copies = sum(evidence.map((e) => e.quantity));
  const cards =
    evidence.length === 1
      ? "1 Sonderkarte"
      : `${evidence.length} verschiedene Sonderkarten`;
  const variety =
    active.length === 1
      ? "1 seltene Mechanikfamilie"
      : `${active.length} seltene Mechanikfamilien`;
  return {
    score: rating(
      0.6 * cap((copies * factor) / 10) + 0.4 * cap(active.length / 5),
    ),
    detail: `${cards}, ${copies} Kartenkopien und ${variety}${active.length ? ` · ${active.join(", ")}` : ""}.${common.length ? ` Im Katalog häufiger vertreten sind ${common.join(", ")}.` : ""}`,
    evidence,
  };
}

export function scoreDecks(decks: readonly DeckToScore[]) {
  const input = decks.map((deck) => {
    const entries = deckEntries(deck);
    const size = sum(entries.map((entry) => entry.quantity));
    if (!size) throw new Error(`Leeres Deck: ${deck.id}`);
    return { deck, entries, size };
  });
  const standard = input.filter(({ deck }) => !deck.trial);
  const rare = new Map(
    (["runner", "corp"] as const).map((side) => {
      const reference = standard.filter(({ deck }) => deck.side === side);
      if (!reference.length)
        throw new Error(`Kein Vergleichskatalog für ${side}`);
      const perDeck = reference.map(({ entries }) => families(entries));
      const limit = Math.floor(reference.length * 0.2);
      return [
        side,
        new Set(
          Object.keys(specialFamilies).filter(
            (name) =>
              perDeck.filter((present) => present.includes(name)).length <=
              limit,
          ),
        ),
      ] as const;
    }),
  );
  return input.map(({ deck, entries, size }) => {
    const factor = 45 / size;
    const base: Record<string, DeckMetric> =
      deck.side === "runner"
        ? runnerMetrics(entries, factor)
        : corpMetrics(entries, factor);
    const metrics: Record<string, DeckMetric> = {
      ...base,
      special: specialMetric(entries, factor, rare.get(deck.side)!),
    };
    return { deck, size, metrics };
  });
}
