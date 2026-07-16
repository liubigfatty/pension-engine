#!/usr/bin/env node
/**
 * Province Config Parity Gate
 * ============================
 * Hard CI / pre-deploy gate for the web calculator (docs/).
 *
 * Asserts VALUE parity of every province config across the TWO web load paths:
 *   - docs/provinces/        loaded by index.html  (fetch `./provinces/${code}.json`)
 *   - docs/js/provinces/     loaded by flow.html / contribution.html / pension.html (via app.js)
 *
 * Why this matters: the two directories were found to hold DIVERGENT datasets
 * (different base_rates.prov / interest_rates / monthly_payment_months / delay_retirement),
 * so the same person gets materially different pension numbers depending on which
 * page they use. Tracking issue: B1 (config unification). Finding: F-02.
 *
 * IMPORTANT — this is a REGRESSION GATE, not a fix.
 *   It does NOT reconcile the underlying data. It only prevents the two directories
 *   from silently drifting again after B1 unifies them. The data divergence itself
 *   must be reconciled by the data/engine owner (B1).
 *
 * Checks performed:
 *   1. VALUE parity: for all 31 pinyin provinces on a FIXED input vector, the computed
 *      monthly pension must match across both load paths within `threshold` %.
 *      (Value parity, not just key/schema parity — a key that exists in both but with
 *       different numbers would still produce wrong answers.)
 *   2. DEAD-FILE check: the orphan incompatible `吉林省.json` must be ABSENT in both
 *      directories. It is an incompatible 18-key schema the engine computes as ¥0, and
 *      is never referenced by the live UI (which uses pinyin `jilin`). Its presence is a
 *      latent trap.
 *
 * Exit codes (HARD gate — non-zero blocks the build):
 *   0 = parity OK (all provinces within threshold, no orphan dead files)
 *   1 = drift detected or dead file present (BLOCKS build until B1 reconciles data)
 *
 * Usage:
 *   node scripts/province-parity-check.js [--repo <path>] [--threshold <percent>]
 *   default --repo = process.cwd();  default --threshold = 0.5
 *
 * Run this against the AUTHORITATIVE repo once team-lead designates it. Running it on a
 * stale checkout can give a false pass (if that checkout happens to have drifted into
 * agreement) — keep the gate wired to the canonical branch.
 */

'use strict';
const fs = require('fs');
const path = require('path');

// ---- arg parsing ---------------------------------------------------------
const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}
const REPO = path.resolve(getArg('--repo', process.cwd()));
const THRESHOLD = parseFloat(getArg('--threshold', '0.5')); // percent, e.g. 0.5

const ENGINE = path.join(REPO, 'docs', 'js', 'pension-engine-browser.js');
const DIR_A = path.join(REPO, 'docs', 'provinces');        // index.html path
const DIR_B = path.join(REPO, 'docs', 'js', 'provinces');  // flow/contribution/app.js path

const failures = [];
function fail(msg) { failures.push(msg); }

// ---- load engine ----------------------------------------------------------
if (!fs.existsSync(ENGINE)) {
  fail('ENGINE_MISSING: ' + ENGINE);
}
let PEngine = null;
try { PEngine = require(ENGINE); }
catch (e) { fail('ENGINE_LOAD_ERROR: ' + e.message); }

// ---- dead-file check: orphan 吉林省.json must be absent -------------------
// UI maps 吉林省 -> code 'jilin' (pinyin); the Chinese .json is never referenced.
for (const dir of [DIR_A, DIR_B]) {
  const orphan = path.join(dir, '吉林省.json');
  if (fs.existsSync(orphan)) {
    fail('DEAD_FILE_PRESENT: ' + path.relative(REPO, orphan) +
      ' (orphan incompatible 18-key schema; engine computes ¥0; unreferenced by UI)');
  }
}

// ---- enumerate pinyin province codes present in BOTH dirs ------------------
function listCodes(dir) {
  try {
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace(/\.json$/, ''));
  } catch (e) { return []; }
}
const setA = new Set(listCodes(DIR_A));
const setB = new Set(listCodes(DIR_B));

// fixed input vector — stable across runs so the gate is deterministic.
// (Male, born 1965-03, started work 1990-01, avg index 1.0, province default.)
const INPUT = {
  birthYear: 1965, birthMonth: 3,
  workYear: 1990, workMonth: 1,
  genderType: 'male', avgIndex: 1.0, cityType: 'prov'
};

function isEngineCfg(file) {
  try {
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    // engine-compatible configs expose base_rates.prov AND modules
    return !!(j && j.base_rates && j.base_rates.prov && j.modules);
  } catch (e) { return false; }
}

// ---- value-parity scan ----------------------------------------------------
const codes = Array.from(new Set([...setA, ...setB])).filter(c => c !== '吉林省');
let checked = 0;
let deviating = 0;

if (PEngine) {
  for (const code of codes) {
    const fa = path.join(DIR_A, code + '.json');
    const fb = path.join(DIR_B, code + '.json');

    if (!setA.has(code) || !setB.has(code)) {
      fail('MISSING_IN_ONE_DIR: ' + code + ' (present in one province dir but not the other)');
      continue;
    }
    if (!isEngineCfg(fa) || !isEngineCfg(fb)) {
      fail('INCOMPATIBLE_SCHEMA: ' + code + ' (not engine-compatible in one/both dirs)');
      continue;
    }

    let ta, tb;
    try {
      ta = PEngine.calculate(JSON.parse(fs.readFileSync(fa, 'utf8')), INPUT).legal.total;
      tb = PEngine.calculate(JSON.parse(fs.readFileSync(fb, 'utf8')), INPUT).legal.total;
    } catch (e) {
      fail('CALC_ERROR: ' + code + ' — ' + e.message);
      continue;
    }

    checked++;
    if (ta == null || tb == null) {
      fail('NULL_RESULT: ' + code);
      continue;
    }

    const pct = ta !== 0 ? (tb / ta - 1) * 100 : null;
    if (pct === null || Math.abs(pct) > THRESHOLD) {
      deviating++;
      fail('VALUE_DRIFT: ' + code +
        ' A=' + ta + ' B=' + tb +
        ' pct=' + (pct === null ? 'n/a' : pct.toFixed(2) + '%') +
        ' (threshold ' + THRESHOLD + '%)');
    }
  }
}

// ---- report ---------------------------------------------------------------
console.log('=== Province Config Parity Gate ===');
console.log('repo       : ' + REPO);
console.log('threshold  : ' + THRESHOLD + '%');
console.log('provinces  : ' + checked + ' checked, ' + deviating + ' deviating');
console.log('failures   : ' + failures.length);

if (failures.length === 0) {
  console.log('RESULT: PASS — all provinces value-parity across both load paths; no orphan dead files.');
  process.exit(0);
} else {
  console.log('RESULT: FAIL (' + failures.length + ' issue(s)) — BLOCKS build until B1 reconciles datasets.');
  for (const f of failures) console.log('  - ' + f);
  console.log('NOTE: This is a REGRESSION GATE, not a fix. The underlying divergence');
  console.log('(divergent base_rates.prov across docs/provinces/ vs docs/js/provinces/) must be');
  console.log('reconciled by unifying the dataset(s) (B1). Re-run on the AUTHORITATIVE repo.');
  process.exit(1);
}
