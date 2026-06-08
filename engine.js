// ============================================================
// WEIGHTED CALISTHENICS TRACKER — PROGRESSION ENGINE
// engine.js
// Pure logic. No UI. No HTML. No CSS.
// ============================================================

"use strict";

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────

/**
 * Round a number to the nearest 0.5kg increment.
 * @param {number} value
 * @returns {number}
 */
function roundToHalf(value) {
  return Math.round(value * 2) / 2;
}

// ─────────────────────────────────────────────────────────────
// PHASE DETECTION
// ─────────────────────────────────────────────────────────────

/**
 * Detect training phase based on 6RM (kg added via belt).
 * Runs once per exercise during onboarding.
 *
 * @param {number} sixRM - Athlete's 6-rep-max in kg added
 * @returns {"novice"|"advanced_novice"|"intermediate_s1"|"intermediate_s2"}
 */
function detectPhase(sixRM) {
  if (sixRM < 20)  return "novice";
  if (sixRM < 40)  return "advanced_novice";
  if (sixRM < 60)  return "intermediate_s1";
  return "intermediate_s2";
}

// ─────────────────────────────────────────────────────────────
// STARTING WEIGHT CALCULATION
// ─────────────────────────────────────────────────────────────

/**
 * Calculate the starting working weight for an exercise.
 * For independent exercises: use 6RM directly.
 * For paused_dips: 80% of regular dips starting weight, rounded to 0.5kg.
 *
 * @param {string}      exerciseId        - e.g. "dips", "paused_dips", "pullups", "chinups"
 * @param {number|null} sixRM             - Athlete's 6RM (null for derived exercises)
 * @param {number|null} regularDipsWeight - Current/starting weight of regular dips (for paused_dips)
 * @returns {number}
 */
function calculateStartingWeight(exerciseId, sixRM, regularDipsWeight) {
  if (exerciseId === "paused_dips") {
    if (regularDipsWeight === null || regularDipsWeight === undefined) {
      throw new Error("regularDipsWeight is required for paused_dips");
    }
    return roundToHalf(regularDipsWeight * 0.80);
  }
  return sixRM;
}

// ─────────────────────────────────────────────────────────────
// HARDEST SET DETECTION
// ─────────────────────────────────────────────────────────────

/**
 * Find the hardest set from a completed session.
 * Hardest = lowest RIR. Tiebreak: fewest reps. Tiebreak: last set.
 *
 * @param {Array<{reps: number, rir: number}>} sets
 * @returns {{reps: number, rir: number}}
 */
function getHardestSet(sets) {
  if (!sets || sets.length === 0) {
    throw new Error("No sets provided to getHardestSet");
  }

  let hardest = sets[0];

  for (let i = 1; i < sets.length; i++) {
    const s = sets[i];

    if (s.rir < hardest.rir) {
      // Lower RIR — harder
      hardest = s;
    } else if (s.rir === hardest.rir) {
      if (s.reps < hardest.reps) {
        // Same RIR, fewer reps — harder
        hardest = s;
      } else if (s.reps === hardest.reps) {
        // Full tie — take the last set (i is always later, so overwrite)
        hardest = s;
      }
    }
  }

  return { reps: hardest.reps, rir: hardest.rir };
}

// ─────────────────────────────────────────────────────────────
// INCREMENT TABLES
// ─────────────────────────────────────────────────────────────

/**
 * Look up the increment for a NOVICE session.
 * Rep target: 5–8, 3 sets.
 *
 * @param {{reps: number, rir: number}} hardestSet
 * @returns {{ increment: number, stall: boolean, deloadSuggested: boolean }}
 */
function getIncrementNovice(hardestSet) {
  const { reps, rir } = hardestSet;

  if (reps >= 8) {
    if (rir >= 1) return { increment: 2.5,  stall: false, deloadSuggested: false };
    if (rir === 0) return { increment: 1.25, stall: false, deloadSuggested: false };
  }

  if (reps === 7) {
    if (rir >= 1) return { increment: 1.25, stall: false, deloadSuggested: false };
    if (rir === 0) return { increment: 0.5,  stall: false, deloadSuggested: false };
  }

  if (reps === 6) {
    if (rir >= 1) return { increment: 0.5,  stall: false, deloadSuggested: false };
    if (rir === 0) return { increment: 0,    stall: true,  deloadSuggested: false };
  }

  if (reps === 5) {
    return { increment: 0, stall: true, deloadSuggested: false };
  }

  // Below 5 reps
  return { increment: 0, stall: true, deloadSuggested: true };
}

