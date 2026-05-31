/**
 * f1-scoring-engine.js — ES module
 *
 * Exports:
 *   scoreRace(schema, inputs, context)
 *   scoreRaceFlat(schema, flatInputs, context)
 */

// ── Threshold resolution ─────────────────────────────────────────────────────────────

/**
 * Walk the threshold bands in order, returning the score for the first band
 * whose upper bound is null (catch-all) or >= rawValue.
 */
function resolveThreshold(thresholds, rawValue) {
  for (const band of thresholds) {
    if (band.upper === null || rawValue <= band.upper) {
      return band.score;
    }
  }
  return thresholds[thresholds.length - 1].score;
}

// ── Condition evaluation ─────────────────────────────────────────────────────────────

/**
 * Evaluate a single leaf condition against the current signal values and context.
 */
function evalLeaf(leaf, resolvedSignals, ctx) {
  const OPERATORS = {
    eq:  (a, b) => a === b,
    neq: (a, b) => a !== b,
    lt:  (a, b) => a  <  b,
    lte: (a, b) => a  <= b,
    gt:  (a, b) => a  >  b,
    gte: (a, b) => a  >= b,
  };

  const compare = OPERATORS[leaf.operator];
  if (!compare) return false;

  let lhs;
  if (leaf.context_key !== undefined) {
    lhs = ctx[leaf.context_key];
  } else if (leaf.signal !== undefined) {
    lhs = resolvedSignals[leaf.signal]?.value;
  }

  if (lhs === undefined || lhs === null) return false;
  return compare(lhs, leaf.operand);
}

/**
 * Evaluate a (possibly compound) override condition.
 */
function evalCondition(condition, resolvedSignals, ctx) {
  if (Array.isArray(condition.all)) {
    return condition.all.every((leaf) => evalLeaf(leaf, resolvedSignals, ctx));
  }
  return evalLeaf(condition, resolvedSignals, ctx);
}

// ── Core scoring function ───────────────────────────────────────────────────────────────────

/**
 * Score a race given a schema, signal inputs, and context.
 */