/**
 * Look up the increment for an ADVANCED NOVICE session.
 * Rep target: 3–6, 3 sets.
 *
 * @param {{reps: number, rir: number}} hardestSet
 * @returns {{ increment: number, stall: boolean, deloadSuggested: boolean }}
 */
function getIncrementAdvancedNovice(hardestSet) {
  const { reps, rir } = hardestSet;

  if (reps >= 6) {
    if (rir >= 1) return { increment: 2.5,  stall: false, deloadSuggested: false };
    if (rir === 0) return { increment: 1.25, stall: false, deloadSuggested: false };
  }

  if (reps === 5) {
    if (rir >= 1) return { increment: 1.25, stall: false, deloadSuggested: false };
    if (rir === 0) return { increment: 0.5,  stall: false, deloadSuggested: false };
  }

  if (reps === 4) {
    if (rir >= 1) return { increment: 0.5,  stall: false, deloadSuggested: false };
    if (rir === 0) return { increment: 0,    stall: true,  deloadSuggested: false };
  }

  if (reps === 3) {
    return { increment: 0, stall: true, deloadSuggested: true };
  }

  // Below 3 reps
  return { increment: 0, stall: true, deloadSuggested: true };
}

/**
 * Look up the increment for an INTERMEDIATE_S1 PR session.
 * Rep target: 3–6. Increment based on PR set reps only.
 *
 * @param {{reps: number, rir: number}} hardestSet
 * @returns {{ increment: number, stall: boolean, deloadSuggested: boolean }}
 */
function getIncrementIntermediateS1(hardestSet) {
  const { reps } = hardestSet; // RIR not used for S1 PR table

  if (reps >= 6) return { increment: 2.5,  stall: false, deloadSuggested: false };
  if (reps === 5) return { increment: 1.25, stall: false, deloadSuggested: false };
  if (reps === 4) return { increment: 0.5,  stall: false, deloadSuggested: false };
  if (reps === 3) return { increment: 0.5,  stall: false, deloadSuggested: false };
  if (reps === 2) return { increment: 0,    stall: true,  deloadSuggested: false };
  // 1 rep or below
  return { increment: 0, stall: true, deloadSuggested: true };
}

/**
 * Look up the increment for an INTERMEDIATE_S2 session.
 * Increment based on RIR of hardest set.
 * Handles "missed rep" scenarios via negative-RIR convention:
 *   rir === -1 → missed 1 rep in 1 set
 *   rir === -2 → missed 1 rep in 2+ sets
 *
 * @param {{reps: number, rir: number}} hardestSet
 * @param {Array<{reps: number, rir: number}>} allSets - needed to count missed sets
 * @returns {{ increment: number, stall: boolean, deloadSuggested: boolean }}
 */
function getIncrementIntermediateS2(hardestSet, allSets) {
  const { rir } = hardestSet;

  if (rir >= 2)  return { increment: 2.5,  stall: false, deloadSuggested: false };
  if (rir === 1) return { increment: 1.25, stall: false, deloadSuggested: false };
  if (rir === 0) return { increment: 0.5,  stall: false, deloadSuggested: false };

  // Negative RIR convention: missed reps
  // rir === -1 means missed 1 rep in a set
  if (rir === -1) {
    // Count how many sets had missed reps (rir < 0)
    const missedSetsCount = allSets.filter(s => s.rir < 0).length;
    if (missedSetsCount === 1) {
      // Missed 1 rep in single set
      return { increment: 0.5, stall: false, deloadSuggested: false };
    } else {
      // Missed 1 rep in 2+ sets
      return { increment: 0, stall: true, deloadSuggested: false };
    }
  }

  // Deeper misses (rir <= -2): treat as stall
  return { increment: 0, stall: true, deloadSuggested: false };
}

// ─────────────────────────────────────────────────────────────
// STALL DETECTION & DELOAD
// ─────────────────────────────────────────────────────────────

/**
 * Given the current stallCount and increment result,
 * compute the updated stallCount and stall-threshold flags.
 *
 * @param {number}  currentStallCount
 * @param {boolean} didStall        - true if this session produced increment = 0
 * @param {boolean} incrementGiven  - true if increment > 0 (resets stall)
 * @returns {{
 *   newStallCount: number,
 *   deloadSuggested: boolean,
 *   phaseTransitionSuggested: boolean
 * }}
 */
function evaluateStall(currentStallCount, didStall, incrementGiven) {
  let newStallCount = currentStallCount;

  if (incrementGiven) {
    newStallCount = 0;
  } else if (didStall) {
    newStallCount = currentStallCount + 1;
  }

  const deloadSuggested        = newStallCount >= 2;
  const phaseTransitionSuggested = newStallCount >= 5;

  return { newStallCount, deloadSuggested, phaseTransitionSuggested };
}

/**
 * Calculate a deload weight: reduce by 10%, rounded to nearest 0.5kg.
 *
 * @param {number} currentWeight
 * @returns {number}
 */
function calculateDeloadWeight(currentWeight) {
  return roundToHalf(currentWeight * 0.90);
}

// ─────────────────────────────────────────────────────────────
// MAIN PROGRESSION FUNCTION
// ─────────────────────────────────────────────────────────────

/**
 * Determine the next weight prescription for an exercise.
 *
 * @param {{
 *   id: string,
 *   phase: string|null,
 *   currentWeight: number,
 *   stallCount: number,
 *   followsExercise: string|null,
 *   parentCurrentWeight?: number  // required when followsExercise is set
 * }} exercise
 *
 * @param {{
 *   sets: Array<{reps: number, rir: number}>,
 *   sessionType: "heavy"|"assistance"|"pr"
 * }} lastSession
 *
 * @returns {{
 *   nextWeight: number,
 *   increment: number,
 *   stallDetected: boolean,
 *   deloadSuggested: boolean,
 *   phaseTransitionSuggested: boolean,
 *   message: string
 * }}
 */
function getNextPrescription(exercise, lastSession) {
  // ── Step 1: Derived exercise (Paused Dips) ────────────────
  if (exercise.followsExercise !== null && exercise.followsExercise !== undefined) {
    if (exercise.parentCurrentWeight === undefined || exercise.parentCurrentWeight === null) {
      throw new Error(
        `exercise.parentCurrentWeight must be supplied when followsExercise is set (exercise: ${exercise.id})`
      );
    }
    const derivedWeight = roundToHalf(exercise.parentCurrentWeight * 0.80);
    return {
      nextWeight: derivedWeight,
      increment: derivedWeight - exercise.currentWeight,
      stallDetected: false,
      deloadSuggested: false,
      phaseTransitionSuggested: false,
      message: `Derived from ${exercise.followsExercise}: ${exercise.parentCurrentWeight}kg × 0.80 = ${derivedWeight}kg`
    };
  }

  // ── Step 2: Find hardest set ──────────────────────────────
  const hardestSet = getHardestSet(lastSession.sets);

  // ── Step 3: Look up increment ─────────────────────────────
  let result;

  switch (exercise.phase) {
    case "novice":
      result = getIncrementNovice(hardestSet);
      break;

    case "advanced_novice":
      result = getIncrementAdvancedNovice(hardestSet);
      break;

    case "intermediate_s1":
      // Only PR sessions drive progression in S1
      if (lastSession.sessionType === "pr") {
        result = getIncrementIntermediateS1(hardestSet);
      } else {
        // Volume sessions: hold weight, no stall increment
        result = { increment: 0, stall: false, deloadSuggested: false };
      }
      break;

    case "intermediate_s2":
      result = getIncrementIntermediateS2(hardestSet, lastSession.sets);
      break;

    default:
      throw new Error(`Unknown phase: ${exercise.phase}`);
  }

  // ── Step 4: Calculate nextWeight ─────────────────────────
  // Do NOT round nextWeight to 0.5 here. The increment table values
  // (0, 0.5, 1.25, 2.5) map to real available plates. Adding 1.25kg to a
  // 0.5-aligned weight yields a 0.25-aligned result (e.g. 60 → 61.25) which
  // is intentional and correct. roundToHalf is reserved for derived weights
  // (paused dips ×0.80, deloads ×0.90) where the result is an arbitrary decimal.
  const increment  = result.increment;
  const nextWeight = +(exercise.currentWeight + increment).toFixed(4);

  // ── Step 5 & 6: Stall accounting ─────────────────────────
  const stallInfo = evaluateStall(
    exercise.stallCount,
    result.stall,
    increment > 0
  );

  // Merge deloadSuggested: table can also suggest it directly
  const deloadSuggested =
    stallInfo.deloadSuggested ||
    result.deloadSuggested;

  // ── Step 7: Build message ─────────────────────────────────
  let message;
  if (stallInfo.phaseTransitionSuggested) {
    message = "PHASE TRANSITION — you may be ready for the next phase";
  } else if (deloadSuggested) {
    message = "DELOAD SUGGESTED — consider reducing weight";
  } else if (increment === 0) {
    message = "HOLD — same weight next session";
  } else if (increment >= 2.5) {
    message = `+${increment}kg — great session`;
  } else {
    message = `+${increment}kg — solid work`;
  }

  return {
    nextWeight,
    increment,
    stallDetected: result.stall,
    deloadSuggested,
    phaseTransitionSuggested: stallInfo.phaseTransitionSuggested,
    message,
    newStallCount: stallInfo.newStallCount  // convenience — caller can persist this
  };
}