export function scoreRace(schema, inputs = {}, context = {}) {
  const {
    circuit_id         = 'other',
    season_dominance_rate = 0,
    is_sprint_weekend  = false,
    manual_red_flag    = false,
  } = context;

  const manualInputs = inputs.manual ?? {};
  const autoInputs   = inputs.auto   ?? {};

  // ── Step 1: Resolve all provided signals to 0–100 ──────────────────────

  const resolvedSignals = {};

  for (const sig of schema.signals.manual) {
    const raw = manualInputs[sig.id];
    if (raw === undefined || raw === null) continue;

    const value = Math.max(0, Math.min(100, Number(raw)));
    resolvedSignals[sig.id] = {
      label:     sig.label,
      type:      'manual',
      raw_value: raw,
      value,
      weight:    sig.weight,
    };
  }

  for (const sig of schema.signals.auto) {
    const raw = autoInputs[sig.field] ?? autoInputs[sig.id];
    if (raw === undefined || raw === null) continue;

    const value = resolveThreshold(sig.thresholds, Number(raw));
    resolvedSignals[sig.id] = {
      label:     sig.label,
      type:      'auto',
      raw_value: raw,
      value,
      weight:    sig.weight,
    };
  }

  // ── Step 2: Weighted score ───────────────────────────────────────────────

  let weightedSum  = 0;
  let filledWeight = 0;

  for (const sig of Object.values(resolvedSignals)) {
    weightedSum  += sig.value * sig.weight;
    filledWeight += sig.weight;
  }

  const totalWeight = (
    schema.signals.manual.reduce((acc, s) => acc + s.weight, 0) +
    schema.signals.auto.reduce(  (acc, s) => acc + s.weight, 0)
  );

  const baseScore  = filledWeight > 0 ? weightedSum / filledWeight : 0;
  const confidence = filledWeight > 0 ? filledWeight / totalWeight  : 0;

  for (const sig of Object.values(resolvedSignals)) {
    sig.contribution = filledWeight > 0
      ? round2((sig.value * sig.weight) / filledWeight)
      : 0;
  }

  // ── Step 3: Circuit offset ────────────────────────────────────────────────

  const normalised    = circuit_id.toLowerCase().replace(/[^a-z_]/g, '_');
  const circuitOffset = schema.circuit_modifiers[normalised] ?? 0;
  const afterCircuit  = clamp(baseScore + circuitOffset);

  // ── Step 4: Season dominance ceiling ──────────────────────────────────────

  const rate           = clamp(season_dominance_rate, 0, 1);
  const maxPenalty     = schema.season_dominance.max_ceiling_penalty;
  const ceilingPenalty = rate * maxPenalty;
  const ceiling        = 100 - ceilingPenalty;
  const afterSeason    = Math.min(afterCircuit, ceiling);
  const seasonApplied  = afterCircuit > ceiling;

  // ── Step 5: Overrides ─────────────────────────────────────────────────────────────

  let score = afterSeason;
  const overrideLog = [];

  for (const ov of schema.overrides) {
    const triggered = evalCondition(ov.condition, resolvedSignals, {
      manual_red_flag,
      is_sprint_weekend,
    });

    const scoreBefore = score;
    let applied = false;

    if (triggered) {
      if (ov.type === 'floor' && score < ov.value) {
        score   = ov.value;
        applied = true;
      } else if (ov.type === 'cap' && score > ov.value) {
        score   = ov.value;
        applied = true;
      } else if (ov.type === 'offset') {
        score   = clamp(score + ov.value);
        applied = true;
      }
    }

    overrideLog.push({
      id:          ov.id,
      label:       ov.label,
      triggered,
      type:        ov.type,
      value:       ov.value,
      applied,
      score_before: round1(scoreBefore),
      score_after:  round1(score),
    });
  }

  const finalScore = clamp(score);

  // ── Step 6: Verdict and confidence level ─────────────────────────────────

  const verdict = finalScore >= schema.thresholds.race.min
    ? 'race'
    : finalScore >= schema.thresholds.highlights.min
    ? 'highlights'
    : 'skip';

  const confidenceLevel =
    confidence >= schema.confidence.medium_max ? 'high'
    : confidence >= schema.confidence.low_max  ? 'medium'
    : 'low';

  return {
    verdict,
    score:      round1(finalScore),
    confidence: round2(confidence),

    breakdown: {
      base_score:    round1(baseScore),
      after_circuit: round1(afterCircuit),
      after_season:  round1(afterSeason),
      final:         round1(finalScore),
    },

    modifiers: {
      circuit: {
        id:     circuit_id,
        offset: circuitOffset,
      },
      season_dominance: {
        rate,
        ceiling_penalty: round2(ceilingPenalty),
        effective_ceiling: round1(ceiling),
        applied: seasonApplied,
      },
    },

    overrides: overrideLog,
    signals: resolvedSignals,

    meta: {
      signals_filled:   Object.keys(resolvedSignals).length,
      signals_total:    schema.signals.manual.length + schema.signals.auto.length,
      weight_filled:    filledWeight,
      weight_total:     totalWeight,
      confidence_level: confidenceLevel,
      timestamp:        new Date().toISOString(),
    },
  };
}

// ── Flat convenience wrapper ──────────────────────────────────────────────────────────────

export function scoreRaceFlat(schema, flatInputs = {}, context = {}) {
  const manualIds  = new Set(schema.signals.manual.map((s) => s.id));
  const autoFields = new Set(schema.signals.auto.flatMap((s) => [s.field, s.id]));

  const manual = {};
  const auto   = {};

  for (const [key, value] of Object.entries(flatInputs)) {
    if (manualIds.has(key)) {
      manual[key] = value;
    } else if (autoFields.has(key)) {
      auto[key] = value;
    }
  }

  return scoreRace(schema, { manual, auto }, context);
}

// ── Helpers ─────────────────────────────────────────────────────────────────────────

function clamp(v, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}

function round1(v) {
  return Math.round(v * 10) / 10;
}

function round2(v) {
  return Math.round(v * 100) / 100;
}