// ─────────────────────────────────────────────────────────────
// PR TRACKING
// ─────────────────────────────────────────────────────────────

/**
 * Check whether a new personal record was set in a session.
 * A PR is the highest weight lifted for any reps at RIR 0 or better.
 * If new weight > stored PR weight, it is a PR regardless of reps.
 *
 * @param {{
 *   pr: { weight: number, reps: number, date: string } | null
 * }} exercise
 *
 * @param {{
 *   sets: Array<{reps: number, rir: number}>,
 *   actualWeight: number
 * }} session
 *
 * @returns {{
 *   isPR: boolean,
 *   newPR: { weight: number, reps: number, date: string } | null
 * }}
 */
function checkForPR(exercise, session) {
  // Find the best set at RIR 0 or better (i.e. rir <= 0... but "better" means failed = negative)
  // "RIR 0 or better" = athlete hit the weight; rir >= 0 means no missed reps
  const qualifyingSets = session.sets.filter(s => s.rir >= 0);

  if (qualifyingSets.length === 0) {
    return { isPR: false, newPR: null };
  }

  // Pick best qualifying set: highest reps at session weight
  const bestSet = qualifyingSets.reduce((best, s) =>
    s.reps > best.reps ? s : best
  , qualifyingSets[0]);

  const newWeight = session.actualWeight;
  const existingPR = exercise.pr;

  const isPR = !existingPR || newWeight > existingPR.weight;

  if (!isPR) {
    return { isPR: false, newPR: null };
  }

  const newPR = {
    weight: newWeight,
    reps: bestSet.reps,
    date: new Date().toISOString().split("T")[0]  // YYYY-MM-DD
  };

  return { isPR: true, newPR };
}

// ─────────────────────────────────────────────────────────────
// DATA STORAGE (localStorage)
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "wct_data";

/**
 * Default data schema. Used when no data exists in localStorage.
 * @returns {object}
 */
function getDefaultData() {
  return {
    profile: {
      onboardingComplete: false,
      setupDate: null,
      exportReminderCount: 0
    },
    exercises: {
      dips: {
        name: "Weighted Dips",
        sessionDays: [1, 5],      // Monday = 1, Friday = 5
        sessionType: "heavy",
        phase: null,
        currentWeight: 0,
        startingWeight: 0,
        stallCount: 0,
        lastDeloadDate: null,
        pr: null,
        sessions: []
      },
      paused_dips: {
        name: "Paused Dips",
        sessionDays: [3],          // Wednesday = 3
        sessionType: "assistance",
        followsExercise: "dips",
        currentWeight: 0,
        startingWeight: 0,
        sessions: []
      },
      pullups: {
        name: "Weighted Pull-ups",
        sessionDays: [1, 5],
        sessionType: "heavy",
        phase: null,
        currentWeight: 0,
        startingWeight: 0,
        stallCount: 0,
        lastDeloadDate: null,
        pr: null,
        sessions: []
      },
      chinups: {
        name: "Weighted Chin-ups",
        sessionDays: [3],
        sessionType: "assistance",
        phase: null,
        currentWeight: 0,
        startingWeight: 0,
        stallCount: 0,
        lastDeloadDate: null,
        pr: null,
        sessions: []
      }
    }
  };
}

/**
 * Persist the full data object to localStorage.
 * @param {object} data
 */
function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("[saveData] Failed to write to localStorage:", err);
  }
}

/**
 * Load the full data object from localStorage.
 * @returns {object|null} Parsed data, or null if nothing stored yet.
 */
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("[loadData] Failed to read from localStorage:", err);
    return null;
  }
}

/**
 * Helper: load data, apply a mutation, then save.
 * @param {function} mutator - (data) => void
 */
function _withData(mutator) {
  const data = loadData() || getDefaultData();
  mutator(data);
  saveData(data);
}

/**
 * Update the currentWeight for an exercise.
 * If the exercise is paused_dips, also cascade to recalculate its weight.
 * Note: cascade for paused_dips should be called explicitly via
 *       updateExerciseWeight("paused_dips", newDerivedWeight).
 *
 * @param {string} exerciseId
 * @param {number} newWeight
 */
function updateExerciseWeight(exerciseId, newWeight) {
  _withData(data => {
    if (!data.exercises[exerciseId]) {
      throw new Error(`Unknown exerciseId: ${exerciseId}`);
    }
    data.exercises[exerciseId].currentWeight = newWeight;
  });
}

/**
 * Append a session record to an exercise's session history.
 *
 * @param {string} exerciseId
 * @param {{
 *   date: string,
 *   sets: Array<{reps: number, rir: number}>,
 *   actualWeight: number
 * }} session
 */
function saveSession(exerciseId, session) {
  _withData(data => {
    if (!data.exercises[exerciseId]) {
      throw new Error(`Unknown exerciseId: ${exerciseId}`);
    }
    data.exercises[exerciseId].sessions.push({
      ...session,
      date: session.date || new Date().toISOString().split("T")[0]
    });
  });
}

/**
 * Update the stallCount for an exercise.
 * @param {string} exerciseId
 * @param {number} count
 */
function updateStallCount(exerciseId, count) {
  _withData(data => {
    if (!data.exercises[exerciseId]) {
      throw new Error(`Unknown exerciseId: ${exerciseId}`);
    }
    data.exercises[exerciseId].stallCount = count;
  });
}

/**
 * Update the PR record for an exercise.
 * @param {string} exerciseId
 * @param {{ weight: number, reps: number, date: string }} pr
 */
function updatePR(exerciseId, pr) {
  _withData(data => {
    if (!data.exercises[exerciseId]) {
      throw new Error(`Unknown exerciseId: ${exerciseId}`);
    }
    data.exercises[exerciseId].pr = pr;
  });
}

// ─────────────────────────────────────────────────────────────
// CONSOLE TESTS
// ─────────────────────────────────────────────────────────────

(function runTests() {
  const PASS = "✅ PASS";
  const FAIL = "❌ FAIL";

  function assert(label, actual, expected) {
    const ok =
      typeof expected === "object"
        ? JSON.stringify(actual) === JSON.stringify(expected)
        : actual === expected;

    if (ok) {
      console.log(`${PASS}  ${label}`);
      console.log(`       got: ${JSON.stringify(actual)}`);
    } else {
      console.warn(`${FAIL}  ${label}`);
      console.warn(`       expected: ${JSON.stringify(expected)}`);
      console.warn(`       got:      ${JSON.stringify(actual)}`);
    }
  }

  // ── TEST 1: Phase Detection ─────────────────────────────────
  console.group("TEST 1 — Phase Detection");

  assert("detectPhase(5) → novice",
    detectPhase(5), "novice");

  assert("detectPhase(25) → advanced_novice",
    detectPhase(25), "advanced_novice");

  assert("detectPhase(50) → intermediate_s1",
    detectPhase(50), "intermediate_s1");

  assert("detectPhase(60) → intermediate_s2",
    detectPhase(60), "intermediate_s2");

  // Edge cases
  assert("detectPhase(0) → novice (zero weight, bodyweight only)",
    detectPhase(0), "novice");

  assert("detectPhase(19.99) → novice (just under 20kg boundary)",
    detectPhase(19.99), "novice");

  assert("detectPhase(20) → advanced_novice (exactly 20kg boundary)",
    detectPhase(20), "advanced_novice");

  assert("detectPhase(39.99) → advanced_novice (just under 40kg boundary)",
    detectPhase(39.99), "advanced_novice");

  assert("detectPhase(40) → intermediate_s1 (exactly 40kg boundary)",
    detectPhase(40), "intermediate_s1");

  assert("detectPhase(59.99) → intermediate_s1 (just under 60kg boundary)",
    detectPhase(59.99), "intermediate_s1");

  assert("detectPhase(60) → intermediate_s2 (exactly 60kg boundary)",
    detectPhase(60), "intermediate_s2");

  console.groupEnd();

  // ── TEST 2: Starting Weights ────────────────────────────────
  console.group("TEST 2 — Starting Weights");

  assert("dips 6RM=60 → 60",
    calculateStartingWeight("dips", 60, null), 60);

  assert("paused_dips, dips=60 → 48 (60×0.80=48)",
    calculateStartingWeight("paused_dips", null, 60), 48);

  assert("paused_dips, dips=62.5 → 50 (62.5×0.80=50)",
    calculateStartingWeight("paused_dips", null, 62.5), 50);

  assert("paused_dips, dips=61.25 → 49 (61.25×0.80=49, rounded to nearest 0.5)",
    calculateStartingWeight("paused_dips", null, 61.25), 49);

  assert("pullups 6RM=15 → 15",
    calculateStartingWeight("pullups", 15, null), 15);

  assert("chinups 6RM=10 → 10",
    calculateStartingWeight("chinups", 10, null), 10);

  console.groupEnd();

  // ── TEST 3: Hardest Set Detection ──────────────────────────
  console.group("TEST 3 — Hardest Set Detection");

  assert("lowest RIR wins",
    getHardestSet([
      { reps: 6, rir: 2 },
      { reps: 6, rir: 1 },
      { reps: 5, rir: 0 }
    ]),
    { reps: 5, rir: 0 }
  );

  assert("RIR tie → fewer reps wins",
    getHardestSet([
      { reps: 8, rir: 0 },
      { reps: 6, rir: 0 }
    ]),
    { reps: 6, rir: 0 }
  );

  assert("full tie → last set wins",
    getHardestSet([
      { reps: 6, rir: 0 },
      { reps: 6, rir: 0 }
    ]),
    { reps: 6, rir: 0 }  // last set, but identical values
  );

  assert("single set returns itself",
    getHardestSet([{ reps: 5, rir: 1 }]),
    { reps: 5, rir: 1 }
  );

  console.groupEnd();

  // ── TEST 4: Novice Progression ──────────────────────────────
  console.group("TEST 4 — Novice Progression");

  const novicePullups = {
    id: "pullups",
    phase: "novice",
    currentWeight: 5,
    stallCount: 0,
    followsExercise: null
  };

  const t4result = getNextPrescription(
    novicePullups,
    {
      sets: [
        { reps: 6, rir: 2 },
        { reps: 6, rir: 1 },
        { reps: 6, rir: 1 }
      ],
      sessionType: "heavy"
    }
  );


  // Re: spec Test 4 comment "nextWeight:6.25, increment:1.25 (6 reps RIR 1)":
  // The hardest set of [{6,rir:2},{6,rir:1},{6,rir:1}] is {reps:6, rir:1}.
  // Novice table: 6 reps, RIR 1 → +0.5 (NOT +1.25). nextWeight = 5.5.
  // The spec's own increment table is the source of truth; we follow it.

  console.log("Test 4 result:", t4result);
  assert("T4 increment = 0.5 (novice: 6 reps, RIR 1)",
    t4result.increment, 0.5);
  assert("T4 nextWeight = 5.5",
    t4result.nextWeight, 5.5);

  // ─ Spec test comment says nextWeight:6.25 (AN, 6 reps RIR 1 → +1.25).
  // But the hardest set in [rir:2,rir:1,rir:1] is {rir:1} which is 6 reps RIR 1.
  // AN table: "6 reps, RIR 1-2 → +2.5kg".  5 + 2.5 = 7.5.
  // 6.25 would require {reps:5, rir:1} → AN +1.25.  The spec comment misidentifies
  // the hardest set.  We follow the table.
  const t4an = getNextPrescription(
    { id: "pullups", phase: "advanced_novice", currentWeight: 5, stallCount: 0, followsExercise: null },
    {
      sets: [{ reps: 6, rir: 2 }, { reps: 6, rir: 1 }, { reps: 6, rir: 1 }],
      sessionType: "heavy"
    }
  );
  assert("T4-AN: advanced_novice, hardest={6 reps,RIR 1} → AN table +2.5 → nextWeight=7.5",
    t4an.nextWeight, 7.5);

  // To get nextWeight=6.25 (spec expectation), the hardest set must be {5 reps, RIR 1}:
  const t4an_5reps = getNextPrescription(
    { id: "pullups", phase: "advanced_novice", currentWeight: 5, stallCount: 0, followsExercise: null },
    { sets: [{ reps: 5, rir: 1 }], sessionType: "heavy" }
  );
  assert("T4-AN-5: advanced_novice {5 reps,RIR 1} → +1.25 → nextWeight=6.25 (spec intent)",
    t4an_5reps.nextWeight, 6.25);

  console.groupEnd();

  // ── TEST 5: intermediate_s2 Progression ────────────────────
  console.group("TEST 5 — intermediate_s2 Progression");

  const t5result = getNextPrescription(
    {
      id: "dips",
      phase: "intermediate_s2",
      currentWeight: 60,
      stallCount: 0,
      followsExercise: null
    },
    {
      sets: [
        { reps: 6, rir: 2 },
        { reps: 6, rir: 1 },
        { reps: 6, rir: 1 }
      ],
      sessionType: "heavy"
    }
  );

  // Hardest set = {reps:6, rir:1} → S2: RIR 1 → +1.25kg → nextWeight = 61.25
  // Spec says nextWeight:62.5, increment:2.5 (RIR 1)
  // But per S2 table: "RIR 1 → +1.25kg", not 2.5.
  // RIR 2+ → +2.5. Hardest set has rir:1, so +1.25 is correct per table.
  // We follow the table spec. Our result: +1.25, nextWeight:61.25.

  console.log("Test 5 result:", t5result);
  assert("T5 increment = 1.25 (S2: RIR 1 → +1.25kg)",
    t5result.increment, 1.25);
  assert("T5 nextWeight = 61.25",
    t5result.nextWeight, 61.25);

  // Also verify S2 with RIR 2 → +2.5 (matches spec test expectation)
  const t5b = getNextPrescription(
    { id: "dips", phase: "intermediate_s2", currentWeight: 60, stallCount: 0, followsExercise: null },
    {
      sets: [{ reps: 6, rir: 2 }, { reps: 6, rir: 2 }, { reps: 6, rir: 2 }],
      sessionType: "heavy"
    }
  );
  assert("T5-B: S2 all sets RIR 2 → +2.5, nextWeight=62.5 (matches spec expectation)",
    t5b.nextWeight, 62.5);

  console.groupEnd();

  // ── TEST 6: Paused Dips Derived Weight ─────────────────────
  console.group("TEST 6 — Paused Dips Derived Weight");

  const t6result = getNextPrescription(
    {
      id: "paused_dips",
      phase: null,
      currentWeight: 48,
      stallCount: 0,
      followsExercise: "dips",
      parentCurrentWeight: 61.25   // dips just moved to 61.25kg
    },
    { sets: [], sessionType: "assistance" }
  );

  // 61.25 × 0.80 = 49.0 → roundToHalf(49.0) = 49.0
  console.log("Test 6 result:", t6result);
  assert("T6 nextWeight = 49 (61.25 × 0.80 = 49.0)",
    t6result.nextWeight, 49);

  // Additional: verify with dips at 62.5
  const t6b = getNextPrescription(
    { id: "paused_dips", phase: null, currentWeight: 48, stallCount: 0, followsExercise: "dips", parentCurrentWeight: 62.5 },
    { sets: [], sessionType: "assistance" }
  );
  assert("T6-B nextWeight = 50 (62.5 × 0.80 = 50.0)",
    t6b.nextWeight, 50);

  console.groupEnd();

  // ── TEST 7: Stall Detection ─────────────────────────────────
  console.group("TEST 7 — Stall Detection");

  const t7result = getNextPrescription(
    {
      id: "pullups",
      phase: "novice",
      currentWeight: 5,
      stallCount: 2,           // already at 2 stalls
      followsExercise: null
    },
    {
      sets: [
        { reps: 5, rir: 0 },
        { reps: 5, rir: 0 },
        { reps: 5, rir: 0 }
      ],
      sessionType: "heavy"
    }
  );

  // Hardest set = {reps:5, rir:0} → novice: 5 reps → +0, stall=true
  // stallCount goes 2 → 3 → deloadSuggested=true
  console.log("Test 7 result:", t7result);
  assert("T7 increment = 0",
    t7result.increment, 0);
  assert("T7 stallDetected = true",
    t7result.stallDetected, true);
  assert("T7 deloadSuggested = true (stallCount 2→3, threshold ≥2)",
    t7result.deloadSuggested, true);
  assert("T7 newStallCount = 3",
    t7result.newStallCount, 3);

  // Phase transition at stallCount 5
  const t7c = getNextPrescription(
    { id: "pullups", phase: "novice", currentWeight: 5, stallCount: 5, followsExercise: null },
    { sets: [{ reps: 5, rir: 0 }], sessionType: "heavy" }
  );
  assert("T7-C phaseTransitionSuggested = true (stallCount 5→6, threshold ≥5)",
    t7c.phaseTransitionSuggested, true);

  // stallCount resets after a successful increment
  const t7d = getNextPrescription(
    { id: "pullups", phase: "novice", currentWeight: 5, stallCount: 3, followsExercise: null },
    { sets: [{ reps: 8, rir: 2 }], sessionType: "heavy" }
  );
  assert("T7-D newStallCount resets to 0 after successful increment",
    t7d.newStallCount, 0);

  console.groupEnd();

  // ── TEST 8: PR Check ────────────────────────────────────────
  console.group("TEST 8 — PR Check");

  const t8result = checkForPR(
    { pr: { weight: 60, reps: 6, date: "2024-01-01" } },
    { sets: [{ reps: 6, rir: 0 }], actualWeight: 62.5 }
  );

  console.log("Test 8 result:", t8result);
  assert("T8 isPR = true (62.5 > 60)",
    t8result.isPR, true);
  assert("T8 newPR.weight = 62.5",
    t8result.newPR.weight, 62.5);
  assert("T8 newPR.reps = 6",
    t8result.newPR.reps, 6);

  // No PR when weight is equal or lower
  const t8b = checkForPR(
    { pr: { weight: 62.5, reps: 6, date: "2024-01-01" } },
    { sets: [{ reps: 6, rir: 0 }], actualWeight: 62.5 }
  );
  assert("T8-B isPR = false (same weight, not a new PR)",
    t8b.isPR, false);

  const t8c = checkForPR(
    { pr: { weight: 65, reps: 6, date: "2024-01-01" } },
    { sets: [{ reps: 6, rir: 0 }], actualWeight: 62.5 }
  );
  assert("T8-C isPR = false (lower weight)",
    t8c.isPR, false);

  // First ever PR (no existing PR)
  const t8d = checkForPR(
    { pr: null },
    { sets: [{ reps: 5, rir: 0 }], actualWeight: 30 }
  );
  assert("T8-D isPR = true (first ever PR)",
    t8d.isPR, true);
  assert("T8-D newPR.weight = 30",
    t8d.newPR.weight, 30);

  // No qualifying sets (all missed)
  const t8e = checkForPR(
    { pr: null },
    { sets: [{ reps: 5, rir: -1 }], actualWeight: 30 }
  );
  assert("T8-E isPR = false (all sets missed, no qualifying sets)",
    t8e.isPR, false);

  console.groupEnd();

  // ── BONUS: Deload Weight ────────────────────────────────────
  console.group("BONUS — calculateDeloadWeight");

  assert("60kg deload → 54kg (60×0.9=54)",
    calculateDeloadWeight(60), 54);

  assert("50kg deload → 45kg",
    calculateDeloadWeight(50), 45);

  assert("61.25kg deload → 55kg (61.25×0.9=55.125→55)",
    calculateDeloadWeight(61.25), 55);

  assert("47.5kg deload → 42.5kg (47.5×0.9=42.75→43→round to 43... wait: roundToHalf(42.75)=43)",
    calculateDeloadWeight(47.5), 43);

  console.groupEnd();

  // ── BONUS: intermediate_s1 volume vs PR session ─────────────
  console.group("BONUS — intermediate_s1 session types");

  const s1Volume = getNextPrescription(
    { id: "dips", phase: "intermediate_s1", currentWeight: 50, stallCount: 0, followsExercise: null },
    { sets: [{ reps: 6, rir: 0 }, { reps: 6, rir: 0 }], sessionType: "heavy" }
  );
  assert("S1 volume session → no increment (hold)",
    s1Volume.increment, 0);

  const s1PR = getNextPrescription(
    { id: "dips", phase: "intermediate_s1", currentWeight: 50, stallCount: 0, followsExercise: null },
    { sets: [{ reps: 6, rir: 0 }], sessionType: "pr" }
  );
  assert("S1 PR session, 6 reps → +2.5kg",
    s1PR.increment, 2.5);

  const s1PR3 = getNextPrescription(
    { id: "dips", phase: "intermediate_s1", currentWeight: 50, stallCount: 0, followsExercise: null },
    { sets: [{ reps: 3, rir: 0 }], sessionType: "pr" }
  );
  assert("S1 PR session, 3 reps → +0.5kg",
    s1PR3.increment, 0.5);

  console.groupEnd();

  // ── BONUS: intermediate_s2 missed reps ──────────────────────
  console.group("BONUS — intermediate_s2 missed reps");

  // Missed 1 rep in 1 set (rir = -1, only 1 set with negative RIR)
  const s2miss1 = getNextPrescription(
    { id: "dips", phase: "intermediate_s2", currentWeight: 60, stallCount: 0, followsExercise: null },
    { sets: [{ reps: 5, rir: 0 }, { reps: 5, rir: 0 }, { reps: 5, rir: -1 }], sessionType: "heavy" }
  );
  assert("S2: missed 1 rep in 1 set → +0.5kg",
    s2miss1.increment, 0.5);

  // Missed 1 rep in 2+ sets
  const s2miss2 = getNextPrescription(
    { id: "dips", phase: "intermediate_s2", currentWeight: 60, stallCount: 0, followsExercise: null },
    { sets: [{ reps: 5, rir: 0 }, { reps: 5, rir: -1 }, { reps: 5, rir: -1 }], sessionType: "heavy" }
  );
  assert("S2: missed 1 rep in 2+ sets → 0 increment, stall",
    s2miss2.increment, 0);
  assert("S2: missed 1 rep in 2+ sets → stallDetected",
    s2miss2.stallDetected, true);

  console.groupEnd();

  // ───────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════");
  console.log("         ALL TESTS COMPLETE");
  console.log("════════════════════════════════════════\n");
})();
